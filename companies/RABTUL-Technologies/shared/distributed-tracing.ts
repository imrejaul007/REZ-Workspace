/**
 * Distributed Tracing Service
 *
 * Provides request tracing across all RABTUL services.
 * Implements W3C Trace Context for distributed tracing.
 *
 * USAGE:
 * ```typescript
 * import { createTracer, withSpan, traceMiddleware } from './distributed-tracing';
 *
 * const tracer = createTracer('payment-service');
 *
 * // Create spans for operations
 * const result = await withSpan('processPayment', async (span) => {
 *   span.setAttribute('payment.amount', amount);
 *   const payment = await razorpay.createOrder({ amount });
 *   span.setAttribute('payment.id', payment.id);
 *   return payment;
 * });
 * ```
 */

import crypto from 'crypto';

// ============================================
// TYPES
// ============================================

export interface SpanContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  traceFlags: number;
  traceState?: string;
}

export interface Span {
  context(): SpanContext;
  setAttribute(key: string, value: string | number | boolean): void;
  setAttributes(attributes: Record<string, string | number | boolean>): void;
  addEvent(name: string, attributes?: Record<string, string | number | boolean>): void;
  setStatus(status: SpanStatus): void;
  end(): void;
  recordException(error: Error): void;
}

export enum SpanStatus {
  UNSET = 0,
  OK = 1,
  ERROR = 2,
}

export interface SpanOptions {
  name: string;
  parent?: SpanContext;
  attributes?: Record<string, string | number | boolean>;
  kind?: SpanKind;
}

export enum SpanKind {
  INTERNAL = 0,
  SERVER = 1,
  CLIENT = 2,
  PRODUCER = 3,
  CONSUMER = 4,
}

export interface TraceExporter {
  export(spans: CompletedSpan[]): Promise<void>;
}

// ============================================
// SPAN IMPLEMENTATION
// ============================================

class CompletedSpan {
  constructor(
    public readonly name: string,
    public readonly context: SpanContext,
    public readonly startTime: number,
    public readonly endTime: number,
    public readonly attributes: Map<string, string | number | boolean>,
    public readonly events: Array<{ name: string; timestamp: number; attributes?: Record<string, string | number | boolean> }>,
    public readonly status: SpanStatus,
    public readonly kind: SpanKind,
    public readonly parentSpanId?: string,
    public readonly errors?: Array<{ message: string; stack?: string }>
  ) {}
}

class ActiveSpan implements Span {
  private attributes: Map<string, string | number | boolean> = new Map();
  private events: Array<{ name: string; timestamp: number; attributes?: Record<string, string | number | boolean> }> = [];
  private _status: SpanStatus = SpanStatus.UNSET;
  private _endTime?: number;

  constructor(
    public readonly name: string,
    public readonly context: SpanContext,
    public readonly kind: SpanKind = SpanKind.INTERNAL,
    public readonly startTime: number = Date.now()
  ) {}

  context(): SpanContext {
    return this.context;
  }

  setAttribute(key: string, value: string | number | boolean): void {
    if (this._endTime) return; // Span ended
    this.attributes.set(key, value);
  }

  setAttributes(attributes: Record<string, string | number | boolean>): void {
    if (this._endTime) return;
    Object.entries(attributes).forEach(([k, v]) => this.attributes.set(k, v));
  }

  addEvent(name: string, attributes?: Record<string, string | number | boolean>): void {
    if (this._endTime) return;
    this.events.push({
      name,
      timestamp: Date.now(),
      attributes,
    });
  }

  setStatus(status: SpanStatus): void {
    if (this._endTime) return;
    this._status = status;
  }

  end(): void {
    if (this._endTime) return;
    this._endTime = Date.now();
  }

  recordException(error: Error): void {
    if (this._endTime) return;
    this._status = SpanStatus.ERROR;
    this.addEvent('exception', {
      'exception.type': error.name,
      'exception.message': error.message,
    });
  }

  toCompletedSpan(): CompletedSpan {
    return new CompletedSpan(
      this.name,
      this.context,
      this.startTime,
      this._endTime || Date.now(),
      this.attributes,
      this.events,
      this._status,
      this.kind,
      this.context.parentSpanId
    );
  }
}

