import { z } from 'zod';

// Enums
export enum CappingLevel {
  USER = 'user',
  HOUSEHOLD = 'household',
  DEVICE = 'device'
}

export enum CappingScope {
  CAMPAIGN = 'campaign',
  AD_GROUP = 'ad_group',
  CREATIVE = 'creative'
}

export enum TimeWindow {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  LIFETIME = 'lifetime'
}

export enum FatigueStatus {
  HEALTHY = 'healthy',
  WARNING = 'warning',
  FATIGUED = 'fatigued'
}

// Zod Schemas
export const FrequencyCapSchema = z.object({
  id: z.string().uuid(),
  campaignId: z.string().optional(),
  adGroupId: z.string().optional(),
  creativeId: z.string().optional(),
  scope: z.nativeEnum(CappingScope),
  level: z.nativeEnum(CappingLevel).default(CappingLevel.USER),
  timeWindow: z.nativeEnum(TimeWindow).default(TimeWindow.WEEK),
  maxFrequency: z.number().int().min(1).default(7),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const FrequencyRecordSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  deviceId: z.string().optional(),
  campaignId: z.string().optional(),
  adGroupId: z.string().optional(),
  creativeId: z.string().optional(),
  impressions: z.number().int().min(0).default(0),
  clicks: z.number().int().min(0).default(0),
  lastImpressionAt: z.date(),
  firstImpressionAt: z.date(),
  dailyImpressions: z.record(z.number()).default({})
});

export const CreativeFatigueSchema = z.object({
  id: z.string().uuid(),
  creativeId: z.string(),
  campaignId: z.string(),
  status: z.nativeEnum(FatigueStatus).default(FatigueStatus.HEALTHY),
  totalImpressions: z.number().int().min(0).default(0),
  uniqueUsers: z.number().int().min(0).default(0),
  avgFrequencyPerUser: z.number().min(0).default(0),
  ctrTrend: z.array(z.number()).default([]),
  cvrTrend: z.array(z.number()).default([]),
  engagementTrend: z.array(z.number()).default([]),
  fatigueScore: z.number().min(0).max(1).default(0),
  recommendedAction: z.enum(['none', 'reduce_budget', 'pause', 'refresh_creative']).default('none'),
  lastAnalyzedAt: z.date()
});

// Types
export type FrequencyCap = z.infer<typeof FrequencyCapSchema>;
export type FrequencyRecord = z.infer<typeof FrequencyRecordSchema>;
export type CreativeFatigue = z.infer<typeof CreativeFatigueSchema>;

export interface FrequencyCheckResult {
  allowed: boolean;
  currentFrequency: number;
  maxFrequency: number;
  timeWindow: TimeWindow;
  reason?: string;
  nextAllowedAt?: Date;
}

export interface SmartFrequencyConfig {
  enabled: boolean;
  minFrequency: number;
  maxFrequency: number;
  optimizationGoal: 'reach' | 'engagement' | 'conversion';
  frequencyDecay: number;
  engagementThreshold: number;
}

// API Types
export interface CreateFrequencyCapInput {
  campaignId?: string;
  adGroupId?: string;
  creativeId?: string;
  scope: CappingScope;
  level?: CappingLevel;
  timeWindow?: TimeWindow;
  maxFrequency: number;
}

export interface UpdateFrequencyCapInput {
  maxFrequency?: number;
  timeWindow?: TimeWindow;
  isActive?: boolean;
}

export interface RecordImpressionInput {
  userId: string;
  deviceId?: string;
  campaignId?: string;
  adGroupId?: string;
  creativeId?: string;
  timestamp?: Date;
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
