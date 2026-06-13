/**
 * AI Concierge Agent - Schema Validation
 * Zod schemas for API request/response validation
 */

import { z } from 'zod';

// Guest Twin Schemas
export const GuestProfileSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  phone: z.string().min(1).max(50),
  nationality: z.string().max(100).optional(),
  language_preference: z.string().max(20).default('en'),
  accessibility_needs: z.array(z.string()).default([]),
});

export const GuestLoyaltySchema = z.object({
  tier: z.enum(['bronze', 'silver', 'gold', 'platinum']),
  points_balance: z.number().int().min(0).default(0),
  member_since: z.string().datetime(),
  total_stays: z.number().int().min(0).default(0),
  total_spend: z.number().min(0).default(0),
});

export const RoomPreferencesSchema = z.object({
  floor_preference: z.string().optional(),
  view_preference: z.string().optional(),
  bed_configuration: z.string().optional(),
  temperature_setting: z.object({
    default: z.number().min(60).max(85),
    range: z.object({ min: z.number(), max: z.number() }),
  }).optional(),
  lighting_preference: z.string().optional(),
  noise_tolerance: z.number().min(1).max(10).optional(),
});

export const DiningPreferencesSchema = z.object({
  dietary_restrictions: z.array(z.string()).default([]),
  allergies: z.array(z.string()).default([]),
  favorite_items: z.array(z.string()).default([]),
  beverage_preferences: z.array(z.string()).default([]),
  typical_spend_range: z.object({
    min: z.number().min(0),
    max: z.number().min(0),
  }).optional(),
});

export const AmenityPreferencesSchema = z.object({
  spa_interests: z.array(z.string()).default([]),
  fitness_habits: z.boolean().default(false),
  pool_usage: z.boolean().default(false),
  business_amenities: z.array(z.string()).default([]),
});

export const CommunicationPreferencesSchema = z.object({
  preferred_channel: z.enum(['email', 'sms', 'app_push', 'whatsapp']),
  opt_ins: z.array(z.string()).default([]),
  quiet_hours: z.object({
    start: z.string().regex(/^\d{2}:\d{2}$/),
    end: z.string().regex(/^\d{2}:\d{2}$/),
  }).optional(),
});

export const GuestPreferencesSchema = z.object({
  room: RoomPreferencesSchema,
  dining: DiningPreferencesSchema,
  amenities: AmenityPreferencesSchema,
  communication: CommunicationPreferencesSchema,
});

export const StayPatternsSchema = z.object({
  typical_check_in_time: z.string().regex(/^\d{2}:\d{2}$/).default('15:00'),
  typical_check_out_time: z.string().regex(/^\d{2}:\d{2}$/).default('11:00'),
  weekend_vs_weekday: z.enum(['weekend', 'weekday', 'mixed']).default('mixed'),
  seasonal_patterns: z.array(z.string()).default([]),
  booking_lead_time: z.number().int().min(0).default(7),
});

export const GuestSentimentSchema = z.object({
  current_score: z.number().min(0).max(100),
  trend: z.enum(['improving', 'stable', 'declining']),
  last_feedback_date: z.string().datetime(),
  key_topics: z.array(z.string()).default([]),
});

export const LifetimeValueSchema = z.object({
  clv: z.number().min(0),
  potential_clv: z.number().min(0),
  churn_risk: z.enum(['low', 'medium', 'high']),
  recommendation_eligibility: z.boolean(),
});

export const CurrentStaySchema = z.object({
  room_id: z.string().min(1),
  check_in: z.string().datetime(),
  check_out: z.string().datetime(),
  adults: z.number().int().min(1).default(1),
  children: z.number().int().min(0).default(0),
  rate_code: z.string().default('STANDARD'),
  special_requests: z.array(z.string()).default([]),
  occasion: z.string().optional(),
});

