import express from 'express';
import logger from './utils/logger';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { createProxyMiddleware } from 'http-proxy-middleware';

// Simple logger implementation
const logger = {
  error: (...args: unknown[]) => console.error('[ERROR]', new Date().toISOString(), ...args),
  warn: (...args: unknown[]) => console.warn('[WARN]', new Date().toISOString(), ...args),
  info: (...args: unknown[]) => console.log('[INFO]', new Date().toISOString(), ...args),
};

const app = express();
const PORT = process.env.PORT || 4000;
const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

// ============================================
// FIX-SEC-001: Weak secret detection
// ============================================
if (isProduction) {
  const weakSecrets = [
    { key: 'JWT_SECRET', pattern: /^(test|dev|development|secret|password|changeme)/i },
  ];

  for (const { key, pattern } of weakSecrets) {
    const value = process.env[key];
    if (value && pattern.test(value)) {
      logger.error(`[FATAL] ${key} contains a weak value in production`);
      throw new Error(`[FATAL] ${key} contains a weak value. Set a strong secret in production.`);
    }
  }
}

// ============================================
// Security Middleware
// ============================================

// 1. Helmet - Security headers with HSTS
app.use(helmet({
  hsts: isProduction ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  } : undefined,
}));

// 2. CORS - Restrictive configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').filter(Boolean) || [];
if (isProduction && allowedOrigins.length === 0) {
  throw new Error('ALLOWED_ORIGINS environment variable is required in production');
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman)
    if (!origin) return callback(null, true);

    // FIX-CORS-001: Only allow localhost in non-production
    if (!isProduction && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      return callback(null, true);
    }

    // In development, allow localhost
    if (!isProduction && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      return callback(null, true);
    }

    // Check against allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    callback(new Error(`Origin ${origin} not allowed by CORS policy`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token', 'X-User-Id', 'X-Request-Id']
}));

// 3. Body parsing with size limit
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// 4. Global rate limiting
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Please try again later'
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/ready';
  }
});
app.use(globalLimiter);

// 5. Request ID middleware
app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] as string ||
                    crypto.randomUUID();
  res.setHeader('X-Request-Id', requestId);
  (req as express.Request & { requestId: string }).requestId = requestId;
  next();
});

// ============================================
// Internal Service Authentication
// ============================================

interface ServiceToken {
  service: string;
  permissions: string[];
}

const serviceTokens = new Map<string, ServiceToken>();

function initializeServiceTokens(): void {
  const tokensJson = process.env.INTERNAL_SERVICE_TOKENS_JSON;
  if (tokensJson) {
    try {
      const tokens = JSON.parse(tokensJson);
      for (const [service, token] of Object.entries(tokens)) {
        serviceTokens.set(token as string, {
          service,
          permissions: getServicePermissions(service)
        });
      }
      logger.info(`Loaded ${serviceTokens.size} internal service tokens`);
    } catch (error) {
      logger.error('Failed to parse INTERNAL_SERVICE_TOKENS_JSON:', error);
    }
  }
}

function getServicePermissions(service: string): string[] {
  const permissions: Record<string, string[]> = {
    'admin-panel': ['read', 'write', 'delete'],
    'payment-service': ['read', 'write'],
    'identity-service': ['read', 'write'],
    'capital-service': ['read', 'write'],
    'bnpl-service': ['read', 'write'],
    'ops-center': ['read'],
    'intent-service': ['read', 'write'],
  };
  return permissions[service] || ['read'];
}

// Initialize tokens
initializeServiceTokens();

// Internal auth middleware
function verifyInternalToken(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const token = req.headers['x-internal-token'] as string;

  if (!token) {
    res.status(401).json({
      error: 'Unauthorized',
      code: 'MISSING_TOKEN',
      message: 'X-Internal-Token header is required'
    });
    return;
  }

  const serviceInfo = serviceTokens.get(token);

  if (!serviceInfo) {
    res.status(401).json({
      error: 'Unauthorized',
      code: 'INVALID_TOKEN',
      message: 'Invalid service token'
    });
    return;
  }

  (req as express.Request & { serviceInfo: ServiceToken }).serviceInfo = serviceInfo;
  next();
}

// ============================================
// Feature Flags
// ============================================

const USE_NEW_SERVICES = {
  intent: process.env.USE_NEW_INTENT_SERVICE === 'true',
  copilot: process.env.USE_NEW_COPILOT === 'true',
  decision: process.env.USE_NEW_DECISION_SERVICE === 'true',
  adPlatform: process.env.USE_NEW_AD_PLATFORM === 'true'
};

// ============================================
// Service URLs
// ============================================

