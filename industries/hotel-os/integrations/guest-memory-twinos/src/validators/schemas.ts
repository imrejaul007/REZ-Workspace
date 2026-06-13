import { z } from 'zod';

// Create Guest Twin Request Schema
export const CreateGuestTwinRequestSchema = z.object({
  guest_id: z.string().optional(),
  profile: z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email format'),
    phone: z.string().optional(),
    nationality: z.string().optional(),
    language_preference: z.string().default('en'),
    accessibility_needs: z.array(z.string()).default([]),
  }),
  loyalty: z.object({
    tier: z.enum(['bronze', 'silver', 'gold', 'platinum']).optional(),
    points_balance: z.number().int().nonnegative().optional(),
    member_since: z.string().datetime().optional(),
    total_stays: z.number().int().nonnegative().optional(),
    total_spend: z.number().nonnegative().optional(),
  }).optional(),
  preferences: z.object({
    room: z.object({
      floor_preference: z.string().optional(),
      view_preference: z.enum(['city', 'pool', 'garden', 'ocean', 'mountain']).optional(),
      bed_configuration: z.string().optional(),
      temperature_setting: z.object({
        default: z.number().min(16).max(30),
        range: z.object({
          min: z.number().min(16).max(30),
          max: z.number().min(16).max(30),
        }).optional(),
      }).optional(),
      lighting_preference: z.string().optional(),
      noise_tolerance: z.number().min(1).max(10).optional(),
    }).optional(),
    dining: z.object({
      dietary_restrictions: z.array(z.string()).default([]),
      allergies: z.array(z.string()).default([]),
      favorite_items: z.array(z.string()).default([]),
      beverage_preferences: z.array(z.string()).default([]),
      typical_spend_range: z.object({
        min: z.number().nonnegative(),
        max: z.number().nonnegative(),
      }).optional(),
    }).optional(),
    amenities: z.object({
      spa_interests: z.array(z.string()).default([]),
      fitness_habits: z.boolean().default(false),
      pool_usage: z.boolean().default(false),
      business_amenities: z.array(z.string()).default([]),
    }).optional(),
    communication: z.object({
      preferred_channel: z.enum(['email', 'sms', 'app_push', 'whatsapp']).default('email'),
      opt_ins: z.array(z.string()).default([]),
      quiet_hours: z.object({
        start: z.string().regex(/^\d{2}:\d{2}$/),
        end: z.string().regex(/^\d{2}:\d{2}$/),
      }).optional(),
    }).optional(),
  }).optional(),
  stay_patterns: z.object({
    typical_check_in_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    typical_check_out_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    weekend_vs_weekday: z.enum(['weekend', 'weekday', 'mixed']).optional(),
    seasonal_patterns: z.array(z.string()).default([]),
    booking_lead_time: z.number().int().nonnegative().optional(),
  }).optional(),
  sentiment: z.object({
    current_score: z.number().min(0).max(100).optional(),
    trend: z.enum(['improving', 'stable', 'declining']).optional(),
    last_feedback_date: z.string().datetime().optional(),
    key_topics: z.array(z.string()).default([]),
  }).optional(),
  lifetime_value: z.object({
    clv: z.number().nonnegative().optional(),
    potential_clv: z.number().nonnegative().optional(),
    churn_risk: z.enum(['low', 'medium', 'high']).optional(),
    recommendation_eligibility: z.boolean().optional(),
  }).optional(),
  current_stay: z.object({
    room_id: z.string().optional(),
    check_in: z.string().datetime().optional(),
    check_out: z.string().datetime().optional(),
    adults: z.number().int().nonnegative().optional(),
    children: z.number().int().nonnegative().optional(),
    rate_code: z.string().optional(),
    special_requests: z.array(z.string()).default([]),
    occasion: z.string().nullable().optional(),
  }).optional(),
  sync_to_twinos: z.boolean().default(true),
});

// Update Preferences Request Schema
export const UpdatePreferencesRequestSchema = z.object({
  preferences: z.object({
    room: z.object({
      floor_preference: z.string().optional(),
      view_preference: z.enum(['city', 'pool', 'garden', 'ocean', 'mountain']).optional(),
      bed_configuration: z.string().optional(),
      temperature_setting: z.object({
        default: z.number().min(16).max(30),
        range: z.object({
          min: z.number().min(16).max(30),
          max: z.number().min(16).max(30),
        }).optional(),
      }).optional(),
      lighting_preference: z.string().optional(),
      noise_tolerance: z.number().min(1).max(10).optional(),
    }).optional(),
    dining: z.object({
      dietary_restrictions: z.array(z.string()).default([]),
      allergies: z.array(z.string()).default([]),
      favorite_items: z.array(z.string()).default([]),
      beverage_preferences: z.array(z.string()).default([]),
      typical_spend_range: z.object({
        min: z.number().nonnegative(),
        max: z.number().nonnegative(),
      }).optional(),
    }).optional(),
    amenities: z.object({
      spa_interests: z.array(z.string()).default([]),
      fitness_habits: z.boolean().default(false),
      pool_usage: z.boolean().default(false),
      business_amenities: z.array(z.string()).default([]),
    }).optional(),
    communication: z.object({
      preferred_channel: z.enum(['email', 'sms', 'app_push', 'whatsapp']).default('email'),
      opt_ins: z.array(z.string()).default([]),
      quiet_hours: z.object({
        start: z.string().regex(/^\d{2}:\d{2}$/),
        end: z.string().regex(/^\d{2}:\d{2}$/),
      }).optional(),
    }).optional(),
  }),
  sync_to_twinos: z.boolean().default(true),
});

