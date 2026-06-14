import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import logger from './utils/logger';
import sessionRoutes from './routes/sessions';

const app = express();
const PORT = process.env.PORT || 4312;

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: { error: 'Too many requests' } }));

app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

app.get('/health', (_req, res) => {
  res.json({ service: 'REZ Session Manager', version: '1.0.0', status: 'healthy' });
});

app.get('/api', (_req, res) => {
  res.json({
    service: 'REZ Session Manager',
    version: '1.0.0',
    description: 'AI agent session management with context preservation',
    endpoints: {
      'POST /api/sessions': 'Create session',
      'GET /api/sessions': 'List sessions',
      'GET /api/sessions/active': 'Get active sessions',
      'GET /api/sessions/stats': 'Get session stats',
      'GET /api/sessions/:id': 'Get session by ID',
      'DELETE /api/sessions/:id': 'Delete session',
      'POST /api/sessions/:id/messages': 'Add message',
      'GET /api/sessions/:id/messages': 'Get messages',
      'PATCH /api/sessions/:id/context': 'Update context',
      'POST /api/sessions/:id/memory': 'Add memory',
      'GET /api/sessions/:id/memory': 'Get memory',
      'PATCH /api/sessions/:id/state': 'Update state',
      'POST /api/sessions/:id/resume': 'Resume session',
      'POST /api/sessions/:id/pause': 'Pause session',
      'POST /api/sessions/:id/complete': 'Complete session',
    },
  });
});

app.use('/api/sessions', sessionRoutes);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  logger.info(`REZ Session Manager running on port ${PORT}`);
  logger.info(`   Health: http://localhost:${PORT}/health`);
  logger.info(`   API: http://localhost:${PORT}/api`);
});

export { app };
