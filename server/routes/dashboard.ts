import { Router, Request, Response } from 'express';
import { db } from '../db';
import { requireAuth } from './auth';
import { computeLocalLearnerMatch, computeLocalMentorMatch, matchLearnerWithMentor, matchMentorWithLearner } from '../ai';

export const dashboardRouter = Router();

// GET REAL USER DASHBOARD DATA (Mode-Specific)
dashboardRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const isMentorMode = user.active_mode === 'mentor';

    const creditAccount = (db.prepare('SELECT balance, total_earned, total_spent FROM time_credit_accounts WHERE user_id = ?').get(user.id) as any) || { balance: 0, total_earned: 0, total_spent: 0 };
    const notifications = (db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 6').all(user.id)) || [];
    const recentActivities = (db.prepare('SELECT * FROM audit_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 5').all(user.id)) || [];

    if (isMentorMode) {
      // ===== MENTOR DASHBOARD DATA =====
      const mentorProfile = db.prepare('SELECT * FROM mentor_profiles WHERE user_id = ?').get(user.id) as any;
      const skillsTaught: string[] = mentorProfile ? JSON.parse(mentorProfile.skills_taught || '[]') : [];
      const yearsExp = mentorProfile ? (mentorProfile.years_of_experience || 3) : 3;
      const teachingStyle = mentorProfile ? (mentorProfile.teaching_style || 'Practical Coaching') : 'Practical Coaching';
      const availability = mentorProfile ? (mentorProfile.availability_hours || 'Flexible') : 'Flexible';
      const rating = mentorProfile ? (mentorProfile.rating || 5.0) : 5.0;
      const learnersHelped = mentorProfile ? (mentorProfile.learners_helped || 0) : 0;

      // Real incoming requests from learners
      const incomingRequests = db.prepare(`
        SELECT r.*, u.full_name as learner_name, u.avatar_url as learner_avatar, u.language, u.learning_mode
        FROM mentor_requests r
        JOIN users u ON r.learner_id = u.id
        WHERE r.mentor_id = ? AND r.status = 'requested'
        ORDER BY r.created_at DESC
      `).all(user.id) as any[];

      // Active mentees (accepted relationships)
      const activeMentees = db.prepare(`
        SELECT r.*, u.full_name as learner_name, u.email as learner_email, u.avatar_url as learner_avatar
        FROM mentor_requests r
        JOIN users u ON r.learner_id = u.id
        WHERE r.mentor_id = ? AND r.status = 'accepted'
        ORDER BY r.updated_at DESC
      `).all(user.id) as any[];

      // Upcoming teaching sessions
      const upcomingSessions = db.prepare(`
        SELECT s.*, l.full_name as learner_name
        FROM learning_sessions s
        JOIN users l ON s.learner_id = l.id
        WHERE s.mentor_id = ? AND s.status = 'scheduled'
        ORDER BY s.scheduled_at ASC LIMIT 4
      `).all(user.id) as any[];

      const completedSessions = db.prepare(`
        SELECT COUNT(*) as count FROM learning_sessions WHERE mentor_id = ? AND status = 'completed'
      `).get(user.id) as { count: number } | undefined;

      // AI Learner Matching: Query real registered learners who need this mentor's skills!
      const learnerRows = db.prepare(`
        SELECT
          lp.user_id as learner_id,
          lp.primary_goal,
          lp.target_level,
          lp.current_level,
          lp.preferred_mode,
          lp.skills_to_learn,
          u.full_name,
          u.avatar_url,
          u.language,
          u.learning_mode,
          u.created_at
        FROM learner_profiles lp
        JOIN users u ON lp.user_id = u.id
        WHERE lp.user_id != ?
      `).all(user.id) as any[];

      const parsedLearners = learnerRows.map(l => ({
        ...l,
        skills_to_learn: JSON.parse(l.skills_to_learn || '[]')
      }));

      // Filter to learners who have interest in mentor's skills or general
      const candidateLearners = parsedLearners.filter(l =>
        skillsTaught.length === 0 ||
        l.skills_to_learn.some((s: string) => skillsTaught.some(st => st.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(st.toLowerCase()))) ||
        (l.primary_goal && skillsTaught.some(st => l.primary_goal.toLowerCase().includes(st.toLowerCase())))
      );

      // Run smart match scoring on the candidate learners
      const matchingLearners = candidateLearners.slice(0, 6).map((l) => {
        const matchRes = computeLocalLearnerMatch(
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
          matchPercentage: matchRes.matchPercentage || 85,
          matchRationale: matchRes.rationale || 'Needs mentoring in your primary subject area.'
        };
      });

      matchingLearners.sort((a, b) => b.matchPercentage - a.matchPercentage);

      res.json({
        userName: user.full_name || 'Mentor',
        userRole: user.role || 'mentor',
        activeMode: 'mentor',
        mentorProfile: {
          skillsTaught,
          yearsExp,
          teachingStyle,
          availability,
          rating,
          learnersHelped
        },
        metrics: {
          timeCredits: Number(creditAccount?.balance ?? 0),
          totalEarnedCredits: Number(creditAccount?.total_earned ?? 0),
          activeMenteesCount: activeMentees.length,
          pendingRequestsCount: incomingRequests.length,
          completedSessionsCount: Number(completedSessions?.count ?? 0),
          rating: Number(rating),
          learnersHelped: Number(learnersHelped),
          skillsTaughtCount: skillsTaught.length
        },
        matchingLearners,
        incomingRequests,
        activeMentees,
        upcomingSessions,
        notifications,
        recentActivities
      });

    } else {
      // ===== LEARNER DASHBOARD DATA =====
      const learnerProfile = db.prepare('SELECT * FROM learner_profiles WHERE user_id = ?').get(user.id) as any;
      const learnerGoal = learnerProfile?.primary_goal || '';
      const currentLevel = learnerProfile?.current_level || 'Beginner';
      const targetLevel = learnerProfile?.target_level || 'Intermediate';
      const skillsToLearn: string[] = learnerProfile ? JSON.parse(learnerProfile.skills_to_learn || '[]') : [];

      const activePlans = (db.prepare(`SELECT COUNT(*) as count FROM learning_plans WHERE (learner_id = ? OR mentor_id = ?) AND status = 'active'`).get(user.id, user.id) as { count: number } | undefined);

      const upcomingSessions = db.prepare(`
        SELECT s.*, m.full_name as mentor_name
        FROM learning_sessions s
        JOIN users m ON s.mentor_id = m.id
        WHERE s.learner_id = ? AND s.status = 'scheduled'
        ORDER BY s.scheduled_at ASC LIMIT 4
      `).all(user.id) as any[];

      const proofsCount = (db.prepare('SELECT COUNT(*) as count FROM skillproofs WHERE user_id = ?').get(user.id) as { count: number } | undefined);
      const certsCount = (db.prepare('SELECT COUNT(*) as count FROM certificates WHERE user_id = ?').get(user.id) as { count: number } | undefined);
      const evidenceCount = (db.prepare('SELECT COUNT(*) as count FROM evidence WHERE user_id = ?').get(user.id) as { count: number } | undefined);
      const verifiedEvidenceCount = (db.prepare(`SELECT COUNT(*) as count FROM evidence WHERE user_id = ? AND assessor_status = 'verified'`).get(user.id) as { count: number } | undefined);

      const competencies = (db.prepare('SELECT * FROM competencies WHERE user_id = ? ORDER BY created_at DESC').all(user.id) as any[]) || [];

      const skillGaps = competencies.filter(c => c && c.status !== 'assessor_verified').map(c => ({
        skill_name: c.skill_name || 'General Skill',
        current_level: c.current_level || 'Beginner',
        target_level: c.target_level || 'Intermediate',
        status: c.status || 'unverified',
        gap_notes: c.gap_notes || 'Requires practical evidence and assessor verification.'
      }));

      // AI Mentor Matching: Find real registered mentors from database
      const mentorRows = db.prepare(`
        SELECT
          m.user_id,
          m.skills_taught,
          m.years_of_experience,
          m.hourly_rate_credits,
          m.teaching_style,
          m.bio as mentor_bio,
          m.is_verified,
          m.learners_helped,
          m.rating,
          m.availability_hours,
          u.full_name,
          u.avatar_url,
          u.language,
          u.learning_mode
        FROM mentor_profiles m
        JOIN users u ON m.user_id = u.id
        WHERE m.user_id != ?
      `).all(user.id) as any[];

      const parsedMentors = mentorRows.map(m => ({
        ...m,
        skills_taught: JSON.parse(m.skills_taught || '[]')
      }));

      // Candidate mentors matching skills to learn
      const candidateMentors = parsedMentors.filter(m =>
        skillsToLearn.length === 0 ||
        m.skills_taught.some((st: string) => skillsToLearn.some(s => s.toLowerCase().includes(st.toLowerCase()) || st.toLowerCase().includes(s.toLowerCase())))
      );

      const recommendedMentors = candidateMentors.slice(0, 4).map((m) => {
        const matchRes = computeLocalMentorMatch(
          {
            name: user.full_name,
            goal: learnerGoal,
            currentLevel,
            targetLevel,
            skillsToLearn,
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
          matchPercentage: matchRes.matchPercentage || 88,
          matchRationale: matchRes.rationale || 'Skill alignment with your target goal.'
        };
      });

      recommendedMentors.sort((a, b) => b.matchPercentage - a.matchPercentage);

      res.json({
        userName: user.full_name || 'Learner',
        userRole: user.role || 'learner',
        activeMode: 'learner',
        primaryGoal: learnerGoal,
        metrics: {
          timeCredits: Number(creditAccount?.balance ?? 0),
          activePlans: Number(activePlans?.count ?? 0),
          skillProofs: Number(proofsCount?.count ?? 0),
          certificates: Number(certsCount?.count ?? 0),
          evidenceSubmitted: Number(evidenceCount?.count ?? 0),
          evidenceVerified: Number(verifiedEvidenceCount?.count ?? 0),
          skillGapsCount: Array.isArray(skillGaps) ? skillGaps.length : 0
        },
        recommendedMentors,
        upcomingSessions,
        skillGaps,
        competencies,
        notifications,
        recentActivities
      });
    }
  } catch (error: any) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to load user dashboard.' });
  }
});

// NOTIFICATIONS
dashboardRouter.get('/notifications', requireAuth, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const notifs = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC').all(user.id);
    res.json({ notifications: notifs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
});

dashboardRouter.post('/notifications/read-all', requireAuth, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(user.id);
    res.json({ message: 'Notifications marked as read.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notifications.' });
  }
});
