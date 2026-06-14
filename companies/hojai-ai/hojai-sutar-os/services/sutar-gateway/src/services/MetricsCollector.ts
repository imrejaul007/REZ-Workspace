// ============================================================================
// SUTAR Gateway - Metrics Collector
// Prometheus-style metrics collection
// ============================================================================

import { v4 as uuidv4 } from 'uuid';
import type {
  Metric,
  HistogramMetric,
  AggregatedMetrics,
  ApiResponse,
} from '../types/index.js';

export interface MetricsConfig {
  enabled: boolean;
  retentionPeriod: number;
  histogramBuckets: number[];
  defaultLabels: Record<string, string>;
}

export interface CounterMetric {
  name: string;
  labels: Record<string, string>;
  value: number;
  createdAt: string;
  lastUpdated: string;
}

export interface GaugeMetric {
  name: string;
  labels: Record<string, string>;
  value: number;
  createdAt: string;
  lastUpdated: string;
}

export interface HistogramData {
  name: string;
  labels: Record<string, string>;
  count: number;
  sum: number;
  buckets: Map<number, number>; // le -> count
  createdAt: string;
  lastUpdated: string;
}

export class MetricsCollector {
  private counters: Map<string, CounterMetric> = new Map();
  private gauges: Map<string, GaugeMetric> = new Map();
  private histograms: Map<string, HistogramData> = new Map();
  private config: MetricsConfig;
  private listeners: Set<(event: MetricsEvent) => void> = new Set();
  private requestHistory: Array<{
    timestamp: number;
    method: string;
    path: string;
    status: number;
    duration: number;
  }> = [];

