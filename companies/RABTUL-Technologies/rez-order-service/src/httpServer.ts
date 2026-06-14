/**
 * HTTP server for rez-order-service.
 *
 * Adds REST endpoints on top of the existing BullMQ worker.
 * Queries the shared MongoDB 'orders' collection directly (strict:false).
 *
 * Endpoints:
 *   GET  /health                   — Render health check
 *   POST /orders                   — Create a new order (consumer checkout)
 *   GET  /orders                   — List orders (query: merchantId, userId, status, page, limit)
 *   GET  /orders/stream            — SSE stream for merchant dashboard (MUST be before /:id)
 *   GET  /orders/:id               — Single order by ObjectId
 *   PATCH /orders/:id/status       — Update order status (state-machine enforced)
 *   POST /orders/:id/cancel        — Cancel an order
 */

// Load environment variables
require('dotenv').config();

// Sentry is optional - only initialize if module is available
let Sentry: typeof import('@sentry/node') | null = null;
try {
  Sentry = require('@sentry/node');
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: 0.1,
    });
  }
} catch {
  // Sentry not available, continue without it
}

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import mongoose from 'mongoose';
import http from 'http';
import crypto from 'crypto';
import compression from 'compression';
import { logger } from './config/logger';
import { requireInternalToken } from './middleware/internalAuth';
import { tracingMiddleware } from './middleware/tracing';
import { requestLoggingMiddleware } from './middleware/requestLogging';
import { requestTimeoutMiddleware } from './middleware/requestTimeout';
import { generalLimiter } from './middleware/rateLimiter';
import { bullmqRedis } from './config/redis';
import { recordProfileTransaction, getVerticalFromOrder } from './services/profileIntegration';
import { metricsMiddleware, getMetricsHandler } from './metrics';
import { track as intentTrack } from './services/intentCaptureService';
import { notifyMarketingConversion, notifyAdsConversion } from './services/serviceIntegration';
import { notifyOrderCreated, notifyOrderStatusChange } from './services/webhookIntegration';
import { parseCursor, buildPaginatedResponse } from './utils/cursorPagination';
import { ORDER_STATUSES, OrderStatus, VALID_TRANSITIONS, canBeCancelled } from './state/orderStateMachine';

/**
 * PERFORMANCE OPTIMIZATION: Response caching middleware
 * Caches GET responses in Redis with configurable TTL
 */
function cacheResponse(ttlSeconds: number = 60) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') return next();

    const cacheKey = `cache:${req.originalUrl}`;

    try {
      const cached = await bullmqRedis.get(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        res.set('X-Cache', 'HIT');
        res.set('Cache-Control', `private, max-age=${ttlSeconds}`);
        res.json(data);
        return;
      }

      // Store original json function
      const originalJson = res.json.bind(res);

      // Override json to also cache
      res.json = (body) => {
        bullmqRedis.setex(cacheKey, ttlSeconds, JSON.stringify(body)).catch((err: Error) => {
          logger.warn('[Cache] Failed to write response cache', { key: cacheKey, error: err?.message });
        });
        res.set('X-Cache', 'MISS');
        res.set('Cache-Control', `private, max-age=${ttlSeconds}`);
        return originalJson(body);
      };

      next();
    } catch {
      next();
    }
  };
}

/**
 * PERFORMANCE OPTIMIZATION: Field filtering middleware
 * Allows clients to request only specific fields
 * Usage: GET /orders?fields=id,status,total
 */
function fieldFilter(allowedFields: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.query.fields) return next();

    const requestedFields = (req.query.fields as string).split(',');
    const validFields = requestedFields.filter(f => allowedFields.includes(f.trim()));

    if (validFields.length > 0) {
      (req as unknown).requestedFields = validFields;
    }
    next();
  };
}

const VALID_STATUSES = ORDER_STATUSES;

const app = express();
// Behind Render LB + CF — trust N hops so per-IP rate limiters key on real client IP.
// See MASTER-PLAN-2026-04-19 P1 (trust proxy fleet-wide).
app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS) || 1);
app.use(helmet());
// SECURITY: Add security headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});
// PERFORMANCE: Enable gzip compression for all responses
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(mongoSanitize());
app.use(cors({
  origin: (process.env.CORS_ORIGIN || 'https://rez.money').split(',').map(s => s.trim()),
  credentials: true,
}));
// Note: Sentry 8.x handles request data via requestDataIntegration, no manual requestHandler needed
app.use(tracingMiddleware);
app.use(metricsMiddleware);

// Request timeout middleware — 30 second default
const timeoutMs = parseInt(process.env.REQUEST_TIMEOUT_MS || '30000', 10);
app.use(requestTimeoutMiddleware(timeoutMs));

// Request logging middleware — logs method, path, status, duration
app.use(requestLoggingMiddleware);

// General rate limiter — 200 requests per minute per IP
app.use(generalLimiter);

// D12: DLQ admin endpoints (parity with monolith admin/dlqAdmin).
// Mounted under /admin/dlq; all routes require x-internal-token.
import dlqAdminRouter from './routes/dlqAdmin';
app.use('/admin/dlq', dlqAdminRouter);

// ── Health ────────────────────────────────────────────────────────────────────

