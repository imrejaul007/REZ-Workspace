import { z } from 'zod';

// Event Types
export const EventTypeEnum = z.enum([
  'wedding',
  'festival',
  'conference',
  'sports',
  'religious',
  'community',
  'corporate',
  'entertainment',
  'political',
  'other'
]);
export type EventType = z.infer<typeof EventTypeEnum>;

// Event Status
export const EventStatusEnum = z.enum([
  'planned',
  'announced',
  'active',
  'completed',
  'cancelled'
]);
export type EventStatus = z.infer<typeof EventStatusEnum>;

// Location Schema
export const LocationSchema = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([z.number(), z.number()]), // [longitude, latitude]
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pincode: z.string().optional()
});
export type Location = z.infer<typeof LocationSchema>;

// Create Event Request
export const CreateEventSchema = z.object({
  name: z.string().min(1).max(200),
  type: EventTypeEnum,
  description: z.string().max(2000).optional(),
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  endDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  time: z.string().optional(),
  expectedFootfall: z.number().int().positive().optional(),
  actualFootfall: z.number().int().positive().optional(),
  location: LocationSchema,
  venue: z.string().optional(),
  organizer: z.object({
    name: z.string(),
    type: z.enum(['individual', 'organization', 'government']),
    contact: z.string().optional()
  }),
  tags: z.array(z.string()).optional(),
  budget: z.object({
    min: z.number().positive().optional(),
    max: z.number().positive().optional(),
    currency: z.string().default('INR')
  }).optional(),
  source: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  isPublic: z.boolean().default(true),
  metadata: z.record(z.unknown()).optional()
});
export type CreateEventRequest = z.infer<typeof CreateEventSchema>;

// Update Event Request
export const UpdateEventSchema = CreateEventSchema.partial().extend({
  status: EventStatusEnum.optional()
});
export type UpdateEventRequest = z.infer<typeof UpdateEventSchema>;

// Nearby Events Query
export const NearbyEventsQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().positive().default(5000), // meters
  type: EventTypeEnum.optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: EventStatusEnum.optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0)
});
export type NearbyEventsQuery = z.infer<typeof NearbyEventsQuerySchema>;

// Event Graph Query
export const EventGraphQuerySchema = z.object({
  type: EventTypeEnum,
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  city: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50)
});
export type EventGraphQuery = z.infer<typeof EventGraphQuerySchema>;

// Impact Analysis Response
export interface ImpactAnalysis {
  eventId: string;
  eventName: string;
  eventType: EventType;
  date: string;
  expectedFootfall: number;
  location: Location;
  impactMetrics: {
    nearbyMerchants: number;
    affectedCategories: string[];
    peakHours: string[];
    duration: number; // hours
    estimatedRevenueImpact: number;
    adOpportunityScore: number; // 0-100
  };
  affectedAreas: {
    name: string;
    radius: number;
    merchantCount: number;
    averageDistance: number;
  }[];
  recommendations: {
    category: string;
    action: string;
    priority: 'high' | 'medium' | 'low';
    estimatedReach: number;
    suggestedBudget: number;
  }[];
}

// Campaign Suggestion
export interface CampaignSuggestion {
  eventId: string;
  eventName: string;
  nearbyMerchants: {
    merchantId: string;
    name: string;
    category: string;
    distance: number;
    relevanceScore: number;
  }[];
  campaignTiming: {
    optimalStart: string;
    optimalEnd: string;
    peakHours: string[];
    recommendedDuration: number;
  };
  budgetRecommendations: {
    category: string;
    minBudget: number;
    maxBudget: number;
    expectedROI: number;
    adFormat: string;
  }[];
  targetingOptions: {
    radius: number;
    demographics: string[];
    interests: string[];
  };
  totalRecommendedBudget: number;
}

// Event Document (MongoDB)
export interface EventDocument {
  _id: string;
  name: string;
  type: EventType;
  description?: string;
  date: Date;
  endDate?: Date;
  time?: string;
  expectedFootfall?: number;
  actualFootfall?: number;
  location: Location;
  venue?: string;
  organizer: {
    name: string;
    type: 'individual' | 'organization' | 'government';
    contact?: string;
  };
  status: EventStatus;
  tags: string[];
  budget?: {
    min?: number;
    max?: number;
    currency: string;
  };
  source?: string;
  sourceUrl?: string;
  isPublic: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

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
    total?: number;
    limit?: number;
    offset?: number;
  };
}

// Event with computed fields
export interface EventWithMetrics extends Omit<EventDocument, '_id'> {
  id: string;
  daysUntilEvent: number;
  impactScore: number;
  nearbyMerchantCount: number;
}

// Health Check Response
export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'error';
  service: string;
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: 'ok' | 'error';
    memory: 'ok' | 'error';
  };
}

// Event Statistics
export interface EventStatistics {
  totalEvents: number;
  eventsByType: Record<EventType, number>;
  eventsByStatus: Record<EventStatus, number>;
  totalExpectedFootfall: number;
  averageFootfall: number;
  upcomingEvents: number;
  activeEvents: number;
}

// Graph Statistics
export interface GraphStatistics {
  type: EventType;
  totalEvents: number;
  totalFootfall: number;
  averageFootfall: number;
  geographicDistribution: {
    city: string;
    count: number;
  }[];
  topVenues: {
    venue: string;
    count: number;
  }[];
  peakMonths: {
    month: string;
    count: number;
  }[];
}