// Create Room Twin Request Schema
export const CreateRoomTwinRequestSchema = z.object({
  room_id: z.string().optional(),
  property_id: z.string().min(1, 'Property ID is required'),
  room_number: z.string().min(1, 'Room number is required'),
  room_type: z.enum(['standard', 'deluxe', 'suite', 'penthouse', 'accessible']).default('standard'),
  floor: z.number().int().positive('Floor must be a positive number'),
  view: z.enum(['city', 'pool', 'garden', 'ocean', 'mountain']).default('city'),
  capacity: z.object({
    max_adults: z.number().int().positive().optional(),
    max_children: z.number().int().nonnegative().optional(),
    max_occupancy: z.number().int().positive().optional(),
  }).optional(),
  bed_configuration: z.object({
    bed_count: z.number().int().positive().optional(),
    bed_type: z.enum(['king', 'queen', 'twin', 'bunk']).optional(),
    rollaway_available: z.boolean().optional(),
  }).optional(),
  amenities: z.object({
    smart_tv: z.boolean().optional(),
    smart_speaker: z.boolean().optional(),
    minibar: z.boolean().optional(),
    coffee_machine: z.boolean().optional(),
    safe: z.boolean().optional(),
    balcony: z.boolean().optional(),
    jacuzzi: z.boolean().optional(),
  }).optional(),
  status: z.object({
    current: z.enum(['available', 'occupied', 'blocked', 'out_of_order', 'cleaning', 'inspected']).optional(),
    next_available: z.string().datetime().optional(),
    maintenance_alerts: z.array(z.string()).optional(),
  }).optional(),
  iot_state: z.object({
    thermostat: z.object({
      current: z.number(),
      target: z.number(),
      mode: z.string().optional(),
    }).optional(),
    lighting: z.object({
      scene: z.string().optional(),
      brightness: z.number().min(0).max(100).optional(),
    }).optional(),
    blinds: z.enum(['open', 'closed', 'partial']).optional(),
    door_lock: z.enum(['locked', 'unlocked']).optional(),
    minibar_door: z.enum(['closed', 'open']).optional(),
    occupancy_sensor: z.boolean().optional(),
  }).optional(),
  housekeeping: z.object({
    last_cleaned: z.string().datetime().optional(),
    next_scheduled: z.string().datetime().optional(),
    frequency: z.enum(['daily', 'weekly', 'on_departure']).optional(),
    supply_status: z.enum(['adequate', 'low', 'critical']).optional(),
  }).optional(),
  revenue: z.object({
    base_rate: z.number().nonnegative().optional(),
    rack_rate: z.number().nonnegative().optional(),
    minibar_balance: z.number().optional(),
    last_rate_update: z.string().datetime().optional(),
  }).optional(),
  sync_to_twinos: z.boolean().default(true),
});

// Create Property Twin Request Schema
export const CreatePropertyTwinRequestSchema = z.object({
  property_id: z.string().optional(),
  brand: z.string().optional(),
  name: z.string().min(1, 'Property name is required'),
  location: z.object({
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
    timezone: z.string().optional(),
  }).optional(),
  inventory: z.object({
    total_rooms: z.number().int().positive('Total rooms must be a positive number'),
    by_type: z.record(z.number()).optional(),
    available_today: z.number().int().nonnegative().optional(),
    available_tomorrow: z.number().int().nonnegative().optional(),
  }),
  venues: z.array(z.object({
    venue_id: z.string().optional(),
    name: z.string().min(1),
    type: z.enum(['restaurant', 'bar', 'spa', 'gym', 'pool', 'meeting_room']),
    capacity: z.number().int().positive(),
    hours: z.record(z.string()).optional(),
    pos_revenue_center_id: z.string().optional(),
  })).default([]),
  staff: z.object({
    total_count: z.number().int().nonnegative().optional(),
    by_department: z.record(z.number()).optional(),
    on_duty_now: z.number().int().nonnegative().optional(),
  }).optional(),
  services: z.object({
    check_in_24h: z.boolean().optional(),
    concierge_available: z.boolean().optional(),
    room_service_hours: z.record(z.string()).optional(),
    housekeeping_schedule: z.record(z.string()).optional(),
  }).optional(),
  revenue: z.object({
    today_revenue: z.number().optional(),
    mtd_revenue: z.number().optional(),
    ytd_revenue: z.number().optional(),
    revpar: z.number().optional(),
    adr: z.number().optional(),
    occupancy_rate: z.number().min(0).max(100).optional(),
  }).optional(),
  settings: z.object({
    brand_standards_version: z.string().optional(),
    upsell_config: z.record(z.unknown()).optional(),
    pricing_rules: z.record(z.unknown()).optional(),
  }).optional(),
  sync_to_twinos: z.boolean().default(true),
});

// Type exports
export type CreateGuestTwinRequest = z.infer<typeof CreateGuestTwinRequestSchema>;
export type UpdatePreferencesRequest = z.infer<typeof UpdatePreferencesRequestSchema>;
export type CreateRoomTwinRequest = z.infer<typeof CreateRoomTwinRequestSchema>;
export type CreatePropertyTwinRequest = z.infer<typeof CreatePropertyTwinRequestSchema>;