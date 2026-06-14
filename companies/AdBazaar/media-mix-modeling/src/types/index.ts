import { z } from 'zod';

// Channel types
export const ChannelTypeSchema = z.enum([
  'TV',
  'DIGITAL',
  'SOCIAL',
  'SEARCH',
  'DISPLAY',
  'VIDEO',
  'OOH',
  'PRINT',
  'AUDIO',
  'INFLUENCER',
  'AFFILIATE',
  'EMAIL',
  'SMS',
  'OTHER'
]);

export type ChannelType = z.infer<typeof ChannelTypeSchema>;

// Attribution models
export const AttributionModelSchema = z.enum([
  'FIRST_TOUCH',
  'LAST_TOUCH',
  'LINEAR',
  'TIME_DECAY',
  'POSITION_BASED',
  'DATA_DRIVEN'
]);

export type AttributionModel = z.infer<typeof AttributionModelSchema>;

// Model status
export const ModelStatusSchema = z.enum([
  'DRAFT',
  'TRAINING',
  'TRAINED',
  'FAILED',
  'ARCHIVED'
]);

export type ModelStatus = z.infer<typeof ModelStatusSchema>;

// Channel data schema
export const ChannelDataSchema = z.object({
  channelId: z.string(),
  name: z.string(),
  type: ChannelTypeSchema,
  spend: z.number().min(0),
  reach: z.number().min(0).optional(),
  frequency: z.number().min(0).optional(),
  impressions: z.number().min(0).optional(),
  clicks: z.number().min(0).optional(),
  conversions: z.number().min(0).optional(),
  revenue: z.number().min(0).optional(),
  conversionsPerSpend: z.number().optional(),
  revenuePerSpend: z.number().optional()
});

export type ChannelData = z.infer<typeof ChannelDataSchema>;

// Create MMM model request
export const CreateMMMModelSchema = z.object({
  name: z.string().min(1).max(100),
  advertiserId: z.string().min(1),
  channels: z.array(ChannelDataSchema),
  dateRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime()
  }),
  targetMetric: z.enum(['conversions', 'revenue', 'leads', 'engagement']).default('conversions'),
  attributionModel: AttributionModelSchema.default('DATA_DRIVEN'),
  controlVariables: z.array(z.object({
    name: z.string(),
    value: z.number()
  })).optional()
});

export type CreateMMMModelRequest = z.infer<typeof CreateMMMModelSchema>;

// Update MMM model request
export const UpdateMMMModelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  channels: z.array(ChannelDataSchema).optional(),
  dateRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime()
  }).optional(),
  targetMetric: z.enum(['conversions', 'revenue', 'leads', 'engagement']).optional(),
  attributionModel: AttributionModelSchema.optional()
});

export type UpdateMMMModelRequest = z.infer<typeof UpdateMMMModelSchema>;

// Training request
export const TrainModelRequestSchema = z.object({
  hyperparameters: z.object({
    regularization: z.number().min(0).max(1).default(0.1),
    maxIterations: z.number().min(100).max(10000).default(1000),
    convergenceThreshold: z.number().min(0.0001).max(0.1).default(0.001),
    adstockDecay: z.number().min(0).max(1).default(0.5),
    saturationLambda: z.number().min(0).max(1).default(0.5)
  }).optional()
});

export type TrainModelRequest = z.infer<typeof TrainModelRequestSchema>;

// Scenario request
export const ScenarioRequestSchema = z.object({
  name: z.string().min(1).max(100),
  totalBudget: z.number().min(0),
  allocation: z.record(z.string(), z.number().min(0).max(100)),
  constraints: z.object({
    minSpendPerChannel: z.number().min(0).optional(),
    maxSpendPerChannel: z.number().min(0).optional(),
    maintainMix: z.boolean().optional()
  }).optional()
});

export type ScenarioRequest = z.infer<typeof ScenarioRequestSchema>;

// ROI response
export interface ChannelROI {
  channelId: string;
  channelName: string;
  channelType: ChannelType;
  spend: number;
  revenue: number;
  roas: number;
  cpa: number;
  contribution: number;
  marginalRoas: number;
}

// Attribution response
export interface ChannelAttribution {
  channelId: string;
  channelName: string;
  channelType: ChannelType;
  attribution: number;
  percentage: number;
  incrementalRevenue: number;
  spend: number;
  efficiency: number;
}

// Optimization response
export interface OptimizationResult {
  optimalAllocation: Record<string, number>;
  projectedRevenue: number;
  projectedRoas: number;
  marginalReturns: Record<string, number>;
  recommendations: string[];
}

// Forecast response
export interface ForecastResult {
  period: string;
  predictions: Record<string, number>;
  confidence: {
    lower: number;
    upper: number;
    interval: number;
  };
  seasonality: Record<string, number>;
  trend: number;
}

// Model result stored in DB
export interface ModelResult {
  modelId: string;
  trainedAt: Date;
  roas: Record<string, number>;
  contribution: Record<string, number>;
  saturation: Record<string, number>;
  adstock: Record<string, number>;
  marginalRoas: Record<string, number>;
  modelMetrics: {
    rSquared: number;
    adjustedRSquared: number;
    rmse: number;
    mae: number;
    mape: number;
  };
  featureImportance: Record<string, number>;
}
