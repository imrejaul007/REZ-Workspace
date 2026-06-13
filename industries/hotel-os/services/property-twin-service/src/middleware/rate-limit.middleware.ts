import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later.',
      retryAfter: Math.round(parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10) / 1000),
    });
  },
});

// Stricter limiter for write operations
export const writeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: {
    success: false,
    error: 'Too many write requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Lighter limiter for read operations
export const readLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: {
    success: false,
    error: 'Too many read requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