// Main Guest Twin Schema
export const CreateGuestTwinSchema = z.object({
  guest_id: z.string().min(1),
  profile: GuestProfileSchema,
  loyalty: GuestLoyaltySchema.optional(),
  preferences: GuestPreferencesSchema.optional(),
  stay_patterns: StayPatternsSchema.optional(),
  sentiment: GuestSentimentSchema.optional(),
  lifetime_value: LifetimeValueSchema.optional(),
  current_stay: CurrentStaySchema.optional(),
});

export const UpdateGuestPreferencesSchema = z.object({
  room: RoomPreferencesSchema.partial().optional(),
  dining: DiningPreferencesSchema.partial().optional(),
  amenities: AmenityPreferencesSchema.partial().optional(),
  communication: CommunicationPreferencesSchema.partial().optional(),
});

// Room Twin Schemas
export const RoomCapacitySchema = z.object({
  max_adults: z.number().int().min(1).max(10),
  max_children: z.number().int().min(0).max(6),
  max_occupancy: z.number().int().min(1).max(12),
});

export const BedConfigurationSchema = z.object({
  bed_count: z.number().int().min(1).max(5),
  bed_type: z.enum(['king', 'queen', 'twin', 'bunk']),
  rollaway_available: z.boolean(),
});

export const RoomAmenitiesSchema = z.object({
  smart_tv: z.boolean().default(false),
  smart_speaker: z.boolean().default(false),
  minibar: z.boolean().default(false),
  coffee_machine: z.boolean().default(false),
  safe: z.boolean().default(true),
  balcony: z.boolean().default(false),
  jacuzzi: z.boolean().default(false),
});

export const RoomStatusSchema = z.enum(['available', 'occupied', 'blocked', 'out_of_order', 'cleaning', 'inspected']);

export const IoTStateSchema = z.object({
  thermostat: z.object({
    current: z.number(),
    target: z.number(),
    mode: z.string(),
  }),
  lighting: z.object({
    scene: z.string(),
    brightness: z.number().min(0).max(100),
  }),
  blinds: z.enum(['open', 'closed', 'partial']),
  door_lock: z.enum(['locked', 'unlocked']),
  minibar_door: z.enum(['closed', 'open']),
  occupancy_sensor: z.boolean(),
});

export const HousekeepingStatusSchema = z.object({
  last_cleaned: z.string().datetime(),
  next_scheduled: z.string().datetime(),
  frequency: z.enum(['daily', 'weekly', 'on_departure']),
  supply_status: z.enum(['adequate', 'low', 'critical']),
});

export const RoomRevenueSchema = z.object({
  base_rate: z.number().min(0),
  rack_rate: z.number().min(0),
  minibar_balance: z.number().min(0).default(0),
  last_rate_update: z.string().datetime(),
});

export const CreateRoomTwinSchema = z.object({
  room_id: z.string().min(1),
  property_id: z.string().min(1),
  room_number: z.string().min(1),
  room_type: z.enum(['standard', 'deluxe', 'suite', 'penthouse', 'accessible']),
  floor: z.number().int().min(1).max(200),
  view: z.enum(['city', 'pool', 'garden', 'ocean', 'mountain']),
  capacity: RoomCapacitySchema,
  bed_configuration: BedConfigurationSchema,
  amenities: RoomAmenitiesSchema.optional(),
  status: z.object({
    current: RoomStatusSchema,
    next_available: z.string().datetime().optional(),
    maintenance_alerts: z.array(z.string()).default([]),
  }).optional(),
  iot_state: IoTStateSchema.optional(),
  housekeeping: HousekeepingStatusSchema.optional(),
  revenue: RoomRevenueSchema.optional(),
});

export const UpdateRoomStatusSchema = z.object({
  current: RoomStatusSchema,
  next_available: z.string().datetime().optional(),
  maintenance_alerts: z.array(z.string()).optional(),
});

