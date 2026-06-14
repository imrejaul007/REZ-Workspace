import { z } from 'zod';

// Brand Campaign Types
export enum CampaignStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export enum CampaignObjective {
  BRAND_AWARENESS = 'brand_awareness',
  CONSIDERATION = 'consideration',
  CONVERSION = 'conversion',
}

export enum BidStrategy {
  MANUAL = 'manual',
  AUTO = 'auto',
  TARGET_CPA = 'target_cpa',
  TARGET_ROAS = 'target_roas',
}

// Brand Creative Types
export enum CreativeType {
  BANNER = 'banner',
  VIDEO = 'video',
  CAROUSEL = 'carousel',
  COLLECTION = 'collection',
}

export enum CreativeStatus {
  DRAFT = 'draft',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PENDING = 'pending',
}

// Brand Analytics Types
export interface BrandMetrics {
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  engagement: number;
  engagementRate: number;
  videoViews: number;
  videoCompletionRate: number;
  brandLift: number;
  awarenessScore: number;
  considerationScore: number;
}

export interface DailyMetrics {
  date: string;
  impressions: number;
  reach: number;
  clicks: number;
  spend: number;
  conversions: number;
  revenue: number;
}

// Targeting Types
export interface CategoryTargeting {
  categoryId: string;
  categoryName: string;
  bidModifier: number;
}

export interface CategoryTargetingSchema {
  categoryId: string;
  categoryName: string;
  bidModifier: number;
}

// Brand Campaign Schema
export const BrandCampaignSchema = z.object({
  name: z.string().min(1).max(255),
  brandId: z.string().min(1),
  brandName: z.string().min(1),
  objective: z.nativeEnum(CampaignObjective),
  status: z.nativeEnum(CampaignStatus).default(CampaignStatus.DRAFT),
  budget: z.object({
    daily: z.number().min(0),
    total: z.number().min(0),
    spent: z.number().min(0).default(0),
  }),
  bidStrategy: z.nativeEnum(BidStrategy).default(BidStrategy.AUTO),
  targeting: z.object({
    categories: z.array(CategoryTargetingSchema).optional(),
    demographics: z.object({
      ageRanges: z.array(z.string()).optional(),
      genders: z.array(z.string()).optional(),
      interests: z.array(z.string()).optional(),
    }).optional(),
    devices: z.array(z.enum(['desktop', 'mobile', 'tablet'])).optional(),
    locations: z.array(z.string()).optional(),
  }).optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  creatives: z.array(z.string()).optional(),
  tracking: z.object({
    pixelId: z.string().optional(),
    utmParams: z.record(z.string()).optional(),
  }).optional(),
  settings: z.object({
    frequencyCap: z.number().optional(),
    bidCeiling: z.number().optional(),
    bidFloor: z.number().optional(),
  }).optional(),
});

export type BrandCampaignInput = z.infer<typeof BrandCampaignSchema>;

// Brand Creative Schema
export const BrandCreativeSchema = z.object({
  name: z.string().min(1).max(255),
  brandId: z.string().min(1),
  campaignId: z.string().optional(),
  type: z.nativeEnum(CreativeType),
  status: z.nativeEnum(CreativeStatus).default(CreativeStatus.DRAFT),
  assets: z.object({
    primary: z.object({
      url: z.string().url(),
      width: z.number(),
      height: z.number(),
      alt: z.string().optional(),
    }),
    secondary: z.array(z.object({
      url: z.string().url(),
      width: z.number(),
      height: z.number(),
      alt: z.string().optional(),
    })).optional(),
    video: z.object({
      url: z.string().url(),
      duration: z.number(),
      thumbnail: z.string().url().optional(),
    }).optional(),
  }),
  copy: z.object({
    headline: z.string().min(1).max(255),
    description: z.string().max(500).optional(),
    cta: z.string().max(50).optional(),
    displayUrl: z.string().optional(),
  }),
  targetUrl: z.string().url(),
  tracking: z.object({
    clickUrl: z.string().url().optional(),
    impressionUrl: z.string().url().optional(),
  }).optional(),
});

export type BrandCreativeInput = z.infer<typeof BrandCreativeSchema>;

