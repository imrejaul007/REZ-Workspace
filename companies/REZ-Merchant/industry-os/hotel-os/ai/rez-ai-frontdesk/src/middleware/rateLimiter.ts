/**
 * Rate limiting middleware for AI Front Desk Service
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

// Simple in-memory rate limiter (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Clean up expired entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Max requests per window
  message?: string;
  keyGenerator?: (req: Request) => string;
}

export function rateLimiter(options: RateLimitOptions) {
  const {
    windowMs = 60000, // 1 minute default
    max = 100,
    message = 'Too many requests, please try again later',
    keyGenerator = (req: Request) => req.ip || 'unknown',
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = keyGenerator(req);
    const now = Date.now();
    const windowStart = now - windowMs;

    let record = rateLimitStore.get(key);

    // Reset if window has passed
    if (!record || record.resetTime < now) {
      record = { count: 0, resetTime: now + windowMs };
      rateLimitStore.set(key, record);
    }

    record.count++;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', max.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count).toString());
    res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());

    if (record.count > max) {
      logger.warn('Rate limit exceeded', { key, count: record.count, limit: max });
      res.status(429).json({
        success: false,
        error: message,
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      });
      return;
    }

    next();
  };
}

// Preset rate limiters
export const standardLimiter = rateLimiter({
  windowMs: 60000,
  max: 100,
  message: 'Too many requests, please try again later',
});

export const strictLimiter = rateLimiter({
  windowMs: 60000,
  max: 10,
  message: 'Too many requests from this IP, please try again later',
});

export const authLimiter = rateLimiter({
  windowMs: 900000, // 15 minutes
  max: 5,
  message: 'Too many authentication attempts, please try again later',
});

export default {
  rateLimiter,
  standardLimiter,
  strictLimiter,
  authLimiter,
};