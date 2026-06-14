import rateLimit from 'express-rate-limit';
import { config } from '../config';
import { redis } from '../config/redis';
import { logger } from 'utils/logger.js';

// Rate limiter for general API requests
export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise use IP
    return req.user?.userId || req.ip || 'unknown';
  },
  handler: (req, res, _next, options) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.userId,
      path: req.path
    });
    res.status(429).json(options.message);
  }
});

// Stricter rate limiter for build operations
export const buildLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 builds per minute
  message: {
    success: false,
    error: 'Too many build requests, please slow down'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.advertiserId || req.ip || 'unknown';
  }
});

// Rate limiter for NLP parsing (more expensive operation)
export const nlpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 NLP requests per minute
  message: {
    success: false,
    error: 'Too many NLP requests, please wait before trying again'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Skip rate limiting for health checks
export const skipHealthCheck = (req: { path: string }) => {
  return req.path === '/health' || req.path === '/ready';
};

export default {
  apiLimiter,
  buildLimiter,
  nlpLimiter,
  skipHealthCheck
};