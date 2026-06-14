/**
 * Rate Limiting Middleware for Grocery Service
 *
 * Handles:
 * - General API rate limiting
 * - Authentication rate limiting
 * - Custom rate limiters
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import logger from '../utils/logger';

// Message for rate limit exceeded
const rateLimitMessage = {
  success: false,
  error: 'Too many requests, please try again later',
  retryAfter: 60
};

/**
 * General API rate limiter
 * - 100 requests per 15 minutes per IP
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: rateLimitMessage,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response, _next, options) => {
    logger.warn(`[RateLimit] General limit exceeded from IP`);
    res.status(429).json(options.message);
  },
  skip: (req: Request) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/ready';
  }
});

/**
 * Authentication rate limiter
 * - 5 attempts per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later',
    retryAfter: 900 // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response, _next, options) => {
    logger.warn(`[RateLimit] Auth limit exceeded from IP`);
    res.status(429).json(options.message);
  }
});

/**
 * Strict rate limiter for sensitive operations
 * - 10 requests per minute per IP
 */
export const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: {
    success: false,
    error: 'Rate limit exceeded for this operation',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Bulk operations rate limiter
 * - 5 requests per minute per IP
 */
export const bulkOperationsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: {
    success: false,
    error: 'Bulk operation rate limit exceeded',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Create a custom rate limiter
 */
export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      success: false,
      error: options.message || 'Too many requests',
      retryAfter: Math.ceil(options.windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: options.keyGenerator || ((req: Request) => req.ip || 'unknown')
  });
}

/**
 * Rate limiter based on merchant
 */
export function merchantRateLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500,
    keyGenerator: (req: Request) => {
      // Use merchantId from user or body
      const merchantId = req.user?.merchantId || req.body?.merchantId || req.query?.merchantId;
      return merchantId || req.ip || 'unknown';
    },
    message: {
      success: false,
      error: 'Too many requests for this merchant',
      retryAfter: 900
    },
    standardHeaders: true,
    legacyHeaders: false
  });
}

/**
 * Rate limiter for barcode scanning (high throughput)
 */
export const barcodeScanLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 1 per second on average
  message: {
    success: false,
    error: 'Barcode scan rate limit exceeded',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter for supplier orders
 */
export const supplierOrderLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: {
    success: false,
    error: 'Supplier order rate limit exceeded',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Skip rate limiting for internal services
 */
export function internalServiceSkipper(req: Request): boolean {
  const token = req.headers['x-internal-token'];
  return !!token;
}

/**
 * Create skipper function for specific paths
 */
export function pathSkipper(paths: string[]) {
  return (req: Request): boolean => {
    return paths.some(path => req.path.startsWith(path));
  };
}