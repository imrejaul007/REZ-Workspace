import { z } from 'zod';
import { ConversionType, AttributionModel } from './types.js';

// Conversion Event Schema
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

// Attribution Report Query Schema
export const AttributionReportQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  model: z.nativeEnum(AttributionModel).optional(),
  sources: z.string().transform(s => s.split(',')).optional(),
  segments: z.string().transform(s => s.split(',')).optional(),
  limit: z.coerce.number().min(1).max(1000).default(100),
  offset: z.coerce.number().min(0).default(0)
});

// Attribution Model Config Schema
export const AttributionModelSchema = z.object({
  model: z.nativeEnum(AttributionModel),
  config: z.object({
    firstTouchWeight: z.number().min(0).max(1).optional(),
    lastTouchWeight: z.number().min(0).max(1).optional(),
    middleWeight: z.number().min(0).max(1).optional(),
    decayHalfLife: z.number().min(1).optional()
  }).optional()
});

// User Journey Query Schema
export const UserJourneyQuerySchema = z.object({
  userId: z.string().min(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0)
});

// Segment Query Schema
export const SegmentQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  model: z.nativeEnum(AttributionModel).optional(),
  limit: z.coerce.number().min(1).max(100).default(20)
});

// Type exports
export type ConversionEventInput = z.infer<typeof ConversionEventSchema>;
export type AttributionReportQuery = z.infer<typeof AttributionReportQuerySchema>;
export type AttributionModelInput = z.infer<typeof AttributionModelSchema>;
export type UserJourneyQueryInput = z.infer<typeof UserJourneyQuerySchema>;
export type SegmentQueryInput = z.infer<typeof SegmentQuerySchema>;