/**
 * LEDGERAI - Rate Limiting Middleware
 * Express Rate Limit with Redis store support
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import config from '../config';
import logger from './logger';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs, // 15 minutes
  max: config.rateLimit.maxRequests, // 100 requests per window
  message: {
    success: false,
    error: 'Too many requests, please try again later',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: Math.ceil(config.rateLimit.windowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      userId: req.user?.userId
    });

    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(config.rateLimit.windowMs / 1000)
    });
  },
  keyGenerator: (req: Request): string => {
    // Use user ID if authenticated, otherwise use IP
    return req.user?.userId || req.ip || 'unknown';
  },
  skip: (req: Request): boolean => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/ready';
  }
});

// Stricter rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 attempts per window
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    retryAfter: 900 // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      email: req.body?.email
    });

    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts, please try again later',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      retryAfter: 900
    });
  },
  keyGenerator: (req: Request): string => {
    // Use IP + email combination to prevent distributed attacks
    const email = req.body?.email || 'unknown';
    return `${req.ip}-${email}`;
  }
});

// Rate limiter for AI endpoints (expensive operations)
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 AI requests per minute
  message: {
    success: false,
    error: 'AI request limit exceeded, please slow down',
    code: 'AI_RATE_LIMIT_EXCEEDED',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('AI rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      userId: req.user?.userId
    });

    res.status(429).json({
      success: false,
      error: 'AI request limit exceeded, please slow down',
      code: 'AI_RATE_LIMIT_EXCEEDED',
      retryAfter: 60
    });
  },
  keyGenerator: (req: Request): string => {
    return req.user?.userId || req.ip || 'unknown';
  }
});

// Rate limiter for write operations
export const writeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 writes per minute
  message: {
    success: false,
    error: 'Write operation limit exceeded',
    code: 'WRITE_RATE_LIMIT_EXCEEDED',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    return req.user?.userId || req.ip || 'unknown';
  }
});

export default {
  apiLimiter,
  authLimiter,
  aiLimiter,
  writeLimiter
};