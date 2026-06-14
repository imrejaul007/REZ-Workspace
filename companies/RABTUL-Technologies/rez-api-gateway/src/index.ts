/**
 * REZ API Gateway
 *
 * Central entry point for all external API requests.
 * Implements circuit breaker pattern for downstream service protection.
 */

import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { z } from 'zod';

import { applySecurityHeaders, rateLimitMiddleware, requireAdmin } from './shared/authMiddleware';
import {
  circuitBreaker,
  getCircuitBreaker,
  getCircuitStates,
  circuitHealthMiddleware,
  resetCircuit,
  CircuitOpenError,
} from './utils/circuitBreaker';
import { logger } from './config/logger';

// Route imports
import financeRoutes from './routes/finance/rtmnFinanceRoutes';
import integrationsRoutes from './routes/integrations/index';
import adminAnalyticsRoutes from './routes/admin/analyticsRoutes';
import auditRoutes from './routes/admin/auditRoutes';

// Loyalty route imports
import loyaltyRoutes from './routes/loyalty.routes';
import rezScoreRoutes from './routes/rezScore.routes';
import streakRoutes from './routes/streak.routes';
import crossMerchantRoutes from './routes/crossMerchant.routes';
import decisionRoutes from './routes/decision.routes';

// ============================================
// CONFIGURATION
// ============================================

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Service URLs
const SERVICE_URLS = {
  payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:4001',
  order: process.env.ORDER_SERVICE_URL || 'http://localhost:4006',
  catalog: process.env.CATALOG_SERVICE_URL || 'http://localhost:4007',
  hotel: process.env.HOTEL_SERVICE_URL || 'http://localhost:4015',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4011',
  wallet: process.env.WALLET_SERVICE_URL || 'http://localhost:4004',
};

// ============================================
// INITIALIZE CIRCUIT BREAKERS
// ============================================

// Initialize circuit breakers for all downstream services
const SERVICE_CIRCUITS = [
  { name: 'payment-service', config: { threshold: 5, timeout: 60000 } },
  { name: 'order-service', config: { threshold: 5, timeout: 60000 } },
  { name: 'catalog-service', config: { threshold: 3, timeout: 30000 } },
  { name: 'hotel-service', config: { threshold: 5, timeout: 60000 } },
  { name: 'notification-service', config: { threshold: 3, timeout: 30000 } },
  { name: 'wallet-service', config: { threshold: 5, timeout: 60000 } },
  { name: 'makcorps-external', config: { threshold: 3, timeout: 45000 } },
  { name: 'nextabizz-external', config: { threshold: 3, timeout: 45000 } },
  // Loyalty service circuit breakers
  { name: 'profile-aggregator', config: { threshold: 5, timeout: 30000 } },    // Port 4025
  { name: 'rez-score-service', config: { threshold: 5, timeout: 30000 } },     // Port 4026
  { name: 'streak-service', config: { threshold: 5, timeout: 30000 } },        // Port 4027
  { name: 'cross-merchant-service', config: { threshold: 5, timeout: 30000 } }, // Port 4028
  { name: 'decision-service', config: { threshold: 5, timeout: 30000 } },      // Port 4029
];

SERVICE_CIRCUITS.forEach(({ name, config }) => {
  getCircuitBreaker({
    serviceName: name,
    config,
    onStateChange: (svc, from, to) => {
      logger.info('[Gateway] Circuit state change', { service: svc, from, to });
    },
    onFailure: (svc, err, latency) => {
      logger.warn('[Gateway] Circuit failure', { service: svc, error: err.message, latency });
    },
    onSuccess: (svc, latency) => {
      logger.debug('[Gateway] Circuit success', { service: svc, latency });
    },
  });
});

// ============================================
// APP SETUP
// ============================================

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://www.googletagmanager.com"],
      connectSrc: ["'self'", "https://www.google-analytics.com"],
    },
  },
}));

app.use(applySecurityHeaders);

// CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:4000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Company-Id', 'X-User-Id', 'X-Request-Id'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info('[Gateway] Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Rate limiting
app.use(rateLimitMiddleware({
  windowMs: 60000, // 1 minute
  max: 100,
}));

// ============================================
// HEALTH ENDPOINTS
// ============================================

/**
 * Basic health check
 */
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
  });
});

/**
 * Circuit breaker health endpoint
 * GET /admin/circuits
 */
app.get('/admin/circuits', circuitHealthMiddleware);

/**
 * Reset specific circuit
 * POST /admin/circuits/:serviceName/reset
 * SECURITY: Requires admin authentication
 */
app.post('/admin/circuits/:serviceName/reset', requireAdmin, (req: Request, res: Response) => {
  const { serviceName } = req.params;

  if (resetCircuit(serviceName)) {
    logger.info('[Gateway] Circuit reset', { service: serviceName });
    res.json({ success: true, message: `Circuit for ${serviceName} has been reset` });
  } else {
    res.status(404).json({ success: false, message: `Circuit for ${serviceName} not found` });
  }
});

