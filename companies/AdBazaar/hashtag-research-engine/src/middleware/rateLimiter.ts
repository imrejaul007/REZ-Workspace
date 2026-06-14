import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { logger } from 'utils/logger.js';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 1000);

export const rateLimiter = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const ip = req.ip || 'unknown';
  const key = `rate_limit:${ip}`;
  const now = Date.now();

  let entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    entry = {
      count: 1,
      resetTime: now + config.rateLimit.windowMs,
    };
    rateLimitStore.set(key, entry);
    next();
    return;
  }

  entry.count++;

  if (entry.count > config.rateLimit.maxRequests) {
    logger.warn('Rate limit exceeded', {
      ip,
      count: entry.count,
      limit: config.rateLimit.maxRequests,
    });

    res.status(429).json({
      success: false,
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${Math.ceil((entry.resetTime - now) / 1000)} seconds`,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000),
    });
    return;
  }

  res.setHeader('X-RateLimit-Limit', config.rateLimit.maxRequests);
  res.setHeader('X-RateLimit-Remaining', config.rateLimit.maxRequests - entry.count);
  res.setHeader('X-RateLimit-Reset', entry.resetTime);

  next();
};

export const resetRateLimit = (ip: string): void => {
  rateLimitStore.delete(`rate_limit:${ip}`);
};