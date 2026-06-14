import { z } from 'zod';

// Enums
export enum AttributionModel {
  FIRST_CLICK = 'first_click',
  LAST_CLICK = 'last_click',
  LINEAR = 'linear',
  TIME_DECAY = 'time_decay',
  POSITION_BASED = 'position_based',
  DATA_DRIVEN = 'data_driven'
}

export enum TouchpointChannel {
  PAID_SEARCH = 'paid_search',
  PAID_SOCIAL = 'paid_social',
  ORGANIC_SEARCH = 'organic_search',
  ORGANIC_SOCIAL = 'organic_social',
  EMAIL = 'email',
  DIRECT = 'direct',
  DISPLAY = 'display',
  VIDEO = 'video',
  REFERRAL = 'referral',
  AFFILIATE = 'affiliate'
}

export enum ConversionType {
  PURCHASE = 'purchase',
  LEAD = 'lead',
  SIGNUP = 'signup',
  SUBSCRIBE = 'subscribe',
  DOWNLOAD = 'download'
}

export enum TouchpointStatus {
  ACTIVE = 'active',
  EXCLUDED = 'excluded',
  VIEWTHROUGH = 'viewthrough'
}

// Zod Schemas
export const TouchpointSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  sessionId: z.string(),
  channel: z.nativeEnum(TouchpointChannel),
  source: z.string(),
  campaignId: z.string().optional(),
  adGroupId: z.string().optional(),
  creativeId: z.string().optional(),
  keyword: z.string().optional(),
  timestamp: z.date(),
  interactionType: z.enum(['click', 'view', 'impression']).default('click'),
  value: z.number().min(0).default(0),
  metadata: z.record(z.any()).default({})
});

export const ConversionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  conversionType: z.nativeEnum(ConversionType),
  value: z.number().min(0).default(0),
  revenue: z.number().min(0).default(0),
  timestamp: z.date(),
  touchpoints: z.array(z.string()).default([]),
  attributedChannels: z.record(z.number()).default({}),
  metadata: z.record(z.any()).default({})
});

export const AttributionConfigSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  model: z.nativeEnum(AttributionModel),
  lookbackWindowDays: z.number().int().min(1).max(90).default(30),
  positionBasedSettings: z.object({
    firstTouchWeight: z.number().min(0).max(1).default(0.4),
    lastTouchWeight: z.number().min(0).max(1).default(0.4),
    middleWeight: z.number().min(0).max(1).default(0.2)
  }).optional(),
  timeDecaySettings: z.object({
    halfLifeDays: z.number().min(1).default(7)
  }).optional(),
  dataDrivenSettings: z.object({
    minSampleSize: z.number().int().min(100).default(1000),
    algorithm: z.enum(['markov', 'shapley', 'linear_regression']).default('markov')
  }).optional(),
  excludedChannels: z.array(z.nativeEnum(TouchpointChannel)).default([]),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Types
export type Touchpoint = z.infer<typeof TouchpointSchema>;
export type Conversion = z.infer<typeof ConversionSchema>;
export type AttributionConfig = z.infer<typeof AttributionConfigSchema>;

export interface AttributionResult {
  conversionId: string;
  userId: string;
  model: AttributionModel;
  totalValue: number;
  channelAttributions: Record<string, number>;
  touchpointAttributions: Array<{
    touchpointId: string;
    channel: TouchpointChannel;
    contribution: number;
    percentage: number;
  }>;
  timestamp: Date;
}

export interface ChannelPerformance {
  channel: TouchpointChannel;
  conversions: number;
  totalValue: number;
  attributionPercentage: number;
  touchpoints: number;
  avgTouchpointsPerConversion: number;
}

export interface DataDrivenConfig {
  minSampleSize: number;
  algorithm: 'markov' | 'shapley' | 'linear_regression';
  excludeChannels?: TouchpointChannel[];
}

// API Types
export interface AttributionRequest {
  userId: string;
  conversionId: string;
  model?: AttributionModel;
  configId?: string;
}

export interface BulkAttributionRequest {
  conversionIds: string[];
  model?: AttributionModel;
  configId?: string;
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
