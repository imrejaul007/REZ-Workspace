import { Request, Response, NextFunction } from 'express';
import { config } from '../config/index.js';
import { AppError } from '../utils/errors.js';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);

export function rateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const key = req.ip || 'unknown';
  const now = Date.now();

  let entry = rateLimitStore.get(key);

  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + config.rateLimit.windowMs,
    };
    rateLimitStore.set(key, entry);
  }

  entry.count++;

  if (entry.count > config.rateLimit.maxRequests) {
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many requests',
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      },
    });
    return;
  }

  res.setHeader('X-RateLimit-Limit', config.rateLimit.maxRequests.toString());
  res.setHeader('X-RateLimit-Remaining', (config.rateLimit.maxRequests - entry.count).toString());
  res.setHeader('X-RateLimit-Reset', entry.resetTime.toString());

  next();
}

export function clearRateLimitStore(): void {
  rateLimitStore.clear();
}
