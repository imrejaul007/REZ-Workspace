import express, { Express, Request, Response } from 'express';
import mongoose from 'mongoose';
import Redis from 'ioredis';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import config from './config';
import routes from './routes';
import {
  metricsMiddleware,
  getMetrics,
  getHealth,
  errorHandler,
  activeTwinsGauge,
} from './middleware';
import { UserTwin } from './models';

const app: Express = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    error: 'Too Many Requests',
    message: 'Please try again later',
    statusCode: 429,
    timestamp: new Date(),
  },
});
app.use('/api', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Metrics middleware
app.use(metricsMiddleware);

// Health and metrics endpoints
app.get('/health', getHealth);
app.get('/metrics', getMetrics);

// API routes
app.use('/api', routes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found',
    statusCode: 404,
    timestamp: new Date(),
  });
});

// Global error handler
app.use(errorHandler);

// Redis client for connection monitoring
let redisClient: Redis | null = null;

// Initialize Redis connection
const initRedis = async (): Promise<Redis> => {
  redisClient = new Redis(config.redis.url, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      if (times > 3) {
        logger.warn('Redis connection failed, continuing without cache');
        return null;
      }
      return Math.min(times * 100, 3000);
    },
    lazyConnect: true,
  });

  redisClient.on('error', (err) => {
    logger.error('Redis connection error:', err.message);
  });

  redisClient.on('connect', () => {
    logger.info('Redis connected successfully');
  });

  try {
    await redisClient.connect();
  } catch {
    logger.warn('Redis not available, continuing without cache');
  }

  return redisClient;
};

// Update active twins gauge periodically
const updateMetrics = async (): Promise<void> => {
  try {
    const activeCount = await UserTwin.countDocuments({ status: 'active' });
    activeTwinsGauge.set(activeCount);
  } catch {
    // Ignore errors during metrics update
  }
};

// Start server
const startServer = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    logger.info('Connecting to MongoDB...');
    await mongoose.connect(config.mongodb.uri);
    logger.info('MongoDB connected successfully');

    // Initialize Redis
    logger.info('Connecting to Redis...');
    await initRedis();

    // Start HTTP server
    app.listen(config.port, () => {
      logger.info(`
╔═══════════════════════════════════════════════════════════╗
║          USER TWIN SERVICE STARTED SUCCESSFULLY            ║
╠═══════════════════════════════════════════════════════════╣
║  Port:      ${config.port}                                     ║
║  Env:       ${config.nodeEnv}                                   ║
║  MongoDB:   ${config.mongodb.uri.split('@').pop() || 'localhost'}     ║
║  Redis:     ${config.redis.url.split('://').pop() || 'localhost'}         ║
╠═══════════════════════════════════════════════════════════╣
║  Endpoints:                                             ║
║  • GET  /health           Health check                  ║
║  • GET  /metrics          Prometheus metrics           ║
║  • POST /api/twin/create  Create user twin             ║
║  • GET  /api/twin/:userId Get user twin                ║
║  • PUT  /api/twin/:userId Update user twin             ║
║  • POST /api/twin/:userId/predict  Predict behavior    ║
║  • GET  /api/twin/:userId/affinity Get brand affinities ║
║  • POST /api/twin/:userId/refresh Refresh twin data    ║
╚═══════════════════════════════════════════════════════════╝
      `);

      // Start metrics update interval
      setInterval(updateMetrics, 60000); // Update every minute
    });

    // Graceful shutdown
    const shutdown = async (signal: string): Promise<void> => {
      logger.info(`\n${signal} received. Shutting down gracefully...`);

      try {
        // Close Redis
        if (redisClient) {
          await redisClient.quit();
          logger.info('Redis connection closed');
        }

        // Close MongoDB
        await mongoose.connection.close();
        logger.info('MongoDB connection closed');

        logger.info('Shutdown complete');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', { error: error instanceof Error ? error.message : String(error) });
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { error: error instanceof Error ? error.message : String(error) });
  process.exit(1);
});

// Start the server
startServer();

export default app;