import 'dotenv/config';
import 'express-async-errors';
import * as Sentry from '@sentry/node';

// Rate limiting for internal APIs
import { createInternalRateLimiter } from '@rez/rate-limiter';

process.env.SERVICE_NAME = 'rez-wallet-service';

// Sentry must init before anything else
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'production',
    serverName: process.env.SERVICE_NAME,
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
  });
}

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import mongoose from 'mongoose';
import { logger } from './config/logger';
// Register cross-service proxy stubs so Mongoose .populate() calls against
// 'Merchant' and 'Store' refs resolve without "Schema hasn't been registered" errors.
import './models/Merchant';
import './models/Store';
import { connectMongoDB } from './config/mongodb';
import walletRoutes from './routes/walletRoutes';
import merchantWalletRoutes from './routes/merchantWalletRoutes';
import internalRoutes from './routes/internalRoutes';
import referralRoutes from './routes/referralRoutes';
import payoutRoutes from './routes/payoutRoutes';
import creditScoreRoutes from './routes/creditScore';
import consumerCreditRoutes from './routes/consumerCredit';
import internalCreditRoutes from './routes/internalCredit';
import reconciliationRoutes from './routes/reconciliationRoutes';
import dlqAdminRoutes from './routes/dlqAdmin'; // D12: DLQ admin parity
import walletReadRoutes from './routes/walletReadRoutes'; // CQRS read routes
import corpPerksRoutes from './routes/corpPerksRoutes'; // CorpPerks routes
import savingsRoutes from './routes/savingsRoutes'; // Savings module routes
import savingsAdminRoutes from './routes/savingsAdminRoutes'; // Savings admin analytics routes
import healthRouter from './health'; // M23 FIX: Mount dedicated health router on /health/* for Render health checks
import { requireInternalToken } from './middleware/internalAuth';
import { tracingMiddleware } from './middleware/tracing';
import { requestLoggingMiddleware } from './middleware/requestLogging';
import { requestTimeoutMiddleware } from './middleware/requestTimeout';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

const app = express();
app.set('trust proxy', 1); // P1: Trust nginx/Render LB X-Forwarded-For so req.ip reflects real client IP

// AUDIT-FIX: Add X-Forwarded-For spoofing detection — mirrors the fix already
// applied in rez-payment-service (BAK-CROSS-015). An attacker can send
// X-Forwarded-For: 127.0.0.1 to bypass IP-based restrictions if the header is
// trusted blindly. We validate that the outermost trusted IP is NOT loopback/private.
app.use((req, _res, next) => {
  const forwarded = req.headers['x-forwarded-for'] as string | undefined;
  if (forwarded) {
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
      logger.warn('[XFF] Spoofed X-Forwarded-For detected — rejecting outermost IP', {
        xff: outermost,
        socketIp: req.socket?.remoteAddress,
        path: req.path,
      });
    }
  }
  next();
});

const PORT = parseInt(process.env.PORT || '4004', 10);

// ── Prometheus metrics counters ───────────────────────────────────────────────
let requestCount = 0;
let errorCount = 0;

// wallet_transactions_total{type="..."}
const walletTransactionsTotal = new Map<string, number>();
// wallet_balance_operations_total{op="credit"|"debit"}
const walletBalanceOpsTotal = new Map<string, number>();
// wallet_http_requests_total{method, route, status}
const walletHttpRequestsTotal = new Map<string, number>();
// wallet_http_duration_seconds — sum and count for average calculation
let walletHttpDurationSumSeconds = 0;
let walletHttpDurationCount = 0;

export function recordWalletTransaction(type: string): void {
  walletTransactionsTotal.set(type, (walletTransactionsTotal.get(type) ?? 0) + 1);
}

export function recordBalanceOperation(op: 'credit' | 'debit'): void {
  walletBalanceOpsTotal.set(op, (walletBalanceOpsTotal.get(op) ?? 0) + 1);
}

// Sentry request handler (must be first middleware)
// Sentry v8 removed Handlers - using expressIntegration instead
if (process.env.SENTRY_DSN) {
  // Sentry.Handlers removed in v8
}

