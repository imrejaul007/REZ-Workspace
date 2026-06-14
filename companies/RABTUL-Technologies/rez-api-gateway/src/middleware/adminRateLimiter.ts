/**
 * Admin Rate Limiter Middleware
 *
 * Implements stricter rate limiting for admin endpoints to prevent:
 * - Brute force attacks on admin authentication
 * - API abuse through excessive requests
 * - Denial of service from runaway scripts
 *
 * Uses Redis for distributed rate limiting with sliding window algorithm.
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../../config/logger';

export interface AdminRateLimitOptions {
  windowMs: number;
  max: number;
  keyGenerator?: (req: Request) => string;
  skipFailedRequests?: boolean;
  skip?: (req: Request) => boolean;
}

// Lazy Redis client
let redisClient: import('redis').RedisClientType | null = null;

async function getRedisClient() {
  if (redisClient) return redisClient;

  const url = process.env.REDIS_URL;
  if (!url) {
    logger.warn('[AdminRateLimit] Redis not configured, falling back to in-memory');
    return null;
  }

  try {
    const { createClient } = await import('redis');
    redisClient = createClient({ url });
    await redisClient.connect();
    logger.info('[AdminRateLimit] Connected to Redis');
    return redisClient;
  } catch (err) {
    logger.error('[AdminRateLimit] Redis connection failed', { err });
    return null;
  }
}

// In-memory fallback store
const inMemoryStore = new Map<string, { count: number; resetAt: number; firstRequest: number }>();

// Safe IP extraction
function getClientIP(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || req.ip || 'unknown';
}

// Clean up old entries periodically
const CLEANUP_INTERVAL = 60000; // 1 minute
const cleanup = () => {
  const now = Date.now();
  for (const [key, value] of inMemoryStore.entries()) {
    if (now > value.resetAt) {
      inMemoryStore.delete(key);
    }
  }
};
setInterval(cleanup, CLEANUP_INTERVAL);

/**
 * Admin-specific rate limiter with stricter limits than general rate limiting
 */
export function adminRateLimiter(options: AdminRateLimitOptions) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes default
    max = 100, // 100 requests per window default
    keyGenerator,
    skipFailedRequests = false,
    skip,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Check skip condition
    if (skip?.(req)) {
      return next();
    }

    const key = keyGenerator ? keyGenerator(req) : getClientIP(req);
    const adminKey = `admin_ratelimit:${key}`;
    const now = Date.now();

    // Get admin ID from request for more granular limiting (if authenticated)
    const adminId = (req as any).adminId;
    const effectiveKey = adminId ? `${adminKey}:admin:${adminId}` : adminKey;

    const redis = await getRedisClient();

    if (redis) {
      // Redis-backed sliding window rate limiting
      try {
        const windowStart = now - windowMs;

        // Use sorted set for sliding window
        const redisKey = `ratelimit:${effectiveKey}`;

        // Remove old entries outside the window
        await redis.zRemRangeByScore(redisKey, '0', String(windowStart));

        // Count requests in current window
        const requestCount = await redis.zCard(redisKey);

        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', String(max));
        res.setHeader('X-RateLimit-Remaining', String(Math.max(0, max - requestCount - 1)));
        res.setHeader('X-RateLimit-Reset', String(Math.ceil((now + windowMs) / 1000)));

        if (requestCount >= max) {
          logger.warn('[AdminRateLimit] Admin rate limit exceeded', {
            ip: key,
            adminId,
            path: req.path,
            count: requestCount,
          });

          res.setHeader('Retry-After', String(Math.ceil(windowMs / 1000)));
          return res.status(429).json({
            success: false,
            message: 'Too many admin requests. Please try again later.',
            code: 'ADMIN_RATE_LIMIT_EXCEEDED',
            retryAfter: Math.ceil(windowMs / 1000),
          });
        }

        // Add current request to the window
        await redis.zAdd(redisKey, { score: now, value: String(now) });
        await redis.expire(redisKey, Math.ceil(windowMs / 1000));

        next();
      } catch (err) {
        logger.error('[AdminRateLimit] Redis error', { err });
        // Fail open on Redis errors to avoid blocking all admin operations
        next();
      }
    } else {
      // In-memory fallback (production should always use Redis)
      if (process.env.NODE_ENV === 'production') {
        logger.error('[AdminRateLimit] CRITICAL: Using in-memory rate limiting in production');
      }

      const entry = inMemoryStore.get(effectiveKey);

      if (!entry || now > entry.resetAt) {
        // New window
        inMemoryStore.set(effectiveKey, {
          count: 1,
          resetAt: now + windowMs,
          firstRequest: now,
        });

        res.setHeader('X-RateLimit-Limit', String(max));
        res.setHeader('X-RateLimit-Remaining', String(max - 1));
        res.setHeader('X-RateLimit-Reset', String(Math.ceil((now + windowMs) / 1000)));

        return next();
      }

      entry.count++;
      res.setHeader('X-RateLimit-Limit', String(max));
      res.setHeader('X-RateLimit-Remaining', String(Math.max(0, max - entry.count)));
      res.setHeader('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

      if (entry.count > max) {
        logger.warn('[AdminRateLimit] Admin rate limit exceeded (in-memory)', {
          ip: key,
          adminId,
          path: req.path,
          count: entry.count,
        });

        return res.status(429).json({
          success: false,
          message: 'Too many admin requests. Please try again later.',
          code: 'ADMIN_RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((entry.resetAt - now) / 1000),
        });
      }

      // Optionally skip counting failed requests
      if (skipFailedRequests && res.statusCode >= 400) {
        entry.count--;
      }

      next();
    }
  };
}

/**
 * Strict rate limiter for admin authentication endpoints
 * Very low limits to prevent brute force attacks
 */
export function adminAuthRateLimiter() {
  return adminRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Only 10 attempts per window
    keyGenerator: (req) => {
      // Rate limit by IP + email for login attempts
      const email = req.body?.email || '';
      return `${getClientIP(req)}:${email}`;
    },
  });
}

/**
 * Rate limiter for bulk operations
 * Prevents abuse of expensive bulk endpoints
 */
export function adminBulkRateLimiter() {
  return adminRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 bulk operations per hour
    keyGenerator: (req) => {
      const adminId = (req as any).adminId || 'anonymous';
      return `bulk:${adminId}`;
    },
  });
}

/**
 * Rate limiter for export operations
 * Exports can be expensive, so limit them
 */
export function adminExportRateLimiter() {
  return adminRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 exports per hour
    keyGenerator: (req) => {
      const adminId = (req as any).adminId || 'anonymous';
      return `export:${adminId}`;
    },
  });
}

export default adminRateLimiter;