// ============================================
// SERVICE PROXY ROUTES WITH CIRCUIT BREAKER
// ============================================

/**
 * Payment Service Proxy with Circuit Breaker
 */
const paymentProxySchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default('INR'),
  paymentMethod: z.enum(['upi', 'netbanking', 'card', 'wallet']),
  metadata: z.record(z.any()).optional(),
});

app.post('/api/payments', async (req: Request, res: Response) => {
  try {
    const validation = paymentProxySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ success: false, message: validation.error.errors[0].message });
    }

    const result = await circuitBreaker(
      'payment-service',
      async () => {
        const response = await fetch(`${SERVICE_URLS.payment}/api/payments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Company-Id': req.headers['x-company-id'] as string,
            'X-User-Id': req.headers['x-user-id'] as string,
          },
          body: JSON.stringify(validation.data),
        });

        if (!response.ok) {
          throw new Error(`Payment service error: ${response.status}`);
        }

        return response.json();
      }
    );

    res.json(result);
  } catch (error) {
    if (error instanceof CircuitOpenError) {
      res.setHeader('Retry-After', String(Math.ceil(error.retryAfter / 1000)));
      return res.status(503).json({
        success: false,
        error: 'Payment service temporarily unavailable',
        circuitState: error.circuitState,
        retryAfterMs: error.retryAfter,
      });
    }

    const message = error instanceof Error ? error.message : 'Payment processing failed';
    logger.error('[Gateway] Payment failed', { error: message });
    res.status(500).json({ success: false, message });
  }
});

/**
 * Order Service Proxy with Circuit Breaker
 */
const orderProxySchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().positive(),
    price: z.number().positive(),
  })),
  shippingAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    pincode: z.string(),
  }).optional(),
});

app.post('/api/orders', async (req: Request, res: Response) => {
  try {
    const validation = orderProxySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ success: false, message: validation.error.errors[0].message });
    }

    const result = await circuitBreaker(
      'order-service',
      async () => {
        const response = await fetch(`${SERVICE_URLS.order}/api/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Company-Id': req.headers['x-company-id'] as string,
            'X-User-Id': req.headers['x-user-id'] as string,
          },
          body: JSON.stringify(validation.data),
        });

        if (!response.ok) {
          throw new Error(`Order service error: ${response.status}`);
        }

        return response.json();
      }
    );

    res.status(201).json(result);
  } catch (error) {
    if (error instanceof CircuitOpenError) {
      res.setHeader('Retry-After', String(Math.ceil(error.retryAfter / 1000)));
      return res.status(503).json({
        success: false,
        error: 'Order service temporarily unavailable',
        circuitState: error.circuitState,
        retryAfterMs: error.retryAfter,
      });
    }

    const message = error instanceof Error ? error.message : 'Order creation failed';
    logger.error('[Gateway] Order failed', { error: message });
    res.status(500).json({ success: false, message });
  }
});

app.get('/api/orders', async (req: Request, res: Response) => {
  try {
    const result = await circuitBreaker(
      'order-service',
      async () => {
        const response = await fetch(`${SERVICE_URLS.order}/api/orders`, {
          headers: {
            'X-Company-Id': req.headers['x-company-id'] as string,
            'X-User-Id': req.headers['x-user-id'] as string,
          },
        });

        if (!response.ok) {
          throw new Error(`Order service error: ${response.status}`);
        }

        return response.json();
      }
    );

    res.json(result);
  } catch (error) {
    if (error instanceof CircuitOpenError) {
      res.setHeader('Retry-After', String(Math.ceil(error.retryAfter / 1000)));
      return res.status(503).json({
        success: false,
        error: 'Order service temporarily unavailable',
        circuitState: error.circuitState,
        retryAfterMs: error.retryAfter,
      });
    }

    const message = error instanceof Error ? error.message : 'Failed to fetch orders';
    logger.error('[Gateway] Get orders failed', { error: message });
    res.status(500).json({ success: false, message });
  }
});

/**
 * Catalog Service Proxy with Circuit Breaker
 */
app.get('/api/catalog/products', async (req: Request, res: Response) => {
  try {
    const { category, search, page = '1', limit = '20' } = req.query;

    const result = await circuitBreaker(
      'catalog-service',
      async () => {
        const params = new URLSearchParams({ page: page as string, limit: limit as string });
        if (category) params.set('category', category as string);
        if (search) params.set('search', search as string);

        const response = await fetch(`${SERVICE_URLS.catalog}/api/products?${params}`, {
          headers: {
            'X-Company-Id': req.headers['x-company-id'] as string,
          },
        });

        if (!response.ok) {
          throw new Error(`Catalog service error: ${response.status}`);
        }

        return response.json();
      }
    );

    res.json(result);
  } catch (error) {
    if (error instanceof CircuitOpenError) {
      res.setHeader('Retry-After', String(Math.ceil(error.retryAfter / 1000)));
      return res.status(503).json({
        success: false,
        error: 'Catalog service temporarily unavailable',
        circuitState: error.circuitState,
        retryAfterMs: error.retryAfter,
      });
    }

    const message = error instanceof Error ? error.message : 'Failed to fetch products';
    logger.error('[Gateway] Catalog failed', { error: message });
    res.status(500).json({ success: false, message });
  }
});

