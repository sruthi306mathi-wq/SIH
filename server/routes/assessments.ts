import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db';
import { requireAuth } from './auth';

export const assessmentsRouter = Router();

// GET ALL ASSESSMENTS
assessmentsRouter.get('/', requireAuth, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const assessments = db.prepare('SELECT id, title, skill_name, type, passing_score, created_at FROM assessments').all() as any[];

    // Fetch user attempts for each assessment
    const attempts = db.prepare(`
      SELECT assessment_id, score, total_score, passed, created_at
      FROM assessment_attempts
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(user.id) as any[];

    const assessmentsWithHistory = assessments.map(a => {
      const userAttempts = attempts.filter(att => att.assessment_id === a.id);
      const bestAttempt = userAttempts.length > 0 ? Math.max(...userAttempts.map(att => att.score)) : null;
      const latestAttempt = userAttempts.length > 0 ? userAttempts[0] : null;

      return {
        ...a,
        totalAttempts: userAttempts.length,
        bestScore: bestAttempt,
        latestAttempt,
        isCompleted: userAttempts.some(att => att.passed === 1)
      };
    });

    res.json({ assessments: assessmentsWithHistory });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assessments.' });
  }
});

// GET ASSESSMENT DETAILS (Questions for taking the assessment)
assessmentsRouter.get('/:id', requireAuth, (req: Request, res: Response) => {
  try {
    const assessment = db.prepare('SELECT * FROM assessments WHERE id = ?').get(req.params.id) as any;
    if (!assessment) {
      res.status(404).json({ error: 'Assessment not found.' });
      return;
    }

    const rawQuestions = JSON.parse(assessment.questions_json || '[]');
    // Omit correct answers from client payload before submission
    const sanitizedQuestions = rawQuestions.map((q: any) => ({
      id: q.id,
      question: q.question,
      options: q.options
    }));

    res.json({
      assessment: {
        id: assessment.id,
        title: assessment.title,
        skill_name: assessment.skill_name,
        type: assessment.type,
        passing_score: assessment.passing_score,
        questions: sanitizedQuestions,
        totalQuestions: sanitizedQuestions.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assessment.' });
  }
});

// SUBMIT ASSESSMENT ATTEMPT
assessmentsRouter.post('/:id/submit', requireAuth, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const assessmentId = req.params.id;
    const { answers } = req.body; // Map: { [questionId: string]: number }

    const assessment = db.prepare('SELECT * FROM assessments WHERE id = ?').get(assessmentId) as any;
    if (!assessment) {
      res.status(404).json({ error: 'Assessment not found.' });
      return;
    }

    const questions: any[] = JSON.parse(assessment.questions_json || '[]');
    let correctCount = 0;
    const feedbackBreakdown: any[] = [];

    questions.forEach((q) => {
      const userAnswerIndex = answers ? answers[q.id] : undefined;
      const isCorrect = userAnswerIndex === q.correctIndex;
      if (isCorrect) correctCount++;

      feedbackBreakdown.push({
        questionId: q.id,
        question: q.question,
        isCorrect,
        explanation: q.explanation || ''
      });
    });

    const totalQuestions = questions.length;
    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
    const passed = scorePercentage >= assessment.passing_score ? 1 : 0;
    const attemptId = 'att_' + crypto.randomUUID().slice(0, 8);
    const now = new Date().toISOString();

    const aiFeedback = passed === 1
      ? `Demonstrated solid competency with ${scorePercentage}%. Good grasp of practical standards.`
      : `Scored ${scorePercentage}% (Passing threshold: ${assessment.passing_score}%). Recommend reviewing modules on core principles and re-attempting.`;

    db.prepare(`
      INSERT INTO assessment_attempts (id, user_id, assessment_id, score, total_score, passed, answers_json, ai_feedback, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      attemptId,
      user.id,
      assessmentId,
      scorePercentage,
      100,
      passed,
      JSON.stringify(answers || {}),
      aiFeedback,
      now
    );

    // If passed, update competency level & skillproof
    if (passed === 1) {
      const existingComp = db.prepare('SELECT id FROM competencies WHERE user_id = ? AND skill_name = ?').get(user.id, assessment.skill_name);
      if (existingComp) {
        db.prepare(`
          UPDATE competencies
          SET status = 'ai_assessed', current_level = 'Advanced', gap_notes = 'Practical assessment passed with ' || ? || '%'
          WHERE user_id = ? AND skill_name = ?
        `).run(scorePercentage, user.id, assessment.skill_name);
      } else {
        db.prepare(`
          INSERT INTO competencies (id, user_id, skill_name, current_level, target_level, status, gap_notes, created_at)
          VALUES (?, ?, ?, 'Advanced', 'Expert', 'ai_assessed', ?, ?)
        `).run('comp_' + crypto.randomUUID().slice(0, 8), user.id, assessment.skill_name, `Passed practical assessment with ${scorePercentage}%`, now);
      }

      // Check if skillproof exists; if not, create AI assessed skillproof
      const existingProof = db.prepare('SELECT id FROM skillproofs WHERE user_id = ? AND skill_name = ?').get(user.id, assessment.skill_name);
      if (!existingProof) {
        db.prepare(`
          INSERT INTO skillproofs (id, user_id, skill_name, verification_level, badge_code, verified_by, qr_payload, issued_at)
          VALUES (?, ?, ?, 'ai_assessed', ?, 'LearnX Automated Practical Proctor', ?, ?)
        `).run(
          'prf_' + crypto.randomUUID().slice(0, 8),
          user.id,
          assessment.skill_name,
          'LX-AI-' + crypto.randomUUID().slice(0, 6).toUpperCase(),
          `https://learnx.org/verify/proof/${user.id}/${encodeURIComponent(assessment.skill_name)}`,
          now
        );
      }
    }

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, details, created_at)
      VALUES (?, ?, 'ASSESSMENT_SUBMITTED', ?, ?)
    `).run('log_' + crypto.randomUUID().slice(0, 8), user.id, `Submitted ${assessment.title}: ${scorePercentage}% (Passed: ${passed === 1})`, now);

    res.json({
      attemptId,
      score: scorePercentage,
      passed: passed === 1,
      totalQuestions,
      correctCount,
      aiFeedback,
      feedbackBreakdown
    });
  } catch (error: any) {
    console.error('Error submitting assessment:', error);
    res.status(500).json({ error: 'Failed to evaluate assessment submission.' });
  }
});
