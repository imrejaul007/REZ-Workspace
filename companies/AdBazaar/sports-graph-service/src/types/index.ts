import { z } from 'zod';

// Sport types enum
export const SportType = z.enum([
  'cricket',
  'football',
  'hockey',
  'tennis',
  'basketball',
  'volleyball',
  'badminton',
  'kabaddi',
  'wrestling',
  'other'
]);
export type SportType = z.infer<typeof SportType>;

// Event status enum
export const EventStatus = z.enum([
  'scheduled',
  'live',
  'completed',
  'cancelled',
  'postponed'
]);
export type EventStatus = z.infer<typeof EventStatus>;

// Campaign timing enum
export const CampaignTiming = z.enum([
  'pre_event_week',
  'pre_event_2_days',
  'pre_event_day',
  'during_event',
  'post_event_day',
  'post_event_week'
]);
export type CampaignTiming = z.infer<typeof CampaignTiming>;

// Target audience enum
export const TargetAudience = z.enum([
  'sports_fans',
  'casual_viewers',
  'hospitality',
  'families',
  'young_adults',
  'corporate'
]);
export type TargetAudience = z.infer<typeof TargetAudience>;

// Venue schema
export const VenueSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  country: z.string().default('India'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  capacity: z.number().positive(),
  type: z.enum(['stadium', 'arena', 'ground', 'indoor', 'outdoor']),
  amenities: z.array(z.string()).default([])
});
export type Venue = z.infer<typeof VenueSchema>;

// Sports event schema
export const SportsEventSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  sport: SportType,
  tournament: z.string().optional(),
  season: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  status: EventStatus.default('scheduled'),
  venue: VenueSchema,
  teams: z.array(z.object({
    name: z.string(),
    logo: z.string().url().optional(),
    homeCity: z.string().optional()
  })).min(1),
  expectedFootfall: z.number().positive().optional(),
  broadcastChannels: z.array(z.string()).default([]),
  prizePool: z.number().optional(),
  metadata: z.record(z.unknown()).default({})
});
export type SportsEvent = z.infer<typeof SportsEventSchema>;

// Footfall prediction schema
export const FootfallPredictionSchema = z.object({
  eventId: z.string().uuid(),
  predictedCrowd: z.number().positive(),
  confidence: z.number().min(0).max(1),
  peakHours: z.array(z.object({
    hour: z.number().min(0).max(23),
    expectedCount: z.number().positive()
  })),
  nearbyMerchantImpact: z.object({
    restaurants: z.object({
      expectedIncrease: z.number(),
      peakHours: z.array(z.number())
    }),
    bars: z.object({
      expectedIncrease: z.number(),
      peakHours: z.array(z.number())
    }),
    hotels: z.object({
      expectedIncrease: z.number(),
      peakHours: z.array(z.number())
    }),
    retail: z.object({
      expectedIncrease: z.number(),
      peakHours: z.array(z.number())
    })
  }),
  calculatedAt: z.string().datetime()
});
export type FootfallPrediction = z.infer<typeof FootfallPredictionSchema>;

// Campaign recommendation schema
export const CampaignRecommendationSchema = z.object({
  eventId: z.string().uuid(),
  merchantCategory: z.string(),
  recommendedTiming: z.array(CampaignTiming),
  optimalBudget: z.number().positive(),
  targetAudience: z.array(TargetAudience),
  messaging: z.object({
    primary: z.string(),
    secondary: z.string().optional(),
    cta: z.string()
  }),
  channelMix: z.object({
    dooh: z.number().min(0).max(1),
    social: z.number().min(0).max(1),
    sms: z.number().min(0).max(1),
    push: z.number().min(0).max(1)
  }),
  estimatedReach: z.number().positive(),
  estimatedConversion: z.number().min(0).max(1),
  generatedAt: z.string().datetime()
});
export type CampaignRecommendation = z.infer<typeof CampaignRecommendationSchema>;

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Request types
export interface EventQueryParams {
  sport?: SportType;
  status?: EventStatus;
  city?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface EventImpactQuery {
  radiusKm?: number;
  merchantCategories?: string[];
}
