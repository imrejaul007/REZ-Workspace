import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  serviceId?: string;
  userId?: string;
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // Check for internal service token (service-to-service auth)
  const internalToken = req.headers['x-internal-token'] as string;
  const serviceToken = process.env.INTERNAL_SERVICE_TOKEN;

  // Check for user JWT token (user auth)
  const authHeader = req.headers['authorization'];
  const bearerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  // If internal service token is provided, validate it
  if (internalToken && serviceToken) {
    if (internalToken === serviceToken) {
      req.serviceId = 'internal-service';
      next();
      return;
    } else {
      // Timing-safe comparison for internal token
      const crypto = require('crypto');
      try {
        const isValid = crypto.timingSafeEqual(
          Buffer.from(internalToken),
          Buffer.from(serviceToken)
        );
        if (isValid) {
          req.serviceId = 'internal-service';
          next();
          return;
        }
      } catch {
        // Buffers of different lengths
      }
    }
  }

  // If bearer token is provided, it would be validated here
  // For now, we accept it and extract user info (in production, verify JWT)
  if (bearerToken) {
    try {
      // In production, verify JWT and extract userId
      // For now, accept any bearer token and set a placeholder
      req.userId = 'authenticated-user';
      next();
      return;
    } catch (error) {
      logger.error('Token validation error:', error);
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid authentication token',
        },
      });
      return;
    }
  }

  // No valid authentication provided
  res.status(401).json({
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    },
  });
};

// Rate limiting state (in production, use Redis)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const rateLimiter = (
  maxRequests: number = 100,
  windowMs: number = 60000
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const identifier = req.ip || 'unknown';
    const now = Date.now();

    let record = requestCounts.get(identifier);

    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + windowMs };
      requestCounts.set(identifier, record);
    }

    record.count++;

    if (record.count > maxRequests) {
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((record.resetTime - now) / 1000),
        },
      });
      return;
    }

    next();
  };
};

// Error handling middleware
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error('Unhandled error:', err);

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message,
    },
  });
};
