import { z } from 'zod';

// Enums
export enum BudgetStrategy {
  EVENLY_DISTRIBUTED = 'evenly_distributed',
  PERFORMANCE_BASED = 'performance_based',
  ROAS_OPTIMIZED = 'roas_optimized',
  REACH_MAXIMIZER = 'reach_maximizer',
  CONVERSION_FOCUSED = 'conversion_focused'
}

export enum PacingMode {
  STANDARD = 'standard',
  ACCELERATED = 'accelerated',
  DYNAMIC = 'dynamic'
}

export enum AllocationStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// Zod Schemas
export const BudgetAllocationSchema = z.object({
  id: z.string().uuid(),
  campaignId: z.string(),
  adGroupId: z.string().optional(),
  strategy: z.nativeEnum(BudgetStrategy),
  pacingMode: z.nativeEnum(PacingMode).default(PacingMode.STANDARD),
  totalBudget: z.number().min(0),
  dailyBudget: z.number().min(0).optional(),
  spentAmount: z.number().min(0).default(0),
  allocatedAmount: z.number().min(0).default(0),
  remainingAmount: z.number().min(0).default(0),
  status: z.nativeEnum(AllocationStatus).default(AllocationStatus.ACTIVE),
  startDate: z.date(),
  endDate: z.date().optional(),
  performance: z.object({
    impressions: z.number().int().min(0).default(0),
    clicks: z.number().int().min(0).default(0),
    conversions: z.number().int().min(0).default(0),
    revenue: z.number().min(0).default(0),
    ctr: z.number().min(0).max(1).default(0),
    cvr: z.number().min(0).max(1).default(0),
    roas: z.number().min(0).default(0),
    cpa: z.number().min(0).default(0),
    cpm: z.number().min(0).default(0)
  }).default({}),
  weights: z.record(z.number()).default({}),
  lastOptimizedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const PacingStatusSchema = z.object({
  id: z.string().uuid(),
  allocationId: z.string(),
  targetPace: z.number().min(0),
  actualPace: z.number().min(0),
  expectedSpendByEndOfDay: z.number().min(0),
  actualSpendByEndOfDay: z.number().min(0),
  paceRatio: z.number().default(1),
  isOnTrack: z.boolean().default(true),
  recommendedBudgetChange: z.number().default(0),
  updatedAt: z.date()
});

export const ForecastSchema = z.object({
  id: z.string().uuid(),
  allocationId: z.string(),
  targetDate: z.date(),
  predictedSpend: z.number().min(0),
  predictedImpressions: z.number().int().min(0),
  predictedClicks: z.number().int().min(0),
  predictedConversions: z.number().int().min(0),
  predictedRevenue: z.number().min(0),
  confidence: z.number().min(0).max(1),
  model: z.string().default('linear_regression'),
  createdAt: z.date()
});

// Types
export type BudgetAllocation = z.infer<typeof BudgetAllocationSchema>;
export type PacingStatus = z.infer<typeof PacingStatusSchema>;
export type Forecast = z.infer<typeof ForecastSchema>;

export interface BudgetRecommendation {
  campaignId: string;
  currentBudget: number;
  recommendedBudget: number;
  changePercentage: number;
  reason: string;
  expectedImpact: {
    impressions: number;
    conversions: number;
    roas: number;
  };
  confidence: number;
}

export interface PerformanceData {
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  cost: number;
}

// API Types
export interface CreateAllocationInput {
  campaignId: string;
  adGroupId?: string;
  strategy: BudgetStrategy;
  pacingMode?: PacingMode;
  totalBudget: number;
  dailyBudget?: number;
  startDate: string;
  endDate?: string;
  weights?: Record<string, number>;
}

export interface UpdateAllocationInput {
  totalBudget?: number;
  dailyBudget?: number;
  strategy?: BudgetStrategy;
  pacingMode?: PacingMode;
  status?: AllocationStatus;
  weights?: Record<string, number>;
}

export interface RecordSpendingInput {
  allocationId: string;
  amount: number;
  impressions?: number;
  clicks?: number;
  conversions?: number;
  revenue?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
