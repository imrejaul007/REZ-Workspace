import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import mongoose from 'mongoose';

import config, { validateConfig } from './config';
import { logger } from 'utils/logger.js';
import { redisService } from './services/redis';
import { transactionRouter, healthRouter, updateStartTime } from './routes';
import {
  errorHandler,
  notFoundHandler,
  metricsMiddleware,
  metricsHandler,
  initRateLimiter,
  rateLimiter,
} from './middleware';

// Initialize Express app
const app: Application = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors(config.cors));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(
  morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  })
);

// Metrics middleware
app.use(metricsMiddleware);

// Health routes (no auth required)
app.use('/health', healthRouter);

// Metrics endpoint
app.get('/metrics', metricsHandler);

// Rate limiting (use Redis if available, otherwise in-memory)
app.use(rateLimiter());

// API routes
app.use('/api/transaction', transactionRouter);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Database connection
async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    logger.info('MongoDB connected', { uri: config.mongodb.uri.replace(/\/\/.*@/, '//<credentials>@') });
  } catch (error) {
    logger.error('MongoDB connection failed', { error });
    throw error;
  }
}

// Redis connection
async function connectRedis(): Promise<void> {
  await redisService.connect();
  initRateLimiter(redisService.isAvailable() ? undefined : undefined);
}

// Graceful shutdown
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  try {
    // Close Redis
    await redisService.disconnect();
    logger.info('Redis disconnected');

    // Close MongoDB
    await mongoose.connection.close();
    logger.info('MongoDB disconnected');

    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error });
    process.exit(1);
  }
}

// Start server
async function startServer(): Promise<void> {
  try {
    // Validate config
    validateConfig();

    // Connect to services
    await Promise.all([connectDatabase(), connectRedis()]);

    // Update start time for health checks
    updateStartTime();

    // Start listening
    const server = 

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ecosystem-transaction-hub',
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
      logger.info(`Server started on port ${config.port}`, {
        port: config.port,
        env: config.nodeEnv,
        nodeVersion: process.version,
      });
    });

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', { error: error.message, stack: error.stack });
      gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection', { reason, promise });
    });

    // Handle server errors
    server.on('error', (error: Error) => {
      logger.error('Server error', { error: error.message });
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Start the server
startServer();

export { app };
export default app;