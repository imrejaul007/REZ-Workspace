import rateLimit from 'express-rate-limit';
import { config } from '../../utils/config.js';

export const rateLimiter = rateLimit({
  windowMs: parseInt(config.RATE_LIMIT_WINDOW_MS),
  max: parseInt(config.RATE_LIMIT_MAX),
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMITED',
      message: 'Too many authentication attempts, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Chat limiter (higher for chat)
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 messages per minute
  message: {
    success: false,
    error: {
      code: 'CHAT_RATE_LIMITED',
      message: 'Slow down! Take a breath.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
