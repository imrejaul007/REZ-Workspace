/**
 * REZ Security Middleware - Rate Limiting
 * Copy to: src/middleware/rateLimit.ts
 *
 * Usage in index.ts:
 *   import { apiLimiter, strictLimiter } from './middleware/rateLimit';
 *   app.use('/api', apiLimiter);
 *   app.post('/sensitive', strictLimiter);
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
           || req.ip
           || req.socket.remoteAddress
           || 'unknown';
  },
  message: { success: false, error: 'Too many requests, please try again later' },
  skip: (req: Request) => req.path === '/health',
});

/**
 * Strict rate limiter for sensitive operations
 * 10 requests per minute per IP
 */
export const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
           || req.ip
           || req.socket.remoteAddress
           || 'unknown';
  },
  message: { success: false, error: 'Too many attempts, please slow down' },
});

/**
 * Auth rate limiter for login/register endpoints
 * 5 requests per minute per IP
 */
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
           || req.ip
           || 'unknown';
  },
  message: { success: false, error: 'Too many authentication attempts' },
});
