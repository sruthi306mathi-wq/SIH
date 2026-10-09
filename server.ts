import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { initDatabase, db } from './server/db';
import { addClient } from './server/events';
import { authRouter } from './server/routes/auth';
import { mentorsRouter } from './server/routes/mentors';
import { learningRouter } from './server/routes/learning';
import { recognitionRouter } from './server/routes/recognition';
import { assessmentsRouter } from './server/routes/assessments';
import { evidenceRouter } from './server/routes/evidence';
import { skillproofRouter } from './server/routes/skillproof';
import { timeCreditsRouter } from './server/routes/timecredits';
import { chatRouter } from './server/routes/chat';
import { dashboardRouter } from './server/routes/dashboard';
import { assistantRouter } from './server/routes/assistant';
import { adminRouter } from './server/routes/admin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  // Initialize persistent SQLite database
  initDatabase();

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Middleware
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // Real-time SSE Event Stream
  app.get('/api/events', (req, res) => {
    const token = req.query.token as string;
    if (!token) {
      res.status(401).send('Unauthorized');
      return;
    }

    const session = db.prepare('SELECT user_id, expires_at FROM auth_sessions WHERE token = ?').get(token) as { user_id: string; expires_at: string } | undefined;
    if (!session || new Date(session.expires_at) < new Date()) {
      res.status(401).send('Session expired');
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    res.write('event: CONNECTED\ndata: {"status":"connected"}\n\n');
    addClient(session.user_id, res);

    // Keepalive ping every 25 seconds
    const interval = setInterval(() => {
      try {
        res.write(':\n\n');
      } catch (e) {
        clearInterval(interval);
      }
    }, 25000);

    req.on('close', () => {
      clearInterval(interval);
    });
  });

  // API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/mentors', mentorsRouter);
  app.use('/api/learning', learningRouter);
  app.use('/api/recognition', recognitionRouter);
  app.use('/api/assessments', assessmentsRouter);
  app.use('/api/evidence', evidenceRouter);
  app.use('/api/skillproof', skillproofRouter);
  app.use('/api/timecredits', timeCreditsRouter);
  app.use('/api/chat', chatRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/assistant', assistantRouter);
  app.use('/api/admin', adminRouter);

  // Vite dev server or static build
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LearnX Full-Stack Platform running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal startup error in LearnX server:', err);
  process.exit(1);
});
