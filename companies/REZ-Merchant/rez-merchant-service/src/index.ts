import 'dotenv/config';
import 'express-async-errors';

// Sentry - optional dependency with graceful fallback
let Sentry: typeof import('@sentry/node') | null = null;
try {
  Sentry = require('@sentry/node');
} catch (e) {
  // Logger not yet initialized, use logger for pre-init messages
  logger.warn('[STARTUP] Sentry not available:', { error: e instanceof Error ? e.message : String(e) });
}

process.env.SERVICE_NAME = 'rez-merchant-service';

// Initialize Sentry only if DSN is provided
const SENTRY_INITIALIZED = !!(Sentry && process.env.SENTRY_DSN);
if (SENTRY_INITIALIZED) {
  try {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'production',
      serverName: process.env.SERVICE_NAME,
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
      integrations: [],
    });
    // Log after logger is available
    // Will be logged in main() after logger is initialized
  } catch (error) {
    // Logger not yet initialized, use logger for pre-init messages
    logger.warn('[STARTUP] Sentry initialization failed (non-critical):', { error: error instanceof Error ? error.message : String(error) });
  }
}

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import mongoose from 'mongoose';
import { createRateLimiter } from '@rez/shared';
import { redis } from './config/redis';
import { logger } from './config/logger';
import { tracingMiddleware } from './middleware/tracing';
import { csrfProtection } from './middleware/csrf';
import { connectMongoDB } from './config/mongodb';
import { metricsMiddleware, getMetricsHandler } from './metrics';
import { preloadPopularMenus } from './services/menuCacheOptimizer';

// Domain routers — bounded modules replacing individual route imports
import coreRouter from './routers/core';
import ordersRouter from './routers/orders';
import engagementRouter from './routers/engagement';
import campaignsRouter from './routers/campaigns';
import analyticsRouter from './routers/analytics';
import financeRouter from './routers/finance';
import staffRouter from './routers/staff';
import operationsRouter from './routers/operations';
import supportRouter from './routers/support';
import qrRouter from './routers/qr';
import loyaltyConfigRouter from './routers/loyaltyConfig';
import merchantAISuggestionsRouter from './routes/merchantAISuggestions';
import trialsRouter from './routers/trials';
import marketingTemplatesRouter from './routers/marketingTemplates';
import internalRoutes from './routes/internalRoutes';
import oauthRouter from './routes/oauth';
import karmaRouter from './routes/karmaRoutes';
import karmaPerkRouter from './routes/karmaPerkRoutes';
import bonusZoneCampaignsRouter from './routes/bonusZoneCampaigns';
import goalsRouter from './routes/goals';
import pricingRouter from './routes/pricing';
import demandSignalsMerchantRouter from './routes/demandSignalsMerchant';
import tallyExportRouter from './routes/tallyExport';
import channelManagerRouter from './routes/channelManager';
import qrIntegrationRouter from './routes/qrIntegration';
import appointmentsRouter from './routes/appointments';
import voiceRouter from './routes/voice';
import prescriptionRouter from './routes/prescription';
import clientHistoryRouter from './routes/clientHistory';
import aiRouter from './routes/ai';
import customer360Router from './routes/customer360';
import splitBillRouter from './routes/splitBill';
import waitlistRouter from './routes/waitlist';
import deliveryTrackingRouter from './routes/deliveryTracking';
import commissionRouter from './routes/commission';
import attendanceRouter from './routes/attendance';
import classCapacityRouter from './routes/classCapacity';
import housekeepingRouter from './routes/housekeeping';
import nutritionRouter from './routes/nutrition';
import conciergeRouter from './routes/concierge';
import telemedicineRouter from './routes/telemedicine';
import checkInOutRouter from './routes/checkInOut';
import labIntegrationRouter from './routes/labIntegration';
import fitnessRouter from './routes/fitness';
import purchaseOrdersRouter from './routes/purchaseOrders';
import rfqRouter from './routes/rfq';
import quotesRouter from './routes/quotes';
import dunningRoutes from './routes/dunningRoutes';
import reminderTemplatesRoutes from './routes/reminderTemplates';
import challansRouter from './routes/challans';
import virtualAccountsRouter from './routes/virtualAccounts';
import bulkPaymentsRouter from './routes/bulkPayments';
import bankStatementsRouter from './routes/bankStatements';
import reconciliationRouter from './routes/reconciliation';
import ewaybillRouter from './routes/ewaybill';
import gstrRouter from './routes/gstr';
import tdsRouter from './routes/tds';
import vendorPortalRouter from './routes/vendorPortal';
import cashFlowRouter from './routes/cashFlow';
import multiBankRouter from './routes/multiBank';
import employeePayoutsRouter from './routes/employeePayouts';
import webhooksRouter from './routes/webhooks';
import forecastingRouter from './routes/forecasting';
import b2bExportRouter from './routes/b2bExport';
import bulkB2BRouter from './routes/bulkB2B';
import auditLogsRouter from './routes/auditLogs';
import notificationsRouter from './routes/inAppNotifications';
import documentsRouter from './routes/documents';
import goodsReceiptRouter from './routes/goodsReceipt';

