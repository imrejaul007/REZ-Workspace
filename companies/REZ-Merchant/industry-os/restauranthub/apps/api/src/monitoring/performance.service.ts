import { Injectable, Logger } from '@nestjs/common';
import { performance, PerformanceObserver } from 'perf_hooks';
import * as os from 'os';
import * as process from 'process';

export interface PerformanceMetrics {
  timestamp: string;
  system: {
    cpuUsage: NodeJS.CpuUsage;
    memoryUsage: NodeJS.MemoryUsage;
    loadAverage: number[];
    uptime: number;
    platform: string;
    nodeVersion: string;
  };
  application: {
    eventLoopDelay: number;
    activeHandles: number;
    activeRequests: number;
    gcStats?;
  };
  database: {
    connectionCount: number;
    activeQueries: number;
    avgQueryTime: number;
    slowQueries: number;
  };
  cache: {
    hitRate: number;
    memoryUsage: number;
    operationsPerSecond: number;
  };
  http: {
    requestsPerSecond: number;
    avgResponseTime: number;
    errorRate: number;
    concurrentConnections: number;
  };
}

@Injectable()
export class PerformanceService {
  private readonly logger = new Logger(PerformanceService.name);
  private startTime = Date.now();
  private requestCount = 0;
  private errorCount = 0;
  private responseTimes: number[] = [];
  private eventLoopDelays: number[] = [];
  private performanceObserver!: PerformanceObserver;
  private gcStats: unknown = {};

  // Metrics storage
  private metricsHistory: PerformanceMetrics[] = [];
  private readonly maxHistorySize = 1000;

  constructor() {
    this.initializePerformanceObserver();
    this.startEventLoopMonitoring();
    this.setupGCMonitoring();
  }

