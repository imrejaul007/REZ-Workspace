import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    super(`${resource}${identifier ? ` with ID ${identifier}` : ''} not found`, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

function formatZodError(error: ZodError): string[] {
  return error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err instanceof AppError ? err.statusCode : 500;

  const response = {
    success: false,
    error: {
      message: err.message || 'Internal server error',
      code: err instanceof AppError ? err.code : 'INTERNAL_ERROR',
    },
    timestamp: new Date().toISOString(),
    path: req.path,
  };

  if (err instanceof ZodError) {
    (response.error as Record<string, unknown>).details = formatZodError(err);
    response.error.message = 'Validation failed';
  }

  if (statusCode >= 500) {
    logger.error('Server Error:', { message: err.message, stack: err.stack, path: req.path });
  }

  res.status(statusCode).json(response);
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: { message: `Route ${req.method} ${req.path} not found`, code: 'ROUTE_NOT_FOUND' },
    timestamp: new Date().toISOString(),
    path: req.path,
  });
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function validateRequest(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        success: false,
        error: { message: 'Validation failed', code: 'VALIDATION_ERROR', details: formatZodError(result.error) },
        timestamp: new Date().toISOString(),
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

export function setupGlobalErrorHandlers(): void {
  process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
  });
}
