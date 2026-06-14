import { Request, Response, NextFunction } from 'express';

/**
 * Internal service authentication middleware
 * Validates the X-Internal-Token header for service-to-service communication
 */
export function authMiddleware(validToken: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const token = req.headers['x-internal-token'] as string;

    if (!token) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing X-Internal-Token header'
      });
      return;
    }

    if (token !== validToken) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Invalid internal service token'
      });
      return;
    }

    next();
  };
}

/**
 * Optional auth middleware that allows requests without token
 * Useful for endpoints that can be called with or without auth
 */
export function optionalAuthMiddleware(validToken: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const token = req.headers['x-internal-token'] as string;

    // If token is provided, validate it
    if (token && token !== validToken) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Invalid internal service token'
      });
      return;
    }

    // Attach auth status to request
    (req as any).isAuthenticated = !!token;

    next();
  };
}

/**
 * Rate limiting middleware for internal services
 * Simple in-memory implementation
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function rateLimitMiddleware(maxRequests: number = 100, windowMs: number = 60000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || 'unknown';
    const now = Date.now();

    let record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + windowMs };
      rateLimitStore.set(key, record);
    }

    record.count++;

    if (record.count > maxRequests) {
      res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      });
      return;
    }

    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', (maxRequests - record.count).toString());
    res.setHeader('X-RateLimit-Reset', record.resetTime.toString());

    next();
  };
}

// Cleanup old rate limit records every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);