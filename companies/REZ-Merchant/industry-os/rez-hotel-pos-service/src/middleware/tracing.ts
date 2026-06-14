import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export function tracingMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const traceId = req.headers['x-trace-id'] as string || generateTraceId();
  const spanId = generateSpanId();

  req.headers['x-trace-id'] = traceId;
  req.headers['x-span-id'] = spanId;

  // Log request start
  logger.debug('Incoming request', {
    traceId,
    spanId,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
  });

  // Log response when finished
  const startTime = Date.now();
  _res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.debug('Request completed', {
      traceId,
      spanId,
      method: req.method,
      path: req.path,
      statusCode: _res.statusCode,
      duration_ms: duration,
    });
  });

  next();
}

/**
 * FIX (security): Replaced Math.random() with crypto.randomUUID()
 */
function generateTraceId(): string {
  try {
    const { randomUUID } = require('crypto');
    return `trace-${Date.now()}-${randomUUID().replace(/-/g, '')}`;
  } catch {
    return `trace-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
}

/**
 * FIX (security): Replaced Math.random() with crypto.randomUUID()
 */
function generateSpanId(): string {
  try {
    const { randomUUID } = require('crypto');
    return `span-${randomUUID().replace(/-/g, '')}`;
  } catch {
    return `span-${Math.random().toString(36).substring(2, 15)}`;
  }
}
