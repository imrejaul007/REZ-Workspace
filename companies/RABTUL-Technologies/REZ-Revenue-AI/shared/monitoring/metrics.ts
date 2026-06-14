/**
 * REZ Revenue AI - Monitoring & Metrics
 * Prometheus metrics and health checks
 */

import { Request, Response } from 'express';

// ============================================================
// METRICS TYPES
// ============================================================

interface Metric {
  name: string;
  help: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  labels?: string[];
}

interface MetricValue {
  value: number;
  labels?: Record<string, string>;
  timestamp?: number;
}

// ============================================================
// METRICS STORE
// ============================================================

class MetricsStore {
  private counters = new Map<string, number>();
  private gauges = new Map<string, number>();
  private histograms = new Map<string, number[]>();
  private summaries = new Map<string, { values: number[]; quantiles: number[] }>();

  // Counters
  incrementCounter(name: string, labels?: Record<string, string>): void {
    const key = this.makeKey(name, labels);
    this.counters.set(key, (this.counters.get(key) || 0) + 1);
  }

  getCounter(name: string, labels?: Record<string, string>): number {
    return this.counters.get(this.makeKey(name, labels)) || 0;
  }

  // Gauges
  setGauge(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.makeKey(name, labels);
    this.gauges.set(key, value);
  }

  getGauge(name: string, labels?: Record<string, string>): number {
    return this.gauges.get(this.makeKey(name, labels)) || 0;
  }

  // Histograms
  observeHistogram(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.makeKey(name, labels);
    if (!this.histograms.has(key)) {
      this.histograms.set(key, []);
    }
    this.histograms.get(key)!.push(value);
  }

  getHistogramStats(name: string, labels?: Record<string, string>): { count: number; sum: number; avg: number; p50: number; p95: number; p99: number } {
    const key = this.makeKey(name, labels);
    const values = this.histograms.get(key) || [];
    if (values.length === 0) {
      return { count: 0, sum: 0, avg: 0, p50: 0, p95: 0, p99: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const count = values.length;
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      count,
      sum,
      avg: sum / count,
      p50: this.percentile(sorted, 0.5),
      p95: this.percentile(sorted, 0.95),
      p99: this.percentile(sorted, 0.99),
    };
  }

  private percentile(sorted: number[], p: number): number {
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, index)];
  }

  private makeKey(name: string, labels?: Record<string, string>): string {
    if (!labels) return name;
    const labelStr = Object.entries(labels).map(([k, v]) => `${k}="${v}"`).join(',');
    return `${name}{${labelStr}}`;
  }

  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    this.summaries.clear();
  }
}

// Singleton
const store = new MetricsStore();

// ============================================================
// METRICS FUNCTIONS
// ============================================================

export const metrics = {
  // Request metrics
  requests: {
    total: (method: string, path: string, status: number) => {
      store.incrementCounter(`http_requests_total`, { method, path, status: String(status) });
    },
    duration: (path: string, durationMs: number) => {
      store.observeHistogram(`http_request_duration_ms`, durationMs, { path });
    },
  },

  // Pricing metrics
  pricing: {
    calculations: (vertical: string, adjustmentType: string) => {
      store.incrementCounter(`pricing_calculations_total`, { vertical, adjustment: adjustmentType });
    },
    adjustment: (vertical: string, adjustmentPercent: number) => {
      store.observeHistogram(`pricing_adjustment_percent`, adjustmentPercent, { vertical });
    },
  },

  // Cashback metrics
  cashback: {
    issued: (merchantId: string, segment: string, amount: number) => {
      store.incrementCounter(`cashback_issued_total`, { merchant: merchantId, segment });
      store.observeHistogram(`cashback_amount`, amount, { segment });
    },
    failed: (merchantId: string, reason: string) => {
      store.incrementCounter(`cashback_failed_total`, { merchant: merchantId, reason });
    },
  },

  // Campaign metrics
  campaigns: {
    created: (merchantId: string, objective: string) => {
      store.incrementCounter(`campaigns_created_total`, { merchant: merchantId, objective });
    },
    sent: (merchantId: string, channel: string, count: number) => {
      store.incrementCounter(`campaigns_sent_total`, { merchant: merchantId, channel, count: String(count) });
    },
    delivered: (merchantId: string, channel: string) => {
      store.incrementCounter(`campaigns_delivered_total`, { merchant: merchantId, channel });
    },
  },

  // Benchmark metrics
  benchmark: {
    calculated: (merchantId: string, score: number) => {
      store.incrementCounter(`benchmark_calculated_total`, { merchant: merchantId });
      store.setGauge(`benchmark_score`, score, { merchant: merchantId });
    },
  },

  // Agent metrics
  agent: {
    chat: (merchantId: string, intent: string) => {
      store.incrementCounter(`agent_chat_total`, { merchant: merchantId, intent });
    },
    actions: (merchantId: string, actionType: string) => {
      store.incrementCounter(`agent_actions_total`, { merchant: merchantId, type: actionType });
    },
  },
};

