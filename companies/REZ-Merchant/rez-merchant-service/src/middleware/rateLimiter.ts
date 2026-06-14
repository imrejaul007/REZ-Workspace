/**
 * Rate Limiter Middleware
 *
 * Redis-based sliding window rate limiter with:
 * - Per-route configurable limits
 * - Per-merchant rate limiting
 * - IP-based fallback for unauthenticated requests
 * - Response headers (X-RateLimit-*)
 * - Automatic cleanup of old entries
 */

import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis';
import { logger } from '../config/logger';

// ── Rate Limit Config ─────────────────────────────────────────────────────────

export interface RateLimitConfig {
  windowMs: number;    // Time window in ms
  maxRequests: number; // Max requests per window
  keyPrefix?: string;  // Custom key prefix
}

export const RATE_LIMITS = {
  // Strict limits for sensitive endpoints
  AUTH: { windowMs: 60000, maxRequests: 5 },        // 5/min for login/register
  PASSWORD_RESET: { windowMs: 3600000, maxRequests: 3 }, // 3/hour for password reset

  // Standard API limits
  DEFAULT: { windowMs: 60000, maxRequests: 100 },   // 100/min default
  DATA_ENTRY: { windowMs: 60000, maxRequests: 60 }, // 60/min for data entry
  READ: { windowMs: 60000, maxRequests: 200 },      // 200/min for read operations
  WRITE: { windowMs: 60000, maxRequests: 30 },      // 30/min for writes

  // Bulk operations
  BULK_IMPORT: { windowMs: 3600000, maxRequests: 10 }, // 10/hour for imports
  EXPORT: { windowMs: 3600000, maxRequests: 20 },      // 20/hour for exports

  // Webhooks - generous limits
  WEBHOOK: { windowMs: 1000, maxRequests: 100 },    // 100/sec for webhooks

  // Stricter for unauthenticated
  PUBLIC: { windowMs: 60000, maxRequests: 30 },     // 30/min for public endpoints
} as const;

type RateLimitName = keyof typeof RATE_LIMITS;

// ── Rate Limiter Class ────────────────────────────────────────────────────────

export class RateLimiter {
  private config: RateLimitConfig;
  private keyPrefix: string;

  constructor(config: RateLimitConfig, keyPrefix = 'rl') {
    this.config = config;
    this.keyPrefix = keyPrefix;
  }

  /**
   * Get identifier for rate limiting (merchantId, merchantUserId, or IP)
   */
  private getIdentifier(req: Request): string {
    // Priority: merchantId > merchantUserId > IP
    if (req.merchantId) {
      return `merchant:${req.merchantId}`;
    }
    if (req.merchantUserId) {
      return `user:${req.merchantUserId}`;
    }
    // Fallback to IP
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return `ip:${ip}`;
  }

  /**
   * Build Redis key for rate limiting
   */
  private buildKey(identifier: string, route: string): string {
    return `${this.keyPrefix}:${route}:${identifier}`;
  }

  /**
   * Check and update rate limit using sliding window
   */
  async checkLimit(req: Request, route: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: number;
    total: number;
  }> {
    const identifier = this.getIdentifier(req);
    const key = this.buildKey(identifier, route);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    const { maxRequests, windowMs } = this.config;

    try {
      // Use Redis transaction for atomicity
      const multi = redis.multi();

      // Remove old entries outside the window
      multi.zremrangebyscore(key, 0, windowStart);

      // Count current requests in window
      multi.zcard(key);

      // Add current request
      multi.zadd(key, now, `${now}:${Math.random()}`);

      // Set TTL on the key
      multi.pexpire(key, windowMs);

      const results = await multi.exec();

      if (!results) {
        // Redis unavailable - allow request
        logger.warn('[RateLimiter] Redis unavailable, allowing request');
        return { allowed: true, remaining: maxRequests, resetAt: now + windowMs, total: maxRequests };
      }

      const currentCount = results[1][1] as number;
      const allowed = currentCount < maxRequests;
      const remaining = Math.max(0, maxRequests - currentCount - 1);
      const resetAt = now + windowMs;

      if (!allowed) {
        logger.warn(`[RateLimiter] Rate limit exceeded for ${identifier} on ${route}`, {
          currentCount,
          maxRequests,
        });
      }

      return { allowed, remaining, resetAt, total: maxRequests };
    } catch (err) {
      logger.error('[RateLimiter] Redis error', { error: err });
      // On error, allow the request
      return { allowed: true, remaining: maxRequests, resetAt: now + windowMs, total: maxRequests };
    }
  }
}

// ── Singleton Instances ────────────────────────────────────────────────────────

export const rateLimiters: Record<RateLimitName, RateLimiter> = {
  AUTH: new RateLimiter(RATE_LIMITS.AUTH, 'rl:auth'),
  PASSWORD_RESET: new RateLimiter(RATE_LIMITS.PASSWORD_RESET, 'rl:pwd'),
  DEFAULT: new RateLimiter(RATE_LIMITS.DEFAULT, 'rl'),
  DATA_ENTRY: new RateLimiter(RATE_LIMITS.DATA_ENTRY, 'rl:data'),
  READ: new RateLimiter(RATE_LIMITS.READ, 'rl:read'),
  WRITE: new RateLimiter(RATE_LIMITS.WRITE, 'rl:write'),
  BULK_IMPORT: new RateLimiter(RATE_LIMITS.BULK_IMPORT, 'rl:bulk'),
  EXPORT: new RateLimiter(RATE_LIMITS.EXPORT, 'rl:export'),
  WEBHOOK: new RateLimiter(RATE_LIMITS.WEBHOOK, 'rl:webhook'),
  PUBLIC: new RateLimiter(RATE_LIMITS.PUBLIC, 'rl:public'),
};

// ── Express Middleware Factory ───────────────────────────────────────────────

export function rateLimitMiddleware(limitName: RateLimitName) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const limiter = rateLimiters[limitName];
    const route = req.route?.path || req.path;

    const { allowed, remaining, resetAt, total } = await limiter.checkLimit(req, route);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', total.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil(resetAt / 1000).toString());

    if (!allowed) {
      res.setHeader('Retry-After', Math.ceil((resetAt - Date.now()) / 1000).toString());
      res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        error: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((resetAt - Date.now()) / 1000),
      });
      return;
    }

    next();
  };
}

// ── Utility Functions ────────────────────────────────────────────────────────

/**
 * Create a custom rate limiter with specific config
 */
export function createRateLimiter(config: RateLimitConfig, prefix?: string) {
  return new RateLimiter(config, prefix);
}

/**
 * Get current rate limit status without incrementing
 */
export async function getRateLimitStatus(req: Request, limitName: RateLimitName): Promise<{
  current: number;
  limit: number;
  remaining: number;
  resetAt: number;
}> {
  const limiter = rateLimiters[limitName];
  const identifier = (req as unknown).merchantId
    ? `merchant:${(req as unknown).merchantId}`
    : `ip:${req.ip || 'unknown'}`;
  const route = req.route?.path || req.path;
  const key = `rl:${route}:${identifier}`;

  try {
    const now = Date.now();
    const windowStart = now - 60000; // Assuming 1 min window

    await redis.zremrangebyscore(key, 0, windowStart);
    const current = await redis.zcard(key);
    const { maxRequests } = RATE_LIMITS[limitName];

    return {
      current,
      limit: maxRequests,
      remaining: Math.max(0, maxRequests - current),
      resetAt: now + 60000,
    };
  } catch {
    return { current: 0, limit: 100, remaining: 100, resetAt: Date.now() + 60000 };
  }
}
