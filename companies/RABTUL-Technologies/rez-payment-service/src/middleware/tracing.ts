import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Lightweight W3C traceparent propagation middleware.
 * Reads `traceparent` from incoming requests and propagates a trace ID
 * through the service without requiring @opentelemetry/* packages.
 *
 * Format: 00-{traceId 32hex}-{spanId 16hex}-{flags 2hex}
 * Spec:   https://www.w3.org/TR/trace-context/
 */
export function tracingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.headers['traceparent'] as string | undefined;

  let traceId: string;
  if (incoming) {
    // Extract traceId from existing W3C traceparent header
    const parts = incoming.split('-');
    traceId = parts.length >= 2 && parts[1].length === 32 ? parts[1] : generateTraceId();
  } else {
    // Fall back to x-trace-id or x-correlation-id forwarded by nginx.
    // Validate the header value to prevent CRLF injection — only accept
    // 32-character hex strings; anything else triggers a fresh trace ID.
    const xTrace = (req.headers['x-trace-id'] || req.headers['x-correlation-id']) as string | undefined;
    const isValidTrace = /^[0-9a-f]{32}$/i.test(xTrace || '');
    traceId = isValidTrace ? xTrace!.toLowerCase() : generateTraceId();
  }

  const spanId = crypto.randomBytes(8).toString('hex');

  // Attach to res.locals for use in route handlers and loggers
  res.locals.traceId = traceId;
  res.locals.spanId = spanId;

  // Propagate W3C traceparent on the response
  res.setHeader('traceparent', `00-${traceId}-${spanId}-01`);

  next();
}

function generateTraceId(): string {
  return crypto.randomUUID().replace(/-/g, '');
}
