import { z } from 'zod';

// Enums
export enum RotationMode {
  EPSILON_GREEDY = 'epsilon_greedy',
  THOMPSON_SAMPLING = 'thompson_sampling',
  PERFORMANCE_BASED = 'performance_based',
  AB_TEST = 'ab_test',
  SEQUENTIAL = 'sequential'
}

export enum CreativeStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  ARCHIVED = 'archived',
  WINNER = 'winner'
}

export enum MetricType {
  CTR = 'ctr',
  CVR = 'cvr',
  ENGAGEMENT = 'engagement',
  REVENUE = 'revenue'
}

// Zod Schemas
export const CreativeSchema = z.object({
  id: z.string().uuid(),
  adSetId: z.string(),
  name: z.string().min(1).max(200),
  creativeUrl: z.string().url().optional(),
  creativeHash: z.string().optional(),
  status: z.nativeEnum(CreativeStatus).default(CreativeStatus.ACTIVE),
  weight: z.number().min(0).default(1),
  metrics: z.object({
    impressions: z.number().int().min(0).default(0),
    clicks: z.number().int().min(0).default(0),
    conversions: z.number().int().min(0).default(0),
    revenue: z.number().min(0).default(0),
    cost: z.number().min(0).default(0)
  }).default({}),
  performance: z.object({
    ctr: z.number().min(0).max(1).default(0),
    cvr: z.number().min(0).max(1).default(0),
    roas: z.number().min(0).default(0),
    confidence: z.number().min(0).max(1).default(0)
  }).default({}),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const RotationConfigSchema = z.object({
  id: z.string().uuid(),
  adSetId: z.string(),
  name: z.string().min(1).max(100),
  mode: z.nativeEnum(RotationMode),
  epsilon: z.number().min(0).max(1).default(0.1),
  minImpressionsPerCreative: z.number().int().min(100).default(1000),
  explorationRatio: z.number().min(0).max(1).default(0.2),
  abTestDistribution: z.record(z.number()).default({}),
  rotationStartDate: z.date(),
  rotationEndDate: z.date().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const RotationDecisionSchema = z.object({
  id: z.string().uuid(),
  adSetId: z.string(),
  userId: z.string(),
  selectedCreativeId: z.string(),
  rotationMode: z.nativeEnum(RotationMode),
  confidence: z.number().min(0).max(1),
  alternativeCreatives: z.array(z.object({
    creativeId: z.string(),
    probability: z.number().min(0).max(1)
  })).default([]),
  timestamp: z.date()
});

// Types
export type Creative = z.infer<typeof CreativeSchema>;
export type RotationConfig = z.infer<typeof RotationConfigSchema>;
export type RotationDecision = z.infer<typeof RotationDecisionSchema>;

export interface EpsilonGreedyResult {
  selectedCreativeId: string;
  isExploration: boolean;
  epsilon: number;
  creativeProbabilities: Record<string, number>;
}

export interface ThompsonSamplingResult {
  selectedCreativeId: string;
  sampledValues: Record<string, number>;
  creativeProbabilities: Record<string, number>;
}

export interface PerformanceBasedResult {
  selectedCreativeId: string;
  creativeWeights: Record<string, number>;
  reason: string;
}

// API Types
export interface CreateCreativeInput {
  adSetId: string;
  name: string;
  creativeUrl?: string;
  creativeHash?: string;
  weight?: number;
}

export interface UpdateCreativeInput {
  name?: string;
  creativeUrl?: string;
  creativeHash?: string;
  status?: CreativeStatus;
  weight?: number;
}

export interface RecordImpressionInput {
  creativeId: string;
  userId?: string;
  sessionId?: string;
}

export interface RecordClickInput {
  creativeId: string;
  userId?: string;
  sessionId?: string;
}

export interface RecordConversionInput {
  creativeId: string;
  userId?: string;
  revenue?: number;
  conversionValue?: number;
}

export interface CreateRotationConfigInput {
  adSetId: string;
  name: string;
  mode: RotationMode;
  epsilon?: number;
  minImpressionsPerCreative?: number;
  explorationRatio?: number;
  abTestDistribution?: Record<string, number>;
  rotationEndDate?: string;
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
