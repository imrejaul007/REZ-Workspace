// @ts-nocheck
/**
 * OBSERVABILITY API SERVICE
 * Integration with RABTUL Observability Platform
 *
 * Service: REZ-observability-platform
 * Port: 4025
 * URL: https://rez-observability.onrender.com
 *
 * Features:
 * - Metrics collection
 * - Tracing
 * - Log aggregation
 * - Performance monitoring
 * - Error tracking
 */

import { logger } from '@/utils/logger';
import apiClient, { ApiResponse } from './apiClient';

// ============================================================================
// TYPES
// ============================================================================

export interface Metric {
  name: string;
  value: number;
  unit?: string;
  tags?: Record<string, string>;
  timestamp?: string;
}

export interface Trace {
  traceId: string;
  spanId: string;
  operationName: string;
  serviceName: string;
  startTime: number;
  endTime: number;
  duration: number;
  status: 'ok' | 'error';
  tags?: Record<string, string>;
  logs?: TraceLog[];
}

export interface TraceLog {
  timestamp: string;
  message: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  attributes?: Record<string, unknown>;
}

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  service: string;
  timestamp: string;
  traceId?: string;
  spanId?: string;
  userId?: string;
  sessionId?: string;
  attributes?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percent';
  category: 'network' | 'render' | 'interaction' | 'resource';
  tags?: Record<string, string>;
}

export interface ErrorReport {
  errorId: string;
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  context: {
    userId?: string;
    sessionId?: string;
    screen?: string;
    component?: string;
    action?: string;
  };
  metadata?: Record<string, unknown>;
  timestamp: string;
  resolved: boolean;
}

export interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
  lastCheck: string;
  uptime: number;
}

// ============================================================================
// METRICS API
// ============================================================================

/**
 * Record a custom metric
 */
export async function recordMetric(metric: Metric): Promise<ApiResponse<{ success: boolean }>> {
  try {
    return await apiClient.post('/observability/metrics', {
      ...metric,
      timestamp: metric.timestamp || new Date().toISOString(),
    });
  } catch (error) {
    logger.error('observabilityApi.recordMetric', { metric, error });
    // Don't throw - metrics should not break the app
    return { success: false, error: 'Failed to record metric' };
  }
}

/**
 * Record multiple metrics at once
 */
export async function recordMetrics(metrics: Metric[]): Promise<ApiResponse<{ success: boolean }>> {
  try {
    return await apiClient.post('/observability/metrics/batch', {
      metrics: metrics.map((m) => ({
        ...m,
        timestamp: m.timestamp || new Date().toISOString(),
      })),
    });
  } catch (error) {
    logger.error('observabilityApi.recordMetrics', { count: metrics.length, error });
    return { success: false, error: 'Failed to record metrics' };
  }
}

/**
 * Get metric history
 */
export async function getMetricHistory(
  params: {
    name: string;
    start: string;
    end: string;
    tags?: Record<string, string>;
  }
): Promise<ApiResponse<{
  metrics: Array<{
    timestamp: string;
    value: number;
    tags: Record<string, string>;
  }>;
}>> {
  try {
    const queryParams = new URLSearchParams({
      name: params.name,
      start: params.start,
      end: params.end,
    });
    if (params.tags) {
      Object.entries(params.tags).forEach(([key, value]) => {
        queryParams.append(`tags[${key}]`, value);
      });
    }
    return await apiClient.get(`/observability/metrics?${queryParams.toString()}`);
  } catch (error) {
    logger.error('observabilityApi.getMetricHistory', { params, error });
    throw error;
  }
}

// ============================================================================
// TRACING API
// ============================================================================

/**
 * Start a new trace
 */
export async function startTrace(operationName: string, serviceName: string): Promise<{
  traceId: string;
  spanId: string;
}> {
  // Generate trace IDs
  const traceId = generateId();
  const spanId = generateId();

  return { traceId, spanId };
}

/**
 * End a trace and record it
 */
export async function endTrace(trace: Trace): Promise<ApiResponse<{ success: boolean }>> {
  try {
    return await apiClient.post('/observability/traces', trace);
  } catch (error) {
    logger.error('observabilityApi.endTrace', { traceId: trace.traceId, error });
    return { success: false, error: 'Failed to record trace' };
  }
}

/**
 * Create a child span
 */
export function createSpan(
  parentTraceId: string,
  parentSpanId: string,
  operationName: string,
  serviceName: string
): { traceId: string; spanId: string; end: (status?: 'ok' | 'error') => Promise<void> } {
  const traceId = parentTraceId;
  const spanId = generateId();
  const startTime = Date.now();

  return {
    traceId,
    spanId,
    end: async (status: 'ok' | 'error' = 'ok') => {
      const endTime = Date.now();
      await endTrace({
        traceId,
        spanId,
        operationName,
        serviceName,
        startTime,
        endTime,
        duration: endTime - startTime,
        status,
      });
    },
  };
}

// ============================================================================
// LOGGING API
// ============================================================================

/**
 * Send logs to observability platform
 */
