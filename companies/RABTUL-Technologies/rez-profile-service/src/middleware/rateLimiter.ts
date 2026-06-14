import rateLimit from 'express-rate-limit';
import { redis } from '../config/redis';
import { logger } from '../config/logger';

/**
 * Redis-backed rate limiter store for profile service.
 * FAIL-CLOSED: Rejects requests if Redis is unavailable.
 */
interface RateLimitStore {
  increment(key: string): Promise<{ totalHits: number; resetTime: Date }>;
  decrement(key: string): Promise<void>;
  resetKey(key: string): Promise<void>;
}

class RedisStore implements RateLimitStore {
  private windowMs: number;

  constructor(windowMs: number) {
    this.windowMs = windowMs;
  }

  async increment(key: string): Promise<{ totalHits: number; resetTime: Date }> {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    try {
      const multi = redis.multi();
      multi.zRemRangeByScore(key, 0, windowStart);
      multi.zAdd(key, { value: `${now}-${crypto.randomUUID()}`, score: now });
      multi.zCard(key);
      multi.expire(key, Math.ceil(this.windowMs / 1000) + 1);
      const results = await multi.exec();

      if (!results) {
        throw new Error('Redis pipeline returned null');
      }

      // Results is an array of [error, result] tuples from the pipeline
      const resultArray = results as unknown as Array<[Error | null, unknown]>;
      const zCardResult = resultArray[2];
      const totalHits = (typeof zCardResult?.[1] === 'number' ? zCardResult[1] : 1) || 1;
      return { totalHits, resetTime: new Date(now + this.windowMs) };
    } catch (error) {
      logger.error('[RateLimit] Redis increment failed', { key, error });
      throw new Error('Rate limit check failed');
    }
  }

  async decrement(key: string): Promise<void> {
    try {
      const oldest = await redis.zRange(key, 0, 0);
      if (oldest.length > 0) {
        await redis.zRem(key, oldest[0]);
      }
    } catch (error) {
      logger.warn('[RateLimit] Redis decrement failed (non-critical)', { key, error });
    }
  }

  async resetKey(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      logger.warn('[RateLimit] Redis resetKey failed (non-critical)', { key, error });
    }
  }
}

// General rate limiter: 500 requests per 15 minutes per user
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
  store: new RedisStore(15 * 60 * 1000),
  keyGenerator: (req) => {
    const userId = (req as { userId?: string }).userId;
    return userId ? `profile:general:${userId}` : `profile:general:ip:${req.ip}`;
  },
});

// Profile read rate limiter: 100 requests per minute per user
export const profileReadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many profile read requests' },
  store: new RedisStore(60 * 1000),
  keyGenerator: (req) => {
    const userId = (req as { userId?: string }).userId;
    return userId ? `profile:read:${userId}` : `profile:read:ip:${req.ip}`;
  },
});

// Profile write rate limiter: 30 requests per minute per user
export const profileWriteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many profile update requests' },
  store: new RedisStore(60 * 1000),
  keyGenerator: (req) => {
    const userId = (req as { userId?: string }).userId;
    return userId ? `profile:write:${userId}` : `profile:write:ip:${req.ip}`;
  },
});

// Internal rate limiter: 1000 requests per minute per service
export const internalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Internal rate limit exceeded' },
  store: new RedisStore(60 * 1000),
  keyGenerator: (req) => {
    const serviceId = (req as { serviceId?: string }).serviceId || 'unknown';
    return `profile:internal:${serviceId}`;
  },
});
