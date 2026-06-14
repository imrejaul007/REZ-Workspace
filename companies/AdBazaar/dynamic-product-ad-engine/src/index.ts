/**
 * Dynamic Product Ad Engine
 * Main Application Entry Point
 *
 * Port: 4841
 * Creates dynamic product ads from product feeds
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { rateLimit } from 'express-rate-limit';
import Redis from 'ioredis';

import config from './config';
import logger from './utils/logger';
import routes from './routes';
import { metricsMiddleware, metricsHandler } from './middleware';

// Initialize Express app
const app = express();

// Redis client (optional)
let redisClient: Redis | null = null;

if (config.REDIS_ENABLED) {
  try {
    redisClient = new Redis(config.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        if (times > 3) {
          logger.warn('Redis connection failed, continuing without Redis');
          return null;
        }
        return Math.min(times * 100, 3000);
      },
    });

    redisClient.on('connect', () => {
      logger.info('Connected to Redis');
    });

    redisClient.on('error', (error) => {
      logger.error('Redis error', { error: error.message });
    });
  } catch (error) {
    logger.warn('Redis initialization failed, continuing without Redis');
  }
}

// CORS Configuration
const ALLOWED_ORIGINS = config.ALLOWED_ORIGINS;
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);

    // Check if origin is in allowed list
    const isAllowed = ALLOWED_ORIGINS.some(allowed =>
      origin.includes(allowed) || allowed === '*'
    );

    if (isAllowed) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked origin', { origin });
      callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Advertiser-ID', 'X-Campaign-ID'],
  credentials: true,
}));

// Helmet security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "https:"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    error: 'Too many requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health' || req.path === '/metrics',
});

app.use('/api/', limiter);

// Metrics middleware
app.use(metricsMiddleware);

// Health check endpoint
app.get('/health', async (_req, res) => {
  const mongoOk = mongoose.connection.readyState === 1;
  const redisOk = redisClient?.status === 'ready';

  const status = mongoOk ? 'healthy' : 'degraded';

  res.status(mongoOk ? 200 : 503).json({
    status,
    service: 'dynamic-product-ad-engine',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    dependencies: {
      mongodb: mongoOk ? 'connected' : 'disconnected',
      redis: config.REDIS_ENABLED ? (redisOk ? 'connected' : 'disconnected') : 'disabled',
    },
  });
});

// Readiness check
app.get('/ready', async (_req, res) => {
  const mongoOk = mongoose.connection.readyState === 1;

  if (!mongoOk) {
    res.status(503).json({
      ready: false,
      error: 'MongoDB not connected',
    });
    return;
  }

  res.json({ ready: true });
});

// Prometheus metrics endpoint
app.get('/metrics', metricsHandler);

// API Routes
app.use('/api/dpa', routes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// Error handler middleware
function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Don't expose internal errors in production
  const isProduction = config.NODE_ENV === 'production';

  res.status(500).json({
    success: false,
    error: isProduction ? 'Internal server error' : err.message,
  });
}

app.use(errorHandler);

// Graceful shutdown handler
async function shutdown(signal: string): Promise<void> {
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

    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error: error instanceof Error ? error.message : 'Unknown' });
    process.exit(1);
  }
}

// Register shutdown handlers
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start server
async function start(): Promise<void> {
  try {
    // Connect to MongoDB
    logger.info('Connecting to MongoDB...');
    await mongoose.connect(config.MONGODB_URI);

    const mongoState = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    logger.info(`MongoDB ${mongoState[mongoose.connection.readyState]} at ${config.MONGODB_URI}`);

    // Start HTTP server
    app.listen(config.PORT, () => {
      logger.info(`========================================`);
      logger.info(`Dynamic Product Ad Engine started`);
      logger.info(`Port: ${config.PORT}`);
      logger.info(`Environment: ${config.NODE_ENV}`);
      logger.info(`MongoDB: ${config.MONGODB_URI}`);
      logger.info(`Redis: ${config.REDIS_ENABLED ? config.REDIS_URL : 'disabled'}`);
      logger.info(`========================================`);
      logger.info(`API Endpoints:`);
      logger.info(`  POST /api/dpa/feed - Upload product feed`);
      logger.info(`  GET  /api/dpa/feeds - List feeds`);
      logger.info(`  POST /api/dpa/campaign - Create DPA campaign`);
      logger.info(`  PUT  /api/dpa/campaigns/:id - Update campaign`);
      logger.info(`  GET  /api/dpa/campaigns/:id/preview - Preview ad`);
      logger.info(`  POST /api/dpa/render - Render ad`);
      logger.info(`  GET  /health - Health check`);
      logger.info(`  GET  /metrics - Prometheus metrics`);
      logger.info(`========================================`);
    });
  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : 'Unknown',
    });
    process.exit(1);
  }
}

// Start the application
start();

export default app;