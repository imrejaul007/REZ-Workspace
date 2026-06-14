/**
 * Rate Limiting Middleware
 */

import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup old entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}, 60000);

export function createRateLimiter(config: RateLimitConfig) {
  const { windowMs, max, message = 'Too many requests' } = config;

  return (req: Request, res: Response, next: NextFunction): void => {
    const identifier = req.ip || 'unknown';
    const key = `ratelimit:${identifier}`;

    const now = Date.now();
    let entry = store.get(key);

    if (!entry || entry.resetAt < now) {
      entry = { count: 0, resetAt: now + windowMs };
    }

    entry.count++;
    store.set(key, entry);

    const remaining = Math.max(0, max - entry.count);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetAt / 1000));

    if (entry.count > max) {
      res.status(429).json({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message,
        retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      });
      return;
    }

    next();
  };
}