app.get('/health/live', (_req: Request, res: Response) => {
  res.json({
    status: 'live',
    service: 'rez-order-service',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', async (_req: Request, res: Response) => {
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
    service: 'rez-order-service',
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

// ── Readiness probe (deep: checks MongoDB + Redis) ───────────────────────────

app.get('/health/ready', async (_req: Request, res: Response) => {
  const checks: Record<string, string> = {};
  const errors: string[] = [];

  // MongoDB check
  if (mongoose.connection.readyState === 1) {
    checks.mongodb = 'ok';
  } else {
    checks.mongodb = 'error';
    errors.push('MongoDB not connected');
  }

  // Redis check
  try {
    const { bullmqRedis } = await import('./config/redis');
    const pong = await bullmqRedis.ping();
    checks.redis = pong === 'PONG' ? 'ok' : 'error';
    if (pong !== 'PONG') errors.push('Redis ping failed');
  } catch (err) {
    checks.redis = 'error';
    errors.push(`Redis error: ${err.message}`);
  }

  const status = errors.length > 0 ? 'not_ready' : 'ready';
  res.status(errors.length > 0 ? 503 : 200).json({
    status,
    service: 'rez-order-service',
    checks,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ── Detailed health check (comprehensive with latency metrics) ─────────────────

app.get('/health/detailed', async (_req: Request, res: Response) => {
  const checks: Record<string, unknown> = {};
  let isHealthy = true;

  // Check MongoDB with latency
  const mongoStart = Date.now();
  try {
    if (mongoose.connection.readyState !== 1) throw new Error('not connected');
    await mongoose.connection.db?.admin().ping();
    checks.database = { status: 'up', latencyMs: Date.now() - mongoStart };
  } catch (err) {
    checks.database = { status: 'down', error: err.message, latencyMs: Date.now() - mongoStart };
    isHealthy = false;
  }

  // Check Redis with latency
  const redisStart = Date.now();
  try {
    const { bullmqRedis } = await import('./config/redis');
    await bullmqRedis.ping();
    checks.redis = { status: 'up', latencyMs: Date.now() - redisStart };
  } catch (err) {
    checks.redis = { status: 'down', error: err.message, latencyMs: Date.now() - redisStart };
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

// ── Prometheus metrics endpoint ───────────────────────────────────────────────
app.get('/metrics', getMetricsHandler);

// ── Swagger UI API documentation ─────────────────────────────────────────────
// Only enable swagger docs if swagger-ui-express is available
try {
  const swaggerUi = require('swagger-ui-express');
  const yamljs = require('yamljs');
  const swaggerDocument = yamljs.load('./docs/openapi.yaml');
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'ReZ Order API Docs'
  }));
  app.get('/api-docs.json', (_req, res) => {
    res.json(swaggerDocument);
  });
} catch (err) {
  logger.warn('Swagger UI disabled - swagger-ui-express not installed');
}

// ── Auth helpers ──────────────────────────────────────────────────────────────
// Lightweight HS256 JWT verifier — avoids adding jsonwebtoken as a dependency.
function verifyJwt(token: string, secret: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, payload, sig] = parts as [string, string, string];
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest('base64url');
  const expectedBuf = Buffer.from(expected);
  const sigBuf = Buffer.from(sig);
  if (expectedBuf.length !== sigBuf.length) return null;
  if (!crypto.timingSafeEqual(expectedBuf, sigBuf)) return null;
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString()) as Record<string, unknown>;
    if (decoded['exp'] && decoded['exp'] < Math.floor(Date.now() / 1000)) return null;
    return decoded;
  } catch { return null; }
}

/**
 * requireOrderAuth — accepts either:
 *   1. A valid internal service token (X-Internal-Token header), used by the monolith
 *   2. A valid consumer / merchant / admin JWT (Authorization: Bearer <token>)
 *
 * CS-H3: All order routes (including GET) require auth to prevent unauthenticated
 * enumeration of order data. requireOrderAuth accepts both internal service tokens
 * and user JWTs so the gateway, monolith, and front-end clients all continue to work.
 */
async function requireOrderAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const internalToken = req.headers['x-internal-token'] as string | undefined;

  // Accept internal service token
  if (internalToken) {
    requireInternalToken(req, res, next);
    return;
  }

  // Accept any valid JWT (consumer, merchant, or admin)
  const authHeader = req.headers['authorization'] as string | undefined;
  if (authHeader?.startsWith('Bearer ')) {
    const jwtToken = authHeader.slice(7);
    const secrets = [
      process.env.JWT_SECRET,
      process.env.JWT_MERCHANT_SECRET,
      process.env.JWT_ADMIN_SECRET,
    ].filter(Boolean) as string[];

    let decoded: Record<string, unknown> | null = null;
    for (const secret of secrets) {
      decoded = verifyJwt(jwtToken, secret);
      if (decoded) break;
    }

    if (decoded) {
      (req as unknown).authUser = decoded;

      // Check Redis token blacklist — fail open if Redis is unavailable
      try {
        const blacklisted = await bullmqRedis.exists('blacklist:token:' + jwtToken);
        if (blacklisted) {
          res.status(401).json({ success: false, error: 'Token revoked' });
          return;
        }
        const allLogoutTs = await bullmqRedis.get('allLogout:' + decoded['userId']);
        if (allLogoutTs) {
          const logoutSec = Math.floor(Number(allLogoutTs) / 1000);
          if (decoded['iat'] && decoded['iat'] < logoutSec) {
            res.status(401).json({ success: false, error: 'Token revoked' });
            return;
          }
        }
      } catch {
        // Redis unavailable — fail open in dev/test, fail closed in production
        if (process.env.NODE_ENV === 'production') {
          res.status(503).json({ success: false, error: 'Auth service temporarily unavailable' });
          return;
        }
        logger.warn('[AUTH] Redis unavailable for blacklist check — failing open');
      }

      next();
      return;
    }
  }

  res.status(401).json({ success: false, error: 'Authentication required' });
}

async function orderSummaryHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.params.userId as string;
    if (!userId || !mongoose.isValidObjectId(userId)) {
      res.status(400).json({ success: false, message: 'Invalid userId' });
      return;
    }

    // BAK-HIGH-003 FIX: Authorization check — users can only see their own order summary.
    // Internal service calls (via X-Internal-Token) are exempt as they come from trusted services.
    const authUser = (req as unknown).authUser;
    if (authUser) {
      const requestingUserId = authUser.userId || authUser.id;
      const roles = (authUser.role || '').split(',');
      const isPrivileged = roles.includes('admin') || roles.includes('super_admin') || roles.includes('operator');
      if (userId !== requestingUserId && !isPrivileged) {
        res.status(403).json({ success: false, message: 'Forbidden: you can only view your own order summary' });
        return;
      }
    }

    const since = new Date(Date.now() - 30 * 86400000);
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const collection = mongoose.connection.collection('orders');
    const successfulStatuses = ['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'partially_refunded', 'refunded'];

    const rows = await collection.aggregate([
      {
        $match: {
          user: userObjectId,
          createdAt: { $gte: since },
          status: { $in: successfulStatuses },
        },
      },
      {
        $project: {
          total: {
            $ifNull: ['$totals.total', { $ifNull: ['$totals.paidAmount', 0] }],
          },
        },
      },
      {
        $group: {
          _id: null,
          orderCount30d: { $sum: 1 },
          totalSpend30d: { $sum: '$total' },
        },
      },
    ]).toArray();

    const summary = rows[0] || { orderCount30d: 0, totalSpend30d: 0 };
    const orderCount30d = Number(summary.orderCount30d || 0);
    const totalSpend30d = Number(summary.totalSpend30d || 0);
    const avgOrderValue = orderCount30d > 0 ? parseFloat((totalSpend30d / orderCount30d).toFixed(2)) : 0;

    res.json({
      success: true,
      data: {
        totalSpend30d,
        orderCount30d,
        avgOrderValue,
        paymentHistory: orderCount30d > 0 ? 1 : 0,
      },
    });
  } catch (err) {
    next(err);
  }
}

// Summary endpoint is internal-only — exposes cross-order aggregates for a user
app.get('/orders/summary/:userId', requireInternalToken, orderSummaryHandler);
app.get('/internal/orders/summary/:userId', requireInternalToken, orderSummaryHandler);

// ── Create order ──────────────────────────────────────────────────────────────
//
// POST /orders — Consumer checkout endpoint. Creates a single order document in
// 'placed' status and returns it. Single-responsibility: this handler only
// persists an order record. Payment capture, wallet debits, inventory
// decrements, coupon redemption, and cart clearing are NOT performed here —
// they are downstream concerns handled by their respective services
// (rez-payment-service, rez-wallet-service, rez-catalog-service) via events
// or explicit follow-up calls from the caller.
//
// Monolith parity note: The legacy rezbackend handler in
// `rezbackend/src/controllers/orderCreateController.ts` performs wallet debits,
// stock reservation, coupon application, and cart mutation inside a Mongo
// transaction. Those behaviours are intentionally omitted here to keep the
// microservice boundary clean. If the caller needs atomic cross-service side
// effects, it should orchestrate them via events after receiving the 201.
//
// Idempotency: we honour an `Idempotency-Key` header (or a body
// `idempotencyKey`) and persist it on the order as `clientIdempotencyKey`.
// A second request from the same user with the same key returns the existing
// order instead of creating a duplicate.
// TODO(schema): Add a partial unique index to the 'orders' collection on
// `{ user: 1, clientIdempotencyKey: 1 }` (partial filter where
// `clientIdempotencyKey` exists) so the DB enforces uniqueness under concurrent
// retries. Deferred from this change because it requires a migration.

interface CreateOrderItemInput {
  productId: string;
  quantity: number;
  price: number;
  name?: string;
  [key: string]: unknown;
}

interface CreateOrderTotalsInput {
  subtotal: number;
  total: number;
  tax: number;
  discount: number;
  deliveryFee: number;
}

interface CreateOrderBody {
  storeId?: unknown;
  items?: unknown;
  totals?: unknown;
  payment?: { method?: unknown; [key: string]: unknown };
  paymentMethod?: unknown;
  delivery?: { type?: unknown; address?: unknown; [key: string]: unknown };
  deliveryAddress?: unknown;
  coinsUsed?: unknown;
  couponCode?: unknown;
  tax?: unknown;
  deliveryFee?: unknown;
  discount?: unknown;
  currency?: unknown;
  specialInstructions?: unknown;
  idempotencyKey?: unknown;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * M21 FIX: Validates deliveryAddress to prevent NoSQL injection or oversized payloads.
 * Rejects arrays, null, or objects with excessive keys or string lengths.
 */
function validateDeliveryAddress(raw: unknown): Record<string, unknown> | null {
  if (!isPlainObject(raw)) return null;
  const addr = raw as Record<string, unknown>;
  // Limit total keys and string lengths to prevent oversized documents
  if (Object.keys(addr).length > 20) return null;
  for (const [key, val] of Object.entries(addr)) {
    if (typeof key !== 'string' || key.length > 100) return null;
    if (typeof val === 'string' && val.length > 500) return null;
    if (typeof val === 'object' && val !== null) {
      if (Array.isArray(val)) return null; // No nested arrays
      if (Object.keys(val as object).length > 10) return null;
    }
  }
  return addr;
}

// Subtotal cap to prevent overflow / abusive input. Amounts are assumed to be
// in the smallest currency unit (e.g. paise). 10M paise = ₹100,000 — well above
// a realistic single-order maximum.
const MAX_ORDER_SUBTOTAL = 10_000_000;
// Rupee-level totals may be fractional (e.g. 12.50). Allow up to 2 decimal
// places of drift when comparing a client-submitted total to the server
// recomputed value to account for IEEE-754 rounding.
const TOTALS_EPSILON = 0.01;

function isNonNegativeFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

/**
 * Validates the order creation payload from a consumer checkout request.
 * Checks storeId validity, ensures items array is non-empty, validates item structure,
 * and validates the totals object.
 * @param body - The raw request body for order creation
 * @returns Either a validated payload or an error message
 */
function validateCreateOrderPayload(
  body: CreateOrderBody,
):
  | { ok: true; storeId: string; items: CreateOrderItemInput[]; totals: CreateOrderTotalsInput }
  | { ok: false; message: string } {
  const { storeId, items, totals } = body;

  if (typeof storeId !== 'string' || storeId.length === 0) {
    return { ok: false, message: 'storeId is required' };
  }
  if (!mongoose.isValidObjectId(storeId)) {
    return { ok: false, message: 'Invalid storeId' };
  }

  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, message: 'items must be a non-empty array' };
  }

  const validatedItems: CreateOrderItemInput[] = [];
  for (let i = 0; i < items.length; i++) {
    const raw = items[i];
    if (!isPlainObject(raw)) {
      return { ok: false, message: `items[${i}] must be an object` };
    }
    // Consumer sends `product`; other callers may still send `productId`.
    // Treat `product` as canonical, accept `productId` as a fallback alias.
    const rawProduct = raw['product'];
    const rawProductId = raw['productId'];
    const productId =
      typeof rawProduct === 'string' && rawProduct.length > 0
        ? rawProduct
        : typeof rawProductId === 'string' && rawProductId.length > 0
          ? rawProductId
          : undefined;
    const quantity = raw['quantity'];
    const price = raw['price'];

    if (!productId) {
      return { ok: false, message: `items[${i}].product is required` };
    }
    if (typeof quantity !== 'number' || !Number.isFinite(quantity) || quantity <= 0 || !Number.isInteger(quantity)) {
      return { ok: false, message: `items[${i}].quantity must be a positive integer` };
    }
    if (typeof price !== 'number' || !Number.isFinite(price) || price < 0) {
      return { ok: false, message: `items[${i}].price must be a non-negative number` };
    }

    const item: CreateOrderItemInput = { productId, quantity, price };
    if (typeof raw['name'] === 'string') item.name = raw['name'];
    validatedItems.push(item);
  }

  // Optional top-level fee/adjustment fields — default to 0 if omitted.
  const taxInput = body.tax;
  const deliveryFeeInput = body.deliveryFee;
  const discountInput = body.discount;

  if (taxInput !== undefined && !isNonNegativeFiniteNumber(taxInput)) {
    return { ok: false, message: 'tax must be a non-negative number' };
  }
  if (deliveryFeeInput !== undefined && !isNonNegativeFiniteNumber(deliveryFeeInput)) {
    return { ok: false, message: 'deliveryFee must be a non-negative number' };
  }
  if (discountInput !== undefined && !isNonNegativeFiniteNumber(discountInput)) {
    return { ok: false, message: 'discount must be a non-negative number' };
  }

  const tax = typeof taxInput === 'number' ? taxInput : 0;
  const deliveryFee = typeof deliveryFeeInput === 'number' ? deliveryFeeInput : 0;
  const discount = typeof discountInput === 'number' ? discountInput : 0;

  // Server-side subtotal computation — never trust the client. Sum line items.
  let subtotal = 0;
  for (const it of validatedItems) {
    subtotal += it.quantity * it.price;
  }
  if (!Number.isFinite(subtotal) || subtotal < 0) {
    return { ok: false, message: 'Computed subtotal is invalid' };
  }
  if (subtotal > MAX_ORDER_SUBTOTAL) {
    return { ok: false, message: 'Order subtotal exceeds maximum allowed' };
  }

  const computedTotal = subtotal + tax + deliveryFee - discount;
  if (!Number.isFinite(computedTotal) || computedTotal < 0) {
    return { ok: false, message: 'Computed total is invalid' };
  }

  const validatedTotals: CreateOrderTotalsInput = {
    subtotal,
    total: computedTotal,
    tax,
    discount,
    deliveryFee,
  };

  // Tamper-check: if the client sent `totals`, recompute and reject on mismatch.
  // This prevents client-side total tampering while remaining backward-compatible
  // with callers that still pass totals explicitly.
  if (totals !== undefined) {
    if (!isPlainObject(totals)) {
      return { ok: false, message: 'totals must be an object when provided' };
    }
    const clientSubtotal = totals['subtotal'];
    const clientTotal = totals['total'];
    if (clientSubtotal !== undefined) {
      if (!isNonNegativeFiniteNumber(clientSubtotal)) {
        return { ok: false, message: 'totals.subtotal must be a non-negative number' };
      }
      if (Math.abs(clientSubtotal - subtotal) > TOTALS_EPSILON) {
        return { ok: false, message: 'totals do not match computed values' };
      }
    }
    if (clientTotal !== undefined) {
      if (!isNonNegativeFiniteNumber(clientTotal)) {
        return { ok: false, message: 'totals.total must be a non-negative number' };
      }
      if (Math.abs(clientTotal - computedTotal) > TOTALS_EPSILON) {
        return { ok: false, message: 'totals do not match computed values' };
      }
    }
  }

  return { ok: true, storeId, items: validatedItems, totals: validatedTotals };
}

app.post('/orders', requireOrderAuth, async (req: Request, res: Response, next: NextFunction) => {
  // Extract variables before try block so they're available in catch block
  const authUser = (req as Request & { authUser?: Record<string, unknown> }).authUser;
  const rawUserId = authUser
    ? (typeof authUser['userId'] === 'string'
        ? (authUser['userId'] as string)
        : typeof authUser['id'] === 'string'
          ? (authUser['id'] as string)
          : undefined)
    : undefined;

  if (!rawUserId) {
    return res.status(401).json({ success: false, message: 'User identity required to create an order' });
  }
  if (!mongoose.isValidObjectId(rawUserId)) {
    return res.status(401).json({ success: false, message: 'Invalid user identity' });
  }

  const body = (req.body ?? {}) as CreateOrderBody;
  const parsed = validateCreateOrderPayload(body);
  if (!parsed.ok) {
    return res.status(400).json({ success: false, message: parsed.message });
  }

  // Extract idempotency key BEFORE try block for catch block access
  const headerKey = req.headers['idempotency-key'];
  const headerKeyStr = typeof headerKey === 'string' ? headerKey : Array.isArray(headerKey) ? headerKey[0] : undefined;
  const bodyKey = typeof body.idempotencyKey === 'string' ? body.idempotencyKey : undefined;
  const idempotencyKey = (headerKeyStr ?? bodyKey ?? '').trim() || undefined;

  // CONCURRENT-001 FIX: Declare lockKey outside try block for finally block access
  let lockKey = `order:lock:${rawUserId}:${idempotencyKey || 'no-key'}`;

  try {
    // CONCURRENT-001 FIX: Acquire distributed lock before creating order.
    // Uses SET NX with TTL to prevent duplicate orders from concurrent requests.
    // M16 FIX: Increased TTL from 30s to 60s. With 30s, if a DB transaction runs long
    // (e.g., due to slow network or high load), the lock expires and another concurrent
    // request could also acquire the lock, creating a duplicate order.
    const lockAcquired = await bullmqRedis.set(lockKey, '1', 'EX', 60, 'NX');
    if (!lockAcquired) {
      logger.warn('[OrderAudit] order_create_concurrent_request_rejected', {
        userId: rawUserId,
        idempotencyKey: idempotencyKey || 'unknown',
      });
      return res.status(409).json({ success: false, error: 'CONCURRENT_REQUEST' });
    }

    const correlationId = req.headers['x-correlation-id'];
    const correlationIdStr =
      typeof correlationId === 'string'
        ? correlationId
        : Array.isArray(correlationId)
          ? correlationId[0]
          : undefined;

    const userObjectId = new mongoose.Types.ObjectId(rawUserId);
    const storeObjectId = new mongoose.Types.ObjectId(parsed.storeId);
    const collection = mongoose.connection.collection('orders');

    // DATA-001 FIX: Resolve merchantId from store doc instead of using storeObjectId as merchant.
    // This ensures orders.merchant references the actual Merchant._id, not Store._id.
    const storeLookup = await mongoose.connection.collection('stores').findOne({ _id: storeObjectId });
    const resolvedMerchantId = storeLookup?.merchant || storeLookup?.merchantId;
    if (!resolvedMerchantId) {
      return res.status(400).json({ success: false, message: 'Store not found or has no merchant association' });
    }

    if (idempotencyKey) {
      const existing = await collection.findOne({
        user: userObjectId,
        clientIdempotencyKey: idempotencyKey,
      });
      if (existing) {
        logger.info('[OrderAudit] order_create_idempotent_hit', {
          orderId: String(existing['_id']),
          userId: rawUserId,
          correlationId: correlationIdStr,
        });
        return res.status(200).json({ success: true, data: stripInternalFields(existing) });
      }
    }

    const orderItems = parsed.items.map((it) => {
      const productIdOid = mongoose.isValidObjectId(it.productId)
        ? new mongoose.Types.ObjectId(it.productId)
        : it.productId;
      const mapped: Record<string, unknown> = {
        product: productIdOid,
        quantity: it.quantity,
        price: it.price,
      };
      if (it.name) mapped['name'] = it.name;
      return mapped;
    });

    const now = new Date();
    const currency = typeof body.currency === 'string' ? body.currency : 'INR';

    // paymentMethod: consumer sends at top level; legacy callers may send
    // `payment.method`. Default to 'unknown' so the order doc always has a
    // concrete string — downstream payment service can still reject unknowns
    // but we don't block order creation on a missing method.
    const paymentMethod =
      typeof body.paymentMethod === 'string' && body.paymentMethod.length > 0
        ? body.paymentMethod
        : body.payment && typeof body.payment.method === 'string' && body.payment.method.length > 0
          ? body.payment.method
          : 'unknown';

    // deliveryAddress: consumer sends at top level; legacy callers may send
    // `delivery.address`. Store null when absent so the field is explicit.
    // M21 FIX: Validate deliveryAddress structure before assignment.
    const rawDeliveryAddress = isPlainObject(body.deliveryAddress)
      ? body.deliveryAddress
      : body.delivery && isPlainObject(body.delivery.address)
        ? body.delivery.address
        : null;
    const deliveryAddress = validateDeliveryAddress(rawDeliveryAddress);

    const deliveryType =
      body.delivery && typeof body.delivery.type === 'string' ? body.delivery.type : undefined;

    const coinsUsed = isPlainObject(body.coinsUsed) ? body.coinsUsed : undefined;
    const couponCode = typeof body.couponCode === 'string' && body.couponCode.length > 0
      ? body.couponCode
      : undefined;

    const specialInstructions =
      typeof body.specialInstructions === 'string' ? body.specialInstructions : undefined;

    const orderDoc: Record<string, unknown> = {
      orderNumber: generateOrderNumber(),
      status: 'placed',
      user: userObjectId,
      store: storeObjectId,
      merchant: resolvedMerchantId instanceof mongoose.Types.ObjectId ? resolvedMerchantId : new mongoose.Types.ObjectId(resolvedMerchantId),
      items: orderItems,
      totals: parsed.totals,
      paymentMethod,
      deliveryAddress,
      payment: {
        method: paymentMethod,
        status: 'pending',
        amount: parsed.totals.total,
      },
      delivery: {
        type: deliveryType ?? 'delivery',
        ...(deliveryAddress ? { address: deliveryAddress } : {}),
        status: 'pending',
      },
      currency,
      timeline: [
        { status: 'placed', message: 'Order placed', timestamp: now },
      ],
      createdAt: now,
      updatedAt: now,
    };

    if (coinsUsed) orderDoc['coinsUsed'] = coinsUsed;
    if (couponCode) orderDoc['couponCode'] = couponCode;
    if (specialInstructions) orderDoc['specialInstructions'] = specialInstructions;
    if (idempotencyKey) orderDoc['clientIdempotencyKey'] = idempotencyKey;
    if (correlationIdStr) orderDoc['correlationId'] = correlationIdStr;

    const insertResult = await collection.insertOne(orderDoc);
    const created = await collection.findOne({ _id: insertResult.insertedId });

    logger.info('[OrderAudit] order_created', {
      orderId: String(insertResult.insertedId),
      userId: rawUserId,
      storeId: parsed.storeId,
      total: parsed.totals.total,
      itemCount: parsed.items.length,
      hasIdempotencyKey: Boolean(idempotencyKey),
      correlationId: correlationIdStr,
      requestId: req.headers['x-request-id'],
    });

    // RTMN Commerce Memory — order.placed (fire-and-forget, before response)
    intentTrack({
      userId: rawUserId,
      event: 'order.placed',
      intentKey: 'commerce.order.lifecycle',
      properties: {
        orderId: String(insertResult.insertedId),
        storeId: parsed.storeId,
        total: parsed.totals.total,
        itemCount: parsed.items.length,
      },
    }).catch((err) => {
      logger.warn('[Intent] Track failed for order.placed', {
        orderId: String(insertResult.insertedId),
        error: err instanceof Error ? err.message : String(err),
      });
    });

    // Cross-service integration — marketing & ads (fire-and-forget)
    notifyMarketingConversion({
      userId: rawUserId,
      orderId: String(insertResult.insertedId),
      orderNumber: (created as unknown)?.orderNumber || String(insertResult.insertedId),
      total: parsed.totals.total,
      items: parsed.items,
      merchantId: parsed.storeId,
    }).catch((err) => {
      logger.warn('[Marketing] Conversion event failed', {
        orderId: String(insertResult.insertedId),
        error: err instanceof Error ? err.message : String(err),
      });
    });

    notifyAdsConversion({
      userId: rawUserId,
      orderId: String(insertResult.insertedId),
      total: parsed.totals.total,
      merchantId: parsed.storeId,
    }).catch((err) => {
      logger.warn('[Ads] Conversion event failed', {
        orderId: String(insertResult.insertedId),
        error: err instanceof Error ? err.message : String(err),
      });
    });

    // REZ-support-copilot webhook - order created (fire-and-forget)
    notifyOrderCreated({
      id: String(insertResult.insertedId),
      userId: rawUserId,
      merchantId: parsed.storeId,
      items: parsed.items,
      total: parsed.totals.total,
    }).catch((err) => {
      logger.warn('[Webhook] Order created notification failed', {
        orderId: String(insertResult.insertedId),
        error: err instanceof Error ? err.message : String(err),
      });
    });

    return res.status(201).json({ success: true, data: stripInternalFields(created) });
  } catch (err) {
    const mongoErr = err as { code?: number; message?: string };
    // BUG-001 FIX: Duplicate-key error from concurrent insert with same idempotency key.
    // Instead of returning 409 (which causes client to retry and potentially create duplicate orders
    // via a different idempotency key), fetch and return the original order.
    if (mongoErr && mongoErr.code === 11000) {
      logger.warn('[OrderAudit] order_create_duplicate_key_fetching_original', {
        message: mongoErr.message,
        idempotencyKey: idempotencyKey || 'unknown',
      });
      // Fetch the original order that won the race - query by idempotency key and user
      if (idempotencyKey) {
        const ordersCollection = mongoose.connection.collection('orders');
        const originalOrder = await ordersCollection.findOne({
          user: new mongoose.Types.ObjectId(rawUserId),
          clientIdempotencyKey: idempotencyKey,
        });
        if (originalOrder) {
          return res.status(200).json({ success: true, data: stripInternalFields(originalOrder as Record<string, unknown>) });
        }
      }
      // Fallback if we can't find the order (shouldn't happen)
      return res.status(409).json({ success: false, message: 'Duplicate order creation detected' });
    }
    return next(err);
  } finally {
    // CONCURRENT-001 FIX: Always release the distributed lock
    if (lockKey) {
      await bullmqRedis.del(lockKey).catch((err: Error) => {
        logger.error('[OrderAudit] Failed to release order lock', { lockKey, error: err.message });
      });
    }
  }
});

function stripInternalFields(doc: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!doc) return null;
  const copy: Record<string, unknown> = { ...doc };
  delete copy['__v'];
  return copy;
}

function generateOrderNumber(): string {
  // UUID-based order number — keeps IDs cryptographically strong and avoids
  // collisions under concurrent inserts. Uppercase hex without hyphens for
  // a shorter, ticket-style identifier.
  return 'ORD-' + crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase();
}

// ── List orders (Cursor Pagination) ───────────────────────────────────────────────

app.get('/orders', requireOrderAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { merchantId, userId, status } = req.query as Record<string, string | undefined>;

    // P0-SEC-1 FIX: IDOR vulnerability — userId ownership check
    const requestingUserId = (req as unknown).authUser?.userId;
    if (userId && requestingUserId && userId !== requestingUserId) {
      const roles = ((req as unknown).authUser?.role || '').split(',');
      const isPrivileged = roles.includes('admin') || roles.includes('merchant') || roles.includes('super_admin') || roles.includes('operator');
      if (!isPrivileged) {
        return res.status(403).json({ success: false, message: 'Access denied: you can only view your own orders' });
      }
    }

    // PERFORMANCE: Use cursor-based pagination for better performance on large datasets
    const cursorOpts = parseCursor({
      query: req.query,
      sortField: 'createdAt',
      sortDirection: -1,
      limit: 20,
      maxLimit: 100,
    });

    const filter: Record<string, unknown> = { ...cursorOpts.filter };

    if (merchantId) {
      if (!mongoose.isValidObjectId(merchantId)) {
        return res.status(400).json({ success: false, message: 'Invalid merchantId' });
      }
      filter['merchant'] = new mongoose.Types.ObjectId(merchantId);
    }

    if (userId) {
      if (!mongoose.isValidObjectId(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid userId' });
      }
      filter['user'] = new mongoose.Types.ObjectId(userId);
    }

    if (status) {
      if (!VALID_STATUSES.includes(status as OrderStatus)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
        });
      }
      filter['status'] = status;
    }

    const collection = mongoose.connection.collection('orders');

    // Fetch limit+1 to determine hasMore
    const data = await collection
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(cursorOpts.limit + 1)
      .toArray();

    // Build paginated response with cursor
    const result = buildPaginatedResponse(data, cursorOpts.limit, 'createdAt');

    return res.json({
      success: true,
      data: result.data,
      hasMore: result.hasMore,
      nextCursor: result.nextCursor,
    });
  } catch (err) {
    next(err);
  }
});

