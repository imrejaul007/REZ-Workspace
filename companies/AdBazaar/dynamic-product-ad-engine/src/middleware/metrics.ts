/**
 * Metrics Middleware
 * Prometheus metrics collection
 */

import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

// Create a Registry
export const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Custom metrics
export const httpRequestsTotal = new client.Counter({
  name: 'dpa_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const httpRequestDuration = new client.Histogram({
  name: 'dpa_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const feedsCreatedTotal = new client.Counter({
  name: 'dpa_feeds_created_total',
  help: 'Total number of feeds created',
  registers: [register],
});

export const campaignsCreatedTotal = new client.Counter({
  name: 'dpa_campaigns_created_total',
  help: 'Total number of campaigns created',
  registers: [register],
});

export const adsRenderedTotal = new client.Counter({
  name: 'dpa_ads_rendered_total',
  help: 'Total number of ads rendered',
  labelNames: ['campaign_id'],
  registers: [register],
});

export const impressionsTotal = new client.Counter({
  name: 'dpa_impressions_total',
  help: 'Total number of ad impressions',
  labelNames: ['campaign_id'],
  registers: [register],
});

export const clicksTotal = new client.Counter({
  name: 'dpa_clicks_total',
  help: 'Total number of ad clicks',
  labelNames: ['campaign_id'],
  registers: [register],
});

export const conversionsTotal = new client.Counter({
  name: 'dpa_conversions_total',
  help: 'Total number of ad conversions',
  labelNames: ['campaign_id'],
  registers: [register],
});

export const activeCampaignsGauge = new client.Gauge({
  name: 'dpa_active_campaigns',
  help: 'Number of active DPA campaigns',
  registers: [register],
});

export const activeFeedsGauge = new client.Gauge({
  name: 'dpa_active_feeds',
  help: 'Number of active product feeds',
  registers: [register],
});

export const productsInFeedsGauge = new client.Gauge({
  name: 'dpa_products_in_feeds',
  help: 'Total number of products across all feeds',
  registers: [register],
});

/**
 * Metrics collection middleware
 */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  // Intercept response to record metrics
  const originalEnd = res.end;
  res.end = function (this: Response, ...args: any[]) {
    const duration = (Date.now() - startTime) / 1000;
    const route = req.route?.path || req.path;
    const labels = {
      method: req.method,
      route: route,
      status_code: res.statusCode.toString(),
    };

    httpRequestsTotal.inc(labels);
    httpRequestDuration.observe(labels, duration);

    return originalEnd.apply(this, args);
  } as typeof res.end;

  next();
}

/**
 * Metrics endpoint handler
 */
export async function metricsHandler(_req: Request, res: Response): Promise<void> {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end();
  }
}

/**
 * Update gauge metrics
 */
export function updateGauges(activeCampaigns: number, activeFeeds: number, productsCount: number): void {
  activeCampaignsGauge.set(activeCampaigns);
  activeFeedsGauge.set(activeFeeds);
  productsInFeedsGauge.set(productsCount);
}

/**
 * Record feed creation
 */
export function recordFeedCreated(): void {
  feedsCreatedTotal.inc();
}

/**
 * Record campaign creation
 */
export function recordCampaignCreated(): void {
  campaignsCreatedTotal.inc();
}

/**
 * Record ad rendered
 */
export function recordAdRendered(campaignId: string): void {
  adsRenderedTotal.inc({ campaign_id: campaignId });
}

/**
 * Record impression
 */
export function recordImpression(campaignId: string): void {
  impressionsTotal.inc({ campaign_id: campaignId });
}

/**
 * Record click
 */
export function recordClick(campaignId: string): void {
  clicksTotal.inc({ campaign_id: campaignId });
}

/**
 * Record conversion
 */
export function recordConversion(campaignId: string): void {
  conversionsTotal.inc({ campaign_id: campaignId });
}

export default {
  register,
  metricsMiddleware,
  metricsHandler,
  updateGauges,
  recordFeedCreated,
  recordCampaignCreated,
  recordAdRendered,
  recordImpression,
  recordClick,
  recordConversion,
};