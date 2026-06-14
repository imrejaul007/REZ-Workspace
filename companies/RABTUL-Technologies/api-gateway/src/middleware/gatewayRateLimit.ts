import Redis from 'ioredis';
import { Request, Response, NextFunction } from 'express';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new Redis(redisUrl, {
  lazyConnect: true,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

interface RateLimitRule {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
}

const RULES: Record<string, RateLimitRule> = {
  default: { windowMs: 60000, maxRequests: 100 },
  auth: { windowMs: 60000, maxRequests: 10 },
  payment: { windowMs: 60000, maxRequests: 20 },
  order: { windowMs: 60000, maxRequests: 50 },
  search: { windowMs: 60000, maxRequests: 100 },
};

const FAIL_CLOSED = process.env.RATE_LIMIT_FAIL_CLOSED !== 'false';

function getClientIp(req: Request): string {
  // Trust proxy headers (configured via app.set('trust proxy', 1))
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return ips.split(',')[0].trim();
  }
  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }
  // Fallback to req.ip (requires trust proxy setting)
  return req.ip || req.socket.remoteAddress || 'unknown';
}

export async function rateLimitMiddleware(ruleName: keyof typeof RULES = 'default') {
  const rule = RULES[ruleName];
  const keyPrefix = `ratelimit:${ruleName}:`;

  return async (req: Request, res: Response, next: NextFunction) => {
    const identifier = rule.keyGenerator
      ? rule.keyGenerator(req)
      : getClientIp(req);

    const key = `${keyPrefix}${identifier}`;
    const now = Date.now();
    const windowStart = now - rule.windowMs;

    try {
      // Ensure Redis connection
      if (redis.status === 'ready') {
        // Use Redis sorted set for sliding window
        await redis.zremrangebyscore(key, 0, windowStart);
        const count = await redis.zcard(key);

        res.setHeader('X-RateLimit-Limit', rule.maxRequests);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, rule.maxRequests - count - 1));

        if (count >= rule.maxRequests) {
          const oldest = await redis.zrange(key, 0, 0, 'WITHSCORES');
          const retryAfter = oldest.length > 1
            ? Math.ceil((parseInt(oldest[1]) + rule.windowMs - now) / 1000)
            : Math.ceil(rule.windowMs / 1000);

          res.setHeader('Retry-After', retryAfter);
          res.status(429).json({
            error: 'Too many requests',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter,
          });
          return;
        }

        // Add current request using timestamp as unique ID
        await redis.zadd(key, now, `${now}:${process.hrtime().join('')}`);
        await redis.expire(key, Math.ceil(rule.windowMs / 1000) + 1);

        next();
      } else {
        // Redis not connected - fail based on configuration
        if (FAIL_CLOSED) {
          res.status(503).json({
            error: 'Rate limiting temporarily unavailable',
            code: 'RATE_LIMIT_SERVICE_UNAVAILABLE',
          });
        } else {
          next();
        }
      }
    } catch (error) {
      console.error('[RateLimit] Error:', error);
      // SECURITY: Fail closed by default - reject request if rate limiting fails
      if (FAIL_CLOSED) {
        res.status(503).json({
          error: 'Rate limiting temporarily unavailable',
          code: 'RATE_LIMIT_ERROR',
        });
      } else {
        next();
      }
    }
  };
}

export const authRateLimit = () => rateLimitMiddleware('auth');
export const paymentRateLimit = () => rateLimitMiddleware('payment');
export const orderRateLimit = () => rateLimitMiddleware('order');
export const searchRateLimit = () => rateLimitMiddleware('search');

// Initialize Redis connection
redis.connect().catch((err) => {
  console.error('[RateLimit] Redis connection failed:', err);
});
