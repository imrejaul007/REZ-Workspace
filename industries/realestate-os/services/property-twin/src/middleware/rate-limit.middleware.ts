import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { logger } from '../utils/logger';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 2000, // 2000 requests per minute (per INTEGRATION-SPEC.md)
  message: {
    success: false,
    error: 'Too Many Requests',
    message: 'Rate limit exceeded. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response): void => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`, {
      path: req.path,
      method: req.method,
    });
    res.status(429).json({
      success: false,
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});

// Property operations rate limiter (more restrictive)
export const propertyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute for property operations
  message: {
    success: false,
    error: 'Too Many Requests',
    message: 'Property operation rate limit exceeded.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Search rate limiter
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // 50 search requests per minute
  message: {
    success: false,
    error: 'Too Many Requests',
    message: 'Search rate limit exceeded.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// WebSocket connection limiter
export const wsConnectionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 WebSocket connections per minute
  message: {
    success: false,
    error: 'Too Many Requests',
    message: 'WebSocket connection limit exceeded.',
  },
  keyGenerator: (req: Request): string => {
    // Use API key or IP for WebSocket connections
    return (req as any).apiKey || req.ip || 'unknown';
  },
});

// PropFlow AI rate limiter (most restrictive per INTEGRATION-SPEC.md)
export const propflowLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // 200 requests per minute for PropFlow AI endpoints
  message: {
    success: false,
    error: 'Too Many Requests',
    message: 'PropFlow AI rate limit exceeded.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
