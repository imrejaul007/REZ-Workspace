import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import logger from './utils/logger';
import approvalRoutes from './routes/approvals';

const app = express();
const PORT = process.env.PORT || 4307;

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
  res.json({ service: 'REZ Approval Service', version: '1.0.0', status: 'healthy' });
});

app.get('/api', (_req, res) => {
  res.json({
    service: 'REZ Approval Service',
    version: '1.0.0',
    description: 'Human-in-loop approval checkpoints for workflows',
    endpoints: {
      'POST /api/approvals': 'Create approval request',
      'GET /api/approvals': 'List approvals',
      'GET /api/approvals/stats': 'Get approval statistics',
      'GET /api/approvals/pending': 'Get pending approvals',
      'GET /api/approvals/:id': 'Get approval by ID',
      'POST /api/approvals/:id/resolve': 'Resolve approval',
      'POST /api/approvals/:id/cancel': 'Cancel approval',
      'POST /api/approvals/:id/comment': 'Add comment',
      'POST /api/approvals/:id/reassign': 'Reassign approval',
      'GET /api/approvals/templates': 'List approval templates',
    },
  });
});

app.use('/api/approvals', approvalRoutes);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  logger.info(`REZ Approval Service running on port ${PORT}`);
  logger.info(`   Health: http://localhost:${PORT}/health`);
  logger.info(`   API: http://localhost:${PORT}/api`);
});

export { app };
