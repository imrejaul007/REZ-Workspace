import rateLimit from 'express-rate-limit';

/**
 * Global rate limiter for all API routes
 */
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    error: 'Too many requests. Please try again later.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Stricter rate limiter for sensitive endpoints
 */
export const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: {
    error: 'Too many requests from this IP. Please try again later.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Auth rate limiter to prevent brute force attacks
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: {
    error: 'Too many authentication attempts. Please try again later.',
    retryAfter: 900,
  },
  standardHeaders: true,
  legacyHeaders: false,
});
