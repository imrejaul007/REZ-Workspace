import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { logger } from '../config/logger';

// Rate limiter for general API requests
export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute default
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 100 requests per minute default
  message: {
    success: false,
    error: 'Too many requests, please try again later',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: 'Please try again in a few minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      userId: (req as any).user?.userId,
    });

    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000') / 1000),
    });
  },
});

// More lenient limiter for health checks
export const healthLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 300, // 300 requests per minute
  message: {
    success: false,
    error: 'Too many health check requests',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

// Strict limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 minutes
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    retryAfter: 'Please try again in 15 minutes',
  },
  handler: (req: Request, res: Response) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      path: req.path,
    });

    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts, please try again later',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      retryAfter: 900, // 15 minutes in seconds
    });
  },
});

// Limiter for write operations (POST, PUT, PATCH, DELETE)
export const writeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // 50 write operations per minute
  message: {
    success: false,
    error: 'Too many write operations, please slow down',
    code: 'WRITE_RATE_LIMIT_EXCEEDED',
  },
});

// Limiter for bulk operations
export const bulkLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 bulk operations per minute
  message: {
    success: false,
    error: 'Too many bulk operations, please slow down',
    code: 'BULK_RATE_LIMIT_EXCEEDED',
  },
});

// Per-user rate limiter using Redis (for authenticated requests)
export function createUserRateLimiter(redis: any) {
  return rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute per user
    keyGenerator: (req: Request) => {
      const userId = (req as any).user?.userId || req.ip || 'anonymous';
      return `rate_limit:user:${userId}`;
    },
    store: {
      async increment(key: string) {
        const current = await redis.incr(key);
        if (current === 1) {
          await redis.expire(key, 60);
        }
        return {
          totalHits: current,
          resetTime: new Date(Date.now() + 60000),
        };
      },
      async decrement(key: string) {
        await redis.decr(key);
      },
      async resetKey(key: string) {
        await redis.del(key);
      },
    },
    message: {
      success: false,
      error: 'Rate limit exceeded for this user',
      code: 'USER_RATE_LIMIT_EXCEEDED',
    },
  });
}

// IP-based whitelist for rate limiting
export function createWhitelistMiddleware(whitelistIps: string[]) {
  return (req: Request, res: Response, next: Function): void => {
    if (whitelistIps.includes(req.ip || '')) {
      // Skip rate limiting for whitelisted IPs
      next();
    } else {
      next();
    }
  };
}