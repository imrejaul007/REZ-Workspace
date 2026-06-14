/**
 * AdBazaar - Canned Response Service
 * Support response template management
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { responseRoutes } from './routes/responseRoutes';
import { categoryRoutes } from './routes/categoryRoutes';
import { cannedMetrics } from './utils/metrics';
import logger from './utils/logger';

const app = express();
const PORT = parseInt(process.env.PORT || '5086', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/canned-responses';

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
    cannedMetrics.recordRequestDuration(req.path, duration);
  });
  next();
});

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'canned-response-service',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// Metrics endpoint
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', cannedMetrics.register.contentType);
  res.end(await cannedMetrics.register.metrics());
});

// API Routes
app.use('/api/responses', responseRoutes);
app.use('/api/categories', categoryRoutes);

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
      logger.info(`Canned Response Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

startServer();

export default app;