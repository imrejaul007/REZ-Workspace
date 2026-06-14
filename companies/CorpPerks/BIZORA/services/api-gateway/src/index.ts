import { logger } from ;
/**
 * BIZORA API Gateway
 * Single entry point for all services
 * Handles: Routing, Rate Limiting, Auth, Logging, CORS
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import Redis from 'redis';

// ============================================================================
// Configuration
// ============================================================================

const PORT = parseInt(process.env.PORT || '4000', 10);
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Service URLs
const SERVICES: Record<string, { url: string; auth?: boolean; rateLimit?: number }> = {
  // Core Services
  'auth': { url: 'http://localhost:4001', auth: false, rateLimit: 10 },
  'chat': { url: 'http://localhost:4002', rateLimit: 60 },
  'marketplace': { url: 'http://localhost:4003', rateLimit: 100 },
  'taxflow': { url: 'http://localhost:4004', rateLimit: 100 },
  'invoiceflow': { url: 'http://localhost:4005', rateLimit: 100 },

  // Vertical SaaS
  'restaurant': { url: 'http://localhost:4010', rateLimit: 100 },
  'salon': { url: 'http://localhost:4011', rateLimit: 100 },
  'hotel': { url: 'http://localhost:4012', rateLimit: 100 },
  'people': { url: 'http://localhost:4013', rateLimit: 100 },

  // AI Services
  'vendor': { url: 'http://localhost:4020', rateLimit: 60 },
  'advisor': { url: 'http://localhost:4021', rateLimit: 60 },
  'finance': { url: 'http://localhost:4022', rateLimit: 100 },

  // Infrastructure
  'dashboard': { url: 'http://localhost:4030', rateLimit: 100 },
  'whatsapp': { url: 'http://localhost:4035', rateLimit: 50 },
  'payment': { url: 'http://localhost:4036', rateLimit: 50 },
  'notification': { url: 'http://localhost:4037', rateLimit: 100 },
};

// ============================================================================
// Rate Limiter
// ============================================================================

let rateLimiter: RateLimiterRedis | null = null;

async function initRateLimiter() {
  try {
    const redisClient = Redis.createClient({ url: REDIS_URL });
    await redisClient.connect();

    rateLimiter = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'gateway_rl',
      limiter: RateLimiterRedis.fixedWindow,
      points: 100,
      duration: 60,
    });

    logger.info('[RateLimiter] Connected to Redis');
  } catch (error) {
    logger.warn('[RateLimiter] Redis not available, using in-memory fallback');
  }
}

async function checkRateLimit(ip: string, limit: number): Promise<boolean> {
  if (!rateLimiter) return true;

  try {
    await rateLimiter.consume(ip, 1);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Express App
// ============================================================================

const app = express();

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-ID'],
}));

app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  const start = Date.now();
  _res.on('finish', () => {
    logger.info(`[${new Date().toISOString()}] ${req.method} ${req.path} ${_res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'api-gateway',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    services: Object.keys(SERVICES).length,
  });
});

// Service status
app.get('/services', (_req: Request, res: Response) => {
  const serviceList = Object.entries(SERVICES).map(([name, config]) => ({
    name,
    url: config.url,
    auth: config.auth || false,
    rateLimit: config.rateLimit || 100,
  }));
  res.json({ services: serviceList });
});

// ============================================================================
// Service Proxy Routes
// ============================================================================

for (const [service, config] of Object.entries(SERVICES)) {
  const rateLimit = config.rateLimit || 100;

  app.use(
    `/${service}`,
    async (req: Request, res: Response, next: NextFunction) => {
      // Rate limiting
      const ip = req.ip || 'unknown';
      const allowed = await checkRateLimit(ip, rateLimit);
      if (!allowed) {
        return res.status(429).json({
          error: 'Too many requests',
          code: 'RATE_LIMITED',
          retryAfter: 60,
        });
      }
      next();
    },
    createProxyMiddleware({
      target: config.url,
      changeOrigin: true,
      pathRewrite: { [`^/${service}`]: '' },
      onProxyReq: (proxyReq, req) => {
        // Forward headers
        proxyReq.setHeader('X-Forwarded-For', req.ip);
        proxyReq.setHeader('X-Forwarded-Proto', req.protocol);
        proxyReq.setHeader('X-Gateway', 'bizora-gateway');
      },
      onError: (err, _req, res) => {
        logger.error(`[Gateway] Proxy error for ${service}:`, err.message);
        res.status(502).json({ error: 'Service unavailable', code: 'SERVICE_UNAVAILABLE' });
      },
    })
  );
}

// API prefix routes (shorter URLs)
const API_ROUTES: Record<string, string> = {
  'api/auth': 'auth',
  'api/chat': 'chat',
  'api/marketplace': 'marketplace',
  'api/tax': 'taxflow',
  'api/invoice': 'invoiceflow',
  'api/restaurant': 'restaurant',
  'api/salon': 'salon',
  'api/hotel': 'hotel',
  'api/people': 'people',
  'api/vendor': 'vendor',
  'api/advisor': 'advisor',
  'api/finance': 'finance',
  'api/payment': 'payment',
  'api/notification': 'notification',
};

for (const [route, service] of Object.entries(API_ROUTES)) {
  const config = SERVICES[service];
  if (!config) continue;

  app.use(
    `/${route}`,
    async (req: Request, res: Response, next: NextFunction) => {
      const ip = req.ip || 'unknown';
      const allowed = await checkRateLimit(ip, config.rateLimit || 100);
      if (!allowed) {
        return res.status(429).json({
          error: 'Too many requests',
          code: 'RATE_LIMITED',
        });
      }
      next();
    },
    createProxyMiddleware({
      target: config.url,
      changeOrigin: true,
      pathRewrite: { [`^/${route}`]: '' },
      onProxyReq: (proxyReq, req) => {
        proxyReq.setHeader('X-Forwarded-For', req.ip);
        proxyReq.setHeader('X-Gateway', 'bizora-gateway');
      },
    })
  );
}

// ============================================================================
// Error Handler
// ============================================================================

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('[Gateway] Error:', err);
  res.status(500).json({
    error: 'Internal gateway error',
    code: 'GATEWAY_ERROR',
  });
});

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Service not found',
    code: 'NOT_FOUND',
    available: Object.keys(SERVICES),
  });
});

// ============================================================================
// Start
// ============================================================================

async function start() {
  await initRateLimiter();

  app.listen(PORT, () => {
    logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🌐 BIZORA API Gateway                                ║
║   Single entry point for all services                   ║
║                                                           ║
║   Port: ${PORT}                                             ║
║   Services: ${Object.keys(SERVICES).length}                                        ║
║   RateLimiter: ${rateLimiter ? 'Redis' : 'In-Memory'}                            ║
║                                                           ║
║   Routes:                                                 ║
║   • /auth → Auth Service (4001)                          ║
║   • /chat → Chat Service (4002)                          ║
║   • /marketplace → Marketplace (4003)                    ║
║   • /tax → TaxFlow (4004)                               ║
║   • /invoice → InvoiceFlow (4005)                       ║
║   • /restaurant → RestaurantOS (4010)                     ║
║   • /salon → SalonOS (4011)                            ║
║   • /hotel → HotelOS (4012)                              ║
║   • /people → PeopleOS (4013)                            ║
║   • /vendor → VendorMatch (4020)                        ║
║   • /advisor → Advisor (4021)                           ║
║   • /finance → Finance (4022)                           ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
  });
}

start().catch(console.error);
