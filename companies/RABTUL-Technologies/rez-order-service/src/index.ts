/**
 * rez-order-service — Standalone BullMQ Worker Service
 *
 * Phase C extraction from REZ monolith (Strangler Fig pattern).
 */

import 'dotenv/config';
import 'express-async-errors';

process.env.SERVICE_NAME = 'rez-order-service';

import { logger } from './config/logger';
import { connectMongoDB, disconnectMongoDB } from './config/mongodb';
import { bullmqRedis } from './config/redis';
import { startHealthServer } from './health';
import { startOrderWorker, stopWorker } from './worker';
import { startHttpServer } from './httpServer';

/**
 * Validates that all required environment variables are set.
 * Exits the process with code 1 if unknown required variables are missing.
 * @throws Never returns — calls process.exit(1) on validation failure
 */
function validateEnv(): void {
  const required = ['MONGODB_URI', 'REDIS_URL'];
  const missing = required.filter((k) => !process.env[k]);
  // Accept either the scoped map or the legacy shared token
  if (!process.env.INTERNAL_SERVICE_TOKENS_JSON && !process.env.INTERNAL_SERVICE_TOKEN) {
    missing.push('INTERNAL_SERVICE_TOKENS_JSON or INTERNAL_SERVICE_TOKEN');
  }
  if (missing.length > 0) {
    logger.error(`[FATAL] Missing required env vars: ${missing.join(', ')}`);
    process.exit(1);
  }
}

/**
 * Initializes the order service: connects to MongoDB, starts the BullMQ worker,
 * the HTTP server, and registers SIGTERM/SIGINT graceful shutdown handlers.
 * @returns Resolves when the service is fully initialized and ready
 */
async function main(): Promise<void> {
  validateEnv();
  logger.info('[rez-order-service] Starting...');

  await connectMongoDB();
  const worker = startOrderWorker();
  const httpPort = parseInt(process.env.PORT || '3006', 10);
  // HTTP server serves /health + read-only order endpoints for Render web service
  const httpServer = startHttpServer(httpPort);
  // Legacy plain-http health server on a separate internal port if configured
  const legacyHealthPort = parseInt(process.env.HEALTH_PORT || '0', 10);
  const healthServer = legacyHealthPort > 0 ? startHealthServer(legacyHealthPort) : null;

  const shutdown = async (signal: string) => {
    logger.info(`[${signal}] Graceful shutdown initiated`);
    try {
      await stopWorker();
      httpServer.close();
      if (healthServer) healthServer.close();
      await bullmqRedis.quit();
      await disconnectMongoDB();
      logger.info('[rez-order-service] Shutdown complete');
      process.exit(0);
    } catch (err) {
      logger.error('[rez-order-service] Shutdown error:', err);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  logger.info('[rez-order-service] Ready');
}

process.on('unhandledRejection', (reason) => {
  logger.error('[FATAL] Unhandled rejection:', reason);
  // OBS-5: forward to Sentry so async queue failures don't go invisible
  // in production. Sentry.init() runs in httpServer.ts on boot — lazy
  // require avoids startup-order coupling.
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Sentry = require('@sentry/node');
    if (process.env.SENTRY_DSN) Sentry.captureException(reason);
  } catch {
    /* Sentry not ready — logger output above is still captured */
  }
});

process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Sentry = require('@sentry/node');
    if (process.env.SENTRY_DSN) Sentry.captureException(err);
  } catch {
    /* best effort */
  }
  process.exit(1);
});

main().catch((err) => {
  logger.error('[FATAL] Failed to start:', err);
  process.exit(1);
});


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-order-service',
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
