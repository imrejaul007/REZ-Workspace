import { Request, Response, NextFunction } from 'express';
import promClient from 'prom-client';
import { config } from '../config';

// Initialize Prometheus registry
const register = new promClient.Registry();

// Add default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({ register });

// Custom metrics

// HTTP request duration histogram
export const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});
register.registerMetric(httpRequestDuration);

// HTTP request counter
export const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});
register.registerMetric(httpRequestsTotal);

// Active requests gauge
export const activeRequests = new promClient.Gauge({
  name: 'active_requests',
  help: 'Number of active requests'
});
register.registerMetric(activeRequests);

// Campaign builds counter
export const campaignBuildsTotal = new promClient.Counter({
  name: 'campaign_builds_total',
  help: 'Total number of campaign builds',
  labelNames: ['status', 'goal_type']
});
register.registerMetric(campaignBuildsTotal);

// Campaign build duration histogram
export const campaignBuildDuration = new promClient.Histogram({
  name: 'campaign_build_duration_seconds',
  help: 'Duration of campaign build operations in seconds',
  labelNames: ['goal_type'],
  buckets: [0.5, 1, 2, 5, 10, 30, 60]
});
register.registerMetric(campaignBuildDuration);

// Build confidence histogram
export const buildConfidence = new promClient.Histogram({
  name: 'build_confidence',
  help: 'Confidence scores of campaign builds',
  labelNames: ['goal_type'],
  buckets: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
});
register.registerMetric(buildConfidence);

// Error counter
export const errorsTotal = new promClient.Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['type']
});
register.registerMetric(errorsTotal);

// NLP parsing duration
export const nlpParsingDuration = new promClient.Histogram({
  name: 'nlp_parsing_duration_seconds',
  help: 'Duration of NLP parsing operations in seconds',
  buckets: [0.1, 0.25, 0.5, 1, 2, 5]
});
register.registerMetric(nlpParsingDuration);

// Campaign generation duration
export const campaignGenerationDuration = new promClient.Histogram({
  name: 'campaign_generation_duration_seconds',
  help: 'Duration of campaign generation in seconds',
  buckets: [0.1, 0.25, 0.5, 1, 2, 5]
});
register.registerMetric(campaignGenerationDuration);

// Redis cache hit/miss
export const cacheOperations = new promClient.Counter({
  name: 'cache_operations_total',
  help: 'Total cache operations',
  labelNames: ['operation', 'result']
});
register.registerMetric(cacheOperations);

// Middleware to track request metrics
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  // Track active requests
  activeRequests.inc();

  // On response finish
  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const route = req.route?.path || req.path;

    // Skip metrics endpoint itself
    if (req.path === '/metrics') return;

    // Record metrics
    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode },
      duration
    );
    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode
    });

    activeRequests.dec();
  });

  next();
};

// Metrics endpoint handler
export const metricsHandler = async (_req: Request, res: Response): Promise<void> => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end();
  }
};

// Helper functions for recording custom metrics
export const recordBuild = (status: 'success' | 'failure', goalType: string, duration: number, confidence?: number): void => {
  campaignBuildsTotal.inc({ status, goal_type: goalType });
  campaignBuildDuration.observe({ goal_type: goalType }, duration);
  if (confidence !== undefined) {
    buildConfidence.observe({ goal_type: goalType }, confidence);
  }
};

export const recordNLPParse = (duration: number): void => {
  nlpParsingDuration.observe(duration);
};

export const recordCampaignGenerate = (duration: number): void => {
  campaignGenerationDuration.observe(duration);
};

export const recordCacheOperation = (operation: 'get' | 'set' | 'delete', hit: boolean): void => {
  cacheOperations.inc({ operation, result: hit ? 'hit' : 'miss' });
};

// Export metrics registry for testing
export { register as metricsRegister };

// Export all metrics for external access
export const metrics = {
  httpRequestDuration,
  httpRequestsTotal,
  activeRequests,
  campaignBuildsTotal,
  campaignBuildDuration,
  buildConfidence,
  errorsTotal,
  nlpParsingDuration,
  campaignGenerationDuration,
  cacheOperations
};

export default {
  metricsMiddleware,
  metricsHandler,
  recordBuild,
  recordNLPParse,
  recordCampaignGenerate,
  recordCacheOperation,
  metrics
};