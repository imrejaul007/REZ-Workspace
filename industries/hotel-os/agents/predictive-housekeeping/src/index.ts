import express, { Application } from 'express';
import mongoose from 'mongoose';
import amqp from 'amqplib';
import Redis from 'ioredis';
import dotenv from 'dotenv';
import twinRoutes from './routes/twin.routes';
import schedulingRoutes from './routes/scheduling.routes';
import {
  securityMiddleware,
  corsMiddleware,
  compressionMiddleware,
  rateLimiter,
  requestLogger,
  requestIdMiddleware,
} from './middleware/common.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import logger from './utils/logger';

// Load environment variables
dotenv.config();

// Initialize Express app
const app: Application = express();

// Configuration
const PORT = parseInt(process.env.PORT || '8446', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/predictive_housekeeping';
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const RABBITMQ_URI = process.env.RABBITMQ_URI || 'amqp://localhost:5672';

// Global state
let redisClient: Redis | null = null;
let rabbitConnection: amqp.Connection | null = null;
let isShuttingDown = false;

// ============================================================================
// Middleware Setup
// ============================================================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(securityMiddleware);
app.use(corsMiddleware);
app.use(compressionMiddleware);
app.use(rateLimiter);
app.use(requestIdMiddleware);
app.use(requestLogger);

// ============================================================================
// Health Check Endpoints
// ============================================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'predictive-housekeeping',
    version: process.env.SERVICE_VERSION || '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/ready', async (req, res) => {
  const checks = {
    mongodb: mongoose.connection.readyState === 1,
    redis: redisClient?.status === 'ready',
    rabbitmq: rabbitConnection !== null,
  };

  const isReady = Object.values(checks).every(Boolean);

  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'not_ready',
    checks,
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// API Routes
// ============================================================================

app.use('/api/twins', twinRoutes);
app.use('/api/scheduling', schedulingRoutes);

// ============================================================================
// Error Handling
// ============================================================================

app.use(notFoundHandler);
app.use(errorHandler);

// ============================================================================
// Database Connections
// ============================================================================

async function connectMongoDB(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB', { uri: MONGODB_URI.replace(/\/\/.*@/, '//***@') });
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error });
    throw error;
  }
}

async function connectRedis(): Promise<void> {
  try {
    redisClient = new Redis({
      host: REDIS_HOST,
      port: REDIS_PORT,
      password: process.env.REDIS_PASSWORD || undefined,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    redisClient.on('ready', () => {
      logger.info('Connected to Redis', { host: REDIS_HOST, port: REDIS_PORT });
    });

    redisClient.on('error', (error) => {
      logger.error('Redis connection error', { error: error.message });
    });

    redisClient.on('close', () => {
      if (!isShuttingDown) {
        logger.warn('Redis connection closed unexpectedly');
      }
    });
  } catch (error) {
    logger.error('Failed to connect to Redis', { error });
    // Redis is optional, continue without it
  }
}

async function connectRabbitMQ(): Promise<void> {
  try {
    rabbitConnection = await amqp.connect(RABBITMQ_URI);
    logger.info('Connected to RabbitMQ', { uri: RABBITMQ_URI.replace(/\/\/.*@/, '//***@') });

    rabbitConnection.on('error', (error) => {
      logger.error('RabbitMQ connection error', { error: error.message });
    });

    rabbitConnection.on('close', () => {
      if (!isShuttingDown) {
        logger.warn('RabbitMQ connection closed unexpectedly');
      }
    });
  } catch (error) {
    logger.error('Failed to connect to RabbitMQ', { error });
    // RabbitMQ is optional, continue without it
  }
}

// ============================================================================
// Graceful Shutdown
// ============================================================================

async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, starting graceful shutdown...`);
  isShuttingDown = true;

  // Close HTTP server
  server.close(() => {
    logger.info('HTTP server closed');
  });

  // Close database connections
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error('Error closing MongoDB connection', { error });
  }

  if (redisClient) {
    redisClient.disconnect();
    logger.info('Redis connection closed');
  }

  if (rabbitConnection) {
    await rabbitConnection.close();
    logger.info('RabbitMQ connection closed');
  }

  logger.info('Graceful shutdown completed');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error });
  process.exit(1);
});

// ============================================================================
// Server Startup
// ============================================================================

let server: ReturnType<typeof app.listen>;

async function startServer(): Promise<void> {
  try {
    // Connect to databases
    await connectMongoDB();
    await connectRedis();
    await connectRabbitMQ();

    // Start HTTP server
    server = app.listen(PORT, () => {
      logger.info(`Predictive Housekeeping Agent started`, {
        port: PORT,
        nodeEnv: process.env.NODE_ENV,
        version: process.env.SERVICE_VERSION || '1.0.0',
      });

      logger.info('Available endpoints:', {
        twins: [
          'POST /api/twins/guest',
          'GET /api/twins/guest/:id',
          'PUT /api/twins/guest/:id/preferences',
          'POST /api/twins/room',
          'GET /api/twins/room/:id/status',
          'POST /api/twins/property',
        ],
        scheduling: [
          'POST /api/scheduling/housekeepers',
          'POST /api/scheduling/tasks',
          'POST /api/scheduling/schedule',
          'GET /api/scheduling/analytics/occupancy/:propertyId',
          'GET /api/scheduling/analytics/maintenance/:propertyId',
        ],
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

startServer();

export { app, redisClient, rabbitConnection };