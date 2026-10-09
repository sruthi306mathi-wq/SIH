import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db';
import { requireAuth } from './auth';
import { analyzeUploadedEvidence } from '../ai';
import { broadcastToUser } from '../events';

export const evidenceRouter = Router();

// GET USER'S UPLOADED EVIDENCE
evidenceRouter.get('/my', requireAuth, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const evidenceList = db.prepare(`
      SELECT e.*, u.full_name as assessor_name
      FROM evidence e
      LEFT JOIN users u ON e.assessor_id = u.id
      WHERE e.user_id = ?
      ORDER BY e.created_at DESC
    `).all(user.id);

    res.json({ evidence: evidenceList });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch evidence.' });
  }
});

// UPLOAD EVIDENCE & RUN AI ANALYSIS
evidenceRouter.post('/upload', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { title, description, skillName, fileUrl, fileType = 'application/pdf', fileName = 'work-sample.pdf', fileSize = 1024 } = req.body;

    if (!title || !description || !skillName) {
      res.status(400).json({ error: 'Title, description, and skill name are required.' });
      return;
    }

    const evidenceId = 'evi_' + crypto.randomUUID().slice(0, 8);
    const now = new Date().toISOString();

    // Run AI Evidence Quality & Authenticity Analysis
    const aiAnalysis = await analyzeUploadedEvidence({
      title,
      description,
      skillName,
      fileType,
      fileName
    });

    const mockFileStorageUrl = fileUrl || `/uploads/${evidenceId}_${fileName}`;

    db.prepare(`
      INSERT INTO evidence (
        id, user_id, title, description, skill_name, file_url, file_type, file_name, file_size,
        ai_quality_score, ai_analysis_notes, assessor_status, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `).run(
      evidenceId,
      user.id,
      title,
      description,
      skillName,
      mockFileStorageUrl,
      fileType,
      fileName,
      Number(fileSize),
      aiAnalysis.qualityScore || 85,
      JSON.stringify(aiAnalysis),
      now
    );

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, details, created_at)
      VALUES (?, ?, 'EVIDENCE_UPLOADED', ?, ?)
    `).run('log_' + crypto.randomUUID().slice(0, 8), user.id, `Uploaded evidence "${title}" for ${skillName}`, now);

    res.status(201).json({
      message: 'Evidence submitted successfully and analyzed by LearnX AI.',
      evidenceId,
      aiAnalysis
    });
  } catch (error: any) {
    console.error('Error submitting evidence:', error);
    res.status(500).json({ error: 'Failed to process evidence.' });
  }
});

// GET ALL PENDING EVIDENCE FOR ASSESSORS
evidenceRouter.get('/assessor/queue', requireAuth, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    // Assessors or Admin or user in assessor mode
    const items = db.prepare(`
      SELECT e.*, u.full_name as candidate_name, u.email as candidate_email, u.avatar_url as candidate_avatar
      FROM evidence e
      JOIN users u ON e.user_id = u.id
      ORDER BY
        CASE e.assessor_status
          WHEN 'pending' THEN 1
          WHEN 'needs_more_evidence' THEN 2
          ELSE 3
        END,
        e.created_at DESC
    `).all();

    res.json({ queue: items });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assessor queue.' });
  }
});

// ASSESSOR REVIEWS AND VERIFIES EVIDENCE
evidenceRouter.post('/assessor/review/:id', requireAuth, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const evidenceId = req.params.id;
    const { status, notes } = req.body; // status: 'verified' | 'needs_more_evidence' | 'rejected'

    if (!['verified', 'needs_more_evidence', 'rejected'].includes(status)) {
      res.status(400).json({ error: 'Status must be verified, needs_more_evidence, or rejected.' });
      return;
    }

    const item = db.prepare('SELECT * FROM evidence WHERE id = ?').get(evidenceId) as any;
    if (!item) {
      res.status(404).json({ error: 'Evidence record not found.' });
      return;
    }

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE evidence
      SET assessor_status = ?,
          assessor_notes = ?,
          assessor_id = ?
      WHERE id = ?
    `).run(status, notes || '', user.id, evidenceId);

    // If verified, upgrade competency and issue SkillProof + Certificate
    if (status === 'verified') {
      // 1. Update Competency
      db.prepare(`
        UPDATE competencies
        SET status = 'assessor_verified',
            verified_by = ?,
            verified_at = ?
        WHERE user_id = ? AND skill_name = ?
      `).run(user.full_name, now, item.user_id, item.skill_name);

      // 2. Issue or upgrade SkillProof to institution / assessor verified
      const existingProof = db.prepare('SELECT id FROM skillproofs WHERE user_id = ? AND skill_name = ?').get(item.user_id, item.skill_name);
      if (existingProof) {
        db.prepare(`
          UPDATE skillproofs
          SET verification_level = 'institution_verified',
              verified_by = ?,
              issued_at = ?
          WHERE user_id = ? AND skill_name = ?
        `).run(user.full_name, now, item.user_id, item.skill_name);
      } else {
        const proofId = 'prf_' + crypto.randomUUID().slice(0, 8);
        db.prepare(`
          INSERT INTO skillproofs (id, user_id, skill_name, verification_level, badge_code, verified_by, qr_payload, issued_at)
          VALUES (?, ?, ?, 'institution_verified', ?, ?, ?, ?)
        `).run(
          proofId,
          item.user_id,
          item.skill_name,
          'LX-VER-' + crypto.randomUUID().slice(0, 6).toUpperCase(),
          user.full_name,
          `https://learnx.org/verify/proof/${item.user_id}/${encodeURIComponent(item.skill_name)}`,
          now
        );
      }

      // 3. Issue Certificate
      const certId = 'cert_' + crypto.randomUUID().slice(0, 8);
      const certNumber = 'LX-' + Math.floor(100000 + Math.random() * 900000);
      const candidate = db.prepare('SELECT full_name FROM users WHERE id = ?').get(item.user_id) as any;

      const certData = {
        candidateName: candidate?.full_name || 'Practitioner',
        skillName: item.skill_name,
        assessorName: user.full_name,
        dateIssued: now,
        evidenceTitle: item.title,
        status: 'VERIFIED_COMPETENT'
      };

      db.prepare(`
        INSERT INTO certificates (id, certificate_number, user_id, pathway, skill_name, title, issue_date, grade, verified_by, certificate_data_json, created_at)
        VALUES (?, ?, ?, 'experience_recognition', ?, ?, ?, 'Competent with Distinction', ?, ?, ?)
      `).run(
        certId,
        certNumber,
        item.user_id,
        item.skill_name,
        `Certificate of Competency in ${item.skill_name}`,
        now.slice(0, 10),
        user.full_name,
        JSON.stringify(certData),
        now
      );

      // Audit log
      db.prepare(`
        INSERT INTO audit_logs (id, user_id, action, details, created_at)
        VALUES (?, ?, 'CERTIFICATE_ISSUED', ?, ?)
      `).run('log_' + crypto.randomUUID().slice(0, 8), item.user_id, `Issued Certificate ${certNumber} for ${item.skill_name} verified by ${user.full_name}`, now);
    }

    // Notify candidate
    const notifId = 'notif_' + crypto.randomUUID().slice(0, 8);
    const notifMsg = status === 'verified'
      ? `Your evidence for ${item.skill_name} has been verified by assessor ${user.full_name}. Your SkillProof badge and Certificate have been awarded!`
      : `Your evidence for ${item.skill_name} was reviewed: ${notes || status}`;

    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, is_read, link, created_at)
      VALUES (?, ?, ?, ?, 'verification', 0, '/certificates', ?)
    `).run(
      notifId,
      item.user_id,
      `Evidence Review: ${status.replace(/_/g, ' ').toUpperCase()}`,
      notifMsg,
      now
    );

    broadcastToUser(item.user_id, 'EVIDENCE_REVIEWED', {
      evidenceId,
      status,
      assessorNotes: notes
    });

    res.json({ message: `Evidence marked as ${status}.` });
  } catch (error: any) {
    console.error('Error reviewing evidence:', error);
    res.status(500).json({ error: 'Failed to review evidence.' });
  }
});
