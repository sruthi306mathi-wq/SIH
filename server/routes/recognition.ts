import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db';
import { requireAuth } from './auth';
import { analyzeExperienceForSkills } from '../ai';

export const recognitionRouter = Router();

function safeJsonParse<T>(val: any, fallback: T): T {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

// GET USER'S DECLARED EXPERIENCES & COMPETENCY MAPPINGS
recognitionRouter.get('/summary', requireAuth, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const experiences = db.prepare('SELECT * FROM experiences WHERE user_id = ? ORDER BY created_at DESC').all(user.id);
    const competencies = db.prepare('SELECT * FROM competencies WHERE user_id = ? ORDER BY created_at DESC').all(user.id);
    const mappings = db.prepare(`
      SELECT qm.*, q.title as qualification_title, q.code as qualification_code, q.industry
      FROM qualification_mappings qm
      JOIN qualifications q ON qm.qualification_id = q.id
      WHERE qm.user_id = ?
      ORDER BY qm.created_at DESC
    `).all(user.id) as any[];

    const formattedMappings = mappings.map(m => ({
      ...m,
      matched_competencies: safeJsonParse(m.matched_competencies_json, []),
      partial_competencies: safeJsonParse(m.partial_competencies_json, []),
      missing_competencies: safeJsonParse(m.missing_competencies_json, []),
    }));

    res.json({
      experiences: experiences.map((e: any) => ({
        ...e,
        ai_analysis: safeJsonParse(e.ai_analysis_summary, null)
      })),
      competencies,
      qualificationMappings: formattedMappings
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recognition summary.' });
  }
});

// SUBMIT WORK EXPERIENCE FOR AI RECOGNITION & QUALIFICATION MAPPING
recognitionRouter.post('/declare-experience', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { profession, company = '', yearsExp, responsibilities, toolsUsed, tasksPerformed } = req.body;

    if (!profession || !yearsExp || !responsibilities || !toolsUsed || !tasksPerformed) {
      res.status(400).json({ error: 'Profession, years of experience, responsibilities, tools, and tasks are required.' });
      return;
    }

    const expId = 'exp_' + crypto.randomUUID().slice(0, 8);
    const now = new Date().toISOString();

    // Run AI Skill Recognition & Competency Analysis
    const aiResult = await analyzeExperienceForSkills({
      profession,
      yearsExp: Number(yearsExp),
      responsibilities,
      toolsUsed,
      tasksPerformed
    });

    // Save experience record
    db.prepare(`
      INSERT INTO experiences (id, user_id, profession, company, years_exp, responsibilities, tools_used, tasks_performed, ai_analysis_summary, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      expId,
      user.id,
      profession,
      company,
      Number(yearsExp),
      responsibilities,
      toolsUsed,
      tasksPerformed,
      JSON.stringify(aiResult),
      now
    );

    // Insert or update competencies into competencies table
    if (aiResult.identifiedSkills && Array.isArray(aiResult.identifiedSkills)) {
      for (const sk of aiResult.identifiedSkills) {
        const compId = 'comp_' + crypto.randomUUID().slice(0, 8);
        db.prepare(`
          INSERT INTO competencies (id, user_id, skill_name, current_level, target_level, status, gap_notes, created_at)
          VALUES (?, ?, ?, ?, 'Expert', 'ai_assessed', ?, ?)
        `).run(
          compId,
          user.id,
          sk.name,
          sk.level || 'Intermediate',
          `AI Assessed from declared work experience (${yearsExp} yrs). Evidence needed: ${sk.evidenceNeeded || 'Work sample'}`,
          now
        );

        // Also add to user_skills as known
        const userSkillId = 'usk_' + crypto.randomUUID().slice(0, 8);
        db.prepare(`
          INSERT INTO user_skills (id, user_id, skill_name, proficiency_level, type, years_experience, verified_status, created_at)
          VALUES (?, ?, ?, ?, 'known', ?, 'ai_assessed', ?)
        `).run(
          userSkillId,
          user.id,
          sk.name,
          sk.level || 'Intermediate',
          Number(yearsExp),
          now
        );
      }
    }

    // Map to matching qualification in qualifications table
    const qualifications = db.prepare('SELECT * FROM qualifications').all() as any[];
    let bestQual = qualifications[0];
    if (qualifications.length > 0) {
      // Find matching qualification or default to first
      const matched = qualifications.find(q =>
        q.title.toLowerCase().includes(profession.toLowerCase()) ||
        profession.toLowerCase().includes(q.industry.toLowerCase())
      );
      if (matched) bestQual = matched;
    }

    if (bestQual) {
      const allCompetencies: string[] = safeJsonParse(bestQual.required_competencies_json, []);
      const matchedComp = allCompetencies.slice(0, Math.ceil(allCompetencies.length * 0.7));
      const partialComp = allCompetencies.slice(Math.ceil(allCompetencies.length * 0.7), Math.ceil(allCompetencies.length * 0.9));
      const missingComp = allCompetencies.slice(Math.ceil(allCompetencies.length * 0.9));

      const mappingId = 'qmap_' + crypto.randomUUID().slice(0, 8);
      db.prepare(`
        INSERT INTO qualification_mappings (id, user_id, qualification_id, match_percentage, matched_competencies_json, partial_competencies_json, missing_competencies_json, ai_reasoning, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        mappingId,
        user.id,
        bestQual.id,
        aiResult.matchPercentage || 85,
        JSON.stringify(matchedComp),
        JSON.stringify(partialComp),
        JSON.stringify(missingComp),
        aiResult.summary || 'Strong experience alignment with practitioner standards.',
        now
      );
    }

    // Add audit log
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, details, created_at)
      VALUES (?, ?, 'EXPERIENCE_SUBMITTED', ?, ?)
    `).run('log_' + crypto.randomUUID().slice(0, 8), user.id, `Submitted ${yearsExp} yrs experience as ${profession}`, now);

    res.status(201).json({
      message: 'Experience declared and AI recognition completed.',
      experienceId: expId,
      aiAnalysis: aiResult
    });
  } catch (error: any) {
    console.error('Error submitting experience:', error);
    res.status(500).json({ error: 'Failed to submit experience.' });
  }
});

// GET QUALIFICATIONS CATALOG
recognitionRouter.get('/qualifications', requireAuth, (_req: Request, res: Response) => {
  try {
    const quals = db.prepare('SELECT * FROM qualifications ORDER BY industry ASC').all() as any[];
    res.json({
      qualifications: quals.map(q => ({
        ...q,
        required_competencies: safeJsonParse(q.required_competencies_json, [])
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch qualifications.' });
  }
});
