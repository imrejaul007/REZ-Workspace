import { logger, corsMiddleware, requestIdMiddleware, requestLoggingMiddleware, createGlobalLimiter, validateRequiredEnvVars } from '../../shared';
// KHAIRMOVE API Gateway - Unified entry point
// Port: 4600

import express from 'express';
import helmet from 'helmet';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { validateAuthEnv } from '../../shared/middleware/auth';

// ============================================
// ENVIRONMENT VALIDATION
// ============================================

// Validate environment in production
if (process.env.NODE_ENV === 'production') {
  validateAuthEnv();
  const result = validateRequiredEnvVars(['PORT', 'CORS_ORIGINS']);
  if (!result.valid) {
    throw new Error(`Environment validation failed: ${result.errors.join(', ')}`);
  }
}

const PORT = parseInt(process.env.PORT || '4600', 10);

// ============================================
// SERVICE URLs
// ============================================

const SERVICES = {
  ride: process.env.RIDE_SERVICE_URL || 'http://localhost:4601',
  fleet: process.env.FLEET_SERVICE_URL || 'http://localhost:4602',
  delivery: process.env.DELIVERY_SERVICE_URL || 'http://localhost:4603',
  logistics: process.env.LOGISTICS_SERVICE_URL || 'http://localhost:4604',
  rental: process.env.RENTAL_SERVICE_URL || 'http://localhost:4605',
  buzzlocal: process.env.BUZZLOCAL_SERVICE_URL || 'http://localhost:4606',
};

// ============================================
// ALLOWED ORIGINS
// ============================================

function getAllowedOrigins(): string[] {
  const origins = process.env.CORS_ORIGINS;
  if (!origins) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CORS_ORIGINS environment variable is required in production');
    }
    return ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'];
  }
  return origins.split(',').map(o => o.trim());
}

// ============================================
// EXPRESS APP
// ============================================

const app = express();

// Request ID middleware (must be first)
app.use(requestIdMiddleware);

// Security middleware - enable all security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", ...getAllowedOrigins()],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: 'same-origin' },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
}));

// CORS - use production-ready configuration
app.use(corsMiddleware);

// Rate limiting - use production-ready limiters
app.use('/api/', createGlobalLimiter());

// Body parsing with size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Request logging
app.use(requestLoggingMiddleware);

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'khaimove-api-gateway',
    timestamp: new Date(),
    version: '1.0.0',
    services: Object.keys(SERVICES),
    requestId: req.requestId,
  });
});

// Readiness probe for Kubernetes
app.get('/health/ready', async (req, res) => {
  const status: Record<string, { status: string; latency?: number; error?: string }> = {};

  for (const [name, url] of Object.entries(SERVICES)) {
    try {
      const start = Date.now();
      const response = await fetch(`${url}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      });
      const latency = Date.now() - start;

      status[name] = {
        status: response.ok ? 'healthy' : 'degraded',
        latency,
      };
    } catch (error) {
      status[name] = {
        status: 'unavailable',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  const allHealthy = Object.values(status).every(s => s.status === 'healthy');

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'ready' : 'not_ready',
    service: 'khaimove-api-gateway',
    timestamp: new Date(),
    dependencies: status,
    requestId: req.requestId,
  });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({
    status: 'alive',
    service: 'khaimove-api-gateway',
    timestamp: new Date(),
    requestId: req.requestId,
  });
});

// ============================================
// SERVICE STATUS
// ============================================

app.get('/api/status', async (req, res) => {
  const status: Record<string, { status: string; latency?: number; error?: string }> = {};

  for (const [name, url] of Object.entries(SERVICES)) {
    try {
      const start = Date.now();
      const response = await fetch(`${url}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      });
      const latency = Date.now() - start;

      status[name] = {
        status: response.ok ? 'healthy' : 'degraded',
        latency,
      };
    } catch (error) {
      status[name] = {
        status: 'unavailable',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  const allHealthy = Object.values(status).every(s => s.status === 'healthy');

  res.json({
    success: true,
    data: {
      overall: allHealthy ? 'healthy' : 'degraded',
      services: status,
      timestamp: new Date(),
    },
  });
});

// ============================================
// PROXY ROUTES
// ============================================

// Helper to create proxy with error handling
const createProxy = (target: string, pathRewrite?: Record<string, string>) => createProxyMiddleware({
  target,
  changeOrigin: true,
  ...(pathRewrite && { pathRewrite }),
  onError: (err, req, res) => {
    logger.error('Proxy error', err, { target, path: req.path });
    res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Service temporarily unavailable',
        requestId: (req as any).requestId,
      },
    });
  },
  onProxyReq: (proxyReq, req) => {
    // Add correlation headers
    proxyReq.setHeader('X-Request-ID', (req as any).requestId);
    proxyReq.setHeader('X-Correlation-ID', (req as any).correlationId);
    // Add internal token for service-to-service calls
    if (process.env.INTERNAL_SERVICE_TOKEN) {
      proxyReq.setHeader('X-Internal-Token', process.env.INTERNAL_SERVICE_TOKEN);
    }
  },
});