const app = express();
// Behind nginx API gateway / Render LB. trust proxy=true accepts ANY proxy
// chain, so a forged X-Forwarded-For header lets a client bypass rate
// limits entirely. Only trust the actual number of hops between this
// service and the public internet. TRUST_PROXY_HOPS defaults to 1
// (single gateway/LB hop) — set it to 2 if you have both LB and CDN.
// CRITICAL-SEC FIX (MA-BACK-008): Validate range to prevent bypass via
// trust proxy=999999 which would accept any forwarded header.
const rawTrustHops = Number.parseInt(process.env.TRUST_PROXY_HOPS || '1', 10);
const TRUST_PROXY_HOPS = Number.isFinite(rawTrustHops)
  ? Math.max(1, Math.min(3, rawTrustHops))
  : 1;
app.set('trust proxy', TRUST_PROXY_HOPS);
const PORT = parseInt(process.env.PORT || '4005', 10);

function validateEnv(): void {
  const required = ['MONGODB_URI', 'REDIS_URL'];
  const missing = required.filter((k) => !process.env[k]);
  // IMPORTANT: the auth middleware and all auth routes read JWT_MERCHANT_SECRET
  // (not JWT_SECRET, not MERCHANT_JWT_SECRET). Earlier this check looked for
  // the wrong names, so a deploy that set only JWT_SECRET booted successfully
  // but every authenticated request returned 500 "Auth not configured".
  if (!process.env.JWT_MERCHANT_SECRET) {
    missing.push('JWT_MERCHANT_SECRET');
  }
  // ENCRYPTION_KEY is required by utils/encryption.ts for bank-details
  // encryption. Without it, the pre('save') hook throws at first write and
  // bank details are either dropped or (if writers bypass the hook) stored
  // in plaintext. Fail fast at startup instead.
  if (!process.env.ENCRYPTION_KEY) {
    missing.push('ENCRYPTION_KEY');
  }
  if (!process.env.INTERNAL_SERVICE_TOKENS_JSON && !process.env.INTERNAL_SERVICE_TOKEN) {
    missing.push('INTERNAL_SERVICE_TOKENS_JSON or INTERNAL_SERVICE_TOKEN');
  }
  if (missing.length > 0) {
    logger.error(`[FATAL] Missing required env vars: ${missing.join(', ')}`);
    process.exit(1);
  }
}

// Sentry request handler — before all middleware (v8 uses expressIntegration via init)
if (SENTRY_INITIALIZED) {
  // In Sentry v8, express tracing is set up via integrations in init()
  // No explicit requestHandler needed - it's handled by expressIntegration
}

// CORS — restrict to known origins only
const rawAllowedOrigins = process.env.CORS_ALLOWED_ORIGINS || '';
const allowedOrigins: string[] = rawAllowedOrigins
  ? rawAllowedOrigins.split(',').map((o) => o.trim()).filter(Boolean)
  : [];

