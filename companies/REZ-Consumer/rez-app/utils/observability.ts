/**
 * OBSERVABILITY SERVICE
 * Integration with REZ-observability (RABTUL)
 *
 * Features:
 * - Custom metrics (counters, gauges, histograms)
 * - Distributed tracing
 * - Performance monitoring
 * - Error tracking
 * - Real-time analytics
 */

import { logger } from './logger';

// ============================================================================
// TYPES
// ============================================================================

export type MetricType = 'counter' | 'gauge' | 'histogram' | 'timer';

export interface Metric {
  name: string;
  value: number;
  type: MetricType;
  tags?: Record<string, string>;
  timestamp?: number;
}

export interface TraceSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  startTime: number;
  endTime?: number;
  tags?: Record<string, string | number | boolean>;
  annotations?: Array<{
    timestamp: number;
    value: string;
  }>;
}

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: number;
  service: string;
  traceId?: string;
  spanId?: string;
  tags?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, unknown>;
  timestamp: number;
  userId?: string;
  sessionId?: string;
  traceId?: string;
}

// ============================================================================
// SERVICE CONFIGURATION
// ============================================================================

const OBSERVABILITY_URL = process.env.EXPO_PUBLIC_OBSERVABILITY_URL || 'https://rez-observability.onrender.com';
const OBSERVABILITY_API_VERSION = 'v1';
const OBSERVABILITY_BASE_URL = `${OBSERVABILITY_URL}/api/${OBSERVABILITY_API_VERSION}`;

// Buffer configuration
const METRIC_BUFFER_SIZE = 100;
const METRIC_FLUSH_INTERVAL = 10000; // 10 seconds
const EVENT_BUFFER_SIZE = 50;
const EVENT_FLUSH_INTERVAL = 5000; // 5 seconds

// Buffers
let metricBuffer: Metric[] = [];
let eventBuffer: AnalyticsEvent[] = [];
let flushTimers: ReturnType<typeof setInterval>[] = [];

// ============================================================================
// TRACE UTILITIES
// ============================================================================

