// Metrics Service
// Prometheus-style metrics for monitoring

interface Counter {
  value: number;
  labels: Record<string, string>;
}

interface Gauge {
  value: number;
  labels: Record<string, string>;
}

interface Histogram {
  values: number[];
  buckets: Map<number, number>;
  labels: Record<string, string>;
}

class MetricsService {
  private counters: Map<string, Counter> = new Map();
  private gauges: Map<string, Gauge> = new Map();
  private histograms: Map<string, Histogram> = new Map();
  private requestCounts: Map<string, number> = new Map();
  private requestDurations: number[] = [];
  private readonly HISTOGRAM_BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

  // HTTP Request metrics
  recordHttpRequest(method: string, path: string, statusCode: number, durationMs: number): void {
    const key = `${method}:${path}:${statusCode}`;
    this.requestCounts.set(key, (this.requestCounts.get(key) || 0) + 1);
    this.requestDurations.push(durationMs);
  }

  // Increment counter
  incrementCounter(name: string, labels: Record<string, string> = {}): void {
    const key = this.makeKey(name, labels);
    const existing = this.counters.get(key);
    if (existing) {
      existing.value++;
    } else {
      this.counters.set(key, { value: 1, labels });
    }
  }

  // Set gauge value
  setGauge(name: string, value: number, labels: Record<string, string> = {}): void {
    const key = this.makeKey(name, labels);
    this.gauges.set(key, { value, labels });
  }

  // Observe histogram value
  observeHistogram(name: string, value: number, labels: Record<string, string> = {}): void {
    const key = this.makeKey(name, labels);
    let histogram = this.histograms.get(key);

    if (!histogram) {
      const buckets = new Map<number, number>();
      this.HISTOGRAM_BUCKETS.forEach(b => buckets.set(b, 0));
      histogram = { values: [], buckets, labels };
      this.histograms.set(key, histogram);
    }

    histogram.values.push(value);
    this.HISTOGRAM_BUCKETS.forEach(bucket => {
      if (value <= bucket) {
        histogram!.buckets.set(bucket, (histogram!.buckets.get(bucket) || 0) + 1);
      }
    });
  }

  // Get metrics in Prometheus format
  getPrometheusMetrics(): string {
    const lines: string[] = [];

    // Add metric metadata
    lines.push('# HELP corpperks_http_requests_total Total HTTP requests');
    lines.push('# TYPE corpperks_http_requests_total counter');
    this.requestCounts.forEach((count, key) => {
      const [method, path, status] = key.split(':');
      lines.push(`corpperks_http_requests_total{method="${method}",path="${path}",status="${status}"} ${count}`);
    });

    // Request duration histogram
    lines.push('# HELP corpperks_http_request_duration_ms HTTP request duration in milliseconds');
    lines.push('# TYPE corpperks_http_request_duration_ms histogram');

    if (this.requestDurations.length > 0) {
      const avg = this.requestDurations.reduce((a, b) => a + b, 0) / this.requestDurations.length;
      const max = Math.max(...this.requestDurations);
      const min = Math.min(...this.requestDurations);
      const p50 = this.percentile(this.requestDurations, 0.5);
      const p95 = this.percentile(this.requestDurations, 0.95);
      const p99 = this.percentile(this.requestDurations, 0.99);

      lines.push(`corpperks_http_request_duration_ms_avg ${avg.toFixed(2)}`);
      lines.push(`corpperks_http_request_duration_ms_max ${max}`);
      lines.push(`corpperks_http_request_duration_ms_min ${min}`);
      lines.push(`corpperks_http_request_duration_ms_p50 ${p50.toFixed(2)}`);
      lines.push(`corpperks_http_request_duration_ms_p95 ${p95.toFixed(2)}`);
      lines.push(`corpperks_http_request_duration_ms_p99 ${p99.toFixed(2)}`);
    }

    // Custom counters
    lines.push('# HELP corpperks_decision_cards_generated_total Decision cards generated');
    lines.push('# TYPE corpperks_decision_cards_generated_total counter');
    this.counters.forEach((counter, key) => {
      if (key.startsWith('decision_cards')) {
        const labels = Object.entries(counter.labels).map(([k, v]) => `${k}="${v}"`).join(',');
        lines.push(`corpperks_${key.replace(/:/g, '_')}{${labels}} ${counter.value}`);
      }
    });

    // Custom gauges
    lines.push('# HELP corpperks_health_score_current Current health score');
    lines.push('# TYPE corpperks_health_score_current gauge');
    this.gauges.forEach((gauge, key) => {
      const labels = Object.entries(gauge.labels).map(([k, v]) => `${k}="${v}"`).join(',');
      lines.push(`corpperks_${key.replace(/:/g, '_')}{${labels}} ${gauge.value}`);
    });

    lines.push(`corpperks_up 1`);
    lines.push('');

    return lines.join('\n');
  }

  // Get metrics as JSON
  getJsonMetrics(): object {
    return {
      http: {
        totalRequests: Array.from(this.requestCounts.values()).reduce((a, b) => a + b, 0),
        requestsPerEndpoint: Object.fromEntries(this.requestCounts),
        duration: {
          count: this.requestDurations.length,
          avg: this.requestDurations.length > 0
            ? +(this.requestDurations.reduce((a, b) => a + b, 0) / this.requestDurations.length).toFixed(2)
            : 0,
          min: this.requestDurations.length > 0 ? Math.min(...this.requestDurations) : 0,
          max: this.requestDurations.length > 0 ? Math.max(...this.requestDurations) : 0,
          p50: this.requestDurations.length > 0 ? +this.percentile(this.requestDurations, 0.5).toFixed(2) : 0,
          p95: this.requestDurations.length > 0 ? +this.percentile(this.requestDurations, 0.95).toFixed(2) : 0,
          p99: this.requestDurations.length > 0 ? +this.percentile(this.requestDurations, 0.99).toFixed(2) : 0,
        },
      },
      counters: Array.from(this.counters.entries()).map(([name, c]) => ({
        name,
        value: c.value,
        labels: c.labels,
      })),
      gauges: Array.from(this.gauges.entries()).map(([name, g]) => ({
        name,
        value: g.value,
        labels: g.labels,
      })),
      timestamp: new Date().toISOString(),
    };
  }

  private makeKey(name: string, labels: Record<string, string>): string {
    const labelStr = Object.entries(labels).map(([k, v]) => `${k}:${v}`).join(',');
    return `${name}${labelStr ? ':' + labelStr : ''}`;
  }

  private percentile(arr: number[], p: number): number {
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, index)];
  }

  // Reset metrics (useful for testing)
  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    this.requestCounts.clear();
    this.requestDurations = [];
  }
}

export const metricsService = new MetricsService();
export default metricsService;
