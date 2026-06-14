import rateLimit from 'express-rate-limit';
import config from '../config';
import logger from '../utils/logger';

/**
 * General rate limiter for all requests
 */
export const generalRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests, please try again later',
  },
  handler: (req, res, next, options) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    res.status(429).json(options.message);
  },
  keyGenerator: (req) => {
    // Use X-Forwarded-For if behind a proxy, otherwise use IP
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown';
  },
});

/**
 * Strict rate limiter for verification endpoints
 */
export const verificationRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 attempts per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    code: 'VERIFICATION_RATE_LIMITED',
    message: 'Too many verification attempts, please try again later',
  },
  handler: (req, res, next, options) => {
    logger.warn('Verification rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      userId: (req.body as unknown)?.userId,
    });
    res.status(429).json(options.message);
  },
  keyGenerator: (req) => {
    const userId = (req.body as unknown)?.userId;
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip;
    return `${ip}:${userId || 'anonymous'}`;
  },
});

/**
 * Rate limiter for backup code attempts
 */
export const backupCodeRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 backup code attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    code: 'BACKUP_CODE_RATE_LIMITED',
    message: 'Too many backup code attempts, please try again later',
  },
  keyGenerator: (req) => {
    const userId = (req.body as unknown)?.userId;
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip;
    return `backup:${ip}:${userId || 'anonymous'}`;
  },
});

/**
 * Rate limiter for recovery requests
 */
export const recoveryRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 recovery attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    code: 'RECOVERY_RATE_LIMITED',
    message: 'Too many recovery requests, please try again later',
  },
  keyGenerator: (req) => {
    const userId = (req.body as unknown)?.userId;
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip;
    return `recovery:${ip}:${userId || 'anonymous'}`;
  },
});
