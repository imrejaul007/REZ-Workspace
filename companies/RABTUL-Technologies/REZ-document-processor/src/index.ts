import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import logger from './utils/logger';
import documentRoutes from './routes/documents';

const app = express();
const PORT = process.env.PORT || 4309;

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
  res.json({ service: 'REZ Document Processor', version: '1.0.0', status: 'healthy' });
});

app.get('/api', (_req, res) => {
  res.json({
    service: 'REZ Document Processor',
    version: '1.0.0',
    description: 'Document processing - PDF/DOCX parsing and analysis',
    endpoints: {
      'POST /api/documents': 'Upload document',
      'GET /api/documents': 'Search documents',
      'GET /api/documents/stats': 'Get statistics',
      'GET /api/documents/:id': 'Get document by ID',
      'POST /api/documents/:id/process': 'Process document',
      'GET /api/documents/:id/sections': 'Get sections',
      'GET /api/documents/:id/entities': 'Get entities',
      'GET /api/jobs/:jobId': 'Get job status',
    },
  });
});

app.use('/api/documents', documentRoutes);
app.use('/api', documentRoutes);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  logger.info(`REZ Document Processor running on port ${PORT}`);
  logger.info(`   Health: http://localhost:${PORT}/health`);
  logger.info(`   API: http://localhost:${PORT}/api`);
});

export { app };
