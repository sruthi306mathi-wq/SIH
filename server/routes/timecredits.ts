import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db';
import { requireAuth } from './auth';

export const timeCreditsRouter = Router();

// GET USER'S TIME CREDIT BALANCE & TRANSACTIONS
timeCreditsRouter.get('/summary', requireAuth, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const account = db.prepare('SELECT * FROM time_credit_accounts WHERE user_id = ?').get(user.id) as any || {
      balance: 0,
      total_earned: 0,
      total_spent: 0
    };

    const transactions = db.prepare(`
      SELECT * FROM time_credit_transactions
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(user.id);

    res.json({
      balance: account.balance,
      totalEarned: account.total_earned,
      totalSpent: account.total_spent,
      transactions
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Time Credit summary.' });
  }
});

// PEER CREDIT REWARD / TRANSFER (e.g. Learner tips mentor for extra help)
timeCreditsRouter.post('/transfer', requireAuth, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { recipientId, amount = 1, note = 'Peer appreciation reward' } = req.body;

    const transferAmount = Number(amount);
    if (!recipientId || transferAmount <= 0) {
      res.status(400).json({ error: 'Recipient and positive amount required.' });
      return;
    }

    const senderAccount = db.prepare('SELECT balance FROM time_credit_accounts WHERE user_id = ?').get(user.id) as any;
    if (!senderAccount || senderAccount.balance < transferAmount) {
      res.status(400).json({ error: 'Insufficient Time Credits balance.' });
      return;
    }

    const now = new Date().toISOString();

    // Deduct sender
    db.prepare(`
      UPDATE time_credit_accounts
      SET balance = balance - ?,
          total_spent = total_spent + ?,
          updated_at = ?
      WHERE user_id = ?
    `).run(transferAmount, transferAmount, now, user.id);

    db.prepare(`
      INSERT INTO time_credit_transactions (id, user_id, amount, type, description, created_at)
      VALUES (?, ?, ?, 'spent', ?, ?)
    `).run('tx_' + crypto.randomUUID().slice(0, 8), user.id, -transferAmount, `Transferred to peer: ${note}`, now);

    // Credit recipient
    db.prepare(`
      UPDATE time_credit_accounts
      SET balance = balance + ?,
          total_earned = total_earned + ?,
          updated_at = ?
      WHERE user_id = ?
    `).run(transferAmount, transferAmount, now, recipientId);

    db.prepare(`
      INSERT INTO time_credit_transactions (id, user_id, amount, type, description, created_at)
      VALUES (?, ?, ?, 'earned', ?, ?)
    `).run('tx_' + crypto.randomUUID().slice(0, 8), recipientId, transferAmount, `Received from ${user.full_name}: ${note}`, now);

    res.json({ message: `Successfully transferred ${transferAmount} Time Credit(s).` });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to process transfer.' });
  }
});
