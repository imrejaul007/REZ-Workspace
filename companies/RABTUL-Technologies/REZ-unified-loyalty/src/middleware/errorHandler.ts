import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';
import logger from '../utils/logger.js';

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: unknown
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Common API errors
 */
export const Errors = {
  badRequest: (message: string, details?: unknown) =>
    new ApiError(message, 400, 'BAD_REQUEST', details),

  unauthorized: (message: string = 'Unauthorized') =>
    new ApiError(message, 401, 'UNAUTHORIZED'),

  forbidden: (message: string = 'Forbidden') =>
    new ApiError(message, 403, 'FORBIDDEN'),

  notFound: (resource: string = 'Resource') =>
    new ApiError(`${resource} not found`, 404, 'NOT_FOUND'),

  conflict: (message: string) =>
    new ApiError(message, 409, 'CONFLICT'),

  insufficientBalance: (available: number, required: number) =>
    new ApiError(
      `Insufficient balance. Available: ${available}, Required: ${required}`,
      400,
      'INSUFFICIENT_BALANCE',
      { available, required }
    ),

  insufficientCoins: (current: number, required: number) =>
    new ApiError(
      `Insufficient coins. Current: ${current}, Required: ${required}`,
      400,
      'INSUFFICIENT_COINS',
      { current, required }
    ),

  duplicateTransaction: (referenceId: string) =>
    new ApiError(
      `Transaction with reference ${referenceId} already exists`,
      409,
      'DUPLICATE_TRANSACTION',
      { referenceId }
    ),

  invalidTier: (currentTier: string, requiredTier: string) =>
    new ApiError(
      `Invalid tier. Current: ${currentTier}, Required: ${requiredTier}`,
      403,
      'INVALID_TIER',
      { currentTier, requiredTier }
    ),

  rewardExpired: (rewardId: string) =>
    new ApiError(
      `Reward ${rewardId} has expired`,
      400,
      'REWARD_EXPIRED',
      { rewardId }
    ),

  rewardUnavailable: (rewardId: string) =>
    new ApiError(
      `Reward ${rewardId} is no longer available`,
      400,
      'REWARD_UNAVAILABLE',
      { rewardId }
    ),

  syncFailed: (reason: string) =>
    new ApiError(
      `Sync operation failed: ${reason}`,
      500,
      'SYNC_FAILED',
      { reason }
    ),

  validationError: (errors: unknown) =>
    new ApiError('Validation failed', 400, 'VALIDATION_ERROR', errors)
};

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log the error
  if (err instanceof ApiError) {
    if (err.statusCode >= 500) {
      logger.error('API Error', {
        code: err.code,
        message: err.message,
        statusCode: err.statusCode,
        path: req.path,
        method: req.method,
        details: err.details
      });
    } else {
      logger.warn('Client Error', {
        code: err.code,
        message: err.message,
        statusCode: err.statusCode,
        path: req.path
      });
    }
  } else {
    logger.error('Unexpected Error', {
      name: err.name,
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method
    });
  }

  // Handle API errors
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details })
      }
    });
    return;
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: err.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message,
          code: e.code
        }))
      }
    });
    return;
  }

  // Handle unknown errors
  const isProduction = process.env.NODE_ENV === 'production';

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: isProduction
        ? 'An unexpected error occurred'
        : err.message
    }
  });
}

/**
 * 404 handler for unmatched routes
 */
export function notFoundHandler(
  req: Request,
  res: Response
): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    }
  });
}

/**
 * Validate request body with Zod schema
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.parse(req.body);
      req.body = result;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(Errors.validationError(error.errors));
      } else {
        next(error);
      }
    }
  };
}

/**
 * Validate query parameters with Zod schema
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.parse(req.query);
      req.query = result as typeof req.query;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(Errors.validationError(error.errors));
      } else {
        next(error);
      }
    }
  };
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
