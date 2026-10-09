import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db';
import { broadcastToUser } from '../events';

export const authRouter = Router();

// Password hashing helpers using standard Node crypto
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(':');
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch (e) {
    return false;
  }
}

// Authentication middleware helper
export function getAuthenticatedUser(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  const session = db.prepare('SELECT user_id, expires_at FROM auth_sessions WHERE token = ?').get(token) as { user_id: string; expires_at: string } | undefined;
  if (!session) return null;

  if (new Date(session.expires_at) < new Date()) {
    db.prepare('DELETE FROM auth_sessions WHERE token = ?').run(token);
    return null;
  }

  const user = db.prepare('SELECT id, email, full_name, avatar_url, role, active_mode, bio, language, availability, learning_mode, location, created_at FROM users WHERE id = ?').get(session.user_id) as any;
  return user || null;
}

export function requireAuth(req: Request, res: Response, next: () => void) {
  const user = getAuthenticatedUser(req);
  if (!user) {
    res.status(401).json({ error: 'Authentication required. Please log in.' });
    return;
  }
  (req as any).user = user;
  next();
}

// REGISTER
authRouter.post('/register', (req: Request, res: Response) => {
  try {
    const {
      email,
      password,
      fullName,
      intent, // 'learn', 'rpl', 'mentor', 'dual'
      skillsToLearn = [],
      knownSkills = [],
      language = 'English',
      availability = 'Flexible',
      learningMode = 'Online',
      primaryGoal = '',
      yearsExp = 3
    } = req.body;

    if (!email || !password || !fullName) {
      res.status(400).json({ error: 'Full name, email, and password are required.' });
      return;
    }

    // Check if user already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim().toLowerCase());
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists. Please log in.' });
      return;
    }

    const userId = 'usr_' + crypto.randomUUID().slice(0, 8);
    const passwordHash = hashPassword(password);
    const now = new Date().toISOString();

    let role = 'learner';
    let activeMode = 'learner';
    if (intent === 'mentor') {
      role = 'mentor';
      activeMode = 'mentor';
    } else if (intent === 'dual') {
      role = 'dual';
      activeMode = 'learner';
    } else if (intent === 'rpl') {
      role = 'learner';
      activeMode = 'learner';
    }

    // Insert user record
    db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, role, active_mode, language, availability, learning_mode, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      email.trim().toLowerCase(),
      passwordHash,
      fullName.trim(),
      role,
      activeMode,
      language,
      availability,
      learningMode,
      now,
      now
    );

    // Create Learner Profile
    const skillsToLearnArray = Array.isArray(skillsToLearn) ? skillsToLearn : (skillsToLearn ? [skillsToLearn] : []);
    db.prepare(`
      INSERT INTO learner_profiles (user_id, primary_goal, target_level, current_level, preferred_mode, skills_to_learn, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      primaryGoal || (skillsToLearnArray.length > 0 ? `Master ${skillsToLearnArray[0]}` : 'Build industry competencies'),
      'Intermediate',
      'Beginner',
      learningMode,
      JSON.stringify(skillsToLearnArray),
      now,
      now
    );

    // If mentor or dual, create Mentor Profile
    const knownSkillsArray = Array.isArray(knownSkills) ? knownSkills : (knownSkills ? [knownSkills] : []);
    if (role === 'mentor' || role === 'dual') {
      db.prepare(`
        INSERT INTO mentor_profiles (user_id, skills_taught, years_of_experience, teaching_style, bio, availability_hours, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        JSON.stringify(knownSkillsArray.length > 0 ? knownSkillsArray : ['General Mentorship']),
        Number(yearsExp) || 3,
        'Hands-on Practical Mentorship',
        `${fullName} is an active industry practitioner passionate about peer learning.`,
        availability,
        now,
        now
      );
    }

    // Setup initial Time Credit account (starter bonus of 3 credits for peer exchange)
    db.prepare(`
      INSERT INTO time_credit_accounts (user_id, balance, total_earned, total_spent, updated_at)
      VALUES (?, 3, 3, 0, ?)
    `).run(userId, now);

    db.prepare(`
      INSERT INTO time_credit_transactions (id, user_id, amount, type, description, created_at)
      VALUES (?, ?, 3, 'starter_bonus', 'Welcome bonus: 3 Time Credits for peer learning sessions', ?)
    `).run('tx_' + crypto.randomUUID().slice(0, 8), userId, now);

    // Initial system notification
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, is_read, link, created_at)
      VALUES (?, ?, 'Welcome to LearnX', 'Your account is ready. Explore mentor discovery, start a learning pathway, or submit real experience for SkillProof recognition.', 'system', 0, '/dashboard', ?)
    `).run('notif_' + crypto.randomUUID().slice(0, 8), userId, now);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, details, created_at)
      VALUES (?, ?, 'USER_REGISTRATION', ?, ?)
    `).run('log_' + crypto.randomUUID().slice(0, 8), userId, `User registered with role ${role} and email ${email}`, now);

    // Create session token (valid for 30 days)
    const token = 'sess_' + crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    db.prepare(`
      INSERT INTO auth_sessions (token, user_id, expires_at, created_at)
      VALUES (?, ?, ?, ?)
    `).run(token, userId, expiresAt, now);

    const user = db.prepare('SELECT id, email, full_name, avatar_url, role, active_mode, bio, language, availability, learning_mode, location FROM users WHERE id = ?').get(userId);

    res.status(201).json({
      token,
      user,
      message: 'Account created successfully.'
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message || 'Registration failed.' });
  }
});