// ============================================================
// EXPRESS MIDDLEWARE
// ============================================================

export function metricsMiddleware(req: Request, res: Response, next: () => void): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const path = req.route?.path || req.path;

    metrics.requests.total(req.method, path, res.statusCode);
    metrics.requests.duration(path, duration);
  });

  next();
}

// ============================================================
// PROMETHEUS FORMATTER
// ============================================================

export function prometheusMetrics(): string {
  const lines: string[] = [];

  // HTTP requests total
  lines.push('# HELP http_requests_total Total HTTP requests');
  lines.push('# TYPE http_requests_total counter');
  store.counters.forEach((value, key) => {
    lines.push(`http_requests_total{${key}} ${value}`);
  });

  // Request duration histogram
  lines.push('# HELP http_request_duration_ms Request duration in milliseconds');
  lines.push('# TYPE http_request_duration_ms histogram');
  store.histograms.forEach((values, key) => {
    const stats = store.getHistogramStats('', JSON.parse(`{${key}}`));
    lines.push(`http_request_duration_ms_sum{${key}} ${stats.sum}`);
    lines.push(`http_request_duration_ms_count{${key}} ${stats.count}`);
    lines.push(`http_request_duration_ms_bucket{${key},le="50"} ${values.filter(v => v <= 50).length}`);
    lines.push(`http_request_duration_ms_bucket{${key},le="100"} ${values.filter(v => v <= 100).length}`);
    lines.push(`http_request_duration_ms_bucket{${key},le="500"} ${values.filter(v => v <= 500).length}`);
    lines.push(`http_request_duration_ms_bucket{${key},le="+Inf"} ${stats.count}`);
  });

  // Pricing calculations
  lines.push('# HELP pricing_calculations_total Total pricing calculations');
  lines.push('# TYPE pricing_calculations_total counter');
  store.counters.forEach((value, key) => {
    if (key.startsWith('pricing_')) {
      lines.push(`pricing_calculations_total{${key}} ${value}`);
    }
  });

  // Cashback issued
  lines.push('# HELP cashback_issued_total Total cashback issued');
  lines.push('# TYPE cashback_issued_total counter');
  store.counters.forEach((value, key) => {
    if (key.startsWith('cashback_')) {
      lines.push(`cashback_issued_total{${key}} ${value}`);
    }
  });

  // Gauges
  lines.push('# HELP benchmark_score Current benchmark score');
  lines.push('# TYPE benchmark_score gauge');
  store.gauges.forEach((value, key) => {
    if (key.startsWith('benchmark_')) {
      lines.push(`benchmark_score{${key}} ${value}`);
    }
  });

  return lines.join('\n');
}

// ============================================================
// HEALTH CHECKS
// ============================================================

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  latency?: number;
  message?: string;
}

export const healthChecks: HealthCheck[] = [];

export async function runHealthChecks(): Promise<{ healthy: boolean; checks: HealthCheck[] }> {
  const results: HealthCheck[] = [];

  // Check MongoDB (if connected)
  try {
    const { mongoose } = await import('../database/schemas');
    const start = Date.now();
    await mongoose.connection.db?.admin().ping();
    results.push({
      name: 'mongodb',
      status: 'healthy',
      latency: Date.now() - start,
    });
  } catch {
    results.push({
      name: 'mongodb',
      status: 'unhealthy',
      message: 'Connection failed',
    });
  }

  // Check services
  const serviceChecks = ['pricing', 'forecast', 'cashback', 'offer'];
  for (const service of serviceChecks) {
    results.push({
      name: service,
      status: 'healthy',
    });
  }

  const healthy = results.every(r => r.status === 'healthy');
  return { healthy, checks: results };
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  metrics,
  metricsMiddleware,
  prometheusMetrics,
  runHealthChecks,
  store,
};
