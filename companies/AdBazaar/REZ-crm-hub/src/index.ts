import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import Redis from 'ioredis';
import rateLimit from 'express-rate-limit';

import { config, validateConfig } from './config/index.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { authService } from './services/authService.js';
import { syncService } from './services/syncService.js';

let redisClient: Redis | null = null;

async function initializeRedis(): Promise<void> {
  if (!config.redis.url) {
    console.warn('Redis URL not configured. Running without Redis.');
    return;
  }

  try {
    redisClient = new Redis(config.redis.url, {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
    });

    await redisClient.connect();
    console.info('Redis connected successfully');
  } catch (error) {
    console.warn('Redis connection failed. Running without Redis:', error);
    redisClient = null;
  }
}

async function initializeDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    console.info('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    throw error;
  }
}

function createApp(): express.Express {
  const app = express();

  app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token'],
  }));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: {
      success: false,
      error: 'Too many requests, please try again later',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  app.use((req, _res, next) => {
    const start = Date.now();
    _res.on('finish', () => {
      const duration = Date.now() - start;
      console.info(`${req.method} ${req.path} ${_res.statusCode} ${duration}ms`);
    });
    next();
  });

  app.set('trust proxy', 1);

  app.get('/', (_req, res) => {
    res.json({
      success: true,
      service: 'REZ CRM Hub',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      service: 'rez-crm-hub',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  app.get('/health/live', (_req, res) => {
    res.json({ status: 'alive' });
  });

  app.get('/health/ready', (_req, res) => {
    res.json({ status: 'ready' });
  });

  app.use('/api', routes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

async function gracefulShutdown(signal: string): Promise<void> {
  console.info(`Received ${signal}. Starting graceful shutdown...`);

  syncService.stopScheduler();

  if (redisClient) {
    await redisClient.quit();
  }

  await mongoose.connection.close();

  console.info('Graceful shutdown completed');
  process.exit(0);
}

async function main(): Promise<void> {
  try {
    validateConfig();

    console.info('Starting REZ CRM Hub service...');
    console.info('Environment:', config.nodeEnv);

    await initializeRedis();
    await initializeDatabase();
    await authService.initializeClientTokens();

    const app = createApp();
    syncService.startScheduler();

    app.listen(config.port, () => {
      console.info(`REZ CRM Hub listening on port ${config.port}`);
      console.info(`Health check: http://localhost:${config.port}/api/health`);
    });

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

export { createApp, main };
