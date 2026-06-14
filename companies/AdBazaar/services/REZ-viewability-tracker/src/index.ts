import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import { createLogger } from './utils/logger';
import trackingRoutes from './routes/tracking.routes';

// Load environment variables
dotenv.config();

const logger = createLogger('REZ-ViewabilityTracker');
const app = express();
const PORT = process.env.PORT || 4814;

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
    service: 'REZ-viewability-tracker',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API info
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    name: 'REZ Viewability Tracker Service',
    version: '1.0.0',
    description: 'IAB viewability tracking with active view measurement and completion rates',
    endpoints: {
      tracking: {
        'POST /api/track/impression': 'Track an impression',
        'POST /api/track/view': 'Track view events',
        'POST /api/track/video': 'Track video events',
        'GET /api/track/impression/:impressionId': 'Get impression details',
        'GET /api/track/metrics/:adId': 'Get viewability metrics for an ad',
      },
      reports: {
        'GET /api/track/report': 'Get viewability report',
        'GET /api/track/history/:adId': 'Get historical viewability',
        'POST /api/track/compare': 'Compare viewability across ads',
      },
      stats: {
        'GET /api/track/stats': 'Get service statistics',
      },
    },
  });
});

// API Routes
app.use('/api/track', trackingRoutes);

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
  logger.info(`REZ-ViewabilityTracker started on port ${PORT}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
  logger.info(`API info: http://localhost:${PORT}/api`);
});

export default app;
