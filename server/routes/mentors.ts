import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db';
import { requireAuth } from './auth';
import { computeLocalMentorMatch, computeLocalLearnerMatch, matchMentorWithLearner, matchLearnerWithMentor } from '../ai';
import { broadcastToUser } from '../events';

export const mentorsRouter = Router();

// DISCOVER MENTORS (Query database mentors)
mentorsRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { skill, minExp, teachingMode } = req.query;

    // Get current learner's profile for personalized AI matching
    const learnerRow = db.prepare('SELECT * FROM learner_profiles WHERE user_id = ?').get(user.id) as any;
    const learnerGoal = learnerRow ? learnerRow.primary_goal : '';
    const learnerCurrentLevel = learnerRow ? learnerRow.current_level : 'Beginner';
    const learnerTargetLevel = learnerRow ? learnerRow.target_level : 'Intermediate';
    const skillsToLearn = learnerRow ? JSON.parse(learnerRow.skills_to_learn || '[]') : [];

    // Query mentors from database, excluding current user
    const mentorsQuery = `
      SELECT
        m.user_id,
        m.skills_taught,
        m.years_of_experience,
        m.hourly_rate_credits,
        m.teaching_style,
        m.bio as mentor_bio,
        m.qualifications,
        m.is_verified,
        m.learners_helped,
        m.rating,
        m.total_reviews,
        m.availability_hours,
        u.full_name,
        u.avatar_url,
        u.language,
        u.location,
        u.learning_mode
      FROM mentor_profiles m
      JOIN users u ON m.user_id = u.id
      WHERE m.user_id != ?
    `;

    const mentorRows = db.prepare(mentorsQuery).all(user.id) as any[];

    // Parse and filter
    let mentors = mentorRows.map((m) => {
      const skillsTaught = JSON.parse(m.skills_taught || '[]');
      return {
        ...m,
        skills_taught: skillsTaught,
      };
    });

    if (skill && typeof skill === 'string' && skill.trim() !== '') {
      const s = skill.toLowerCase();
      mentors = mentors.filter(m =>
        m.skills_taught.some((st: string) => st.toLowerCase().includes(s))
      );
    }

    if (minExp) {
      const expNum = Number(minExp);
      if (!isNaN(expNum)) {
        mentors = mentors.filter(m => m.years_of_experience >= expNum);
      }
    }

    // Compute match scoring for mentors with smart semantic matching
    const enrichedMentors = mentors.map((m) => {
      const matchResult = computeLocalMentorMatch(
        {
          name: user.full_name,
          goal: learnerGoal,
          currentLevel: learnerCurrentLevel,
          targetLevel: learnerTargetLevel,
          skillsToLearn: skillsToLearn,
          language: user.language || 'English',
          preferredMode: user.learning_mode || 'Online'
        },
        {
          name: m.full_name,
          skillsTaught: m.skills_taught,
          yearsExp: m.years_of_experience,
          teachingStyle: m.teaching_style,
          availability: m.availability_hours,
          bio: m.mentor_bio || '',
          rating: m.rating
        }
      );

      return {
        ...m,
        matchPercentage: matchResult.matchPercentage || 85,
        matchRationale: matchResult.rationale || 'High alignment with your skill trajectory.'
      };
    });

    // Sort by match score descending
    enrichedMentors.sort((a, b) => b.matchPercentage - a.matchPercentage);

    res.json({
      mentors: enrichedMentors,
      totalCount: enrichedMentors.length
    });
  } catch (error: any) {
    console.error('Error fetching mentors:', error);
    res.status(500).json({ error: 'Failed to fetch mentors from database.' });
  }
});