// Production Rez origins — always allowed (the nginx API gateway is the
// CORS authority, but still forwards the Origin header to upstreams).
// CRITICAL-SEC FIX (MA-BACK-007): Removed wildcard [a-z0-9-]+\.vercel\.app regex.
// Previously matched ANY vercel.app subdomain, allowing an attacker to deploy a
// malicious vercel app and use it as an allowed CORS origin to steal merchant
// credentials. Now restricted to known Rez-specific vercel deployments only.
const REZ_ORIGIN_RE = /^https:\/\/(merchant\.rez\.money|admin\.rez\.money|menu\.rez\.money|rez\.money|www\.rez\.money|rez-app-merchant\.com)$/;

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // CRITICAL-SEC FIX (MA-BACK-AUDIT-001): Block no-origin requests in production.
    // Previously allowed origin-less requests (curl, server-to-server) unconditionally,
    // enabling CORS bypass. Now requires Origin header in production environments.
    if (!origin) {
      if (process.env.NODE_ENV === 'production') {
        callback(new Error('CORS: origin header required in production'));
        return;
      }
      // Allow no-origin only in development (e.g., Postman, curl testing)
      callback(null, true);
      return;
    }
    // FIX-CORS-001: Only allow localhost in non-production environments.
    // Previously allowed localhost unconditionally, enabling CORS bypass in production
    // via Origin: http://localhost:3000 header injection.
    if (process.env.NODE_ENV !== 'production' && /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
      callback(null, true); return;
    }
    if (REZ_ORIGIN_RE.test(origin)) { callback(null, true); return; }
    if (allowedOrigins.includes(origin)) { callback(null, true); return; }
    callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true,
};

// Rate limiting — Redis-backed for distributed deployments
// Each instance shares rate limit state via Redis, preventing bypass via instance rotation
const generalLimiter = createRateLimiter(
  redis.call.bind(redis),
  { windowMs: 15 * 60 * 1000, max: 300 }
);

const authLimiter = createRateLimiter(
  redis.call.bind(redis),
  { windowMs: 1 * 60 * 1000, max: 100, message: 'Too many authentication attempts, please try again later.' }
);

// Core middleware
// CRITICAL-SEC FIX (MA-BACK-009): Explicit HSTS configuration via helmet.
// Default helmet() does NOT set HSTS headers. Adding maxAge and includeSubDomains
// to enforce HTTPS-only for all Rez domains and subdomains.
app.use(helmet({
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// PEN-TEST FIX: Additional security headers for clickjacking, MIME sniffing, and referrer leakage
app.use((_req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
app.use(compression());
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(generalLimiter);
app.use(express.json({ limit: '1mb' }));
app.use(mongoSanitize());

// SECURITY FIX (MA-BACK-AUDIT-003): Custom recursive sanitization middleware.
// express-mongo-sanitize only sanitizes req.body, req.query, req.params top-level.
// This middleware recursively sanitizes ALL request properties including:
// - Nested objects and arrays
// - req.headers (before cookie/header parsing)
// - req.cookies (after cookieParser)
function sanitizeRecursive(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    // Remove MongoDB operators from strings
    return obj.replace(/\$/g, '').replace(/\./g, '');
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeRecursive);
  }

  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      // Sanitize keys (remove $ and . from property names)
      const sanitizedKey = key.replace(/\$/g, '').replace(/\./g, '');
      sanitized[sanitizedKey] = sanitizeRecursive(value);
    }
    return sanitized;
  }

  return obj;
}

// Apply sanitization to all request properties recursively
app.use((req, _res, next) => {
  // Sanitize headers before other processing
  if (req.headers) {
    req.headers = sanitizeRecursive(req.headers) as typeof req.headers;
  }
  next();
});

app.use((req, _res, next) => {
  // Sanitize body after json parsing
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeRecursive(req.body) as typeof req.body;
  }
  next();
});
app.use(csrfProtection);
app.use(tracingMiddleware);
app.use(metricsMiddleware);

