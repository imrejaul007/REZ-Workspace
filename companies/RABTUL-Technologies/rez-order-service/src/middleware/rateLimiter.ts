import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { bullmqRedis } from '../config/redis';
import { logger } from '../config/logger';

/**
 * Order-specific rate limiter with Redis backend.
 * FAIL-CLOSED: If Redis is unavailable, requests are rejected (503).
 */

interface RateLimitStore {
  increment: (key: string) => Promise<{ totalHits: number; resetTime: Date }>;
  decrement: (key: string) => Promise<void>;
  resetKey: (key: string) => Promise<void>;
}

class RedisStore implements RateLimitStore {
  private client = bullmqRedis;
  private windowMs: number;

  constructor(windowMs: number) {
    this.windowMs = windowMs;
  }

  async increment(key: string): Promise<{ totalHits: number; resetTime: Date }> {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    try {
      const multi = this.client.multi();

      // Remove old entries outside the window
      multi.zremrangebyscore(key, 0, windowStart);

      // Add current request timestamp
      multi.zadd(key, now, `${now}-${crypto.randomUUID()}`);

      // Count requests in window
      multi.zcard(key);

      // Set expiry on the key
      multi.expire(key, Math.ceil(this.windowMs / 1000) + 1);

      const results = await multi.exec();

      if (!results) {
        throw new Error('Redis pipeline returned null');
      }

      const totalHits = results[2]?.[1] as number || 1;
      const resetTime = new Date(now + this.windowMs);

      return { totalHits, resetTime };
    } catch (error) {
      logger.error('[RateLimit] Redis increment failed', { key, error });
      // FAIL-CLOSED: Reject request if Redis fails
      throw new Error('Rate limit check failed');
    }
  }

  async decrement(key: string): Promise<void> {
    try {
      await this.client.zrem(key, await this.client.zrange(key, 0, 0));
    } catch (error) {
      logger.warn('[RateLimit] Redis decrement failed (non-critical)', { key, error });
    }
  }

  async resetKey(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      logger.warn('[RateLimit] Redis resetKey failed (non-critical)', { key, error });
    }
  }
}

// Rate limiter tiers for order operations

/**
 * General rate limiter — applies to all routes.
 * 200 requests per minute per IP.
 */
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
  store: new RedisStore(60 * 1000),
  keyGenerator: (req) => {
    // Use userId if authenticated, otherwise IP
    const userId = (req as unknown as { userId?: string }).userId;
    return userId ? `order:general:${userId}` : `order:general:ip:${ipKeyGenerator(req)}`;
  },
});

/**
 * Order creation rate limiter — applies to POST /orders.
 * 10 orders per minute per user.
 */
export const orderCreateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many order creation requests' },
  store: new RedisStore(60 * 1000),
  keyGenerator: (req) => {
    const userId = (req as unknown as { userId?: string }).userId || ipKeyGenerator(req) || 'unknown';
    return `order:create:${userId}`;
  },
});

/**
 * Order read rate limiter — applies to GET /orders endpoints.
 * 100 requests per minute per user.
 */
export const orderReadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many order read requests' },
  store: new RedisStore(60 * 1000),
  keyGenerator: (req) => {
    const userId = (req as unknown as { userId?: string }).userId || ipKeyGenerator(req) || 'unknown';
    return `order:read:${userId}`;
  },
});

/**
 * Internal service rate limiter — applies to internal/service-to-service calls.
 * 500 requests per minute per service.
 */
export const internalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Internal rate limit exceeded' },
  store: new RedisStore(60 * 1000),
  keyGenerator: (req) => {
    const serviceId = (req as unknown as { serviceId?: string }).serviceId || 'unknown';
    return `order:internal:${serviceId}`;
  },
});
