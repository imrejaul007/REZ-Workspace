import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for general API routes
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for checkout
 */
export const checkoutLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 checkout attempts per minute
  message: { error: 'Too many checkout attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for scanning
 */
export const scanLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 scans per minute
  message: { error: 'Too many scan requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for internal routes
 */
export const internalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // 1000 requests per minute
  message: { error: 'Rate limit exceeded' },
  standardHeaders: true,
  legacyHeaders: false,
});
