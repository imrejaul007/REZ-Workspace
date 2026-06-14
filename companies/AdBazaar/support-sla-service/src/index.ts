/**
 * AdBazaar - Support SLA Service
 * SLA tracking and breach alerts
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { slaRoutes } from './routes/slaRoutes';
import { slaMetrics } from './utils/metrics';
import logger from 'utils/logger.js';

const app = express();
const PORT = parseInt(process.env.PORT || '5085', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/support-sla';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many requests, please try again later.',
});
app.use('/api/', limiter);

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  const start = Date.now();
  _res.on('finish', () => {
    const duration = Date.now() - start;
    logger.httpRequest(req.method, req.path, _res.statusCode, duration);
    slaMetrics.recordRequestDuration(req.path, duration);
  });
  next();
});

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'support-sla-service',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// Metrics endpoint
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', slaMetrics.register.contentType);
  res.end(await slaMetrics.register.metrics());
});

// API Routes
app.use('/api/sla', slaRoutes);

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Database connection and server start
const startServer = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB', { uri: MONGODB_URI });

    app.listen(PORT, () => {
      logger.info(`Support SLA Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

startServer();

export default app;