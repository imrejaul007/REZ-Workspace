/**
 * AI Concierge Agent - Utility Exports
 */

export * from './logger';
export * from './errors';

import { Request, Response, NextFunction } from 'express';
import { AppError } from './errors';
import { generateRequestId, logger } from './logger';

export const requestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = (req.headers['x-request-id'] as string) || generateRequestId();
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
};

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const requestId = (req as any).requestId || 'unknown';

  if (err instanceof AppError) {
    logger.error('Application error', {
      requestId,
      code: err.code,
      message: err.message,
      details: err.details,
      stack: err.stack,
    });

    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
      meta: {
        timestamp: new Date().toISOString(),
        request_id: requestId,
        version: process.env.SERVICE_VERSION || '1.0.0',
      },
    });
    return;
  }

  // Unknown error
  logger.error('Unexpected error', {
    requestId,
    message: err.message,
    stack: err.stack,
  });

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
    meta: {
      timestamp: new Date().toISOString(),
      request_id: requestId,
      version: process.env.SERVICE_VERSION || '1.0.0',
    },
  });
};

export const asyncHandler = <T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const chunkArray = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export const omitNulls = <T extends Record<string, unknown>>(obj: T): T => {
  const result = { ...obj };
  for (const key of Object.keys(result)) {
    if (result[key] === null || result[key] === undefined) {
      delete result[key];
    }
  }
  return result;
};

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}
