import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import logger from './utils/logger';
import workflowRoutes from './routes/workflows';

const app = express();
const PORT = process.env.PORT || 4306;

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
  res.json({ service: 'REZ Workflow Templates', version: '1.0.0', status: 'healthy' });
});

app.get('/api', (_req, res) => {
  res.json({
    service: 'REZ Workflow Templates',
    version: '1.0.0',
    endpoints: {
      'GET /api/workflows': 'List all templates',
      'GET /api/workflows/:id': 'Get template by ID',
      'GET /api/workflows/categories': 'List categories',
      'GET /api/workflows/industries': 'List industries',
      'GET /api/workflows/featured': 'Featured templates',
      'GET /api/workflows/search?q=': 'Search templates',
      'POST /api/workflows/:id/instantiate': 'Create workflow from template',
    },
  });
});

app.use('/api/workflows', workflowRoutes);
app.use('/api/templates', workflowRoutes);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  logger.info(`REZ Workflow Templates Service running on port ${PORT}`);
  logger.info(`   Health: http://localhost:${PORT}/health`);
  logger.info(`   API: http://localhost:${PORT}/api`);
});

export { app };
