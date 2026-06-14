import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/index.js';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000');
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');

export const rateLimiter = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const key = req.ip || 'unknown';
  const now = Date.now();

  let entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    entry = {
      count: 1,
      resetTime: now + WINDOW_MS,
    };
    rateLimitStore.set(key, entry);
    next();
    return;
  }

  entry.count++;

  if (entry.count > MAX_REQUESTS) {
    logger.warn('Rate limit exceeded', {
      ip: key,
      count: entry.count,
      resetTime: new Date(entry.resetTime).toISOString(),
    });

    res.status(429).json({
      success: false,
      error: 'Too many requests',
      message: `Rate limit exceeded. Try again in ${Math.ceil((entry.resetTime - now) / 1000)} seconds`,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000),
    });
    return;
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