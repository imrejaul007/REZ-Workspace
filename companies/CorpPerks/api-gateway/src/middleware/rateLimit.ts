import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { findRoute } from '../routes';
import { logSecurityEvent } from '../utils/logger';

// In-memory store for rate limiting
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const memoryStore = new Map<string, RateLimitEntry>();

// Get client identifier (IP + userId if authenticated)
function getClientKey(req: Request): string {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const userId = req.auth?.userId;
  const companyId = req.auth?.companyId;

  // Include company for multi-tenant isolation
  if (companyId) {
    return `${companyId}:${userId || ip}`;
  }

  return userId ? `${ip}:${userId}` : ip;
}

// Cleanup old memory store entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memoryStore.entries()) {
    if (now > entry.resetTime + 60000) {
      memoryStore.delete(key);
    }
  }
}, 60000);

// Create rate limiter with custom in-memory store
function createRateLimiter(windowMs: number, max: number) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: getClientKey,
    skip: (req: Request) => req.auth?.role === 'service',
    handler: (req: Request, res: Response) => {
      const clientKey = getClientKey(req);
      logSecurityEvent('rate_limit_exceeded', {
        requestId: req.context?.requestId,
        method: req.method,
        path: req.path,
        ip: req.ip,
        userId: req.auth?.userId,
      }, { clientKey });

      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please slow down.',
          requestId: req.context?.requestId || 'unknown',
          timestamp: new Date().toISOString(),
          retryAfter: Math.ceil(windowMs / 1000),
        },
      });
    },
    // Use built-in memory store by not specifying a store
  });
}

// Dynamic rate limiter based on route configuration
export function createDynamicRateLimiter() {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    // Skip for public routes
    const path = req.path;
    if (!path.startsWith('/api/') || path === '/api/health') {
      next();
      return;
    }

    // Find route configuration
    const route = findRoute(path);

    // Use route-specific or default rate limit
    const windowMs = route?.rateLimit?.windowMs || parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);
    const max = route?.rateLimit?.max || parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);

    const limiter = createRateLimiter(windowMs, max);
    limiter(req, _res as Response<unknown>, next);
  };
}

// Global rate limiter for all requests
export function createGlobalRateLimiter() {
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);
  const max = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);

  return createRateLimiter(windowMs, max);
}

// Stricter rate limiter for sensitive endpoints
export function createStrictRateLimiter(maxRequests = 10, windowMs = 60000) {
  return createRateLimiter(windowMs, maxRequests);
}

// Graceful shutdown
export async function closeRateLimiter(): Promise<void> {
  // Clear memory store
  memoryStore.clear();
}

export default {
  createDynamicRateLimiter,
  createGlobalRateLimiter,
  createStrictRateLimiter,
  closeRateLimiter,
};