// Update Schemas
export const UpdateCampaignSchema = BrandCampaignSchema.partial();
export type UpdateCampaignInput = z.infer<typeof UpdateCampaignSchema>;

export const UpdateCreativeSchema = BrandCreativeSchema.partial();
export type UpdateCreativeInput = z.infer<typeof UpdateCreativeSchema>;

// Query Schemas
export const CampaignQuerySchema = z.object({
  brandId: z.string().optional(),
  status: z.nativeEnum(CampaignStatus).optional(),
  objective: z.nativeEnum(CampaignObjective).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type CampaignQueryInput = z.infer<typeof CampaignQuerySchema>;

export const CreativeQuerySchema = z.object({
  brandId: z.string().optional(),
  campaignId: z.string().optional(),
  type: z.nativeEnum(CreativeType).optional(),
  status: z.nativeEnum(CreativeStatus).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type CreativeQueryInput = z.infer<typeof CreativeQuerySchema>;

// Analytics Query Schema
export const AnalyticsQuerySchema = z.object({
  campaignId: z.string().optional(),
  brandId: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  granularity: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
});

export type AnalyticsQueryInput = z.infer<typeof AnalyticsQuerySchema>;

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Brand Campaign Response
export interface BrandCampaignResponse {
  id: string;
  name: string;
  brandId: string;
  brandName: string;
  objective: CampaignObjective;
  status: CampaignStatus;
  budget: {
    daily: number;
    total: number;
    spent: number;
    remaining: number;
  };
  bidStrategy: BidStrategy;
  targeting: {
    categories?: CategoryTargeting[];
    demographics?: {
      ageRanges?: string[];
      genders?: string[];
      interests?: string[];
    };
    devices?: string[];
    locations?: string[];
  };
  startDate: string;
  endDate?: string;
  creatives: string[];
  metrics: BrandMetrics;
  createdAt: string;
  updatedAt: string;
}

// Brand Creative Response
export interface BrandCreativeResponse {
  id: string;
  name: string;
  brandId: string;
  campaignId?: string;
  type: CreativeType;
  status: CreativeStatus;
  assets: {
    primary: {
      url: string;
      width: number;
      height: number;
      alt?: string;
    };
    secondary?: Array<{
      url: string;
      width: number;
      height: number;
      alt?: string;
    }>;
    video?: {
      url: string;
      duration: number;
      thumbnail?: string;
    };
  };
  copy: {
    headline: string;
    description?: string;
    cta?: string;
    displayUrl?: string;
  };
  targetUrl: string;
  metrics: {
    impressions: number;
    clicks: number;
    ctr: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Category Targeting Schema
export const CategoryTargetingInputSchema = z.object({
  categoryId: z.string().min(1),
  categoryName: z.string().min(1),
  bidModifier: z.number().min(0.1).max(10).default(1),
});

export type CategoryTargetingInput = z.infer<typeof CategoryTargetingInputSchema>;

// Ecosystem Event Types
export interface BrandCampaignCreatedEvent {
  eventType: 'BRAND_CAMPAIGN_CREATED';
  campaignId: string;
  brandId: string;
  brandName: string;
  objective: CampaignObjective;
  budget: number;
  timestamp: string;
}

export interface BrandCampaignUpdatedEvent {
  eventType: 'BRAND_CAMPAIGN_UPDATED';
  campaignId: string;
  brandId: string;
  changes: Partial<BrandCampaignInput>;
  timestamp: string;
}

export interface BrandCampaignStatusChangedEvent {
  eventType: 'BRAND_CAMPAIGN_STATUS_CHANGED';
  campaignId: string;
  brandId: string;
  previousStatus: CampaignStatus;
  newStatus: CampaignStatus;
  timestamp: string;
}

export interface BrandCreativeCreatedEvent {
  eventType: 'BRAND_CREATIVE_CREATED';
  creativeId: string;
  brandId: string;
  campaignId?: string;
  type: CreativeType;
  timestamp: string;
}

export type BrandEvent =
  | BrandCampaignCreatedEvent
  | BrandCampaignUpdatedEvent
  | BrandCampaignStatusChangedEvent
  | BrandCreativeCreatedEvent;