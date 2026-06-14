/**
 * Go4Food API - Rate Limiter
 */

import rateLimit from 'express-rate-limit';
import { config } from '../config/index.js';

export const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.',
  },
});