export async function sendLogs(logs: LogEntry[]): Promise<ApiResponse<{ success: boolean }>> {
  try {
    return await apiClient.post('/observability/logs', {
      logs: logs.map((log) => ({
        ...log,
        timestamp: log.timestamp || new Date().toISOString(),
      })),
    });
  } catch (error) {
    logger.error('observabilityApi.sendLogs', { count: logs.length, error });
    return { success: false, error: 'Failed to send logs' };
  }
}

/**
 * Send a single log entry
 */
export async function sendLog(log: Omit<LogEntry, 'timestamp'>): Promise<ApiResponse<{ success: boolean }>> {
  return sendLogs([{ ...log, timestamp: new Date().toISOString() }]);
}

// ============================================================================
// ERROR REPORTING API
// ============================================================================

/**
 * Report an error
 */
export async function reportError(report: ErrorReport): Promise<ApiResponse<{ errorId: string }>> {
  try {
    return await apiClient.post('/observability/errors', report);
  } catch (error) {
    logger.error('observabilityApi.reportError', { error: report.error, error });
    // Don't throw - error reporting should not break the app
    return { success: false, error: 'Failed to report error' };
  }
}

/**
 * Get error details
 */
export async function getErrorDetails(errorId: string): Promise<ApiResponse<ErrorReport>> {
  try {
    return await apiClient.get(`/observability/errors/${errorId}`);
  } catch (error) {
    logger.error('observabilityApi.getErrorDetails', { errorId, error });
    throw error;
  }
}

/**
 * Mark error as resolved
 */
export async function resolveError(errorId: string): Promise<ApiResponse<{ success: boolean }>> {
  try {
    return await apiClient.patch(`/observability/errors/${errorId}/resolve`, {});
  } catch (error) {
    logger.error('observabilityApi.resolveError', { errorId, error });
    throw error;
  }
}

/**
 * Get error history
 */
export async function getErrorHistory(
  params?: {
    page?: number;
    limit?: number;
    start?: string;
    end?: string;
    resolved?: boolean;
  }
): Promise<ApiResponse<{
  errors: ErrorReport[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}>> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.start) queryParams.set('start', params.start);
    if (params?.end) queryParams.set('end', params.end);
    if (params?.resolved !== undefined) queryParams.set('resolved', params.resolved.toString());

    const query = queryParams.toString();
    return await apiClient.get(`/observability/errors${query ? `?${query}` : ''}`);
  } catch (error) {
    logger.error('observabilityApi.getErrorHistory', { params, error });
    throw error;
  }
}

// ============================================================================
// HEALTH CHECKS
// ============================================================================

/**
 * Get service health status
 */
export async function getServiceHealth(service?: string): Promise<ApiResponse<{
  services: HealthCheck[];
}>> {
  try {
    const url = service ? `/observability/health/${service}` : '/observability/health';
    return await apiClient.get(url);
  } catch (error) {
    logger.error('observabilityApi.getServiceHealth', { service, error });
    throw error;
  }
}

/**
 * Check if a specific service is healthy
 */
export async function isServiceHealthy(service: string): Promise<boolean> {
  try {
    const response = await getServiceHealth(service);
    if (response.success && response.data) {
      return response.data.services.some((s) => s.status === 'healthy');
    }
    return false;
  } catch {
    return false;
  }
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

/**
 * Record screen render time
 */
export function recordScreenRender(screenName: string, renderTime: number): void {
  recordMetric({
    name: `screen.render.${screenName}`,
    value: renderTime,
    unit: 'ms',
    category: 'render',
    tags: { screen: screenName },
  });
}

/**
 * Record API call time
 */
export function recordApiCall(endpoint: string, method: string, duration: number, status: number): void {
  recordMetric({
    name: `api.call.${endpoint}`,
    value: duration,
    unit: 'ms',
    category: 'network',
    tags: { endpoint, method, status: status.toString() },
  });
}

/**
 * Record user interaction time
 */
export function recordInteraction(action: string, component: string, duration: number): void {
  recordMetric({
    name: `interaction.${action}`,
    value: duration,
    unit: 'ms',
    category: 'interaction',
    tags: { action, component },
  });
}

/**
 * Record resource load time
 */
export function recordResourceLoad(resourceType: string, resourceUrl: string, loadTime: number, size: number): void {
  recordMetric({
    name: `resource.load.${resourceType}`,
    value: loadTime,
    unit: 'ms',
    category: 'resource',
    tags: { type: resourceType, size: size.toString() },
  });
}

// ============================================================================
// UTILITIES
// ============================================================================

function generateId(): string {
  if (typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default {
  // Metrics
  recordMetric,
  recordMetrics,
  getMetricHistory,
  // Tracing
  startTrace,
  endTrace,
  createSpan,
  // Logging
  sendLogs,
  sendLog,
  // Error reporting
  reportError,
  getErrorDetails,
  resolveError,
  getErrorHistory,
  // Health
  getServiceHealth,
  isServiceHealthy,
  // Performance
  recordScreenRender,
  recordApiCall,
  recordInteraction,
  recordResourceLoad,
};