// ── SSE order stream — MUST be registered before /orders/:id ─────────────────
// If registered after, Express matches /orders/stream as { id: "stream" }
// and returns 400 "Invalid order id" before this handler runs.

/**
 * setupChangeStream — opens a MongoDB change stream scoped to a single merchant
 * and writes order:status events to the SSE response.
 *
 * Requires MongoDB replica set — set MONGO_REPLICASET=true in env.
 *
 * Returns a cleanup function that closes the change stream.
 */
function setupChangeStream(
  merchantId: string,
  res: Response,
): () => void {
  const merchantOid = new mongoose.Types.ObjectId(merchantId);
  const pipeline = [
    {
      $match: {
        $or: [
          { operationType: 'insert', 'fullDocument.merchant': merchantOid },
          {
            operationType: { $in: ['update', 'replace'] },
            'fullDocument.merchant': merchantOid,
          },
        ],
      },
    },
  ];

  const changeStream = mongoose.connection
    .collection('orders')
    .watch(pipeline, { fullDocument: 'updateLookup' });

  changeStream.on('change', (change) => {
    const order = change.fullDocument;
    if (!order) return;

    try {
      if (res.writableEnded) return;
      res.write(
        'data: ' +
          JSON.stringify({
            orderId: String(order._id),
            status: order.status,
            updatedAt: order.updatedAt,
            order,
          }) +
          '\n\n',
      );
    } catch {
      // Client already disconnected — cleanup will handle stream closure
    }
  });

  changeStream.on('error', (err: Error) => {
    logger.error('[SSE:changeStream] Error', { merchantId, error: err.message });
    try {
      if (res.writableEnded) return;
      res.write(
        'event: error\ndata: ' +
          JSON.stringify({ message: 'change_stream_error' }) +
          '\n\n',
      );
    } catch {}
  });

  return () => {
    changeStream.close().catch((err) => {
      logger.warn('[SSE] Failed to close change stream', { error: err instanceof Error ? err.message : String(err) });
    });
  };
}

