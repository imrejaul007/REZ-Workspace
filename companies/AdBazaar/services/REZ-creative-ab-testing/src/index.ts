import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import { createLogger } from './utils/logger';
import abRoutes from './routes/ab.routes';

// Load environment variables
dotenv.config();

const logger = createLogger('REZ-CreativeABTesting');
const app = express();
const PORT = process.env.PORT || 4812;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  const startTime = Date.now();

  _res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.logApiRequest(req.path, req.method, duration, _res.statusCode);
  });

  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'REZ-creative-ab-testing',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API info
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    name: 'REZ Creative A/B Testing Service',
    version: '1.0.0',
    description: 'A/B testing service for ad creatives with statistical significance',
    endpoints: {
      tests: {
        'POST /api/tests': 'Create a new A/B test',
        'GET /api/tests': 'List all tests',
        'GET /api/tests/:testId': 'Get test details',
        'POST /api/tests/:testId/start': 'Start a test',
        'POST /api/tests/:testId/pause': 'Pause a test',
        'POST /api/tests/:testId/resume': 'Resume a test',
        'POST /api/tests/:testId/complete': 'Complete a test',
        'DELETE /api/tests/:testId': 'Archive a test',
        'GET /api/tests/:testId/results': 'Get test results',
        'POST /api/tests/:testId/assign': 'Assign variant to session',
      },
      events: {
        'POST /api/tests/events/impression': 'Record an impression',
        'POST /api/tests/events/click': 'Record a click',
        'POST /api/tests/events/conversion': 'Record a conversion',
      },
      stats: {
        'GET /api/tests/stats/service': 'Get service statistics',
      },
    },
  });
});

// API Routes
app.use('/api/tests', abRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    timestamp: new Date().toISOString(),
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`REZ-CreativeABTesting started on port ${PORT}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
  logger.info(`API info: http://localhost:${PORT}/api`);
});

export default app;
