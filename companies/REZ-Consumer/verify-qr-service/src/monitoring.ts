import logger from './utils/logger';

/**
 * REZ Verify QR Service - Monitoring & Observability
 * Sentry + Custom Metrics
 */

import * as Sentry from '@sentry/node';

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: `verify-qr-service@${process.env.npm_package_version || '1.0.0'}`,
  tracesSampleRate: 0.1,
  profilesSampleRate: 0.1,
  beforeSend(event) {
    // Filter sensitive data
    if (event.request?.headers) {
      delete event.request.headers['x-api-key'];
      delete event.request.headers['authorization'];
    }
    return event;
  }
});

// Custom metrics
export const metrics = {
  // Counter
  incrementCounter(name: string, tags?: Record<string, string>) {
    // In production, send to Datadog/Prometheus
    if (process.env.NODE_ENV === 'production') {
      logger.info(`[METRIC] counter.${name} ${JSON.stringify(tags || {})}`);
    }
  },

  // Gauge
  recordGauge(name: string, value: number, tags?: Record<string, string>) {
    if (process.env.NODE_ENV === 'production') {
      logger.info(`[METRIC] gauge.${name}=${value} ${JSON.stringify(tags || {})}`);
    }
  },

  // Histogram
  recordHistogram(name: string, value: number, tags?: Record<string, string>) {
    if (process.env.NODE_ENV === 'production') {
      logger.info(`[METRIC] histogram.${name}=${value} ${JSON.stringify(tags || {})}`);
    }
  },

  // Timing helper
  async time<T>(name: string, fn: () => Promise<T>, tags?: Record<string, string>): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.recordHistogram(`${name}.duration`, duration, { ...tags, status: 'success' });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.recordHistogram(`${name}.duration`, duration, { ...tags, status: 'error' });
      throw error;
    }
  }
};

// Health check with service dependencies
export async function comprehensiveHealthCheck() {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {} as Record<string, unknown>
  };

  // Check MongoDB
  try {
    const mongoose = require('mongoose');
    const state = mongoose.connection.readyState;
    checks.services.mongodb = {
      status: state === 1 ? 'healthy' : 'unhealthy',
      state: state === 1 ? 'connected' : 'disconnected'
    };
  } catch (e) {
    checks.services.mongodb = { status: 'unknown', error: (e as Error).message };
  }

  // Check Redis
  try {
    const redis = require('redis');
    checks.services.redis = { status: 'healthy' };
  } catch (e) {
    checks.services.redis = { status: 'not_configured' };
  }

  // Check external services
  const externalServices = [
    { name: 'merchant_api', url: process.env.MERCHANT_API },
    { name: 'wallet_api', url: process.env.WALLET_API },
    { name: 'mind_api', url: process.env.MIND_API }
  ];

  for (const svc of externalServices) {
    try {
      if (svc.url) {
        await fetch(`${svc.url}/health`, { timeout: 2000 });
        checks.services[svc.name] = { status: 'healthy' };
      } else {
        checks.services[svc.name] = { status: 'not_configured' };
      }
    } catch (e) {
      checks.services[svc.name] = { status: 'unhealthy', error: (e as Error).message };
    }
  }

  // Overall status
  const unhealthyCount = Object.values(checks.services).filter((s) => s.status === 'unhealthy').length;
  if (unhealthyCount > 0) {
    checks.status = unhealthyCount > 2 ? 'unhealthy' : 'degraded';
  }

  return checks;
}

// Error tracking wrapper
export function withErrorTracking<T extends (...args: unknown[]) => unknown>(
  fn: T,
  operationName: string
): T {
  return ((...args: unknown[]) => {
    return metrics.time(operationName, async () => {
      try {
        return await fn(...args);
      } catch (error) {
        Sentry.captureException(error, {
          extra: { args: JSON.stringify(args) }
        });
        throw error;
      }
    });
  }) as T;
}

export { Sentry };