/**
 * setupPollingFallback — original 10 s polling used when change streams are
 * unavailable (MongoDB not running as a replica set).
 *
 * Returns a cleanup function that clears all timers.
 */
function setupPollingFallback(
  merchantId: string,
  res: Response,
): () => void {
  const collection = mongoose.connection.collection('orders');
  const filter = {
    merchant: new mongoose.Types.ObjectId(merchantId),
    status: { $in: ['placed', 'confirmed', 'preparing'] },
  };

  // Polling at 10 s with a hard cap of 50 orders to limit DB load per connection.
  const pollInterval = setInterval(async () => {
    try {
      if (res.writableEnded) return;
      const orders = await collection
        .find(filter)
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray();
      res.write(
        'data: ' +
          JSON.stringify({ orders, timestamp: new Date().toISOString() }) +
          '\n\n',
      );
    } catch (err) {
      logger.error('[SSE:polling] Poll error', { merchantId, error: err.message });
      try {
        if (res.writableEnded) return;
        res.write(
          'event: error\ndata: ' +
            JSON.stringify({ message: 'poll_error', updatedAt: new Date().toISOString() }) +
            '\n\n',
        );
      } catch {}
    }
  }, 10000);

  return () => {
    clearInterval(pollInterval);
  };
}

// M17 FIX: SSE connection limits — track connections in Redis to prevent resource exhaustion.
// Limits: max 10 connections per merchant, max 1000 global connections.
const MAX_CONNECTIONS_PER_MERCHANT = 10;
const MAX_GLOBAL_CONNECTIONS = 1000;

