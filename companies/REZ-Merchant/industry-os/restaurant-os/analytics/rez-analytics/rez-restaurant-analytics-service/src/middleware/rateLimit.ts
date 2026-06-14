import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// General API rate limit
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limit for dashboard endpoints
export const dashboardLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Dashboard rate limit exceeded, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limit for report generation
export const reportLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 report requests per minute
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Report generation rate limit exceeded',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
