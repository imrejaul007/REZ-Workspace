import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Lightweight W3C traceparent propagation middleware.
 */
export function tracingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.headers['traceparent'] as string | undefined;
  let traceId: string;

  if (incoming) {
    const parts = incoming.split('-');
    traceId = parts.length >= 2 && parts[1].length === 32 ? parts[1] : crypto.randomUUID().replace(/-/g, '');
  } else {
    const xTrace = (req.headers['x-trace-id'] || req.headers['x-correlation-id']) as string | undefined;
    traceId = xTrace ? xTrace.replace(/-/g, '').substring(0, 32).padEnd(32, '0') : crypto.randomUUID().replace(/-/g, '');
  }

  const spanId = crypto.randomBytes(8).toString('hex');
  res.locals.traceId = traceId;
  res.locals.spanId = spanId;
  res.setHeader('traceparent', `00-${traceId}-${spanId}-01`);
  next();
}