app.get('/orders/stream', requireOrderAuth, async (req: Request, res: Response) => {
  const { merchantId } = req.query as Record<string, string | undefined>;

  if (!merchantId) {
    res.status(400).json({ success: false, message: 'merchantId query param is required' });
    return;
  }

  if (!mongoose.isValidObjectId(merchantId)) {
    res.status(400).json({ success: false, message: 'Invalid merchantId' });
    return;
  }

  // M17: Check connection limits before accepting SSE connection
  // connId is declared outside the try so cleanup() can access it
  let connId = '';
  try {
    const merchantCount = await bullmqRedis.scard(`sse:merchant:${merchantId}`);
    if (merchantCount >= MAX_CONNECTIONS_PER_MERCHANT) {
      res.status(429).json({ success: false, message: `Max ${MAX_CONNECTIONS_PER_MERCHANT} connections per merchant` });
      return;
    }
    const globalCount = await bullmqRedis.scard('sse:global');
    if (globalCount >= MAX_GLOBAL_CONNECTIONS) {
      res.status(429).json({ success: false, message: 'Server at max capacity' });
      return;
    }
    // Reserve the connection slot; cleanup releases it on disconnect
    connId = crypto.randomUUID();
    await Promise.all([
      bullmqRedis.sadd(`sse:merchant:${merchantId}`, connId),
      bullmqRedis.sadd('sse:global', connId),
      bullmqRedis.expire(`sse:merchant:${merchantId}`, 3600),
      bullmqRedis.expire('sse:global', 3600),
    ]);
  } catch (err) {
    logger.warn('[SSE] Redis connection tracking failed, allowing request', { error: err.message });
  }

  // BAK-CROSS-002 FIX: Verify the authenticated user owns the merchant whose order stream
  // they are requesting. Internal service tokens (X-Internal-Token) bypass this check —
  // the monolith and gateway are trusted to pass correct merchantIds. Merchant JWTs must
  // match the requested merchantId to prevent cross-merchant data exfiltration.
  const authUser: Record<string, unknown> | undefined = (req as unknown).authUser;
  if (authUser) {
    // Internal token path sets req.authUser.role = 'internal'; merchant JWTs have merchantId.
    if (authUser.role !== 'internal') {
      const tokenMerchantId = authUser.merchantId || authUser.merchant?._id || authUser.merchant;
      if (tokenMerchantId && tokenMerchantId !== merchantId) {
        logger.warn('[SSE] Merchant IDOR attempt — authenticated merchant tried to subscribe to another merchant\'s orders', {
          authenticatedMerchantId: tokenMerchantId,
          requestedMerchantId: merchantId,
        });
        res.status(403).json({ success: false, error: 'Forbidden: you can only subscribe to your own order stream' });
        return;
      }
    }
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  res.write('data: ' + JSON.stringify({ connected: true }) + '\n\n');

  // Attempt to use MongoDB change streams; fall back to polling if unavailable.
  let cleanupStream: () => void;
  try {
    cleanupStream = setupChangeStream(merchantId, res);
  } catch (err) {
    logger.warn('[SSE] Change streams unavailable, using polling fallback', {
      merchantId,
      error: err.message,
    });
    cleanupStream = setupPollingFallback(merchantId, res);
  }

  const heartbeatInterval = setInterval(() => {
    if (res.writableEnded) return;
    res.write(': ping\n\n');
  }, 15000);

  // OS-01: Cap SSE lifetime to 5 minutes to prevent zombie connections
  const MAX_SSE_LIFETIME_MS = 5 * 60 * 1000;
  const lifetimeTimeout = setTimeout(() => {
    res.write(
      'event: reconnect\ndata: ' +
        JSON.stringify({ reason: 'max_lifetime' }) +
        '\n\n',
    );
    res.end();
  }, MAX_SSE_LIFETIME_MS);

  const cleanup = () => {
    cleanupStream();
    clearInterval(heartbeatInterval);
    clearTimeout(lifetimeTimeout);
    // M17: Release Redis connection slot
    if (connId) {
      bullmqRedis.srem(`sse:merchant:${merchantId}`, connId).catch((err: unknown) => {
        logger.warn('[SSE] Failed to remove merchant connection', { connId, error: err instanceof Error ? err.message : String(err) });
      });
      bullmqRedis.srem('sse:global', connId).catch((err: unknown) => {
        logger.warn('[SSE] Failed to remove global connection', { connId, error: err instanceof Error ? err.message : String(err) });
      });
    }
    logger.info('[SSE] Client disconnected', { merchantId });
  };

  req.on('close', cleanup);
  req.on('error', (err) => {
    logger.error('[SSE] Request error', { merchantId, error: err.message });
    cleanup();
  });
});

// ── Get order statistics for a merchant ──────────────────────────────────────
// Used for merchant health score calculation

interface OrderStats {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  ordersToday: number;
  ordersThisWeek: number;
  ordersThisMonth: number;
  revenueToday: number;
  revenueThisWeek: number;
  revenueThisMonth: number;
  previousRevenueToday: number;
  previousRevenueThisWeek: number;
  previousRevenueThisMonth: number;
  growthRateToday: number;
  growthRateWeek: number;
  growthRateMonth: number;
}

app.get('/orders/stats/:merchantId', requireInternalToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const merchantId = req.params['merchantId'] as string;

    if (!merchantId || !mongoose.isValidObjectId(merchantId)) {
      res.status(400).json({ success: false, message: 'Invalid merchantId' });
      return;
    }

    const merchantOid = new mongoose.Types.ObjectId(merchantId);
    const collection = mongoose.connection.collection('orders');

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Previous period boundaries
    const prevDayStart = new Date(todayStart);
    prevDayStart.setDate(prevDayStart.getDate() - 1);
    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevMonthStart = new Date(monthStart);
    prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);

    const completedStatuses = ['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'completed'];
    const cancelledStatuses = ['cancelled', 'rejected'];

    // Aggregate order stats
    const pipeline = [
      { $match: { merchant: merchantOid } },
      {
        $facet: {
          // Overall totals
          totals: [
            {
              $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                completedOrders: {
                  $sum: { $cond: [{ $in: ['$status', completedStatuses] }, 1, 0] },
                },
                cancelledOrders: {
                  $sum: { $cond: [{ $in: ['$status', cancelledStatuses] }, 1, 0] },
                },
                totalRevenue: {
                  $sum: {
                    $cond: [
                      { $in: ['$status', completedStatuses] },
                      { $ifNull: ['$totals.total', { $ifNull: ['$totals.paidAmount', { $ifNull: ['$amount', 0] }] }] },
                      0,
                    ],
                  },
                },
              },
            },
          ],
          // Today's orders
          today: [
            { $match: { createdAt: { $gte: todayStart } } },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                revenue: {
                  $sum: {
                    $cond: [
                      { $in: ['$status', completedStatuses] },
                      { $ifNull: ['$totals.total', { $ifNull: ['$totals.paidAmount', { $ifNull: ['$amount', 0] }] }] },
                      0,
                    ],
                  },
                },
              },
            },
          ],
          // This week's orders
          week: [
            { $match: { createdAt: { $gte: weekStart } } },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                revenue: {
                  $sum: {
                    $cond: [
                      { $in: ['$status', completedStatuses] },
                      { $ifNull: ['$totals.total', { $ifNull: ['$totals.paidAmount', { $ifNull: ['$amount', 0] }] }] },
                      0,
                    ],
                  },
                },
              },
            },
          ],
          // This month's orders
          month: [
            { $match: { createdAt: { $gte: monthStart } } },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                revenue: {
                  $sum: {
                    $cond: [
                      { $in: ['$status', completedStatuses] },
                      { $ifNull: ['$totals.total', { $ifNull: ['$totals.paidAmount', { $ifNull: ['$amount', 0] }] }] },
                      0,
                    ],
                  },
                },
              },
            },
          ],
          // Previous day's revenue (for growth calc)
          prevDay: [
            {
              $match: {
                createdAt: { $gte: prevDayStart, $lt: todayStart },
              },
            },
            {
              $group: {
                _id: null,
                revenue: {
                  $sum: {
                    $cond: [
                      { $in: ['$status', completedStatuses] },
                      { $ifNull: ['$totals.total', { $ifNull: ['$totals.paidAmount', { $ifNull: ['$amount', 0] }] }] },
                      0,
                    ],
                  },
                },
              },
            },
          ],
          // Previous week's revenue (for growth calc)
          prevWeek: [
            {
              $match: {
                createdAt: { $gte: prevWeekStart, $lt: weekStart },
              },
            },
            {
              $group: {
                _id: null,
                revenue: {
                  $sum: {
                    $cond: [
                      { $in: ['$status', completedStatuses] },
                      { $ifNull: ['$totals.total', { $ifNull: ['$totals.paidAmount', { $ifNull: ['$amount', 0] }] }] },
                      0,
                    ],
                  },
                },
              },
            },
          ],
          // Previous month's revenue (for growth calc)
          prevMonth: [
            {
              $match: {
                createdAt: { $gte: prevMonthStart, $lt: monthStart },
              },
            },
            {
              $group: {
                _id: null,
                revenue: {
                  $sum: {
                    $cond: [
                      { $in: ['$status', completedStatuses] },
                      { $ifNull: ['$totals.total', { $ifNull: ['$totals.paidAmount', { $ifNull: ['$amount', 0] }] }] },
                      0,
                    ],
                  },
                },
              },
            },
          ],
        },
      },
    ];

    const results = await collection.aggregate(pipeline).toArray();
    const data = results[0];

    const totals = data.totals[0] || { totalOrders: 0, completedOrders: 0, cancelledOrders: 0, totalRevenue: 0 };
    const todayData = data.today[0] || { count: 0, revenue: 0 };
    const weekData = data.week[0] || { count: 0, revenue: 0 };
    const monthData = data.month[0] || { count: 0, revenue: 0 };
    const prevDayData = data.prevDay[0] || { revenue: 0 };
    const prevWeekData = data.prevWeek[0] || { revenue: 0 };
    const prevMonthData = data.prevMonth[0] || { revenue: 0 };

    const calcGrowth = (current: number, previous: number): number => {
      if (previous <= 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 10000) / 100;
    };

    const stats: OrderStats = {
      totalOrders: totals.totalOrders || 0,
      completedOrders: totals.completedOrders || 0,
      cancelledOrders: totals.cancelledOrders || 0,
      totalRevenue: totals.totalRevenue || 0,
      avgOrderValue: totals.completedOrders > 0
        ? Math.round((totals.totalRevenue / totals.completedOrders) * 100) / 100
        : 0,
      ordersToday: todayData.count || 0,
      ordersThisWeek: weekData.count || 0,
      ordersThisMonth: monthData.count || 0,
      revenueToday: todayData.revenue || 0,
      revenueThisWeek: weekData.revenue || 0,
      revenueThisMonth: monthData.revenue || 0,
      previousRevenueToday: prevDayData.revenue || 0,
      previousRevenueThisWeek: prevWeekData.revenue || 0,
      previousRevenueThisMonth: prevMonthData.revenue || 0,
      growthRateToday: calcGrowth(todayData.revenue || 0, prevDayData.revenue || 0),
      growthRateWeek: calcGrowth(weekData.revenue || 0, prevWeekData.revenue || 0),
      growthRateMonth: calcGrowth(monthData.revenue || 0, prevMonthData.revenue || 0),
    };

    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
});

