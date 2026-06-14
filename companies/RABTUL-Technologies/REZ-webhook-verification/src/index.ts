/**
 * REZ Webhook Verification Service
 * Main entry point
 */

import 'dotenv/config';
import express, { Express, Request, Response, NextFunction } from 'express';
import { tracingMiddleware } from './middleware/tracing';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import mongoose from 'mongoose';

import { config } from './utils/config';
import { logger } from './utils/logger';
import { requestIdMiddleware } from './middleware/requestId';
import { rateLimiter, verificationRateLimiter } from './middleware/rateLimit';
import webhookRoutes from './routes/webhook';
import { eventRegistry } from './services/eventRegistry';
import { providerConfigs } from './services/providerConfigs';

const app: Express = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:']
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true
  }
}));

// CORS configuration
// SECURITY FIX (HIGH-02): Require ALLOWED_ORIGINS in production
const getCorsOrigins = (): string[] => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(s => s.trim()) || [];

  if (config.NODE_ENV === 'production') {
    // In production, throw if no origins configured
    if (allowedOrigins.length === 0) {
      throw new Error('ALLOWED_ORIGINS must be set in production!');
    }
    return allowedOrigins;
  }

  // In development, allow localhost
  return ['http://localhost:3000', 'http://localhost:8080', ...allowedOrigins];
};

app.use(cors({
  origin: getCorsOrigins(),
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Internal-Token',
    'X-Service-Id',
    'X-Request-Id',
    'X-Signature',
    'X-Timestamp'
  ],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request ID middleware
app.use(requestIdMiddleware);

// Global rate limiter
app.use(rateLimiter);

// Health check (no auth required)
app.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      service: 'webhook-verification',
      timestamp: new Date().toISOString()
    }
  });
});

// Readiness check
app.get('/ready', async (req: Request, res: Response) => {
  try {
    // Check MongoDB connection
    const mongoReady = mongoose.connection.readyState === 1;

    if (!mongoReady) {
      return res.status(503).json({
        success: false,
        data: { status: 'not ready', reason: 'MongoDB not connected' }
      });
    }

    return res.json({
      success: true,
      data: {
        status: 'ready',
        mongodb: 'connected',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return res.status(503).json({
      success: false,
      data: { status: 'not ready', error: 'Internal error' }
    });
  }
});

// API routes
app.use('/api/v1', verificationRateLimiter, webhookRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    }
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: config.NODE_ENV === 'production'
        ? 'An internal error occurred'
        : err.message
    }
  });
});

// Database connection
async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });

    logger.info('MongoDB connected', { uri: config.MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@') });

    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB error', { error });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
  } catch (error) {
    logger.error('MongoDB connection failed', { error });
    throw error;
  }
}

// Initialize services
async function initializeServices(): Promise<void> {
  // Initialize Redis for deduplication
  await eventRegistry.initializeRedis(config.REDIS_URL);

  // Reload provider configs from environment
  providerConfigs.reloadFromEnvironment();

  logger.info('Services initialized');
}

// Retry scheduler (background job)
let retrySchedulerInterval: NodeJS.Timeout | null = null;

async function startRetryScheduler(): Promise<void> {
  retrySchedulerInterval = setInterval(async () => {
    try {
      const pendingEvents = await eventRegistry.getPendingRetries();

      for (const event of pendingEvents) {
        const provider = providerConfigs.getProvider(event.providerId);
        if (!provider?.relayUrl) {
          continue;
        }

        logger.info('Processing retry', { eventId: event.id });

        const result = await eventRegistry.relayEvent(event.id, {
          eventId: event.id,
          targetUrl: provider.relayUrl,
          payload: event.payload,
          headers: {
            'X-Webhook-Event-Id': event.id,
            'X-Webhook-Provider': event.providerId,
            'X-Webhook-Retry': String(event.retryCount)
          }
        });

        if (!result.success && event.retryCount < event.maxRetries) {
          await eventRegistry.scheduleRetry(event.id);
        }
      }
    } catch (error) {
      logger.error('Retry scheduler error', { error });
    }
  }, 30000); // Check every 30 seconds

  logger.info('Retry scheduler started');
}

// Cleanup scheduler
let cleanupSchedulerInterval: NodeJS.Timeout | null = null;

function startCleanupScheduler(): void {
  // Run cleanup daily at midnight
  const msUntilMidnight = (() => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return midnight.getTime() - now.getTime();
  })();

  setTimeout(() => {
    // Run cleanup
    eventRegistry.cleanupOldEvents(config.EVENT_RETENTION_DAYS)
      .then(count => logger.info('Scheduled cleanup completed', { deletedCount: count }));

    // Then run every 24 hours
    cleanupSchedulerInterval = setInterval(() => {
      eventRegistry.cleanupOldEvents(config.EVENT_RETENTION_DAYS)
        .then(count => logger.info('Scheduled cleanup completed', { deletedCount: count }));
    }, 24 * 60 * 60 * 1000);
  }, msUntilMidnight);

  logger.info('Cleanup scheduler started');
}

// Graceful shutdown
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, shutting down gracefully`);

  // Stop schedulers
  if (retrySchedulerInterval) {
    clearInterval(retrySchedulerInterval);
  }
  if (cleanupSchedulerInterval) {
    clearInterval(cleanupSchedulerInterval);
  }

  // Close MongoDB connection
  await mongoose.connection.close();
  logger.info('MongoDB connection closed');

  process.exit(0);
}

// Start server
async function startServer(): Promise<void> {
  try {
    // Connect to database
    await connectDatabase();

    // Initialize services
    await initializeServices();

    // Start schedulers
    startRetryScheduler();
    startCleanupScheduler();

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', { error });
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled rejection', { reason });
    });

    // Start listening
    app.listen(config.PORT, () => {
      logger.info(`Webhook Verification Service started`, {
        port: config.PORT,
        env: config.NODE_ENV,
        pid: process.pid
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Start the application
startServer();

export { app };