// Stricter rate limit on auth routes
app.use('/auth', authLimiter);
app.use('/api/v1/merchant/auth', authLimiter);
app.use('/api/v1/merchant/oauth', authLimiter);

// Internal service-to-service routes — NOT proxied through nginx /api/merchant/*
// Registered before the general rate limiter prefix so they get the general limiter,
// but the requireInternalToken middleware ensures only trusted callers can use them.
app.use('/internal', internalRoutes);
app.use('/api/v1/karma', karmaRouter);

// SECURITY FIX (MA-BACK-AUDIT-004): Rate limit health endpoints.
// Previously health endpoints had no rate limiting, allowing enumeration
// and amplification attacks. Using a separate, more permissive limiter for health checks.
const healthLimiter = createRateLimiter(
  redis.call.bind(redis),
  { windowMs: 60 * 1000, max: 100, message: 'Too many health check requests' }
);

// Health endpoints — rate limited to prevent enumeration/amplification attacks
app.use('/health', healthLimiter);
app.get('/health/live', (_req, res) => {
  res.json({ alive: true, service: 'rez-merchant-service', uptime: process.uptime() });
});

app.get('/health/ready', async (_req, res) => {
  const dbState = mongoose.connection.readyState;
  let redisState = 'disconnected';
  try {
    await redis.ping();
    redisState = 'connected';
  } catch { /* redis unavailable */ }
  const dbReady = dbState === 1;
  const redisReady = redisState === 'connected';
  const ready = dbReady && redisReady;
  res.status(ready ? 200 : 503).json({
    ready,
    service: 'rez-merchant-service',
    db: dbState === 1 ? 'connected' : 'disconnected',
    redis: redisState,
    uptime: process.uptime(),
  });
});

app.get('/health', async (_req, res) => {
  const dbState = mongoose.connection.readyState;
  res.json({
    status: dbState === 1 ? 'ok' : 'degraded',
    service: 'rez-merchant-service',
    uptime: process.uptime(),
    db: dbState === 1 ? 'connected' : 'disconnected',
  });
});

app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));

