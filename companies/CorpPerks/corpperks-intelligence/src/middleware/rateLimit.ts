// Rate Limiting Middleware
// Prevents abuse and DoS attacks

import rateLimit from 'express-rate-limit';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests, please try again later',
    retryAfter: '15 minutes',
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
});

// Stricter limiter for auth-related endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later',
    retryAfter: '15 minutes',
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limiter for write operations
export const writeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 requests per windowMs
  message: {
    success: false,
    error: 'Too many write operations, please slow down',
    retryAfter: '1 minute',
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limiter for AI/Copilot endpoints (expensive operations)
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 AI requests per minute
  message: {
    success: false,
    error: 'Too many AI requests, please wait before trying again',
    retryAfter: '1 minute',
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
});