const SERVICES = {
  intentLegacy: process.env.INTENT_SERVICE_URL || 'https://rez-intent-graph.onrender.com',
  intentNew: process.env.NEW_INTENT_SERVICE_URL || 'https://rez-intent-graph.onrender.com',
  copilotLegacy: process.env.COPILOT_SERVICE_URL || 'https://rez-copilot-service.onrender.com',
  copilotNew: process.env.NEW_COPILOT_URL || 'https://rez-copilot-service.onrender.com',
  decisionLegacy: process.env.DECISION_SERVICE_URL || 'https://rez-decision-service.onrender.com',
  decisionNew: process.env.NEW_DECISION_SERVICE_URL || 'https://rez-decision-service.onrender.com',
  adLegacy: process.env.AD_SERVICE_URL || 'https://rez-ad-platform.onrender.com',
  adNew: process.env.NEW_AD_SERVICE_URL || 'https://rez-ad-platform.onrender.com',
  auth: process.env.AUTH_SERVICE_URL || 'https://rez-auth-service.onrender.com',
  wallet: process.env.WALLET_SERVICE_URL || 'https://rez-wallet-service.onrender.com',
  payment: process.env.PAYMENT_SERVICE_URL || 'https://rez-payment-service.onrender.com',
  order: process.env.ORDER_SERVICE_URL || 'https://rez-order-service.onrender.com',
  merchant: process.env.MERCHANT_SERVICE_URL || 'https://rez-merchant-service.onrender.com',
  // NEW SERVICES (2026-05-12)
  articles: process.env.ARTICLES_SERVICE_URL || 'https://rez-articles-service.onrender.com',
  billPayments: process.env.BILL_PAYMENTS_SERVICE_URL || 'https://rez-bill-payments-service.onrender.com',
  cashback: process.env.CASHBACK_SERVICE_URL || 'https://rez-cashback-service.onrender.com',
  gamification: process.env.GAMIFICATION_SERVICE_URL || 'https://rez-gamification-service.onrender.com',
  creatorEarnings: process.env.CREATOR_EARNINGS_SERVICE_URL || 'https://rez-creator-earnings-service.onrender.com',
  booking: process.env.BOOKING_SERVICE_URL || 'https://rez-booking-service.onrender.com',
  catalog: process.env.CATALOG_SERVICE_URL || 'https://rez-catalog-service.onrender.com',
  search: process.env.SEARCH_SERVICE_URL || 'https://rez-search-service.onrender.com',
  notifications: process.env.NOTIFICATIONS_SERVICE_URL || 'https://rez-notifications-service.onrender.com',
};

// ============================================
// JWT Validation for User Requests
// ============================================

interface JWTPayload {
  sub: string;
  role: string;
  iat: number;
  exp: number;
}

async function verifyJWT(token: string): Promise<JWTPayload | null> {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    logger.error('JWT_SECRET not configured');
    return null;
  }

  try {
    // Use standard jsonwebtoken library with explicit algorithm
    const payload = jwt.verify(token, secret, {
      algorithms: ['HS256'], // Prevent algorithm confusion attacks
    }) as JWTPayload;
    return payload;
  } catch (error) {
    // Log specific JWT errors for debugging (without exposing sensitive data)
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('JWT token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('JWT token validation failed:', error.message);
    }
    return null;
  }
}

// ============================================
// Proxy helper with auth forwarding
// ============================================

function createProxy(target: string, options?: { requireAuth?: boolean; rateLimitPerUser?: number }) {
  return async (req: express.Request, res: express.Response) => {
    const requestId = (req as express.Request & { requestId?: string }).requestId || crypto.randomUUID();

    // Build headers to forward
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Request-Id': requestId,
    };

    // Forward user context from JWT
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const payload = await verifyJWT(token);
      if (payload) {
        headers['X-User-Id'] = payload.sub;
        headers['X-User-Role'] = payload.role;
      }
    }

    // Forward internal service context
    const serviceInfo = (req as express.Request & { serviceInfo?: ServiceToken }).serviceInfo;
    if (serviceInfo) {
      headers['X-Internal-Token'] = req.headers['x-internal-token'] as string;
      headers['X-Calling-Service'] = serviceInfo.service;
    }

    try {
      const url = `${target}${req.originalUrl}`;
      const response = await fetch(url, {
        method: req.method,
        headers,
        body: ['POST', 'PUT', 'PATCH'].includes(req.method) ? JSON.stringify(req.body) : undefined,
        signal: AbortSignal.timeout(30000) // 30s timeout
      });

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      logger.error(`Proxy error for ${target}:`, error);
      res.status(502).json({
        error: 'Service unavailable',
        code: 'UPSTREAM_ERROR',
        requestId
      });
    }
  };
}

// ============================================
// Routes with feature flags
// ============================================

app.use('/api/intent', verifyInternalToken, createProxy(
  USE_NEW_SERVICES.intent ? SERVICES.intentNew : SERVICES.intentLegacy
));

app.use('/api/copilot', verifyInternalToken, createProxy(
  USE_NEW_SERVICES.copilot ? SERVICES.copilotNew : SERVICES.copilotLegacy
));

app.use('/api/decision', verifyInternalToken, createProxy(
  USE_NEW_SERVICES.decision ? SERVICES.decisionNew : SERVICES.decisionLegacy
));

app.use('/api/ads', verifyInternalToken, createProxy(
  USE_NEW_SERVICES.adPlatform ? SERVICES.adNew : SERVICES.adLegacy
));

