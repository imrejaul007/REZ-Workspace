import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, isOperationalError, getErrorMessage } from '../utils/errors.js';
import { logger } from '../config/logger.js';
import mongoose from 'mongoose';

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    statusCode: number;
    details?: Record<string, string[]>;
    stack?: string;
  };
}

export const errorMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      message: 'Internal server error',
      statusCode: 500
    }
  };

  // Log error
  logger.error('Error occurred', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  // Handle operational errors
  if (isOperationalError(error)) {
    const appError = error as AppError;
    errorResponse.error = {
      message: appError.message,
      code: appError.code,
      statusCode: appError.statusCode
    };

    if (appError instanceof AppError && 'errors' in appError) {
      (errorResponse.error as any).details = (appError as any).errors;
    }

    res.status(appError.statusCode).json(errorResponse);
    return;
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const errors: Record<string, string[]> = {};

    error.errors.forEach((err) => {
      const field = err.path.join('.');
      if (!errors[field]) {
        errors[field] = [];
      }
      errors[field].push(err.message);
    });

    errorResponse.error = {
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      details: errors
    };

    res.status(400).json(errorResponse);
    return;
  }

  // Handle Mongoose validation errors
  if (error instanceof mongoose.Error.ValidationError) {
    const errors: Record<string, string[]> = {};

    Object.keys(error.errors).forEach((key) => {
      const field = key;
      if (!errors[field]) {
        errors[field] = [];
      }
      errors[field].push(error.errors[key].message);
    });

    errorResponse.error = {
      message: 'Database validation failed',
      code: 'DB_VALIDATION_ERROR',
      statusCode: 400,
      details: errors
    };

    res.status(400).json(errorResponse);
    return;
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (error instanceof mongoose.Error.CastError) {
    errorResponse.error = {
      message: `Invalid ${error.path}: ${error.value}`,
      code: 'INVALID_ID',
      statusCode: 400
    };

    res.status(400).json(errorResponse);
    return;
  }

  // Handle MongoDB duplicate key error
  if ((error as any).code === 11000) {
    const field = Object.keys((error as any).keyValue || {})[0];
    errorResponse.error = {
      message: `Duplicate value for field: ${field}`,
      code: 'DUPLICATE_KEY',
      statusCode: 409
    };

    res.status(409).json(errorResponse);
    return;
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    errorResponse.error = {
      message: error.message,
      code: 'AUTH_ERROR',
      statusCode: 401
    };

    res.status(401).json(errorResponse);
    return;
  }

  // Handle syntax errors (malformed JSON)
  if (error instanceof SyntaxError && (error as any).type === 'entity.parse.failed') {
    errorResponse.error = {
      message: 'Invalid JSON in request body',
      code: 'INVALID_JSON',
      statusCode: 400
    };

    res.status(400).json(errorResponse);
    return;
  }

  // Default error response
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json(errorResponse);
  } else {
    errorResponse.error.stack = error.stack;
    res.status(500).json(errorResponse);
  }
};

// 404 handler
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.method} ${req.path} not found`,
      code: 'NOT_FOUND',
      statusCode: 404
    }
  });
};

// Async handler wrapper
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default errorMiddleware;