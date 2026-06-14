import { Router, Request, Response } from 'express';
import { proxyService } from '../services/proxy';
import { circuitBreaker } from '../services/circuitBreaker';
import { cacheService } from '../services/cache';
import { asyncHandler } from '../utils/errors';
import { logger } from '../utils/logger';
import config from '../config';

const router = Router();

// Service route definitions
const serviceRoutes = [
  // Flight service routes
  { path: '/api/v1/flights/*', service: 'flight', method: 'any' },
  { path: '/api/v1/search/*', service: 'flight', method: 'any' },
  { path: '/api/v1/bookings/*', service: 'flight', method: 'any' },

  // Lounge service routes
  { path: '/api/v1/lounges/*', service: 'lounge', method: 'any' },
  { path: '/api/v1/lounge/*', service: 'lounge', method: 'any' },

  // Itinerary service routes
  { path: '/api/v1/itineraries/*', service: 'itinerary', method: 'any' },
  { path: '/api/v1/trips/*', service: 'itinerary', method: 'any' },

  // Wallet service routes
  { path: '/api/v1/wallet/*', service: 'wallet', method: 'any' },
  { path: '/api/v1/balance/*', service: 'wallet', method: 'any' },
  { path: '/api/v1/transactions/*', service: 'wallet', method: 'any' },

  // AI Brain service routes
  { path: '/api/v1/ai/*', service: 'aiBrain', method: 'any' },
  { path: '/api/v1/assistant/*', service: 'aiBrain', method: 'any' },
  { path: '/api/v1/recommendations/*', service: 'aiBrain', method: 'any' },

  // Corporate service routes
  { path: '/api/v1/corporate/*', service: 'corp', method: 'any' },
  { path: '/api/v1/policies/*', service: 'corp', method: 'any' },
  { path: '/api/v1/approvals/*', service: 'corp', method: 'any' },

  // Hotel service routes
  { path: '/api/v1/hotels/*', service: 'hotel', method: 'any' },
  { path: '/api/v1/rooms/*', service: 'hotel', method: 'any' },
  { path: '/api/v1/bookings/hotel/*', service: 'hotel', method: 'any' },

  // Transfer service routes
  { path: '/api/v1/transfers/*', service: 'transfer', method: 'any' },
  { path: '/api/v1/cabs/*', service: 'transfer', method: 'any' },

  // DOOH service routes
  { path: '/api/v1/dooh/*', service: 'dooh', method: 'any' },
  { path: '/api/v1/screens/*', service: 'dooh', method: 'any' },
  { path: '/api/v1/campaigns/*', service: 'dooh', method: 'any' }
];

// Dynamic route handler
const handleProxy = asyncHandler(async (req: Request, res: Response) => {
  const path = req.path;
  const method = req.method;

  // Find matching route
  const route = serviceRoutes.find(r => {
    const regex = new RegExp('^' + r.path.replace(/\*/g, '.*').replace(/\//g, '\\/') + '$');
    return regex.test(path) && (r.method === 'any' || r.method === method);
  });

  if (!route) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: `No route found for ${method} ${path}`
      },
      meta: {
        requestId: req.requestId,
        timestamp: Date.now()
      }
    });
  }

  // Extract the target path by removing the gateway prefix
  const targetPath = path.replace(/^\/api\/v1/, '');

  // Proxy the request
  const response = await proxyService.proxy(route.service, {
    method,
    path: targetPath,
    headers: {
      ...req.headers,
      'x-user-id': req.user?.sub || req.headers['x-user-id'] as string,
      'x-tenant-id': req.user?.tenantId || req.headers['x-tenant-id'] as string
    },
    query: req.query as Record<string, string>,
    body: req.body
  });

  // Send response
  res.status(response.status).json({
    success: true,
    data: response.data,
    meta: {
      requestId: req.requestId,
      timestamp: Date.now(),
      cached: response.headers['x-cache'] === 'HIT'
    }
  });
});

// Register all service routes
router.use('/api/v1', handleProxy);

// Health check endpoint
router.get('/health', asyncHandler(async (req: Request, res: Response) => {
  const serviceHealth = await proxyService.checkAllServices();

  const allHealthy = Object.values(serviceHealth).every(s => s.healthy);
  const anyHealthy = Object.values(serviceHealth).some(s => s.healthy);

  res.status(allHealthy ? 200 : anyHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : anyHealthy ? 'degraded' : 'unhealthy',
    timestamp: Date.now(),
    version: config.version,
    services: serviceHealth
  });
}));

// Circuit breaker status
router.get('/circuit-breaker', asyncHandler(async (req: Request, res: Response) => {
  const states = circuitBreaker.getAllStates();
  const stats = circuitBreaker.getStats();

  res.json({
    success: true,
    data: {
      stats,
      states: Object.fromEntries(states)
    },
    meta: {
      requestId: req.requestId,
      timestamp: Date.now()
    }
  });
}));

// Cache management
router.post('/cache/clear', asyncHandler(async (req: Request, res: Response) => {
  const { pattern } = req.body;

  await cacheService.clear(pattern);

  res.json({
    success: true,
    message: pattern ? `Cache cleared for pattern: ${pattern}` : 'Cache cleared',
    meta: {
      requestId: req.requestId,
      timestamp: Date.now()
    }
  });
}));

// Cache stats
router.get('/cache/stats', asyncHandler(async (req: Request, res: Response) => {
  const stats = cacheService.getStats();

  res.json({
    success: true,
    data: stats,
    meta: {
      requestId: req.requestId,
      timestamp: Date.now()
    }
  });
}));

// Service metrics
router.get('/metrics', asyncHandler(async (req: Request, res: Response) => {
  const requestCounts = proxyService.getRequestCounts();
  const circuitStats = circuitBreaker.getStats();
  const cacheStats = cacheService.getStats();

  res.json({
    success: true,
    data: {
      requests: requestCounts,
      circuitBreaker: circuitStats,
      cache: cacheStats
    },
    meta: {
      requestId: req.requestId,
      timestamp: Date.now()
    }
  });
}));

// Route list
router.get('/routes', asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      routes: serviceRoutes.map(r => ({
        path: r.path,
        service: r.service,
        method: r.method
      })),
      total: serviceRoutes.length
    },
    meta: {
      requestId: req.requestId,
      timestamp: Date.now()
    }
  });
}));

// Manual circuit breaker control
router.post('/circuit-breaker/:service/:action', asyncHandler(async (req: Request, res: Response) => {
  const { service, action } = req.params;

  if (action === 'open') {
    circuitBreaker.forceOpen(service);
  } else if (action === 'close') {
    circuitBreaker.forceClose(service);
  } else if (action === 'reset') {
    circuitBreaker.reset(service);
  } else {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ACTION',
        message: 'Action must be: open, close, or reset'
      }
    });
  }

  res.json({
    success: true,
    message: `Circuit breaker for ${service} ${action}ed`,
    meta: {
      requestId: req.requestId,
      timestamp: Date.now()
    }
  });
}));

export default router;