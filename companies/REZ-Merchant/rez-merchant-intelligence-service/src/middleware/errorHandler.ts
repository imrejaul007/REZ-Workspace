import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types';

/**
 * Not found middleware
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const response: ApiResponse<null> = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
    meta: {
      timestamp: new Date(),
      requestId: req.headers['x-request-id'] as string || '',
    },
  };

  res.status(404).json(response);
};

/**
 * Error handling middleware
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    requestId: req.headers['x-request-id'],
  });

  const statusCode = (err as unknown).statusCode || 500;
  const response: ApiResponse<null> = {
    success: false,
    error: {
      code: (err as unknown).code || 'INTERNAL_ERROR',
      message: statusCode === 500 ? 'Internal server error' : err.message,
      details: process.env.NODE_ENV === 'development' ? { stack: err.stack } : undefined,
    },
    meta: {
      timestamp: new Date(),
      requestId: req.headers['x-request-id'] as string || '',
    },
  };

  res.status(statusCode).json(response);
};

/**
 * Async handler wrapper to catch errors
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Request logging middleware
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      requestId: req.headers['x-request-id'],
    });
  });

  next();
};

/**
 * Validation error handler
 */
export const validationErrorHandler = (
  err,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err.type === 'entity.parse.failed') {
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Invalid JSON in request body',
      },
      meta: {
        timestamp: new Date(),
        requestId: req.headers['x-request-id'] as string || '',
      },
    };
    res.status(400).json(response);
    return;
  }

  if (err.name === 'ValidationError') {
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: err.message,
        details: err.errors,
      },
      meta: {
        timestamp: new Date(),
        requestId: req.headers['x-request-id'] as string || '',
      },
    };
    res.status(400).json(response);
    return;
  }

  next(err);
};