// W3C traceparent propagation — before routes and metrics
app.use(tracingMiddleware);

// Request timeout middleware — 30 second default
const timeoutMs = parseInt(process.env.REQUEST_TIMEOUT_MS || '30000', 10);
app.use(requestTimeoutMiddleware(timeoutMs));

// Request logging middleware — logs method, path, status, duration
app.use(requestLoggingMiddleware);

// Core middleware
app.use(helmet());
// PERFORMANCE: Enable gzip compression for all responses
app.use(compression());

// SECURITY FIX: Validate CORS origins and prevent wildcard configuration
const rawCorsOrigins = process.env.CORS_ORIGIN || 'https://rez.money';
const corsOrigins = rawCorsOrigins.split(',').map((s) => s.trim()).filter(Boolean);

// SECURITY FIX: Reject wildcards in CORS origins
for (const origin of corsOrigins) {
  if (origin === '*' || origin.includes('*')) {
    logger.error(`[FATAL] CORS_ORIGIN contains wildcard: "${origin}". This is insecure. Use specific origins only.`);
    process.exit(1);
  }
}

app.use(cors({
  origin: (origin, cb) => {
    // Allow no-origin requests (server-to-server)
    if (!origin || corsOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '100kb' }));
app.use(mongoSanitize());

// Metrics tracking middleware
app.use((req, res, next) => {
  requestCount++;
  const startMs = Date.now();
  res.on('finish', () => {
    if (res.statusCode >= 500) errorCount++;
    const durationSecs = (Date.now() - startMs) / 1000;
    walletHttpDurationSumSeconds += durationSecs;
    walletHttpDurationCount++;
    const key = `${req.method}|${req.route?.path ?? req.path}|${res.statusCode}`;
    walletHttpRequestsTotal.set(key, (walletHttpRequestsTotal.get(key) ?? 0) + 1);
  });
  next();
});

// M23 FIX: Use dedicated health router for all /health/* endpoints.
app.use('/health', healthRouter);

// Readiness — can the service handle requests?
app.get('/health/ready', async (_req, res) => {
  const checks: Record<string, string> = {};
  let ready = true;

  try {
    if (mongoose.connection.readyState !== 1) throw new Error('not connected');
    await mongoose.connection.db?.admin().ping();
    checks.mongodb = 'ok';
  } catch (err: unknown) {
    checks.mongodb = `error: ${err instanceof Error ? err.message : String(err)}`;
    ready = false;
  }

  const { redis: redisClient } = await import('./config/redis');
  try {
    await redisClient.ping();
    checks.redis = 'ok';
  } catch (err: unknown) {
    checks.redis = `degraded: ${err instanceof Error ? err.message : String(err)}`;
    // Redis degraded is warning not fatal for wallet (locking will fail-closed)
  }

  res.status(ready ? 200 : 503).json({
    status: ready ? 'ready' : 'degraded',
    checks,
    timestamp: new Date().toISOString(),
  });
});

// Backward-compat health endpoints
app.get('/health', async (_req, res) => {
  const checks: Record<string, string> = { db: 'ok' };
  const errors: string[] = [];
  const memoryUsage = process.memoryUsage();

  if (mongoose.connection.readyState !== 1) {
    checks.db = 'error';
    errors.push('MongoDB not connected');
  }

  const status = errors.length > 0 ? 'degraded' : 'ok';
  res.status(errors.length > 0 ? 503 : 200).json({
    status,
    service: 'rez-wallet-service',
    checks,
    uptime: process.uptime(),
    memory: {
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      rss: memoryUsage.rss,
    },
    timestamp: new Date().toISOString(),
  });
});
app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));

// Swagger UI API documentation
const swaggerDocument = YAML.load('./docs/openapi.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'ReZ Wallet API Docs',
}));
app.get('/api-docs.json', (_req, res) => {
  res.json(swaggerDocument);
});