// Simple trace ID generator
function generateTraceId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 10)}`;
}

function generateSpanId(): string {
  return Math.random().toString(16).substring(2, 10);
}

// Current trace context
let currentTraceId: string | null = null;
let currentSpanId: string | null = null;

/**
 * Start a new trace
 */
export function startTrace(serviceName: string): TraceSpan {
  currentTraceId = generateTraceId();
  currentSpanId = generateSpanId();

  return {
    traceId: currentTraceId,
    spanId: currentSpanId,
    name: serviceName,
    startTime: Date.now(),
  };
}

/**
 * End a trace
 */
export function endTrace(span: TraceSpan, tags?: Record<string, string | number | boolean>): void {
  span.endTime = Date.now();
  span.tags = { ...span.tags, ...tags };

  // Calculate duration
  const duration = span.endTime - span.startTime;

  // Record as metric
  recordHistogram('trace.duration', duration, { service: span.name });

  logger.debug(`[Trace] ${span.name} completed in ${duration}ms`);
}

/**
 * Get current trace context
 */
export function getTraceContext(): { traceId: string; spanId: string } | null {
  if (!currentTraceId || !currentSpanId) return null;
  return { traceId: currentTraceId, spanId: currentSpanId };
}

// ============================================================================
// METRICS
// ============================================================================

/**
 * Record a counter metric
 */
export function recordCounter(name: string, value: number = 1, tags?: Record<string, string>): void {
  const metric: Metric = {
    name,
    value,
    type: 'counter',
    tags,
    timestamp: Date.now(),
  };

  addToBuffer(metric, metricBuffer, METRIC_BUFFER_SIZE);
  logger.debug(`[Metric] Counter ${name}=${value}`, tags);
}

/**
 * Record a gauge metric
 */
export function recordGauge(name: string, value: number, tags?: Record<string, string>): void {
  const metric: Metric = {
    name,
    value,
    type: 'gauge',
    tags,
    timestamp: Date.now(),
  };

  addToBuffer(metric, metricBuffer, METRIC_BUFFER_SIZE);
  logger.debug(`[Metric] Gauge ${name}=${value}`, tags);
}

/**
 * Record a histogram metric
 */
export function recordHistogram(name: string, value: number, tags?: Record<string, string>): void {
  const metric: Metric = {
    name,
    value,
    type: 'histogram',
    tags,
    timestamp: Date.now(),
  };

  addToBuffer(metric, metricBuffer, METRIC_BUFFER_SIZE);
  logger.debug(`[Metric] Histogram ${name}=${value}`, tags);
}

/**
 * Record timing
 */
export function recordTiming(name: string, durationMs: number, tags?: Record<string, string>): void {
  recordHistogram(`${name}.duration`, durationMs, tags);
}

/**
 * Start a timer
 */
export function startTimer(name: string, tags?: Record<string, string>): () => void {
  const startTime = Date.now();

  return () => {
    const duration = Date.now() - startTime;
    recordTiming(name, duration, tags);
  };
}

/**
 * Helper to add item to buffer
 */
function addToBuffer<T>(item: T, buffer: T[], maxSize: number): void {
  buffer.push(item);
  if (buffer.length > maxSize) {
    buffer.shift();
  }
}

// ============================================================================
// ANALYTICS EVENTS
// ============================================================================

/**
 * Track an analytics event
 */
export function trackEvent(
  event: string,
  properties?: Record<string, unknown>,
  options?: { userId?: string; sessionId?: string }
): void {
  const analyticsEvent: AnalyticsEvent = {
    event,
    properties,
    timestamp: Date.now(),
    userId: options?.userId,
    sessionId: options?.sessionId,
    traceId: currentTraceId || undefined,
  };

  addToBuffer(analyticsEvent, eventBuffer, EVENT_BUFFER_SIZE);
  logger.debug(`[Analytics] Event: ${event}`, properties);
}

/**
 * Track a screen view
 */
export function trackScreenView(
  screenName: string,
  properties?: Record<string, unknown>,
  options?: { userId?: string; sessionId?: string }
): void {
  trackEvent('screen_view', {
    screen_name: screenName,
    ...properties,
  }, options);
}

/**
 * Track a user action
 */
export function trackUserAction(
  action: string,
  properties?: Record<string, unknown>,
  options?: { userId?: string; sessionId?: string }
): void {
  trackEvent('user_action', {
    action,
    ...properties,
  }, options);
}

/**
 * Track an error
 */
export function trackError(
  error: Error,
  context?: Record<string, unknown>,
  options?: { userId?: string; sessionId?: string }
): void {
  trackEvent('error', {
    error_name: error.name,
    error_message: error.message,
    error_stack: error.stack,
    ...context,
  }, options);

  // Also record as metric
  recordCounter('errors.total', 1, {
    error_type: error.name,
    error_message: error.message.substring(0, 50),
  });
}

/**
 * Track API call
 */
export function trackApiCall(
  endpoint: string,
  method: string,
  statusCode: number,
  durationMs: number,
  options?: { userId?: string }
): void {
  const tags = {
    endpoint,
    method,
    status_class: String(Math.floor(statusCode / 100)),
  };

  // Record count
  recordCounter('api.requests', 1, tags);

  // Record duration
  recordHistogram('api.duration', durationMs, tags);

  // Record error if applicable
  if (statusCode >= 400) {
    recordCounter('api.errors', 1, tags);
  }
}

/**
 * Track performance metric
 */
export function trackPerformance(
  metric: string,
  value: number,
  properties?: Record<string, unknown>
): void {
  trackEvent('performance', {
    metric,
    value,
    ...properties,
  });
}

// ============================================================================
// BUFFER FLUSHING
// ============================================================================

/**
 * Flush metrics to server
 */
async function flushMetrics(): Promise<void> {
  if (metricBuffer.length === 0) return;

  const metrics = [...metricBuffer];
  metricBuffer = [];

  try {
    const response = await fetch(`${OBSERVABILITY_BASE_URL}/metrics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metrics,
        traceId: currentTraceId,
        timestamp: Date.now(),
      }),
    });

    if (!response.ok) {
      // Re-add metrics to buffer on failure
      metricBuffer = [...metrics, ...metricBuffer].slice(0, METRIC_BUFFER_SIZE);
    }
  } catch (error) {
    // Silently fail - don't block app
    logger.debug('[Observability] Failed to flush metrics:', error);
  }
}

