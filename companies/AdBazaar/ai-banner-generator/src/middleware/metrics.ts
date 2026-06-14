/**
 * Prometheus Metrics Middleware
 */

import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';
import config from '../config';

// Create a Registry
const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
});

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const bannerGenerationsTotal = new client.Counter({
  name: 'banner_generations_total',
  help: 'Total number of banner generations',
  labelNames: ['status', 'format', 'style'],
});

const bannerGenerationDuration = new client.Histogram({
  name: 'banner_generation_duration_seconds',
  help: 'Duration of banner generation in seconds',
  labelNames: ['format', 'style'],
  buckets: [1, 2, 5, 10, 30, 60],
});

const templateUsageTotal = new client.Counter({
  name: 'template_usage_total',
  help: 'Total number of template usages',
  labelNames: ['category'],
});

const cacheHits = new client.Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_type'],
});

const cacheMisses = new client.Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_type'],
});

// Register custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(bannerGenerationsTotal);
register.registerMetric(bannerGenerationDuration);
register.registerMetric(templateUsageTotal);
register.registerMetric(cacheHits);
register.registerMetric(cacheMisses);

/**
 * Metrics middleware - tracks request duration
 */
export function metricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    const labels = {
      method: req.method,
      route,
      status_code: res.statusCode.toString(),
    };

    httpRequestDuration.observe(labels, duration);
    httpRequestTotal.inc(labels);
  });

  next();
}

/**
 * Metrics endpoint handler
 */
export async function metricsHandler(
  _req: Request,
  res: Response
): Promise<void> {
  res.set('Content-Type', register.contentType);
  res.send(await register.metrics());
}

/**
 * Record banner generation
 */
export function recordBannerGeneration(
  status: 'completed' | 'failed',
  format: string,
  style?: string,
  durationSeconds?: number
): void {
  const labels = { status, format, style: style || 'unknown' };
  bannerGenerationsTotal.inc(labels);

  if (durationSeconds && status === 'completed') {
    bannerGenerationDuration.observe(labels, durationSeconds);
  }
}

/**
 * Record template usage
 */
export function recordTemplateUsage(category: string): void {
  templateUsageTotal.inc({ category });
}

/**
 * Record cache hit
 */
export function recordCacheHit(cacheType: string): void {
  cacheHits.inc({ cache_type: cacheType });
}

/**
 * Record cache miss
 */
export function recordCacheMiss(cacheType: string): void {
  cacheMisses.inc({ cache_type: cacheType });
}

/**
 * Get current metrics values
 */
export async function getMetrics(): Promise<Record<string, unknown>> {
  return register.getMetricsAsJSON();
}

export { register };
export default {
  metricsMiddleware,
  metricsHandler,
  recordBannerGeneration,
  recordTemplateUsage,
  recordCacheHit,
  recordCacheMiss,
  getMetrics,
  register,
};