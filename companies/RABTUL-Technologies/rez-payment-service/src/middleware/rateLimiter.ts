import rateLimit from 'express-rate-limit';

/**
 * General rate limiter — applies to all routes.
 * 300 requests per 15 minutes per IP.
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

/**
 * Payment endpoint rate limiter — applies to initiate, capture, create-order.
 * 20 requests per minute per IP (or per authenticated userId).
 */
export const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
  keyGenerator: (req) => {
    return (req as unknown).userId || req.ip || 'unknown';
  },
});

/**
 * Sensitive operation rate limiter — applies to refund and deduct.
 * Stricter limit: 5 requests per minute per IP (or per authenticated userId).
 */
export const sensitiveLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded for sensitive operation' },
  keyGenerator: (req) => {
    return (req as unknown).userId || req.ip || 'unknown';
  },
});
