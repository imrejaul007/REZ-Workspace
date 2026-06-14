import { z } from 'zod';

// Location schema
export const LocationSchema = z.object({
  city: z.string().min(1),
  state: z.string().min(1),
  country: z.string().min(1),
});

// Price range schema
export const PriceRangeSchema = z.object({
  min: z.number().min(0),
  max: z.number().min(0),
}).refine(data => data.max >= data.min, {
  message: 'Max price must be greater than or equal to min price',
});

// Demographics schema
export const DemographicsSchema = z.object({
  age: z.number().min(13).max(120).optional(),
  gender: z.string().optional(),
  location: LocationSchema,
});

// Preferences schema
export const PreferencesSchema = z.object({
  language: z.string().default('en'),
  notifications: z.array(z.string()).default([]),
  priceRange: PriceRangeSchema,
});

// Interest schema
export const InterestSchema = z.object({
  category: z.string().min(1),
  score: z.number().min(0).max(1),
});

// Purchase history item schema
export const PurchaseHistoryItemSchema = z.object({
  category: z.string().min(1),
  count: z.number().int().min(0),
  total: z.number().min(0),
});

// Browsing patterns schema
export const BrowsingPatternsSchema = z.object({
  patterns: z.array(z.string()),
  frequency: z.number().min(0).max(1),
});

// Profile schema
export const ProfileSchema = z.object({
  demographics: DemographicsSchema,
  preferences: PreferencesSchema,
});

// Behavioral schema
export const BehavioralSchema = z.object({
  interests: z.array(InterestSchema),
  purchaseHistory: z.array(PurchaseHistoryItemSchema),
  browsingPatterns: BrowsingPatternsSchema,
  engagementScore: z.number().min(0).max(1),
  lastActive: z.date(),
});

// Predictive schema
export const PredictiveSchema = z.object({
  churnRisk: z.number().min(0).max(1),
  lifetimeValue: z.number().min(0),
  nextPurchaseLikely: z.date(),
  preferredChannels: z.array(z.string()),
  optimalContactTime: z.string(),
});

// Advertising schema
export const AdvertisingSchema = z.object({
  adResponsiveness: z.number().min(0).max(1),
  clickThroughHistory: z.number().min(0).max(1),
  conversionRate: z.number().min(0).max(1),
  preferredAdFormats: z.array(z.string()),
  brandAffinities: z.record(z.string(), z.number().min(0).max(1)),
});

// User twin status
export type UserTwinStatus = 'active' | 'inactive' | 'archived';

// User Twin interface
export interface IUserTwin {
  userId: string;
  twinId: string;
  profile: {
    demographics: {
      age?: number;
      gender?: string;
      location: { city: string; state: string; country: string };
    };
    preferences: {
      language: string;
      notifications: string[];
      priceRange: { min: number; max: number };
    };
  };
  behavioral: {
    interests: { category: string; score: number }[];
    purchaseHistory: { category: string; count: number; total: number }[];
    browsingPatterns: { patterns: string[]; frequency: number };
    engagementScore: number;
    lastActive: Date;
  };
  predictive: {
    churnRisk: number;
    lifetimeValue: number;
    nextPurchaseLikely: Date;
    preferredChannels: string[];
    optimalContactTime: string;
  };
  advertising: {
    adResponsiveness: number;
    clickThroughHistory: number;
    conversionRate: number;
    preferredAdFormats: string[];
    brandAffinities: Record<string, number>;
  };
  status: UserTwinStatus;
  createdAt: Date;
  updatedAt: Date;
}

// API Request/Response types
export interface CreateTwinRequest {
  userId: string;
  profile: IUserTwin['profile'];
}

export interface UpdateTwinRequest {
  profile?: Partial<IUserTwin['profile']>;
  behavioral?: Partial<IUserTwin['behavioral']>;
  advertising?: Partial<IUserTwin['advertising']>;
}

export interface PredictRequest {
  scenario?: string;
  context?: Record<string, unknown>;
}

export interface PredictionResponse {
  twinId: string;
  predictions: {
    purchaseProbability: number;
    recommendedActions: string[];
    optimalTime: string;
    suggestedChannels: string[];
    confidence: number;
  };
  timestamp: Date;
}

export interface AffinityResponse {
  twinId: string;
  brandAffinities: Record<string, number>;
  topCategories: { category: string; affinity: number }[];
  lastUpdated: Date;
}

export interface RefreshResponse {
  twinId: string;
  refreshTimestamp: Date;
  updatedFields: string[];
  status: 'success' | 'partial' | 'failed';
}

// Error response type
export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  timestamp: Date;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth types
export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Express.Request {
  user?: JwtPayload;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Health check response
export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: Date;
  uptime: number;
  services: {
    mongodb: 'connected' | 'disconnected';
    redis: 'connected' | 'disconnected';
  };
}