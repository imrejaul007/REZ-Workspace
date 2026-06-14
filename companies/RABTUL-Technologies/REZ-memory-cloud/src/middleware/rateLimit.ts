/**
 * REZ Memory Cloud - Rate Limit Middleware
 */

import rateLimit from 'express-rate-limit';
import { config } from '../config/index.js';

const rateLimitMessage = 'Too many requests, please try again later';

export const defaultRateLimiter = rateLimit({
  windowMs: config.rateLimit.window,
  max: config.rateLimit.max,
  message: rateLimitMessage,
});

export const strictRateLimiter = rateLimit({
  windowMs: config.rateLimit.window,
  max: 10,
  message: 'Too many requests',
});

export const memoryWriteLimiter = rateLimit({
  windowMs: 60000,
  max: 100,
  message: 'Memory write limit exceeded',
});

export const searchLimiter = rateLimit({
  windowMs: 60000,
  max: 50,
  message: 'Search limit exceeded',
});
