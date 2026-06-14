import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Internal service authentication middleware
 * Validates internal service tokens for inter-service communication
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const internalToken = req.headers['x-internal-token'] as string;
  const serviceToken = process.env.INTERNAL_SERVICE_TOKEN;

  // Skip auth in development if no token configured
  if (!serviceToken) {
    return next();
  }

  if (!internalToken) {
    logger.warn('Missing internal token', {
      path: req.path,
      ip: req.ip
    });
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing internal service token'
    });
  }

  if (internalToken !== serviceToken) {
    logger.warn('Invalid internal token', {
      path: req.path,
      ip: req.ip
    });
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid internal service token'
    });
  }

  next();
};

/**
 * Optional auth middleware that doesn't block requests without tokens
 */
export const optionalAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const internalToken = req.headers['x-internal-token'] as string;
  const serviceToken = process.env.INTERNAL_SERVICE_TOKEN;

  if (serviceToken && internalToken && internalToken === serviceToken) {
    (req as any).internalAuth = true;
  }

  next();
};

/**
 * Rate limiting middleware for external API
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export const rateLimitMiddleware = (
  maxRequests: number = 100,
  windowMs: number = 60000
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();

    let record = rateLimitMap.get(key);

    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + windowMs };
      rateLimitMap.set(key, record);
    }

    record.count++;

    if (record.count > maxRequests) {
      logger.warn('Rate limit exceeded', { ip: key, count: record.count });
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      });
    }

    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', (maxRequests - record.count).toString());
    res.setHeader('X-RateLimit-Reset', record.resetTime.toString());

    next();
  };
};

export default authMiddleware;