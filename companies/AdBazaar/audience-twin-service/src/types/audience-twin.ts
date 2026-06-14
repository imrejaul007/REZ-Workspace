import { z } from 'zod';

// Channel preference enum
export const ChannelPreference = z.enum(['whatsapp', 'email', 'push', 'sms']);
export type ChannelPreference = z.infer<typeof ChannelPreference>;

// Audience attributes schema
export const AudienceAttributesSchema = z.object({
  interests: z.array(z.string()).max(10),
  intentLikelihood: z.number().min(0).max(1),
  channelPreference: ChannelPreference,
  timingPreference: z.string(),
  lifetimeValue: z.number().min(0),
  brandAffinities: z.record(z.string(), z.number().min(0).max(1)),
});
export type AudienceAttributes = z.infer<typeof AudienceAttributesSchema>;

// Behavioral model schema
export const BehavioralModelSchema = z.object({
  avgSessionDuration: z.number().min(0),
  avgPurchaseFrequency: z.number().min(0),
  avgOrderValue: z.number().min(0),
  preferredCategories: z.array(z.string()),
  churnRisk: z.number().min(0).max(1),
});
export type BehavioralModel = z.infer<typeof BehavioralModelSchema>;

// Audience twin schema
export const AudienceTwinSchema = z.object({
  twinId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  category: z.string(),
  size: z.number().int().min(0),
  memberUserIds: z.array(z.string()),
  attributes: AudienceAttributesSchema,
  behavioralModel: BehavioralModelSchema,
  qualityScore: z.number().min(0).max(10),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type AudienceTwin = z.infer<typeof AudienceTwinSchema>;

// Create audience twin request
export const CreateAudienceTwinRequestSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  category: z.string(),
  criteria: z.object({
    interests: z.array(z.string()).optional(),
    ageRange: z.object({
      min: z.number().min(0),
      max: z.number().max(120),
    }).optional(),
    location: z.string().optional(),
    purchaseHistory: z.object({
      minOrders: z.number().min(0).optional(),
      maxOrders: z.number().min(0).optional(),
      minValue: z.number().min(0).optional(),
      maxValue: z.number().min(0).optional(),
    }).optional(),
    engagementLevel: z.enum(['high', 'medium', 'low']).optional(),
    brandAffinities: z.record(z.string(), z.number().min(0).max(1)).optional(),
  }),
});
export type CreateAudienceTwinRequest = z.infer<typeof CreateAudienceTwinRequestSchema>;

// Predict behavior request
export const PredictBehaviorRequestSchema = z.object({
  action: z.enum(['purchase', 'click', 'convert', 'churn', 'engage']),
  context: z.object({
    campaignId: z.string().optional(),
    productId: z.string().optional(),
    offerType: z.string().optional(),
  }).optional(),
});
export type PredictBehaviorRequest = z.infer<typeof PredictBehaviorRequestSchema>;

// Segment assignment
export interface SegmentAssignment {
  segmentId: string;
  segmentName: string;
  confidence: number;
  assignedAt: Date;
}

// Prediction result
export interface PredictionResult {
  action: string;
  probability: number;
  confidence: number;
  factors: Array<{
    factor: string;
    impact: number;
  }>;
  recommendedChannel: ChannelPreference;
  recommendedTiming: string;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// HOJAI twin integration types
export interface HojaiTwinUser {
  userId: string;
  profile: {
    demographics: {
      age: number;
      gender: string;
      location: string;
    };
    interests: string[];
    behaviors: {
      sessions: number;
      purchases: number;
      avgOrderValue: number;
    };
  };
  preferences: {
    channels: ChannelPreference[];
    bestTimes: string[];
  };
  riskFactors: {
    churnRisk: number;
    engagementScore: number;
  };
}

// Cache keys
export const CACHE_KEYS = {
  AUDIENCE_TWIN: (id: string) => `audience:twin:${id}`,
  AUDIENCE_SEGMENTS: (id: string) => `audience:segments:${id}`,
  PREDICTION: (twinId: string, action: string) => `audience:prediction:${twinId}:${action}`,
} as const;