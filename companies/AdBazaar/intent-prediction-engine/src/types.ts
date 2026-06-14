import { z } from 'zod';

// Category enum
export const IntentCategory = z.enum(['DINING', 'TRAVEL', 'RETAIL', 'HEALTHCARE', 'GENERAL']);
export type IntentCategory = z.infer<typeof IntentCategory>;

// Segment status enum
export const SegmentStatus = z.enum(['active', 'paused', 'archived']);
export type SegmentStatus = z.infer<typeof SegmentStatus>;

// Segment criteria schema
export const SegmentCriteriaSchema = z.object({
  minConfidence: z.number().min(0).max(1),
  maxDaysDormant: z.number().optional(),
  sources: z.array(z.string()).optional(),
  geoFilters: z.array(z.string()).optional(),
});
export type SegmentCriteria = z.infer<typeof SegmentCriteriaSchema>;

// Intent segment schema
export const IntentSegmentSchema = z.object({
  segmentId: z.string(),
  name: z.string(),
  description: z.string(),
  category: IntentCategory,
  criteria: SegmentCriteriaSchema,
  userCount: z.number().int().min(0),
  avgConfidence: z.number().min(0).max(1),
  qualityScore: z.number().min(0).max(10),
  status: SegmentStatus,
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type IntentSegment = z.infer<typeof IntentSegmentSchema>;

// Dormant intent schema
export const DormantIntentSchema = z.object({
  dormantIntentId: z.string(),
  userId: z.string(),
  category: z.string(),
  intentKey: z.string(),
  lastSignalTimestamp: z.date(),
  daysDormant: z.number().int().min(0),
  revivalScore: z.number().min(0).max(1),
  idealTiming: z.date().optional(),
});
export type DormantIntent = z.infer<typeof DormantIntentSchema>;

// Intent signal for scoring
export const IntentSignalSchema = z.object({
  userId: z.string(),
  category: IntentCategory,
  intentKey: z.string(),
  signals: z.object({
    searchQueries: z.array(z.string()).optional(),
    pageViews: z.number().optional(),
    dwellTime: z.number().optional(),
    clicks: z.number().optional(),
    conversions: z.number().optional(),
    engagementScore: z.number().min(0).max(1).optional(),
  }),
  timestamp: z.date(),
});
export type IntentSignal = z.infer<typeof IntentSignalSchema>;

// Intent score result
export const IntentScoreResultSchema = z.object({
  userId: z.string(),
  category: z.string(),
  intentKey: z.string(),
  confidenceScore: z.number().min(0).max(1),
  conversionLikelihood: z.number().min(0).max(1),
  stage: z.enum(['awareness', 'consideration', 'intent', 'purchase', 'loyalty']),
  factors: z.object({
    recency: z.number(),
    frequency: z.number(),
    engagement: z.number(),
    historical: z.number(),
  }),
  timestamp: z.date(),
});
export type IntentScoreResult = z.infer<typeof IntentScoreResultSchema>;

// Audience segment request
export const AudienceSegmentRequestSchema = z.object({
  category: IntentCategory.optional(),
  minConfidence: z.number().min(0).max(1).optional(),
  maxDaysDormant: z.number().optional(),
  geoFilters: z.array(z.string()).optional(),
  limit: z.number().int().min(1).max(10000).default(1000),
});
export type AudienceSegmentRequest = z.infer<typeof AudienceSegmentRequestSchema>;

// Lookalike request
export const LookalikeRequestSchema = z.object({
  sourceSegmentId: z.string(),
  targetSize: z.number().int().min(1).max(100000).default(1000),
  similarityThreshold: z.number().min(0).max(1).default(0.7),
});
export type LookalikeRequest = z.infer<typeof LookalikeRequestSchema>;

// Lookalike result
export const LookalikeResultSchema = z.object({
  lookalikeSegmentId: z.string(),
  sourceSegmentId: z.string(),
  targetSize: z.number(),
  matchedUsers: z.array(z.object({
    userId: z.string(),
    similarityScore: z.number().min(0).max(1),
  })),
  characteristics: z.object({
    avgAge: z.number().optional(),
    topCategories: z.array(z.string()),
    commonIntents: z.array(z.string()),
  }),
  timestamp: z.date(),
});
export type LookalikeResult = z.infer<typeof LookalikeResultSchema>;

// API request/response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  timestamp: string;
}

// Auth types
export interface JwtPayload {
  userId: string;
  email: string;
  role: 'admin' | 'service' | 'user';
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest {
  user?: JwtPayload;
  serviceKey?: string;
}

// Health check response
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  services: {
    database: boolean;
    redis: boolean;
  };
  version: string;
}