// ============================================
// TRACER IMPLEMENTATION
// ============================================

export class Tracer {
  private name: string;
  private exporter: TraceExporter | null = null;
  private localSpanQueue: CompletedSpan[] = [];
  private flushInterval?: NodeJS.Timeout;

  constructor(name: string, exporter?: TraceExporter) {
    this.name = name;
    this.exporter = exporter || null;

    // Auto-flush every 5 seconds
    if (this.exporter) {
      this.flushInterval = setInterval(() => this.flush(), 5000);
    }
  }

  private generateSpanId(): string {
    return crypto.randomBytes(8).toString('hex');
  }

  private generateTraceId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  startSpan(options: SpanOptions): ActiveSpan {
    const parent = options.parent;
    const spanId = this.generateSpanId();

    const context: SpanContext = {
      traceId: parent?.traceId || this.generateTraceId(),
      spanId,
      parentSpanId: parent?.spanId,
      traceFlags: 1, // Sampled
    };

    const span = new ActiveSpan(
      options.name,
      context,
      options.kind || SpanKind.INTERNAL,
    );

    if (options.attributes) {
      span.setAttributes(options.attributes);
    }

    // Add tracer name as attribute
    span.setAttribute('tracer.name', this.name);

    return span;
  }

  async withSpan<T>(
    name: string,
    fn: (span: Span) => Promise<T>,
    options?: {
      attributes?: Record<string, string | number | boolean>;
      kind?: SpanKind;
      parent?: SpanContext;
    }
  ): Promise<T> {
    const span = this.startSpan({
      name,
      parent: options?.parent,
      attributes: options?.attributes,
      kind: options?.kind,
    });

    try {
      const result = await fn(span);
      span.setStatus(SpanStatus.OK);
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus(SpanStatus.ERROR);
      throw error;
    } finally {
      span.end();
      this.recordSpan(span.toCompletedSpan());
    }
  }

  private recordSpan(span: CompletedSpan): void {
    if (this.exporter) {
      this.localSpanQueue.push(span);

      // Flush if queue is large
      if (this.localSpanQueue.length >= 100) {
        this.flush();
      }
    }
  }

  private async flush(): Promise<void> {
    if (!this.exporter || this.localSpanQueue.length === 0) return;

    const spans = [...this.localSpanQueue];
    this.localSpanQueue = [];

    try {
      await this.exporter.export(spans);
    } catch (error) {
      // Re-queue on failure
      this.localSpanQueue.unshift(...spans);
      console.error('Failed to export spans:', error);
    }
  }

  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush();
  }
}

// ============================================
// EXPORTERS
// ============================================

export class ConsoleExporter implements TraceExporter {
  async export(spans: CompletedSpan[]): Promise<void> {
    for (const span of spans) {
      console.log(JSON.stringify({
        type: 'span',
        name: span.name,
        traceId: span.context.traceId,
        spanId: span.context.spanId,
        parentSpanId: span.parentSpanId,
        startTime: span.startTime,
        duration: span.endTime - span.startTime,
        attributes: Object.fromEntries(span.attributes),
        events: span.events,
        status: span.status,
        kind: span.kind,
        errors: span.errors,
      }));
    }
  }
}

export class OtlpHttpExporter implements TraceExporter {
  constructor(private endpoint: string, private headers: Record<string, string> = {}) {}

  async export(spans: CompletedSpan[]): Promise<void> {
    const otlpSpans = spans.map(span => ({
      name: span.name,
      traceId: span.context.traceId,
      spanId: span.context.spanId,
      parentSpanId: span.parentSpanId || undefined,
      startTimeUnixNano: span.startTime * 1_000_000,
      endTimeUnixNano: span.endTime * 1_000_000,
      attributes: Array.from(span.attributes.entries()).map(([k, v]) => ({ key: k, value: { stringValue: String(v) } })),
      events: span.events.map(e => ({
        name: e.name,
        timeUnixNano: e.timestamp * 1_000_000,
        attributes: e.attributes ? Object.entries(e.attributes).map(([k, v]) => ({ key: k, value: { stringValue: String(v) } })) : [],
      })),
      status: { code: span.status },
      kind: span.kind,
    }));

    await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.headers,
      },
      body: JSON.stringify({ resourceSpans: [{ scopeSpans: [{ spans: otlpSpans }] }] }),
    });
  }
}

