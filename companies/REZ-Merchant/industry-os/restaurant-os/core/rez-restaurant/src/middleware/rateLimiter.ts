/**
 * Rate Limiter Middleware for Restaurant Service
 *
 * Prevents abuse by limiting requests
 */

import { Request, Response, NextFunction } from 'express';
import logger from './utils/logger';
import Redis from 'ioredis';

let redis: Redis | null = null;

try {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    redis = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
    });
  }
} catch {
  logger.warn('[RateLimiter] Redis not available, using in-memory fallback');
}

const inMemoryStore: Map<string, { count: number; resetAt: number }> = new Map();

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
}

const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  search: {
    windowMs: 60 * 1000,
    maxRequests: 30,
    keyPrefix: 'rl:rest:search:',
  },
  order: {
    windowMs: 60 * 1000,
    maxRequests: 10,
    keyPrefix: 'rl:rest:order:',
  },
  reservation: {
    windowMs: 60 * 1000,
    maxRequests: 10,
    keyPrefix: 'rl:rest:res:',
  },
  menu: {
    windowMs: 60 * 1000,
    maxRequests: 20,
    keyPrefix: 'rl:rest:menu:',
  },
  general: {
    windowMs: 60 * 1000,
    maxRequests: 100,
    keyPrefix: 'rl:rest:gen:',
  },
};

async function checkRateLimitRedis(
  key: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  if (!redis) {
    return checkRateLimitMemory(key, config);
  }

  const now = Date.now();
  const windowStart = now - config.windowMs;
  const fullKey = `${config.keyPrefix}${key}`;

  try {
    const multi = redis.multi();
    multi.zremrangebyscore(fullKey, 0, windowStart);
    multi.zadd(fullKey, now, `${now}:${Math.random()}`);
    multi.zcard(fullKey);
    multi.expire(fullKey, Math.ceil(config.windowMs / 1000));

    const results = await multi.exec();

    if (!results) {
      return { allowed: true, remaining: config.maxRequests, resetAt: now + config.windowMs };
    }

    const count = results[2][1] as number;
    const remaining = Math.max(0, config.maxRequests - count);
    const allowed = count <= config.maxRequests;
    const resetAt = now + config.windowMs;

    if (!allowed) {
      await redis.zremrangebyscore(fullKey, now, now);
    }

    return { allowed, remaining, resetAt };
  } catch (error) {
    console.error('[RateLimiter] Redis error:', error);
    return checkRateLimitMemory(key, config);
  }
}

function checkRateLimitMemory(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const fullKey = `${config.keyPrefix}${key}`;

  const entry = inMemoryStore.get(fullKey);

  if (!entry || entry.resetAt < now) {
    inMemoryStore.set(fullKey, {
      count: 1,
      resetAt: now + config.windowMs,
    });

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
    };
  }

  entry.count += 1;
  const remaining = Math.max(0, config.maxRequests - entry.count);
  const allowed = entry.count <= config.maxRequests;

  return {
    allowed,
    remaining,
    resetAt: entry.resetAt,
  };
}

export function createRateLimiter(type: keyof typeof RATE_LIMIT_CONFIGS = 'general') {
  const config = RATE_LIMIT_CONFIGS[type];

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const identifier =
      req.user?.sub ||
      req.ip ||
      req.headers['x-forwarded-for']?.toString() ||
      'unknown';

    const result = await checkRateLimitRedis(identifier, config);

    res.setHeader('X-RateLimit-Limit', config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', new Date(result.resetAt).toISOString());

    if (!result.allowed) {
      res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        error: 'rate_limit_exceeded',
        retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
      });
      return;
    }

    next();
  };
}

export const rateLimiters = {
  search: createRateLimiter('search'),
  order: createRateLimiter('order'),
  reservation: createRateLimiter('reservation'),
  menu: createRateLimiter('menu'),
  general: createRateLimiter('general'),
};

export default rateLimiters;
