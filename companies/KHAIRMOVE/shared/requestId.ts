/**
 * Request ID / Correlation ID Middleware
 *
 * Adds unique request ID to every request for distributed tracing
 */

import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';

// Extend Express Request to include requestId
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      correlationId: string;
      startTime: number;
    }
  }
}

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return `${Date.now().toString(36)}-${randomBytes(8).toString('hex')}`;
}

/**
 * Middleware to add request ID to every request
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Use existing request ID from header or generate new one
  const requestId = (req.headers['x-request-id'] as string) || generateRequestId();

  req.requestId = requestId;
  req.correlationId = (req.headers['x-correlation-id'] as string) || requestId;
  req.startTime = Date.now();

  // Add request ID to response headers
  res.setHeader('X-Request-ID', requestId);
  res.setHeader('X-Correlation-ID', req.correlationId);

  next();
}

/**
 * Create a child logger with request context
 */
export function createRequestLogger(logger: any, req: Request) {
  return {
    debug: (message: string, meta?: Record<string, unknown>) => {
      logger.debug(message, { ...meta, requestId: req.requestId, correlationId: req.correlationId });
    },
    info: (message: string, meta?: Record<string, unknown>) => {
      logger.info(message, { ...meta, requestId: req.requestId, correlationId: req.correlationId });
    },
    warn: (message: string, meta?: Record<string, unknown>) => {
      logger.warn(message, { ...meta, requestId: req.requestId, correlationId: req.correlationId });
    },
    error: (message: string, error?: Error | unknown, meta?: Record<string, unknown>) => {
      logger.error(message, error, { ...meta, requestId: req.requestId, correlationId: req.correlationId });
    },
  };
}

/**
 * Log HTTP request with timing
 */
export function logRequest(req: Request, res: Response, durationMs: number): void {
  const log = {
    requestId: req.requestId,
    correlationId: req.correlationId,
    method: req.method,
    url: req.url,
    status: res.statusCode,
    duration: durationMs,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    userId: (req as any).user?.userId,
  };

  // Use appropriate log level based on status code
  if (res.statusCode >= 500) {
    console.error(JSON.stringify({ level: 'error', ...log }));
  } else if (res.statusCode >= 400) {
    console.warn(JSON.stringify({ level: 'warn', ...log }));
  } else {
    console.log(JSON.stringify({ level: 'info', ...log }));
  }
}

/**
 * Request logging middleware
 */
export function requestLoggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  // Log after response is finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logRequest(req, res, duration);
  });

  next();
}
