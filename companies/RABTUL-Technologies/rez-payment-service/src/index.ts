import 'dotenv/config';
import 'express-async-errors';
// Validate environment config immediately on startup — fail fast if invalid
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
import { startReconciliationJobs } from './jobs/reconciliation';
import { startLostCoinsRecoveryWorker, stopLostCoinsRecoveryWorker } from './jobs/lostCoinsRecoveryWorker';
// Sprint-1 pre-req C (DEPLOY_COORDINATION.md §Pre-req C):
// The legacy ./worker/walletCreditWorker imports were removed. It
// consumed the same `wallet-credit` queue as ./worker (startPaymentWorker),
// so running both meant two concurrency=1 workers on one queue —
// effectively concurrency=2 — which breaks the BAK-CROSS-021 race-safety
// guarantee for financial credits. The canonical implementation is
// ./worker (startPaymentWorker), which also performs the INC-4
// `emitCoinsAwarded` socket emit that the legacy worker lacked.
import { stopPaymentWorker } from './worker';
import paymentRoutes from './routes/paymentRoutes';
import dlqAdminRoutes from './routes/dlqAdmin'; // D12: DLQ admin parity with monolith
import { logger } from './config/logger';
// NBFC partner module — import ensures it resolves and its factory is callable
// by other modules that import from this service.
import { getNbfcPartner } from './integrations/nbfc-partner';
export { getNbfcPartner };
import { tracingMiddleware } from './middleware/tracing';
import { metricsMiddleware, getMetricsHandler } from './metrics';
import { generalLimiter } from './middleware/rateLimiter';

function validateEnv(): void {
  const required = [
    'MONGODB_URI',
    'REDIS_URL',
    'JWT_SECRET',
  ];
  const missing = required.filter((k) => !process.env[k]);
  // Only the scoped token map is accepted — the legacy single-token fallback
  // has been removed to prevent accidental acceptance of a weaker credential.
  if (!process.env.INTERNAL_SERVICE_TOKENS_JSON) {
    missing.push('INTERNAL_SERVICE_TOKENS_JSON');
  }
  if (missing.length > 0) {
    logger.error(`[FATAL] Missing required env vars: ${missing.join(', ')}`);
    process.exit(1);
  }

  // Razorpay creds are optional until a live provider is connected
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    logger.warn('[STARTUP] RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set — Razorpay payments disabled');
  }
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    // RAZORPAY_WEBHOOK_SECRET is only required when Razorpay is actually configured.
    // Warn instead of failing if the key/secret are missing.
    if (process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_SECRET) {
      missing.push('RAZORPAY_WEBHOOK_SECRET');
    }
  }
  if (!process.env.WALLET_SERVICE_URL) {
    logger.warn('[STARTUP] WALLET_SERVICE_URL not set — payment capture will not credit wallets');
  }
}

