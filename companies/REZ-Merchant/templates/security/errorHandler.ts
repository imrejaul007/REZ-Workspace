// REZ-Merchant Error Handler Template
// Standardized error handling for all services

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

// Custom Error Classes
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: string;
  details?: any;

  constructor(message: string, statusCode: number, code?: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter: number = 60) {
    super('Too many requests', 429, 'RATE_LIMIT_EXCEEDED', { retryAfter });
  }
}

// Error Handler Middleware
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  const isProduction = process.env.NODE_ENV === 'production';

  // Log error
  console.error('Error:', {
    name: err.name,
    message: err.message,
    stack: isProduction ? undefined : err.stack,
    path: req.path,
    method: req.method,
  });

  // Zod validation error
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      },
    });
  }

  // Custom AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details }),
      },
    });
  }

  // Unknown error
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: isProduction ? 'An unexpected error occurred' : err.message,
    },
  });
};

// Async Handler
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Not Found Handler
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
};

// Success Response Helper
export const sendSuccess = (res: Response, data: any, message = 'Success', meta?: any) => {
  res.status(200).json({
    success: true,
    message,
    data,
    ...(meta && { meta }),
  });
};

// Error Response Helper
export const sendError = (res: Response, statusCode: number, message: string, code?: string) => {
  res.status(statusCode).json({
    success: false,
    error: { code: code || `HTTP_${statusCode}`, message },
  });
};

export default {
  errorHandler,
  asyncHandler,
  notFoundHandler,
  sendError,
  sendSuccess,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
};