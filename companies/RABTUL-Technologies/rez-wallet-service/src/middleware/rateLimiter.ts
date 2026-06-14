import rateLimit from 'express-rate-limit';
import { Request } from 'express';
import { redis } from '../config/redis';
import { logger } from '../config/logger';

/**
 * Wallet-specific rate limiter with Redis backend.
 * FAIL-CLOSED: If Redis is unavailable, requests are rejected (503).
 */

// Extended options interface to include failClosed custom option
interface RateLimiterOptions {
  windowMs: number;
  max: number;
  standardHeaders: boolean;
  legacyHeaders: boolean;
  message: { success: boolean; message: string };
  store: unknown;
  failClosed?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  keyGenerator?: (req) => string;
}

interface RateLimitStore {
  increment: (key: string) => Promise<{ totalHits: number; resetTime: Date }>;
  decrement: (key: string) => Promise<void>;
  resetKey: (key: string) => Promise<void>;
}

class RedisStore implements RateLimitStore {
  private client = redis;
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

// Rate limiter tiers for wallet operations

/**
 * General rate limiter — applies to all routes.
 * 500 requests per 15 minutes per IP.
 * Note: failClosed behavior is implemented by RedisStore throwing on Redis failure
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
  store: new RedisStore(15 * 60 * 1000),
  keyGenerator: (req: Request) => {
    // Use X-User-Id if available (authenticated), otherwise IP
    const userId = (req as unknown).userId || (req as unknown).merchantId;
    return userId ? `wallet:general:${userId}` : `wallet:general:ip:${req.ip}`;
  },
} as unknown);

/**
 * Balance read rate limiter — applies to balance queries.
 * 100 requests per minute per user.
 */
export const balanceReadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many balance requests' },
  store: new RedisStore(60 * 1000),
  keyGenerator: (req: Request) => {
    const userId = (req as unknown).userId || req.ip || 'unknown';
    return `wallet:balance:${userId}`;
  },
} as unknown);

/**
 * Transaction rate limiter — applies to credit/debit operations.
 * 30 requests per minute per user (financial operations, stricter).
 */
export const transactionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many transaction requests' },
  store: new RedisStore(60 * 1000),
  keyGenerator: (req: Request) => {
    const userId = (req as unknown).userId || req.ip || 'unknown';
    return `wallet:transaction:${userId}`;
  },
} as unknown);

/**
 * Sensitive operation rate limiter — applies to payout, BNPL, credit operations.
 * 10 requests per minute per user.
 */
export const sensitiveLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Rate limit exceeded for sensitive operation' },
  store: new RedisStore(60 * 1000),
  keyGenerator: (req: Request) => {
    const userId = (req as unknown).userId || (req as unknown).merchantId || req.ip || 'unknown';
    return `wallet:sensitive:${userId}`;
  },
} as unknown);

/**
 * Internal service rate limiter — applies to internal/service-to-service calls.
 * 1000 requests per minute per service.
 */
export const internalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Internal rate limit exceeded' },
  store: new RedisStore(60 * 1000),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  keyGenerator: (req) => {
    // Use service identifier from internal token
    const serviceId = req.serviceId || 'unknown';
    return `wallet:internal:${serviceId}`;
  },
});
