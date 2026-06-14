import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from './logger';

export class ApiError extends Error {
  public statusCode: number;
  public code: string;
  public details?: unknown;
  public isOperational: boolean;

  constructor(
    statusCode: number,
    message: string,
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

export class NotFoundError extends ApiError {
  constructor(resource: string, identifier?: string) {
    super(404, `${resource} not found${identifier ? `: ${identifier}` : ''}`, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized access') {
    super(401, message, 'UNAUTHORIZED');
  }
}

export class BadRequestError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(400, message, 'BAD_REQUEST', details);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    requestId: req.headers['x-request-id']
  });

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
      },
      meta: {
        requestId: req.requestId,
        timestamp: Date.now()
      }
    });
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details
      },
      meta: {
        requestId: req.requestId,
        timestamp: Date.now()
      }
    });
  }

  const statusCode = 500;
  const message = config.server.env === 'production'
    ? 'Internal server error'
    : err.message;

  return res.status(statusCode).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message
    },
    meta: {
      requestId: req.requestId,
      timestamp: Date.now()
    }
  });
};

export const asyncHandler = <T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    },
    meta: {
      requestId: req.requestId,
      timestamp: Date.now()
    }
  });
};

import config from '../config';