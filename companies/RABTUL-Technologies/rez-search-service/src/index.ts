import 'dotenv/config';
import 'express-async-errors';
import * as Sentry from '@sentry/node';
import mongoose from 'mongoose';

process.env.SERVICE_NAME = process.env.SERVICE_NAME || 'rez-search-service';

// Sentry error tracking — initialise before anything else
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
import mongoSanitize from 'express-mongo-sanitize';
import IORedis, { RedisOptions } from 'ioredis';
import { connectMongoDB, disconnectMongoDB } from './config/mongodb';
import { redis, CACHE_INVALIDATE_CHANNEL, CACHE_INVALIDATION_PATTERNS } from './config/redis';
import { startHealthServer } from './health';
import searchRoutes from './routes/searchRoutes';
import homepageRoutes from './routes/homepageRoutes';
import recommendationRoutes from './routes/recommendationRoutes';
import historyRoutes from './routes/historyRoutes';
import { logger } from './config/logger';
import { tracingMiddleware } from './middleware/tracing';

/**
 * SEA-006 FIX: Event-driven cache invalidation via Redis pub/sub.
 *
 * Uses a dedicated subscriber connection (not the main connection) so that
 * long-running commands on the main connection do not block message delivery.
 * On receiving an invalidation message, flushes Redis keys matching the entity type
 * using SCAN (batched, non-blocking) so large keyspaces are evicted efficiently.
 */
function startCacheInvalidationSubscriber(): void {
  const sub = new IORedis(redis.options as RedisOptions);

  sub.subscribe(CACHE_INVALIDATE_CHANNEL, (err) => {
    if (err) {
      logger.error('[CacheInvalidation] Failed to subscribe to channel', { error: err.message });
      return;
    }
    logger.info(`[CacheInvalidation] Subscribed to ${CACHE_INVALIDATE_CHANNEL}`);
  });

  sub.on('message', async (channel, message: string) => {
    if (channel !== CACHE_INVALIDATE_CHANNEL) return;
    let payload: { type?: string; keys?: string[] };
    try {
      payload = JSON.parse(message);
    } catch {
      logger.warn('[CacheInvalidation] Received unparseable message', { message });
      return;
    }

    const { type, keys } = payload;
    if (!type) {
      logger.warn('[CacheInvalidation] Message missing "type" field', { payload });
      return;
    }

    const pattern = CACHE_INVALIDATION_PATTERNS[type];
    if (!pattern) {
      logger.warn('[CacheInvalidation] Unknown invalidation type', { type });
      return;
    }

    // If specific keys are provided, flush those directly (precise invalidation).
    // Otherwise fall back to pattern-based flush.
    const keysToFlush = keys?.length ? keys : [pattern];

    let flushedCount = 0;
    for (const patternOrKey of keysToFlush) {
      // Use SCAN to avoid blocking Redis on large keyspaces
      const isWildcard = patternOrKey.includes('*');
      if (isWildcard) {
        let cursor = '0';
        do {
          const [nextCursor, batch] = await sub.scan(cursor, 'MATCH', patternOrKey, 'COUNT', 100).then(r => [r[0], r[1]] as [string, string[]]);
          cursor = nextCursor;
          if (batch.length > 0) {
            await sub.del(...batch);
            flushedCount += batch.length;
          }
        } while (cursor !== '0');
      } else {
        await sub.del(patternOrKey);
        flushedCount++;
      }
    }

    logger.info('[CacheInvalidation] Cache invalidated', { type, flushedCount });
  });

  sub.on('error', (err) => logger.error('[CacheInvalidation] Subscriber error', { error: err.message }));
}

