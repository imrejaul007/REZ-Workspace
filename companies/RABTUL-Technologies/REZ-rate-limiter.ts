/**
 * Advanced Rate Limiter - Day 22-30
 * Redis-based rate limiting with sliding window
 */

import { redis } from '../config/redis';
import { Request, Response, NextFunction } from 'express';

const RATE_PREFIX = 'ratelimit:';

interface RateLimitConfig {
  windowMs: number; // milliseconds
  max: number; // requests per window
  keyGenerator?: (req: Request) => string;
}

/**
 * Sliding window rate limiter
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  const key = `${RATE_PREFIX}${identifier}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  // Remove old entries
  await redis.zremrangebyscore(key, 0, windowStart);

  // Count requests in window
  const count = await redis.zcard(key);

  if (count >= config.max) {
    const oldest = await redis.zrange(key, 0, 0, 'WITHSCORES');
    const reset = oldest.length > 1 ? parseInt(oldest[1]) + config.windowMs - now : config.windowMs;

    return { allowed: false, remaining: 0, reset };
  }

  // Add current request
  await redis.zadd(key, now, `${now}`);
  await redis.pexpire(key, config.windowMs);

  return {
    allowed: true,
    remaining: config.max - count - 1,
    reset: config.windowMs,
  };
}

/**
 * Express middleware for rate limiting
 */
export function rateLimitMiddleware(config: RateLimitConfig) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = config.keyGenerator ? config.keyGenerator(req) : req.ip || 'unknown';
    const result = await checkRateLimit(key, config);

    res.setHeader('X-RateLimit-Limit', config.max);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', Date.now() + result.reset);

    if (!result.allowed) {
      return res.status(429).json({ error: 'Too Many Requests' });
    }

    next();
  };
}
