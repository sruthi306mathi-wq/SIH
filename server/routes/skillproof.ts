import { Router, Request, Response } from 'express';
import { db } from '../db';
import { requireAuth } from './auth';

export const skillproofRouter = Router();

// GET USER'S SKILLPROOF BADGES
skillproofRouter.get('/proofs', requireAuth, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const proofs = db.prepare('SELECT * FROM skillproofs WHERE user_id = ? ORDER BY issued_at DESC').all(user.id);
    res.json({ proofs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch SkillProof records.' });
  }
});

// GET USER'S CERTIFICATES
skillproofRouter.get('/certificates', requireAuth, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const certs = db.prepare('SELECT * FROM certificates WHERE user_id = ? ORDER BY created_at DESC').all(user.id) as any[];

    const formatted = certs.map(c => ({
      ...c,
      certificate_data: JSON.parse(c.certificate_data_json || '{}')
    }));

    res.json({ certificates: formatted });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch certificates.' });
  }
});

// GET PUBLIC CERTIFICATE BY NUMBER OR ID (For external verification)
skillproofRouter.get('/verify/certificate/:certNumber', (req: Request, res: Response) => {
  try {
    const certNumber = req.params.certNumber;
    const cert = db.prepare(`
      SELECT c.*, u.full_name as recipient_name, u.email as recipient_email
      FROM certificates c
      JOIN users u ON c.user_id = u.id
      WHERE c.certificate_number = ? OR c.id = ?
    `).get(certNumber, certNumber) as any;

    if (!cert) {
      res.status(404).json({ error: 'Certificate not found or invalid verification token.' });
      return;
    }

    res.json({
      certificate: {
        ...cert,
        certificate_data: JSON.parse(cert.certificate_data_json || '{}'),
        isVerified: true,
        verificationTimestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify certificate.' });
  }
});
