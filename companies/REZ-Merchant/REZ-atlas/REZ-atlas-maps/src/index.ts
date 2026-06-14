/**
 * REZ Atlas Maps - Geospatial Business Intelligence
 * Production-ready implementation with MongoDB geospatial queries
 */

import 'express-async-errors';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import mongoose from 'mongoose';
import Redis from 'ioredis';
import { createLogger } from './config/logger.js';
import { errorHandler, asyncHandler } from './middleware/errorHandler.js';
import { healthRoutes } from './routes/health.js';
import { heatRoutes } from './routes/heat.js';
import { clusterRoutes } from './routes/clusters.js';
import { territoryRoutes } from './routes/territory.js';
import { validateHeatQuery, validateClusterQuery, validateTerritoryParams } from './middleware/validation.js';

// Initialize logger
const logger = createLogger('REZ-atlas-maps');

// Configuration
const PORT = parseInt(process.env.PORT || '5152', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-atlas-maps';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Redis client
let redis: Redis | null = null;

const app = express();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));

app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health' || req.path === '/healthz',
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// MongoDB sanitization
app.use(mongoSanitize());

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
    });
  });
  next();
});

// Health routes
app.use('/', healthRoutes);

// API routes with validation
app.use('/api/heat', validateHeatQuery, heatRoutes);
app.use('/api/clusters', validateClusterQuery, clusterRoutes);
app.use('/api/territory', validateTerritoryParams, territoryRoutes);

// Error handler
app.use(errorHandler);

// Database connection
async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info('MongoDB connected', { uri: MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@') });
  } catch (error) {
    logger.error('MongoDB connection failed', { error });
    throw error;
  }
}

// Redis connection
function connectRedis(): void {
  try {
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      lazyConnect: true,
    });

    redis.on('connect', () => {
      logger.info('Redis connected', { url: REDIS_URL });
    });

    redis.on('error', (err) => {
      logger.error('Redis error', { error: err.message });
    });
  } catch (error) {
    logger.warn('Redis connection failed, continuing without cache', { error });
  }
}

// Graceful shutdown
async function shutdown(signal: string): Promise<void> {
  logger.info(`${signal} received, shutting down gracefully`);

  try {
    await mongoose.connection.close();
    logger.info('MongoDB disconnected');

    if (redis) {
      await redis.quit();
      logger.info('Redis disconnected');
    }

    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error });
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start server
async function start(): Promise<void> {
  try {
    await connectDatabase();
    connectRedis();

    app.listen(PORT, () => {
      logger.info(`REZ Atlas Maps started`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

start();

export { app, redis };