/**
 * Rate limiting middleware
 */

import rateLimit from 'express-rate-limit';
import config from '../config';

export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: { success: false, error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Stricter for auth endpoints
  message: { success: false, error: 'Too many authentication attempts' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const bookingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Per-minute booking limit
  message: { success: false, error: 'Too many booking requests' },
  standardHeaders: true,
  legacyHeaders: false,
});
