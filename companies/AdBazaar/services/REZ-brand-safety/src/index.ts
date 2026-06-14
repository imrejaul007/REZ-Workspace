import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import { createLogger } from './utils/logger';
import brandRoutes from './routes/brand.routes';

// Load environment variables
dotenv.config();

const logger = createLogger('REZ-BrandSafety');
const app = express();
const PORT = process.env.PORT || 4813;

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
    service: 'REZ-brand-safety',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API info
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    name: 'REZ Brand Safety Service',
    version: '1.0.0',
    description: 'Content moderation with keyword filtering and brand whitelisting',
    endpoints: {
      content: {
        'POST /api/check': 'Check content for brand safety',
        'POST /api/check/batch': 'Batch check content (max 100)',
      },
      keywords: {
        'GET /api/keywords': 'List keyword rules',
        'POST /api/keywords': 'Create keyword rule',
        'PUT /api/keywords/:ruleId': 'Update keyword rule',
        'DELETE /api/keywords/:ruleId': 'Delete keyword rule',
        'POST /api/keywords/:ruleId/toggle': 'Enable/disable rule',
      },
      brands: {
        'GET /api/brands': 'List brand rules',
        'POST /api/brands': 'Create brand rule',
        'DELETE /api/brands/:ruleId': 'Delete brand rule',
      },
      categories: {
        'GET /api/categories': 'List default categories',
        'GET /api/categories/excluded': 'Get excluded categories',
      },
      settings: {
        'GET /api/settings/safety-level': 'Get default safety level',
        'PUT /api/settings/safety-level': 'Set default safety level',
      },
      stats: {
        'GET /api/stats': 'Get service statistics',
      },
    },
  });
});

// API Routes
app.use('/api', brandRoutes);

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
  logger.info(`REZ-BrandSafety started on port ${PORT}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
  logger.info(`API info: http://localhost:${PORT}/api`);
});

export default app;
