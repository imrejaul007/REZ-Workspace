import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import logger from 'utils/logger.js';

// Custom error class
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Not Found error
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404);
  }
}

// Validation error
export class ValidationError extends AppError {
  public errors: Record<string, string>;

  constructor(message: string, errors: Record<string, string> = {}) {
    super(message, 400);
    this.errors = errors;
  }
}

// Instagram API error
export class InstagramAPIError extends AppError {
  public instagramErrorCode?: string;
  public instagramErrorMessage?: string;

  constructor(message: string, instagramErrorCode?: string, instagramErrorMessage?: string) {
    super(message, 502);
    this.instagramErrorCode = instagramErrorCode;
    this.instagramErrorMessage = instagramErrorMessage;
  }
}

// Error handler middleware
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Default values
  let statusCode = 500;
  let message = 'Internal server error';
  let errors: Record<string, string> = {};

  // Handle known error types
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    if (err instanceof ValidationError) {
      errors = err.errors;
    }
    if (err instanceof InstagramAPIError) {
      logger.error('Instagram API Error', {
        code: err.instagramErrorCode,
        message: err.instagramErrorMessage,
        path: req.path,
      });
    }
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    errors = err.errors.reduce((acc, curr) => {
      const path = curr.path.join('.');
      acc[path] = curr.message;
      return acc;
    }, {} as Record<string, string>);
  }

  // Log the error
  if (statusCode >= 500) {
    logger.error('Server error', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  } else {
    logger.warn('Client error', {
      error: err.message,
      path: req.path,
      method: req.method,
    });
  }

  // Send response
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(Object.keys(errors).length > 0 && { errors }),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};

// Async handler wrapper to catch async errors
export const asyncHandler = <T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Not found handler
export const notFoundHandler = (req: Request, res: Response): void => {
  logger.warn('Route not found', { path: req.path, method: req.method });
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
};

// Request validation middleware
export const validateRequest = (schema: {
  body?: unknown;
  query?: unknown;
  params?: unknown;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Basic validation - in production, use Zod with the schema
    const { body, query, params } = req;

    if (schema.body && body === undefined) {
      res.status(400).json({ error: 'Request body is required' });
      return;
    }

    if (schema.params && params === undefined) {
      res.status(400).json({ error: 'Request params are required' });
      return;
    }

    next();
  };
};