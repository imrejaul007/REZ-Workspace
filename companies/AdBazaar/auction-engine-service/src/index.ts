import express, { Express, Request, Response } from 'express';
import mongoose from 'mongoose';
import { createClient, RedisClientType } from 'redis';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import fs from 'fs';

import logger from 'utils/logger.js';
import { register } from './utils/metrics';
import { auctionRoutes } from './routes';
import { internalServiceAuth, requestLogger, errorHandler, rateLimiter } from './middleware';

const PORT = process.env.PORT || 4961;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/auction-engine';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Redis client
let redisClient: RedisClientType | null = null;

// MongoDB connection
async function connectMongoDB(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB', { uri: MONGODB_URI });
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error: error instanceof Error ? error.message : 'Unknown error' });
    throw error;
  }
}

// Redis connection
async function connectRedis(): Promise<void> {
  try {
    redisClient = createClient({ url: REDIS_URL });
    redisClient.on('error', (err: Error) => logger.error('Redis error', { error: err.message }));
    redisClient.on('connect', () => logger.info('Connected to Redis', { url: REDIS_URL }));
    await redisClient.connect();
  } catch (error) {
    logger.warn('Redis connection failed, continuing without Redis', { error: error instanceof Error ? error.message : 'Unknown error' });
    redisClient = null;
  }
}

// Create Express app
function createApp(): Express {
  const app = express();

  // Security middleware
  app.use(helmet());

  // Compression
  app.use(compression());

  // CORS
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:4961'],
    credentials: true,
  }));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Request logging
  app.use(requestLogger);

  // Rate limiting
  app.use(rateLimiter);

  // Ensure logs directory exists
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  // Health check endpoints
  app.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'auction-engine-service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  app.get('/health/ready', async (req: Request, res: Response) => {
    const checks = {
      mongodb: mongoose.connection.readyState === 1,
      redis: redisClient?.isReady || false,
    };

    const isReady = checks.mongodb; // MongoDB is required
    const status = isReady ? 'ok' : 'degraded';

    res.status(isReady ? 200 : 503).json({
      status,
      service: 'auction-engine-service',
      checks,
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/health/live', (req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  // Prometheus metrics endpoint
  app.get('/metrics', async (req: Request, res: Response) => {
    try {
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    } catch (error) {
      res.status(500).end();
    }
  });

  // API routes
  app.use('/api/auction', internalServiceAuth, auctionRoutes);

  // Error handling
  app.use(errorHandler);

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Route ${req.method} ${req.path} not found`,
      },
    });
  });

  return app;
}

// Graceful shutdown
async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, shutting down gracefully...`);

  try {
    // Close MongoDB
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');

    // Close Redis
    if (redisClient) {
      await redisClient.quit();
      logger.info('Redis connection closed');
    }

    logger.info('Graceful shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error: error instanceof Error ? error.message : 'Unknown error' });
    process.exit(1);
  }
}

// Start server
async function start(): Promise<void> {
  try {
    // Connect to databases
    await connectMongoDB();
    await connectRedis();

    // Create and start Express app
    const app = createApp();

    const server = app.listen(PORT, () => {
      logger.info(`Auction Engine Service started`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        pid: process.pid,
      });
      logger.info(\n🚀 Auction Engine Service running on port ${PORT}`);
      logger.info(   Health: http://localhost:${PORT}/health`);
      logger.info(   Metrics: http://localhost:${PORT}/metrics`);
      logger.info( API: http://localhost:${PORT}/api/auction\n`);
    });

    // Graceful shutdown handlers
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Unhandled rejection handler
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', { reason, promise });
    });

 // Uncaught exception handler
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server', { error: error instanceof Error ? error.message : 'Unknown error' });
    process.exit(1);
  }
}

// Export for testing
export { createApp, connectMongoDB, connectRedis };

// Start if running directly
if (require.main === module) {
  start();
}