  constructor(config?: Partial<MetricsConfig>) {
    this.config = {
      enabled: config?.enabled ?? true,
      retentionPeriod: config?.retentionPeriod ?? 3600000, // 1 hour
      histogramBuckets: config?.histogramBuckets ?? [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      defaultLabels: config?.defaultLabels ?? { service: 'sutar-gateway' },
    };

    this.startCleanupTask();
  }

  // ---------------------------------------------------------------------------
  // Counter Metrics
  // ---------------------------------------------------------------------------

  incrementCounter(
    name: string,
    labels: Record<string, string> = {},
    value: number = 1
  ): void {
    if (!this.config.enabled) return;

    const key = this.makeKey(name, labels);
    const existing = this.counters.get(key);

    if (existing) {
      existing.value += value;
      existing.lastUpdated = new Date().toISOString();
    } else {
      const now = new Date().toISOString();
      this.counters.set(key, {
        name,
        labels: { ...this.config.defaultLabels, ...labels },
        value,
        createdAt: now,
        lastUpdated: now,
      });
    }

    this.emit({
      type: 'counter_incremented',
      metricName: name,
      value,
      labels,
      timestamp: new Date().toISOString(),
    });
  }

  getCounter(name: string, labels: Record<string, string> = {}): number {
    const key = this.makeKey(name, labels);
    return this.counters.get(key)?.value ?? 0;
  }

  // ---------------------------------------------------------------------------
  // Gauge Metrics
  // ---------------------------------------------------------------------------

  setGauge(name: string, value: number, labels: Record<string, string> = {}): void {
    if (!this.config.enabled) return;

    const key = this.makeKey(name, labels);
    const existing = this.gauges.get(key);

    if (existing) {
      existing.value = value;
      existing.lastUpdated = new Date().toISOString();
    } else {
      const now = new Date().toISOString();
      this.gauges.set(key, {
        name,
        labels: { ...this.config.defaultLabels, ...labels },
        value,
        createdAt: now,
        lastUpdated: now,
      });
    }

    this.emit({
      type: 'gauge_set',
      metricName: name,
      value,
      labels,
      timestamp: new Date().toISOString(),
    });
  }

  incrementGauge(name: string, value: number = 1, labels: Record<string, string> = {}): void {
    const key = this.makeKey(name, labels);
    const current = this.gauges.get(key)?.value ?? 0;
    this.setGauge(name, current + value, labels);
  }

  decrementGauge(name: string, value: number = 1, labels: Record<string, string> = {}): void {
    this.incrementGauge(name, -value, labels);
  }

  getGauge(name: string, labels: Record<string, string> = {}): number {
    const key = this.makeKey(name, labels);
    return this.gauges.get(key)?.value ?? 0;
  }

  // ---------------------------------------------------------------------------
  // Histogram Metrics
  // ---------------------------------------------------------------------------

  observeHistogram(
    name: string,
    value: number,
    labels: Record<string, string> = {}
  ): void {
    if (!this.config.enabled) return;

    const key = this.makeKey(name, labels);
    const existing = this.histograms.get(key);

    if (existing) {
      existing.count++;
      existing.sum += value;
      existing.lastUpdated = new Date().toISOString();

      // Update buckets
      for (const bucketLimit of this.config.histogramBuckets) {
        if (value <= bucketLimit) {
          existing.buckets.set(bucketLimit, (existing.buckets.get(bucketLimit) ?? 0) + 1);
        }
      }
      // Always update infinity bucket
      existing.buckets.set(Infinity, existing.count);
    } else {
      const now = new Date().toISOString();
      const buckets = new Map<number, number>();
      for (const bucketLimit of this.config.histogramBuckets) {
        buckets.set(bucketLimit, value <= bucketLimit ? 1 : 0);
      }
      buckets.set(Infinity, 1);

      this.histograms.set(key, {
        name,
        labels: { ...this.config.defaultLabels, ...labels },
        count: 1,
        sum: value,
        buckets,
        createdAt: now,
        lastUpdated: now,
      });
    }

    this.emit({
      type: 'histogram_observed',
      metricName: name,
      value,
      labels,
      timestamp: new Date().toISOString(),
    });
  }

  getHistogram(name: string, labels: Record<string, string> = {}): HistogramMetric | null {
    const key = this.makeKey(name, labels);
    const data = this.histograms.get(key);

    if (!data) return null;

    const buckets: Array<{ le: number; count: number }> = [];
    for (const [le, count] of data.buckets) {
      if (le !== Infinity) {
        buckets.push({ le, count });
      }
    }

    return {
      name: data.name,
      count: data.count,
      sum: data.sum,
      buckets: buckets.sort((a, b) => a.le - b.le),
      labels: data.labels,
    };
  }

  // ---------------------------------------------------------------------------
  // Request Tracking
  // ---------------------------------------------------------------------------

  recordRequest(
    method: string,
    path: string,
    status: number,
    duration: number
  ): void {
    if (!this.config.enabled) return;

    // Record counters
    this.incrementCounter('http_requests_total', { method, path, status: String(status) });
    this.incrementCounter('http_requests_total', { method, status: String(status) });
    this.incrementCounter('http_requests_total', { status: String(status) });

    // Record histogram
    this.observeHistogram('http_request_duration_seconds', duration / 1000, { method, path });

    // Store in history
    this.requestHistory.push({
      timestamp: Date.now(),
      method,
      path,
      status,
      duration,
    });

    // Keep only recent history
    if (this.requestHistory.length > 10000) {
      this.requestHistory = this.requestHistory.slice(-5000);
    }
  }

  // ---------------------------------------------------------------------------
  // Prometheus Export
  // ---------------------------------------------------------------------------

  toPrometheusFormat(): string {
    const lines: string[] = [];

    // Add help and type annotations
    lines.push('# HELP sutar_gateway_info Gateway information');
    lines.push('# TYPE sutar_gateway_info gauge');
    lines.push('sutar_gateway_info{version="1.0.0"} 1');

    // Counters
    lines.push('');
    lines.push('# HELP http_requests_total Total HTTP requests');
    lines.push('# TYPE http_requests_total counter');

    for (const counter of this.counters.values()) {
      if (counter.name === 'http_requests_total') {
        const labelStr = this.formatLabels(counter.labels);
        lines.push(`${counter.name}${labelStr} ${counter.value}`);
      }
    }

    // Gauges
    for (const [prefix, metrics] of [
      ['services', this.counters],
      ['cache', this.counters],
      ['connections', this.gauges],
    ] as const) {
      // Add relevant gauges
    }

    // Histograms
    lines.push('');
    lines.push('# HELP http_request_duration_seconds HTTP request duration in seconds');
    lines.push('# TYPE http_request_duration_seconds histogram');

    for (const histogram of this.histograms.values()) {
      if (histogram.name === 'http_request_duration_seconds') {
        const labelStr = this.formatLabels(histogram.labels);
        const buckets = Array.from(histogram.buckets.entries())
          .filter(([le]) => le !== Infinity)
          .sort((a, b) => a[0] - b[0]);

        for (const [le, count] of buckets) {
          lines.push(`${histogram.name}_bucket{le="${le}"${labelStr.slice(1, -1)}} ${count}`);
        }
        lines.push(`${histogram.name}_bucket{le="+Inf"${labelStr.slice(1, -1)}} ${histogram.count}`);
        lines.push(`${histogram.name}_sum${labelStr} ${histogram.sum}`);
        lines.push(`${histogram.name}_count${labelStr} ${histogram.count}`);
      }
    }

    return lines.join('\n');
  }

  // ---------------------------------------------------------------------------
  // Aggregated Metrics
  // ---------------------------------------------------------------------------

  getAggregatedMetrics(): ApiResponse<AggregatedMetrics> {
    const now = Date.now();
    const cutoff = now - this.config.retentionPeriod;

    // Filter recent requests
    const recentRequests = this.requestHistory.filter(r => r.timestamp > cutoff);

    // Calculate statistics
    const totalRequests = recentRequests.length;
    const successRequests = recentRequests.filter(r => r.status >= 200 && r.status < 400).length;
    const errorRequests = recentRequests.filter(r => r.status >= 400).length;

    // Group by status
    const byStatus: Record<string, number> = {};
    const byMethod: Record<string, number> = {};
    const byPath: Record<string, number> = {};

    for (const req of recentRequests) {
      byStatus[String(req.status)] = (byStatus[String(req.status)] ?? 0) + 1;
      byMethod[req.method] = (byMethod[req.method] ?? 0) + 1;
      byPath[req.path] = (byPath[req.path] ?? 0) + 1;
    }

    // Calculate latency percentiles
    const durations = recentRequests.map(r => r.duration).sort((a, b) => a - b);
    const avgLatency = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    const minLatency = durations[0] ?? 0;
    const maxLatency = durations[durations.length - 1] ?? 0;
    const p50 = this.percentile(durations, 50);
    const p90 = this.percentile(durations, 90);
    const p99 = this.percentile(durations, 99);

    const aggregated: AggregatedMetrics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      requests: {
        total: totalRequests,
        success: successRequests,
        error: errorRequests,
        byStatus,
        byMethod,
        byPath,
      },
      latency: {
        avg: Math.round(avgLatency),
        min: Math.round(minLatency),
        max: Math.round(maxLatency),
        p50: Math.round(p50),
        p90: Math.round(p90),
        p99: Math.round(p99),
      },
      services: {
        total: this.getGauge('services_total'),
        healthy: this.getGauge('services_healthy'),
        degraded: this.getGauge('services_degraded'),
        unhealthy: this.getGauge('services_unhealthy'),
      },
      cache: {
        hitRate: this.getGauge('cache_hit_rate'),
        hits: this.getCounter('cache_hits_total'),
        misses: this.getCounter('cache_misses_total'),
      },
    };

    return this.successResponse(aggregated);
  }

