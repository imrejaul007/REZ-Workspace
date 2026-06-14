/**
 * Prometheus Metrics for Search Ads Service
 */

import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';
import { config } from '../config';

// Create a custom registry
const register = new Registry();

// Collect default metrics (CPU, memory, etc.)
if (config.metrics.enabled) {
  collectDefaultMetrics({ register });
}

// HTTP request counter
export const httpRequestsTotal = new Counter({
  name: `${config.metrics.prefix}http_requests_total`,
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// HTTP request duration histogram
export const httpRequestDuration = new Histogram({
  name: `${config.metrics.prefix}http_request_duration_seconds`,
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

// Active campaigns gauge
export const activeCampaigns = new Gauge({
  name: `${config.metrics.prefix}active_campaigns`,
  help: 'Number of active search campaigns',
  registers: [register],
});

// Campaign spend counter
export const campaignSpend = new Counter({
  name: `${config.metrics.prefix}campaign_spend_total`,
  help: 'Total spend across all campaigns',
  labelNames: ['campaign_id', 'network'],
  registers: [register],
});

// Impressions counter
export const impressionsTotal = new Counter({
  name: `${config.metrics.prefix}impressions_total`,
  help: 'Total number of ad impressions',
  labelNames: ['campaign_id', 'network'],
  registers: [register],
});

// Clicks counter
export const clicksTotal = new Counter({
  name: `${config.metrics.prefix}clicks_total`,
  help: 'Total number of ad clicks',
  labelNames: ['campaign_id', 'network'],
  registers: [register],
});

// Conversions counter
export const conversionsTotal = new Counter({
  name: `${config.metrics.prefix}conversions_total`,
  help: 'Total number of conversions',
  labelNames: ['campaign_id', 'network'],
  registers: [register],
});

// Search queries counter
export const searchQueriesTotal = new Counter({
  name: `${config.metrics.prefix}search_queries_total`,
  help: 'Total number of search queries processed',
  labelNames: ['intent_category', 'matched'],
  registers: [register],
});

// Quality score histogram
export const qualityScoreDistribution = new Histogram({
  name: `${config.metrics.prefix}quality_score_distribution`,
  help: 'Distribution of keyword quality scores',
  labelNames: ['campaign_id'],
  buckets: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  registers: [register],
});

// Bid amount histogram
export const bidAmounts = new Histogram({
  name: `${config.metrics.prefix}bid_amounts`,
  help: 'Distribution of bid amounts',
  buckets: [0.1, 0.5, 1, 2, 5, 10, 25, 50, 100],
  registers: [register],
});

// Campaign optimization counter
export const optimizationsTotal = new Counter({
  name: `${config.metrics.prefix}optimizations_total`,
  help: 'Total number of campaign optimizations',
  labelNames: ['campaign_id', 'type', 'result'],
  registers: [register],
});

// Redis cache hit/miss
export const cacheHits = new Counter({
  name: `${config.metrics.prefix}cache_hits_total`,
  help: 'Total number of cache hits',
  labelNames: ['cache_type'],
  registers: [register],
});

export const cacheMisses = new Counter({
  name: `${config.metrics.prefix}cache_misses_total`,
  help: 'Total number of cache misses',
  labelNames: ['cache_type'],
  registers: [register],
});

// Error counter
export const errorsTotal = new Counter({
  name: `${config.metrics.prefix}errors_total`,
  help: 'Total number of errors',
  labelNames: ['type', 'operation'],
  registers: [register],
});

// Export the registry
export { register };

// Helper function to record request metrics
export function recordRequest(method: string, route: string, statusCode: number, duration: number): void {
  httpRequestsTotal.inc({ method, route, status_code: statusCode.toString() });
  httpRequestDuration.observe({ method, route, status_code: statusCode.toString() }, duration);
}

// Helper to get metrics
export async function getMetrics(): Promise<string> {
  return register.metrics();
}

// Helper to get content type
export function getContentType(): string {
  return register.contentType;
}