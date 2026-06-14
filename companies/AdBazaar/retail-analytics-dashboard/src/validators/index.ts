import { z } from 'zod';

export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const filterParamsSchema = z.object({
  retailerId: z.string().optional(),
  campaignId: z.string().optional(),
  category: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().int().positive().max(1000).optional(),
});

export const salesLiftQuerySchema = filterParamsSchema.extend({
  period: z.enum(['daily', 'weekly', 'monthly']).optional(),
});

export const performanceQuerySchema = filterParamsSchema.extend({
  metricType: z.enum(['impression', 'conversion', 'engagement', 'roi', 'reach']).optional(),
  source: z.enum(['dooh', 'digital', 'physical', 'mixed']).optional(),
  granularity: z.enum(['hourly', 'daily', 'weekly', 'monthly']).optional(),
});

export const trendQuerySchema = z.object({
  retailerId: z.string().optional(),
  category: z.string().optional(),
  metricName: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const forecastQuerySchema = z.object({
  metricName: z.string(),
  retailerId: z.string().optional(),
  horizon: z.coerce.number().int().min(7).max(30).optional(),
});

export const seasonalityQuerySchema = z.object({
  metricName: z.string(),
  retailerId: z.string().optional(),
});

export const exportQuerySchema = z.object({
  type: z.enum(['sales_lift', 'performance', 'trends', 'attribution', 'full']),
  format: z.enum(['csv', 'json', 'xlsx', 'pdf']),
  retailerId: z.string().optional(),
  campaignId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const dashboardConfigSchema = z.object({
  retailerId: z.string(),
  retailerName: z.string(),
  widgets: z.array(
    z.object({
      id: z.string(),
      type: z.enum(['kpi', 'chart', 'table', 'metric', 'map']),
      title: z.string(),
      dataSource: z.string(),
      config: z.record(z.unknown()),
      position: z.object({
        x: z.number(),
        y: z.number(),
        w: z.number(),
        h: z.number(),
      }),
    })
  ),
  layout: z.object({
    columns: z.number().default(12),
    rowHeight: z.number().default(80),
  }),
  refreshInterval: z.number().default(60),
  filters: z.object({
    dateRange: z.object({
      start: z.date(),
      end: z.date(),
    }),
    campaigns: z.array(z.string()).optional(),
    regions: z.array(z.string()).optional(),
    categories: z.array(z.string()).optional(),
  }),
});

export const salesLiftMetricSchema = z.object({
  date: z.date(),
  campaignId: z.string(),
  campaignName: z.string(),
  retailerId: z.string(),
  retailerName: z.string(),
  category: z.string(),
  baseline: z.number(),
  actual: z.number(),
  lift: z.number(),
  liftPercentage: z.number(),
  confidence: z.number().min(0).max(100),
  sampleSize: z.number(),
  controlGroup: z.number(),
  treatmentGroup: z.number(),
  pValue: z.number(),
  statisticalSignificance: z.boolean(),
  channels: z.array(z.string()).optional(),
  regions: z.array(z.string()).optional(),
});

export const performanceMetricSchema = z.object({
  date: z.date(),
  metricType: z.enum(['impression', 'conversion', 'engagement', 'roi', 'reach']),
  retailerId: z.string(),
  retailerName: z.string(),
  campaignId: z.string().optional(),
  metrics: z.object({
    value: z.number(),
    previousValue: z.number().optional(),
    change: z.number().optional(),
    changePercentage: z.number().optional(),
  }),
  dimensions: z
    .array(
      z.object({
        name: z.string(),
        value: z.string(),
      })
    )
    .optional(),
  source: z.enum(['dooh', 'digital', 'physical', 'mixed']),
  granularity: z.enum(['hourly', 'daily', 'weekly', 'monthly']),
});

export const trendAnalysisSchema = z.object({
  metricName: z.string(),
  retailerId: z.string(),
  retailerName: z.string(),
  category: z.string(),
  trend: z.enum(['upward', 'downward', 'stable', 'volatile']),
  trendStrength: z.number().min(0).max(100),
  seasonality: z.enum(['none', 'daily', 'weekly', 'monthly', 'yearly']),
  seasonalityPattern: z.object({
    dayOfWeek: z.record(z.string(), z.number()).optional(),
    hourOfDay: z.record(z.string(), z.number()).optional(),
    monthOfYear: z.record(z.string(), z.number()).optional(),
  }),
  forecast: z.object({
    next7Days: z.array(
      z.object({
        date: z.date(),
        value: z.number(),
        predicted: z.boolean().optional(),
      })
    ),
    next30Days: z.array(
      z.object({
        date: z.date(),
        value: z.number(),
        predicted: z.boolean().optional(),
      })
    ),
    confidence: z.number(),
  }),
  dataPoints: z.array(
    z.object({
      date: z.date(),
      value: z.number(),
      predicted: z.boolean().optional(),
    })
  ),
  analysisWindow: z.object({
    start: z.date(),
    end: z.date(),
  }),
  correlationMetrics: z.array(z.string()).optional(),
  anomalies: z
    .array(
      z.object({
        date: z.date(),
        value: z.number(),
        reason: z.string(),
      })
    )
    .optional(),
});

export type DateRangeInput = z.infer<typeof dateRangeSchema>;
export type FilterParamsInput = z.infer<typeof filterParamsSchema>;
export type SalesLiftQueryInput = z.infer<typeof salesLiftQuerySchema>;
export type PerformanceQueryInput = z.infer<typeof performanceQuerySchema>;
export type TrendQueryInput = z.infer<typeof trendQuerySchema>;
export type ForecastQueryInput = z.infer<typeof forecastQuerySchema>;
export type SeasonalityQueryInput = z.infer<typeof seasonalityQuerySchema>;
export type ExportQueryInput = z.infer<typeof exportQuerySchema>;
export type DashboardConfigInput = z.infer<typeof dashboardConfigSchema>;
export type SalesLiftMetricInput = z.infer<typeof salesLiftMetricSchema>;
export type PerformanceMetricInput = z.infer<typeof performanceMetricSchema>;
export type TrendAnalysisInput = z.infer<typeof trendAnalysisSchema>;