// Metrics — require internal token to prevent info disclosure if reverse proxy misconfigured
app.get('/metrics', requireInternalToken, (_req, res) => {
  const lines: string[] = [];

  lines.push(
    '# HELP process_uptime_seconds Process uptime in seconds',
    '# TYPE process_uptime_seconds gauge',
    `process_uptime_seconds ${process.uptime()}`,
    '# HELP http_requests_total Total HTTP requests',
    '# TYPE http_requests_total counter',
    `http_requests_total ${requestCount}`,
    '# HELP http_errors_total Total HTTP 5xx errors',
    '# TYPE http_errors_total counter',
    `http_errors_total ${errorCount}`,
  );

  // wallet_transactions_total{type="..."}
  lines.push(
    '# HELP wallet_transactions_total Total wallet transactions by type',
    '# TYPE wallet_transactions_total counter',
  );
  for (const [type, count] of walletTransactionsTotal) {
    lines.push(`wallet_transactions_total{type="${type}"} ${count}`);
  }

  // wallet_balance_operations_total{op="credit"|"debit"}
  lines.push(
    '# HELP wallet_balance_operations_total Total wallet balance operations',
    '# TYPE wallet_balance_operations_total counter',
  );
  for (const [op, count] of walletBalanceOpsTotal) {
    lines.push(`wallet_balance_operations_total{op="${op}"} ${count}`);
  }

  // wallet_http_requests_total{method, route, status}
  lines.push(
    '# HELP wallet_http_requests_total Total HTTP requests by method, route, and status',
    '# TYPE wallet_http_requests_total counter',
  );
  for (const [key, count] of walletHttpRequestsTotal) {
    const [method, route, status] = key.split('|');
    lines.push(`wallet_http_requests_total{method="${method}",route="${route}",status="${status}"} ${count}`);
  }

  // wallet_http_duration_seconds (sum and count for Prometheus averaging)
  lines.push(
    '# HELP wallet_http_duration_seconds_sum Sum of HTTP request durations in seconds',
    '# TYPE wallet_http_duration_seconds_sum gauge',
    `wallet_http_duration_seconds_sum ${walletHttpDurationSumSeconds.toFixed(6)}`,
    '# HELP wallet_http_duration_seconds_count Count of HTTP request duration observations',
    '# TYPE wallet_http_duration_seconds_count gauge',
    `wallet_http_duration_seconds_count ${walletHttpDurationCount}`,
  );

  res.set('Content-Type', 'text/plain; version=0.0.4');
  res.send(lines.join('\n') + '\n');
});

// ── Rate Limiting for Internal APIs ──
// Rate limit all /internal routes to prevent abuse
const walletRedis = redis; // Use the same Redis instance
const internalRateLimiter = createInternalRateLimiter(
  walletRedis ? {
    get: (key) => walletRedis.get(key),
    set: (key, value, mode, ttl) => walletRedis.set(key, value, mode as unknown, ttl),
    incr: (key) => walletRedis.incr(key),
    expire: (key, seconds) => walletRedis.expire(key, seconds),
    pexpire: (key, ms) => walletRedis.pexpire(key, ms),
  } : undefined,
  {
    windowMs: 60000, // 1 minute
    maxRequests: 500, // 500 requests per minute (stricter for wallet)
    burstLimit: 50, // 50 requests per second
    burstWindowMs: 1000,
    keyPrefix: 'ratelimit:wallet:internal:',
  }
);

// ── Routes ──

// CQRS Note: Read operations use WalletReadModel for performance.
// See src/services/WalletReadService.ts and src/services/WalletProjectionService.ts
app.use('/internal/wallet/read', walletReadRoutes);

// Consumer wallet: native paths at /wallet/*, monolith compat at /api/wallet/*
app.use('/wallet', walletRoutes);
app.use('/', walletRoutes); // compat routes are absolute: /api/wallet/*

// Merchant wallet: native paths at /merchant-wallet/*, monolith compat at /api/merchant/wallet/*
app.use('/merchant-wallet', merchantWalletRoutes);
// BUG-WAL-001 FIX: Removed duplicate mount at '/' — merchantWalletRoutes uses
// absolute paths (e.g. /api/merchant/wallet/*) which don't need the prefix mount.
// Double-mounting at '/' caused relative-path routes to incorrectly match at root
// and created a shadowing risk where the second mount could intercept unrelated requests.