  // ---------------------------------------------------------------------------
  // Utility Methods
  // ---------------------------------------------------------------------------

  private makeKey(name: string, labels: Record<string, string>): string {
    const sortedLabels = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join(',');
    return sortedLabels ? `${name}{${sortedLabels}}` : name;
  }

  private formatLabels(labels: Record<string, string>): string {
    const parts = Object.entries(labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return parts ? `{${parts}}` : '';
  }

  private percentile(sortedValues: number[], p: number): number {
    if (sortedValues.length === 0) return 0;
    const index = Math.ceil((p / 100) * sortedValues.length) - 1;
    return sortedValues[Math.max(0, index)] ?? 0;
  }

  private startCleanupTask(): void {
    setInterval(() => {
      const cutoff = Date.now() - this.config.retentionPeriod;
      this.requestHistory = this.requestHistory.filter(r => r.timestamp > cutoff);
    }, 300000); // Run every 5 minutes
  }

  private emit(event: MetricsEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('[Metrics] Event listener error:', error);
      }
    }
  }

  onEvent(listener: (event: MetricsEvent) => void): void {
    this.listeners.add(listener);
  }

  offEvent(listener: (event: MetricsEvent) => void): void {
    this.listeners.delete(listener);
  }

  // ---------------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------------

  updateConfig(config: Partial<MetricsConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): MetricsConfig {
    return { ...this.config };
  }

  // ---------------------------------------------------------------------------
  // Reset
  // ---------------------------------------------------------------------------

  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    this.requestHistory = [];
  }

  resetCounters(): void {
    for (const counter of this.counters.values()) {
      counter.value = 0;
      counter.lastUpdated = new Date().toISOString();
    }
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  destroy(): void {
    this.listeners.clear();
    this.reset();
  }

  getStats(): {
    counters: number;
    gauges: number;
    histograms: number;
    requestHistory: number;
  } {
    return {
      counters: this.counters.size,
      gauges: this.gauges.size,
      histograms: this.histograms.size,
      requestHistory: this.requestHistory.length,
    };
  }
}

// ============================================================================
// Types and Singleton
// ============================================================================

export interface MetricsEvent {
  type: 'counter_incremented' | 'gauge_set' | 'histogram_observed';
  metricName: string;
  value: number;
  labels: Record<string, string>;
  timestamp: string;
}

export const metricsCollector = new MetricsCollector();

// Helper functions
export function recordMetric(
  type: 'counter' | 'gauge' | 'histogram',
  name: string,
  value: number,
  labels?: Record<string, string>
): void {
  switch (type) {
    case 'counter':
      metricsCollector.incrementCounter(name, labels, value);
      break;
    case 'gauge':
      metricsCollector.setGauge(name, value, labels);
      break;
    case 'histogram':
      metricsCollector.observeHistogram(name, value, labels);
      break;
  }
}

export function recordHttpRequest(
  method: string,
  path: string,
  status: number,
  duration: number
): void {
  metricsCollector.recordRequest(method, path, status, duration);
}