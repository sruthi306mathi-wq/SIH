import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const DB_PATH = path.resolve(process.cwd(), 'learnx.db');

export const db = new DatabaseSync(DB_PATH);

// Enable WAL mode for high concurrency
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      avatar_url TEXT,
      role TEXT NOT NULL DEFAULT 'learner', -- 'learner', 'mentor', 'dual', 'assessor', 'admin'
      active_mode TEXT NOT NULL DEFAULT 'learner', -- 'learner', 'mentor', 'assessor', 'admin'
      bio TEXT DEFAULT '',
      language TEXT DEFAULT 'English',
      availability TEXT DEFAULT 'Flexible',
      learning_mode TEXT DEFAULT 'Online',
      location TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS auth_sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS learner_profiles (
      user_id TEXT PRIMARY KEY,
      primary_goal TEXT DEFAULT '',
      target_level TEXT DEFAULT 'Intermediate',
      current_level TEXT DEFAULT 'Beginner',
      preferred_mode TEXT DEFAULT '1-on-1 Sessions',
      hours_per_week INTEGER DEFAULT 5,
      skills_to_learn TEXT DEFAULT '[]', -- JSON array of skill strings
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS mentor_profiles (
      user_id TEXT PRIMARY KEY,
      skills_taught TEXT DEFAULT '[]', -- JSON array of strings
      years_of_experience INTEGER DEFAULT 3,
      hourly_rate_credits INTEGER DEFAULT 1,
      teaching_style TEXT DEFAULT 'Practical & Project-Based',
      bio TEXT DEFAULT '',
      qualifications TEXT DEFAULT '',
      is_verified INTEGER DEFAULT 0,
      learners_helped INTEGER DEFAULT 0,
      rating REAL DEFAULT 5.0,
      total_reviews INTEGER DEFAULT 0,
      availability_hours TEXT DEFAULT 'Weekday evenings & Weekends',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS skills (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      description TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_skills (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      skill_name TEXT NOT NULL,
      proficiency_level TEXT NOT NULL, -- Beginner, Intermediate, Advanced, Expert
      type TEXT NOT NULL, -- 'known', 'learning'
      years_experience REAL DEFAULT 0,
      verified_status TEXT DEFAULT 'unverified', -- unverified, ai_assessed, assessor_verified
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS experiences (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      profession TEXT NOT NULL,
      company TEXT DEFAULT '',
      years_exp REAL NOT NULL,
      responsibilities TEXT NOT NULL,
      tools_used TEXT NOT NULL,
      tasks_performed TEXT NOT NULL,
      ai_analysis_summary TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS qualifications (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      industry TEXT NOT NULL,
      code TEXT NOT NULL,
      required_competencies_json TEXT NOT NULL, -- JSON array of competency strings
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS qualification_mappings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      qualification_id TEXT NOT NULL,
      match_percentage INTEGER NOT NULL,
      matched_competencies_json TEXT NOT NULL,
      partial_competencies_json TEXT NOT NULL,
      missing_competencies_json TEXT NOT NULL,
      ai_reasoning TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(qualification_id) REFERENCES qualifications(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS assessments (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      skill_name TEXT NOT NULL,
      type TEXT NOT NULL, -- 'mcq', 'scenario', 'practical'
      questions_json TEXT NOT NULL, -- JSON array of question objects
      passing_score INTEGER NOT NULL DEFAULT 70,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS assessment_attempts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      assessment_id TEXT NOT NULL,
      score INTEGER NOT NULL,
      total_score INTEGER NOT NULL,
      passed INTEGER NOT NULL,
      answers_json TEXT NOT NULL,
      ai_feedback TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS evidence (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      skill_name TEXT NOT NULL,
      file_url TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_size INTEGER DEFAULT 0,
      ai_quality_score INTEGER DEFAULT 0,
      ai_analysis_notes TEXT DEFAULT '',
      assessor_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'verified', 'needs_more_evidence', 'rejected'
      assessor_notes TEXT DEFAULT '',
      assessor_id TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS competencies (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      skill_name TEXT NOT NULL,
      current_level TEXT NOT NULL,
      target_level TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'unverified', -- 'unverified', 'ai_assessed', 'assessor_verified'
      gap_notes TEXT DEFAULT '',
      verified_by TEXT,
      verified_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS mentor_requests (
      id TEXT PRIMARY KEY,
      learner_id TEXT NOT NULL,
      mentor_id TEXT NOT NULL,
      skill_name TEXT NOT NULL,
      goal_notes TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'requested', -- 'requested', 'accepted', 'rejected', 'completed', 'cancelled'
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(learner_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(mentor_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS learning_plans (
      id TEXT PRIMARY KEY,
      learner_id TEXT NOT NULL,
      mentor_id TEXT,
      skill_name TEXT NOT NULL,
      goal TEXT NOT NULL,
      target_date TEXT,
      status TEXT NOT NULL DEFAULT 'active', -- 'active', 'completed', 'paused'
      modules_json TEXT NOT NULL, -- JSON array of module objects
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(learner_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS learning_sessions (
      id TEXT PRIMARY KEY,
      mentor_id TEXT NOT NULL,
      learner_id TEXT NOT NULL,
      skill_name TEXT NOT NULL,
      scheduled_at TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL DEFAULT 60,
      status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled'
      meeting_link TEXT DEFAULT '',
      agenda TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      feedback TEXT DEFAULT '',
      time_credits_transferred INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY(mentor_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(learner_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      user1_id TEXT NOT NULL,
      user2_id TEXT NOT NULL,
      last_message_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user1_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(user2_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      receiver_id TEXT NOT NULL,
      content TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
      FOREIGN KEY(sender_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(receiver_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS time_credit_accounts (
      user_id TEXT PRIMARY KEY,
      balance INTEGER NOT NULL DEFAULT 3, -- 3 complimentary starter credits for new learners
      total_earned INTEGER NOT NULL DEFAULT 3,
      total_spent INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS time_credit_transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      type TEXT NOT NULL, -- 'earned', 'spent', 'starter_bonus'
      description TEXT NOT NULL,
      reference_session_id TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS skillproofs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      skill_name TEXT NOT NULL,
      verification_level TEXT NOT NULL, -- 'self_claimed', 'ai_assessed', 'community_verified', 'institution_verified'
      badge_code TEXT NOT NULL,
      verified_by TEXT NOT NULL,
      qr_payload TEXT NOT NULL,
      issued_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS certificates (
      id TEXT PRIMARY KEY,
      certificate_number TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL,
      pathway TEXT NOT NULL, -- 'learning_path', 'experience_recognition'
      skill_name TEXT NOT NULL,
      title TEXT NOT NULL,
      issue_date TEXT NOT NULL,
      grade TEXT NOT NULL DEFAULT 'Competent',
      verified_by TEXT NOT NULL,
      certificate_data_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL, -- 'request', 'session', 'message', 'verification', 'credit', 'system'
      is_read INTEGER DEFAULT 0,
      link TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      details TEXT DEFAULT '',
      ip_address TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ai_interactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      query_type TEXT NOT NULL,
      prompt TEXT NOT NULL,
      response TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Seed standard skills catalog and qualifications catalog if empty (standard industry standards, not fake user records)
  const skillCount = db.prepare('SELECT COUNT(*) as count FROM skills').get() as { count: number };
  if (skillCount.count === 0) {
    const standardSkills = [
      { id: 'sk_py', name: 'Python Programming', category: 'Software Engineering', description: 'Data structures, backend development, algorithms, and automated scripting.' },
      { id: 'sk_react', name: 'React & Frontend Architecture', category: 'Software Engineering', description: 'Modern UI engineering with state management, component lifecycle, and design systems.' },
      { id: 'sk_ds', name: 'Data Science & Machine Learning', category: 'Data & AI', description: 'Predictive modeling, Pandas, data exploration, evaluation metrics, and feature engineering.' },
      { id: 'sk_cloud', name: 'Cloud & DevOps Engineering', category: 'Infrastructure', description: 'Containerization, Docker, CI/CD pipelines, Kubernetes, and infrastructure as code.' },
      { id: 'sk_ux', name: 'UI/UX & Product Design', category: 'Design', description: 'User research, wireframing, high-fidelity Figma prototypes, design systems, and usability testing.' },
      { id: 'sk_cyber', name: 'Cybersecurity Fundamentals', category: 'Security', description: 'Vulnerability assessment, network defense, security auditing, and zero trust models.' },
      { id: 'sk_pm', name: 'Agile Product Management', category: 'Management', description: 'Sprint planning, user story mapping, backlog grooming, and product discovery.' },
      { id: 'sk_digital_mkt', name: 'Performance Marketing', category: 'Marketing', description: 'Data-driven funnel optimization, analytics, paid acquisition, and conversion optimization.' }
    ];

    const insertSkill = db.prepare(`INSERT INTO skills (id, name, category, description, created_at) VALUES (?, ?, ?, ?, ?)`);
    for (const s of standardSkills) {
      insertSkill.run(s.id, s.name, s.category, s.description, new Date().toISOString());
    }
  }

  // Seed standard qualifications catalog if empty
  const qualCount = db.prepare('SELECT COUNT(*) as count FROM qualifications').get() as { count: number };
  if (qualCount.count === 0) {
    const standardQuals = [
      {
        id: 'qual_swe_l4',
        title: 'Full-Stack Software Practitioner (Level 4)',
        industry: 'Information Technology',
        code: 'IT-SWE-L4',
        required_competencies_json: JSON.stringify([
          'Version Control & Collaborative Git Workflows',
          'RESTful / GraphQL API Design & Security',
          'Modern Frontend Architecture (React / TypeScript)',
          'Relational Database Modeling & Optimization',
          'Unit & Integration Testing'
        ])
      },
      {
        id: 'qual_ds_l4',
        title: 'Applied Data Science Specialist (Level 4)',
        industry: 'Data & Artificial Intelligence',
        code: 'AI-DS-L4',
        required_competencies_json: JSON.stringify([
          'Exploratory Data Analysis & Feature Engineering',
          'Supervised & Unsupervised Machine Learning Models',
          'Data Pipeline Automation (Python / SQL)',
          'Model Evaluation & Validation Metrics',
          'Data Storytelling & Executive Reporting'
        ])
      },
      {
        id: 'qual_cloud_l4',
        title: 'Cloud Solutions & DevOps Engineer (Level 4)',
        industry: 'Cloud Infrastructure',
        code: 'CLD-ENG-L4',
        required_competencies_json: JSON.stringify([
          'Containerization with Docker & Multi-stage Builds',
          'Continuous Integration & Continuous Deployment (CI/CD)',
          'Cloud Architecture & High Availability Principles',
          'Infrastructure Monitoring & Observability',
          'Zero Trust & Identity Access Management'
        ])
      },
      {
        id: 'qual_ux_l4',
        title: 'Human-Centered Digital Product Designer (Level 4)',
        industry: 'Digital Design',
        code: 'DES-HCD-L4',
        required_competencies_json: JSON.stringify([
          'Qualitative & Quantitative User Research',
          'Information Architecture & Wireframing',
          'Design System Architecture & Component Libraries',
          'Interactive Prototyping & Usability Testing',
          'Design Handoff & Frontend Engineering Alignment'
        ])
      }
    ];

    const insertQual = db.prepare(`INSERT INTO qualifications (id, title, industry, code, required_competencies_json, created_at) VALUES (?, ?, ?, ?, ?, ?)`);
    for (const q of standardQuals) {
      insertQual.run(q.id, q.title, q.industry, q.code, q.required_competencies_json, new Date().toISOString());
    }
  }

  // Seed default practical assessment questions catalog if empty
  const assessCount = db.prepare('SELECT COUNT(*) as count FROM assessments').get() as { count: number };
  if (assessCount.count === 0) {
    const standardAssessments = [
      {
        id: 'as_python_practical',
        title: 'Python Core Competency & Problem-Solving Assessment',
        skill_name: 'Python Programming',
        type: 'scenario',
        passing_score: 70,
        questions_json: JSON.stringify([
          {
            id: 'q1',
            question: 'When optimizing a high-throughput data processing pipeline in Python, which approach prevents the Global Interpreter Lock (GIL) from bottlenecking CPU-bound operations?',
            options: [
              'Using threading.Thread with asyncio concurrency',
              'Using multiprocessing.Pool or ProcessPoolExecutor to distribute workloads across processes',
              'Replacing lists with Python dict comprehensions',
              'Increasing sys.setswitchinterval value'
            ],
            correctIndex: 1,
            explanation: 'CPU-bound operations in CPython are constrained by the GIL; multiprocessing bypasses this by leveraging separate memory spaces and individual interpreter instances across CPU cores.'
          },
          {
            id: 'q2',
            question: 'In Python, what is the key behavioral difference between deepcopy() and copy() when duplicating a nested dictionary or object tree?',
            options: [
              'copy() creates recursive copies of child objects while deepcopy() does not',
              'deepcopy() recursively duplicates all nested objects, preserving independence from original mutated references',
              'deepcopy() only works on immutable tuples',
              'copy() converts dictionaries into immutable sets'
            ],
            correctIndex: 1,
            explanation: 'copy() produces a shallow copy where inner container references are shared, whereas deepcopy() traverses and duplicates compound objects recursively.'
          },
          {
            id: 'q3',
            question: 'You are designing a memory-efficient generator function to stream 10 million transaction records from a large dataset. What keyword and mechanism should you implement?',
            options: [
              'return with an enclosed list comprehension',
              'yield statement to produce a generator iterator evaluated lazily on demand',
              'sys.stdin.read() with fixed chunk buffering',
              'threading.Lock() with a global queue'
            ],
            correctIndex: 1,
            explanation: 'The yield keyword produces an iterator that yields one item at a time lazily, keeping memory consumption near O(1) regardless of record count.'
          },
          {
            id: 'q4',
            question: 'Which design pattern is best suited for implementing cross-cutting concerns such as execution timing, authentication verification, and retry logic in Python APIs?',
            options: [
              'Python Decorator (@decorator pattern) wrapping function execution',
              'Singleton pattern using metaclasses',
              'Strategy pattern using abstract base classes exclusively',
              'Factory pattern with dynamic eval()'
            ],
            correctIndex: 0,
            explanation: 'Decorators wrap callables cleanly, enabling separation of concerns like logging, timing, rate-limiting, and authentication without modifying core business logic.'
          }
        ])
      },
      {
        id: 'as_react_practical',
        title: 'React & Frontend Architecture Competency Assessment',
        skill_name: 'React & Frontend Architecture',
        type: 'scenario',
        passing_score: 70,
        questions_json: JSON.stringify([
          {
            id: 'q1',
            question: 'What is the primary architectural purpose of React 19 / modern React server components and suspense boundaries?',
            options: [
              'To completely eliminate the need for client-side JavaScript execution',
              'To stream UI chunks progressively, reduce client bundle payloads, and decouple data fetching from client waterfalls',
              'To replace CSS with WebAssembly styles',
              'To automatically convert all useState calls into Redux stores'
            ],
            correctIndex: 1,
            explanation: 'Server components and suspense enable streaming SSR, zero-bundle overhead for server logic, and structured coordination of asynchronous loading boundaries.'
          },
          {
            id: 'q2',
            question: 'A complex dashboard re-renders sluggishly when a parent state updates. You need to prevent unnecessary re-renders of a computationally intensive chart child component. What should you do?',
            options: [
              'Wrap the child with React.memo and ensure passed callback props are stable with useCallback and transformed data with useMemo',
              'Set window.shouldComponentUpdate = false',
              'Call forceUpdate inside useEffect',
              'Replace all props with window global variables'
            ],
            correctIndex: 0,
            explanation: 'React.memo performs shallow prop comparison; pairing it with useCallback and useMemo prevents unnecessary child re-renders caused by new object references.'
          },
          {
            id: 'q3',
            question: 'Why should side effects (e.g., subscribing to event emitters, setting intervals) return a cleanup function in useEffect?',
            options: [
              'To speed up CSS animations',
              'To prevent memory leaks and dangling subscriptions when components unmount or dependency values change',
              'To force the browser to reload the page',
              'To serialize state to localStorage'
            ],
            correctIndex: 1,
            explanation: 'The returned cleanup function is invoked before component unmounting and before subsequent effect runs, preventing memory leaks, stale closures, and race conditions.'
          }
        ])
      },
      {
        id: 'as_data_science_practical',
        title: 'Data Science & Machine Learning Practical Verification',
        skill_name: 'Data Science & Machine Learning',
        type: 'scenario',
        passing_score: 70,
        questions_json: JSON.stringify([
          {
            id: 'q1',
            question: 'When evaluating a fraud detection model with severe class imbalance (0.1% fraudulent transactions), which metric is the most informative?',
            options: [
              'Raw Accuracy',
              'Precision-Recall AUC (PR-AUC) and F1-Score',
              'Mean Squared Error (MSE)',
              'Adjusted R-squared'
            ],
            correctIndex: 1,
            explanation: 'Under extreme imbalance, high accuracy can be trivially achieved by predicting the majority class. Precision, Recall, and PR-AUC explicitly measure minority class performance.'
          },
          {
            id: 'q2',
            question: 'What is data leakage during the training pipeline, and how is it rigorously prevented?',
            options: [
              'Using uncompressed CSV files; prevented by using Parquet',
              'When target or test-set information inadvertently influences the training or preprocessing transformations; prevented by fitting scalers only on training splits',
              'Having too few epochs in neural network training',
              'Running GPU code on CPU'
            ],
            correctIndex: 1,
            explanation: 'Data leakage happens when information outside the training dataset influences model training. Preprocessing parameters must be learned strictly on the training partition.'
          }
        ])
      }
    ];

    const insertAssess = db.prepare(`INSERT INTO assessments (id, title, skill_name, type, questions_json, passing_score, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`);
    for (const a of standardAssessments) {
      insertAssess.run(a.id, a.title, a.skill_name, a.type, a.questions_json, a.passing_score, new Date().toISOString());
    }
  }

  // Seed default demonstration personas (Learner, Mentor, Assessor, Admin) if not existing
  const demoLearnerCheck = db.prepare('SELECT id FROM users WHERE email = ?').get('learner@learnx.org') as { id: string } | undefined;
  if (!demoLearnerCheck) {
    const defaultPasswordHash = hashPassword('password123');
    const now = new Date().toISOString();

    // 1. Learner persona: Alex Mercer
    const learnerId = 'usr_alex_mercer';
    db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, role, active_mode, bio, language, availability, learning_mode, location, created_at, updated_at)
      VALUES (?, 'learner@learnx.org', ?, 'Alex Mercer', 'learner', 'learner', 'Cloud & Software practitioner transitioning into scalable AI architectures.', 'English', 'Flexible (Evenings & Weekends)', 'Online 1-on-1', 'San Francisco, CA', ?, ?)
    `).run(learnerId, defaultPasswordHash, now, now);

    db.prepare(`
      INSERT INTO learner_profiles (user_id, primary_goal, target_level, current_level, preferred_mode, hours_per_week, skills_to_learn, created_at, updated_at)
      VALUES (?, 'Master Python & AI Systems Architecture', 'Advanced', 'Intermediate', '1-on-1 Sessions', 6, ?, ?, ?)
    `).run(learnerId, JSON.stringify(['Python Programming', 'React & Frontend Architecture', 'Data Science & Machine Learning']), now, now);

    db.prepare(`
      INSERT INTO time_credit_accounts (user_id, balance, total_earned, total_spent, updated_at)
      VALUES (?, 6, 6, 0, ?)
    `).run(learnerId, now);

    db.prepare(`
      INSERT INTO time_credit_transactions (id, user_id, amount, type, description, created_at)
      VALUES ('tx_init_alex', ?, 6, 'starter_bonus', 'Welcome bonus and initial peer credits', ?)
    `).run(learnerId, now);

    // Initial competencies for Alex
    db.prepare(`
      INSERT INTO competencies (id, user_id, skill_name, current_level, target_level, status, gap_notes, created_at)
      VALUES ('comp_alex_py', ?, 'Python Programming', 'Intermediate', 'Advanced', 'ai_assessed', 'Strong syntax and algorithms; practical multi-threading needs review.', ?)
    `).run(learnerId, now);

    db.prepare(`
      INSERT INTO competencies (id, user_id, skill_name, current_level, target_level, status, gap_notes, created_at)
      VALUES ('comp_alex_react', ?, 'React & Frontend Architecture', 'Beginner', 'Intermediate', 'unverified', 'Requires evidence and peer review on state synchronization.', ?)
    `).run(learnerId, now);

    // Initial evidence for Alex
    const alexAiNotes = JSON.stringify({
      qualityScore: 92,
      relevance: 'High',
      demonstratedCompetencies: ['Python async paradigms', 'Exception handling', 'Pytest test suites'],
      assessorRecommendation: 'Solid engineering principles, exception handling, and clean documentation.',
      analysisNotes: 'Candidate demonstrated exemplary backend engineering rigor.'
    });

    db.prepare(`
      INSERT INTO evidence (id, user_id, title, description, skill_name, file_url, file_type, file_name, file_size, ai_quality_score, ai_analysis_notes, assessor_status, assessor_notes, created_at)
      VALUES ('ev_alex_queue', ?, 'Distributed Task Queue Implementation in Python', 'Full production async worker queue with Redis backing, exponential backoff retries, and comprehensive pytest coverage.', 'Python Programming', 'https://example.com/evidence/task_queue.py', 'text/x-python', 'task_queue.py', 18400, 92, ?, 'verified', 'Verified by Lead Assessor Marcus Sterling. Exemplary work.', ?)
    `).run(learnerId, alexAiNotes, now);

    // Initial SkillProof badge for Alex
    db.prepare(`
      INSERT INTO skillproofs (id, user_id, skill_name, verification_level, badge_code, verified_by, qr_payload, issued_at)
      VALUES ('sp_alex_py', ?, 'Python Programming', 'institution_verified', 'LX-PY-90412', 'LearnX Assessment Board', 'LEARNX_VERIFIED:usr_alex_mercer:Python Programming:institution_verified', ?)
    `).run(learnerId, now);

    // Initial Certificate for Alex
    db.prepare(`
      INSERT INTO certificates (id, certificate_number, user_id, pathway, skill_name, title, issue_date, grade, verified_by, certificate_data_json, created_at)
      VALUES ('cert_alex_py', 'CERT-LX-2026-0042', ?, 'learning_path', 'Python Programming', 'Python Systems Practitioner Certificate', ?, 'Excellence', 'LearnX Academic Board', ?, ?)
    `).run(learnerId, now, JSON.stringify({ skills: ['Python Programming', 'Data Structures', 'Async IO'] }), now);

    // 2. Mentor persona: Dr. Elena Rostova
    const mentorId = 'usr_elena_rostova';
    db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, role, active_mode, bio, language, availability, learning_mode, location, created_at, updated_at)
      VALUES (?, 'mentor@learnx.org', ?, 'Dr. Elena Rostova', 'mentor', 'mentor', 'Senior Staff AI Engineer & university researcher with 8+ years experience in distributed systems.', 'English', 'Weekday Evenings & Weekends', 'Online 1-on-1', 'Boston, MA', ?, ?)
    `).run(mentorId, defaultPasswordHash, now, now);

    db.prepare(`
      INSERT INTO mentor_profiles (user_id, skills_taught, years_of_experience, hourly_rate_credits, teaching_style, bio, is_verified, learners_helped, rating, total_reviews, availability_hours, created_at, updated_at)
      VALUES (?, ?, 8, 1, 'Architecture-first with deep practical code reviews and live debugging', 'Senior Staff AI Engineer with 8+ years experience in distributed systems.', 1, 28, 4.95, 26, 'Weekday evenings & Saturdays', ?, ?)
    `).run(mentorId, JSON.stringify(['Python Programming', 'Data Science & Machine Learning', 'Cloud & DevOps Engineering']), now, now);

    db.prepare(`
      INSERT INTO time_credit_accounts (user_id, balance, total_earned, total_spent, updated_at)
      VALUES (?, 15, 22, 7, ?)
    `).run(mentorId, now);

    // Connect an incoming mentorship request from Alex to Elena
    db.prepare(`
      INSERT INTO mentor_requests (id, learner_id, mentor_id, skill_name, goal_notes, status, created_at, updated_at)
      VALUES ('req_alex_elena', ?, ?, 'Python Programming', 'Need mentorship on asynchronous scheduling and GIL avoidance techniques.', 'requested', ?, ?)
    `).run(learnerId, mentorId, now, now);

    // Scheduled session between Elena and Alex
    const futureSession = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    db.prepare(`
      INSERT INTO learning_sessions (id, mentor_id, learner_id, skill_name, scheduled_at, duration_minutes, status, meeting_link, agenda, notes, feedback, time_credits_transferred, created_at)
      VALUES ('sess_elena_alex', ?, ?, 'Python Programming', ?, 60, 'scheduled', 'https://meet.google.com/lx-py-elena', 'Deep dive into concurrent asyncio paradigms and unit tests', '', '', 0, ?)
    `).run(mentorId, learnerId, futureSession, now);

    // 3. Second Mentor persona: David Chen (Cloud & DevOps)
    const mentor2Id = 'usr_david_chen';
    db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, role, active_mode, bio, language, availability, learning_mode, location, created_at, updated_at)
      VALUES (?, 'david.chen@learnx.org', ?, 'David Chen', 'mentor', 'mentor', 'DevOps & SRE Architect specializing in Kubernetes, CI/CD, and zero-trust cloud infrastructure.', 'English', 'Weekends Only', 'Project Coaching', 'Seattle, WA', ?, ?)
    `).run(mentor2Id, defaultPasswordHash, now, now);

    db.prepare(`
      INSERT INTO mentor_profiles (user_id, skills_taught, years_of_experience, hourly_rate_credits, teaching_style, bio, is_verified, learners_helped, rating, total_reviews, availability_hours, created_at, updated_at)
      VALUES (?, ?, 6, 1, 'Hands-on live CLI sessions, Docker build teardowns, and infrastructure as code', 'DevOps & SRE Architect specializing in Kubernetes, CI/CD, and zero-trust cloud infrastructure.', 1, 19, 4.88, 17, 'Weekends (Saturday & Sunday)', ?, ?)
    `).run(mentor2Id, JSON.stringify(['Cloud & DevOps Engineering', 'Python Programming']), now, now);

    db.prepare(`
      INSERT INTO time_credit_accounts (user_id, balance, total_earned, total_spent, updated_at)
      VALUES (?, 9, 14, 5, ?)
    `).run(mentor2Id, now);

    // 4. Third Mentor persona: Sarah Jenkins (React & UI Design)
    const mentor3Id = 'usr_sarah_jenkins';
    db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, role, active_mode, bio, language, availability, learning_mode, location, created_at, updated_at)
      VALUES (?, 'sarah.jenkins@learnx.org', ?, 'Sarah Jenkins', 'mentor', 'mentor', 'Lead Design Systems Engineer & React specialist crafting high-accessibility web apps.', 'English', 'Flexible', 'Online 1-on-1', 'Austin, TX', ?, ?)
    `).run(mentor3Id, defaultPasswordHash, now, now);

    db.prepare(`
      INSERT INTO mentor_profiles (user_id, skills_taught, years_of_experience, hourly_rate_credits, teaching_style, bio, is_verified, learners_helped, rating, total_reviews, availability_hours, created_at, updated_at)
      VALUES (?, ?, 5, 1, 'Component architecture design reviews, state decoupling, and interactive prototyping', 'Lead Design Systems Engineer & React specialist crafting high-accessibility web apps.', 1, 22, 5.0, 20, 'Flexible weekday evenings', ?, ?)
    `).run(mentor3Id, JSON.stringify(['React & Frontend Architecture', 'UI/UX & Product Design']), now, now);

    db.prepare(`
      INSERT INTO time_credit_accounts (user_id, balance, total_earned, total_spent, updated_at)
      VALUES (?, 11, 16, 5, ?)
    `).run(mentor3Id, now);

    // 5. Assessor persona: Marcus Sterling
    const assessorId = 'usr_marcus_sterling';
    db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, role, active_mode, bio, language, availability, learning_mode, location, created_at, updated_at)
      VALUES (?, 'assessor@learnx.org', ?, 'Marcus Sterling', 'assessor', 'assessor', 'Certified Technical Competency Assessor & Lead Accreditation Reviewer.', 'English', 'Weekdays', 'Online', 'New York, NY', ?, ?)
    `).run(assessorId, defaultPasswordHash, now, now);

    db.prepare(`
      INSERT INTO time_credit_accounts (user_id, balance, total_earned, total_spent, updated_at)
      VALUES (?, 8, 8, 0, ?)
    `).run(assessorId, now);

    // Pending evidence waiting for assessor review in queue
    const pendingAiNotes = JSON.stringify({
      qualityScore: 88,
      relevance: 'High',
      demonstratedCompetencies: ['React design systems', 'TypeScript generics', 'ARIA accessibility'],
      assessorRecommendation: 'Well-documented props interface, ARIA attributes included, awaiting manual assessor verification.',
      analysisNotes: 'Candidate provided modular component structure.'
    });

    db.prepare(`
      INSERT INTO evidence (id, user_id, title, description, skill_name, file_url, file_type, file_name, file_size, ai_quality_score, ai_analysis_notes, assessor_status, assessor_notes, created_at)
      VALUES ('ev_pending_react', ?, 'React Enterprise Component Library & Storybook Specs', 'Reusable design system implementation with automated accessibility tests and TypeScript generics.', 'React & Frontend Architecture', 'https://example.com/evidence/ui_system.tsx', 'text/typescript', 'ui_system.tsx', 24100, 88, ?, 'pending', '', ?)
    `).run(learnerId, pendingAiNotes, now);

    // 6. Admin persona: System Admin
    const adminId = 'usr_system_admin';
    db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, role, active_mode, bio, language, availability, learning_mode, location, created_at, updated_at)
      VALUES (?, 'admin@learnx.org', ?, 'System Admin', 'admin', 'admin', 'LearnX Platform Operations & Database Administrator.', 'English', '24/7', 'System', 'Remote', ?, ?)
    `).run(adminId, defaultPasswordHash, now, now);

    db.prepare(`
      INSERT INTO time_credit_accounts (user_id, balance, total_earned, total_spent, updated_at)
      VALUES (?, 25, 25, 0, ?)
    `).run(adminId, now);

    // Notification for Alex
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, is_read, link, created_at)
      VALUES ('notif_alex_1', ?, 'Welcome to LearnX', 'Your account is loaded with 6 Time Credits. You have 1 verified SkillProof badge and upcoming mentorship sessions.', 'system', 0, '/dashboard', ?)
    `).run(learnerId, now);

    console.log('Seeded demo accounts successfully (learner@learnx.org, mentor@learnx.org, assessor@learnx.org, admin@learnx.org).');
  }

  console.log('LearnX database initialized successfully with persistent SQLite.');
}