// GET SINGLE MENTOR PROFILE
mentorsRouter.get('/:id', requireAuth, (req: Request, res: Response) => {
  try {
    const mentorId = req.params.id;
    const mentor = db.prepare(`
      SELECT
        m.*,
        u.full_name,
        u.avatar_url,
        u.language,
        u.location,
        u.learning_mode,
        u.bio as user_bio
      FROM mentor_profiles m
      JOIN users u ON m.user_id = u.id
      WHERE m.user_id = ?
    `).get(mentorId) as any;

    if (!mentor) {
      res.status(404).json({ error: 'Mentor not found.' });
      return;
    }

    res.json({
      mentor: {
        ...mentor,
        skills_taught: JSON.parse(mentor.skills_taught || '[]')
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch mentor profile.' });
  }
});

// SEND MENTOR REQUEST
mentorsRouter.post('/request', requireAuth, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { mentorId, skillName, goalNotes } = req.body;

    if (!mentorId || !skillName) {
      res.status(400).json({ error: 'Mentor ID and skill name are required.' });
      return;
    }

    if (user.id === mentorId) {
      res.status(400).json({ error: 'You cannot request mentorship from yourself.' });
      return;
    }

    // Check if an active request already exists
    const existing = db.prepare(`
      SELECT id, status FROM mentor_requests
      WHERE learner_id = ? AND mentor_id = ? AND skill_name = ? AND status IN ('requested', 'accepted')
    `).get(user.id, mentorId, skillName) as any;

    if (existing) {
      res.status(409).json({ error: `An active request for ${skillName} already exists with status: ${existing.status}.` });
      return;
    }

    const requestId = 'req_' + crypto.randomUUID().slice(0, 8);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO mentor_requests (id, learner_id, mentor_id, skill_name, goal_notes, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'requested', ?, ?)
    `).run(requestId, user.id, mentorId, skillName, goalNotes || '', now, now);

    // Notify mentor in real time
    const notifId = 'notif_' + crypto.randomUUID().slice(0, 8);
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, is_read, link, created_at)
      VALUES (?, ?, ?, ?, 'request', 0, '/mentors/requests', ?)
    `).run(
      notifId,
      mentorId,
      `New Mentorship Request from ${user.full_name}`,
      `${user.full_name} has requested 1-on-1 mentorship for ${skillName}.`,
      now
    );

    // Broadcast SSE to mentor
    broadcastToUser(mentorId, 'MENTOR_REQUEST_RECEIVED', {
      requestId,
      learnerName: user.full_name,
      skillName,
      goalNotes
    });

    res.status(201).json({
      message: 'Mentorship request submitted successfully.',
      requestId
    });
  } catch (error: any) {
    console.error('Error submitting mentor request:', error);
    res.status(500).json({ error: 'Failed to submit request.' });
  }
});

// GET MENTOR REQUESTS (Learner or Mentor)
mentorsRouter.get('/requests/list', requireAuth, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    // Requests where current user is learner
    const asLearner = db.prepare(`
      SELECT r.*, u.full_name as mentor_name, u.avatar_url as mentor_avatar
      FROM mentor_requests r
      JOIN users u ON r.mentor_id = u.id
      WHERE r.learner_id = ?
      ORDER BY r.created_at DESC
    `).all(user.id);

    // Requests where current user is mentor
    const asMentor = db.prepare(`
      SELECT r.*, u.full_name as learner_name, u.avatar_url as learner_avatar
      FROM mentor_requests r
      JOIN users u ON r.learner_id = u.id
      WHERE r.mentor_id = ?
      ORDER BY r.created_at DESC
    `).all(user.id);

    res.json({
      sentRequests: asLearner,
      incomingRequests: asMentor
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch mentor requests.' });
  }
});

