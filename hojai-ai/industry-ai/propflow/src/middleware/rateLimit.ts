/**
 * PROPFLOW - Real Estate AI Operating System
 * Rate Limiting & Request ID Middleware
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { logger } from '../config/logger';

// ============================================
// REQUEST ID MIDDLEWARE
// ============================================

export const requestId = (
  req: Request,
  res: Response,
  next: () => void
): void => {
  const requestId = (req.headers['x-request-id'] as string) || uuidv4();
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
};

// ============================================
// RATE LIMITERS
// ============================================

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: {
    success: false,
    error: 'Too many requests, please try again later',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: Math.ceil(config.rateLimitWindowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    res.status(options.statusCode).json(options.message);
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path.startsWith('/health');
  }
});

// Authentication rate limiter (stricter)
export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      path: req.path
    });
    res.status(options.statusCode).json(options.message);
  }
});

// AI endpoints rate limiter (specific for AI operations)
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: {
    success: false,
    error: 'AI request limit exceeded, please slow down',
    code: 'AI_RATE_LIMIT_EXCEEDED',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Write operations rate limiter
export const writeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50,
  message: {
    success: false,
    error: 'Too many write operations, please slow down',
    code: 'WRITE_RATE_LIMIT_EXCEEDED',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Search endpoints rate limiter
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  message: {
    success: false,
    error: 'Search limit exceeded, please try again later',
    code: 'SEARCH_RATE_LIMIT_EXCEEDED',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

export default {
  requestId,
  apiLimiter,
  authLimiter,
  aiLimiter,
  writeLimiter,
  searchLimiter
};