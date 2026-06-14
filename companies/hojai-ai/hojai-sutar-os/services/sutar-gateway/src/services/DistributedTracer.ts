// ============================================================================
// SUTAR Gateway - Distributed Tracer
// Request tracking across services
// ============================================================================

import { v4 as uuidv4 } from 'uuid';
import type { Trace, TraceSpan, TraceLog, ApiResponse } from '../types/index.js';

export interface TracerConfig {
  enabled: boolean;
  sampleRate: number;
  maxTraces: number;
  maxSpansPerTrace: number;
  retentionPeriod: number;
  includeBodies: boolean;
}

export interface TraceQuery {
  requestId?: string;
  service?: string;
  status?: number;
  startTime?: string;
  endTime?: string;
  limit?: number;
  offset?: number;
}

export interface SpanContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
}

export class DistributedTracer {
  private traces: Map<string, Trace> = new Map();
  private config: TracerConfig;
  private listeners: Set<(event: TracerEvent) => void> = new Set();
  private activeSpans: Map<string, TraceSpan> = new Map();
  private traceOrder: string[] = [];

  constructor(config?: Partial<TracerConfig>) {
    this.config = {
      enabled: config?.enabled ?? true,
      sampleRate: config?.sampleRate ?? 1.0, // 100% by default
      maxTraces: config?.maxTraces ?? 10000,
      maxSpansPerTrace: config?.maxSpansPerTrace ?? 100,
      retentionPeriod: config?.retentionPeriod ?? 3600000, // 1 hour
      includeBodies: config?.includeBodies ?? false,
    };

    this.startCleanupTask();
  }

  // ---------------------------------------------------------------------------
  // Trace Management
  // ---------------------------------------------------------------------------

  createTrace(requestId: string, metadata?: Record<string, unknown>): Trace {
    if (!this.config.enabled) {
      return this.createEmptyTrace(requestId);
    }

    // Check sample rate
    if (Math.random() > this.config.sampleRate) {
      return this.createEmptyTrace(requestId);
    }

    const trace: Trace = {
      id: uuidv4(),
      requestId,
      startTime: new Date().toISOString(),
      method: '',
      path: '',
      service: '',
      status: 0,
      spans: [],
      logs: [],
      metadata: metadata ?? {},
    };

    this.traces.set(trace.id, trace);
    this.traceOrder.push(trace.id);

    // Enforce max traces limit
    if (this.traceOrder.length > this.config.maxTraces) {
      const oldest = this.traceOrder.shift();
      if (oldest) {
        this.traces.delete(oldest);
      }
    }

    this.emit({
      type: 'trace_started',
      traceId: trace.id,
      requestId,
      timestamp: trace.startTime,
    });

    return trace;
  }

  private createEmptyTrace(requestId: string): Trace {
    return {
      id: '',
      requestId,
      startTime: '',
      spans: [],
      logs: [],
      metadata: {},
      method: '',
      path: '',
      service: '',
      status: 0,
    };
  }

  getTrace(traceId: string): ApiResponse<Trace | null> {
    const trace = this.traces.get(traceId);
    return this.successResponse(trace ?? null);
  }

  getTraceByRequestId(requestId: string): ApiResponse<Trace | null> {
    for (const trace of this.traces.values()) {
      if (trace.requestId === requestId) {
        return this.successResponse(trace);
      }
    }
    return this.successResponse(null);
  }

  updateTrace(
    traceId: string,
    updates: Partial<Pick<Trace, 'method' | 'path' | 'service' | 'status'>>
  ): void {
    const trace = this.traces.get(traceId);
    if (trace) {
      if (updates.method !== undefined) trace.method = updates.method;
      if (updates.path !== undefined) trace.path = updates.path;
      if (updates.service !== undefined) trace.service = updates.service;
      if (updates.status !== undefined) trace.status = updates.status;
    }
  }

