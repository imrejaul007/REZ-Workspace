import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rapp.use((req: Request, res: Response, next: NextFunction) => {
  (req as any).requestId = (req.headers['x-request-id'] as string) || uuidv4();
  res.setHeader('X-Request-ID', (req as any).requestId);
  next();
});

  ateLimit from 'express-rate-limit';
import logger from './utils/logger';
import traceRoutes from './routes/traces';

const app = express();
const PORT = process.env.PORT || 4308;

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
  res.json({ service: 'REZ Agent Observability', version: '1.0.0', status: 'healthy' });
});

app.get('/api', (_req, res) => {
  res.json({
    service: 'REZ Agent Observability',
    version: '1.0.0',
    description: 'Agent execution tracing and observability',
    endpoints: {
      'POST /api/traces': 'Create new trace',
      'GET /api/traces': 'Search traces',
      'GET /api/traces/:id': 'Get trace by ID',
      'GET /api/traces/workflow/:workflowId': 'Get traces by workflow',
      'GET /api/traces/agent/:agentId': 'Get traces by agent',
      'GET /api/traces/trace/:traceId': 'Get trace by trace ID',
      'PATCH /api/traces/:id': 'Update trace',
      'POST /api/traces/:id/complete': 'Complete trace',
      'POST /api/traces/:id/fail': 'Fail trace',
      'POST /api/traces/:id/events': 'Add event to trace',
      'GET /api/metrics': 'Get metrics',
      'GET /api/metrics/summary': 'Get execution summary',
      'GET /api/alerts': 'Get alert rules',
    },
  });
});

app.use('/api', traceRoutes);
app.use('/api/traces', traceRoutes);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Route not found', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  logger.info(`REZ Agent Observability running on port ${PORT}`);
  logger.info(`   Health: http://localhost:${PORT}/health`);
  logger.info(`   API: http://localhost:${PORT}/api`);
});

export { app };
