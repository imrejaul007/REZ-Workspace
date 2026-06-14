import express, { Express }, logger from 'utils/logger.js';
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

// Initialize Redis client (optional)
let redisClient: Redis | null = null;

async function initializeRedis(): Promise<void> {
  if (!config.redis.url) {
    logger.warn('Redis URL not configured. Running without Redis.');
    return;
  }

  try {
    redisClient = new Redis(config.redis.url, {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
    });

    await redisClient.connect();
    logger.info('Redis connected successfully');
  } catch (error) {
    logger.warn('Redis connection failed. Running without Redis:', error);
    redisClient = null;
  }
}

// Initialize MongoDB connection
async function initializeDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection failed:', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

// Initialize Express app
function createApp(): Express {
  const app = express();

  // CORS configuration
  app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token'],
  }));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Rate limiting
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

  // Request logging (simple)
  app.use((req, _res, next) => {
    const start = Date.now();
    _res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info(`${req.method} ${req.path} ${_res.statusCode} ${duration}ms`);
    });
    next();
  });

  // Trust proxy (for rate limiting behind reverse proxy)
  app.set('trust proxy', 1);

  // Health check at root
  app.get('/', (_req, res) => {
    res.json({
      success: true,
      service: 'REZ CRM Hub',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // API routes
  app.use('/api', routes);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

// Graceful shutdown handler
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  // Stop the sync scheduler
  syncService.stopScheduler();

  // Close Redis connection
  if (redisClient) {
    await redisClient.quit();
  }

  // Close MongoDB connection
  await mongoose.connection.close();

  logger.info('Graceful shutdown completed');
  process.exit(0);
}

// Main startup function
async function main(): Promise<void> {
  try {
    // Validate configuration
    validateConfig();

    logger.info('Starting REZ CRM Hub service...');
    logger.info(`Environment: ${config.nodeEnv}`);

    // Initialize Redis
    await initializeRedis();

    // Initialize Database
    await initializeDatabase();

    // Initialize client tokens from database
    await authService.initializeClientTokens();

    // Create Express app
    const app = createApp();

    // Start sync scheduler
    syncService.startScheduler();

    // Start server
    const server = 

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-crm-hub',
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
      logger.info(`REZ CRM Hub listening on port ${config.port}`);
      logger.info(`Health check: http://localhost:${config.port}/api/health`);
    });

    // Graceful shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', { error: error instanceof Error ? error.message : String(error) });
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    // Export server for testing
    void server; // Suppress unused variable warning
  } catch (error) {
    logger.error('Failed to start server:', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
}

// Start the application
main().catch((error) => {
  logger.error('Fatal error:', { error: error instanceof Error ? error.message : String(error) });
  process.exit(1);
});

export default main;
