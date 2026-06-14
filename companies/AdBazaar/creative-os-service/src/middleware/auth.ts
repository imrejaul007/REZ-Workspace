import { Request, Response, NextFunction } from 'express';
import { logger } from 'utils/logger.js';

// Internal service authentication middleware
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Get internal service token from header
  const internalToken = req.headers['x-internal-token'] as string;
  const serviceKey = process.env.INTERNAL_SERVICE_KEY;

  // Skip auth for health and metrics endpoints (handled in index.ts)
  if (req.path === '/health' || req.path === '/metrics') {
    next();
    return;
  }

  // If no service key configured, allow all requests (development mode)
  if (!serviceKey) {
    req.serviceId = 'internal-service';
    next();
    return;
  }

  // Validate internal token
  if (!internalToken) {
    logger.warn('Missing internal token', { ip: req.ip, path: req.path });
    res.status(401).json({
      success: false,
      error: {
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      }
    });
    return;
  }

  if (internalToken !== serviceKey) {
    logger.warn('Invalid internal token', { ip: req.ip, path: req.path });
    res.status(403).json({
      success: false,
      error: {
        message: 'Invalid authentication token',
        code: 'INVALID_TOKEN'
      }
    });
    return;
  }

  // Extract service ID from header or use default
  req.serviceId = (req.headers['x-service-id'] as string) || 'internal-service';
  next();
};

// Optional: Rate limiting middleware for specific routes
export const rateLimitMiddleware = (maxRequests: number = 100, windowMs: number = 60000) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const requestData = requests.get(key);

    if (!requestData || now > requestData.resetTime) {
      requests.set(key, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }

    if (requestData.count >= maxRequests) {
      const retryAfter = Math.ceil((requestData.resetTime - now) / 1000);
      res.status(429).json({
        success: false,
        error: {
          message: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter
        }
      });
      return;
    }

    requestData.count++;
    next();
  };
};

// Request validation middleware helper
export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error: any) {
      logger.warn('Request validation failed', { errors: error.errors });
      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid request body',
          code: 'VALIDATION_ERROR',
          details: error.errors
        }
      });
    }
  };
};

// Error handler wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};