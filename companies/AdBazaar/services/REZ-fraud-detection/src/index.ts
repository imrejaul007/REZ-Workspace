import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import { createLogger } from './utils/logger';
import fraudRoutes from './routes/fraud.routes';

// Load environment variables
dotenv.config();

const logger = createLogger('REZ-FraudDetection');
const app = express();
const PORT = process.env.PORT || 4811;

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
    service: 'REZ-fraud-detection',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API info
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    name: 'REZ Fraud Detection Service',
    version: '1.0.0',
    description: 'Ad fraud detection with bot detection, click fraud patterns, and viewability scoring',
    endpoints: {
      'POST /api/check': 'Check a single event for fraud',
      'POST /api/check/bulk': 'Check multiple events for fraud (max 100)',
      'GET /api/result/:sessionId': 'Get cached fraud check result',
      'GET /api/session/:sessionId': 'Get session information',
      'DELETE /api/session/:sessionId': 'Clear session data',
      'GET /api/stats': 'Get service statistics',
    },
  });
});

// API Routes
app.use('/api', fraudRoutes);

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
  logger.info(`REZ-FraudDetection started on port ${PORT}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
  logger.info(`API info: http://localhost:${PORT}/api`);
});

export default app;
