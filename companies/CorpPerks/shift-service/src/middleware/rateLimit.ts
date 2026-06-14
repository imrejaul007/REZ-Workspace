import { Request, Response, NextFunction } from 'express';

// Simple in-memory rate limiter (use Redis in production)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiting middleware
 * Limits requests per IP address
 */
export function rateLimit(
  windowMs: number = 60000, // 1 minute
  maxRequests: number = 100
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    let record = requestCounts.get(ip);

    if (!record || now > record.resetTime) {
      // Start new window
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      requestCounts.set(ip, record);
      next();
      return;
    }

    record.count++;

    if (record.count > maxRequests) {
      res.status(429).json({
        success: false,
        error: 'Too many requests',
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      });
      return;
    }

    next();
  };
}

/**
 * Stricter rate limit for sensitive endpoints
 */
export function strictRateLimit(
  windowMs: number = 60000, // 1 minute
  maxRequests: number = 10
) {
  return rateLimit(windowMs, maxRequests);
}

/**
 * Cleanup old entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of requestCounts) {
    if (now > record.resetTime + 60000) {
      requestCounts.delete(ip);
    }
  }
}, 60000); // Run every minute