/**
 * Flush events to server
 */
async function flushEvents(): Promise<void> {
  if (eventBuffer.length === 0) return;

  const events = [...eventBuffer];
  eventBuffer = [];

  try {
    const response = await fetch(`${OBSERVABILITY_BASE_URL}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        events,
        timestamp: Date.now(),
      }),
    });

    if (!response.ok) {
      // Re-add events to buffer on failure
      eventBuffer = [...events, ...eventBuffer].slice(0, EVENT_BUFFER_SIZE);
    }
  } catch (error) {
    // Silently fail - don't block app
    logger.debug('[Observability] Failed to flush events:', error);
  }
}

/**
 * Start background flushing
 */
export function startObservability(): void {
  // Clear any existing timers
  stopObservability();

  // Start metric flush timer
  flushTimers.push(setInterval(flushMetrics, METRIC_FLUSH_INTERVAL));

  // Start event flush timer
  flushTimers.push(setInterval(flushEvents, EVENT_FLUSH_INTERVAL));

  logger.debug('[Observability] Started background flushing');
}

/**
 * Stop background flushing
 */
export function stopObservability(): void {
  flushTimers.forEach(timer => clearInterval(timer));
  flushTimers = [];
  logger.debug('[Observability] Stopped background flushing');
}

/**
 * Flush all buffers immediately
 */
export async function flushAll(): Promise<void> {
  await Promise.all([flushMetrics(), flushEvents()]);
}

// ============================================================================
// PERFORMANCE MARK
// ============================================================================

/**
 * Mark performance timing
 */
export function mark(name: string, tags?: Record<string, string | number>): void {
  if (typeof performance !== 'undefined' && 'mark' in performance) {
    (performance as Performance).mark(name);
  }
  recordCounter(`perf.mark.${name}`, 1, tags as Record<string, string>);
}

/**
 * Measure performance between two marks
 */
export function measure(
  name: string,
  startMark: string,
  endMark?: string,
  tags?: Record<string, string | number>
): number {
  let duration = 0;

  if (typeof performance !== 'undefined' && 'measure' in performance) {
    try {
      (performance as Performance).measure(name, startMark, endMark);
      duration = (performance as Performance).now();
    } catch {
      // Mark not found
    }
  }

  if (duration > 0) {
    recordHistogram(`perf.measure.${name}`, duration, tags as Record<string, string>);
  }

  return duration;
}

// ============================================================================
// LIFECYCLE
// ============================================================================

// Auto-start on app initialization
let initialized = false;

/**
 * Initialize observability (call once on app start)
 */
export function initObservability(): void {
  if (initialized) return;
  initialized = true;

  // Start background flushing
  startObservability();

  // Track app start
  trackEvent('app_start', {
    timestamp: Date.now(),
    platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
  });

  logger.info('[Observability] Initialized');
}

/**
 * Cleanup observability (call on app unmount)
 */
export function cleanupObservability(): void {
  stopObservability();

  // Final flush
  flushAll().catch(() => {});

  initialized = false;
  logger.info('[Observability] Cleaned up');
}

// ============================================================================
// EXPORTS
// ============================================================================

export const observability = {
  // Tracing
  startTrace,
  endTrace,
  getTraceContext,

  // Metrics
  recordCounter,
  recordGauge,
  recordHistogram,
  recordTiming,
  startTimer,

  // Analytics
  trackEvent,
  trackScreenView,
  trackUserAction,
  trackError,
  trackApiCall,
  trackPerformance,

  // Lifecycle
  initObservability,
  cleanupObservability,
  startObservability,
  stopObservability,
  flushAll,

  // Performance
  mark,
  measure,
};

export default observability;
