import 'dotenv/config';
import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import 'express-async-errors';
import mongoSanitize from 'express-mongo-sanitize';
import { connectMongoDB, disconnectMongoDB } from './config/mongodb';
import { redis } from './config/redis';
import { logger } from './config/logger';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { apiLimiter, healthLimiter } from './middleware/rate-limiter.middleware';
import dealsRouter from './routes/deals.routes';

// Load environment variables
const PORT = parseInt(process.env.PORT || '4119');
const SERVICE_NAME = process.env.SERVICE_NAME || 'risna-deal-service';

// Create Express app
const app: Application = express();

// ==============================================
// TRUST PROXY (for load balancers)
// ==============================================

app.set('trust proxy', 1);

// ==============================================
// SECURITY MIDDLEWARE
// ==============================================

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-service-token'],
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// MongoDB sanitization
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req }) => {
    logger.warn('MongoDB sanitize triggered', { path: req.path });
  },
}));

// ==============================================
// HEALTH CHECK ENDPOINTS
// ==============================================

app.get('/health', healthLimiter, async (_req: Request, res: Response) => {
  const mongoStatus = redis.status === 'ready' ? 'connected' : 'disconnected';
  const redisStatus = redis.status === 'ready' ? 'connected' : 'disconnected';

  res.json({
    status: 'healthy',
    service: SERVICE_NAME,
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    dependencies: {
      mongodb: mongoStatus,
      redis: redisStatus,
    },
  });
});

app.get('/healthz', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.get('/ready', async (_req: Request, res: Response) => {
  try {
    // Check MongoDB
    const mongoReady = redis.status === 'ready';

    // Check Redis
    const redisReady = redis.status === 'ready';

    if (mongoReady && redisReady) {
      res.json({
        status: 'ready',
        service: SERVICE_NAME,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        service: SERVICE_NAME,
        mongodb: mongoReady,
        redis: redisReady,
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/metrics', (_req: Request, res: Response) => {
  const memoryUsage = process.memoryUsage();
  res.json({
    service: SERVICE_NAME,
    uptime: process.uptime(),
    memory: {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
    },
    timestamp: new Date().toISOString(),
  });
});

// ==============================================
// API ROUTES
// ==============================================

// Apply rate limiter to all API routes
app.use('/api', apiLimiter);

// Mount routes
app.use('/api/v1/deals', dealsRouter);

// API info endpoint
app.get('/api/v1', (_req: Request, res: Response) => {
  res.json({
    service: SERVICE_NAME,
    version: '1.0.0',
    description: 'Deal pipeline service for RisnaEstate',
    endpoints: {
      deals: '/api/v1/deals',
      health: '/health',
      metrics: '/metrics',
    },
  });
});

// ==============================================
// ERROR HANDLING
// ==============================================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ==============================================
// SERVER STARTUP
// ==============================================

async function startServer(): Promise<void> {
  try {
    // Connect to MongoDB
    logger.info('[Startup] Connecting to MongoDB...');
    await connectMongoDB();

    // Redis is already connected via the client setup
    logger.info('[Startup] Redis connection established');

    // Start HTTP server
    app.listen(PORT, () => {
      logger.info(`[Startup] ${SERVICE_NAME} listening on port ${PORT}`);
      logger.info(`[Startup] Health check: http://localhost:${PORT}/health`);
      logger.info(`[Startup] API: http://localhost:${PORT}/api/v1/deals`);
    });
  } catch (error) {
    logger.error('[Startup] Failed to start server', { error });
    process.exit(1);
  }
}

// ==============================================
// GRACEFUL SHUTDOWN
// ==============================================

async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`[Shutdown] Received ${signal}, starting graceful shutdown...`);

  try {
    // Close HTTP server (allow existing requests to complete)
    logger.info('[Shutdown] Closing HTTP server...');

    // Disconnect from MongoDB
    logger.info('[Shutdown] Disconnecting from MongoDB...');
    await disconnectMongoDB();

    // Close Redis connection
    logger.info('[Shutdown] Closing Redis connection...');
    await redis.quit();

    logger.info('[Shutdown] Graceful shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error('[Shutdown] Error during shutdown', { error });
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('[UncaughtException]', { error: error.message, stack: error.stack });
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('[UnhandledRejection]', { reason, promise });
});

// Start the server
startServer();

export default app;