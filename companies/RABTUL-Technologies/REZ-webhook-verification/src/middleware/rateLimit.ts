/**
 * Rate limiting middleware
 */

import rateLimit from 'express-rate-limit';
import { config } from '../utils/config';
import { logger } from '../utils/logger';

export const rateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests, please try again later'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    res.status(429).json(options.message);
  },
  keyGenerator: (req) => {
    // Use X-Internal-Token if present, otherwise use IP
    return (req.headers['x-internal-token'] as string) || req.ip || 'unknown';
  }
});

// Stricter rate limit for verification endpoint
export const verificationRateLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 500, // 500 requests per minute
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many verification requests'
    }
  }
});
