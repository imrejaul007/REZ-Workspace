/**
 * ReZ Upsell - Optimized Database Indexes
 *
 * These indexes optimize query performance for common operations.
 */

// ============================================
// UPSELL_STORES COLLECTION
// ============================================
export const upsellStoreIndexes = [
  // Primary lookup (most common query)
  {
    name: 'shop_unique',
    key: { shop: 1 },
    unique: true,
    background: true,
  },
  // Tenant isolation
  {
    name: 'tenant_shop',
    key: { tenantId: 1, shop: 1 },
    unique: true,
    background: true,
  },
  // Active stores lookup
  {
    name: 'shop_enabled',
    key: { shop: 1, enabled: 1 },
    background: true,
  },
];

// ============================================
// UPSELL_EVENTS COLLECTION
// ============================================
export const upsellEventIndexes = [
  // Primary lookup
  {
    name: 'eventId_unique',
    key: { eventId: 1 },
    unique: true,
    sparse: true,
    background: true,
  },
  // Session analysis
  {
    name: 'session_events',
    key: { sessionId: 1, event: 1, timestamp: -1 },
    background: true,
  },
  // Shop analytics (time-series)
  {
    name: 'shop_event_timestamp',
    key: { shop: 1, event: 1, timestamp: -1 },
    background: true,
  },
  // Tenant analytics
  {
    name: 'tenant_event_timestamp',
    key: { tenantId: 1, shop: 1, event: 1, timestamp: -1 },
    background: true,
  },
  // TTL index (auto-delete old events)
  {
    name: 'ttl_timestamp',
    key: { timestamp: 1 },
    expireAfterSeconds: 90 * 24 * 60 * 60, // 90 days
    background: true,
  },
  // Conversion funnel
  {
    name: 'shop_conversion',
    key: { shop: 1, offerId: 1, event: 1 },
    background: true,
  },
];

// ============================================
// ANALYTICS AGGREGATION PIPELINES
// ============================================

/**
 * Get funnel analytics for a shop
 */
export const funnelAnalyticsPipeline = (shop: string, startDate: Date, endDate: Date): any[] => [
  { $match: { shop, timestamp: { $gte: startDate, $lte: endDate } } },
  { $group: {
    _id: '$event',
    count: { $sum: 1 },
    revenue: { $sum: '$revenue' },
  }},
  { $sort: { _id: 1 } },
];

/**
 * Get hourly trends
 */
export const hourlyTrendsPipeline = (shop: string, date: Date): any[] => [
  { $match: {
    shop,
    timestamp: {
      $gte: new Date(date.setHours(0, 0, 0, 0)),
      $lt: new Date(date.setHours(23, 59, 59, 999)),
    },
  }},
  { $group: {
    _id: { $hour: '$timestamp' },
    impressions: { $sum: { $cond: [{ $eq: ['$event', 'offer_shown'] }, 1, 0] } },
    clicks: { $sum: { $cond: [{ $eq: ['$event', 'offer_clicked'] }, 1, 0] } },
    accepts: { $sum: { $cond: [{ $eq: ['$event', 'offer_accepted'] }, 1, 0] } },
    revenue: { $sum: { $cond: [{ $eq: ['$event', 'offer_accepted'] }, '$revenue', 0] } },
  }},
  { $sort: { _id: 1 } },
];

/**
 * Get conversion metrics
 */
export const conversionMetricsPipeline = (shop: string, startDate: Date, endDate: Date): any[] => [
  { $match: { shop, timestamp: { $gte: startDate, $lte: endDate } } },
  { $facet: {
    totals: [
      { $group: {
        _id: null,
        impressions: { $sum: { $cond: [{ $eq: ['$event', 'offer_shown'] }, 1, 0] } },
        clicks: { $sum: { $cond: [{ $eq: ['$event', 'offer_clicked'] }, 1, 0] } },
        accepts: { $sum: { $cond: [{ $eq: ['$event', 'offer_accepted'] }, 1, 0] } },
        revenue: { $sum: { $cond: [{ $eq: ['$event', 'offer_accepted'] }, '$revenue', 0] } },
      }},
    ],
    byDay: [
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
        impressions: { $sum: { $cond: [{ $eq: ['$event', 'offer_shown'] }, 1, 0] } },
        accepts: { $sum: { $cond: [{ $eq: ['$event', 'offer_accepted'] }, 1, 0] } },
        revenue: { $sum: { $cond: [{ $eq: ['$event', 'offer_accepted'] }, '$revenue', 0] } },
      }},
      { $sort: { _id: 1 } },
    ],
  }},
];

/**
 * Get A/B test results
 */
export const abTestPipeline = (testId: string): any[] => [
  { $match: { 'metadata.testId': testId } },
  { $group: {
    _id: '$metadata.variant',
    impressions: { $sum: { $cond: [{ $eq: ['$event', 'offer_shown'] }, 1, 0] } },
    clicks: { $sum: { $cond: [{ $eq: ['$event', 'offer_clicked'] }, 1, 0] } },
    accepts: { $sum: { $cond: [{ $eq: ['$event', 'offer_accepted'] }, 1, 0] } },
    revenue: { $sum: { $cond: [{ $eq: ['$event', 'offer_accepted'] }, '$revenue', 0] } },
  }},
  { $project: {
    variant: '$_id',
    impressions: 1,
    clicks: 1,
    accepts: 1,
    revenue: 1,
    clickRate: { $cond: [{ $eq: ['$impressions', 0] }, 0, { $multiply: [{ $divide: ['$clicks', '$impressions'] }, 100] }] },
    conversionRate: { $cond: [{ $eq: ['$clicks', 0] }, 0, { $multiply: [{ $divide: ['$accepts', '$clicks'] }, 100] }] },
  }},
  { $sort: { variant: 1 } },
];
