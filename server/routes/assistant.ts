import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db';
import { requireAuth } from './auth';
import { askLearnXAssistant } from '../ai';

export const assistantRouter = Router();

// ASK LEARNX AI ASSISTANT
assistantRouter.post('/ask', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { message } = req.body;

    if (!message || !message.trim()) {
      res.status(400).json({ error: 'Message cannot be empty.' });
      return;
    }

    // Build real user context
    const learnerProfile = db.prepare('SELECT * FROM learner_profiles WHERE user_id = ?').get(user.id) as any;
    const mentorProfile = db.prepare('SELECT * FROM mentor_profiles WHERE user_id = ?').get(user.id) as any;
    const competencies = db.prepare('SELECT skill_name, current_level, status FROM competencies WHERE user_id = ?').all(user.id);
    const credits = db.prepare('SELECT balance FROM time_credit_accounts WHERE user_id = ?').get(user.id) as any;

    const context = `Active Mode: ${user.active_mode}. Primary Goal: ${learnerProfile?.primary_goal || 'None specified'}. Time Credits Balance: ${credits?.balance || 0}. Competencies: ${JSON.stringify(competencies)}. Mentor Skills: ${mentorProfile?.skills_taught || 'None'}.`;

    const answer = await askLearnXAssistant({
      userRole: user.active_mode,
      userName: user.full_name,
      context,
      message: message.trim()
    });

    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO ai_interactions (id, user_id, query_type, prompt, response, created_at)
      VALUES (?, ?, 'assistant_chat', ?, ?, ?)
    `).run('ai_' + crypto.randomUUID().slice(0, 8), user.id, message.trim(), answer, now);

    res.json({ reply: answer });
  } catch (error: any) {
    console.error('Error in AI assistant query:', error);
    res.status(500).json({ error: 'AI Assistant failed to process response.' });
  }
});