// ============================================
// FACTORY
// ============================================

let globalTracer: Tracer | null = null;

export function createTracer(
  serviceName: string,
  options?: {
    exporter?: TraceExporter;
    otlpEndpoint?: string;
    otlpHeaders?: Record<string, string>;
  }
): Tracer {
  const exporter = options?.otlpEndpoint
    ? new OtlpHttpExporter(options.otlpEndpoint, options.otlpHeaders)
    : options?.exporter || new ConsoleExporter();

  globalTracer = new Tracer(serviceName, exporter);
  return globalTracer;
}

export function getTracer(): Tracer | null {
  return globalTracer;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export async function withSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  options?: {
    attributes?: Record<string, string | number | boolean>;
    kind?: SpanKind;
  }
): Promise<T> {
  const tracer = getTracer();
  if (!tracer) {
    // Fallback: run without tracing
    return fn({
      context: () => ({ traceId: '', spanId: '', traceFlags: 0 }),
      setAttribute: () => {},
      setAttributes: () => {},
      addEvent: () => {},
      setStatus: () => {},
      end: () => {},
      recordException: () => {},
    });
  }
  return tracer.withSpan(name, fn, options);
}

// ============================================
// EXPRESS MIDDLEWARE
// ============================================

import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Express middleware for distributed tracing
 */
export function traceMiddleware(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const tracer = getTracer();
    if (!tracer) {
      return next();
    }

    // Extract or generate trace context from headers
    const traceId = req.headers['x-trace-id'] as string || crypto.randomBytes(16).toString('hex');
    const parentSpanId = req.headers['x-span-id'] as string;

    const parent: SpanContext | undefined = parentSpanId ? {
      traceId,
      spanId: parentSpanId,
      traceFlags: 1,
    } : undefined;

    const span = tracer.startSpan({
      name: `${req.method} ${req.path}`,
      parent,
      kind: SpanKind.SERVER,
      attributes: {
        'http.method': req.method,
        'http.url': req.url,
        'http.route': req.path,
        'http.host': req.headers.host || '',
        'http.user_agent': req.headers['user-agent'] || '',
      },
    });

    // Store span on request for downstream use
    (req as Request & { span?: Span }).span = span;

    // Add trace headers to response
    res.setHeader('X-Trace-ID', span.context().traceId);
    res.setHeader('X-Span-ID', span.context().spanId);

    // End span on response finish
    res.on('finish', () => {
      span.setAttribute('http.status_code', res.statusCode);
      if (res.statusCode >= 400) {
        span.setStatus(SpanStatus.ERROR);
      } else {
        span.setStatus(SpanStatus.OK);
      }
      span.end();
    });

    next();
  };
}

// ============================================
// TRACE CONTEXT UTILITIES
// ============================================

/**
 * Inject trace context into HTTP headers (W3C Trace Context)
 */
export function injectTraceContext(): Record<string, string> {
  const tracer = getTracer();
  if (!tracer) return {};

  // Generate a temporary span to get context
  const span = tracer.startSpan({ name: 'inject-context' });
  const ctx = span.context();
  span.end();

  return {
    'traceparent': `00-${ctx.traceId}-${ctx.spanId}-01`,
  };
}

/**
 * Extract trace context from HTTP headers (W3C Trace Context)
 */
export function extractTraceContext(headers: Record<string, string>): SpanContext | undefined {
  const traceparent = headers['traceparent'] || headers['x-trace-context'];
  if (!traceparent) return undefined;

  // W3C Trace Context format: version-traceId-spanId-flags
  const parts = traceparent.split('-');
  if (parts.length !== 4) return undefined;

  return {
    traceId: parts[1],
    spanId: parts[2],
    traceFlags: parseInt(parts[3], 16),
  };
}

export default {
  createTracer,
  getTracer,
  withSpan,
  traceMiddleware,
  injectTraceContext,
  extractTraceContext,
  SpanKind,
  SpanStatus,
};
