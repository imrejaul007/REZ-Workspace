import 'dotenv/config';
import express, { Express, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Redis from 'ioredis';
import rateLimit from 'express-rate-limit';
import winston from 'winston';
import * as Sentry from '@sentry/node';

// Services
import { performHealthCheck } from './services/healthCheck.js';
import { createMetricsCollector, MetricsCollector } from './services/metricsCollector.js';
import { createAlertService, AlertService } from './services/alertService.js';

// Routes
import { createMonitoringRoutes } from './routes/monitoring.routes.js';

// Models (for side effects - registering schemas)
import './models/MetricSnapshot.js';

// Logger setup
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Sentry initialization
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1
  });
}

// Configuration
const CONFIG = {
  PORT: parseInt(process.env.PORT || '4024', 10),
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-loyalty-monitoring',
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || undefined,
  METRICS_COLLECTION_INTERVAL: parseInt(process.env.METRICS_COLLECTION_INTERVAL_MS || '10000', 10),
  ALERT_CHECK_INTERVAL: parseInt(process.env.ALERT_CHECK_INTERVAL_MS || '30000', 10)
};

// Global instances
let redis: Redis;
let metricsCollector: MetricsCollector;
let alertService: AlertService;
let app: Express;

// Graceful shutdown handling
let isShuttingDown = false;

async function gracefulShutdown(signal: string) {
  if (isShuttingDown) {
    logger.warn('Shutdown already in progress...');
    return;
  }

  isShuttingDown = true;
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  try {
    // Stop accepting new requests
    if (server) {
      server.close(() => {
        logger.info('HTTP server closed');
      });
    }

    // Stop services
    metricsCollector?.stop();
    alertService?.stop();

    // Close connections
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');

    await redis?.quit();
    logger.info('Redis connection closed');

    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
}

// Initialize Redis connection
async function initRedis(): Promise<Redis> {
  const redisClient = new Redis({
    host: CONFIG.REDIS_HOST,
    port: CONFIG.REDIS_PORT,
    password: CONFIG.REDIS_PASSWORD,
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 100, 3000);
      return delay;
    },
    maxRetriesPerRequest: 3
  });

  redisClient.on('connect', () => {
    logger.info('Redis connected');
  });

  redisClient.on('error', (err) => {
    logger.error('Redis error:', err);
  });

  return redisClient;
}

// Initialize MongoDB connection
async function initMongoDB(): Promise<void> {
  try {
    await mongoose.connect(CONFIG.MONGODB_URI);
    logger.info('MongoDB connected');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    throw error;
  }
}

// Main application initialization
async function initializeApp(): Promise<Express> {
  app = express();

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    });
    next();
  });

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: { error: 'Too many requests, please try again later.' }
  });
  app.use('/api/', limiter);

  // Health check endpoint (no rate limiting)
  app.get('/health', async (req: Request, res: Response) => {
    const health = await performHealthCheck();
    const statusCode = health.overallStatus === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  });

  // Readiness check
  app.get('/ready', async (req: Request, res: Response) => {
    try {
      // Check MongoDB
      const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

      // Check Redis
      const redisStatus = redis.status === 'ready' ? 'connected' : redis.status;

      const isReady = mongoStatus === 'connected' && redisStatus === 'connected';

      res.status(isReady ? 200 : 503).json({
        status: isReady ? 'ready' : 'not ready',
        mongodb: mongoStatus,
        redis: redisStatus
      });
    } catch (error) {
      res.status(503).json({
        status: 'not ready',
        error: 'Health check failed'
      });
    }
  });

  // Mount monitoring routes
  app.use('/api/monitoring', createMonitoringRoutes({
    metricsCollector,
    alertService
  }));

  // Also mount routes directly for convenience
  app.use('/health', createMonitoringRoutes({
    metricsCollector,
    alertService
  }));

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Error handler
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error('Unhandled error:', err);
    Sentry?.captureException(err);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  });

  return app;
}

