import { z } from 'zod';

// CTV Campaign Types
export interface CTVCreative {
  creativeId: string;
  name: string;
  videoUrl: string;
  vastXml?: string;
  duration: number;
  clickUrl: string;
  mimeType?: string;
  bitrate?: number;
  width?: number;
  height?: number;
  companionAds?: {
    id: string;
    type: 'static' | 'html';
    content: string;
    clickUrl: string;
    altText?: string;
  }[];
}

export interface CTVBudget {
  daily: number;
  total: number;
  spent: number;
}

export interface CTVBid {
  type: 'cpm' | 'cpv' | 'cpa';
  amount: number;
  maxBid: number;
}

export interface CTVTargeting {
  geo?: string[];
  deviceTypes?: string[];  // smarttv, settop, gaming, streaming
  apps?: string[];
  contentCategories?: string[];
  dayparting?: {
    days: string[];
    startHour: number;
    endHour: number;
  };
  ageRating?: string[];
}

export interface CTVPacing {
  type: 'even' | 'asap' | 'frontloaded';
  dailyPacingPercent?: number;
}

export interface CTVFrequency {
  maxImpressions: number;
  windowHours: number;
}

export interface CTVMetrics {
  impressions: number;
  views: number;
  completions: number;
  clicks: number;
  skips: number;
  revenue: number;
  ctr?: number;
  vtr?: number;
  cpm?: number;
}

export type CampaignStatus = 'active' | 'paused' | 'completed' | 'draft';
export type AdFormat = 'preroll' | 'midroll' | 'postroll' | 'pod';

export interface CTVCampaign {
  campaignId: string;
  advertiserId: string;
  name: string;
  status: CampaignStatus;
  format: AdFormat;
  budget: CTVBudget;
  bid: CTVBid;
  targeting: CTVTargeting;
  creatives: CTVCreative[];
  pacing: CTVPacing;
  frequency: CTVFrequency;
  metrics: CTVMetrics;
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Zod Schemas for validation
export const CTVCreativeSchema = z.object({
  creativeId: z.string(),
  name: z.string().min(1),
  videoUrl: z.string().url(),
  vastXml: z.string().optional(),
  duration: z.number().positive(),
  clickUrl: z.string().url(),
  mimeType: z.string().optional(),
  bitrate: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  companionAds: z.array(z.object({
    id: z.string(),
    type: z.enum(['static', 'html']),
    content: z.string(),
    clickUrl: z.string(),
    altText: z.string().optional(),
  })).optional(),
});

export const CTVCampaignSchema = z.object({
  advertiserId: z.string(),
  name: z.string().min(1).max(255),
  status: z.enum(['active', 'paused', 'completed', 'draft']),
  format: z.enum(['preroll', 'midroll', 'postroll', 'pod']),
  budget: z.object({
    daily: z.number().min(0),
    total: z.number().min(0),
    spent: z.number().min(0).default(0),
  }),
  bid: z.object({
    type: z.enum(['cpm', 'cpv', 'cpa']),
    amount: z.number().positive(),
    maxBid: z.number().positive(),
  }),
  targeting: z.object({
    geo: z.array(z.string()).optional(),
    deviceTypes: z.array(z.string()).optional(),
    apps: z.array(z.string()).optional(),
    contentCategories: z.array(z.string()).optional(),
    dayparting: z.object({
      days: z.array(z.string()),
      startHour: z.number().min(0).max(23),
      endHour: z.number().min(0).max(23),
    }).optional(),
    ageRating: z.array(z.string()).optional(),
  }).optional(),
  creatives: z.array(CTVCreativeSchema).min(1),
  pacing: z.object({
    type: z.enum(['even', 'asap', 'frontloaded']),
    dailyPacingPercent: z.number().optional(),
  }),
  frequency: z.object({
    maxImpressions: z.number().int().positive(),
    windowHours: z.number().int().positive(),
  }),
  startDate: z.union([z.string(), z.date()]),
  endDate: z.union([z.string(), z.date()]).optional(),
});

// Decision Request Types
export interface DecisionRequest {
  placementId: string;
  deviceType: string;
  deviceId?: string;
  appId?: string;
  geo?: string;
  contentCategory?: string;
  videoDuration?: number;
  userAgent?: string;
  ip?: string;
  timestamp?: number;
  skipOffset?: number;
  podPosition?: number;
  maxAds?: number;
}

export interface DecisionResponse {
  requestId: string;
  vastXml: string;
  creatives: CTVCreative[];
  campaignId: string;
  impressions: number;
  revenue: number;
}

// VAST Types
export interface VASTEvent {
  type: 'impression' | 'view' | 'click' | 'skip' | 'complete' | 'firstQuartile' | 'midpoint' | 'thirdQuartile' | 'error';
  url: string;
  timestamp: number;
}

export interface VastTrackingEvent {
  event: string;
  url: string;
}

// Pacing Types
export interface PacingStatus {
  campaignId: string;
  currentPacing: number;
  expectedPacing: number;
  dailyBudget: number;
  dailySpent: number;
  dailyRemaining: number;
  pacingType: string;
  recommendations?: string[];
}

export interface PacingAdjustment {
  type: 'increase' | 'decrease' | 'pause' | 'resume';
  percent?: number;
  reason?: string;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}