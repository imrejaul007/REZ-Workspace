// Request ID Middleware
// Adds unique request IDs for tracing

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface RequestWithId extends Request {
  requestId: string;
  startTime: number;
}

export const requestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = (req.headers['x-request-id'] as string) || uuidv4();
  const startTime = Date.now();

  (req as RequestWithId).requestId = requestId;
  (req as RequestWithId).startTime = startTime;

  res.setHeader('X-Request-ID', requestId);
  res.setHeader('X-Response-Time', '-');

  const originalEnd = res.end;
  res.end = function(this: Response, ...args: any[]): Response {
    const duration = Date.now() - startTime;
    res.setHeader('X-Response-Time', `${duration}ms`);

    logger.info(JSON.stringify({
      type: 'request',
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString(),
    }));

    return originalEnd.apply(this, args as any);
  };

  next();
};

// Logger utility with request context
export const createRequestLogger = (req: RequestWithId) => {
  return {
    info: (message: string, data?: Record<string, any>) => {
      logger.info(JSON.stringify({
        level: 'info',
        requestId: req.requestId,
        message,
        ...data,
        timestamp: new Date().toISOString(),
      }));
    },
    error: (message: string, error?: Error | unknown, data?: Record<string, any>) => {
      logger.error(JSON.stringify({
        level: 'error',
        requestId: req.requestId,
        message,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        } : String(error),
        ...data,
        timestamp: new Date().toISOString(),
      }));
    },
    warn: (message: string, data?: Record<string, any>) => {
      logger.warn(JSON.stringify({
        level: 'warn',
        requestId: req.requestId,
        message,
        ...data,
        timestamp: new Date().toISOString(),
      }));
    },
    debug: (message: string, data?: Record<string, any>) => {
      logger.info(JSON.stringify({
        level: 'debug',
        requestId: req.requestId,
        message,
        ...data,
        timestamp: new Date().toISOString(),
      }));
    },
  };
};
