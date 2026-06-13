import { z } from 'zod';

// ============================================================================
// VENUE TWIN SCHEMAS
// ============================================================================

export const CreateVenueTwinSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  venue_type: z.enum(['stadium', 'arena', 'theater', 'club', 'festival_grounds', 'cinema', 'amusement_park', 'museum', 'restaurant', 'retail']),
  attributes: z.object({
    location: z.object({
      address: z.string().min(1),
      city: z.string().min(1),
      state: z.string().optional(),
      country: z.string().min(1),
      postal_code: z.string().optional(),
      coordinates: z.object({
        latitude: z.number(),
        longitude: z.number(),
      }),
      timezone: z.string().optional(),
    }),
    capacity: z.object({
      max_occupancy: z.number().min(0),
      current_capacity: z.number().min(0).optional(),
      vip_capacity: z.number().min(0).optional(),
      standing_room: z.number().min(0).optional(),
    }).optional(),
    amenities: z.array(z.string()).optional(),
    technology: z.object({
      dooh_screens: z.number().min(0).optional(),
      qr_code_readers: z.number().min(0).optional(),
      wifi_enabled: z.boolean().optional(),
      beacon_density: z.string().optional(),
      camera_count: z.number().min(0).optional(),
    }).optional(),
    operating_hours: z.object({
      schedule: z.array(z.object({
        day_of_week: z.number().min(0).max(6),
        open_time: z.string(),
        close_time: z.string(),
        closed: z.boolean().optional(),
      })),
    }).optional(),
  }).optional(),
  relationships: z.object({
    audiences: z.array(z.object({
      audience_id: z.string(),
      affinity_score: z.number().optional(),
    })).optional(),
    events: z.array(z.object({
      event_id: z.string(),
      event_name: z.string().optional(),
    })).optional(),
    creators: z.array(z.object({
      creator_id: z.string(),
      collaboration_type: z.string().optional(),
    })).optional(),
    brands: z.array(z.object({
      brand_id: z.string(),
      sponsorship_level: z.string().optional(),
    })).optional(),
  }).optional(),
});

export const UpdateVenueTwinSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  attributes: z.object({
    location: z.object({
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      postal_code: z.string().optional(),
      coordinates: z.object({
        latitude: z.number(),
        longitude: z.number(),
      }).optional(),
      timezone: z.string().optional(),
    }).optional(),
    capacity: z.object({
      max_occupancy: z.number().min(0).optional(),
      current_capacity: z.number().min(0).optional(),
      vip_capacity: z.number().min(0).optional(),
      standing_room: z.number().min(0).optional(),
    }).optional(),
    amenities: z.array(z.string()).optional(),
    technology: z.object({
      dooh_screens: z.number().min(0).optional(),
      qr_code_readers: z.number().min(0).optional(),
      wifi_enabled: z.boolean().optional(),
      beacon_density: z.string().optional(),
      camera_count: z.number().min(0).optional(),
    }).optional(),
  }).optional(),
});

export const UpdateOperationalMetricsSchema = z.object({
  occupancy_rate: z.number().min(0).max(100).optional(),
  avg_dwell_time: z.number().min(0).optional(),
  peak_hours: z.array(z.string()).optional(),
  revenue_per_sqft: z.number().optional(),
  event_frequency: z.number().min(0).optional(),
  customer_satisfaction: z.number().min(0).max(100).optional(),
});

export const UpdateDOOHConfigSchema = z.object({
  screen_count: z.number().min(0).optional(),
  screen_locations: z.array(z.object({
    screen_id: z.string(),
    location: z.string(),
    size: z.string(),
    orientation: z.string(),
    daily_impressions: z.number(),
  })).optional(),
  avg_dwell_time: z.number().min(0).optional(),
  viewability: z.number().min(0).max(100).optional(),
});

export const UpdateAudienceProfileSchema = z.object({
  primary_segments: z.array(z.string()).optional(),
  avg_age: z.number().optional(),
  gender_split: z.object({
    male: z.number().optional(),
    female: z.number().optional(),
    other: z.number().optional(),
  }).optional(),
  income_bracket: z.string().optional(),
});

export type CreateVenueTwinRequest = z.infer<typeof CreateVenueTwinSchema>;
export type UpdateVenueTwinRequest = z.infer<typeof UpdateVenueTwinSchema>;
export type UpdateOperationalMetricsRequest = z.infer<typeof UpdateOperationalMetricsSchema>;
export type UpdateDOOHConfigRequest = z.infer<typeof UpdateDOOHConfigSchema>;
export type UpdateAudienceProfileRequest = z.infer<typeof UpdateAudienceProfileSchema>;
