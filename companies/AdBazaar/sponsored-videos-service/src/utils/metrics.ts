import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';
import { config } from '../config';

export const registry = new Registry();

// Default metrics (CPU, memory, etc.)
if (config.metrics.enabled) {
  collectDefaultMetrics({ register: registry });
}

// HTTP Request Metrics
export const httpRequestsTotal = new Counter({
  name: 'sponsored_videos_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [registry],
});

export const httpRequestDuration = new Histogram({
  name: 'sponsored_videos_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
  registers: [registry],
});

// Video Metrics
export const videosTotal = new Counter({
  name: 'sponsored_videos_created_total',
  help: 'Total number of videos created',
  labelNames: ['status'],
  registers: [registry],
});

export const videosActive = new Gauge({
  name: 'sponsored_videos_active',
  help: 'Number of active videos',
  registers: [registry],
});

// Sponsor Metrics
export const sponsorsTotal = new Counter({
  name: 'sponsored_videos_sponsors_total',
  help: 'Total number of sponsors added',
  labelNames: ['placement', 'status'],
  registers: [registry],
});

export const sponsorImpressions = new Counter({
  name: 'sponsored_videos_sponsor_impressions_total',
  help: 'Total sponsor impressions',
  labelNames: ['advertiserId', 'placement'],
  registers: [registry],
});

export const sponsorClicks = new Counter({
  name: 'sponsored_videos_sponsor_clicks_total',
  help: 'Total sponsor clicks',
  labelNames: ['advertiserId', 'placement'],
  registers: [registry],
});

// Campaign Metrics
export const campaignsTotal = new Counter({
  name: 'sponsored_videos_campaigns_total',
  help: 'Total number of campaigns created',
  labelNames: ['status'],
  registers: [registry],
});

export const campaignsActive = new Gauge({
  name: 'sponsored_videos_campaigns_active',
  help: 'Number of active campaigns',
  registers: [registry],
});

export const campaignBudgetSpent = new Counter({
  name: 'sponsored_videos_campaign_budget_spent_total',
  help: 'Total campaign budget spent',
  labelNames: ['advertiserId'],
  registers: [registry],
});

// Analytics Metrics
export const videoViewsTotal = new Counter({
  name: 'sponsored_videos_views_total',
  help: 'Total video views',
  labelNames: ['videoId', 'source'],
  registers: [registry],
});

export const watchTimeTotal = new Counter({
  name: 'sponsored_videos_watch_time_seconds_total',
  help: 'Total watch time in seconds',
  labelNames: ['videoId'],
  registers: [registry],
});

export const engagementTotal = new Counter({
  name: 'sponsored_videos_engagement_total',
  help: 'Total engagement actions',
  labelNames: ['type', 'videoId'],
  registers: [registry],
});

// Redis Cache Metrics
export const cacheHits = new Counter({
  name: 'sponsored_videos_cache_hits_total',
  help: 'Total cache hits',
  labelNames: ['operation'],
  registers: [registry],
});

export const cacheMisses = new Counter({
  name: 'sponsored_videos_cache_misses_total',
  help: 'Total cache misses',
  labelNames: ['operation'],
  registers: [registry],
});

// Database Metrics
export const dbOperationDuration = new Histogram({
  name: 'sponsored_videos_db_operation_duration_seconds',
  help: 'Database operation duration in seconds',
  labelNames: ['operation', 'collection'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [registry],
});

// Helper functions
export function recordHttpRequest(method: string, path: string, status: number, duration: number) {
  httpRequestsTotal.inc({ method, path, status: status.toString() });
  httpRequestDuration.observe({ method, path, status: status.toString() }, duration);
}

export function recordVideoCreated(status: string) {
  videosTotal.inc({ status });
}

export function recordSponsorAdded(placement: string, status: string) {
  sponsorsTotal.inc({ placement, status });
}

export function recordCampaignCreated(status: string) {
  campaignsTotal.inc({ status });
}

export function recordVideoView(videoId: string, source: string = 'direct') {
  videoViewsTotal.inc({ videoId, source });
}

export function recordEngagement(type: string, videoId: string) {
  engagementTotal.inc({ type, videoId });
}

export function recordCacheHit(operation: string) {
  cacheHits.inc({ operation });
}

export function recordCacheMiss(operation: string) {
  cacheMisses.inc({ operation });
}

export default {
  registry,
  httpRequestsTotal,
  httpRequestDuration,
  videosTotal,
  videosActive,
  sponsorsTotal,
  sponsorImpressions,
  sponsorClicks,
  campaignsTotal,
  campaignsActive,
  campaignBudgetSpent,
  videoViewsTotal,
  watchTimeTotal,
  engagementTotal,
  cacheHits,
  cacheMisses,
  dbOperationDuration,
  recordHttpRequest,
  recordVideoCreated,
  recordSponsorAdded,
  recordCampaignCreated,
  recordVideoView,
  recordEngagement,
  recordCacheHit,
  recordCacheMiss,
};