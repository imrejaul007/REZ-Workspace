/**
 * Structured Request Logger Middleware
 *
 * Adds correlation IDs, logs all requests with structured format.
 * Usage: app.use(requestLogger);
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

export interface LogContext {
  correlationId: string;
  requestId: string;
  timestamp: string;
  path: string;
  method: string;
  userId?: string;
  merchantId?: string;
  statusCode?: number;
  duration?: number;
  error?: string;
}

/**
 * Structured logger
 */
export function structuredLogger(context: Partial<LogContext>, message: string, data?) {
  const log = {
    timestamp: new Date().toISOString(),
    level: 'info',
    ...context,
    message,
    ...(data && { data }),
  };
  logger.info(JSON.stringify(log));
}

/**
 * Structured logger for errors
 */
export function logError(context: Partial<LogContext>, error: Error, data?) {
  const log = {
    timestamp: new Date().toISOString(),
    level: 'error',
    ...context,
    error: error.message,
    stack: error.stack,
    ...(data && { data }),
  };
  logger.error(JSON.stringify(log));
}

/**
 * Request logging middleware
 *
 * Adds:
 * - Correlation ID (x-correlation-id header)
 * - Request ID
 * - User ID / Merchant ID extraction
 * - Request/response logging
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();

  // Extract or generate correlation ID
  const correlationId = (req.headers['x-correlation-id'] as string) || uuidv4();
  const requestId = uuidv4();

  // Attach to request for use in routes
  (req as unknown).correlationId = correlationId;
  (req as unknown).requestId = requestId;

  // Extract user/merchant IDs if present
  const userId = (req as unknown).userId;
  const merchantId = (req as unknown).merchantId;

  // Log incoming request
  structuredLogger(
    {
      correlationId,
      requestId,
      path: req.path,
      method: req.method,
      userId,
      merchantId,
    },
    'Request received',
    {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    }
  );

  // Add correlation ID to response headers
  res.setHeader('x-correlation-id', correlationId);
  res.setHeader('x-request-id', requestId);

  // Capture response
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    structuredLogger(
      {
        correlationId,
        requestId,
        path: req.path,
        method: req.method,
        statusCode: res.statusCode,
        duration,
        userId,
        merchantId,
      },
      'Request completed'
    );
  });

  next();
}

/**
 * Express middleware to attach logger to request
 */
export function attachLogger(req: Request, res: Response, next: NextFunction) {
  (req as unknown).logger = {
    info: (message: string, data?) =>
      structuredLogger(
        {
          correlationId: (req as unknown).correlationId,
          requestId: (req as unknown).requestId,
          path: req.path,
          method: req.method,
          userId: (req as unknown).userId,
          merchantId: (req as unknown).merchantId,
        },
        message,
        data
      ),
    error: (error: Error, data?) =>
      logError(
        {
          correlationId: (req as unknown).correlationId,
          requestId: (req as unknown).requestId,
          path: req.path,
          method: req.method,
          userId: (req as unknown).userId,
          merchantId: (req as unknown).merchantId,
        },
        error,
        data
      ),
  };
  next();
}
