import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/validators';
import logger from '../utils/logger';
import { ApiResponse } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const response: ApiResponse = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route not found: ${req.method} ${req.path}`,
    },
    meta: {
      requestId: uuidv4(),
      timestamp: new Date().toISOString(),
    },
  };

  res.status(404).json(response);
};

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const requestId = uuidv4();

  logger.error('Request error', {
    requestId,
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';
  let details: unknown = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err instanceof ValidationError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = err.message;
  } else if (err.name === 'SyntaxError' && 'body' in err) {
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'Invalid JSON in request body';
  }

  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      details,
    },
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
    },
  };

  res.status(statusCode).json(response);
};
