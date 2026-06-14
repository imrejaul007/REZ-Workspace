import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import expressMongoSanitize from 'express-mongo-sanitize';

import { validateEnv } from './config/env';
import { connectMongoDB } from './config/mongodb';
import { getRedisClient } from './config/redis';
import { logger } from './utils/logger';

// Routes
import {
  consumerRoutes,
  merchantRoutes,
  creatorRoutes,
  campaignRoutes,
  analyticsRoutes,
  fraudRoutes,
  internalRoutes,
  aiRoutes,
} from './routes';
import batchRoutes from './routes/batchRoutes';
import metricsRoutes from './routes/metrics';

// Middleware
import { apiRateLimiter, referralRateLimiter } from './middleware/rateLimiter';

const app = express();

const env = validateEnv();

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token', 'X-Internal-Service', 'X-Device-Id'],
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// MongoDB sanitization
app.use(expressMongoSanitize());

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`[${req.method}] ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'rez-referral-os',
    timestamp: new Date().toISOString(),
  });
});

// Ready check
app.get('/ready', async (req: Request, res: Response) => {
  try {
    const redis = getRedisClient();
    await redis.ping();
    res.json({
      status: 'ready',
      mongodb: 'connected',
      redis: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      error: (error as Error).message,
    });
  }
});

// API routes
app.use('/api/consumer', apiRateLimiter, consumerRoutes);
app.use('/api/merchant', apiRateLimiter, merchantRoutes);
app.use('/api/creator', apiRateLimiter, creatorRoutes);
app.use('/api/campaigns', apiRateLimiter, campaignRoutes);
app.use('/api/analytics', apiRateLimiter, analyticsRoutes);
app.use('/api/fraud', fraudRoutes);
app.use('/api/ai', apiRateLimiter, aiRoutes);

// Internal routes (with stricter rate limiting)
app.use('/internal', referralRateLimiter, internalRoutes);
app.use('/internal', batchRoutes);

// Monitoring routes (no auth)
app.use('/', metricsRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: { code: 'RES_001', message: 'Endpoint not found' },
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('[Error]', {
    path: req.path,
    method: req.method,
    error: err.message,
    stack: err.stack,
  });

  res.status(500).json({
    success: false,
    error: { code: 'SRV_001', message: 'Internal server error' },
  });
});

// Graceful shutdown
async function shutdown(): Promise<void> {
  logger.info('[Server] Shutting down...');

  const redis = getRedisClient();
  await redis.quit();

  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
async function start(): Promise<void> {
  try {
    // Connect to MongoDB
    await connectMongoDB();

    // Test Redis connection
    const redis = getRedisClient();
    await redis.ping();
    logger.info('[Redis] Connected');

    // Start listening
    const PORT = env.PORT;
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`[Server] REZ Referral OS listening on port ${PORT}`);
      logger.info(`[Server] Health: http://localhost:${PORT}/health`);
      logger.info(`[Server] Ready: http://localhost:${PORT}/ready`);
    });
  } catch (error) {
    logger.error('[Server] Failed to start:', error);
    process.exit(1);
  }
}

start().catch((error) => {
  logger.error('[Server] Unhandled error:', error);
  process.exit(1);
});

export default app;
