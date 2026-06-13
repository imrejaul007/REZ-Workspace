import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/index.js';

// ============================================================================
// RATE LIMITING
// ============================================================================

interface RateLimitConfig {
  windowMs: number;
  max: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (use Redis for production)
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Clean up expired entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

/**
 * Simple rate limiting middleware
 */
export function rateLimit(config: RateLimitConfig) {
  const { windowMs, max } = config;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();

    let entry = rateLimitStore.get(key);

    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime: now + windowMs,
      };
      rateLimitStore.set(key, entry);
    }

    entry.count++;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', max.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - entry.count).toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000).toString());

    if (entry.count > max) {
      logger.warn('Rate limit exceeded', { ip: key, count: entry.count });
      res.status(429).json({
        success: false,
        error: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        metadata: {
          retry_after: Math.ceil((entry.resetTime - now) / 1000),
        },
      });
      return;
    }

    next();
  };
}

/**
 * Standard API rate limit (100 requests per minute)
 */
export const standardRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
});

/**
 * Strict rate limit (10 requests per minute)
 */
export const strictRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
});

/**
 * Telemetry rate limit (1000 requests per minute)
 */
export const telemetryRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
});