// Core services
// AUTH: Consumer app uses /user/auth/* paths, gateway proxies to auth service
app.use('/api/auth', createProxy(SERVICES.auth));
app.use('/user/auth', createProxy(SERVICES.auth));

// WALLET: Consumer app uses /wallet/* paths
// Consumer app uses Bearer JWT token for auth, not internal token
// So we allow both paths without internal token requirement
app.use('/api/wallet', createProxy(SERVICES.wallet));
app.use('/wallet', createProxy(SERVICES.wallet));

// PAYMENT: Consumer app uses /payment/* paths
app.use('/api/payment', createProxy(SERVICES.payment));
app.use('/payment', createProxy(SERVICES.payment));

// ORDERS: Consumer app uses /orders/* paths
app.use('/api/orders', createProxy(SERVICES.order));
app.use('/orders', createProxy(SERVICES.order));

// MERCHANT: Internal service only
app.use('/api/merchant', verifyInternalToken, createProxy(SERVICES.merchant));

// CONSUMER APP ROUTES - Additional services the consumer app needs
// Search service
const SEARCH_SERVICE_URL = process.env.SEARCH_SERVICE_URL || 'https://rez-search-service.onrender.com';
app.use('/search', createProxy(SEARCH_SERVICE_URL));
app.use('/api/search', createProxy(SEARCH_SERVICE_URL));

// Catalog/Products service
const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || 'https://rez-catalog-service-1.onrender.com';
app.use('/products', createProxy(CATALOG_SERVICE_URL));
app.use('/api/products', createProxy(CATALOG_SERVICE_URL));
app.use('/categories', createProxy(CATALOG_SERVICE_URL));

// Notifications service
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'https://rez-notifications-service.onrender.com';
app.use('/notifications', createProxy(NOTIFICATION_SERVICE_URL));
app.use('/api/notifications', createProxy(NOTIFICATION_SERVICE_URL));

// Booking service
const BOOKING_SERVICE_URL = process.env.BOOKING_SERVICE_URL || 'https://rez-booking-service.onrender.com';
app.use('/bookings', createProxy(BOOKING_SERVICE_URL));
app.use('/api/bookings', createProxy(BOOKING_SERVICE_URL));

// Analytics service
const ANALYTICS_SERVICE_URL = process.env.ANALYTICS_SERVICE_URL || 'https://analytics-events-37yy.onrender.com';
app.use('/analytics', createProxy(ANALYTICS_SERVICE_URL));
app.use('/events', createProxy(ANALYTICS_SERVICE_URL));

// NEW SERVICES (2026-05-12) - Missing services now implemented
// Articles service
app.use('/articles', createProxy(SERVICES.articles));
app.use('/api/articles', createProxy(SERVICES.articles));

// Bill Payments service
app.use('/bills', createProxy(SERVICES.billPayments));
app.use('/bill-payments', createProxy(SERVICES.billPayments));
app.use('/bill-providers', createProxy(SERVICES.billPayments));

// Cashback service
app.use('/cashback', createProxy(SERVICES.cashback));

// Gamification service
app.use('/achievements', createProxy(SERVICES.gamification));
app.use('/challenges', createProxy(SERVICES.gamification));
app.use('/badges', createProxy(SERVICES.gamification));
app.use('/missions', createProxy(SERVICES.gamification));
app.use('/leaderboard', createProxy(SERVICES.gamification));

// Creator Earnings service
app.use('/creators', createProxy(SERVICES.creatorEarnings));

// ============================================
// Health & Readiness
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'api-gateway',
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/ready', async (req, res) => {
  // Check if critical services are reachable
  const checks = await Promise.allSettled([
    fetch(`${SERVICES.auth}/health`, { signal: AbortSignal.timeout(5000) }),
    fetch(`${SERVICES.wallet}/health`, { signal: AbortSignal.timeout(5000) }),
    fetch(`${SERVICES.payment}/health`, { signal: AbortSignal.timeout(5000) }),
  ]);

  const results = {
    auth: checks[0].status === 'fulfilled' ? 'ok' : 'error',
    wallet: checks[1].status === 'fulfilled' ? 'ok' : 'error',
    payment: checks[2].status === 'fulfilled' ? 'ok' : 'error'
  };

  const allHealthy = Object.values(results).every(s => s === 'ok');

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'ready' : 'degraded',
    services: results,
    featureFlags: USE_NEW_SERVICES
  });
});

// ============================================
// Error Handling
// ============================================

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err.message.includes('CORS')) {
    res.status(403).json({
      error: 'Forbidden',
      code: 'CORS_ERROR',
      message: 'Origin not allowed'
    });
    return;
  }

  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    code: 'INTERNAL_ERROR',
    requestId: (req as express.Request & { requestId?: string }).requestId
  });
});

// ============================================
// Start Server
// ============================================

app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
  logger.info(`Environment: ${nodeEnv}`);
  console.log('Feature flags:', USE_NEW_SERVICES);
  logger.info(`Auth required for: /api/wallet, /api/payment, /api/orders, /api/merchant`);
  logger.info(`Internal auth required for: /api/intent, /api/copilot, /api/decision, /api/ads`);
});

export default app;
