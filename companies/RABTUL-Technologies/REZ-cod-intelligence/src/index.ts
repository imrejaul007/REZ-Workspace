/**
 * REZ COD Intelligence Service
 * RTO prediction, fraud detection, risk scoring
 */

import express, { Request, Response, NextFunction } from 'express';
import logger from './utils/logger';
import { tracingMiddleware } from './middleware/tracing';
import mongoose from 'mongoose';
import cors from 'cors';

// Routes
import scoreRouter from './routes/score';
import ordersRouter from './routes/orders';
import analyticsRouter from './routes/analytics';

const app = express();
const PORT = process.env.PORT || 4040;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cod-intelligence';

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'cod-intelligence',
    timestamp: new Date().toISOString(),
  });
});

// API info
app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'REZ COD Intelligence',
    version: '1.0.0',
    description: 'RTO prediction, fraud detection, and risk scoring',
    endpoints: {
      score: 'POST /api/score - Score order risk',
      orders: 'POST /api/orders - Log order',
      analytics: 'GET /api/analytics - Get analytics',
    },
  });
});

// Routes
app.use('/api/score', scoreRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/analytics', analyticsRouter);

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Connect to MongoDB and start
async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('✅ Connected to MongoDB');

    app.listen(PORT, () => {
      logger.info(`🚀 COD Intelligence running on port ${PORT}`);
      logger.info(`   Health: http://localhost:${PORT}/health`);
      logger.info(`   API: http://localhost:${PORT}/api/score`);
    });
  } catch (error) {
    logger.error('❌ Failed to start:', error);
    process.exit(1);
  }
}

start();
