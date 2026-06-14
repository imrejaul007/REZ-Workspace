import { Request, Response, NextFunction } from 'express';
import client, { Counter, Histogram, Gauge } from 'prom-client';

// Initialize Prometheus metrics
const register = new client.Registry();

client.collectDefaultMetrics({ register });

// HTTP metrics
const httpRequestsTotal = new Counter({
  name: 'ctv_ad_server_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

const httpRequestDuration = new Histogram({
  name: 'ctv_ad_server_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [register],
});

// Ad serving metrics
const adRequestsTotal = new Counter({
  name: 'ctv_ad_server_ad_requests_total',
  help: 'Total number of ad requests',
  labelNames: ['placement_id', 'device_type', 'format'],
  registers: [register],
});

const adImpressionsTotal = new Counter({
  name: 'ctv_ad_server_ad_impressions_total',
  help: 'Total number of ad impressions',
  labelNames: ['campaign_id', 'format'],
  registers: [register],
});

const adRevenueTotal = new Counter({
  name: 'ctv_ad_server_ad_revenue_total',
  help: 'Total ad revenue',
  labelNames: ['campaign_id', 'bid_type'],
  registers: [register],
});

// Campaign metrics
const activeCampaignsGauge = new Gauge({
  name: 'ctv_ad_server_active_campaigns',
  help: 'Number of active campaigns',
  registers: [register],
});

const campaignBudgetRemaining = new Gauge({
  name: 'ctv_ad_server_campaign_budget_remaining',
  help: 'Remaining budget for campaigns',
  labelNames: ['campaign_id'],
  registers: [register],
});

// Event metrics
const adEventsTotal = new Counter({
  name: 'ctv_ad_server_ad_events_total',
  help: 'Total number of ad events',
  labelNames: ['event_type', 'campaign_id'],
  registers: [register],
});

// VAST response metrics
const vastGenerationsTotal = new Counter({
  name: 'ctv_ad_server_vast_generations_total',
  help: 'Total VAST XML generations',
  labelNames: ['type', 'status'],
  registers: [register],
});

const vastGenerationDuration = new Histogram({
  name: 'ctv_ad_server_vast_generation_duration_seconds',
  help: 'VAST XML generation duration',
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1],
  registers: [register],
});

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;

    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode.toString(),
    });

    httpRequestDuration.observe(
      {
        method: req.method,
        route,
        status_code: res.statusCode.toString(),
      },
      duration
    );
  });

  next();
};

export const getMetrics = async (): Promise<string> => {
  return register.metrics();
};

export const getContentType = (): string => {
  return register.contentType;
};

// Metric helper functions
export const recordAdRequest = (placementId: string, deviceType: string, format: string): void => {
  adRequestsTotal.inc({ placement_id: placementId, device_type: deviceType, format });
};

export const recordAdImpression = (campaignId: string, format: string): void => {
  adImpressionsTotal.inc({ campaign_id: campaignId, format });
};

export const recordAdRevenue = (campaignId: string, bidType: string, amount: number): void => {
  adRevenueTotal.inc({ campaign_id: campaignId, bid_type: bidType }, amount);
};

export const recordAdEvent = (eventType: string, campaignId: string): void => {
  adEventsTotal.inc({ event_type: eventType, campaign_id: campaignId });
};

export const setActiveCampaignsCount = (count: number): void => {
  activeCampaignsGauge.set(count);
};

export const setCampaignBudgetRemaining = (campaignId: string, remaining: number): void => {
  campaignBudgetRemaining.set({ campaign_id: campaignId }, remaining);
};

export const recordVastGeneration = (type: string, status: string): void => {
  vastGenerationsTotal.inc({ type, status });
};

export const recordVastGenerationDuration = (duration: number): void => {
  vastGenerationDuration.observe(duration);
};

export { register };