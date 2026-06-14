import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import logger from './utils/logger';
import executorRoutes from './routes/executor';

const app = express();
const PORT = process.env.PORT || 4310;

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
  res.json({ service: 'REZ Workflow Executor', version: '1.0.0', status: 'healthy' });
});

app.get('/api', (_req, res) => {
  res.json({
    service: 'REZ Workflow Executor',
    version: '1.0.0',
    description: 'Workflow execution engine with node-based processing',
    endpoints: {
      'POST /api/workflows': 'Create workflow',
      'GET /api/workflows': 'List workflows',
      'GET /api/workflows/:id': 'Get workflow by ID',
      'POST /api/executions': 'Create and start execution',
      'GET /api/executions': 'List executions',
      'GET /api/executions/stats': 'Get statistics',
      'GET /api/executions/:id': 'Get execution by ID',
      'GET /api/executions/:id/events': 'Get execution events',
      'POST /api/executions/:id/cancel': 'Cancel execution',
    },
  });
});

app.use('/api', executorRoutes);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  logger.info(`REZ Workflow Executor running on port ${PORT}`);
  logger.info(`   Health: http://localhost:${PORT}/health`);
  logger.info(`   API: http://localhost:${PORT}/api`);
});

export { app };
