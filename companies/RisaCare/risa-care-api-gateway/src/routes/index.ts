// RisaCare API Gateway - Routes

import { Router, Request, Response } from 'express';
import { optionalAuth } from '../middleware';
import { logger } from '@risa-care/shared/utils';

// ============================================
// ROUTE CONFIG
// ============================================

export interface RouteConfig {
  service: string;
  baseUrl: string;
  timeout?: number;
}

export const SERVICE_ROUTES: Record<string, RouteConfig> = {
  records: {
    service: 'health-records-service',
    baseUrl: process.env.RECORDS_SERVICE_URL || 'http://localhost:4702'
  },
  ai: {
    service: 'health-ai-service',
    baseUrl: process.env.AI_SERVICE_URL || 'http://localhost:4703'
  },
  profile: {
    service: 'health-profile-service',
    baseUrl: process.env.PROFILE_SERVICE_URL || 'http://localhost:4704'
  },
  booking: {
    service: 'health-booking-service',
    baseUrl: process.env.BOOKING_SERVICE_URL || 'http://localhost:4705'
  },
  marketplace: {
    service: 'health-marketplace-service',
    baseUrl: process.env.MARKETPLACE_SERVICE_URL || 'http://localhost:4706'
  },
  wellness: {
    service: 'health-wellness-service',
    baseUrl: process.env.WELLNESS_SERVICE_URL || 'http://localhost:4707'
  },
  corporate: {
    service: 'health-corporate-service',
    baseUrl: process.env.CORPORATE_SERVICE_URL || 'http://localhost:4708'
  }
};

// ============================================
// PROXY HELPER
// ============================================

async function proxyRequest(
  req: Request,
  res: Response,
  targetUrl: string,
  options: { timeout?: number; requiresAuth?: boolean } = {}
): Promise<void> {
  const startTime = Date.now();
  const requestId = req.requestId;
  const userId = req.userId;
  const profileId = req.profileId;

  try {
    // Build target URL
    const url = new URL(req.originalUrl, targetUrl);

    // Forward request to service
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeout || 30000);

    const response = await fetch(url.toString(), {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        'X-User-Id': userId || '',
        'X-Profile-Id': profileId || '',
        'Authorization': req.headers.authorization || ''
      },
      body: ['POST', 'PUT', 'PATCH'].includes(req.method) ? JSON.stringify(req.body) : undefined,
      signal: controller.signal
    });

    clearTimeout(timeout);

    const duration = Date.now() - startTime;

    // Read response
    const data = await response.json();

    // Log the proxy
    logger.info(`Proxy ${req.method} ${req.originalUrl} -> ${targetUrl} [${response.status}] ${duration}ms`, {
      requestId,
      userId,
      statusCode: response.status
    });

    // Forward response
    res.status(response.status).json(data);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`Proxy error: ${req.method} ${req.originalUrl}`, error as Error, { requestId, userId });

    if ((error as Error).name === 'AbortError') {
      res.status(504).json({
        success: false,
        error: {
          code: 'GATEWAY_TIMEOUT',
          message: 'Service request timed out',
          requestId
        }
      });
      return;
    }

    res.status(502).json({
      success: false,
      error: {
        code: 'BAD_GATEWAY',
        message: 'Service unavailable',
        requestId
      }
    });
  }
}

// ============================================
// ROUTE CREATORS
// ============================================

export function createServiceRouter(serviceName: string, prefix: string): Router {
  const router = Router({ mergeParams: true });
  const config = SERVICE_ROUTES[serviceName];

  if (!config) {
    throw new Error(`Unknown service: ${serviceName}`);
  }

  // Apply authentication to all routes
  router.use(optionalAuth);

  // Health check
  router.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      service: config.service,
      timestamp: new Date().toISOString()
    });
  });

  // Proxy all other requests
  router.all('*', async (req, res) => {
    await proxyRequest(req, res, config.baseUrl, { timeout: config.timeout });
  });

  return router;
}

// ============================================
// MAIN ROUTER
// ============================================

export function createMainRouter(): Router {
  const router = Router();

  // Health check
  router.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      service: 'risa-care-api-gateway',
      timestamp: new Date().toISOString(),
      version: process.env.SERVICE_VERSION || '1.0.0'
    });
  });

  router.get('/ready', (req, res) => {
    res.json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  });

  // Mount service routes
  router.use('/records', createServiceRouter('records', '/records'));
  router.use('/ai', createServiceRouter('ai', '/ai'));
  router.use('/profile', createServiceRouter('profile', '/profile'));
  router.use('/booking', createServiceRouter('booking', '/booking'));
  router.use('/marketplace', createServiceRouter('marketplace', '/marketplace'));
  router.use('/wellness', createServiceRouter('wellness', '/wellness'));
  router.use('/corporate', createServiceRouter('corporate', '/corporate'));

  // API version
  router.get('/version', (req, res) => {
    res.json({
      apiVersion: 'v1',
      service: 'RisaCare API',
      timestamp: new Date().toISOString()
    });
  });

  return router;
}

// ============================================
// WEBSOCKET ROUTES (Future)
// ============================================

// WebSocket type declarations
type WebSocket = {
  on(event: string, handler: (data?: unknown) => void): void;
  send(data: string): void;
  close(): void;
};

type RequestWithUser = {
  userId?: string;
  requestId?: string;
};

export function createWebSocketRouter(): Router {
  const router = Router();

  // WebSocket route - marked with comment for future implementation
  // Note: Standard Express Router doesn't support .ws(). This requires
  // a WebSocket library like ws or express-ws.
  // For now, the function returns an empty router.
  // To enable WebSocket, use: import { WebSocketServer } from 'ws';

  return router;
}
