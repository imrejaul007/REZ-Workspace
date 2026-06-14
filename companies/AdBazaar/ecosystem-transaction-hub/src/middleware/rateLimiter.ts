import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import config from '../config';
import { logger } from 'utils/logger.js';

interface RateLimitInfo {
  remaining: number;
  reset: number;
  total: number;
}

interface RateLimitStore {
  get(key: string): Promise<RateLimitInfo | null>;
  increment(key: string, windowMs: number): Promise<RateLimitInfo>;
}

class RedisRateLimitStore implements RateLimitStore {
  private redis: Redis;
  private prefix = 'rl:';

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async get(key: string): Promise<RateLimitInfo | null> {
    const data = await this.redis.get(`${this.prefix}${key}`);
    if (!data) return null;

    const parsed = JSON.parse(data);
    return {
      remaining: parsed.remaining,
      reset: parsed.reset,
      total: parsed.total,
    };
  }

  async increment(key: string, windowMs: number): Promise<RateLimitInfo> {
    const fullKey = `${this.prefix}${key}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Remove old entries
    await this.redis.zremrangebyscore(fullKey, 0, windowStart);

    // Count current requests
    const count = await this.redis.zcard(fullKey);
    const maxRequests = config.rateLimit.maxRequests;

    if (count >= maxRequests) {
      // Get oldest request timestamp for reset time
      const oldest = await this.redis.zrange(fullKey, 0, 0, 'WITHSCORES');
      const reset = oldest.length >= 2 ? parseInt(oldest[1]) + windowMs : now + windowMs;

      return {
        remaining: 0,
        reset,
        total: maxRequests,
      };
    }

    // Add new request
    await this.redis.zadd(fullKey, now, `${now}:${Math.random()}`);
    await this.redis.expire(fullKey, Math.ceil(windowMs / 1000));

    return {
      remaining: maxRequests - count - 1,
      reset: now + windowMs,
      total: maxRequests,
    };
  }
}

// In-memory fallback store
class MemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, { count: number; reset: number; requests: number[] }>();

  async get(key: string): Promise<RateLimitInfo | null> {
    const data = this.store.get(key);
    if (!data) return null;

    const now = Date.now();
    if (now > data.reset) {
      this.store.delete(key);
      return null;
    }

    return {
      remaining: config.rateLimit.maxRequests - data.count,
      reset: data.reset,
      total: config.rateLimit.maxRequests,
    };
  }

  async increment(key: string, windowMs: number): Promise<RateLimitInfo> {
    const now = Date.now();
    let data = this.store.get(key);

    if (!data || now > data.reset) {
      data = { count: 0, reset: now + windowMs, requests: [] };
 }

    // Clean old requests
    data.requests = data.requests.filter((t) => t > now - windowMs);
    data.count = data.requests.length;

    if (data.count >= config.rateLimit.maxRequests) {
      return {
        remaining: 0,
        reset: data.reset,
        total: config.rateLimit.maxRequests,
      };
    }

    data.requests.push(now);
    data.count++;
    this.store.set(key, data);

    return {
      remaining: config.rateLimit.maxRequests - data.count,
      reset: data.reset,
      total: config.rateLimit.maxRequests,
    };
  }
}

let store: RateLimitStore;

export function initRateLimiter(redis?: Redis): void {
  if (redis) {
    store = new RedisRateLimitStore(redis);
    logger.info('Rate limiter initialized with Redis');
  } else {
    store = new MemoryRateLimitStore();
    logger.info('Rate limiter initialized with in-memory store');
  }
}

export function rateLimiter(identifier?: (req: Request) => string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!store) {
      next();
      return;
    }

    const key = identifier
      ? identifier(req)
      : req.user?.userId || req.ip || 'unknown';

    try {
      const info = await store.increment(key, config.rateLimit.windowMs);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', info.total.toString());
      res.setHeader('X-RateLimit-Remaining', info.remaining.toString());
      res.setHeader('X-RateLimit-Reset', new Date(info.reset).toISOString());

      if (info.remaining <= 0) {
        res.status(429).json({
          success: false,
          error: 'Too many requests',
          retryAfter: Math.ceil((info.reset - Date.now()) / 1000),
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Rate limiter error', { error });
      // On error, allow the request to proceed
      next();
    }
  };
}

export default rateLimiter;