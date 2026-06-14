/**
 * Observability Platform Tests
 * Tests for metrics, logs, and tracing functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Metric types
interface Metric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram';
  value: number;
  labels: Record<string, string>;
}

// Log types
interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  service?: string;
  timestamp: Date;
}

// Trace types
interface Trace {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  service: string;
  operation: string;
  duration: number;
}

// Metric aggregation
function aggregateMetrics(metrics: Metric[]): Record<string, { total: number; count: number }> {
  const summary: Record<string, { total: number; count: number }> = {};

  for (const metric of metrics) {
    if (!summary[metric.name]) {
      summary[metric.name] = { total: 0, count: 0 };
    }
    summary[metric.name].total += metric.value;
    summary[metric.name].count += 1;
  }

  return summary;
}

// Log filtering
function filterLogs(
  logs: LogEntry[],
  filters: { level?: string; service?: string }
): LogEntry[] {
  let filtered = [...logs];

  if (filters.level) {
    filtered = filtered.filter(l => l.level === filters.level);
  }

  if (filters.service) {
    filtered = filtered.filter(l => l.service === filters.service);
  }

  return filtered;
}

// Log statistics
function getLogStats(logs: LogEntry[]): {
  byLevel: Record<string, number>;
  byService: Record<string, number>;
  errorRate: number;
} {
  const byLevel: Record<string, number> = { debug: 0, info: 0, warn: 0, error: 0 };
  const byService: Record<string, number> = {};
  let errorCount = 0;

  for (const log of logs) {
    byLevel[log.level]++;
    if (log.service) {
      byService[log.service] = (byService[log.service] || 0) + 1;
    }
    if (log.level === 'error') {
      errorCount++;
    }
  }

  return {
    byLevel,
    byService,
    errorRate: logs.length > 0 ? errorCount / logs.length : 0,
  };
}

// Trace tree building
function buildTraceTree(traces: Trace[]): Map<string, Trace[]> {
  const tree = new Map<string, Trace[]>();

  for (const trace of traces) {
    if (!tree.has(trace.traceId)) {
      tree.set(trace.traceId, []);
    }
    tree.get(trace.traceId)!.push(trace);
  }

  return tree;
}

// Calculate trace duration (root span)
function getTraceDuration(traces: Trace[]): number {
  if (traces.length === 0) return 0;

  return Math.max(...traces.map(t => t.duration));
}

describe('Metrics Aggregation', () => {
  it('should aggregate metrics by name', () => {
    const metrics: Metric[] = [
      { name: 'requests', type: 'counter', value: 10, labels: {} },
      { name: 'requests', type: 'counter', value: 5, labels: {} },
      { name: 'errors', type: 'counter', value: 2, labels: {} },
    ];

    const summary = aggregateMetrics(metrics);

    expect(summary['requests'].total).toBe(15);
    expect(summary['requests'].count).toBe(2);
    expect(summary['errors'].total).toBe(2);
    expect(summary['errors'].count).toBe(1);
  });

  it('should handle empty metrics array', () => {
    const summary = aggregateMetrics([]);
    expect(Object.keys(summary).length).toBe(0);
  });

  it('should calculate average correctly', () => {
    const metrics: Metric[] = [
      { name: 'latency', type: 'histogram', value: 100, labels: {} },
      { name: 'latency', type: 'histogram', value: 200, labels: {} },
      { name: 'latency', type: 'histogram', value: 300, labels: {} },
    ];

    const summary = aggregateMetrics(metrics);
    const avg = summary['latency'].total / summary['latency'].count;

    expect(avg).toBe(200);
  });
});

describe('Log Filtering', () => {
  const logs: LogEntry[] = [
    { level: 'info', message: 'Server started', service: 'api', timestamp: new Date() },
    { level: 'debug', message: 'Request received', service: 'api', timestamp: new Date() },
    { level: 'error', message: 'Connection failed', service: 'db', timestamp: new Date() },
    { level: 'warn', message: 'Slow query', service: 'db', timestamp: new Date() },
  ];

  it('should filter by level', () => {
    const filtered = filterLogs(logs, { level: 'error' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].message).toBe('Connection failed');
  });

  it('should filter by service', () => {
    const filtered = filterLogs(logs, { service: 'api' });
    expect(filtered).toHaveLength(2);
    expect(filtered.every(l => l.service === 'api')).toBe(true);
  });

  it('should filter by both level and service', () => {
    const filtered = filterLogs(logs, { level: 'info', service: 'api' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].message).toBe('Server started');
  });

  it('should return all logs with no filters', () => {
    const filtered = filterLogs(logs, {});
    expect(filtered).toHaveLength(4);
  });
});

describe('Log Statistics', () => {
  const logs: LogEntry[] = [
    { level: 'info', message: '1', service: 'api', timestamp: new Date() },
    { level: 'info', message: '2', service: 'api', timestamp: new Date() },
    { level: 'warn', message: '3', service: 'db', timestamp: new Date() },
    { level: 'error', message: '4', service: 'api', timestamp: new Date() },
    { level: 'error', message: '5', service: 'db', timestamp: new Date() },
  ];

  it('should count by level', () => {
    const stats = getLogStats(logs);

    expect(stats.byLevel.info).toBe(2);
    expect(stats.byLevel.warn).toBe(1);
    expect(stats.byLevel.error).toBe(2);
  });

  it('should count by service', () => {
    const stats = getLogStats(logs);

    expect(stats.byService.api).toBe(3);
    expect(stats.byService.db).toBe(2);
  });

  it('should calculate error rate', () => {
    const stats = getLogStats(logs);

    expect(stats.errorRate).toBe(0.4); // 2/5
  });

  it('should handle empty logs', () => {
    const stats = getLogStats([]);

    expect(stats.errorRate).toBe(0);
    expect(Object.keys(stats.byLevel).length).toBe(4);
  });
});

describe('Trace Tree Building', () => {
  const traces: Trace[] = [
    { traceId: 'trace-1', spanId: 'span-1', service: 'api', operation: 'handleRequest', duration: 100 },
    { traceId: 'trace-1', spanId: 'span-2', parentSpanId: 'span-1', service: 'db', operation: 'query', duration: 50 },
    { traceId: 'trace-2', spanId: 'span-3', service: 'api', operation: 'handleRequest', duration: 80 },
  ];

  it('should group traces by traceId', () => {
    const tree = buildTraceTree(traces);

    expect(tree.get('trace-1')).toHaveLength(2);
    expect(tree.get('trace-2')).toHaveLength(1);
  });

  it('should build correct tree structure', () => {
    const tree = buildTraceTree(traces);
    const trace1Spans = tree.get('trace-1')!;

    expect(trace1Spans[0].spanId).toBe('span-1');
    expect(trace1Spans[1].parentSpanId).toBe('span-1');
  });

  it('should handle empty traces', () => {
    const tree = buildTraceTree([]);
    expect(tree.size).toBe(0);
  });
});

describe('Trace Duration Calculation', () => {
  it('should find max duration', () => {
    const traces: Trace[] = [
      { traceId: 't1', spanId: 's1', service: 'api', operation: 'op1', duration: 50 },
      { traceId: 't1', spanId: 's2', service: 'api', operation: 'op2', duration: 100 },
      { traceId: 't1', spanId: 's3', service: 'api', operation: 'op3', duration: 75 },
    ];

    expect(getTraceDuration(traces)).toBe(100);
  });

  it('should return 0 for empty traces', () => {
    expect(getTraceDuration([])).toBe(0);
  });

  it('should handle single trace', () => {
    const traces: Trace[] = [
      { traceId: 't1', spanId: 's1', service: 'api', operation: 'op1', duration: 42 },
    ];

    expect(getTraceDuration(traces)).toBe(42);
  });
});

describe('Health Metrics', () => {
  interface ServiceHealth {
    service: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    errorRate: number;
  }

  function calculateHealth(metrics: Metric[], logs: LogEntry[]): ServiceHealth {
    const errors = logs.filter(l => l.level === 'error').length;
    const total = logs.length;
    const errorRate = total > 0 ? errors / total : 0;

    let status: ServiceHealth['status'] = 'healthy';
    if (errorRate > 0.1) status = 'degraded';
    if (errorRate > 0.5) status = 'unhealthy';

    return {
      service: 'unknown',
      status,
      uptime: 99.9,
      errorRate,
    };
  }

  it('should report healthy when error rate is low', () => {
    const logs: LogEntry[] = Array.from({ length: 100 }, (_, i) => ({
      level: i < 95 ? 'info' : 'error',
      message: 'test',
      timestamp: new Date(),
    }));

    const health = calculateHealth([], logs);
    expect(health.status).toBe('healthy');
  });

  it('should report degraded when error rate > 10%', () => {
    const logs: LogEntry[] = Array.from({ length: 100 }, (_, i) => ({
      level: i < 90 ? 'info' : 'error',
      message: 'test',
      timestamp: new Date(),
    }));

    const health = calculateHealth([], logs);
    expect(health.status).toBe('degraded');
  });

  it('should report unhealthy when error rate > 50%', () => {
    const logs: LogEntry[] = Array.from({ length: 100 }, (_, i) => ({
      level: i < 40 ? 'info' : 'error',
      message: 'test',
      timestamp: new Date(),
    }));

    const health = calculateHealth([], logs);
    expect(health.status).toBe('unhealthy');
  });
});

describe('Alert Thresholds', () => {
  interface AlertCondition {
    metric: string;
    operator: '>' | '<' | '>=' | '<=';
    threshold: number;
    severity: 'warning' | 'critical';
  }

  function shouldAlert(
    value: number,
    condition: AlertCondition
  ): boolean {
    switch (condition.operator) {
      case '>': return value > condition.threshold;
      case '<': return value < condition.threshold;
      case '>=': return value >= condition.threshold;
      case '<=': return value <= condition.threshold;
    }
  }

  const conditions: AlertCondition[] = [
    { metric: 'error_rate', operator: '>', threshold: 0.1, severity: 'warning' },
    { metric: 'error_rate', operator: '>', threshold: 0.5, severity: 'critical' },
    { metric: 'latency_p99', operator: '>', threshold: 1000, severity: 'warning' },
  ];

  it('should trigger warning for error rate > 10%', () => {
    expect(shouldAlert(0.15, conditions[0])).toBe(true);
  });

  it('should not trigger warning for low error rate', () => {
    expect(shouldAlert(0.05, conditions[0])).toBe(false);
  });

  it('should trigger critical for high error rate', () => {
    expect(shouldAlert(0.6, conditions[1])).toBe(true);
  });

  it('should handle threshold boundary', () => {
    expect(shouldAlert(0.1, conditions[0])).toBe(false); // Strictly greater
    expect(shouldAlert(1001, conditions[2])).toBe(true);
  });
});