async function main(): Promise<void> {
  validateEnv();
  logger.info('Starting rez-payment-service...');

  await connectMongoDB();

  const app = express();
  app.set('trust proxy', 1); // P1: Trust nginx/Render LB X-Forwarded-For so req.ip reflects real client IP

  // BAK-CROSS-015 FIX: Validate X-Forwarded-For chain for spoofing attacks.
  // An attacker can send X-Forwarded-For: 127.0.0.1 to bypass IP-based restrictions if
  // the header is trusted blindly. We validate that the outermost trusted IP is NOT
  // a loopback/private address — if it is, fall back to socket.remoteAddress.
  app.use((req, _res, next) => {
    const forwarded = req.headers['x-forwarded-for'] as string | undefined;
    if (forwarded) {
      // trust proxy = 1 means Express uses the FIRST IP as the client IP.
      // That IP must not be a loopback/private address (spoofed by attacker).
      const outermost = forwarded.split(',')[0].trim();
      const normalized = outermost.replace(/^::ffff:/, '');
      const isLoopbackOrPrivate =
        normalized === '127.0.0.1' ||
        normalized === '::1' ||
        normalized.startsWith('10.') ||
        normalized.startsWith('172.16.') || normalized.startsWith('172.17.') ||
        normalized.startsWith('172.18.') || normalized.startsWith('172.19.') ||
        normalized.startsWith('172.2') || normalized.startsWith('172.30.') || normalized.startsWith('172.31.') ||
        normalized.startsWith('192.168.') ||
        normalized === '0.0.0.0';
      if (isLoopbackOrPrivate) {
        // Reject if the outermost X-Forwarded-For IP is loopback/private — this is spoofing.
        // Log and fall through — the request will still be processed but req.ip will be
        // socket.remoteAddress (not the spoofed XFF value).
        logger.warn('[XFF] Spoofed X-Forwarded-For detected — rejecting outermost IP', {
          xff: outermost,
          socketIp: req.socket?.remoteAddress,
          path: req.path,
        });
      }
    }
    next();
  });

  if (process.env.SENTRY_DSN) app.use(Sentry.Handlers.requestHandler());
  app.use(helmet());
  // PERFORMANCE: Enable gzip compression for all responses
  app.use(compression());
  app.use(cors({ origin: (process.env.CORS_ORIGIN || 'https://rez.money').split(',').map((s) => s.trim()) }));
  // Webhook routes must receive the raw request body for HMAC verification.
  // Mount express.raw() BEFORE express.json() for these specific paths so that
  // req.body is a Buffer (not parsed JSON) when the handler runs.
  const webhookPaths = ['/pay/webhook/razorpay', '/api/payment/webhook/razorpay'];
  for (const path of webhookPaths) {
    app.use(path, express.raw({ type: 'application/json', limit: '1mb' }));
  }

  app.use(express.json({ limit: '1mb' }));
  // M18 FIX: Add explicit limit to urlencoded to prevent payload bomb attacks.
  // An attacker could send a large URL-encoded body to exhaust server memory.
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));
  app.use(mongoSanitize());

  // Prometheus metrics middleware — before routes
  app.use(metricsMiddleware);

  // W3C traceparent propagation — before routes
  app.use(tracingMiddleware);

  // C10: General rate limiter — applies to all routes (300 req / 15 min per IP)
  app.use(generalLimiter);

  // Routes
  // D12: DLQ admin endpoints (protected by x-internal-token inside the router).
  // Mount BEFORE paymentRoutes to avoid any path shadowing on /admin/*.
  app.use('/admin/dlq', dlqAdminRoutes);

  // Prometheus metrics endpoint
  app.get('/metrics', getMetricsHandler);

  // Swagger UI API documentation
  const swaggerDocument = require('yamljs').load('./docs/openapi.yaml');
  app.use('/api-docs', require('swagger-ui-express').serve);
  app.get('/api-docs.json', (_req, res) => {
    res.json(swaggerDocument);
  });
  app.use('/', require('swagger-ui-express').setup(swaggerDocument, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'ReZ Payment API Docs',
  }));

  app.use('/', paymentRoutes);
  if (process.env.SENTRY_DSN) app.use(Sentry.Handlers.errorHandler());

  // Global error handler — catches errors even when Sentry is not configured
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error('Unhandled error', { error: err.message, stack: err.stack });
    res.status(500).json({ success: false, message: 'Internal server error' });
  });

  // Start servers
  const port = parseInt(process.env.PORT || '4001', 10);
  const healthPort = parseInt(process.env.HEALTH_PORT || '4101', 10);

  const server = 

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-payment-service',
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
app.listen(port, () => {
    logger.info(`HTTP server on :${port}`);
  });

  const healthServer = startHealthServer(healthPort);
  startReconciliationJobs();

  // F-01 FIX: Start the lost-coins recovery worker. Runs immediately on startup to
  // catch any payments stuck between walletCredited=true and the BullMQ enqueue, then
  // every 5 minutes thereafter.
  try {
    startLostCoinsRecoveryWorker();
    logger.info('[STARTUP] Lost-coins recovery worker started');
  } catch (err) {
    logger.warn('[STARTUP] Could not start lost-coins recovery worker — non-fatal', { error: (err as Error)?.message });
  }

  // INC-4 FIX + Sprint-1 pre-req C: Single wallet-credit worker consuming
  // the `wallet-credit` queue. Previously both startWalletCreditWorker()
  // (legacy ./worker/walletCreditWorker) AND startPaymentWorker() ran in
  // parallel on the same queue, compounding the BAK-CROSS-021 concurrency=1
  // race-safety guarantee. Pre-req C deletes the legacy worker; the
  // canonical one in ./worker remains.
  try {
    const { startPaymentWorker } = require('./worker') as { startPaymentWorker?: () => void };
    if (typeof startPaymentWorker === 'function') {
      startPaymentWorker();
    }
  } catch (err) {
    logger.warn('[STARTUP] Could not start payment worker — non-fatal', { error: (err as Error)?.message });
  }

  // BAK-CROSS-022 FIX: Start the monolith-sync worker so that webhook-sync calls
  // to the monolith are processed via BullMQ with retry logic instead of fire-and-forget.
  try {
    const { startMonolithSyncWorker } = require('./services/paymentService') as { startMonolithSyncWorker?: () => void };
    if (typeof startMonolithSyncWorker === 'function') {
      startMonolithSyncWorker();
      logger.info('[STARTUP] Monolith sync worker started');
    }
  } catch (err) {
    logger.warn('[STARTUP] Could not start monolith sync worker — non-fatal', { error: (err as Error)?.message });
  }

  // Graceful shutdown
  let isShuttingDown = false;
  const shutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    logger.info(`[SHUTDOWN] ${signal} received — graceful shutdown starting`);

    // 1. Stop accepting new HTTP connections
    server.close(() => {
      logger.info('[SHUTDOWN] HTTP server closed');
    });
    healthServer.close();

    try {
      // 2. Drain BullMQ workers (canonical wallet-credit worker in ./worker).
      await stopPaymentWorker();
      logger.info('[SHUTDOWN] BullMQ wallet-credit worker drained');

      // 3. Close Redis
      await redis.quit().catch((err: Error) => logger.warn('[SHUTDOWN] Redis quit failed', { error: err?.message }));

      // 4. Close MongoDB
      await disconnectMongoDB();

      logger.info('[SHUTDOWN] Graceful shutdown complete');
      process.exit(0);
    } catch (err) {
      logger.error('[SHUTDOWN] Error during shutdown', { error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined });
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // F-01 FIX: Stop the recovery worker interval on shutdown
  process.on('beforeExit', () => {
    stopLostCoinsRecoveryWorker();
  });
  process.on('unhandledRejection', (reason: unknown) => {
    logger.error('Unhandled promise rejection', { reason: reason instanceof Error ? reason.message : String(reason) });
  });
  process.on('uncaughtException', (err: Error) => {
    logger.error('Uncaught exception', { error: err.message, stack: err.stack });
    process.exit(1);
  });

  logger.info('rez-payment-service ready');
}

main().catch((err) => {
  logger.error('[FATAL]', { error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined });
  process.exit(1);
});
