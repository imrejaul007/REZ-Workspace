import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import logger from '../utils/logger';
import { errorsTotal } from '../utils/metrics';

const moduleLogger = logger.child({ module: 'ErrorHandler' });

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = (err as any).statusCode || 500;
  const errorType = (err as any).type || 'server_error';

  // Log error
  if (statusCode >= 500) {
    moduleLogger.error('Server error', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method
    });
  } else {
    moduleLogger.warn('Client error', {
      error: err.message,
      path: req.path,
      method: req.method
    });
  }

  // Track error metric
  errorsTotal.inc({ type: errorType, endpoint: req.path });

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message
      }))
    });
    return;
  }

  // Handle known errors
  if (err.message === 'Experiment not found' ||
      err.message === 'Market not found' ||
      err.message === 'Treatment market not found' ||
      err.message === 'Control market not found') {
    res.status(404).json({
      success: false,
      error: err.message
    });
    return;
  }

  if (err.message.includes('already exists') ||
      err.message.includes('duplicate')) {
    res.status(409).json({
      success: false,
      error: err.message
    });
    return;
  }

  // Default error response
  res.status(statusCode).json({
    success: false,
    error: statusCode >= 500 ? 'Internal server error' : err.message
  });
};

/**
 * 404 handler for unmatched routes
 */
export const notFoundHandler = (
  req: Request,
  res: Response
): void => {
  moduleLogger.warn('Route not found', {
    path: req.path,
    method: req.method
  });

  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path
  });
};

export default {
  errorHandler,
  notFoundHandler
};