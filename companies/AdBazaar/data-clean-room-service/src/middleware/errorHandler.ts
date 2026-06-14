import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';
import { config } from '../config';

/**
 * Global error handler middleware
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log the error
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  // Determine status code
  let statusCode = 500;

  if ('statusCode' in error && typeof (error as { statusCode: number }).statusCode === 'number') {
    statusCode = (error as { statusCode: number }).statusCode;
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
  } else if (error.message.includes('not found') || error.message.includes('Not found')) {
    statusCode = 404;
  }

  // Send error response
  const errorResponse = {
    success: false,
    error: config.nodeEnv === 'production' ? 'Internal server error' : error.message,
    timestamp: new Date().toISOString(),
    ...(config.nodeEnv !== 'production' && {
      stack: error.stack,
    }),
  };

  res.status(statusCode).json(errorResponse);
}

/**
 * Not found handler
 */
export function notFoundHandler(req: Request, res: Response): void {
  logger.warn('Route not found', {
    path: req.path,
    method: req.method,
  });

  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Async handler wrapper to catch async errors
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}