import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { createResponse } from '../types/index.js';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path}`, {
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  if (err instanceof ZodError) {
    res.status(400).json(createResponse(false, undefined, {
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: err.errors
    }));
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json(createResponse(false, undefined, {
      code: err.code,
      message: err.message
    }));
    return;
  }

  res.status(500).json(createResponse(false, undefined, {
    code: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
  }));
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json(createResponse(false, undefined, {
    code: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`
  }));
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
