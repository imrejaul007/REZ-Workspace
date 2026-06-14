// MUST be the first import — OpenTelemetry tracing must initialize before any other module
// import './config/tracing';

import 'dotenv/config';
import 'express-async-errors';

process.env.SERVICE_NAME = process.env.SERVICE_NAME || 'risna-property-service';

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import { connectMongoDB, disconnectMongoDB } from './config/mongodb';
import { redis } from './config/redis';
import { startHealthServer } from './health';
import propertyRoutes from './routes/property.routes';
import internalRoutes from './routes/internal.routes';
import { logger } from './config/logger';
import { tracingMiddleware, metricsMiddleware } from './middleware/tracing';
import { successResponse, errorResponse, errors } from './utils/response';

function validateEnv(): void {
  const required = [
    'MONGODB_URI',
    'REDIS_URL',
    'INTERNAL_SERVICE_TOKEN',
  ];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    logger.error(`[FATAL] Missing required env vars: ${missing.join(', ')}`);
    process.exit(1);
  }
}

async function main(): Promise<void> {
  validateEnv();
  logger.info('Starting risna-property-service...');

  await connectMongoDB();

  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(compression());

  // CORS configuration
  const rawOrigins = process.env.CORS_ORIGIN || 'https://risnaestate.com,https://www.risnaestate.com,http://localhost:3000';
  const allowedOrigins = rawOrigins.split(',').map(s => s.trim()).filter(Boolean);

  app.use(cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  }));

  app.use(express.json({ limit: '10mb' }));
  app.use(mongoSanitize());
  app.use(metricsMiddleware);
  app.use(tracingMiddleware);

  // Health check on main port
  app.get('/health', (_req, res) => {
    const mongoOk = require('mongoose').connection.readyState === 1;
    const redisOk = redis.status === 'ready';
    if (!mongoOk) {
      res.status(503).json({ status: 'unhealthy', mongo: mongoOk, redis: redisOk });
      return;
    }
    res.status(200).json({ status: redisOk ? 'ok' : 'degraded', mongo: mongoOk, redis: redisOk });
  });

  // API Routes
  app.use('/api/v1/properties', propertyRoutes);

  // Internal Routes
  app.use('/internal', internalRoutes);

  // Global error handler
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const requestId = (res as any).locals?.requestId;

    if (err instanceof Error && 'code' in err) {
      return errorResponse(res, err as any);
    }

    logger.error('Unhandled error', { error: err.message, stack: err.stack, requestId });
    return errorResponse(res, errors.internalError());
  });

  const port = parseInt(process.env.PORT || '4100', 10);
  const healthPort = parseInt(process.env.HEALTH_PORT || '4200', 10);

  const server = app.listen(port, () => logger.info(`HTTP on :${port}`));
  const healthServer = startHealthServer(healthPort);

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
      await redis.quit().catch((err) => logger.error('[SHUTDOWN] Redis quit failed', { error: err?.message }));
      logger.info('[SHUTDOWN] Redis disconnected');

      await disconnectMongoDB();
      logger.info('[SHUTDOWN] MongoDB disconnected');

      logger.info('[SHUTDOWN] Graceful shutdown complete');
      process.exit(0);
    } catch (err) {
      logger.error('[SHUTDOWN] Error during shutdown', err);
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

  logger.info('risna-property-service ready');
}

main().catch((err) => { logger.error('[FATAL]', err); process.exit(1); });
