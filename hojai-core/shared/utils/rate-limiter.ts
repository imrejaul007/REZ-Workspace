/**
 * Hojai Core - Rate Limiter Utility
 * Version: 1.0 | Date: May 29, 2026
 */

import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { Request, Response } from 'express';

/**
 * Create tenant-aware rate limiter
 */
export function createRateLimiter(options?: {
  windowMs?: number;
  maxRequests?: number;
  redisClient?: any;
}) {
  const windowMs = options?.windowMs || 60 * 1000; // 1 minute
  const maxRequests = options?.maxRequests || 100;

  // Use Redis if client provided
  const store = options?.redisClient
    ? new RedisStore({
        sendCommand: (...args: string[]) => options.redisClient!.sendCommand(args),
      })
    : undefined;

  return rateLimit({
    windowMs,
    max: maxRequests,
    store,
    keyGenerator: (req: Request) => {
      // Use tenant_id if available, otherwise IP
      return req.headers['x-tenant-id'] as string || req.ip || 'unknown';
    },
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later',
          retryAfter: Math.ceil(windowMs / 1000)
        }
      });
    },
    standardHeaders: true,
    legacyHeaders: false
  });
}

/**
 * Create stricter rate limiter for sensitive endpoints
 */
export function createStrictRateLimiter(options?: {
  windowMs?: number;
  maxRequests?: number;
}) {
  return createRateLimiter({
    windowMs: options?.windowMs || 60 * 1000,
    maxRequests: options?.maxRequests || 10
  });
}
