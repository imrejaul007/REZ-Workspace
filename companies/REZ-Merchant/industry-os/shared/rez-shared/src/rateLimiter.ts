import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { createLogger } from './logger';

const logger = createLogger({ serviceName: 'rate-limiter' });

export interface RateLimiterOptions {
  windowMs?: number;
  max?: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}

/**
 * Create rate limiter middleware with standard configuration
 */
export function createRateLimiter(options: RateLimiterOptions = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // 100 requests per window
    message = 'Too many requests, please try again later',
    keyGenerator,
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message,
      },
    },
    keyGenerator: keyGenerator || ((req: Request) => {
      // Use user ID if authenticated, otherwise IP
      const userId = (req as any).user?.userId;
      return userId || req.ip || 'unknown';
    }),
    handler: (req, res, next, options) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userId: (req as any).user?.userId,
        path: req.path,
      });
      res.status(429).json(options.message);
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
}

/**
 * Strict rate limiter for auth endpoints
 */
export function createAuthRateLimiter() {
  return createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many authentication attempts, please try again later',
  });
}

/**
 * Relaxed rate limiter for read endpoints
 */
export function createReadRateLimiter() {
  return createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 200,
    message: 'Too many read requests',
  });
}

/**
 * Strict rate limiter for write endpoints
 */
export function createWriteRateLimiter() {
  return createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 50,
    message: 'Too many write requests',
  });
}

/**
 * Rate limiter for internal services
 */
export function createInternalRateLimiter() {
  return createRateLimiter({
    windowMs: 60 * 1000,
    max: 1000,
    message: 'Internal rate limit exceeded',
    keyGenerator: (req: Request) => {
      // Use service name from header or IP
      return (req.headers['x-service-name'] as string) || req.ip || 'internal';
    },
  });
}

export default {
  createRateLimiter,
  createAuthRateLimiter,
  createReadRateLimiter,
  createWriteRateLimiter,
  createInternalRateLimiter,
};
