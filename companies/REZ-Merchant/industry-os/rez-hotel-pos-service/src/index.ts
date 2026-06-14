import 'dotenv/config';
import 'express-async-errors';
import { env } from './config/env';
import * as Sentry from '@sentry/node';

process.env.SERVICE_NAME = env.SERVICE_NAME;

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'production',
    serverName: process.env.SERVICE_NAME,
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
  });
}

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import { connectMongoDB, disconnectMongoDB } from './config/mongodb';
import { redis } from './config/redis';
import { startHealthServer } from './health';
import { logger } from './config/logger';
import { tracingMiddleware } from './middleware/tracing';
import { metricsMiddleware, getMetricsHandler } from './metrics';
import { generalLimiter } from './middleware/rateLimiter';

// Routes
import folioRoutes from './routes/folio.routes';
import outletRoutes from './routes/outlet.routes';
import paymentRoutes from './routes/payment.routes';

function validateEnv(): void {
  const required = [
    'MONGODB_URI',
    'REDIS_URL',
    'JWT_SECRET',
  ];
  const missing = required.filter((k) => !process.env[k]);

  if (!process.env.INTERNAL_SERVICE_TOKENS_JSON) {
    missing.push('INTERNAL_SERVICE_TOKENS_JSON');
  }

  if (missing.length > 0) {
    logger.error(`[FATAL] Missing required env vars: ${missing.join(', ')}`);
    process.exit(1);
  }

  // PMS integration is optional but recommended
  if (!process.env.PMS_SERVICE_URL) {
    logger.warn('[STARTUP] PMS_SERVICE_URL not set — PMS integration disabled');
  }

  // Payment service integration
  if (!process.env.PAYMENT_SERVICE_URL) {
    logger.warn('[STARTUP] PAYMENT_SERVICE_URL not set — payment capture will not work');
  }
}

async function main(): Promise<void> {
  validateEnv();
  logger.info('Starting rez-hotel-pos-service...');

  await connectMongoDB();

  const app = express();
  app.set('trust proxy', 1);

  if (process.env.SENTRY_DSN) app.use(Sentry.Handlers.requestHandler());
  app.use(helmet());
  app.use(compression());
  app.use(cors({ origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map((s) => s.trim()) }));

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));
  app.use(mongoSanitize());

  // Prometheus metrics middleware
  app.use(metricsMiddleware);

  // W3C traceparent propagation
  app.use(tracingMiddleware);

  // Rate limiter
  app.use(generalLimiter);

  // Prometheus metrics endpoint
  app.get('/metrics', getMetricsHandler);

  // Routes
  app.use('/api/folio', folioRoutes);
  app.use('/api/outlet', outletRoutes);
  app.use('/api/payment', paymentRoutes);

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'rez-hotel-pos-service' });
  });

  if (process.env.SENTRY_DSN) app.use(Sentry.Handlers.errorHandler());

  // Global error handler
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error('Unhandled error', { error: err.message, stack: err.stack });
    res.status(500).json({ success: false, message: 'Internal server error' });
  });

  // Start servers
  const port = parseInt(process.env.PORT || '4005', 10);
  const healthPort = parseInt(process.env.HEALTH_PORT || '4105', 10);

  const server = app.listen(port, () => {
    logger.info(`HTTP server on :${port}`);
  });

  const healthServer = startHealthServer(healthPort);

  // Graceful shutdown
  let isShuttingDown = false;
  const shutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    logger.info(`[SHUTDOWN] ${signal} received — graceful shutdown starting`);

    server.close(() => {
      logger.info('[SHUTDOWN] HTTP server closed');
    });
    healthServer.close();

    try {
      await redis.quit().catch((err: Error) => logger.warn('[SHUTDOWN] Redis quit failed', { error: err?.message }));
      await disconnectMongoDB();
      logger.info('[SHUTDOWN] Graceful shutdown complete');
      process.exit(0);
    } catch (err) {
      logger.error('[SHUTDOWN] Error during shutdown', {
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (reason: unknown) => {
    logger.error('Unhandled promise rejection', { reason: reason instanceof Error ? reason.message : String(reason) });
  });
  process.on('uncaughtException', (err: Error) => {
    logger.error('Uncaught exception', { error: err.message, stack: err.stack });
    process.exit(1);
  });

  logger.info('rez-hotel-pos-service ready');
}

main().catch((err) => {
  logger.error('[FATAL]', { error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined });
  process.exit(1);
});
