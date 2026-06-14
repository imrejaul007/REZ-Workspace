/**
 * AI Banner Generator Service
 * Port: 4840
 *
 * AI-powered banner generation service for AdBazaar
 */

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { rateLimit } from 'express-rate-limit';
import config from './config';
import logger from 'utils/logger.js';
import { generationRoutes, templateRoutes } from './routes';
import {
  metricsMiddleware,
  metricsHandler,
  errorHandler,
  notFoundHandler,
} from './middleware';
import { redisService } from './services';

// Create Express app
const app: Application = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (config.ALLOWED_ORIGINS.some(allowed => origin.includes(allowed))) {
      return callback(null, true);
    }
    callback(new Error(`Origin ${origin} not allowed by CORS policy`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true,
}));

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://cdn.adbazaar.com"],
    },
  },
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: { success: false, error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Metrics middleware
app.use(metricsMiddleware);

// Health check endpoints
app.get('/health', async (_req, res) => {
  const mongoOk = mongoose.connection.readyState === 1;
  const redisOk = redisService.isConnected();

  res.json({
    status: mongoOk ? 'healthy' : 'degraded',
    service: 'ai-banner-generator',
    port: config.PORT,
    mongodb: mongoOk ? 'connected' : 'disconnected',
    redis: redisOk ? 'connected' : 'disconnected',
  });
});

app.get('/ready', async (_req, res) => {
  const mongoOk = mongoose.connection.readyState === 1;
  if (!mongoOk) {
    res.status(503).json({ ready: false, error: 'MongoDB not connected' });
    return;
  }
  res.json({ ready: true });
});

// Metrics endpoint
app.get('/metrics', metricsHandler);

// API routes
app.use('/api/generate', generationRoutes);
app.use('/api/banners', generationRoutes);
app.use('/api/templates', templateRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Database connection
async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.MONGODB_URI);
    logger.info(`[${new Date().toISOString()}] Connected to MongoDB`);
  } catch (error) {
    logger.error('MongoDB connection failed', {
      error: error instanceof Error ? error.message : 'Unknown',
    });
    throw error;
  }
}

// Redis connection
async function connectRedis(): Promise<void> {
  try {
    await redisService.connect();
  } catch (error) {
    logger.warn('Redis connection failed, continuing without cache', {
      error: error instanceof Error ? error.message : 'Unknown',
    });
  }
}

// Graceful shutdown
async function shutdown(): Promise<void> {
  logger.info('Shutting down...');
  await redisService.disconnect();
  await mongoose.disconnect();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
async function start(): Promise<void> {
  try {
    // Connect to databases
    await connectDatabase();
    await connectRedis();

    // Start HTTP server
    app.listen(config.PORT, () => {
      logger.info(`[${new Date().toISOString()}] ai-banner-generator running on port ${config.PORT}`);
      logger.info(`Environment: ${config.NODE_ENV}`);
      logger.info(`MongoDB: ${config.MONGODB_URI}`);
      logger.info(`Redis: ${config.REDIS_ENABLED ? config.REDIS_URL : 'disabled'}`);
    });
  } catch (error) {
    logger.error('Startup failed', {
      error: error instanceof Error ? error.message : 'Unknown',
    });
    process.exit(1);
  }
}

// Start the application
start();

export default app;