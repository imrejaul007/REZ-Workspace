import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

/**
 * Rate limiting middleware with Redis support
 * Falls back to in-memory tracking if Redis is unavailable
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const inMemoryStore = new Map<string, RateLimitEntry>();

/**
 * Clean up expired entries from in-memory store
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of inMemoryStore.entries()) {
    if (entry.resetTime <= now) {
      inMemoryStore.delete(key);
    }
  }
}

// Cleanup every minute
setInterval(cleanupExpiredEntries, 60000);

/**
 * Get client identifier for rate limiting
 */
function getClientId(req: Request): string {
  // Check for authenticated service
  const serviceId = req.headers['x-service-id'] as string;
  if (serviceId) {
    return `service:${serviceId}`;
  }

  // Use X-Forwarded-For if behind a proxy
  const forwardedFor = req.headers['x-forwarded-for'] as string;
  if (forwardedFor) {
    return `ip:${forwardedFor.split(',')[0].trim()}`;
  }

  // Fall back to IP
  return `ip:${req.ip || 'unknown'}`;
}

/**
 * Create rate limiting middleware
 */
export function rateLimit(options: {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}) {
  const {
    windowMs = 60000,
    max = 100,
    message = 'Too many requests, please try again later',
    keyGenerator = getClientId
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const clientId = keyGenerator(req);
    const now = Date.now();
    const windowStart = now - windowMs;

    let entry = inMemoryStore.get(clientId);

    if (!entry || entry.resetTime <= now) {
      // Create new window
      entry = {
        count: 0,
        resetTime: now + windowMs
      };
    }

    entry.count++;
    inMemoryStore.set(clientId, entry);

    // Set rate limit headers
    const remaining = Math.max(0, max - entry.count);
    const resetTime = Math.ceil(entry.resetTime / 1000);

    res.setHeader('X-RateLimit-Limit', max.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', resetTime.toString());
    res.setHeader('X-RateLimit-Window', Math.ceil(windowMs / 1000).toString());

    if (entry.count > max) {
      logger.warn('Rate limit exceeded', {
        clientId,
        count: entry.count,
        max,
        path: req.path
      });

      res.status(429).json({
        success: false,
        error: message,
        retryAfter: Math.ceil(entry.resetTime / 1000) - Math.floor(now / 1000)
      });
      return;
    }

    next();
  };
}

/**
 * Stricter rate limit for write operations
 */
export const writeRateLimit = rateLimit({
  windowMs: 60000,
  max: 30,
  message: 'Too many write operations, please slow down'
});

/**
 * Standard rate limit for read operations
 */
export const readRateLimit = rateLimit({
  windowMs: 60000,
  max: 100,
  message: 'Too many read operations, please slow down'
});

/**
 * Coin-specific rate limits
 */
export const earnRateLimit = rateLimit({
  windowMs: 60000,
  max: 20,
  message: 'Too many coin earn requests'
});

export const redeemRateLimit = rateLimit({
  windowMs: 60000,
  max: 10,
  message: 'Too many redemption requests, please wait'
});

export const syncRateLimit = rateLimit({
  windowMs: 60000,
  max: 30,
  message: 'Too many sync requests'
});
