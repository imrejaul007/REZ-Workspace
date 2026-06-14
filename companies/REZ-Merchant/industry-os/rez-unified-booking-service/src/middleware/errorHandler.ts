import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodIssue } from 'zod';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '../utils/logger';
import { ErrorCode } from '../types';

const logger = createLogger('error-handler');

// ============================================
// Custom Application Error
// ============================================

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number = 500,
    code: ErrorCode = ErrorCode.INTERNAL_ERROR,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

// ============================================
// Error Handler Middleware
// ============================================

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.requestId || uuidv4();

  // Log the error
  logger.error('Error occurred', {
    requestId,
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Handle known error types
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    });
    return;
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Validation failed',
        details: formatZodErrors(err),
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    });
    return;
  }

  // Handle Mongoose validation errors
  if (err instanceof mongoose.Error.ValidationError) {
    res.status(400).json({
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Database validation failed',
        details: formatMongooseErrors(err),
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    });
    return;
  }

  // Handle Mongoose CastError (invalid ObjectId, etc.)
  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: `Invalid ${err.path}: ${err.value}`,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    });
    return;
  }

  // Handle MongoDB duplicate key errors
  if (err instanceof mongoose.Error.MongoServerError && err.code === 11000) {
    const fieldMatch = err.message.match(/index:\s*(\w+)_?/);
    const field = fieldMatch ? fieldMatch[1] : 'field';

    res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_ERROR',
        message: `Duplicate value for ${field}`,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    });
    return;
  }

  // Handle MongoDB connection errors
  if (err instanceof mongoose.Error.MongoNetworkError) {
    res.status(503).json({
      success: false,
      error: {
        code: ErrorCode.SERVICE_UNAVAILABLE,
        message: 'Database connection unavailable',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    });
    return;
  }

  // Handle Axios errors from vertical service calls
  if (err.name === 'AxiosError') {
    const axiosError = err as { response?: { status?: number }; code?: string };

    if (axiosError.response?.status === 404) {
      res.status(502).json({
        success: false,
        error: {
          code: ErrorCode.VERTICAL_UNAVAILABLE,
          message: 'Vertical service returned 404',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
        },
      });
      return;
    }

    res.status(502).json({
      success: false,
      error: {
        code: ErrorCode.VERTICAL_UNAVAILABLE,
        message: 'Vertical service unavailable',
        details: { originalError: axiosError.code },
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    });
    return;
  }

  // Handle syntax errors (malformed JSON)
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Invalid JSON in request body',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    });
    return;
  }

  // Default: Internal server error
  res.status(500).json({
    success: false,
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  });
}

// ============================================
// 404 Handler
// ============================================

export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.requestId || uuidv4();

  logger.warn('Route not found', {
    requestId,
    method: req.method,
    path: req.path,
  });

  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  });
}

// ============================================
// Async Handler Wrapper
// ============================================

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// ============================================
// Helper Functions
// ============================================

function formatZodErrors(error: ZodError): Record<string, string[]> {
  return error.errors.reduce<Record<string, string[]>>((acc, issue: ZodIssue) => {
    const path = issue.path.join('.') || 'root';
    if (!acc[path]) {
      acc[path] = [];
    }
    acc[path]?.push(issue.message);
    return acc;
  }, {});
}

function formatMongooseErrors(error: mongoose.Error.ValidationError): Record<string, string[]> {
  return Object.keys(error.errors).reduce<Record<string, string[]>>((acc, path) => {
    acc[path] = [error.errors[path]?.message || 'Invalid value'];
    return acc;
  }, {});
}

export default {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  AppError,
};