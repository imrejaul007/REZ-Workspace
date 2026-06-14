import { z } from 'zod';

// Validation Schemas
export const CreateTestSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  campaignId: z.string(),
  variants: z.array(z.object({
    name: z.string().min(1).max(100),
    creativeId: z.string(),
    trafficPercentage: z.number().min(5).max(95).optional(),
  })).min(2).max(10),
  primaryMetric: z.enum(['ctr', 'conversion_rate', 'engagement', 'revenue', 'roas']),
  secondaryMetrics: z.array(z.enum(['ctr', 'conversion_rate', 'engagement', 'revenue', 'roas', 'impressions', 'clicks'])).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  minSampleSize: z.number().positive().optional(),
  targetAudience: z.object({
    ageMin: z.number().min(13).optional(),
    ageMax: z.number().max(120).optional(),
    genders: z.array(z.enum(['male', 'female', 'other'])).optional(),
    countries: z.array(z.string()).optional(),
  }).optional(),
});

export const RecordImpressionSchema = z.object({
  testId: z.string().uuid(),
  variantId: z.string().uuid(),
  sessionId: z.string().uuid(),
  userId: z.string().optional(),
  timestamp: z.string().datetime().optional(),
});

export const RecordClickSchema = z.object({
  testId: z.string().uuid(),
  variantId: z.string().uuid(),
  sessionId: z.string().uuid(),
  userId: z.string().optional(),
  timestamp: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const RecordConversionSchema = z.object({
  testId: z.string().uuid(),
  variantId: z.string().uuid(),
  sessionId: z.string().uuid(),
  userId: z.string().optional(),
  value: z.number().min(0).optional(),
  timestamp: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Type Definitions
export type TestStatus = 'draft' | 'running' | 'paused' | 'completed' | 'archived';
export type TestWinner = 'none' | 'tie' | string; // variantId of winner or 'none' or 'tie'
export type PrimaryMetric = 'ctr' | 'conversion_rate' | 'engagement' | 'revenue' | 'roas';
export type VariantStatus = 'active' | 'paused' | 'archived';

export interface ABTest {
  id: string;
  name: string;
  description?: string;
  campaignId: string;
  status: TestStatus;
  variants: Variant[];
  primaryMetric: PrimaryMetric;
  secondaryMetrics: PrimaryMetric[];
  startDate?: Date;
  endDate?: Date;
  winner?: TestWinner;
  winnerConfidence?: number;
  createdAt: Date;
  updatedAt: Date;
  targetAudience?: TargetAudience;
}

export interface Variant {
  id: string;
  name: string;
  creativeId: string;
  trafficPercentage: number;
  status: VariantStatus;
  metrics: VariantMetrics;
  startDate?: Date;
  archivedAt?: Date;
}

export interface VariantMetrics {
  impressions: number;
  uniqueImpressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  ctr: number; // Click-through rate
  conversionRate: number;
  engagement: number;
  roas: number; // Return on ad spend
  cost: number;
}

export interface TestSession {
  testId: string;
  variantId: string;
  sessionId: string;
  userId?: string;
  assignedAt: Date;
  sawImpression: boolean;
  clicked: boolean;
  converted: boolean;
}

export interface StatisticalSignificance {
  isSignificant: boolean;
  confidenceLevel: number;
  pValue: number;
  zScore: number;
  effectSize: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  sampleSize: {
    control: number;
    treatment: number;
    required: number;
  };
}

export interface WinnerSelection {
  variantId: string;
  variantName: string;
  confidence: number;
  improvement: number;
  isSignificant: boolean;
  metrics: {
    metric: PrimaryMetric;
    control: number;
    treatment: number;
    lift: number;
  }[];
}

export interface TestResults {
  testId: string;
  status: TestStatus;
  isComplete: boolean;
  winner?: WinnerSelection;
  variants: VariantResults[];
  statisticalSignificance: Record<string, StatisticalSignificance>;
  recommendations: string[];
}

export interface VariantResults {
  variantId: string;
  variantName: string;
  trafficPercentage: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  ctr: number;
  conversionRate: number;
  roas: number;
  statisticalSignificance: StatisticalSignificance;
}

export interface TargetAudience {
  ageMin?: number;
  ageMax?: number;
  genders?: ('male' | 'female' | 'other')[];
  countries?: string[];
}

export interface TrafficSplitResult {
  testId: string;
  variantId: string;
  sessionId: string;
  assignedAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

// Type exports for Zod inference
export type CreateTestRequest = z.infer<typeof CreateTestSchema>;
export type RecordImpressionRequest = z.infer<typeof RecordImpressionSchema>;
export type RecordClickRequest = z.infer<typeof RecordClickSchema>;
export type RecordConversionRequest = z.infer<typeof RecordConversionSchema>;
