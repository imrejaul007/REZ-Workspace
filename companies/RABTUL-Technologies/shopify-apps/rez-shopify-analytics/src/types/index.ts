import { z } from 'zod';

export const EventSchema = z.object({
  id: z.string().optional(),
  shopifyShopId: z.string(),
  shopifyCustomerId: z.string().optional(),
  eventType: z.enum(['page_view', 'product_view', 'add_to_cart', 'remove_from_cart', 'checkout_start', 'purchase', 'search', 'wishlist_add', 'wishlist_remove', 'review_submit', 'share']),
  eventData: z.record(z.any()).default({}),
  productId: z.string().optional(),
  variantId: z.string().optional(),
  collectionId: z.string().optional(),
  searchQuery: z.string().optional(),
  revenue: z.number().optional(),
  currency: z.string().default('INR'),
  sessionId: z.string().optional(),
  userAgent: z.string().optional(),
  referrer: z.string().optional(),
  timestamp: z.string().optional()
});
export type Event = z.infer<typeof EventSchema>;

export const ReportSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  type: z.enum(['sales', 'traffic', 'products', 'customers', 'marketing', 'inventory', 'custom']),
  metrics: z.array(z.string()),
  dimensions: z.array(z.string()).default([]),
  filters: z.record(z.any()).default({}),
  dateRange: z.object({
    start: z.string(),
    end: z.string()
  }),
  schedule: z.enum(['realtime', 'hourly', 'daily', 'weekly', 'monthly']).optional(),
  lastGenerated: z.string().optional(),
  createdAt: z.string().optional()
});
export type Report = z.infer<typeof ReportSchema>;

export const DashboardWidgetSchema = z.object({
  id: z.string().optional(),
  dashboardId: z.string(),
  type: z.enum(['kpi', 'chart', 'table', 'funnel', 'heatmap', 'map']),
  title: z.string(),
  position: z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() }),
  config: z.record(z.any()).default({}),
  dataSource: z.object({
    reportId: z.string().optional(),
    metric: z.string(),
    aggregation: z.enum(['sum', 'avg', 'count', 'min', 'max']).default('sum')
  })
});
export type DashboardWidget = z.infer<typeof DashboardWidgetSchema>;

export const AnalyticsMetricsSchema = z.object({
  period: z.object({ start: z.string(), end: z.string() }),
  sessions: z.number(),
  pageviews: z.number(),
  uniqueVisitors: z.number(),
  bounceRate: z.number(),
  avgSessionDuration: z.number(),
  conversions: z.number(),
  conversionRate: z.number(),
  revenue: z.number(),
  avgOrderValue: z.number()
});
export type AnalyticsMetrics = z.infer<typeof AnalyticsMetricsSchema>;

export const FunnelStepSchema = z.object({
  name: z.string(),
  events: z.array(z.string()),
  conversions: z.number(),
  dropOffs: z.number()
});
export type FunnelStep = z.infer<typeof FunnelStepSchema>;

export const CohortDataSchema = z.object({
  cohort: z.string(),
  period: z.number(),
  retention: z.number(),
  revenue: z.number()
});
export type CohortData = z.infer<typeof CohortDataSchema>;