/**
 * Hotel Service Proxy with Circuit Breaker
 */
app.get('/api/hotels/search', async (req: Request, res: Response) => {
  try {
    const { location, checkIn, checkOut, guests = '1', rooms = '1' } = req.query;

    const result = await circuitBreaker(
      'hotel-service',
      async () => {
        const params = new URLSearchParams({
          location: location as string,
          checkIn: checkIn as string,
          checkOut: checkOut as string,
          guests: guests as string,
          rooms: rooms as string,
        });

        const response = await fetch(`${SERVICE_URLS.hotel}/api/hotels/search?${params}`, {
          headers: {
            'X-Company-Id': req.headers['x-company-id'] as string,
            'X-User-Id': req.headers['x-user-id'] as string,
          },
        });

        if (!response.ok) {
          throw new Error(`Hotel service error: ${response.status}`);
        }

        return response.json();
      }
    );

    res.json(result);
  } catch (error) {
    if (error instanceof CircuitOpenError) {
      res.setHeader('Retry-After', String(Math.ceil(error.retryAfter / 1000)));
      return res.status(503).json({
        success: false,
        error: 'Hotel service temporarily unavailable',
        circuitState: error.circuitState,
        retryAfterMs: error.retryAfter,
      });
    }

    const message = error instanceof Error ? error.message : 'Hotel search failed';
    logger.error('[Gateway] Hotel search failed', { error: message });
    res.status(500).json({ success: false, message });
  }
});

/**
 * Wallet Service Proxy with Circuit Breaker
 */
app.get('/api/wallet/balance', async (req: Request, res: Response) => {
  try {
    const result = await circuitBreaker(
      'wallet-service',
      async () => {
        const response = await fetch(`${SERVICE_URLS.wallet}/api/balance`, {
          headers: {
            'X-Company-Id': req.headers['x-company-id'] as string,
            'X-User-Id': req.headers['x-user-id'] as string,
            'Authorization': req.headers.authorization,
          },
        });

        if (!response.ok) {
          throw new Error(`Wallet service error: ${response.status}`);
        }

        return response.json();
      }
    );

    res.json(result);
  } catch (error) {
    if (error instanceof CircuitOpenError) {
      res.setHeader('Retry-After', String(Math.ceil(error.retryAfter / 1000)));
      return res.status(503).json({
        success: false,
        error: 'Wallet service temporarily unavailable',
        circuitState: error.circuitState,
        retryAfterMs: error.retryAfter,
      });
    }

    const message = error instanceof Error ? error.message : 'Failed to fetch wallet balance';
    logger.error('[Gateway] Wallet balance failed', { error: message });
    res.status(500).json({ success: false, message });
  }
});

/**
 * Notification Service Proxy with Circuit Breaker
 */
const notificationSchema = z.object({
  type: z.enum(['email', 'sms', 'push', 'whatsapp']),
  recipient: z.string(),
  template: z.string(),
  data: z.record(z.any()),
});

app.post('/api/notifications', async (req: Request, res: Response) => {
  try {
    const validation = notificationSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ success: false, message: validation.error.errors[0].message });
    }

    const result = await circuitBreaker(
      'notification-service',
      async () => {
        const response = await fetch(`${SERVICE_URLS.notification}/api/notifications`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Company-Id': req.headers['x-company-id'] as string,
          },
          body: JSON.stringify(validation.data),
        });

        if (!response.ok) {
          throw new Error(`Notification service error: ${response.status}`);
        }

        return response.json();
      }
    );

    res.status(202).json(result);
  } catch (error) {
    if (error instanceof CircuitOpenError) {
      res.setHeader('Retry-After', String(Math.ceil(error.retryAfter / 1000)));
      return res.status(503).json({
        success: false,
        error: 'Notification service temporarily unavailable',
        circuitState: error.circuitState,
        retryAfterMs: error.retryAfter,
      });
    }

    const message = error instanceof Error ? error.message : 'Notification failed';
    logger.error('[Gateway] Notification failed', { error: message });
    res.status(500).json({ success: false, message });
  }
});

// ============================================
// INTEGRATION ROUTES WITH CIRCUIT BREAKER
// ============================================

/**
 * Makcorps External API Proxy with Circuit Breaker
 */
