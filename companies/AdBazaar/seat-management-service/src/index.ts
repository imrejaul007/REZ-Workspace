import express, { Express, Request, Response } from 'express';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';

import { logger } from 'utils/logger.js';
import { getMetrics, getContentType, metricsMiddleware } from './utils/metrics';
import { internalServiceAuth, errorHandler, notFoundHandler } from './middleware';
import routes from './routes';

// Load environment variables
dotenv.config();

// Configuration
const PORT = process.env.PORT || 4962;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/seat-management';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Create Express app
const app: Express = express();

// Trust proxy (for load balancers)
app.set('trust proxy', 1);

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Metrics middleware
app.use(metricsMiddleware);

// Request logging
app.use((req: Request, res: Response, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
  });
  next();
});

// Health check endpoint (no auth required)
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Check MongoDB connection
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

    // Check Redis connection
    let redisStatus = 'disconnected';
    try {
      if (redisClient && redisClient.isOpen) {
        redisStatus = 'connected';
      }
    } catch {
      redisStatus = 'error';
    }

    const isHealthy = mongoStatus === 'connected';

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      service: 'seat-management-service',
      version: '1.0.0',
      port: PORT,
      timestamp: new Date().toISOString(),
      dependencies: {
        mongodb: mongoStatus,
        redis: redisStatus
      }
    });
  } catch (error) {
    logger.error('Health check failed:', { error: error instanceof Error ? error.message : String(error) });
    res.status(503).json({
      status: 'unhealthy',
      service: 'seat-management-service',
      error: 'Health check failed'
    });
  }
});

// Metrics endpoint (no auth required)
app.get('/metrics', async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', getContentType());
    res.send(await getMetrics());
  } catch (error) {
    logger.error('Metrics endpoint failed:', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).send('Failed to collect metrics');
  }
});

// Protected routes (require internal service auth)
app.use('/api', internalServiceAuth, routes);

// Not found handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Redis client
let redisClient: ReturnType<typeof createClient> | null = null;

// Connect to MongoDB
async function connectMongoDB(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    logger.info('Connected to MongoDB', { uri: MONGODB_URI.replace(/\/\/.*@/, '//***@') });
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

// Connect to Redis
async function connectRedis(): Promise<void> {
  try {
    redisClient = createClient({
      url: REDIS_URL
    });

    redisClient.on('error', (err) => {
      logger.error('Redis client error:', { error: err instanceof Error ? err.message : String(err) });
    });

    redisClient.on('connect', () => {
      logger.info('Connected to Redis', { url: REDIS_URL.replace(/\/\/.*@/, '//***@') });
    });

    await redisClient.connect();
  } catch (error) {
    logger.warn('Failed to connect to Redis, continuing without it:', error);
    redisClient = null;
  }
}

// Graceful shutdown
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, shutting down gracefully...`);

  try {
    // Close MongoDB connection
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');

    // Close Redis connection
    if (redisClient) {
      await redisClient.quit();
      logger.info('Redis connection closed');
    }

    // Exit process
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', { error: error instanceof Error ? error.message : String(error) });
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
});

// Start server
async function startServer(): Promise<void> {
  try {
    // Connect to databases
    await connectMongoDB();
    await connectRedis();

    // Start Express server
    app.listen(PORT, () => {
      logger.info(`Seat Management Service started`, {
        port: PORT,
        env: process.env.NODE_ENV || 'development',
        mongodb: MONGODB_URI.replace(/\/\/.*@/, '//***@'),
        redis: REDIS_URL.replace(/\/\/.*@/, '//***@')
      });

      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`Metrics: http://localhost:${PORT}/metrics`);
      logger.info(`API: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    logger.error('Failed to start server:', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
}

// Start the server
startServer();

export { app, redisClient };