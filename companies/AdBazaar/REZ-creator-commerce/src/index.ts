import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';

import config from './config';
import { logger } from './services/logger.service';
import { cacheService } from './services/cache.service';
import routes from './routes';

// ============================================
// EXPRESS APP SETUP
// ============================================

const app: Express = express();

// Security middleware
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: 'Too many requests, please try again later',
    timestamp: new Date().toISOString(),
  },
});
app.use(limiter);

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', async (req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const redisStatus = await cacheService.ping() ? 'connected' : 'disconnected';

  const health = {
    status: 'ok',
    service: 'rez-creator-commerce',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    dependencies: {
      mongodb: mongoStatus,
      redis: redisStatus,
    },
  };

  res.json(health);
});

app.get('/ready', async (req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1;
  const redisStatus = await cacheService.ping();

  if (mongoStatus && redisStatus) {
    res.json({ status: 'ready', timestamp: new Date().toISOString() });
  } else {
    res.status(503).json({
      status: 'not ready',
      mongodb: mongoStatus,
      redis: redisStatus,
      timestamp: new Date().toISOString(),
    });
  }
});

// ============================================
// API ROUTES
// ============================================

app.use('/api', routes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', { error: err instanceof Error ? err.message : String(err) });

  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// DATABASE CONNECTION
// ============================================

async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection error:', { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
  } catch (error) {
    logger.error('MongoDB disconnection error:', { error: error instanceof Error ? error.message : String(error) });
  }
}

// ============================================
// REDIS CONNECTION
// ============================================

async function connectRedis(): Promise<void> {
  try {
    await cacheService.connect();
    logger.info('Redis connected successfully');
  } catch (error) {
    logger.error('Redis connection error:', { error: error instanceof Error ? error.message : String(error) });
    // Continue without Redis - it's not critical
  }
}

async function disconnectRedis(): Promise<void> {
  try {
    await cacheService.disconnect();
    logger.info('Redis disconnected');
  } catch (error) {
    logger.error('Redis disconnection error:', { error: error instanceof Error ? error.message : String(error) });
  }
}

// ============================================
// SERVER STARTUP
// ============================================

async function startServer(): Promise<void> {
  try {
    // Connect to databases
    await connectDatabase();
    await connectRedis();

    // Start HTTP server
    const server = app.listen(config.port, () => {
      logger.info(`REZ Creator Commerce service started on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`Health check: http://localhost:${config.port}/health`);
      logger.info(`API base: http://localhost:${config.port}/api`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        await disconnectDatabase();
        await disconnectRedis();

        logger.info('All connections closed');
        process.exit(0);
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
}

// Start the server
startServer();

export default app;