function validateEnv(): void {
  const required = ['MONGODB_URI', 'REDIS_URL', 'JWT_SECRET'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
}

// ── Architectural Debt: Search Indexing ──────────────────────────────────────
//
// TODO(arch): Search indexing is currently passive — it reads from MongoDB on
// each query. For production scale, search should be triggered reactively:
//
//   1. Catalog/product mutations in rez-backend (or rez-catalog-service, when
//      extracted) publish events to a BullMQ queue (e.g. "catalog-mutations").
//   2. A dedicated indexing worker in this service consumes those events and
//      updates a search-optimized store (e.g. MongoDB text index, Typesense,
//      or Meilisearch).
//   3. The HTTP search routes query the optimized store instead of raw
//      collections.
//
// This decouples write-path latency from search freshness and allows the
// search service to scale its indexing concurrency independently.
//
// Related services:
//   - rez-backend (product CRUD) — event producer
//   - rez-scheduler-service     — could host periodic full-reindex job
//   - rez-search-service        — event consumer + query server
// ─────────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  validateEnv();
  logger.info('Starting rez-search-service...');

  await connectMongoDB();

  const app = express();
  app.set('trust proxy', 1); // P1: Trust nginx/Render LB X-Forwarded-For so req.ip reflects real client IP
  if (process.env.SENTRY_DSN) app.use(Sentry.Handlers.requestHandler());
  app.use(helmet());
  app.use(cors({ origin: (process.env.CORS_ORIGIN || 'https://rez.money').split(',').map(s => s.trim()), credentials: true }));
  app.use(express.json({ limit: '256kb' }));
  app.use(mongoSanitize());
  app.use(tracingMiddleware);

  // Basic health check on the main port — Render probes this port by default.
  // The dedicated health server on HEALTH_PORT remains for detailed checks.
  app.get('/health', async (_req, res) => {
    const checks: Record<string, string> = { db: 'ok', redis: 'ok' };
    const errors: string[] = [];

    if (mongoose.connection.readyState !== 1) {
      checks.db = 'error';
      errors.push('MongoDB not connected');
    }

    if (redis.status !== 'ready') {
      checks.redis = 'error';
      errors.push('Redis not ready');
    }

    const healthStatus = errors.length > 0 ? 'degraded' : 'ok';
    res.status(errors.length > 0 ? 503 : 200).json({
      status: healthStatus,
      service: 'rez-search-service',
      checks,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/healthz', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'rez-search-service' });
  });

  // GET /health/detailed — Comprehensive health check with latency metrics
  app.get('/health/detailed', async (_req, res) => {
    const checks: Record<string, unknown> = {};
    let isHealthy = true;

    // Check MongoDB with latency
    const mongoStart = Date.now();
    try {
      if (mongoose.connection.readyState !== 1) throw new Error('not connected');
      await mongoose.connection.db?.admin().ping();
      checks.database = { status: 'up', latencyMs: Date.now() - mongoStart };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      checks.database = { status: 'down', error: msg, latencyMs: Date.now() - mongoStart };
      isHealthy = false;
    }

    // Check Redis with latency
    const redisStart = Date.now();
    try {
      if (redis.status !== 'ready') throw new Error('Redis not ready');
      await redis.ping();
      checks.redis = { status: 'up', latencyMs: Date.now() - redisStart };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      checks.redis = { status: 'down', error: msg, latencyMs: Date.now() - redisStart };
      isHealthy = false;
    }

    const overallStatus = isHealthy ? 'healthy' : 'unhealthy';
    res.status(overallStatus === 'healthy' ? 200 : 503).json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.SERVICE_VERSION || '1.0.0',
      uptime: process.uptime(),
      checks,
    });
  });

  // Swagger UI API documentation
  app.use('/api-docs', require('swagger-ui-express'), require('yamljs').load('./docs/openapi.yaml'),
    require('swagger-ui-express').serve,
    require('swagger-ui-express').setup(
      require('yamljs').load('./docs/openapi.yaml'),
      { customCss: '.swagger-ui .topbar { display: none }', customSiteTitle: 'ReZ Search API Docs' }
    )
  );
  app.get('/api-docs.json', (_req, res) => {
    res.json(require('yamljs').load('./docs/openapi.yaml'));
  });

  app.use('/', searchRoutes);
  app.use('/', homepageRoutes);
  app.use('/', recommendationRoutes);
  app.use('/', historyRoutes);

  if (process.env.SENTRY_DSN) app.use(Sentry.Handlers.errorHandler());

  // Global error handler — catches errors even when Sentry is not configured
  app.use((err, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error('Unhandled error', { error: err.message, stack: err.stack });
    res.status(500).json({ success: false, error: 'Internal server error' });
  });

  const port = parseInt(process.env.PORT || '4003', 10);
  const healthPort = parseInt(process.env.HEALTH_PORT || '4103', 10);

  const server = app.listen(port, () => logger.info(`HTTP on :${port}`));
  const healthServer = startHealthServer(healthPort);

  const shutdown = async (signal: string) => {
    logger.info(`[${signal}] Shutting down...`);
    server.close();
    healthServer.close();
    await redis.quit();
    await disconnectMongoDB();
    process.exit(0);
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

  startCacheInvalidationSubscriber();
  logger.info('rez-search-service ready');
}

main().catch((err) => { logger.error('[FATAL]', err); process.exit(1); });