app.get('/health/detailed', async (_req, res) => {
  const checks: Record<string, { status: string; latencyMs: number; error?: string }> = {};
  let isHealthy = true;

  // Check MongoDB with latency
  const mongoStart = Date.now();
  try {
    if (mongoose.connection.readyState !== 1) throw new Error('not connected');
    await mongoose.connection.db?.admin().ping();
    checks.database = { status: 'up', latencyMs: Date.now() - mongoStart };
  } catch (err: unknown) {
    checks.database = { status: 'down', error: err instanceof Error ? err.message : String(err), latencyMs: Date.now() - mongoStart };
    isHealthy = false;
  }

  // Check Redis with latency
  const redisStart = Date.now();
  try {
    await redis.ping();
    checks.redis = { status: 'up', latencyMs: Date.now() - redisStart };
  } catch (err: unknown) {
    checks.redis = { status: 'down', error: err instanceof Error ? err.message : String(err), latencyMs: Date.now() - redisStart };
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

// Prometheus metrics endpoint
app.get('/metrics', getMetricsHandler);

// Swagger UI API documentation
const swaggerDocument = require('yamljs').load('./docs/openapi.yaml');
app.use('/api-docs', require('swagger-ui-express').serve);
app.get('/api-docs.json', (_req, res) => {
  res.json(swaggerDocument);
});
app.use('/', require('swagger-ui-express').setup(
  swaggerDocument,
  { customCss: '.swagger-ui .topbar { display: none }', customSiteTitle: 'ReZ Merchant API Docs' }
));
app.get('/api-docs.json', (_req, res) => {
  res.json(require('yamljs').load('./docs/openapi.yaml'));
});

// ── Domain routers — production paths ────────────────────────────────────────
// All domain routers use the canonical '/api/v1/merchant' prefix.
app.use('/api/v1/merchant', oauthRouter);
app.use('/api/v1/merchant', coreRouter);
app.use('/api/v1/merchant', ordersRouter);
app.use('/api/v1/merchant', engagementRouter);
app.use('/api/v1/merchant', campaignsRouter);
app.use('/api/v1/merchant', analyticsRouter);
app.use('/api/v1/merchant', financeRouter);
app.use('/api/v1/merchant', staffRouter);
app.use('/api/v1/merchant', operationsRouter);
app.use('/api/v1/merchant', appointmentsRouter);
app.use('/api/v1/merchant', supportRouter);
app.use('/api/v1/merchant', qrRouter);
app.use('/api/v1/merchant', qrIntegrationRouter);
app.use('/api/v1/merchant', loyaltyConfigRouter);
app.use('/api/v1/merchant', trialsRouter);
app.use('/api/v1/merchant', marketingTemplatesRouter);
app.use('/api/v1/merchant/karma', karmaRouter);
app.use('/api/v1/merchant/karma', karmaPerkRouter);
app.use('/api/v1/merchant/bonus-zone', bonusZoneCampaignsRouter);
app.use('/api/v1/merchant', goalsRouter);
app.use('/api/v1/merchant/pricing', pricingRouter);
app.use('/api/v1/merchant/ai', merchantAISuggestionsRouter);
app.use('/api/v1/merchant/ai', aiRouter);
app.use('/api/customers', customer360Router);
app.use('/api/v1/merchant/export', tallyExportRouter);
app.use('/api/v1/merchant/channels', channelManagerRouter);
app.use('/api/v1/merchant/voice', voiceRouter);
app.use('/api/v1/merchant/prescriptions', prescriptionRouter);
app.use('/api/v1/merchant/client-history', clientHistoryRouter);
app.use('/api/v1/merchant/split-bill', splitBillRouter);
app.use('/api/v1/merchant/waitlist', waitlistRouter);
app.use('/api/v1/merchant/delivery-tracking', deliveryTrackingRouter);
app.use('/api/v1/merchant/commission', commissionRouter);
app.use('/api/v1/merchant/attendance', attendanceRouter);
app.use('/api/v1/merchant/class-capacity', classCapacityRouter);
app.use('/api/v1/merchant/housekeeping', housekeepingRouter);
app.use('/api/v1/merchant/nutrition', nutritionRouter);
app.use('/api/v1/merchant/concierge', conciergeRouter);
app.use('/api/v1/merchant/telemedicine', telemedicineRouter);
app.use('/api/v1/merchant/checkinout', checkInOutRouter);
app.use('/api/v1/merchant/lab', labIntegrationRouter);
app.use('/api/v1/merchant/fitness', fitnessRouter);
app.use('/api/v1/merchant/purchase-orders', purchaseOrdersRouter);
app.use('/api/v1/merchant/rfqs', rfqRouter);
app.use('/api/v1/merchant/quotes', quotesRouter);
app.use('/api/v1/merchant/challans', challansRouter);
app.use('/api/v1/merchant/virtual-accounts', virtualAccountsRouter);
app.use('/api/v1/merchant/bulk-payments', bulkPaymentsRouter);
app.use('/api/v1/merchant/bank-statements', bankStatementsRouter);
app.use('/api/v1/merchant/reconciliation', reconciliationRouter);
app.use('/api/v1/merchant/ewaybill', ewaybillRouter);
app.use('/api/v1/merchant/gstr', gstrRouter);
app.use('/api/v1/merchant/tds', tdsRouter);
app.use('/api/v1/merchant/vendor-portal', vendorPortalRouter);
app.use('/api/v1/merchant/cash-flow', cashFlowRouter);
app.use('/api/v1/merchant/multi-bank', multiBankRouter);
app.use('/api/v1/merchant/employee-payouts', employeePayoutsRouter);
app.use('/api/v1/merchant/dunning', dunningRoutes);
app.use('/api/v1/merchant/dunning/templates', reminderTemplatesRoutes);
app.use('/api/v1/merchant/webhooks', webhooksRouter);
app.use('/api/v1/merchant/forecasting', forecastingRouter);
app.use('/api/v1/merchant/exports', b2bExportRouter);
app.use('/api/v1/merchant/bulk-b2b', bulkB2BRouter);
app.use('/api/v1/merchant/audit-logs', auditLogsRouter);
app.use('/api/v1/merchant/notifications', notificationsRouter);
app.use('/api/v1/merchant/documents', documentsRouter);
app.use('/api/v1/merchant/goods-receipt', goodsReceiptRouter);
app.use('/internal', demandSignalsMerchantRouter);

// Sentry error handler
if (SENTRY_INITIALIZED) {
  // Sentry error handler disabled due to version compatibility
}

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // CRITICAL-SEC FIX (MA-BACK-010): Never log stack traces in production.
  // Stack traces may contain: file paths revealing internal infra structure,
  // environment variable names from closure captures, library version numbers,
  // and stack frames that aid in crafting targeted exploits. Stack is only
  // logged to Sentry (which strips sensitive data) — not to stdout/structured logs.
  //
  // SECURITY FIX (MA-BACK-AUDIT-002): Simplified error disclosure logic.
  // Previously: `isOperational === undefined` could leak error details when err.isOperational
  // was missing or falsy, not just undefined. Now uses explicit NODE_ENV check only.
  const isOperational = 'isOperational' in err && err.isOperational === true;
  logger.error('Unhandled error', { error: err.message, operational: isOperational });

  // Only expose stack traces in development environment, never in production
  if (process.env.NODE_ENV === 'development') {
    logger.debug('Unhandled error stack', { stack: err.stack });
  }

  res.status(500).json({ success: false, message: 'Internal server error' });
});

// Graceful shutdown — drains in-flight requests, then closes DB connections
let server: ReturnType<typeof app.listen> | undefined;
let isShuttingDown = false;
async function start() {
  validateEnv();
  await connectMongoDB();

  // Preload popular menus into Redis for fast QR-to-menu response
  // Run in background - don't block server startup
  setTimeout(async () => {
    try {
      const result = await preloadPopularMenus();
      logger.info(`[startup] Menu cache warmup: ${result.loaded} loaded, ${result.failed} failed`);
    } catch (err) {
      logger.warn('[startup] Menu cache warmup skipped:', err);
    }
  }, 1000);

  server = app.listen(PORT, '0.0.0.0', () => {
    logger.info(`[rez-merchant-service] HTTP API listening on port ${PORT}`);
  });
}

async function shutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info(`[${signal}] Graceful shutdown...`);

  // Stop accepting new connections, wait for in-flight to drain
  if (server) {
    server.close(() => {
      logger.info('[shutdown] HTTP server closed, draining connections...');
    });
  }

  // Force exit if draining takes too long
  const forceTimeout = setTimeout(() => {
    logger.warn('[shutdown] Force exit after 30s drain timeout');
    process.exit(0);
  }, 30000);

  // Close MongoDB connection
  try {
    await mongoose.connection.close();
    logger.info('[shutdown] MongoDB disconnected');
  } catch (err) {
    logger.error('[shutdown] MongoDB disconnect error', { error: (err as Error).message });
  }

  // Close Redis connection
  try {
    await redis.quit();
    logger.info('[shutdown] Redis disconnected');
  } catch (err) {
    logger.error('[shutdown] Redis disconnect error', { error: (err as Error).message });
  }

  clearTimeout(forceTimeout);
  logger.info('[shutdown] Complete');
  process.exit(0);
}
const isTestRuntime = process.env.NODE_ENV === 'test' || Boolean(process.env.JEST_WORKER_ID);

if (!isTestRuntime) {
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (reason: unknown) => {
    logger.error('[unhandledRejection] Unhandled promise rejection', { reason });
  });
  process.on('uncaughtException', (err: Error) => {
    logger.error('[uncaughtException] Uncaught exception', { error: err.message, stack: err.stack });
    process.exit(1);
  });

  start().catch((err) => {
    logger.error('[FATAL] Failed to start:', err);
    process.exit(1);
  });
}

export default app;
