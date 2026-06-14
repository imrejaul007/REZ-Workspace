import { z } from 'zod';

// Attribution Models Enum
export enum AttributionModel {
  FIRST_TOUCH = 'first_touch',
  LAST_TOUCH = 'last_touch',
  LINEAR = 'linear',
  TIME_DECAY = 'time_decay',
  POSITION_BASED = 'position_based'
}

// Conversion Types
export enum ConversionType {
  PURCHASE = 'purchase',
  BOOKING = 'booking',
  SIGNUP = 'signup',
  DOWNLOAD = 'download',
  ENGAGEMENT = 'engagement'
}

// Attribution Touchpoint
export interface AttributionTouchpoint {
  signalId: string;
  source: string;
  eventType: string;
  category: string;
  position: number;
  lagDays: number;
  attributionCredit: number;
  attributionValue: number;
}

// Conversion Document
export interface Conversion {
  conversionId: string;
  userId: string;
  conversionType: ConversionType;
  conversionValue: number;
  currency: string;
  category: string;
  orderId?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
  attributedSignals: AttributionTouchpoint[];
  model: AttributionModel;
  createdAt: Date;
  updatedAt: Date;
}

// Attribution Record for tracking touchpoints
export interface AttributionRecord {
  recordId: string;
  signalId: string;
  userId: string;
  source: string;
  eventType: string;
  category: string;
  timestamp: Date;
  windowType: 'view' | 'click';
  attributed: boolean;
  attributedTo?: string;
}

// Attribution Report
export interface AttributionReport {
  period: { start: Date; end: Date };
  model: AttributionModel;
  summary: {
    totalConversions: number;
    totalAttributedValue: number;
    avgAttributionLag: string;
  };
  bySource: Array<{
    source: string;
    conversions: number;
    attributedValue: number;
    percentage: number;
  }>;
  bySegment: Array<{
    segmentId: string;
    conversions: number;
    attributedValue: number;
    roi: number;
  }>;
}

// Zod Schemas for validation
export const ConversionEventSchema = z.object({
  userId: z.string().min(1),
  conversionType: z.nativeEnum(ConversionType),
  conversionValue: z.number().min(0),
  currency: z.string().length(3).default('INR'),
  category: z.string().min(1),
  orderId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  signalIds: z.array(z.string()).min(1).optional(),
  timestamp: z.string().datetime().optional()
});

export const AttributionReportQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  model: z.nativeEnum(AttributionModel).optional(),
  sources: z.string().transform(s => s.split(',')).optional(),
  segments: z.string().transform(s => s.split(',')).optional(),
  limit: z.coerce.number().min(1).max(1000).default(100),
  offset: z.coerce.number().min(0).default(0)
});

export const AttributionModelSchema = z.object({
  model: z.nativeEnum(AttributionModel),
  config: z.object({
    firstTouchWeight: z.number().min(0).max(1).optional(),
    lastTouchWeight: z.number().min(0).max(1).optional(),
    middleWeight: z.number().min(0).max(1).optional(),
    decayHalfLife: z.number().min(1).optional()
  }).optional()
});

export const UserJourneyQuerySchema = z.object({
  userId: z.string().min(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0)
});

// Express Request with user
export interface AuthenticatedRequest {
  user?: {
    userId: string;
    role: string;
  };
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

// Metrics Types
export interface AttributionMetrics {
  totalConversions: number;
  totalAttributionValue: number;
  conversionsBySource: Record<string, number>;
  conversionsByType: Record<string, number>;
  avgAttributionLag: number;
  lastUpdated: Date;
}

// Config Types
export interface AttributionConfig {
  defaultModel: AttributionModel;
  viewThroughWindowDays: number;
  clickThroughWindowDays: number;
}

// User Attribution Journey
export interface UserAttributionJourney {
  userId: string;
  conversionId: string;
  conversionType: ConversionType;
  conversionValue: number;
  conversionDate: Date;
  touchpoints: Array<{
    signalId: string;
    source: string;
    eventType: string;
    category: string;
    timestamp: Date;
    attributionCredit: number;
    attributionValue: number;
  }>;
}

// Segment Attribution
export interface SegmentAttribution {
  segmentId: string;
  segmentName: string;
  conversions: number;
  attributedValue: number;
  roi: number;
  topSources: Array<{
    source: string;
    attributedValue: number;
    percentage: number;
  }>;
}

// Express augmentation
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
      };
    }
  }
}

export type {
  ConversionEventInput,
  AttributionReportQuery,
  AttributionModelInput,
  UserJourneyQuery
} from './schemas';

// Re-export types for convenience
export type ConversionEventInput = z.infer<typeof ConversionEventSchema>;
export type AttributionReportQuery = z.infer<typeof AttributionReportQuerySchema>;
export type AttributionModelInput = z.infer<typeof AttributionModelSchema>;
export type UserJourneyQuery = z.infer<typeof UserJourneyQuerySchema>;