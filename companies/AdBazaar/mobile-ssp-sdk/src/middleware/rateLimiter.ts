import { Request, Response, NextFunction } from 'express';
import { config } from '../config/index.js';
import { cacheIncrement, cacheSet, cacheGet } from '../config/redis.js';

/**
 * In-memory rate limiter (fallback when Redis is not available)
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiter middleware using sliding window algorithm
 */
export const rateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const identifier = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
  const key = `rate_limit:${identifier}`;
  const now = Date.now();
  const windowMs = config.rateLimit.windowMs;
  const maxRequests = config.rateLimit.maxRequests;

  try {
    // Try Redis first
    const redis = await import('../config/redis.js').then(m => m.getRedis());
    const currentCount = await cacheGet(key);

    if (currentCount === null) {
      // First request in window
      await cacheSet(key, '1', Math.ceil(windowMs / 1000));
    } else {
      const count = parseInt(currentCount, 10);
      if (count >= maxRequests) {
        res.status(429).json({
          success: false,
          error: 'Too many requests',
          retryAfter: Math.ceil(windowMs / 1000),
        });
        return;
      }
      await cacheIncrement(key);
    }

    next();
  } catch {
    // Fallback to in-memory rate limiting
    const record = requestCounts.get(identifier);

    if (!record || now > record.resetTime) {
      // New window
      requestCounts.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
      });
    } else if (record.count >= maxRequests) {
      res.status(429).json({
        success: false,
        error: 'Too many requests',
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      });
      return;
    } else {
      record.count++;
    }

    next();
  }
};

/**
 * Ad request rate limiter (stricter limits for ad requests)
 */
export const adRequestRateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const key = `ad_rate_limit:${req.body?.appId || req.body?.publisherId || req.ip}`;

  try {
    const redis = await import('../config/redis.js').then(m => m.getRedis());
    const currentCount = await cacheGet(key);

    if (currentCount === null) {
      // 100 ad requests per minute per app
      await cacheSet(key, '1', 60);
    } else {
      const count = parseInt(currentCount, 10);
      if (count >= 100) {
        res.status(429).json({
          success: false,
          error: 'Too many ad requests',
          retryAfter: 60,
        });
        return;
      }
      await cacheIncrement(key);
    }

    next();
  } catch {
    // Skip rate limiting if Redis unavailable
    next();
  }
};