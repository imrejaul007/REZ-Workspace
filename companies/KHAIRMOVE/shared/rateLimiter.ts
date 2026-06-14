/**
 * Rate Limiting Utilities for KHAIRMOVE Services
 *
 * Production-ready rate limiting configurations
 */

import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { Request, Response } from 'express';

// ============================================
// RATE LIMITER FACTORIES
// ============================================

/**
 * Global API rate limiter
 * 100 requests per 15 minutes per IP
 */
export function createGlobalLimiter(): RateLimitRequestHandler {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later.',
        retryAfter: '15 minutes',
      },
    },
    keyGenerator: (req: Request) => {
      // Use X-Forwarded-For if behind a proxy, otherwise use IP
      return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
 || req.ip
        || 'unknown';
    },
  });
}

/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per 15 minutes per IP
 */
export function createAuthLimiter(): RateLimitRequestHandler {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        message: 'Too many authentication attempts, please try again later.',
        retryAfter: '15 minutes',
      },
    },
    keyGenerator: (req: Request) => {
      // Use phone number or email if available, otherwise IP
      const phone = req.body?.phone;
      const email = req.body?.email;
      if (phone) return `phone:${phone}`;
      if (email) return `email:${email}`;
      return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
        || req.ip
        || 'unknown';
    },
  });
}

/**
 * OTP verification rate limiter
 * 3 attempts per 15 minutes per phone
 */
export function createOTPLimiter(): RateLimitRequestHandler {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // limit each phone to 3 OTP attempts per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'OTP_RATE_LIMIT_EXCEEDED',
        message: 'Too many OTP attempts, please try again later.',
        retryAfter: '15 minutes',
      },
    },
    keyGenerator: (req: Request) => {
      const phone = req.body?.phone || req.query?.phone;
      if (phone) return `otp:${phone}`;
      return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
        || req.ip
        || 'unknown';
    },
  });
}

/**
 * Sensitive operations rate limiter
 * 10 requests per minute per user
 */
export function createSensitiveLimiter(): RateLimitRequestHandler {
  return rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // limit each user to 10 requests per minute
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'SENSITIVE_OPERATION_LIMIT_EXCEEDED',
        message: 'Too many requests for this operation, please slow down.',
        retryAfter: '1 minute',
      },
    },
    keyGenerator: (req: Request) => {
      // Use user ID if authenticated, otherwise IP
      const userId = (req as any).user?.userId;
      if (userId) return `user:${userId}`;
      return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
        || req.ip
        || 'unknown';
    },
  });
}

/**
 * Search/data endpoints rate limiter
 * 30 requests per minute per IP
 */
export function createSearchLimiter(): RateLimitRequestHandler {
  return rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'SEARCH_LIMIT_EXCEEDED',
        message: 'Too many search requests, please slow down.',
        retryAfter: '1 minute',
      },
    },
  });
}

/**
 * Write operations rate limiter
 * 20 requests per minute per user
 */
export function createWriteLimiter(): RateLimitRequestHandler {
  return rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'WRITE_LIMIT_EXCEEDED',
        message: 'Too many write operations, please slow down.',
        retryAfter: '1 minute',
      },
    },
    keyGenerator: (req: Request) => {
      const userId = (req as any).user?.userId;
      if (userId) return `user:${userId}`;
      return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
        || req.ip
        || 'unknown';
    },
  });
}

// ============================================
// SKIP FUNCTION FOR TESTING
// ============================================

/**
 * Skip rate limiting for test environment
 */
export function skipInTest(): boolean {
  return process.env.NODE_ENV === 'test';
}