// ── Single order ──────────────────────────────────────────────────────────────

app.get('/orders/:id', requireOrderAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params['id'] ?? '');

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid order id' });
    }

    const collection = mongoose.connection.collection('orders');
    const order = await collection.findOne({ _id: new mongoose.Types.ObjectId(id) });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // IDOR fix: verify the authenticated user owns this order, or is a privileged role,
    // or is an internal service request (no authUser set when using X-Internal-Token).
    const authUser = (req as unknown).authUser;
    if (authUser) {
      const orderUserId = order.user?.toString();
      const orderMerchantId = order.merchant?.toString();
      const requestingId = authUser.userId || authUser.id;
      const requestingMerchantId = authUser.merchantId;
      const roles = (authUser.role || '').split(',');
      const isAdmin = roles.includes('admin') || roles.includes('super_admin') || roles.includes('operator');
      const isOwner = requestingId && orderUserId === requestingId;
      const isMerchant = requestingMerchantId && orderMerchantId === requestingMerchantId;
      if (!isOwner && !isMerchant && !isAdmin) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    return res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
});

// ── Update order status (state-machine enforced) ──────────────────────────────

app.patch('/orders/:id/status', requireOrderAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params['id'] ?? '');

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid order id' });
    }

    const { status } = req.body as { status?: string };

    if (!status) {
      return res.status(400).json({ success: false, message: 'status field is required' });
    }

    if (!VALID_STATUSES.includes(status as OrderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    }

    const collection = mongoose.connection.collection('orders');

    // Fetch current order for state-machine validation + ownership check
    const current = await collection.findOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { projection: { status: 1, merchant: 1, user: 1 } },
    );
    if (!current) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // B4 FIX: Verify the authenticated user owns this order before allowing status updates.
    // Internal service tokens bypass ownership check (trusted monolith/gateway).
    // Merchant JWTs must match the order's merchant; privileged roles (admin/super_admin/operator)
    // can update any order.
    const authUser = (req as unknown).authUser;
    if (authUser && authUser.role !== 'internal') {
      const orderMerchantId = current.merchant?.toString();
      const tokenMerchantId = authUser.merchantId || authUser.merchant?._id || authUser.merchant;
      const roles = (authUser.role || '').split(',');
      const isPrivileged = roles.includes('admin') || roles.includes('super_admin') || roles.includes('operator');
      if (tokenMerchantId && orderMerchantId && tokenMerchantId !== orderMerchantId && !isPrivileged) {
        logger.warn('[OrderStatus] IDOR attempt — merchant tried to update another merchant\'s order', {
          orderId: id,
          authenticatedMerchantId: tokenMerchantId,
          orderMerchantId,
        });
        return res.status(403).json({ success: false, message: 'Forbidden: you can only update your own orders' });
      }
    }

    const currentStatus = current.status as OrderStatus;
    const allowed = VALID_TRANSITIONS[currentStatus] ?? [];
    if (!allowed.includes(status as OrderStatus)) {
      return res.status(422).json({
        success: false,
        message: `Cannot transition from '${currentStatus}' to '${status}'`,
        allowedTransitions: allowed,
      });
    }

    const timestampField: Record<string, string> = {
      confirmed:        'confirmedAt',
      preparing:        'preparingAt',
      ready:            'readyAt',
      dispatched:       'dispatchedAt',
      out_for_delivery: 'outForDeliveryAt',
      delivered:        'deliveredAt',
      cancelled:        'cancelledAt',
      returned:         'returnedAt',
      refunded:         'refundedAt',
    };

    const update: Record<string, unknown> = { status, updatedAt: new Date() };
    if (timestampField[status]) update[timestampField[status]] = new Date();

    // Include currentStatus in the filter so a concurrent update that already
    // advanced the status causes this write to return null (conflict detected).
    const result = await collection.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id), status: currentStatus },
      { $set: update },
      { returnDocument: 'after' },
    );

    if (!result) {
      // Another concurrent request already changed the status — re-read and report
      const fresh = await collection.findOne(
        { _id: new mongoose.Types.ObjectId(id) },
        { projection: { status: 1 } },
      );
      return res.status(409).json({
        success: false,
        message: `Concurrent update conflict: order status is now '${fresh?.status ?? 'unknown'}', not '${currentStatus}'`,
        currentStatus: fresh?.status,
      });
    }

    logger.info('[OrderAudit] status_update', {
      orderId: id,
      from: currentStatus,
      to: status,
      correlationId: req.headers['x-correlation-id'],
      requestId: req.headers['x-request-id'],
      ip: req.ip,
    });

    // Profile update: Record transaction when order is delivered
    if (status === 'delivered' && result) {
      const order = result as unknown;
      if (order.user || order.consumerId) {
        // Fire and forget - don't block order response
        recordProfileTransaction({
          userId: order.user?.toString() || order.consumerId?.toString() || '',
          phone: order.userPhone || order.phone || '',
          vertical: getVerticalFromOrder(order.orderType || order.type),
          amount: order.totalAmount || order.amount || 0,
          merchantId: order.merchant?.toString() || '',
          category: order.category || 'order',
        }).catch((err) => {
          logger.error('[ProfileIntegration] Failed to update profile', { orderId: id, error: err.message });
        });
      }
    }

    // RTMN Commerce Memory — order lifecycle status events (fire-and-forget with logging)
    const updatedOrder = result as unknown;
    const intentUserId = updatedOrder.user?.toString() ?? '';
    const intentOrderId = String(updatedOrder._id ?? '');
    const intentTotal = updatedOrder.totalAmount ?? updatedOrder.amount ?? 0;

    const trackIntent = (event: string) => {
      intentTrack({ userId: intentUserId, event, intentKey: 'commerce.order.lifecycle', properties: { orderId: intentOrderId, total: intentTotal } })
        .catch((err) => {
          logger.warn('[Intent] Track failed', { event, orderId: intentOrderId, error: err instanceof Error ? err.message : String(err) });
        });
    };

    switch (status) {
      case 'confirmed':
        trackIntent('order.confirmed');
        break;
      case 'preparing':
        trackIntent('order.preparing');
        break;
      case 'ready':
        trackIntent('order.ready');
        break;
      case 'dispatched':
        trackIntent('order.dispatched');
        break;
      case 'out_for_delivery':
        trackIntent('order.out_for_delivery');
        break;
      case 'delivered':
        trackIntent('order.delivered');
        break;
      case 'returned':
        trackIntent('order.returned');
        break;
      case 'refunded':
        trackIntent('order.refunded');
        break;
        break;
    }

    // REZ-support-copilot webhook - order status change (fire-and-forget)
    notifyOrderStatusChange({
      id: id,
      userId: updatedOrder.user?.toString() ?? '',
      merchantId: updatedOrder.merchant?.toString(),
    }, currentStatus, status).catch((err) => {
      logger.warn('[Webhook] Order status change notification failed', {
        orderId: id,
        error: err instanceof Error ? err.message : String(err),
      });
    });

    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// ── Cancel order ──────────────────────────────────────────────────────────────

