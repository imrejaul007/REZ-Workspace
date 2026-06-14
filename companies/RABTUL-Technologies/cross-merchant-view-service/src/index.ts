// Cross-Merchant View Service - Main Entry Point
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

import analyticsRoutes from './routes/analyticsRoutes';
import customerRoutes from './routes/customerRoutes';
import { connectDB } from './models';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 4097;

// Security
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'], credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 1000, message: { success: false, error: { code: 'RATE_LIMITED' } } }));

// Logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, { ip: req.ip });
  next();
});

// Health
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'cross-merchant-view', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// Routes
app.use('/api/analytics', analyticsRoutes);
app.use('/api/customers', customerRoutes);

// Metrics
app.get('/metrics', (_req: Request, res: Response) => {
  res.json({ uptime: process.uptime(), memory: process.memoryUsage(), timestamp: new Date().toISOString() });
});

// 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
});

// Start server with DB connection
async function start(): Promise<void> {
  try {
    await connectDB();
    app.listen(PORT, () => {
      logger.info(`Cross-Merchant View Service started on port ${PORT}`);
      logger.info(`Health: http://localhost:${PORT}/health`);
      logger.info(`API: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

start();

export default app;
