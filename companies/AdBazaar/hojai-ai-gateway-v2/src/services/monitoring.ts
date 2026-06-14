/**
 * Sentry Monitoring Setup
 *
 * Error tracking and performance monitoring.
 */

// Sentry configuration - uncomment when SENTRY_DSN is set
/*
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  integrations: [
    nodeProfilingIntegration(),
  ],
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
});
*/

// ============================================================================
// ERROR HANDLING
// ============================================================================

export function setupErrorHandling(): void {
  process.on('uncaughtException', (error) => {
    logger.error('[FATAL] Uncaught Exception:', error);
    // Sentry.captureException(error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
    // Sentry.captureException(reason);
  });
}

// ============================================================================
// METRICS
// ============================================================================

interface MetricPoint {
  name: string;
  value: number;
  timestamp: number;
  tags: Record<string, string>;
}

const metricsBuffer: MetricPoint[] = [];

// Push metric to buffer (would send to Prometheus/DataDog in production)
export function pushMetric(name: string, value: number, tags: Record<string, string> = {}): void {
  metricsBuffer.push({
    name,
    value,
    timestamp: Date.now(),
    tags,
  });

  // Flush if buffer too large
  if (metricsBuffer.length > 1000) {
    flushMetrics();
  }
}

// Flush metrics to monitoring system
export function flushMetrics(): void {
  if (metricsBuffer.length === 0) return;

  const metrics = metricsBuffer.splice(0, metricsBuffer.length);
  logger.info(`[Metrics] Flushing ${metrics.length} metrics`);
  // In production: send to Prometheus Pushgateway or DataDog
}

// ============================================================================
// HEALTH CHECKS
// ============================================================================

export interface HealthStatus {
  healthy: boolean;
  checks: {
    circuitBreakers: boolean;
    cache: boolean;
    memory: boolean;
  };
  uptime: number;
}

export function getHealthStatus(): HealthStatus {
  const memoryUsage = process.memoryUsage();
  const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;

  return {
    healthy: heapUsedMB < 400, // Alert if heap > 400MB
    checks: {
      circuitBreakers: true, // Would check actual circuit states
      cache: true,
      memory: heapUsedMB < 400,
    },
    uptime: process.uptime(),
  };
}

// ============================================================================
// LOGGING
// ============================================================================

export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
} as const;

type LogLevelType = typeof LogLevel[keyof typeof LogLevel];

export function log(level: LogLevelType, message: string, meta?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString();
  const levelName = Object.keys(LogLevel).find(k => LogLevel[k as keyof typeof LogLevel] === level) || 'INFO';

  const logEntry = {
    timestamp,
    level: levelName,
    message,
    ...meta,
  };

  // Console output
  if (level >= LogLevel[process.env.LOG_LEVEL as keyof typeof LogLevel] ?? LogLevel.INFO) {
    if (level >= LogLevel.ERROR) {
      logger.error(JSON.stringify(logEntry));
    } else {
      logger.info(JSON.stringify(logEntry));
    }
  }

  // In production: send to log aggregation (Datadog, CloudWatch, etc.)
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  setupErrorHandling,
  pushMetric,
  flushMetrics,
  getHealthStatus,
  log,
  LogLevel,
};
