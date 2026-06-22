/**
 * REZ Workspace - Production Monitoring & Metrics
 *
 * Features:
 * - Prometheus metrics endpoint
 * - Request/response logging
 * - Performance monitoring
 * - Health checks
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../../shared/logger';

// ============================================
// METRICS COLLECTOR
// ============================================

interface Metrics {
  requestsTotal: Map<string, number>;
  requestsSuccess: Map<string, number>;
  requestsError: Map<string, number>;
  requestDuration: Map<string, number[]>;
  activeConnections: number;
  wsConnections: number;
  dbQueryDuration: Map<string, number[]>;
  cacheHits: number;
  cacheMisses: number;
}

const metrics: Metrics = {
  requestsTotal: new Map(),
  requestsSuccess: new Map(),
  requestsError: new Map(),
  requestDuration: new Map(),
  activeConnections: 0,
  wsConnections: 0,
  dbQueryDuration: new Map(),
  cacheHits: 0,
  cacheMisses: 0,
};

// ============================================
// METRICS UTILITIES
// ============================================

export function incrementRequestCounter(path: string, status: number): void {
  // Total requests
  const total = metrics.requestsTotal.get(path) || 0;
  metrics.requestsTotal.set(path, total + 1);

  // Success/Error
  if (status >= 200 && status < 400) {
    const success = metrics.requestsSuccess.get(path) || 0;
    metrics.requestsSuccess.set(path, success + 1);
  } else {
    const error = metrics.requestsError.get(path) || 0;
    metrics.requestsError.set(path, error + 1);
  }
}

export function recordRequestDuration(path: string, duration: number): void {
  const durations = metrics.requestDuration.get(path) || [];
  durations.push(duration);

  // Keep only last 1000 durations for percentile calculation
  if (durations.length > 1000) {
    durations.shift();
  }

  metrics.requestDuration.set(path, durations);
}

export function incrementActiveConnections(delta: number): void {
  metrics.activeConnections = Math.max(0, metrics.activeConnections + delta);
}

export function incrementWsConnections(delta: number): void {
  metrics.wsConnections = Math.max(0, metrics.wsConnections + delta);
}

export function recordDbQueryDuration(query: string, duration: number): void {
  const durations = metrics.dbQueryDuration.get(query) || [];
  durations.push(duration);

  if (durations.length > 1000) {
    durations.shift();
  }

  metrics.dbQueryDuration.set(query, durations);
}

export function incrementCacheHit(): void {
  metrics.cacheHits++;
}

export function incrementCacheMiss(): void {
  metrics.cacheMisses++;
}

// ============================================
// CALCULATE PERCENTILES
// ============================================

function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

function calculateStats(values: number[]): { avg: number; min: number; max: number; p50: number; p95: number; p99: number } {
  if (values.length === 0) {
    return { avg: 0, min: 0, max: 0, p50: 0, p95: 0, p99: 0 };
  }

  const sum = values.reduce((a, b) => a + b, 0);
  return {
    avg: sum / values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    p50: calculatePercentile(values, 50),
    p95: calculatePercentile(values, 95),
    p99: calculatePercentile(values, 99),
  };
}

// ============================================
// METRICS FORMATS
// ============================================

export function getPrometheusMetrics(): string {
  const lines: string[] = [
    '# HELP rez_workspace_requests_total Total number of requests',
    '# TYPE rez_workspace_requests_total counter',
  ];

  metrics.requestsTotal.forEach((total, path) => {
    const success = metrics.requestsSuccess.get(path) || 0;
    const error = metrics.requestsError.get(path) || 0;
    lines.push(`rez_workspace_requests_total{path="${path}",status="success"} ${success}`);
    lines.push(`rez_workspace_requests_total{path="${path}",status="error"} ${error}`);
    lines.push(`rez_workspace_requests_total{path="${path}",status="total"} ${total}`);
  });

  lines.push('');
  lines.push('# HELP rez_workspace_request_duration_ms Request duration in milliseconds');
  lines.push('# TYPE rez_workspace_request_duration_ms histogram');

  metrics.requestDuration.forEach((durations, path) => {
    const stats = calculateStats(durations);
    lines.push(`rez_workspace_request_duration_ms{path="${path}",quantile="0.5"} ${stats.p50}`);
    lines.push(`rez_workspace_request_duration_ms{path="${path}",quantile="0.95"} ${stats.p95}`);
    lines.push(`rez_workspace_request_duration_ms{path="${path}",quantile="0.99"} ${stats.p99}`);
    lines.push(`rez_workspace_request_duration_ms_avg{path="${path}"} ${stats.avg}`);
  });

  lines.push('');
  lines.push('# HELP rez_workspace_active_connections Active HTTP connections');
  lines.push('# TYPE rez_workspace_active_connections gauge');
  lines.push(`rez_workspace_active_connections ${metrics.activeConnections}`);

  lines.push('');
  lines.push('# HELP rez_workspace_ws_connections Active WebSocket connections');
  lines.push('# TYPE rez_workspace_ws_connections gauge');
  lines.push(`rez_workspace_ws_connections ${metrics.wsConnections}`);

  lines.push('');
  lines.push('# HELP rez_workspace_cache_hits_total Cache hits');
  lines.push('# TYPE rez_workspace_cache_hits_total counter');
  lines.push(`rez_workspace_cache_hits_total ${metrics.cacheHits}`);

  lines.push('');
  lines.push('# HELP rez_workspace_cache_misses_total Cache misses');
  lines.push('# TYPE rez_workspace_cache_misses_total counter');
  lines.push(`rez_workspace_cache_misses_total ${metrics.cacheMisses}`);

  return lines.join('\n');
}

export function getJsonMetrics(): object {
  const requestMetrics: Record<string, object> = {};

  metrics.requestsTotal.forEach((_, path) => {
    const durations = metrics.requestDuration.get(path) || [];
    requestMetrics[path] = {
      total: metrics.requestsTotal.get(path) || 0,
      success: metrics.requestsSuccess.get(path) || 0,
      error: metrics.requestsError.get(path) || 0,
      duration: calculateStats(durations),
    };
  });

  const dbMetrics: Record<string, object> = {};
  metrics.dbQueryDuration.forEach((durations, query) => {
    dbMetrics[query] = calculateStats(durations);
  });

  return {
    timestamp: new Date().toISOString(),
    requests: requestMetrics,
    connections: {
      active: metrics.activeConnections,
      ws: metrics.wsConnections,
    },
    cache: {
      hits: metrics.cacheHits,
      misses: metrics.cacheMisses,
      hitRate: metrics.cacheHits + metrics.cacheMisses > 0
        ? (metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses) * 100).toFixed(2) + '%'
        : '0%',
    },
    database: dbMetrics,
  };
}

// ============================================
// REQUEST LOGGING MIDDLEWARE
// ============================================

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  incrementActiveConnections(1);

  // Log request
  logger.info(`[Request] ${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  // Log response on finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    incrementActiveConnections(-1);
    incrementRequestCounter(req.path, res.statusCode);
    recordRequestDuration(req.path, duration);

    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    const logFn = level === 'error' ? logger.error : level === 'warn' ? logger.warn : logger.info;

    logFn(`[Response] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });

  next();
}

// ============================================
// METRICS ENDPOINTS
// ============================================

export function metricsRoutes(app: any): void {
  // Prometheus metrics
  app.get('/metrics', (req: Request, res: Response) => {
    res.set('Content-Type', 'text/plain');
    res.send(getPrometheusMetrics());
  });

  // JSON metrics
  app.get('/health/metrics', (req: Request, res: Response) => {
    res.json(getJsonMetrics());
  });
}

export default {
  incrementRequestCounter,
  recordRequestDuration,
  incrementActiveConnections,
  incrementWsConnections,
  recordDbQueryDuration,
  incrementCacheHit,
  incrementCacheMiss,
  getPrometheusMetrics,
  getJsonMetrics,
  requestLogger,
  metricsRoutes,
};