app.get('/api/integrations/makcorps/hotels', async (req: Request, res: Response) => {
  try {
    const { destination, checkIn, checkOut } = req.query;

    const result = await circuitBreaker(
      'makcorps-external',
      async () => {
        const params = new URLSearchParams({
          destination: destination as string,
          check_in: checkIn as string,
          check_out: checkOut as string,
        });

        const response = await fetch(`https://api.makcorps.com/hotels/search?${params}`, {
          headers: {
            'Authorization': `Bearer ${process.env.MAKCORPS_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Makcorps API error: ${response.status}`);
        }

        return response.json();
      }
    );

    res.json(result);
  } catch (error) {
    if (error instanceof CircuitOpenError) {
      res.setHeader('Retry-After', String(Math.ceil(error.retryAfter / 1000)));
      return res.status(503).json({
        success: false,
        error: 'Hotel booking service temporarily unavailable',
        service: 'makcorps',
        circuitState: error.circuitState,
        retryAfterMs: error.retryAfter,
      });
    }

    const message = error instanceof Error ? error.message : 'Hotel search failed';
    logger.error('[Gateway] Makcorps search failed', { error: message });
    res.status(500).json({ success: false, message });
  }
});

/**
 * NextaBizz External API Proxy with Circuit Breaker
 */
app.get('/api/integrations/nextabizz/products', async (req: Request, res: Response) => {
  try {
    const { category, minPrice, maxPrice } = req.query;

    const result = await circuitBreaker(
      'nextabizz-external',
      async () => {
        const params = new URLSearchParams();
        if (category) params.set('category', category as string);
        if (minPrice) params.set('min_price', minPrice as string);
        if (maxPrice) params.set('max_price', maxPrice as string);

        const response = await fetch(`https://api.nextabizz.com/products?${params}`, {
          headers: {
            'Authorization': `Bearer ${process.env.NEXTABIZZ_ACCESS_TOKEN}`,
            'X-Company-Id': req.headers['x-company-id'] as string,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`NextaBizz API error: ${response.status}`);
        }

        return response.json();
      }
    );

    res.json(result);
  } catch (error) {
    if (error instanceof CircuitOpenError) {
      res.setHeader('Retry-After', String(Math.ceil(error.retryAfter / 1000)));
      return res.status(503).json({
        success: false,
        error: 'Product catalog temporarily unavailable',
        service: 'nextabizz',
        circuitState: error.circuitState,
        retryAfterMs: error.retryAfter,
      });
    }

    const message = error instanceof Error ? error.message : 'Failed to fetch products';
    logger.error('[Gateway] NextaBizz search failed', { error: message });
    res.status(500).json({ success: false, message });
  }
});

// ============================================
// MOUNT ROUTES
// ============================================

app.use('/api/finance', financeRoutes);
app.use('/api/integrations', integrationsRoutes);

// Mount admin analytics routes with stricter rate limiting
app.use('/admin/analytics', adminAnalyticsRoutes);

// Mount audit routes
app.use('/admin', auditRoutes);

// ============================================
// LOYALTY ROUTES WITH RATE LIMITING
// ============================================

// Apply rate limiting middleware for loyalty routes
const profileRateLimiter = rateLimitMiddleware({
  windowMs: 60000, // 1 minute
  max: 100, // 100 requests per minute for profile endpoints
});

const scoreRateLimiter = rateLimitMiddleware({
  windowMs: 60000, // 1 minute
  max: 200, // 200 requests per minute for score endpoints
});

const decisionRateLimiter = rateLimitMiddleware({
  windowMs: 60000, // 1 minute
  max: 500, // 500 requests per minute for decision endpoints
});

// Mount loyalty routes
app.use('/api/v1/loyalty', profileRateLimiter, loyaltyRoutes);
app.use('/api/v1/score', scoreRateLimiter, rezScoreRoutes);
app.use('/api/v1/streak', profileRateLimiter, streakRoutes);
app.use('/api/v1/cross-merchant', profileRateLimiter, crossMerchantRoutes);
app.use('/api/v1/decisions', decisionRateLimiter, decisionRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('[Gateway] Unhandled error', {
    error: err.message,
    stack: err.stack,
  });

  res.status(500).json({
    success: false,
    message: NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// ============================================
// START SERVER
// ============================================

const server = app.listen(PORT, () => {
  logger.info('[Gateway] Server started', {
    port: PORT,
    env: NODE_ENV,
    circuits: SERVICE_CIRCUITS.map(c => c.name).join(', '),
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('[Gateway] SIGTERM received, shutting down gracefully');

  server.close(() => {
    logger.info('[Gateway] Server closed');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('[Gateway] Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
});

process.on('SIGINT', () => {
  logger.info('[Gateway] SIGINT received, shutting down');
  server.close();
  process.exit(0);
});

export default app;
