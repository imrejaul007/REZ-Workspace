import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  status?: number;
  code?: string;
  details?: Record<string, unknown>;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || 'INTERNAL_ERROR';

  console.error(`[ERROR] ${status} - ${message}`);
  if (err.stack && process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  res.status(status).json({
    success: false,
    error: message,
    code,
    ...(err.details && { details: err.details }),
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: 'Resource not found',
    path: req.path,
    method: req.method,
    code: 'NOT_FOUND'
  });
}

export function createError(message: string, status: number, code?: string): AppError {
  const error: AppError = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
