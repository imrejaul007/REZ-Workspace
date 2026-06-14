import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { config } from '../config';
import { logger } from '../services/logger.service';

/**
 * Global Rate Limiter
 * Limits requests per IP address
 */
export const globalRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
      },
    });
  },
  keyGenerator: (req: Request) => {
    // Use user ID if authenticated, otherwise use IP
    return req.user?.userId || req.ip || 'unknown';
  },
});

/**
 * Campaign Rate Limiter
 * Limits campaign creation/modification requests
 */
export const campaignRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 campaigns per hour
  message: {
    success: false,
    error: {
      code: 'CAMPAIGN_RATE_LIMIT',
      message: 'Too many campaign operations, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return req.advertiserId || req.ip || 'unknown';
  },
});

/**
 * API Rate Limiter for different tiers
 */
export const createTieredRateLimiter = (tier: 'free' | 'pro' | 'enterprise') => {
  const limits = {
    free: { windowMs: 60 * 60 * 1000, max: 100 },
    pro: { windowMs: 60 * 60 * 1000, max: 1000 },
    enterprise: { windowMs: 60 * 60 * 1000, max: 10000 },
  };

  const limit = limits[tier];

  return rateLimit({
    windowMs: limit.windowMs,
    max: limit.max,
    message: {
      success: false,
      error: {
        code: 'TIER_RATE_LIMIT',
        message: `Rate limit exceeded for ${tier} tier`,
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      return req.advertiserId || req.ip || 'unknown';
    },
  });
};

/**
 * Strict Rate Limiter for sensitive operations
 */
export const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per 15 minutes
  message: {
    success: false,
    error: {
      code: 'STRICT_RATE_LIMIT',
      message: 'Too many sensitive operations, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

export default {
  globalRateLimiter,
  campaignRateLimiter,
  createTieredRateLimiter,
  strictRateLimiter,
};