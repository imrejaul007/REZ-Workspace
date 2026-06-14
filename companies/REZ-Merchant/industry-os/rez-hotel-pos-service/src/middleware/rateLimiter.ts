import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { logger } from '../config/logger';

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 300; // 300 requests per window

export const generalLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX_REQUESTS,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
    });
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later',
    });
  },
  keyGenerator: (req: Request): string => {
    // Use X-Forwarded-For if behind a proxy, otherwise use IP
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      return typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : forwarded[0];
    }
    return req.ip || 'unknown';
  },
});

export const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: {
    success: false,
    message: 'Too many requests, please slow down',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      return typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : forwarded[0];
    }
    return req.ip || 'unknown';
  },
});
