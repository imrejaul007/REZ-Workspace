import { z } from 'zod';

// Event types enum
export const eventTypes = ['impression', 'view', 'click', 'engagement'] as const;
export type EventType = typeof eventTypes[number];

// Metadata location schema
const locationSchema = z.object({
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  country: z.string().optional()
}).optional();

// Metadata screen size schema
const screenSizeSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive()
}).optional();

// Metadata demographic data schema
const demographicDataSchema = z.object({
  ageRange: z.string().optional(),
  gender: z.string().optional(),
  estimatedAge: z.number().optional()
}).optional();

// Metadata context data schema
const contextDataSchema = z.object({
  venueType: z.string().optional(),
  dayOfWeek: z.string().optional(),
  timeOfDay: z.string().optional(),
  weather: z.string().optional()
}).optional();

// Metadata schema
export const metadataSchema = z.object({
  duration: z.number().optional(),
  viewTime: z.number().optional(),
  interactionType: z.string().optional(),
  deviceType: z.enum(['mobile', 'desktop', 'tablet', 'digital-signage']).optional(),
  location: locationSchema,
  screenSize: screenSizeSchema,
  visibilityPercentage: z.number().min(0).max(100).optional(),
  audioPlaying: z.boolean().optional(),
  engagementScore: z.number().min(0).max(100).optional(),
  demographicData: demographicDataSchema,
  contextData: contextDataSchema,
  customData: z.record(z.unknown()).optional()
}).optional();

// Single event input schema
export const eventInputSchema = z.object({
  eventType: z.enum(eventTypes, {
    errorMap: () => ({ message: 'eventType must be one of: impression, view, click, engagement' })
  }),
  screenId: z.string().min(1, 'screenId is required'),
  advertiserId: z.string().min(1, 'advertiserId is required'),
  campaignId: z.string().min(1, 'campaignId is required'),
  creativeId: z.string().min(1, 'creativeId is required'),
  timestamp: z.string().datetime().optional(),
  metadata: metadataSchema
});

// Batch events input schema
export const batchEventsInputSchema = z.object({
  events: z.array(eventInputSchema).min(1, 'At least one event is required').max(1000, 'Maximum 1000 events per batch')
});

// Date range query schema
export const dateRangeQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

// Pagination query schema
export const paginationQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional().transform((val) => val ? parseInt(val, 10) : 1),
  limit: z.string().regex(/^\d+$/).optional().transform((val) => val ? parseInt(val, 10) : 50)
});

// Events list query schema
export const eventsListQuerySchema = z.object({
  screenId: z.string().optional(),
  advertiserId: z.string().optional(),
  campaignId: z.string().optional(),
  eventType: z.enum(eventTypes).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.string().regex(/^\d+$/).optional().transform((val) => val ? parseInt(val, 10) : 1),
  limit: z.string().regex(/^\d+$/).optional().transform((val) => val ? parseInt(val, 10) : 50)
});

// Cleanup query schema
export const cleanupQuerySchema = z.object({
  olderThanDays: z.string().regex(/^\d+$/, 'Must be a number').optional().transform((val) => val ? parseInt(val, 10) : 90)
});

// Validation helper functions
export const validateEventInput = (data: unknown) => {
  return eventInputSchema.safeParse(data);
};

export const validateBatchEventsInput = (data: unknown) => {
  return batchEventsInputSchema.safeParse(data);
};

export const validateDateRangeQuery = (data: unknown) => {
  return dateRangeQuerySchema.safeParse(data);
};

export const validateEventsListQuery = (data: unknown) => {
  return eventsListQuerySchema.safeParse(data);
};

export const validateCleanupQuery = (data: unknown) => {
  return cleanupQuerySchema.safeParse(data);
};