// RESPOND TO MENTOR REQUEST (Accept or Reject)
mentorsRouter.post('/requests/:id/respond', requireAuth, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const requestId = req.params.id;
    const { action } = req.body; // 'accepted' | 'rejected'

    if (!['accepted', 'rejected'].includes(action)) {
      res.status(400).json({ error: 'Action must be accepted or rejected.' });
      return;
    }

    const request = db.prepare('SELECT * FROM mentor_requests WHERE id = ?').get(requestId) as any;
    if (!request) {
      res.status(404).json({ error: 'Request not found.' });
      return;
    }

    if (request.mentor_id !== user.id) {
      res.status(403).json({ error: 'You are not authorized to respond to this request.' });
      return;
    }

    const now = new Date().toISOString();
    db.prepare('UPDATE mentor_requests SET status = ?, updated_at = ? WHERE id = ?').run(action, now, requestId);

    // If accepted, ensure a conversation exists between mentor and learner
    if (action === 'accepted') {
      const existingConv = db.prepare(`
        SELECT id FROM conversations
        WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
      `).get(request.mentor_id, request.learner_id, request.learner_id, request.mentor_id) as any;

      let convId = existingConv ? existingConv.id : null;
      if (!convId) {
        convId = 'conv_' + crypto.randomUUID().slice(0, 8);
        db.prepare(`
          INSERT INTO conversations (id, user1_id, user2_id, last_message_at, created_at)
          VALUES (?, ?, ?, ?, ?)
        `).run(convId, request.mentor_id, request.learner_id, now, now);
      }

      // Automatically add initial welcome message
      const msgId = 'msg_' + crypto.randomUUID().slice(0, 8);
      db.prepare(`
        INSERT INTO messages (id, conversation_id, sender_id, receiver_id, content, is_read, created_at)
        VALUES (?, ?, ?, ?, ?, 0, ?)
      `).run(
        msgId,
        convId,
        user.id,
        request.learner_id,
        `Hello! I have accepted your mentorship request for ${request.skill_name}. Let's schedule our first session and build your learning plan!`,
        now
      );

      // Create initial active learning plan
      const planId = 'plan_' + crypto.randomUUID().slice(0, 8);
      const defaultModules = [
        { week: 1, title: 'Orientation & Core Principles', hours: 4, status: 'in_progress', task: 'Initial setup & goal mapping' },
        { week: 2, title: 'Deep Dive & Practical Exercises', hours: 6, status: 'pending', task: 'Implement baseline project' },
        { week: 3, title: 'Code/Project Review & Optimization', hours: 6, status: 'pending', task: 'Refactoring & best practices' },
        { week: 4, title: 'Capstone Assessment & SkillProof', hours: 8, status: 'pending', task: 'Submit for assessor verification' }
      ];

      db.prepare(`
        INSERT INTO learning_plans (id, learner_id, mentor_id, skill_name, goal, status, modules_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)
      `).run(
        planId,
        request.learner_id,
        request.mentor_id,
        request.skill_name,
        request.goal_notes || `Master ${request.skill_name}`,
        JSON.stringify(defaultModules),
        now,
        now
      );
    }

    // Send notification to learner
    const notifId = 'notif_' + crypto.randomUUID().slice(0, 8);
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, is_read, link, created_at)
      VALUES (?, ?, ?, ?, 'request', 0, '/learning', ?)
    `).run(
      notifId,
      request.learner_id,
      `Mentorship Request ${action === 'accepted' ? 'Accepted!' : 'Declined'}`,
      `${user.full_name} has ${action} your mentorship request for ${request.skill_name}.`,
      now
    );

    // Broadcast SSE to learner
    broadcastToUser(request.learner_id, 'MENTOR_REQUEST_UPDATED', {
      requestId,
      status: action,
      mentorName: user.full_name,
      skillName: request.skill_name
    });

    res.json({ message: `Request ${action} successfully.` });
  } catch (error: any) {
    console.error('Error responding to mentor request:', error);
    res.status(500).json({ error: 'Failed to process response.' });
  }
});

// DISCOVER LEARNERS WHO NEED WHAT THIS MENTOR TEACHES (For Mentors)
mentorsRouter.get('/learners/discover', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { skill, level } = req.query;

    // Get current user's mentor profile
    const mentorRow = db.prepare('SELECT * FROM mentor_profiles WHERE user_id = ?').get(user.id) as any;
    const skillsTaught: string[] = mentorRow ? JSON.parse(mentorRow.skills_taught || '[]') : [];
    const yearsExp = mentorRow ? (mentorRow.years_of_experience || 3) : 3;
    const teachingStyle = mentorRow ? (mentorRow.teaching_style || 'Practical Coaching') : 'Practical Coaching';
    const availability = mentorRow ? (mentorRow.availability_hours || 'Flexible') : 'Flexible';

    // Query registered learners from database excluding current user
    const learnersQuery = `
      SELECT
        lp.user_id as learner_id,
        lp.primary_goal,
        lp.target_level,
        lp.current_level,
        lp.preferred_mode,
        lp.hours_per_week,
        lp.skills_to_learn,
        u.full_name,
        u.avatar_url,
        u.language,
        u.location,
        u.learning_mode,
        u.created_at
      FROM learner_profiles lp
      JOIN users u ON lp.user_id = u.id
      WHERE lp.user_id != ?
    `;

    const learnerRows = db.prepare(learnersQuery).all(user.id) as any[];

    // Parse skills to learn
    let learners = learnerRows.map((l) => {
      const skillsToLearn = JSON.parse(l.skills_to_learn || '[]');
      return {
        ...l,
        skills_to_learn: skillsToLearn,
      };
    });

    if (skill && typeof skill === 'string' && skill.trim() !== '') {
      const s = skill.toLowerCase();
      learners = learners.filter(l =>
        l.skills_to_learn.some((st: string) => st.toLowerCase().includes(s)) ||
        (l.primary_goal && l.primary_goal.toLowerCase().includes(s))
      );
    }

    if (level && typeof level === 'string' && level.trim() !== '') {
      learners = learners.filter(l => l.current_level.toLowerCase() === level.toLowerCase());
    }

    // Run smart match scoring for each real registered learner
    const enrichedLearners = learners.map((l) => {
      const matchResult = computeLocalLearnerMatch(
        {
          name: user.full_name,
          skillsTaught,
          yearsExp,
          teachingStyle,
          availability
        },
        {
          name: l.full_name,
          goal: l.primary_goal,
          currentLevel: l.current_level,
          targetLevel: l.target_level,
          skillsToLearn: l.skills_to_learn,
          language: l.language || 'English',
          preferredMode: l.preferred_mode || 'Online'
        }
      );

      return {
        ...l,
        matchPercentage: matchResult.matchPercentage || 85,
        matchRationale: matchResult.rationale || 'Skills align with your mentoring capabilities.'
      };
    });

    // Sort by match score descending
    enrichedLearners.sort((a, b) => b.matchPercentage - a.matchPercentage);

    res.json({
      learners: enrichedLearners,
      totalCount: enrichedLearners.length,
      mentorSkillsTaught: skillsTaught
    });
  } catch (error: any) {
    console.error('Error fetching learners for mentor:', error);
    res.status(500).json({ error: 'Failed to fetch matching learners from database.' });
  }
});

// MENTOR OFFERS MENTORSHIP TO A LEARNER
mentorsRouter.post('/offer-mentoring', requireAuth, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { learnerId, skillName, offerNotes } = req.body;

    if (!learnerId || !skillName) {
      res.status(400).json({ error: 'Learner ID and skill name are required.' });
      return;
    }

    if (user.id === learnerId) {
      res.status(400).json({ error: 'You cannot offer mentorship to yourself.' });
      return;
    }

    const requestId = 'req_' + crypto.randomUUID().slice(0, 8);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO mentor_requests (id, learner_id, mentor_id, skill_name, goal_notes, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'requested', ?, ?)
    `).run(
      requestId,
      learnerId,
      user.id,
      skillName,
      offerNotes ? `[Mentor Invitation]: ${offerNotes}` : `[Mentor Invitation]: ${user.full_name} offered to mentor you in ${skillName}`,
      now,
      now
    );

    // Send real-time notification to the learner
    const notifId = 'notif_' + crypto.randomUUID().slice(0, 8);
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, is_read, link, created_at)
      VALUES (?, ?, ?, ?, 'request', 0, '/mentors/requests', ?)
    `).run(
      notifId,
      learnerId,
      `Mentorship Offer from ${user.full_name}`,
      `${user.full_name} saw that you want to master ${skillName} and offered to mentor you!`,
      now
    );

    // Real-time SSE broadcast to learner
    broadcastToUser(learnerId, 'MENTOR_OFFER_RECEIVED', {
      requestId,
      mentorName: user.full_name,
      skillName,
      offerNotes
    });

    res.status(201).json({
      message: `Mentorship invitation sent to learner successfully!`,
      requestId
    });
  } catch (error: any) {
    console.error('Error offering mentorship:', error);
    res.status(500).json({ error: 'Failed to send mentorship offer.' });
  }
});

