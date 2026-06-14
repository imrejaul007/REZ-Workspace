import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

// Internal service token validation
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'yield-platform-internal-token';

/**
 * Middleware to validate internal service authentication
 */
export const internalServiceAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['x-internal-token'] as string;

  if (!token) {
    logger.warn('Missing internal service token', {
      path: req.path,
      method: req.method,
      ip: req.ip
    });
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Internal service token is required'
    });
  }

  if (token !== INTERNAL_SERVICE_TOKEN) {
    logger.warn('Invalid internal service token', {
      path: req.path,
      method: req.method,
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
 * Optional auth middleware - sets user context if token provided
 */
export const optionalAuth = (req: Request, _res: Response, next: NextFunction) => {
  const token = req.headers['x-internal-token'] as string;

  if (token && token === INTERNAL_SERVICE_TOKEN) {
    (req as any).internalService = true;
  }

  next();
};

/**
 * Rate limiting middleware for internal services
 */
export const serviceRateLimit = (maxRequests: number = 1000) => {
  const requestCounts = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const serviceId = req.headers['x-service-id'] as string || req.ip;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window

    let serviceData = requestCounts.get(serviceId);

    if (!serviceData || now > serviceData.resetTime) {
      serviceData = { count: 0, resetTime: now + windowMs };
      requestCounts.set(serviceId, serviceData);
    }

    serviceData.count++;

    if (serviceData.count > maxRequests) {
      logger.warn('Rate limit exceeded', {
        serviceId,
        count: serviceData.count,
        limit: maxRequests
      });
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded for internal service',
        retryAfter: Math.ceil((serviceData.resetTime - now) / 1000)
      });
    }

    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', (maxRequests - serviceData.count).toString());
    res.setHeader('X-RateLimit-Reset', serviceData.resetTime.toString());

    next();
  };
};

/**
 * Validate request body against Zod schema
 */
export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Request body validation failed',
          details: result.error.errors
        });
      }
      req.body = result.data;
      next();
    } catch (error) {
      logger.error('Validation error', { error });
      res.status(500).json({
        error: 'Internal Error',
        message: 'Validation processing failed'
      });
    }
  };
};

/**
 * Error handling middleware
 */
export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message
  });
};

/**
 * Request logging middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  });

  next();
};