// LOGIN
authRouter.post('/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase()) as any;
    if (!row || !verifyPassword(password, row.password_hash)) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = 'sess_' + crypto.randomBytes(32).toString('hex');
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    db.prepare(`
      INSERT INTO auth_sessions (token, user_id, expires_at, created_at)
      VALUES (?, ?, ?, ?)
    `).run(token, row.id, expiresAt, now);

    // Log audit
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, details, created_at)
      VALUES (?, ?, 'USER_LOGIN', 'User logged in successfully', ?)
    `).run('log_' + crypto.randomUUID().slice(0, 8), row.id, now);

    const user = {
      id: row.id,
      email: row.email,
      full_name: row.full_name,
      avatar_url: row.avatar_url,
      role: row.role,
      active_mode: row.active_mode,
      bio: row.bio,
      language: row.language,
      availability: row.availability,
      learning_mode: row.learning_mode,
      location: row.location
    };

    res.json({
      token,
      user,
      message: 'Logged in successfully.'
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed.' });
  }
});

// CURRENT AUTHENTICATED USER (ME)
authRouter.get('/me', (req: Request, res: Response) => {
  try {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.json({
        user: null,
        learnerProfile: null,
        mentorProfile: null,
        timeCredits: { balance: 0, total_earned: 0, total_spent: 0 },
        unreadNotificationsCount: 0
      });
      return;
    }

    const learnerProfile = db.prepare('SELECT * FROM learner_profiles WHERE user_id = ?').get(user.id);
    const mentorProfile = db.prepare('SELECT * FROM mentor_profiles WHERE user_id = ?').get(user.id);
    const creditAccount = db.prepare('SELECT balance, total_earned, total_spent FROM time_credit_accounts WHERE user_id = ?').get(user.id) || { balance: 0, total_earned: 0, total_spent: 0 };
    const unreadNotifs = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(user.id) as { count: number };

    res.json({
      user,
      learnerProfile: learnerProfile ? {
        ...learnerProfile,
        skills_to_learn: JSON.parse((learnerProfile as any).skills_to_learn || '[]')
      } : null,
      mentorProfile: mentorProfile ? {
        ...mentorProfile,
        skills_taught: JSON.parse((mentorProfile as any).skills_taught || '[]')
      } : null,
      timeCredits: creditAccount,
      unreadNotificationsCount: unreadNotifs.count
    });
  } catch (error: any) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ error: 'Failed to fetch user state.' });
  }
});

// SWITCH ACTIVE MODE (Learner <-> Mentor <-> Assessor)
authRouter.post('/switch-mode', requireAuth, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { mode } = req.body;
    if (!['learner', 'mentor', 'assessor', 'admin'].includes(mode)) {
      res.status(400).json({ error: 'Invalid mode.' });
      return;
    }

    // If switching to mentor, ensure user has a mentor profile or create one
    if (mode === 'mentor') {
      const existing = db.prepare('SELECT user_id FROM mentor_profiles WHERE user_id = ?').get(user.id);
      if (!existing) {
        const now = new Date().toISOString();
        db.prepare(`
          INSERT INTO mentor_profiles (user_id, skills_taught, years_of_experience, teaching_style, bio, availability_hours, created_at, updated_at)
          VALUES (?, '[]', 2, 'Hands-on Guidance', 'Eager to mentor and share practical knowledge', 'Flexible', ?, ?)
        `).run(user.id, now, now);

        // Update role to dual if was learner
        if (user.role === 'learner') {
          db.prepare('UPDATE users SET role = ? WHERE id = ?').run('dual', user.id);
        }
      }
    }

    db.prepare('UPDATE users SET active_mode = ?, updated_at = ? WHERE id = ?').run(mode, new Date().toISOString(), user.id);
    user.active_mode = mode;

    res.json({
      message: `Switched to ${mode} mode.`,
      active_mode: mode
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to switch mode.' });
  }
});

// UPDATE PROFILE
authRouter.put('/profile', requireAuth, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const {
      full_name,
      bio,
      language,
      availability,
      learning_mode,
      location,
      // Learner profile fields
      primary_goal,
      current_level,
      target_level,
      skills_to_learn,
      // Mentor profile fields
      skills_taught,
      years_of_experience,
      teaching_style,
      availability_hours,
      hourly_rate_credits
    } = req.body;

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE users
      SET full_name = COALESCE(?, full_name),
          bio = COALESCE(?, bio),
          language = COALESCE(?, language),
          availability = COALESCE(?, availability),
          learning_mode = COALESCE(?, learning_mode),
          location = COALESCE(?, location),
          updated_at = ?
      WHERE id = ?
    `).run(full_name, bio, language, availability, learning_mode, location, now, user.id);

    // Update learner profile if provided
    if (primary_goal !== undefined || current_level !== undefined || skills_to_learn !== undefined) {
      db.prepare(`
        UPDATE learner_profiles
        SET primary_goal = COALESCE(?, primary_goal),
            current_level = COALESCE(?, current_level),
            target_level = COALESCE(?, target_level),
            skills_to_learn = COALESCE(?, skills_to_learn),
            updated_at = ?
        WHERE user_id = ?
      `).run(
        primary_goal,
        current_level,
        target_level,
        skills_to_learn ? JSON.stringify(skills_to_learn) : null,
        now,
        user.id
      );
    }

    // Update mentor profile if exists and fields provided
    if (skills_taught !== undefined || years_of_experience !== undefined || teaching_style !== undefined) {
      db.prepare(`
        UPDATE mentor_profiles
        SET skills_taught = COALESCE(?, skills_taught),
            years_of_experience = COALESCE(?, years_of_experience),
            teaching_style = COALESCE(?, teaching_style),
            availability_hours = COALESCE(?, availability_hours),
            hourly_rate_credits = COALESCE(?, hourly_rate_credits),
            updated_at = ?
        WHERE user_id = ?
      `).run(
        skills_taught ? JSON.stringify(skills_taught) : null,
        years_of_experience,
        teaching_style,
        availability_hours,
        hourly_rate_credits,
        now,
        user.id
      );
    }

    res.json({ message: 'Profile updated successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// LOGOUT
authRouter.post('/logout', requireAuth, (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      db.prepare('DELETE FROM auth_sessions WHERE token = ?').run(token);
    }
    res.json({ message: 'Logged out successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed.' });
  }
});
