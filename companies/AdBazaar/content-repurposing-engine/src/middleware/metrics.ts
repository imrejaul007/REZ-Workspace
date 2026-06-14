import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';
import { config } from '../config/index.js';

// Create a Registry
export const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// Custom metrics
export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const contentRepurposingTotal = new client.Counter({
  name: 'content_repurposing_total',
  help: 'Total number of content repurposing operations',
  labelNames: ['source_platform', 'target_platform', 'status'],
});

export const videoHighlightsExtracted = new client.Counter({
  name: 'video_highlights_extracted_total',
  help: 'Total number of video highlights extracted',
  labelNames: ['platform', 'status'],
});

export const templatesCreatedTotal = new client.Counter({
  name: 'templates_created_total',
  help: 'Total number of templates created',
  labelNames: ['source_platform', 'target_platform'],
});

export const processingQueueSize = new client.Gauge({
  name: 'processing_queue_size',
  help: 'Current size of the processing queue',
});

// Register custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(contentRepurposingTotal);
register.registerMetric(videoHighlightsExtracted);
register.registerMetric(templatesCreatedTotal);
register.registerMetric(processingQueueSize);

export function metricsMiddleware(_req: Request, res: Response, next: NextFunction): void {
  if (!config.metrics.enabled) {
    next();
    return;
  }
  next();
}

export async function getMetrics(): Promise<string> {
  return register.metrics();
}
