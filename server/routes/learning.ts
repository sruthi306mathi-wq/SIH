import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db';
import { requireAuth } from './auth';
import { generateLearningPlan } from '../ai';
import { broadcastToUser } from '../events';

export const learningRouter = Router();

// GET LEARNER'S LEARNING PLANS
learningRouter.get('/plans', requireAuth, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const plans = db.prepare(`
      SELECT p.*, u.full_name as mentor_name, u.avatar_url as mentor_avatar
      FROM learning_plans p
      LEFT JOIN users u ON p.mentor_id = u.id
      WHERE p.learner_id = ? OR p.mentor_id = ?
      ORDER BY p.updated_at DESC
    `).all(user.id, user.id) as any[];

    const formatted = plans.map(p => ({
      ...p,
      modules: JSON.parse(p.modules_json || '[]')
    }));

    res.json({ plans: formatted });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch learning plans.' });
  }
});

// CREATE / GENERATE AI LEARNING PLAN
learningRouter.post('/plans/generate', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { skillName, currentLevel = 'Beginner', targetLevel = 'Intermediate', goal = '', mentorId } = req.body;

    if (!skillName) {
      res.status(400).json({ error: 'Skill name is required.' });
      return;
    }

    const aiPlan = await generateLearningPlan(skillName, currentLevel, targetLevel, goal);

    const planId = 'plan_' + crypto.randomUUID().slice(0, 8);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO learning_plans (id, learner_id, mentor_id, skill_name, goal, status, modules_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)
    `).run(
      planId,
      user.id,
      mentorId || null,
      skillName,
      goal || `Master ${skillName} (${currentLevel} to ${targetLevel})`,
      JSON.stringify(aiPlan.modules),
      now,
      now
    );

    // Save interaction
    db.prepare(`
      INSERT INTO ai_interactions (id, user_id, query_type, prompt, response, created_at)
      VALUES (?, ?, 'learning_plan_generation', ?, ?, ?)
    `).run(
      'ai_' + crypto.randomUUID().slice(0, 8),
      user.id,
      `Generate plan for ${skillName} (${currentLevel} -> ${targetLevel})`,
      JSON.stringify(aiPlan),
      now
    );

    res.status(201).json({
      message: 'Learning plan generated and saved successfully.',
      plan: {
        id: planId,
        learner_id: user.id,
        mentor_id: mentorId,
        skill_name: skillName,
        goal: goal || `Master ${skillName}`,
        modules: aiPlan.modules,
        status: 'active'
      }
    });
  } catch (error: any) {
    console.error('Error generating learning plan:', error);
    res.status(500).json({ error: 'Failed to generate learning plan.' });
  }
});

// UPDATE LEARNING PLAN MODULE PROGRESS
learningRouter.put('/plans/:id/progress', requireAuth, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const planId = req.params.id;
    const { moduleIndex, status } = req.body;

    const plan = db.prepare('SELECT * FROM learning_plans WHERE id = ?').get(planId) as any;
    if (!plan) {
      res.status(404).json({ error: 'Plan not found.' });
      return;
    }

    if (plan.learner_id !== user.id && plan.mentor_id !== user.id) {
      res.status(403).json({ error: 'Not authorized.' });
      return;
    }

    const modules = JSON.parse(plan.modules_json || '[]');
    if (modules[moduleIndex]) {
      modules[moduleIndex].status = status;
    }

    const now = new Date().toISOString();
    db.prepare('UPDATE learning_plans SET modules_json = ?, updated_at = ? WHERE id = ?').run(
      JSON.stringify(modules),
      now,
      planId
    );

    res.json({ message: 'Progress updated.', modules });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update plan progress.' });
  }
});

// GET SESSIONS
learningRouter.get('/sessions', requireAuth, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const sessions = db.prepare(`
      SELECT
        s.*,
        m.full_name as mentor_name,
        l.full_name as learner_name
      FROM learning_sessions s
      JOIN users m ON s.mentor_id = m.id
      JOIN users l ON s.learner_id = l.id
      WHERE s.learner_id = ? OR s.mentor_id = ?
      ORDER BY s.scheduled_at ASC
    `).all(user.id, user.id);

    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sessions.' });
  }
});

// SCHEDULE NEW LIVE LEARNING SESSION
learningRouter.post('/sessions/schedule', requireAuth, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { mentorId, learnerId, skillName, scheduledAt, durationMinutes = 60, agenda, meetingLink } = req.body;

    const actualMentorId = mentorId || user.id;
    const actualLearnerId = learnerId || user.id;

    if (!skillName || !scheduledAt) {
      res.status(400).json({ error: 'Skill name and scheduled date/time are required.' });
      return;
    }

    const sessionId = 'ses_' + crypto.randomUUID().slice(0, 8);
    const now = new Date().toISOString();
    const link = meetingLink || `https://meet.jit.si/learnx-${sessionId}`;

    db.prepare(`
      INSERT INTO learning_sessions (id, mentor_id, learner_id, skill_name, scheduled_at, duration_minutes, status, meeting_link, agenda, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'scheduled', ?, ?, ?)
    `).run(
      sessionId,
      actualMentorId,
      actualLearnerId,
      skillName,
      scheduledAt,
      Number(durationMinutes),
      link,
      agenda || 'Interactive mentorship session & practice review',
      now
    );

    const otherUserId = user.id === actualMentorId ? actualLearnerId : actualMentorId;
    const notifId = 'notif_' + crypto.randomUUID().slice(0, 8);
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, is_read, link, created_at)
      VALUES (?, ?, 'New Live Session Scheduled', ?, 'session', 0, '/sessions', ?)
    `).run(
      notifId,
      otherUserId,
      `${user.full_name} scheduled a 1-on-1 session for ${skillName} on ${new Date(scheduledAt).toLocaleString()}.`,
      now
    );

    broadcastToUser(otherUserId, 'SESSION_SCHEDULED', {
      sessionId,
      skillName,
      scheduledAt,
      link
    });

    res.status(201).json({
      message: 'Session scheduled successfully.',
      session: {
        id: sessionId,
        scheduled_at: scheduledAt,
        meeting_link: link,
        agenda
      }
    });
  } catch (error: any) {
    console.error('Error scheduling session:', error);
    res.status(500).json({ error: 'Failed to schedule session.' });
  }
});

// COMPLETE SESSION & TRANSFER TIME CREDIT
learningRouter.post('/sessions/:id/complete', requireAuth, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const sessionId = req.params.id;
    const { feedback = '', notes = '' } = req.body;

    const session = db.prepare('SELECT * FROM learning_sessions WHERE id = ?').get(sessionId) as any;
    if (!session) {
      res.status(404).json({ error: 'Session not found.' });
      return;
    }

    if (session.status === 'completed') {
      res.status(400).json({ error: 'Session already completed.' });
      return;
    }

    const now = new Date().toISOString();

    // Mark session completed
    db.prepare(`
      UPDATE learning_sessions
      SET status = 'completed',
          feedback = ?,
          notes = ?,
          time_credits_transferred = 1
      WHERE id = ?
    `).run(feedback, notes, sessionId);

    // Mentor earns 1 Time Credit
    db.prepare(`
      UPDATE time_credit_accounts
      SET balance = balance + 1,
          total_earned = total_earned + 1,
          updated_at = ?
      WHERE user_id = ?
    `).run(now, session.mentor_id);

    db.prepare(`
      INSERT INTO time_credit_transactions (id, user_id, amount, type, description, reference_session_id, created_at)
      VALUES (?, ?, 1, 'earned', ?, ?, ?)
    `).run(
      'tx_' + crypto.randomUUID().slice(0, 8),
      session.mentor_id,
      `Earned 1 Time Credit for conducting ${session.skill_name} session`,
      sessionId,
      now
    );

    // Update mentor stats (learners helped count)
    db.prepare(`
      UPDATE mentor_profiles
      SET learners_helped = learners_helped + 1,
          updated_at = ?
      WHERE user_id = ?
    `).run(now, session.mentor_id);

    // Learner spends 1 credit (if balance > 0)
    db.prepare(`
      UPDATE time_credit_accounts
      SET balance = MAX(0, balance - 1),
          total_spent = total_spent + 1,
          updated_at = ?
      WHERE user_id = ?
    `).run(now, session.learner_id);

    db.prepare(`
      INSERT INTO time_credit_transactions (id, user_id, amount, type, description, reference_session_id, created_at)
      VALUES (?, ?, -1, 'spent', ?, ?, ?)
    `).run(
      'tx_' + crypto.randomUUID().slice(0, 8),
      session.learner_id,
      `Spent 1 Time Credit for ${session.skill_name} mentorship session`,
      sessionId,
      now
    );

    // Broadcast update to both
    broadcastToUser(session.mentor_id, 'SESSION_COMPLETED', { sessionId, earnedCredits: 1 });
    broadcastToUser(session.learner_id, 'SESSION_COMPLETED', { sessionId, spentCredits: 1 });

    res.json({ message: 'Session completed and Time Credit transferred successfully.' });
  } catch (error: any) {
    console.error('Error completing session:', error);
    res.status(500).json({ error: 'Failed to complete session.' });
  }
});
