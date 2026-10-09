import { Router, Request, Response } from 'express';
import { db } from '../db';
import { requireAuth } from './auth';

export const adminRouter = Router();

// GET REAL DATABASE STATISTICS FOR ADMIN
adminRouter.get('/stats', requireAuth, (_req: Request, res: Response) => {
  try {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    const totalLearners = db.prepare('SELECT COUNT(*) as count FROM learner_profiles').get() as { count: number };
    const totalMentors = db.prepare('SELECT COUNT(*) as count FROM mentor_profiles').get() as { count: number };
    const totalSessions = db.prepare('SELECT COUNT(*) as count FROM learning_sessions').get() as { count: number };
    const completedSessions = db.prepare(`SELECT COUNT(*) as count FROM learning_sessions WHERE status = 'completed'`).get() as { count: number };
    const totalEvidence = db.prepare('SELECT COUNT(*) as count FROM evidence').get() as { count: number };
    const verifiedEvidence = db.prepare(`SELECT COUNT(*) as count FROM evidence WHERE assessor_status = 'verified'`).get() as { count: number };
    const totalProofs = db.prepare('SELECT COUNT(*) as count FROM skillproofs').get() as { count: number };
    const totalCertificates = db.prepare('SELECT COUNT(*) as count FROM certificates').get() as { count: number };
    const totalCreditsSum = db.prepare('SELECT COALESCE(SUM(balance), 0) as total FROM time_credit_accounts').get() as { total: number };

    const recentAuditLogs = db.prepare(`
      SELECT a.*, u.full_name as user_name, u.email as user_email
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC LIMIT 20
    `).all();

    const userDirectory = db.prepare(`
      SELECT id, full_name, email, role, active_mode, language, created_at
      FROM users
      ORDER BY created_at DESC
    `).all();

    res.json({
      metrics: {
        totalUsers: totalUsers.count,
        totalLearners: totalLearners.count,
        totalMentors: totalMentors.count,
        totalSessions: totalSessions.count,
        completedSessions: completedSessions.count,
        totalEvidence: totalEvidence.count,
        verifiedEvidence: verifiedEvidence.count,
        totalSkillProofs: totalProofs.count,
        totalCertificates: totalCertificates.count,
        creditsCirculation: totalCreditsSum.total
      },
      auditLogs: recentAuditLogs,
      users: userDirectory
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admin statistics.' });
  }
});