// Ride Service Proxy
app.use('/api/rides', createProxy(SERVICES.ride, { '^/api/rides': '/api/rides' }));
app.use('/api/fares', createProxy(SERVICES.ride, { '^/api/fares': '/api/fares' }));
app.use('/api/surge', createProxy(SERVICES.ride, { '^/api/surge': '/api/surge' }));
app.use('/api/drivers', createProxy(SERVICES.ride, { '^/api/drivers': '/api/drivers' }));

// Fleet Service Proxy
app.use('/api/fleets', createProxy(SERVICES.fleet, { '^/api/fleets': '/api/fleets' }));
app.use('/api/vehicles', createProxy(SERVICES.fleet, { '^/api/vehicles': '/api/vehicles' }));
app.use('/api/dispatch', createProxy(SERVICES.fleet));

// Delivery Service Proxy
app.use('/api/deliveries', createProxy(SERVICES.delivery, { '^/api/deliveries': '/api/deliveries' }));
app.use('/api/delivery-drivers', createProxy(SERVICES.delivery, { '^/api/delivery-drivers': '/api/delivery-drivers' }));

// Logistics Service Proxy
app.use('/api/carriers', createProxy(SERVICES.logistics, { '^/api/carriers': '/api/carriers' }));
app.use('/api/rates', createProxy(SERVICES.logistics));
app.use('/api/shipments', createProxy(SERVICES.logistics, { '^/api/shipments': '/api/shipments' }));

// Rental Service Proxy
app.use('/api/packages', createProxy(SERVICES.rental));
app.use('/api/rentals', createProxy(SERVICES.rental, { '^/api/rentals': '/api/rentals' }));

// BuzzLocal Rides Proxy
app.use('/api/pools', createProxy(SERVICES.buzzlocal, { '^/api/pools': '/api/pools' }));
app.use('/api/community', createProxy(SERVICES.buzzlocal, { '^/api/community': '/api/community' }));

// ============================================
// UNIFIED ENDPOINTS
// ============================================

app.get('/api/services', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'KHAIRMOVE',
      tagline: 'Mobility & Logistics Infrastructure',
      version: '1.0.0',
      services: [
        { name: 'Ride', endpoint: '/api/rides', description: 'Ride-hailing with 0% commission' },
        { name: 'Fleet', endpoint: '/api/fleets', description: 'Fleet management and dispatch' },
        { name: 'Delivery', endpoint: '/api/deliveries', description: 'Hyperlocal delivery service' },
        { name: 'Logistics', endpoint: '/api/shipments', description: 'Multi-carrier logistics aggregation' },
        { name: 'Rental', endpoint: '/api/rentals', description: 'Hourly vehicle rentals' },
        { name: 'BuzzLocal', endpoint: '/api/pools', description: 'Community rides and carpooling' },
      ],
      documentation: '/api/docs',
    },
  });
});

app.get('/api/docs', (req, res) => {
  res.json({
    success: true,
    data: {
      title: 'KHAIRMOVE API Documentation',
      version: '1.0.0',
      baseUrl: 'https://api.khaimove.com',
      services: {
        rides: {
          'POST /api/rides': 'Request a new ride',
          'GET /api/rides': 'Get user rides',
          'GET /api/rides/:id': 'Get ride by ID',
          'POST /api/rides/:id/cancel': 'Cancel a ride',
          'POST /api/fares/estimate': 'Estimate fare',
          'GET /api/drivers/nearby': 'Find nearby drivers',
        },
        fleet: {
          'POST /api/fleets': 'Create fleet',
          'GET /api/fleets': 'List fleets',
          'POST /api/dispatch': 'Dispatch vehicle',
        },
        delivery: {
          'POST /api/deliveries': 'Create delivery',
          'GET /api/deliveries': 'List deliveries',
          'POST /api/deliveries/:id/verify-otp': 'Verify OTP',
        },
        logistics: {
          'GET /api/carriers': 'List carriers',
          'POST /api/rates': 'Get shipping rates',
          'POST /api/shipments': 'Create shipment',
          'GET /api/shipments/:id': 'Track shipment',
        },
        rental: {
          'GET /api/packages': 'List packages',
          'POST /api/rentals': 'Create booking',
        },
        buzzlocal: {
          'POST /api/pools': 'Create pool',
          'GET /api/pools': 'Find pools',
        },
      },
      authentication: {
        type: 'Bearer JWT / API Key',
        header: 'Authorization: Bearer <token>',
        internal: 'X-Internal-Token: <service-token>',
      },
      errors: {
        VALIDATION_ERROR: 'Invalid request data',
        NOT_FOUND: 'Resource not found',
        UNAUTHORIZED: 'Authentication required',
        RATE_LIMIT: 'Too many requests',
        SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
      },
    },
  });
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      requestId: req.requestId,
    },
  });
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Gateway error', err, { path: req.path, requestId: req.requestId });
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message,
      requestId: req.requestId,
    },
  });
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

let server: ReturnType<typeof app.listen>;

function gracefulShutdown(signal: string) {
  logger.info(`${signal} received, shutting down gracefully...`);

  if (server) {
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  }

  // Force exit after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ============================================
// SERVER STARTUP
// ============================================

server = app.listen(PORT, () => {
  logger.info(`KHAIRMOVE API Gateway running on port ${PORT}`);
  logger.info('Services:', SERVICES);
  logger.info('Allowed CORS origins:', getAllowedOrigins());
});

export { app };