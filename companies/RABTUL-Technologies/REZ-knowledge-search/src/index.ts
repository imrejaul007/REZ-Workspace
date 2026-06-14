import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import logger from './utils/logger';
import knowledgeRoutes from './routes/knowledge';

const app = express();
const PORT = process.env.PORT || 4311;

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
  res.json({ service: 'REZ Knowledge Search', version: '1.0.0', status: 'healthy' });
});

app.get('/api', (_req, res) => {
  res.json({
    service: 'REZ Knowledge Search',
    version: '1.0.0',
    description: 'Vector search service for knowledge layer',
    endpoints: {
      'POST /api/documents': 'Index document',
      'POST /api/documents/bulk': 'Bulk index',
      'GET /api/documents': 'List documents',
      'GET /api/documents/stats': 'Get index stats',
      'GET /api/documents/:id': 'Get document by ID',
      'PUT /api/documents/:id': 'Update document',
      'DELETE /api/documents/:id': 'Delete document',
      'GET /api/search?q=': 'Search documents',
      'POST /api/search': 'Search documents (POST)',
    },
  });
});

app.use('/api', knowledgeRoutes);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  logger.info(`REZ Knowledge Search running on port ${PORT}`);
  logger.info(`   Health: http://localhost:${PORT}/health`);
  logger.info(`   API: http://localhost:${PORT}/api`);
});

export { app };
