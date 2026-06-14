/**
 * Distributed Tracing Middleware
 *
 * Adds trace ID propagation across all services
 * Enables debugging of cross-service issues
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// Trace context
interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  timestamp: number;
  service: string;
}

// Store trace context
const traceContext = new Map<string, TraceContext>();

/**
 * Generate trace ID
 */
function generateTraceId(): string {
  return uuidv4().replace(/-/g, '');
}

/**
 * Generate span ID
 */
function generateSpanId(): string {
  return crypto.randomBytes(8).toString('hex');
}

/**
 * Extract trace from headers
 */
function extractTrace(headers): TraceContext | null {
  const traceId = headers['x-trace-id'];
  const spanId = headers['x-span-id'];
  const parentSpanId = headers['x-parent-span-id'];

  if (traceId) {
    return {
      traceId,
      spanId: spanId || generateSpanId(),
      parentSpanId,
      timestamp: Date.now(),
      service: process.env.SERVICE_NAME || 'unknown'
    };
  }

  return null;
}

/**
 * Tracing middleware
 */
export function tracingMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Extract or create trace
  const existing = extractTrace(req.headers);

  const trace: TraceContext = existing || {
    traceId: generateTraceId(),
    spanId: generateSpanId(),
    timestamp: Date.now(),
    service: process.env.SERVICE_NAME || 'unknown'
  };

  // Add to request
  (req as unknown).trace = trace;

  // Add trace headers to response
  res.setHeader('X-Trace-ID', trace.traceId);
  res.setHeader('X-Span-ID', trace.spanId);
  res.setHeader('X-Service-Name', process.env.SERVICE_NAME || 'unknown');

  // Log with trace
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (body && typeof body === 'object') {
      body._trace = {
        traceId: trace.traceId,
        spanId: trace.spanId
      };
    }
    return originalJson(body);
  };

  next();
}

/**
 * Create a child span
 */
export function createSpan(parent: TraceContext, operation: string): TraceContext {
  return {
    traceId: parent.traceId,
    spanId: generateSpanId(),
    parentSpanId: parent.spanId,
    timestamp: Date.now(),
    service: process.env.SERVICE_NAME || 'unknown'
  };
}

/**
 * Get current trace from request
 */
export function getTrace(req: Request): TraceContext | null {
  return (req as unknown).trace || null;
}

/**
 * Add trace headers to outgoing request
 */
export function addTraceHeaders(headers: Record<string, string>, trace: TraceContext): Record<string, string> {
  return {
    ...headers,
    'X-Trace-ID': trace.traceId,
    'X-Span-ID': trace.spanId,
    'X-Parent-Span-ID': trace.spanId,
    'X-Service-Name': process.env.SERVICE_NAME || 'unknown'
  };
}

/**
 * Logger with trace context
 */
export function traceLog(
  req: Request | null,
  level: 'info' | 'warn' | 'error',
  message: string,
  data?: Record<string, unknown>
): void {
  const trace = req ? getTrace(req) : null;
  const logData = {
    ...data,
    timestamp: new Date().toISOString(),
    service: process.env.SERVICE_NAME || 'unknown',
    ...(trace && {
      traceId: trace.traceId,
      spanId: trace.spanId
    })
  };

  switch (level) {
    case 'info':
      console.log(JSON.stringify({ level: 'INFO', message, ...logData }));
      break;
    case 'warn':
      console.warn(JSON.stringify({ level: 'WARN', message, ...logData }));
      break;
    case 'error':
      console.error(JSON.stringify({ level: 'ERROR', message, ...logData }));
      break;
  }
}

/**
 * Express route wrapper with tracing
 */
export function withTrace(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const trace = getTrace(req);
    const startTime = Date.now();

    try {
      await handler(req, res, next);

      const duration = Date.now() - startTime;
      traceLog(req, 'info', 'Request completed', {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      traceLog(req, 'error', 'Request failed', {
        method: req.method,
        path: req.path,
        error: error.message,
        duration
      });
      throw error;
    }
  };
}

/**
 * HTTP client wrapper with tracing
 */
export async function tracedFetch(
  url: string,
  options: RequestInit = {},
  trace?: TraceContext
): Promise<Response> {
  const currentTrace = trace || {
    traceId: generateTraceId(),
    spanId: generateSpanId(),
    timestamp: Date.now(),
    service: process.env.SERVICE_NAME || 'unknown'
  };

  const headers = addTraceHeaders(
    (options.headers as Record<string, string>) || {},
    currentTrace
  );

  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const duration = Date.now() - startTime;

    // Log success
    console.log(JSON.stringify({
      level: 'INFO',
      type: 'http_outbound',
      method: options.method || 'GET',
      url,
      status: response.status,
      duration,
      traceId: currentTrace.traceId
    }));

    return response;
  } catch (error) {
    const duration = Date.now() - startTime;

    // Log error
    console.error(JSON.stringify({
      level: 'ERROR',
      type: 'http_outbound',
      method: options.method || 'GET',
      url,
      error: error.message,
      duration,
      traceId: currentTrace.traceId
    }));

    throw error;
  }
}

/**
 * Get all active traces (for debugging)
 */
export function getActiveTraces(): TraceContext[] {
  return Array.from(traceContext.values());
}

/**
 * Clear old traces (call periodically)
 */
export function clearOldTraces(maxAge = 3600000): void {
  const cutoff = Date.now() - maxAge;

  for (const [key, trace] of traceContext.entries()) {
    if (trace.timestamp < cutoff) {
      traceContext.delete(key);
    }
  }
}

// Export types
export type { TraceContext };