  private initializePerformanceObserver(): void {
    this.performanceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'measure') {
          this.responseTimes.push(entry.duration);

          // Keep only last 1000 measurements
          if (this.responseTimes.length > 1000) {
            this.responseTimes = this.responseTimes.slice(-1000);
          }
        }
      });
    });

    this.performanceObserver.observe({ entryTypes: ['measure'] });
  }

  private startEventLoopMonitoring(): void {
    setInterval(() => {
      const start = process.hrtime.bigint();
      setImmediate(() => {
        const delta = process.hrtime.bigint() - start;
        const delay = Number(delta) / 1_000_000; // Convert to milliseconds

        this.eventLoopDelays.push(delay);

        // Keep only last 100 measurements
        if (this.eventLoopDelays.length > 100) {
          this.eventLoopDelays = this.eventLoopDelays.slice(-100);
        }

        // Log warning if event loop delay is high
        if (delay > 100) {
          this.logger.warn(`High event loop delay detected: ${delay.toFixed(2)}ms`);
        }
      });
    }, 1000);
  }

  private setupGCMonitoring(): void {
    // Monitor garbage collection if available
    if (performance.eventLoopUtilization) {
      setInterval(() => {
        const utilization = performance.eventLoopUtilization();
        this.gcStats.eventLoopUtilization = utilization;
      }, 5000);
    }
  }

  // Public methods
  recordRequest(responseTime: number, isError: boolean = false): void {
    this.requestCount++;
    if (isError) {
      this.errorCount++;
    }

    // Mark performance measurement
    performance.mark(`request-end-${this.requestCount}`);

    if (this.requestCount > 1) {
      performance.measure(
        `request-${this.requestCount}`,
        `request-start-${this.requestCount}`,
        `request-end-${this.requestCount}`
      );
    }

    performance.mark(`request-start-${this.requestCount + 1}`);
  }

  getMetrics(): PerformanceMetrics {
    const now = new Date().toISOString();
    const uptime = (Date.now() - this.startTime) / 1000;
    const avgEventLoopDelay = this.eventLoopDelays.length > 0
      ? this.eventLoopDelays.reduce((a, b) => a + b, 0) / this.eventLoopDelays.length
      : 0;

    const avgResponseTime = this.responseTimes.length > 0
      ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
      : 0;

    const requestsPerSecond = this.requestCount / uptime;
    const errorRate = this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0;

    const metrics: PerformanceMetrics = {
      timestamp: now,
      system: {
        cpuUsage: process.cpuUsage(),
        memoryUsage: process.memoryUsage(),
        loadAverage: os.loadavg(),
        uptime: os.uptime(),
        platform: os.platform(),
        nodeVersion: process.version,
      },
      application: {
        eventLoopDelay: avgEventLoopDelay,
        activeHandles: (process as unknown)._getActiveHandles ? (process as unknown)._getActiveHandles().length : 0,
        activeRequests: (process as unknown)._getActiveRequests ? (process as unknown)._getActiveRequests().length : 0,
        gcStats: this.gcStats,
      },
      database: {
        connectionCount: 0, // Will be updated by PrismaService
        activeQueries: 0,
        avgQueryTime: 0,
        slowQueries: 0,
      },
      cache: {
        hitRate: 0, // Will be updated by CacheService
        memoryUsage: 0,
        operationsPerSecond: 0,
      },
      http: {
        requestsPerSecond,
        avgResponseTime,
        errorRate,
        concurrentConnections: this.requestCount,
      },
    };

    // Store in history
    this.metricsHistory.push(metrics);
    if (this.metricsHistory.length > this.maxHistorySize) {
      this.metricsHistory = this.metricsHistory.slice(-this.maxHistorySize);
    }

    return metrics;
  }

  getDetailedMetrics(): unknown {
    const currentMetrics = this.getMetrics();

    return {
      current: currentMetrics,
      percentiles: this.calculatePercentiles(),
      trends: this.calculateTrends(),
      alerts: this.generateAlerts(currentMetrics),
      recommendations: this.generateRecommendations(currentMetrics),
    };
  }

  private calculatePercentiles(): unknown {
    if (this.responseTimes.length === 0) {
      return { p50: 0, p75: 0, p90: 0, p95: 0, p99: 0 };
    }

    const sorted = [...this.responseTimes].sort((a, b) => a - b);
    const length = sorted.length;

    return {
      p50: sorted[Math.floor(length * 0.5)],
      p75: sorted[Math.floor(length * 0.75)],
      p90: sorted[Math.floor(length * 0.9)],
      p95: sorted[Math.floor(length * 0.95)],
      p99: sorted[Math.floor(length * 0.99)],
    };
  }

  private calculateTrends(): unknown {
    if (this.metricsHistory.length < 2) {
      return { memoryTrend: 'stable', cpuTrend: 'stable', responseTrend: 'stable' };
    }

    const recent = this.metricsHistory.slice(-10);
    const current = recent[recent.length - 1];
    const previous = recent[0];

    const memoryChange = current.system.memoryUsage.heapUsed - previous.system.memoryUsage.heapUsed;
    const responseTimeChange = current.http.avgResponseTime - previous.http.avgResponseTime;

    return {
      memoryTrend: memoryChange > 1000000 ? 'increasing' : memoryChange < -1000000 ? 'decreasing' : 'stable',
      responseTrend: responseTimeChange > 50 ? 'increasing' : responseTimeChange < -50 ? 'decreasing' : 'stable',
      errorTrend: current.http.errorRate > previous.http.errorRate ? 'increasing' : 'stable',
    };
  }

  private generateAlerts(metrics: PerformanceMetrics): string[] {
    const alerts: string[] = [];

    // Memory alerts
    const heapUsedPercent = (metrics.system.memoryUsage.heapUsed / metrics.system.memoryUsage.heapTotal) * 100;
    if (heapUsedPercent > 80) {
      alerts.push(`High memory usage: ${heapUsedPercent.toFixed(1)}%`);
    }

    // Response time alerts
    if (metrics.http.avgResponseTime > 1000) {
      alerts.push(`High average response time: ${metrics.http.avgResponseTime.toFixed(2)}ms`);
    }

    // Error rate alerts
    if (metrics.http.errorRate > 5) {
      alerts.push(`High error rate: ${metrics.http.errorRate.toFixed(1)}%`);
    }

    // Event loop alerts
    if (metrics.application.eventLoopDelay > 100) {
      alerts.push(`High event loop delay: ${metrics.application.eventLoopDelay.toFixed(2)}ms`);
    }

    // CPU load alerts
    const avgLoad = metrics.system.loadAverage[0];
    const cpuCount = os.cpus().length;
    if (avgLoad > cpuCount * 0.8) {
      alerts.push(`High CPU load: ${avgLoad.toFixed(2)} (${cpuCount} cores)`);
    }

    return alerts;
  }

  private generateRecommendations(metrics: PerformanceMetrics): string[] {
    const recommendations: string[] = [];

    // Memory recommendations
    const heapUsedPercent = (metrics.system.memoryUsage.heapUsed / metrics.system.memoryUsage.heapTotal) * 100;
    if (heapUsedPercent > 70) {
      recommendations.push('Consider increasing heap size or implementing memory cleanup');
    }

    // Performance recommendations
    if (metrics.http.avgResponseTime > 500) {
      recommendations.push('Optimize slow endpoints or implement caching');
    }

    if (metrics.application.eventLoopDelay > 50) {
      recommendations.push('Reduce blocking operations or move them to worker threads');
    }

    // Database recommendations
    if (metrics.database.avgQueryTime > 100) {
      recommendations.push('Optimize database queries or add indexes');
    }

    return recommendations;
  }

  // Performance testing utilities
  measureFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
    performance.mark(`${name}-start`);

    return fn().then((result) => {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
      return result;
    }).catch((error) => {
      performance.mark(`${name}-error`);
      performance.measure(`${name}-error`, `${name}-start`, `${name}-error`);
      throw error;
    });
  }

  startTimer(name: string): () => number {
    const startTime = process.hrtime.bigint();

    return () => {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1_000_000; // Convert to milliseconds

      this.logger.debug(`${name} completed in ${duration.toFixed(2)}ms`);
      return duration;
    };
  }

  // Memory leak detection
  detectMemoryLeaks(): unknown {
    const usage = process.memoryUsage();
    const history = this.metricsHistory.slice(-60); // Last 60 measurements

    if (history.length < 10) {
      return { status: 'insufficient_data', trend: null };
    }

    const memoryTrend = history.map(m => m.system.memoryUsage.heapUsed);
    const averageIncrease = memoryTrend.reduce((acc, curr, idx) => {
      if (idx === 0) return 0;
      return acc + (curr - memoryTrend[idx - 1]);
    }, 0) / (memoryTrend.length - 1);

    const isMemoryLeak = averageIncrease > 1000000; // 1MB average increase

    return {
      status: isMemoryLeak ? 'potential_leak' : 'normal',
      trend: averageIncrease,
      currentUsage: usage,
      recommendation: isMemoryLeak
        ? 'Memory usage is consistently increasing. Check for memory leaks in event listeners, closures, or cached data.'
        : 'Memory usage appears stable.',
    };
  }

  // Health check for monitoring systems
  getHealthStatus(): unknown {
    const metrics = this.getMetrics();
    const alerts = this.generateAlerts(metrics);

    let status = 'healthy';
    if (alerts.length > 0) {
      status = alerts.some(alert =>
        alert.includes('High memory') ||
        alert.includes('High CPU') ||
        alert.includes('High error rate')
      ) ? 'critical' : 'warning';
    }

    return {
      status,
      alerts,
      uptime: metrics.system.uptime,
      memoryUsage: metrics.system.memoryUsage,
      responseTime: metrics.http.avgResponseTime,
      errorRate: metrics.http.errorRate,
      lastUpdated: metrics.timestamp,
    };
  }

  // Reset metrics (useful for testing)
  resetMetrics(): void {
    this.requestCount = 0;
    this.errorCount = 0;
    this.responseTimes = [];
    this.eventLoopDelays = [];
    this.metricsHistory = [];
    this.startTime = Date.now();
  }

  // Cleanup resources
  destroy(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
  }
}