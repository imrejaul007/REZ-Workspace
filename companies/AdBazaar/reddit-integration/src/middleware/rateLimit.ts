import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';
import { logger } from '../config/logger';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore: Map<string, RateLimitEntry> = new Map();

/**
 * Clean up expired entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean every minute

/**
 * Rate limiting middleware
 */
export const rateLimitMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const key = getClientKey(req);
  const now = Date.now();

  let entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt < now) {
    entry = {
      count: 1,
      resetAt: now + config.rateLimit.windowMs,
    };
    rateLimitStore.set(key, entry);
    next();
    return;
  }

  entry.count++;

  if (entry.count > config.rateLimit.maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);

    logger.warn('Rate limit exceeded', {
      key,
      count: entry.count,
      limit: config.rateLimit.maxRequests,
    });

    res.setHeader('Retry-After', retryAfter.toString());
    res.setHeader('X-RateLimit-Limit', config.rateLimit.maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', '0');
    res.setHeader('X-RateLimit-Reset', entry.resetAt.toString());

    res.status(429).json({
      success: false,
      error: 'Too many requests',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter,
    });
    return;
  }

  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', config.rateLimit.maxRequests.toString());
  res.setHeader(
    'X-RateLimit-Remaining',
    (config.rateLimit.maxRequests - entry.count).toString()
  );
  res.setHeader('X-RateLimit-Reset', entry.resetAt.toString());

  next();
};

/**
 * Get a unique key for the client
 */
function getClientKey(req: Request): string {
  // Use X-Forwarded-For if behind a proxy
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0] : req.ip;

  // Include user ID if authenticated
  const userId = (req as any).userId || 'anonymous';

  return `${ip}:${userId}`;
}

/**
 * Create a custom rate limiter for specific endpoints
 */
export const createRateLimiter = (maxRequests: number, windowMs: number) => {
  const store: Map<string, RateLimitEntry> = new Map();

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = getClientKey(req);
    const now = Date.now();

    let entry = store.get(key);

    if (!entry || entry.resetAt < now) {
      entry = {
        count: 1,
        resetAt: now + windowMs,
      };
      store.set(key, entry);
      next();
      return;
    }

    entry.count++;

    if (entry.count > maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);

      res.setHeader('Retry-After', retryAfter.toString());
      res.status(429).json({
        success: false,
        error: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter,
      });
      return;
    }

    next();
  };
};

export default rateLimitMiddleware;