// Metrics collection and alert checking loop
async function startMonitoringLoop(): Promise<void> {
  logger.info('Starting monitoring loop...');

  // Set the alert check callback
  alertService.setAlertCheckCallback(async (context) => {
    try {
      // Get fresh data
      const health = await performHealthCheck();
      const metrics = await metricsCollector.collectMetrics();

      // Update context
      context.services = health.services;
      context.errorRates = metrics.errorRates;
      context.latencyMetrics = metrics.decisionLatency;
      context.cacheHitRate = metrics.profileCacheHitRate;

      // Check alerts
      await alertService.checkAlerts(context);
    } catch (error) {
      logger.error('Error in alert check callback:', error);
    }
  });

  // Start services
  metricsCollector.start();
  alertService.start();

  // Periodic snapshot storage
  setInterval(async () => {
    try {
      const health = await performHealthCheck();
      const metrics = await metricsCollector.collectMetrics();
      const activeAlerts = await alertService.getActiveAlerts(true);

      // Count services by status
      const summary = {
        totalServices: health.services.length,
        healthyServices: health.services.filter(s => s.status === 'healthy').length,
        degradedServices: health.services.filter(s => s.status === 'degraded').length,
        unhealthyServices: health.services.filter(s => s.status === 'unhealthy').length,
        activeAlerts: activeAlerts.filter(a => a.status === 'active').length
      };

      // Create snapshot
      const snapshot = new (await import('./models/MetricSnapshot.js')).MetricSnapshot({
        timestamp: new Date(),
        services: health.services,
        metrics: {
          eventsProcessedPerSecond: metrics.eventsProcessedPerSecond,
          decisionLatency: metrics.decisionLatency,
          errorRates: metrics.errorRates,
          overallErrorRate: metrics.overallErrorRate,
          profileCacheHitRate: metrics.profileCacheHitRate,
          tierUpgradeRate: metrics.tierUpgradeRate,
          streakMaintenanceRate: metrics.streakMaintenanceRate,
          badgeUnlockRate: metrics.badgeUnlockRate,
          scoreDistribution: metrics.scoreDistribution
        },
        alerts: activeAlerts,
        summary
      });

      await snapshot.save();
      logger.debug('Metric snapshot saved');
    } catch (error) {
      logger.error('Error saving metric snapshot:', error);
    }
  }, CONFIG.METRICS_COLLECTION_INTERVAL);

  // Cleanup old alerts periodically
  setInterval(async () => {
    try {
      await alertService.cleanupOldAlerts();
    } catch (error) {
      logger.error('Error cleaning up old alerts:', error);
    }
  }, 24 * 60 * 60 * 1000); // Once per day
}

// Server reference for graceful shutdown
let server: ReturnType<typeof app.listen> | null = null;

// Main entry point
async function main(): Promise<void> {
  try {
    logger.info('Starting REZ Loyalty Monitoring Service...');
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);

    // Initialize connections
    await initMongoDB();
    redis = await initRedis();

    // Initialize services
    metricsCollector = createMetricsCollector(redis);
    await metricsCollector.initialize();

    alertService = createAlertService();

    // Initialize Express app
    const app = await initializeApp();

    // Start monitoring loop
    await startMonitoringLoop();

    // Start server
    server = app.listen(CONFIG.PORT, () => {
      logger.info(`REZ Loyalty Monitoring Service running on port ${CONFIG.PORT}`);
      logger.info(`Health endpoint: http://localhost:${CONFIG.PORT}/health`);
      logger.info(`Metrics endpoint: http://localhost:${CONFIG.PORT}/health/metrics`);
      logger.info(`Alerts endpoint: http://localhost:${CONFIG.PORT}/health/alerts`);
      logger.info(`Dashboard endpoint: http://localhost:${CONFIG.PORT}/health/dashboard`);
    });

    // Register shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception:', error);
      Sentry?.captureException(error);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled rejection:', reason);
      gracefulShutdown('unhandledRejection');
    });

  } catch (error) {
    logger.error('Failed to start service:', error);
    Sentry?.captureException(error);
    process.exit(1);
  }
}

// Export for testing
export { app, metricsCollector, alertService, redis };

// Run if this is the main module
main();
