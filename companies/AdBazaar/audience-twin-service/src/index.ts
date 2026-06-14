import express, { Application } from 'express';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import helmet from 'helmet';
import cors from 'cors';

import config from './config';
import logger from './config/logger';
import { audienceRoutes, healthRoutes } from './routes';
import {
  errorHandler,
  notFoundHandler,
  metricsMiddleware,
  metricsEndpoint,
  apiRateLimiter,
  createRateLimiter,
  predictionRateLimiter,
} from './middleware';

const app: Application = express();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Metrics middleware
app.use(metricsMiddleware);

// Rate limiting
app.use('/api/', apiRateLimiter);

// Health routes (no auth required)
app.use('/health', healthRoutes);

// Metrics endpoint (no auth required)
app.get('/metrics', metricsEndpoint);

// API routes
app.use('/api/audience', createRateLimiter, audienceRoutes);

// Prediction endpoint with specific rate limiting
app.use('/api/audience/:id/predict', predictionRateLimiter);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Redis client
let redisClient: ReturnType<typeof createClient> | null = null;

// Initialize Redis
async function initRedis(): Promise<void> {
  try {
    redisClient = createClient({
      url: config.redis.url,
    });

    redisClient.on('error', (err) => {
      logger.error('Redis client error:', { error: err instanceof Error ? err.message : String(err) });
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    await redisClient.connect();
  } catch (error) {
    logger.warn('Redis connection failed, continuing without cache:', error);
  }
}

// Connect to MongoDB
async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.mongodb.uri, {
      maxPoolSize: config.mongodb.options.maxPoolSize,
      serverSelectionTimeoutMS: config.mongodb.options.serverSelectionTimeoutMS,
      socketTimeoutMS: config.mongodb.options.socketTimeoutMS,
    });

    logger.info('MongoDB connected successfully');

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', { error: err instanceof Error ? err.message : String(err) });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
  } catch (error) {
    logger.error('MongoDB connection failed:', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

// Graceful shutdown
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`${signal} received, shutting down gracefully...`);

  try {
    // Close Redis connection
    if (redisClient) {
      await redisClient.quit();
      logger.info('Redis connection closed');
    }

    // Close MongoDB connection
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');

    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
}

// Start server
async function startServer(): Promise<void> {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Initialize Redis (non-blocking)
    initRedis().catch((err) => {
      logger.warn('Redis initialization failed:', err);
    });

    // Start listening
    

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'audience-twin-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe
app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready' });
});
app.listen(config.port, () => {
      logger.info(`Audience Twin Service running on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`Health check: http://localhost:${config.port}/health`);
      logger.info(`Metrics: http://localhost:${config.port}/metrics`);
    });

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', { error: error instanceof Error ? error.message : String(error) });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });
  } catch (error) {
    logger.error('Failed to start server:', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
}

// Export for testing
export { app };

// Start server if running directly
if (require.main === module) {
  startServer();
}

startServer();