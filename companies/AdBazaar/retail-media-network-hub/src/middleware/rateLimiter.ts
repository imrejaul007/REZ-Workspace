import { Request, Response, NextFunction } from 'express';
import { config } from '../config/index.js';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export function rateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const clientId = req.ip || 'unknown';
  const currentTime = Date.now();
  const windowMs = config.rateLimit.windowMs;
  const maxRequests = config.rateLimit.maxRequests;

  const record = store[clientId];

  if (!record || currentTime > record.resetTime) {
    store[clientId] = {
      count: 1,
      resetTime: currentTime + windowMs,
    };
    next();
    return;
  }

  if (record.count >= maxRequests) {
    const retryAfter = Math.ceil((record.resetTime - currentTime) / 1000);
    res.status(429).json({
      success: false,
      error: 'Too many requests',
      retryAfter,
    });
    return;
  }

  record.count++;
  next();
}

// Clean up expired entries periodically
setInterval(() => {
  const currentTime = Date.now();
  for (const key in store) {
    if (currentTime > store[key].resetTime) {
      delete store[key];
    }
  }
}, 60000); // Clean every minute