export const UpdateIoTStateSchema = z.object({
  thermostat: z.object({
    current: z.number().optional(),
    target: z.number().optional(),
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
});

// Property Twin Schemas
export const VenueLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const VenueHoursSchema = z.record(
  z.string(),
  z.object({
    open: z.string().regex(/^\d{2}:\d{2}$/),
    close: z.string().regex(/^\d{2}:\d{2}$/),
  }).nullable()
);

export const VenueSchema = z.object({
  venue_id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['restaurant', 'bar', 'spa', 'gym', 'pool', 'meeting_room']),
  capacity: z.number().int().min(1),
  hours: VenueHoursSchema,
  pos_revenue_center_id: z.string().optional(),
});

export const StaffSummarySchema = z.object({
  total_count: z.number().int().min(0),
  by_department: z.record(z.string(), z.number().int()),
  on_duty_now: z.number().int().min(0),
});

export const PropertyServicesSchema = z.object({
  check_in_24h: z.boolean(),
  concierge_available: z.boolean(),
  room_service_hours: z.object({
    start: z.string().regex(/^\d{2}:\d{2}$/),
    end: z.string().regex(/^\d{2}:\d{2}$/),
  }),
  housekeeping_schedule: z.object({
    start: z.string().regex(/^\d{2}:\d{2}$/),
    end: z.string().regex(/^\d{2}:\d{2}$/),
  }),
});

export const PropertyRevenueSchema = z.object({
  today_revenue: z.number().min(0),
  mtd_revenue: z.number().min(0),
  ytd_revenue: z.number().min(0),
  revpar: z.number().min(0),
  adr: z.number().min(0),
  occupancy_rate: z.number().min(0).max(100),
});

export const PropertySettingsSchema = z.object({
  brand_standards_version: z.string(),
  upsell_config: z.record(z.unknown()).default({}),
  pricing_rules: z.record(z.unknown()).default({}),
});

export const CreatePropertyTwinSchema = z.object({
  property_id: z.string().min(1),
  brand: z.string().min(1),
  name: z.string().min(1),
  location: z.object({
    address: z.string().min(1),
    city: z.string().min(1),
    country: z.string().min(1),
    coordinates: VenueLocationSchema,
    timezone: z.string().min(1),
  }),
  inventory: z.object({
    total_rooms: z.number().int().min(0),
    by_type: z.record(z.string(), z.number().int()).default({}),
    available_today: z.number().int().min(0),
    available_tomorrow: z.number().int().min(0),
  }),
  venues: z.array(VenueSchema).optional(),
  staff: StaffSummarySchema.optional(),
  services: PropertyServicesSchema.optional(),
  revenue: PropertyRevenueSchema.optional(),
  settings: PropertySettingsSchema.optional(),
});

// Service Request Schema
export const CreateServiceRequestSchema = z.object({
  guest_id: z.string().min(1),
  room_id: z.string().min(1),
  type: z.enum(['room_service', 'concierge', 'housekeeping', 'maintenance', 'dining', 'spa', 'transport']),
  description: z.string().min(1).max(1000),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
});

// Conversation Schema
export const CreateConversationMessageSchema = z.object({
  guest_id: z.string().min(1),
  content: z.string().min(1).max(5000),
  language: z.string().max(20).default('en'),
  channel: z.enum(['app', 'voice', 'sms', 'whatsapp', 'web']).default('app'),
});

// Query Schema for Twin Retrieval
export const TwinQuerySchema = z.object({
  include_history: z.boolean().optional(),
  as_of_date: z.string().datetime().optional(),
});

// Type exports
export type CreateGuestTwinInput = z.infer<typeof CreateGuestTwinSchema>;
export type UpdateGuestPreferencesInput = z.infer<typeof UpdateGuestPreferencesSchema>;
export type CreateRoomTwinInput = z.infer<typeof CreateRoomTwinSchema>;
export type UpdateRoomStatusInput = z.infer<typeof UpdateRoomStatusSchema>;
export type UpdateIoTStateInput = z.infer<typeof UpdateIoTStateSchema>;
export type CreatePropertyTwinInput = z.infer<typeof CreatePropertyTwinSchema>;
export type CreateServiceRequestInput = z.infer<typeof CreateServiceRequestSchema>;
export type CreateConversationMessageInput = z.infer<typeof CreateConversationMessageSchema>;