app.post('/orders/:id/cancel', requireOrderAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params['id'] ?? '');
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid order id' });
    }

    const { reason } = req.body as { reason?: string };
    const collection = mongoose.connection.collection('orders');

    const current = await collection.findOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { projection: { status: 1 } },
    );
    if (!current) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const currentStatus = current.status as OrderStatus;
    const cancellableStatuses: OrderStatus[] = ['placed', 'confirmed', 'preparing', 'ready', 'dispatched', 'out_for_delivery'];
    if (!cancellableStatuses.includes(currentStatus)) {
      return res.status(422).json({
        success: false,
        message: `Order in '${currentStatus}' state cannot be cancelled`,
      });
    }

    // Include currentStatus in the filter to prevent concurrent status changes
    // from being overwritten — a concurrent delivery/cancellation wins the race.
    const result = await collection.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id), status: currentStatus },
      { $set: { status: 'cancelled', cancelReason: reason || 'Cancelled', cancelledAt: new Date(), updatedAt: new Date() } },
      { returnDocument: 'after' },
    );

    if (!result) {
      const fresh = await collection.findOne(
        { _id: new mongoose.Types.ObjectId(id) },
        { projection: { status: 1 } },
      );
      return res.status(409).json({
        success: false,
        message: `Concurrent update conflict: order status is now '${fresh?.status ?? 'unknown'}', cannot cancel`,
        currentStatus: fresh?.status,
      });
    }

    logger.info('[OrderAudit] order_cancelled', {
      orderId: id,
      reason,
      correlationId: req.headers['x-correlation-id'],
      requestId: req.headers['x-request-id'],
      ip: req.ip,
    });

    // RTMN Commerce Memory — order.cancelled (fire-and-forget with logging)
    intentTrack({
      userId: (result as unknown).user?.toString() ?? '',
      event: 'order.cancelled',
      intentKey: 'commerce.order.lifecycle',
      properties: { orderId: id, reason: reason ?? 'Cancelled' },
    }).catch((err) => {
      logger.warn('[Intent] Track failed for order.cancelled', { orderId: id, error: err instanceof Error ? err.message : String(err) });
    });

    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// ── Bill Split Endpoints ────────────────────────────────────────────────────────

