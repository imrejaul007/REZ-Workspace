import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import logger from '../config/logger';

// General API rate limiter
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    error: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later',
    });
  },
});

// Stricter rate limiter for creation endpoints
export const createRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 audience twins per hour
  message: {
    success: false,
    error: 'Audience twin creation limit exceeded',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return (req as { user?: { userId: string } }).user?.userId || req.ip || 'unknown';
  },
});

// Prediction rate limiter
export const predictionRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // 50 predictions per minute
  message: {
    success: false,
    error: 'Prediction request limit exceeded',
  },
  standardHeaders: true,
  legacyHeaders: false,
});