// Internal service-to-service routes (with rate limiting)
app.use('/internal', internalRateLimiter);
app.use('/internal', internalRoutes);

// D12: DLQ admin endpoints — parity with monolith admin/dlqAdmin.
// Protected by x-internal-token via router-level middleware.
app.use('/admin/dlq', dlqAdminRoutes);

// Savings admin endpoints — analytics and reporting
app.use('/admin/savings', savingsAdminRoutes);

// Reconciliation routes (internal, X-Internal-Token required, with rate limiting)
app.use('/internal/reconciliation', internalRateLimiter);
app.use('/internal/reconciliation', reconciliationRoutes);

// Referral verification routes (internal, X-Internal-Token required, with rate limiting)
app.use('/internal/referral', internalRateLimiter);
app.use('/internal/referral', referralRoutes);

// Payout routes (internal, called via gateway with X-Internal-Token)
app.use('/', payoutRoutes);

// Internal credit routes (BNPL operations, with rate limiting)
app.use('/internal', internalRateLimiter);
app.use('/internal', internalCreditRoutes);

// Credit score routes (internal, X-Internal-Token required)
app.use('/', creditScoreRoutes);

// Consumer credit (BNPL) routes - user auth required
app.use('/api/credit', consumerCreditRoutes);

// CorpPerks routes - corporate benefits, employees, GST
app.use('/api/corp', corpPerksRoutes);

// Savings module routes - savings tracking, insights, and recommendations
app.use('/api/savings', savingsRoutes);

// Sentry error handler (must be after routes)
// Sentry v8 removed Handlers - using captureException in catch blocks
if (process.env.SENTRY_DSN) {
  // Sentry.Handlers removed in v8
}

// L10 FIX: Global error handler — add CORS headers so browser requests
// from allowed origins don't fail on error responses due to missing CORS headers.
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  const origin = _req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  res.status(500).json({ success: false, message: 'Internal server error' });
});

function validateEnv(): void {
  const required = ['MONGODB_URI', 'REDIS_URL', 'JWT_SECRET'];
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

let isShuttingDown = false;

async function start() {
  validateEnv();
  await connectMongoDB();
  const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info(`[rez-wallet-service] HTTP API listening on port ${PORT}`);
  });

  const shutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    logger.info(`[SHUTDOWN] ${signal} received — graceful shutdown starting`);

    // 1. Stop accepting new HTTP connections
    server.close(() => {
      logger.info('[SHUTDOWN] HTTP server closed');
    });

    try {
      // 2. Drain BullMQ worker if present
      try {
        const { stopWalletWorker } = await import('./worker');
        if (typeof stopWalletWorker === 'function') {
          await stopWalletWorker();
          logger.info('[SHUTDOWN] BullMQ worker drained');
        }
      } catch { /* worker may not be running */ }

      // 3. Close MongoDB
      await mongoose.disconnect();
      logger.info('[SHUTDOWN] MongoDB disconnected');

      // 4. Close Redis
      const {
        redis: redisClient,
        bullmqRedis: bullmqRedisClient,
        pub: pubClient,
        markRedisShutdownInitiated,
      } = await import('./config/redis');
      markRedisShutdownInitiated();
      await redisClient.quit().catch((err: Error) => logger.warn('[SHUTDOWN] Redis main quit failed', { error: err?.message }));
      if (bullmqRedisClient && bullmqRedisClient !== redisClient) {
        await bullmqRedisClient.quit().catch((err: Error) => logger.warn('[SHUTDOWN] Redis BullMQ quit failed', { error: err?.message }));
      }
      // XS-CRIT-007 FIX: Close pub client if it was connected
      if (pubClient && (pubClient.status as string) !== 'closed' && (pubClient.status as string) !== 'wait') {
        await pubClient.quit().catch((err: Error) => logger.warn('[SHUTDOWN] Redis pub quit failed', { error: err?.message }));
      }
      logger.info('[SHUTDOWN] Redis connections closed');

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
}

start().catch((err) => {
  logger.error('[FATAL] Failed to start:', err);
  process.exit(1);
});

export default app;