import { BillSplit } from './models/BillSplit';

// Interface for split request
interface SplitRequest {
  splits: Array<{
    personId: string;
    personName?: string;
    itemIds: string[];
  }>;
}

// POST /orders/:id/split — Create a bill split for an order
app.post('/orders/:id/split', requireOrderAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orderId = String(req.params['id'] ?? '');
    const body = req.body as SplitRequest;

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({ success: false, message: 'Invalid order id' });
    }

    if (!body.splits || !Array.isArray(body.splits) || body.splits.length === 0) {
      return res.status(400).json({ success: false, message: 'splits array is required and must not be empty' });
    }

    // Validate splits
    for (let i = 0; i < body.splits.length; i++) {
      const split = body.splits[i];
      if (!split.personId || typeof split.personId !== 'string') {
        return res.status(400).json({ success: false, message: `splits[${i}].personId is required` });
      }
      if (!Array.isArray(split.itemIds)) {
        return res.status(400).json({ success: false, message: `splits[${i}].itemIds must be an array` });
      }
    }

    // Get the order to validate and get total
    const ordersCollection = mongoose.connection.collection('orders');
    const order = await ordersCollection.findOne({ _id: new mongoose.Types.ObjectId(orderId) });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const totalAmount = (order.totals?.total as number) || (order.amount as number) || (order.totalAmount as number) || 0;
    const storeId = (order.store as string) || (order.storeId as string) || '';

    // Calculate amounts for each split
    const itemMap = new Map<string, number>();
    if (Array.isArray(order.items)) {
      order.items.forEach((item, idx: number) => {
        const itemId = String(item.product || item.itemId || `item_${idx}`);
        const price = (item.price as number) || 0;
        const qty = (item.quantity as number) || 1;
        itemMap.set(itemId, (itemMap.get(itemId) || 0) + price * qty);
      });
    }

    // Calculate per-person amounts based on item totals
    let totalItemValue = 0;
    const splitAmounts = body.splits.map((split) => {
      let itemTotal = 0;
      split.itemIds.forEach((itemId) => {
        itemTotal += itemMap.get(itemId) || 0;
      });
      totalItemValue += itemTotal;
      return {
        personId: split.personId,
        personName: split.personName,
        itemIds: split.itemIds,
        itemTotal,
        sharePercent: 0,
        amount: itemTotal,
        settled: false,
      };
    });

    // Distribute remaining amount (round-off) to first person
    const remainder = totalAmount - totalItemValue;
    if (remainder !== 0 && splitAmounts.length > 0) {
      splitAmounts[0].amount += remainder;
    }

    // Calculate share percentages
    splitAmounts.forEach((split) => {
      split.sharePercent = totalAmount > 0 ? Math.round((split.amount / totalAmount) * 10000) / 100 : 0;
    });

    // Check for existing split
    const existingSplit = await BillSplit.findOne({ orderId });
    if (existingSplit) {
      // Update existing split
      existingSplit.splits = splitAmounts;
      existingSplit.totalAmount = totalAmount;
      existingSplit.status = 'pending';
      await existingSplit.save();
      return res.json({ success: true, data: existingSplit });
    }

    // Create new split
    const billSplit = await BillSplit.create({
      orderId,
      storeId,
      totalAmount,
      splits: splitAmounts,
      status: 'pending',
    });

    logger.info('[BillSplit] Created bill split', {
      orderId,
      splitCount: body.splits.length,
      totalAmount,
    });

    return res.status(201).json({ success: true, data: billSplit });
  } catch (err) {
    next(err);
  }
});

// GET /orders/:id/splits — Get split details for an order
app.get('/orders/:id/splits', requireOrderAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orderId = String(req.params['id'] ?? '');

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({ success: false, message: 'Invalid order id' });
    }

    const billSplit = await BillSplit.findOne({ orderId });
    if (!billSplit) {
      return res.status(404).json({ success: false, message: 'No bill split found for this order' });
    }

    return res.json({ success: true, data: billSplit });
  } catch (err) {
    next(err);
  }
});

// PATCH /orders/:id/splits/:personId/settle — Mark a person's share as settled
app.patch('/orders/:id/splits/:personId/settle', requireOrderAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: orderId, personId } = req.params;

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({ success: false, message: 'Invalid order id' });
    }

    const billSplit = await BillSplit.findOne({ orderId });
    if (!billSplit) {
      return res.status(404).json({ success: false, message: 'No bill split found for this order' });
    }

    // Find and update the split
    const splitIndex = billSplit.splits.findIndex((s) => s.personId === personId);
    if (splitIndex === -1) {
      return res.status(404).json({ success: false, message: 'Person not found in bill split' });
    }

    billSplit.splits[splitIndex].settled = true;
    billSplit.splits[splitIndex].settledAt = new Date();

    // Update overall status
    const allSettled = billSplit.splits.every((s) => s.settled);
    const anySettled = billSplit.splits.some((s) => s.settled);
    billSplit.status = allSettled ? 'settled' : anySettled ? 'partial' : 'pending';

    await billSplit.save();

    logger.info('[BillSplit] Settled split', {
      orderId,
      personId,
      remaining: billSplit.splits.filter((s) => !s.settled).length,
    });

    return res.json({ success: true, data: billSplit });
  } catch (err) {
    next(err);
  }
});

// GET /orders/:id/splits/summary — Get per-person amount summary
app.get('/orders/:id/splits/summary', requireOrderAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orderId = String(req.params['id'] ?? '');

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({ success: false, message: 'Invalid order id' });
    }

    const billSplit = await BillSplit.findOne({ orderId });
    if (!billSplit) {
      return res.status(404).json({ success: false, message: 'No bill split found for this order' });
    }

    // Return simplified per-person summary
    const summary = {
      orderId,
      totalAmount: billSplit.totalAmount,
      splitCount: billSplit.splits.length,
      status: billSplit.status,
      perPerson: billSplit.splits.map((s) => ({
        personId: s.personId,
        personName: s.personName,
        amount: s.amount,
        sharePercent: s.sharePercent,
        settled: s.settled,
        settledAt: s.settledAt,
      })),
      remaining: billSplit.splits.filter((s) => !s.settled).length,
      settledAmount: billSplit.splits.filter((s) => s.settled).reduce((sum, s) => sum + s.amount, 0),
    };

    return res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
});

// ── Error handler ─────────────────────────────────────────────────────────────
// BR-M5 fix: Guard Sentry handler with SENTRY_DSN check — matches pattern in
// rez-finance-service:127 and rez-merchant-service:211.
if (process.env.SENTRY_DSN && Sentry) {
  // @sentry/node v8 uses expressErrorHandler instead of Handlers.errorHandler()
  app.use(Sentry.expressErrorHandler());
}

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('[HTTP] Unhandled error', { message: err.message, stack: err.stack });
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ── Server factory ────────────────────────────────────────────────────────────

/**
 * Creates and starts the HTTP server for the order service.
 * Mounts Express with all order endpoints, SSE streams, and health checks.
 * @param port - The port number to listen on
 * @returns The HTTP server instance
 */
export function startHttpServer(port: number): http.Server {
  const server = http.createServer(app);
  server.listen(port, () => {
    logger.info(`[HTTP] Order service listening on port ${port}`);
  });
  return server;
}