  completeTrace(traceId: string, status?: number): void {
    const trace = this.traces.get(traceId);
    if (trace) {
      trace.endTime = new Date().toISOString();
      trace.duration = new Date(trace.endTime).getTime() - new Date(trace.startTime).getTime();
      if (status !== undefined) {
        trace.status = status;
      }

      this.emit({
        type: 'trace_completed',
        traceId,
        duration: trace.duration,
        status: trace.status,
        timestamp: trace.endTime,
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Span Management
  // ---------------------------------------------------------------------------

  startSpan(
    traceId: string,
    name: string,
    serviceId: string,
    parentSpanId?: string
  ): TraceSpan {
    const span: TraceSpan = {
      id: uuidv4(),
      name,
      serviceId,
      startTime: new Date().toISOString(),
      tags: {},
      logs: [],
      status: 'ok',
    };

    if (parentSpanId) {
      span.tags['parent.span_id'] = parentSpanId;
    }

    const trace = this.traces.get(traceId);
    if (trace && trace.id) {
      // Check max spans limit
      if (trace.spans.length < this.config.maxSpansPerTrace) {
        trace.spans.push(span);
      }
    }

    this.activeSpans.set(span.id, span);

    this.emit({
      type: 'span_started',
      traceId,
      spanId: span.id,
      name,
      serviceId,
      timestamp: span.startTime,
    });

    return span;
  }

  endSpan(spanId: string, status: 'ok' | 'error' = 'ok', error?: string): void {
    const span = this.activeSpans.get(spanId);
    if (!span) return;

    span.endTime = new Date().toISOString();
    span.duration = new Date(span.endTime).getTime() - new Date(span.startTime).getTime();
    span.status = status;

    if (error) {
      span.tags['error'] = 'true';
      span.tags['error.message'] = error;
    }

    this.activeSpans.delete(spanId);

    this.emit({
      type: 'span_ended',
      spanId: span.id,
      name: span.name,
      duration: span.duration,
      status,
      timestamp: span.endTime,
    });
  }

  addSpanTag(spanId: string, key: string, value: string): void {
    const span = this.activeSpans.get(spanId);
    if (span) {
      span.tags[key] = value;
    }
  }

  addSpanLog(spanId: string, fields: Record<string, unknown>): void {
    const span = this.activeSpans.get(spanId);
    if (span) {
      span.logs.push({
        timestamp: new Date().toISOString(),
        fields,
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Trace Logs
  // ---------------------------------------------------------------------------

  addTraceLog(traceId: string, fields: Record<string, unknown>): void {
    const trace = this.traces.get(traceId);
    if (trace) {
      trace.logs.push({
        timestamp: new Date().toISOString(),
        fields,
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Query Traces
  // ---------------------------------------------------------------------------

  queryTraces(query: TraceQuery): ApiResponse<{ traces: Trace[]; total: number }> {
    let traces = Array.from(this.traces.values());

    // Apply filters
    if (query.requestId) {
      traces = traces.filter(t => t.requestId === query.requestId);
    }
    if (query.service) {
      traces = traces.filter(t => t.service === query.service);
    }
    if (query.status) {
      traces = traces.filter(t => t.status === query.status);
    }
    if (query.startTime) {
      const start = new Date(query.startTime).getTime();
      traces = traces.filter(t => new Date(t.startTime).getTime() >= start);
    }
    if (query.endTime) {
      const end = new Date(query.endTime).getTime();
      traces = traces.filter(t => {
        const traceEnd = t.endTime ? new Date(t.endTime).getTime() : Date.now();
        return traceEnd <= end;
      });
    }

    const total = traces.length;

    // Sort by start time descending
    traces.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    // Apply pagination
    if (query.offset !== undefined) {
      traces = traces.slice(query.offset);
    }
    if (query.limit !== undefined) {
      traces = traces.slice(0, query.limit);
    }

    return this.successResponse({ traces, total });
  }

  // ---------------------------------------------------------------------------
  // Active Traces
  // ---------------------------------------------------------------------------

  getActiveTraces(): ApiResponse<Trace[]> {
    const active = Array.from(this.traces.values())
      .filter(t => !t.endTime);
    return this.successResponse(active);
  }

  getActiveSpanCount(): number {
    return this.activeSpans.size;
  }

  // ---------------------------------------------------------------------------
  // Service Trace Summary
  // ---------------------------------------------------------------------------

  getServiceTraceSummary(service: string): ApiResponse<{
    totalTraces: number;
    completedTraces: number;
    activeTraces: number;
    avgDuration: number;
    errorRate: number;
    lastTrace?: string;
  }> {
    const traces = Array.from(this.traces.values())
      .filter(t => t.service === service);

    const completed = traces.filter(t => t.endTime);
    const active = traces.filter(t => !t.endTime);
    const errors = traces.filter(t => t.status >= 400);

    const durations = completed
      .filter(t => t.duration !== undefined)
      .map(t => t.duration!);

    const avgDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;

    return this.successResponse({
      totalTraces: traces.length,
      completedTraces: completed.length,
      activeTraces: active.length,
      avgDuration: Math.round(avgDuration),
      errorRate: traces.length > 0 ? errors.length / traces.length : 0,
      lastTrace: traces.length > 0 ? traces[0].startTime : undefined,
    });
  }

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  private startCleanupTask(): void {
    setInterval(() => {
      const cutoff = Date.now() - this.config.retentionPeriod;

      for (const [id, trace] of this.traces) {
        const traceTime = new Date(trace.startTime).getTime();
        if (traceTime < cutoff) {
          this.traces.delete(id);
          const orderIndex = this.traceOrder.indexOf(id);
          if (orderIndex !== -1) {
            this.traceOrder.splice(orderIndex, 1);
          }
        }
      }
    }, 300000); // Run every 5 minutes
  }

  clearAllTraces(): ApiResponse<{ cleared: number }> {
    const cleared = this.traces.size;
    this.traces.clear();
    this.traceOrder = [];
    this.activeSpans.clear();
    return this.successResponse({ cleared });
  }

  // ---------------------------------------------------------------------------
  // Event System
  // ---------------------------------------------------------------------------

  private emit(event: TracerEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('[Tracer] Event listener error:', error);
      }
    }
  }

  onEvent(listener: (event: TracerEvent) => void): void {
    this.listeners.add(listener);
  }

  offEvent(listener: (event: TracerEvent) => void): void {
    this.listeners.delete(listener);
  }

  // ---------------------------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------------------------

  private successResponse<T>(data: T, message?: string): ApiResponse<T> {
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  private errorResponse<T>(error: string): ApiResponse<T> {
    return { success: false, error, timestamp: new Date().toISOString() };
  }

  // ---------------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------------

  updateConfig(config: Partial<TracerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): TracerConfig {
    return { ...this.config };
  }

  // ---------------------------------------------------------------------------
  // Statistics
  // ---------------------------------------------------------------------------

  getStats(): {
    totalTraces: number;
    activeTraces: number;
    activeSpans: number;
    completedTraces: number;
    avgDuration: number;
    errorCount: number;
    retentionPeriod: number;
  } {
    const traces = Array.from(this.traces.values());
    const completed = traces.filter(t => t.endTime);
    const errors = traces.filter(t => t.status >= 400);

    const durations = completed
      .filter(t => t.duration !== undefined)
      .map(t => t.duration!);

    return {
      totalTraces: traces.length,
      activeTraces: traces.filter(t => !t.endTime).length,
      activeSpans: this.activeSpans.size,
      completedTraces: completed.length,
      avgDuration: durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0,
      errorCount: errors.length,
      retentionPeriod: this.config.retentionPeriod,
    };
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  destroy(): void {
    this.traces.clear();
    this.traceOrder = [];
    this.activeSpans.clear();
    this.listeners.clear();
  }
}

// ============================================================================
// Types and Singleton
// ============================================================================

export interface TracerEvent {
  type: 'trace_started' | 'trace_completed' | 'span_started' | 'span_ended';
  traceId?: string;
  requestId?: string;
  spanId?: string;
  name?: string;
  serviceId?: string;
  duration?: number;
  status?: number;
  timestamp: string;
}

export const distributedTracer = new DistributedTracer();

// Helper functions
export function startTrace(requestId: string, metadata?: Record<string, unknown>): Trace {
  return distributedTracer.createTrace(requestId, metadata);
}

export function getTrace(requestId: string): ApiResponse<Trace | null> {
  return distributedTracer.getTraceByRequestId(requestId);
}

export function createSpanContext(traceId: string, spanId: string, parentSpanId?: string): SpanContext {
  return { traceId, spanId, parentSpanId };
}
