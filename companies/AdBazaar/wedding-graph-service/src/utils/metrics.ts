import { register, Counter, Histogram, Gauge, Summary } from 'prom-client';

/**
 * Prometheus metrics for wedding-graph-service
 */

// HTTP Metrics
export const httpRequestsTotal = new Counter({
  name: 'wedding_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status']
});

export const httpRequestDuration = new Histogram({
  name: 'wedding_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
});

// Business Metrics - Weddings
export const weddingTotal = new Counter({
  name: 'wedding_total_created',
  help: 'Total number of weddings created'
});

export const weddingActiveGauge = new Gauge({
  name: 'wedding_active_count',
  help: 'Number of active weddings'
});

export const weddingByStatus = new Gauge({
  name: 'wedding_by_status',
  help: 'Number of weddings by status',
  labelNames: ['status']
});

// Business Metrics - Guests
export const guestTotal = new Counter({
  name: 'wedding_guest_total_created',
  help: 'Total number of guests created'
});

export const guestRsvpTotal = new Counter({
  name: 'wedding_guest_rsvp_total',
  help: 'Total RSVP updates by status',
  labelNames: ['status']
});

export const guestActiveGauge = new Gauge({
  name: 'wedding_guest_active_count',
  help: 'Total number of guests across all weddings'
});

// Business Metrics - Vendors
export const vendorTotal = new Counter({
  name: 'wedding_vendor_total_created',
  help: 'Total number of vendors created'
});

export const vendorBookedTotal = new Counter({
  name: 'wedding_vendor_booked_total',
  help: 'Total number of vendors booked'
});

export const vendorPaymentTotal = new Counter({
  name: 'wedding_vendor_payment_total',
  help: 'Total vendor payments in INR',
  labelNames: ['category']
});

// Business Metrics - Campaigns
export const campaignTotal = new Counter({
  name: 'wedding_campaign_total_created',
  help: 'Total number of campaigns created'
});

export const campaignImpressionsTotal = new Counter({
  name: 'wedding_campaign_impressions_total',
  help: 'Total campaign impressions'
});

export const campaignClicksTotal = new Counter({
  name: 'wedding_campaign_clicks_total',
  help: 'Total campaign clicks'
});

export const campaignConversionsTotal = new Counter({
  name: 'wedding_campaign_conversions_total',
  help: 'Total campaign conversions'
});

export const campaignSpendTotal = new Counter({
  name: 'wedding_campaign_spend_total',
  help: 'Total campaign spend in INR'
});

// Analytics Metrics
export const analyticsGenerationDuration = new Histogram({
  name: 'wedding_analytics_generation_duration_seconds',
  help: 'Duration of analytics generation',
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

// Targeting Metrics
export const targetingAudienceSize = new Gauge({
  name: 'wedding_targeting_audience_size',
  help: 'Size of targeting audience'
});

export const targetingLookalikeTotal = new Gauge({
  name: 'wedding_targeting_lookalike_total',
  help: 'Total lookalike audiences generated'
});

// Database Metrics
export const mongoOperationDuration = new Histogram({
  name: 'wedding_mongo_operation_duration_seconds',
  help: 'Duration of MongoDB operations',
  labelNames: ['operation', 'collection']
});

export const mongoConnectionGauge = new Gauge({
  name: 'wedding_mongo_connection_status',
  help: 'MongoDB connection status (1 = connected, 0 = disconnected)'
});

// Cache Metrics
export const redisOperationDuration = new Histogram({
  name: 'wedding_redis_operation_duration_seconds',
  help: 'Duration of Redis operations',
  labelNames: ['operation']
});

export const redisConnectionGauge = new Gauge({
  name: 'wedding_redis_connection_status',
  help: 'Redis connection status (1 = connected, 0 = disconnected)'
});

// Budget Metrics
export const budgetTotalGauge = new Gauge({
  name: 'wedding_budget_total_value',
  help: 'Total budget value across all weddings in INR'
});

export const budgetSpentGauge = new Gauge({
  name: 'wedding_budget_spent_value',
  help: 'Total spent across all weddings in INR'
});

// Location Metrics
export const weddingByCity = new Gauge({
  name: 'wedding_by_city',
  help: 'Number of weddings by city',
  labelNames: ['city', 'state']
});

/**
 * Record a wedding creation
 */
export function recordWeddingCreated(status: string = 'planning') {
  weddingTotal.inc();
  weddingActiveGauge.inc();
  weddingByStatus.labels(status).inc();
}

/**
 * Record a guest creation
 */
export function recordGuestCreated() {
  guestTotal.inc();
  guestActiveGauge.inc();
}

/**
 * Record an RSVP update
 */
export function recordRsvpUpdate(status: string) {
  guestRsvpTotal.labels(status).inc();
}

/**
 * Record a vendor creation
 */
export function recordVendorCreated(category: string) {
  vendorTotal.inc({ category });
}

/**
 * Record a vendor booking
 */
export function recordVendorBooked(category: string, amount: number) {
  vendorBookedTotal.inc();
  vendorPaymentTotal.labels(category).inc(amount);
}

/**
 * Record campaign metrics
 */
export function recordCampaignMetrics(impressions: number, clicks: number, conversions: number, spend: number) {
  campaignImpressionsTotal.inc(impressions);
  campaignClicksTotal.inc(clicks);
  campaignConversionsTotal.inc(conversions);
  campaignSpendTotal.inc(spend);
}

/**
 * Helper to get metrics for a specific wedding
 */
export function getWeddingMetrics(weddingId: string) {
  return {
    wedding: {
      active: weddingActiveGauge.get(),
      byStatus: weddingByStatus.collect()
    },
    guests: {
      total: guestActiveGauge.get()
    },
    campaigns: {
      impressions: campaignImpressionsTotal.get(),
      clicks: campaignClicksTotal.get(),
      conversions: campaignConversionsTotal.get(),
      spend: campaignSpendTotal.get()
    }
  };
}

export { register };