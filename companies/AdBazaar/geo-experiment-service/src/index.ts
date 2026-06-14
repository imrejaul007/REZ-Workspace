import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import utils and middleware
import logger from './utils/logger';
import { register } from './utils/metrics';
import routes from './routes';
import { internalServiceAuth } from './middleware/auth';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

// Initialize Express app
const app: Express = express();
const PORT = parseInt(process.env.PORT || '4973', 10);

// Redis client
let redisClient: ReturnType<typeof createClient> | null = null;

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/adbazaar_geo_experiment';

// Redis connection
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

// ==================== MIDDLEWARE ====================

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false // Disable for API
}));

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token', 'X-API-Key']
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// ==================== HEALTH CHECKS ====================

/**
 * Basic health check
 */
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'geo-experiment-service',
    version: '1.0.0',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

/**
 * Detailed health check with dependencies
 */
app.get('/health/detailed', async (_req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const redisStatus = redisClient?.isReady ? 'connected' : 'disconnected';

  res.json({
    status: 'healthy',
    service: 'geo-experiment-service',
    version: '1.0.0',
    port: PORT,
    timestamp: new Date().toISOString(),
    dependencies: {
      mongodb: mongoStatus,
      redis: redisStatus
    }
  });
});

/**
 * Prometheus metrics endpoint
 */
app.get('/metrics', async (_req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error) {
    res.status(500).end();
  }
});

// ==================== API ROUTES ====================

// API routes with authentication
app.use('/api', internalServiceAuth, routes);

// ==================== ERROR HANDLING ====================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ==================== DATABASE CONNECTIONS ====================

/**
 * Connect to MongoDB
 */
async function connectMongoDB(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });

    logger.info('Connected to MongoDB', { uri: MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@') });

    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error', { error: error.message });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error });
    throw error;
  }
}

/**
 * Connect to Redis
 */
async function connectRedis(): Promise<void> {
  try {
    redisClient = createClient({
      socket: {
        host: REDIS_HOST,
        port: REDIS_PORT
      },
      password: REDIS_PASSWORD || undefined
    });

    redisClient.on('error', (error) => {
      logger.error('Redis connection error', { error: error.message });
    });

    redisClient.on('connect', () => {
      logger.info('Connected to Redis', { host: REDIS_HOST, port: REDIS_PORT });
    });

    await redisClient.connect();
  } catch (error) {
    logger.warn('Failed to connect to Redis, continuing without cache', { error });
    redisClient = null;
  }
}

/**
 * Graceful shutdown
 */
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, starting graceful shutdown`);

  // Close MongoDB
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error('Error closing MongoDB', { error });
  }

  // Close Redis
  try {
    if (redisClient) {
      await redisClient.quit();
      logger.info('Redis connection closed');
    }
  } catch (error) {
    logger.error('Error closing Redis', { error });
  }

  process.exit(0);
}

// ==================== SERVER STARTUP ====================

async function startServer(): Promise<void> {
  try {
    // Connect to databases
    await connectMongoDB();
    await connectRedis();

    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`
╔══════════════════════════════════════════════════════════════╗
║           GEO EXPERIMENT SERVICE - PORT ${PORT}                  ║
╠══════════════════════════════════════════════════════════════╣
║  Geographic holdout testing for AdBazaar DOOH campaigns     ║
║                                                              ║
║  Endpoints:                                                  ║
║    GET  /health - Health check                  ║
║    GET  /health/detailed     - Detailed health + deps       ║
║    GET  /metrics             - Prometheus metrics            ║
║                                                              ║
║  API Routes:                                                 ║
║    POST /api/experiments     - Create experiment             ║
║    GET  /api/experiments     - List experiments              ║
║    GET  /api/experiments/:id - Get experiment                ║
║    PUT  /api/experiments/:id - Update experiment            ║
║    POST /api/experiments/:id/markets - Add market            ║
║    GET  /api/experiments/:id/markets - List markets          ║
║    POST /api/experiments/:id/treatment - Set treatment       ║
║    POST /api/experiments/:id/control - Set control          ║
║    GET  /api/experiments/:id/results - Geo results           ║
║    GET  /api/experiments/:id/lift - Lift analysis           ║
╚══════════════════════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', { error: error.message, stack: error.stack });
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection', { reason, promise });
    });

  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Start the server
startServer();

export { app, redisClient };