/**
 * Lead Intelligence Service - Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { logger } from '@rez/shared';

/**
 * Validation error handler
 */
export const validationErrorHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: errors.array(),
      },
    });
    return;
  }
  next();
};

/**
 * Async handler wrapper to catch promise rejections
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
};

/**
 * Global error handler
 */
export const errorHandler = (
  err: Error & { statusCode?: number; code?: string },
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const errorCode = err.code || 'INTERNAL_ERROR';

  logger.error('[Error Handler]', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: statusCode === 500 ? 'Internal server error' : err.message,
    },
  });
};

/**
 * Request logger middleware
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('[Request]', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      requestId: req.headers['x-request-id'],
    });
  });

  next();
};

/**
 * Rate limiter helper (placeholder - use express-rate-limit in production)
 */
export const rateLimiter = (
  maxRequests: number = 100,
  windowMs: number = 60000
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Placeholder implementation
    // In production, use express-rate-limit with Redis store
    next();
  };
};

/**
 * Auth middleware - validates JWT via RABTUL Auth Service
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
    return;
  }

  try {
    const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:4002';
    const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;

    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN || '',
      },
      body: JSON.stringify({ token }),
    });

    const result = await response.json();

    if (!result.valid || !result.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: result.error || 'Invalid token',
        },
      });
      return;
    }

    // Attach user to request
    (req as unknown).user = result.user;
    next();
  } catch (error) {
    logger.error('Auth verification failed:', { error: error instanceof Error ? error.message : String(error) });
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication service unavailable',
      },
    });
  }
};

/**
 * Service-to-service auth middleware
 */
export const serviceAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const serviceToken = req.headers['x-service-token'] as string;
  const expectedToken = process.env.INTERNAL_SERVICE_TOKEN;

  if (!serviceToken) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Service token required',
      },
    });
    return;
  }

  // Validate service token
  if (serviceToken !== expectedToken) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid service token',
      },
    });
    return;
  }

  next();
};
