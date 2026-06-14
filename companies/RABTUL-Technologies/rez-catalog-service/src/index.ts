/**
 * rez-catalog-service — Standalone BullMQ Worker Service
 *
 * Phase C extraction from REZ monolith (Strangler Fig pattern).
 */

import 'dotenv/config';
import 'express-async-errors';
// Validate environment config immediately on startup — fail fast if invalid
import { env } from './config/env';

process.env.SERVICE_NAME = env.SERVICE_NAME;

import { logger } from './config/logger';
import { connectMongoDB, disconnectMongoDB } from './config/mongodb';
import { bullmqRedis } from './config/redis';
import { startHealthServer } from './health';
import { startCatalogWorker, stopWorker } from './worker';
import { startHttpServer } from './httpServer';

function validateEnv(): void {
  const required = ['MONGODB_URI', 'REDIS_URL'];
  const missing = required.filter((key) => !process.env[key]);
  // Accept either the scoped map or the legacy shared token
  if (!process.env.INTERNAL_SERVICE_TOKENS_JSON && !process.env.INTERNAL_SERVICE_TOKEN) {
    missing.push('INTERNAL_SERVICE_TOKENS_JSON or INTERNAL_SERVICE_TOKEN');
  }
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
}

async function main(): Promise<void> {
  validateEnv();
  logger.info('[rez-catalog-service] Starting...');

  await connectMongoDB();
  const worker = startCatalogWorker();
  const httpPort = parseInt(process.env.PORT || '3005', 10);
  // HTTP server serves /health + read-only catalog endpoints for Render web service
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
      logger.info('[rez-catalog-service] Shutdown complete');
      process.exit(0);
    } catch (err) {
      logger.error('[rez-catalog-service] Shutdown error:', err);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  logger.info('[rez-catalog-service] Ready');
}

process.on('unhandledRejection', (reason) => {
  logger.error('[FATAL] Unhandled rejection:', reason);
});

process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
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
    service: 'rez-catalog-service',
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
