import { z } from 'zod';

// Festival creation schema
export const CreateFestivalSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  date: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()).optional(),
  venue: z.object({
    name: z.string().min(1).max(255),
    address: z.string().min(1).max(500),
    city: z.string().min(1).max(100),
    state: z.string().max(100).optional(),
    country: z.string().max(100).default('India'),
    coordinates: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    }).optional(),
  }),
  type: z.enum(['music', 'food', 'cultural', 'religious', 'sports', 'arts', 'film', 'literary', 'technology', 'mixed']),
  expectedAttendance: z.number().min(1),
  ticketPriceRange: z.object({
    min: z.number().min(0),
    max: z.number().min(0),
    currency: z.string().default('INR'),
  }).optional(),
  organizer: z.object({
    name: z.string().max(255),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().max(20).optional(),
  }).optional(),
  tags: z.array(z.string()).default([]),
  impactRadius: z.number().min(1).max(100).default(10),
  mediaAssets: z.object({
    images: z.array(z.string()).optional(),
    videos: z.array(z.string()).optional(),
    logos: z.array(z.string()).optional(),
  }).optional(),
  socialLinks: z.object({
    website: z.string().optional(),
    facebook: z.string().optional(),
    instagram: z.string().optional(),
    twitter: z.string().optional(),
    youtube: z.string().optional(),
  }).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Festival update schema
export const UpdateFestivalSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).optional(),
  date: z.string().datetime().or(z.date()).optional(),
  endDate: z.string().datetime().or(z.date()).optional(),
  status: z.enum(['planning', 'announced', 'on_sale', 'live', 'completed', 'cancelled']).optional(),
  expectedAttendance: z.number().min(1).optional(),
  actualAttendance: z.number().min(0).optional(),
  tags: z.array(z.string()).optional(),
  impactRadius: z.number().min(1).max(100).optional(),
  estimatedEconomicImpact: z.number().min(0).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Artist schema
export const AddArtistSchema = z.object({
  name: z.string().min(1).max(255),
  stage: z.string().max(100).optional(),
  genre: z.array(z.string()).default([]),
  popularity: z.number().min(0).max(100).default(50),
  bio: z.string().max(2000).optional(),
  image: z.string().max(500).optional(),
  socialLinks: z.object({
    website: z.string().optional(),
    instagram: z.string().optional(),
    twitter: z.string().optional(),
    spotify: z.string().optional(),
    youtube: z.string().optional(),
  }).optional(),
  performanceTime: z.object({
    start: z.string().datetime().or(z.date()),
    end: z.string().datetime().or(z.date()).optional(),
  }).optional(),
  fee: z.number().min(0).optional(),
  currency: z.string().default('INR'),
  verified: z.boolean().default(false),
  metadata: z.record(z.unknown()).optional(),
});

// Schedule event schema
export const ScheduleEventSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  artistId: z.string().optional(),
  artistName: z.string().max(255).optional(),
  stage: z.string().min(1).max(100),
  startTime: z.string().datetime().or(z.date()),
  endTime: z.string().datetime().or(z.date()).optional(),
  type: z.enum(['performance', 'workshop', 'panel', 'competition', 'meet_greet', 'other']).default('performance'),
  featured: z.boolean().default(false),
});

// Add schedule schema
export const AddScheduleSchema = z.object({
  day: z.number().min(1),
  date: z.string().datetime().or(z.date()),
  events: z.array(ScheduleEventSchema).default([]),
});

// Update schedule schema
export const UpdateScheduleSchema = z.object({
  events: z.array(ScheduleEventSchema),
});

// Analytics update schema
export const UpdateAnalyticsSchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly', 'overall']).optional(),
  impressions: z.object({
    total: z.number().min(0).optional(),
    byChannel: z.object({
      dooh: z.number().min(0).optional(),
      mobile: z.number().min(0).optional(),
      social: z.number().min(0).optional(),
      web: z.number().min(0).optional(),
    }).optional(),
    byLocation: z.record(z.string(), z.number()).optional(),
  }).optional(),
  ticketSales: z.object({
    sold: z.number().min(0).optional(),
    available: z.number().min(0).optional(),
    revenue: z.number().min(0).optional(),
  }).optional(),
  engagement: z.object({
    avgSessionDuration: z.number().min(0).optional(),
    bounceRate: z.number().min(0).max(100).optional(),
    pageViews: z.number().min(0).optional(),
    socialShares: z.number().min(0).optional(),
    hashtagMentions: z.number().min(0).optional(),
  }).optional(),
  roi: z.object({
    totalSpend: z.number().min(0).optional(),
    totalRevenue: z.number().min(0).optional(),
  }).optional(),
});

// Query schemas
export const ListFestivalsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  city: z.string().optional(),
  type: z.enum(['music', 'food', 'cultural', 'religious', 'sports', 'arts', 'film', 'literary', 'technology', 'mixed']).optional(),
  status: z.enum(['planning', 'announced', 'on_sale', 'live', 'completed', 'cancelled']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  tags: z.string().optional(), // comma-separated
});

export const UpcomingFestivalsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  city: z.string().optional(),
  type: z.enum(['music', 'food', 'cultural', 'religious', 'sports', 'arts', 'film', 'literary', 'technology', 'mixed']).optional(),
  withinDays: z.coerce.number().min(1).max(365).default(90),
});

export type CreateFestivalInput = z.infer<typeof CreateFestivalSchema>;
export type UpdateFestivalInput = z.infer<typeof UpdateFestivalSchema>;
export type AddArtistInput = z.infer<typeof AddArtistSchema>;
export type AddScheduleInput = z.infer<typeof AddScheduleSchema>;
export type UpdateScheduleInput = z.infer<typeof UpdateScheduleSchema>;
export type UpdateAnalyticsInput = z.infer<typeof UpdateAnalyticsSchema>;
export type ListFestivalsQuery = z.infer<typeof ListFestivalsQuerySchema>;
export type UpcomingFestivalsQuery = z.infer<typeof UpcomingFestivalsQuerySchema>;