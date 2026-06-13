/**
 * AI Concierge Agent - Rate Limiting Middleware
 * Simple in-memory rate limiter
 */

import { Request, Response, NextFunction } from 'express';
import { RateLimitError } from '../utils/errors';
import { logger } from '../utils/logger';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000');
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000');

export const rateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const key = req.ip || 'unknown';
  const now = Date.now();

  let entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    entry = {
      count: 1,
      resetTime: now + WINDOW_MS,
    };
    rateLimitStore.set(key, entry);
    return next();
  }

  entry.count += 1;

  if (entry.count > MAX_REQUESTS) {
    logger.warn('Rate limit exceeded', { ip: key, count: entry.count });
    return next(new RateLimitError(Math.ceil((entry.resetTime - now) / 1000)));
  }

  next();
};

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, WINDOW_MS);
