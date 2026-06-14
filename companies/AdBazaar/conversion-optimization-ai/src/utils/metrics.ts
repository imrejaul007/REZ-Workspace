/**
 * Prometheus metrics utility
 */

import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';
import { config } from '../config/env';

const register = new Registry();

// Default metrics (CPU, memory, etc.)
if (config.METRICS_ENABLED) {
  collectDefaultMetrics({ register });
}

// Request metrics
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

// Optimization metrics
export const optimizationActive = new Gauge({
  name: 'optimization_active_count',
  help: 'Number of active campaign optimizations',
  registers: [register],
});

export const optimizationPaused = new Gauge({
  name: 'optimization_paused_count',
  help: 'Number of paused campaign optimizations',
  registers: [register],
});

export const optimizationCompleted = new Gauge({
  name: 'optimization_completed_count',
  help: 'Number of completed campaign optimizations',
  registers: [register],
});

// Bid optimization metrics
export const bidRecommendationsTotal = new Counter({
  name: 'bid_recommendations_total',
  help: 'Total number of bid recommendations generated',
  labelNames: ['campaign_id', 'placement_id'],
  registers: [register],
});

export const bidAdjustmentTotal = new Counter({
  name: 'bid_adjustments_total',
  help: 'Total number of bid adjustments made',
  labelNames: ['campaign_id', 'type'],
  registers: [register],
});

export const bidAdjustmentAmount = new Histogram({
  name: 'bid_adjustment_amount',
  help: 'Bid adjustment amounts in percentage',
  labelNames: ['campaign_id'],
  buckets: [-30, -20, -10, 0, 10, 20, 30],
  registers: [register],
});

// Recommendation metrics
export const recommendationsGenerated = new Counter({
  name: 'recommendations_generated_total',
  help: 'Total number of recommendations generated',
  labelNames: ['priority', 'type'],
  registers: [register],
});

// Performance metrics
export const recommendationConfidence = new Histogram({
  name: 'recommendation_confidence',
  help: 'Confidence scores of recommendations',
  buckets: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
  registers: [register],
});

export const optimizationScore = new Gauge({
  name: 'optimization_score',
  help: 'Overall optimization score per campaign',
  labelNames: ['campaign_id'],
  registers: [register],
});

// Cache metrics
export const cacheHits = new Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_type'],
  registers: [register],
});

export const cacheMisses = new Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_type'],
  registers: [register],
});

// AI processing metrics
export const aiProcessingTime = new Histogram({
  name: 'ai_processing_duration_seconds',
  help: 'AI processing time in seconds',
  labelNames: ['operation'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
  registers: [register],
});

export const aiErrors = new Counter({
  name: 'ai_errors_total',
  help: 'Total number of AI processing errors',
  labelNames: ['operation', 'error_type'],
  registers: [register],
});

export { register };

export const getMetrics = async (): Promise<string> => {
  return register.metrics();
};

export const getContentType = (): string => {
  return register.contentType;
};