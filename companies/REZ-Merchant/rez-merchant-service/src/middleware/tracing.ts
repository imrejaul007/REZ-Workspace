import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Lightweight W3C traceparent propagation middleware.
 * Reads `traceparent` from incoming requests and propagates a trace ID
 * through the service without requiring @opentelemetry/* packages.
 *
 * Format: 00-{traceId 32hex}-{spanId 16hex}-{flags 2hex}
 * Spec:   https://www.w3.org/TR/trace-context/
 *
 * PEN-TEST FIX: Also generates a requestId for internal correlation
 * between logs, error responses, and support tickets.
 */
export function tracingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.headers['traceparent'] as string | undefined;

  let traceId: string;
  if (incoming) {
    const parts = incoming.split('-');
    traceId = parts.length >= 2 && parts[1].length === 32 ? parts[1] : generateTraceId();
  } else {
    const xTrace = (req.headers['x-trace-id'] || req.headers['x-correlation-id']) as string | undefined;
    traceId = xTrace ? xTrace.replace(/-/g, '').substring(0, 32).padEnd(32, '0') : generateTraceId();
  }

  const spanId = crypto.randomBytes(8).toString('hex');
  const requestId = crypto.randomUUID().replace(/-/g, '');

  res.locals.traceId = traceId;
  res.locals.spanId = spanId;
  res.locals.requestId = requestId;

  res.setHeader('traceparent', `00-${traceId}-${spanId}-01`);
  res.setHeader('X-Request-ID', requestId);

  next();
}

function generateTraceId(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

/**
 * Sanitizes error messages for client responses.
 * In production, never exposes internal details like stack traces,
 * database errors, or library names.
 */
export function sanitizeError(err: unknown, requestId?: string): string {
  if (process.env.NODE_ENV === 'production') {
    return 'An unexpected error occurred. Reference: ' + (requestId || 'unknown');
  }
  if (err instanceof Error) {
    return err.message;
  }
  return String(err);
}
