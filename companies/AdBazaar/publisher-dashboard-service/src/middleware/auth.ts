import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { config } from '../config';
import logger from '../utils/logger';

const serviceLogger = logger.child({ service: 'authMiddleware' });

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      publisherId?: string;
      userId?: string;
      internalServiceToken?: string;
    }
  }
}

// Internal service authentication schema
const internalAuthSchema = z.object({
  'x-internal-token': z.string().optional(),
  'x-publisher-id': z.string().optional(),
  'x-user-id': z.string().optional(),
});

// Rate limiting storage (in-memory, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Middleware for internal service authentication
 */
export const internalServiceAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['x-internal-token'] as string;

  if (!token) {
    serviceLogger.warn('Missing internal service token', {
      path: req.path,
      ip: req.ip
    });
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Missing internal service token'
    });
  }

  if (token !== config.security.internalServiceToken) {
    serviceLogger.warn('Invalid internal service token', {
      path: req.path,
      ip: req.ip
    });
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid internal service token'
    });
  }

  // Extract publisher ID if present
  req.internalServiceToken = token;
  req.publisherId = req.headers['x-publisher-id'] as string;
  req.userId = req.headers['x-user-id'] as string;

  next();
};

/**
 * Optional authentication - sets publisher ID if token is valid
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['x-internal-token'] as string;

  if (token && token === config.security.internalServiceToken) {
    req.internalServiceToken = token;
    req.publisherId = req.headers['x-publisher-id'] as string;
    req.userId = req.headers['x-user-id'] as string;
  }

  next();
};

/**
 * Rate limiting middleware
 */
export const rateLimiter = (maxRequests: number = 100, windowMs: number = 60000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientId = req.ip || 'unknown';
    const now = Date.now();
    const key = `rate_limit:${clientId}`;

    let record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 0,
        resetTime: now + windowMs
      };
      rateLimitStore.set(key, record);
    }

    record.count++;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count).toString());
    res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());

    if (record.count > maxRequests) {
      serviceLogger.warn('Rate limit exceeded', {
        clientId,
        count: record.count,
        limit: maxRequests
      });

      return res.status(429).json({
        success: false,
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      });
    }

    next();
  };
};

/**
 * Request logging middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // Log request
  serviceLogger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  // Log response on finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    serviceLogger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
  });

  next();
};

/**
 * Error handling middleware
 */
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  serviceLogger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
  });
};

/**
 * Validation middleware using Zod
 */
export const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          details: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        });
      }
      next(error);
    }
  };
};

/**
 * Publisher ID extraction middleware
 */
export const extractPublisherId = (req: Request, res: Response, next: NextFunction) => {
  const publisherId = req.params.publisherId || req.headers['x-publisher-id'];

  if (!publisherId) {
    return res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: 'Publisher ID is required'
    });
  }

  req.publisherId = publisherId as string;
  next();
};

export default {
  internalServiceAuth,
  optionalAuth,
  rateLimiter,
  requestLogger,
  errorHandler,
  validateRequest,
  extractPublisherId
};