/**
 * Error Handling Middleware
 * Centralized error handling for Express app
 */

import { Request, Response, NextFunction } from 'express';
import winston from 'winston';

// Configure logger
const logger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// Custom error class
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
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

// Not found error
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404);
  }
}

// Conflict error
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

// Error response interface
interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path?: string;
  stack?: string;
}

/**
 * Not found handler - 404 for unmatched routes
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    statusCode: 404,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Global error handler
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = (err as AppError).statusCode ?? 500;
  const isOperational = (err as AppError).isOperational ?? false;

  // Log error
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    statusCode,
  });

  // Prepare response
  const response: ErrorResponse = {
    error: statusCode >= 500 ? 'Internal Server Error' : err.name || 'Error',
    message: isOperational ? err.message : 'Something went wrong',
    statusCode,
    timestamp: new Date().toISOString(),
    path: req.path,
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development' && err.stack) {
    response.stack = err.stack;
  }

  // Include validation errors if present
  if (err instanceof ValidationError) {
    response.message = err.message;
  }

  res.status(statusCode).json(response);
}

/**
 * Async handler wrapper - catches errors in async route handlers
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Validate required fields in request body
 */
export function validateBody(fields: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const missing: string[] = [];
    
    for (const field of fields) {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        missing.push(field);
      }
    }

    if (missing.length > 0) {
      res.status(400).json({
        error: 'Validation Error',
        message: `Missing required fields: ${missing.join(', ')}`,
        statusCode: 400,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
}

/**
 * Validate request parameters
 */
export function validateParams(paramNames: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const missing: string[] = [];

    for (const param of paramNames) {
      if (!req.params[param]) {
        missing.push(param);
      }
    }

    if (missing.length > 0) {
      res.status(400).json({
        error: 'Validation Error',
        message: `Missing required parameters: ${missing.join(', ')}`,
        statusCode: 400,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
}
