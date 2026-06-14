import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { config } from '../config';
import { logger } from '../utils/logger';

// Skip rate limiting for internal requests
const skipInternalRequests = (req: Request): boolean => {
  const internalToken = req.headers['x-internal-token'];
  return internalToken === config.internalToken;
};

// Key generator for rate limiting
const keyGenerator = (req: Request): string => {
  // Use user ID if authenticated, otherwise use IP
  const userId = (req as any).user?.userId;
  if (userId) {
    return `user:${userId}`;
  }
  return `ip:${req.ip || 'unknown'}`;
};

// AI endpoints rate limiter (stricter)
export const aiRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs, // 1 minute
  max: config.rateLimit.max, // 30 requests per window
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  skip: skipInternalRequests,
  keyGenerator,
  handler: (req: Request, res: Response): void => {
    logger.warn('AI endpoint rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      userId: (req as any).user?.userId,
      limit: config.rateLimit.max,
      windowMs: config.rateLimit.windowMs,
    });

    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many AI requests. Please wait before trying again.',
        details: {
          limit: config.rateLimit.max,
          windowMs: config.rateLimit.windowMs,
          retryAfter: Math.ceil(config.rateLimit.windowMs / 1000),
        },
      },
    });
  },
  skipFailedRequests: false,
  skipSuccessfulRequests: false,
});

// General API rate limiter (more permissive)
export const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInternalRequests,
  keyGenerator,
  handler: (req: Request, res: Response): void => {
    logger.warn('General API rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      userId: (req as any).user?.userId,
    });

    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please wait before trying again.',
        details: {
          limit: 100,
          windowMs: 60000,
          retryAfter: 60,
        },
      },
    });
  },
});

// Health check rate limiter (very permissive)
export const healthRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300, // 300 requests per minute for health checks
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response): void => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many health check requests.',
      },
    });
  },
});

// Consultation-specific rate limiter (custom limits per endpoint)
export const consultationRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20, // Stricter for consultation
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInternalRequests,
  keyGenerator: (req: Request): string => {
    // More granular: per merchant + user combination
    const merchantId = req.body?.merchantId || 'unknown';
    const userId = (req as any).user?.userId || req.ip || 'unknown';
    return `consult:${merchantId}:${userId}`;
  },
  handler: (req: Request, res: Response): void => {
    logger.warn('Consultation rate limit exceeded', {
      ip: req.ip,
      merchantId: req.body?.merchantId,
      userId: (req as any).user?.userId,
    });

    res.status(429).json({
      success: false,
      error: {
        code: 'CONSULTATION_RATE_LIMITED',
        message: 'Too many consultation requests. Please wait a moment.',
        details: {
          limit: 20,
          windowMs: 60000,
          retryAfter: 60,
        },
      },
    });
  },
});
