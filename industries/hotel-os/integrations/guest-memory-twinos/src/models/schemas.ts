import { z } from 'zod';

// Enums
export const LoyaltyTierSchema = z.enum(['bronze', 'silver', 'gold', 'platinum']);
export const RoomTypeSchema = z.enum(['standard', 'deluxe', 'suite', 'penthouse', 'accessible']);
export const RoomStatusSchema = z.enum(['available', 'occupied', 'blocked', 'out_of_order', 'cleaning', 'inspected']);
export const ViewTypeSchema = z.enum(['city', 'pool', 'garden', 'ocean', 'mountain']);
export const BedTypeSchema = z.enum(['king', 'queen', 'twin', 'bunk']);
export const SentimentTrendSchema = z.enum(['improving', 'stable', 'declining']);
export const CommunicationChannelSchema = z.enum(['email', 'sms', 'app_push', 'whatsapp']);
export const ChurnRiskSchema = z.enum(['low', 'medium', 'high']);
export const BlindsStateSchema = z.enum(['open', 'closed', 'partial']);
export const DoorLockStateSchema = z.enum(['locked', 'unlocked']);
export const SupplyStatusSchema = z.enum(['adequate', 'low', 'critical']);
export const VenueTypeSchema = z.enum(['restaurant', 'bar', 'spa', 'gym', 'pool', 'meeting_room']);

// Guest Profile Schema
export const GuestProfileSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  nationality: z.string().optional(),
  language_preference: z.string().default('en'),
  accessibility_needs: z.array(z.string()).default([]),
});

// Loyalty Schema
export const LoyaltySchema = z.object({
  tier: LoyaltyTierSchema,
  points_balance: z.number().int().nonnegative().default(0),
  member_since: z.string().datetime().optional(),
  total_stays: z.number().int().nonnegative().default(0),
  total_spend: z.number().nonnegative().default(0),
});

// Room Preferences
export const RoomPreferencesSchema = z.object({
  floor_preference: z.string().optional(),
  view_preference: ViewTypeSchema.optional(),
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
});

// Dining Preferences
export const DiningPreferencesSchema = z.object({
  dietary_restrictions: z.array(z.string()).default([]),
  allergies: z.array(z.string()).default([]),
  favorite_items: z.array(z.string()).default([]),
  beverage_preferences: z.array(z.string()).default([]),
  typical_spend_range: z.object({
    min: z.number().nonnegative(),
    max: z.number().nonnegative(),
  }).optional(),
});

// Amenity Preferences
export const AmenityPreferencesSchema = z.object({
  spa_interests: z.array(z.string()).default([]),
  fitness_habits: z.boolean().default(false),
  pool_usage: z.boolean().default(false),
  business_amenities: z.array(z.string()).default([]),
});

// Communication Preferences
export const CommunicationPreferencesSchema = z.object({
  preferred_channel: CommunicationChannelSchema.default('email'),
  opt_ins: z.array(z.string()).default([]),
  quiet_hours: z.object({
    start: z.string().regex(/^\d{2}:\d{2}$/),
    end: z.string().regex(/^\d{2}:\d{2}$/),
  }).optional(),
});

// Complete Preferences
export const PreferencesSchema = z.object({
  room: RoomPreferencesSchema.default({}),
  dining: DiningPreferencesSchema.default({}),
  amenities: AmenityPreferencesSchema.default({}),
  communication: CommunicationPreferencesSchema.default({}),
});

// Stay Patterns
export const StayPatternsSchema = z.object({
  typical_check_in_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  typical_check_out_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  weekend_vs_weekday: z.enum(['weekend', 'weekday', 'mixed']).optional(),
  seasonal_patterns: z.array(z.string()).default([]),
  booking_lead_time: z.number().int().nonnegative().optional(),
});

// Sentiment
export const SentimentSchema = z.object({
  current_score: z.number().min(0).max(100).default(50),
  trend: SentimentTrendSchema.default('stable'),
  last_feedback_date: z.string().datetime().optional(),
  key_topics: z.array(z.string()).default([]),
});

// Lifetime Value
export const LifetimeValueSchema = z.object({
  clv: z.number().nonnegative().default(0),
  potential_clv: z.number().nonnegative().default(0),
  churn_risk: ChurnRiskSchema.default('low'),
  recommendation_eligibility: z.boolean().default(true),
});

// Current Stay
export const CurrentStaySchema = z.object({
  room_id: z.string().optional(),
  check_in: z.string().datetime().optional(),
  check_out: z.string().datetime().optional(),
  adults: z.number().int().nonnegative().optional(),
  children: z.number().int().nonnegative().optional(),
  rate_code: z.string().optional(),
  special_requests: z.array(z.string()).optional(),
  occasion: z.string().nullable().optional(),
});

// Guest Twin Full Schema
export const GuestTwinSchema = z.object({
  guest_id: z.string(),
  profile: GuestProfileSchema,
  loyalty: LoyaltySchema.default({ tier: 'bronze' }),
  preferences: PreferencesSchema.default({}),
  stay_patterns: StayPatternsSchema.default({}),
  sentiment: SentimentSchema.default({}),
  lifetime_value: LifetimeValueSchema.default({}),
  current_stay: CurrentStaySchema.optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

// IoT State
export const IoTStateSchema = z.object({
  thermostat: z.object({
    current: z.number(),
    target: z.number(),
    mode: z.string().optional(),
  }).optional(),
  lighting: z.object({
    scene: z.string().optional(),
    brightness: z.number().min(0).max(100).optional(),
  }).optional(),
  blinds: BlindsStateSchema.default('closed'),
  door_lock: DoorLockStateSchema.default('locked'),
  minibar_door: z.enum(['closed', 'open']).default('closed'),
  occupancy_sensor: z.boolean().default(false),
});

// Housekeeping
export const HousekeepingSchema = z.object({
  last_cleaned: z.string().datetime().optional(),
  next_scheduled: z.string().datetime().optional(),
  frequency: z.enum(['daily', 'weekly', 'on_departure']).default('daily'),
  supply_status: SupplyStatusSchema.default('adequate'),
});

// Revenue
export const RevenueSchema = z.object({
  base_rate: z.number().nonnegative().optional(),
  rack_rate: z.number().nonnegative().optional(),
  minibar_balance: z.number().default(0),
  last_rate_update: z.string().datetime().optional(),
});

// Room Twin Schema
export const RoomTwinSchema = z.object({
  room_id: z.string(),
  property_id: z.string(),
  room_number: z.string(),
  room_type: RoomTypeSchema.default('standard'),
  floor: z.number().int().positive(),
  view: ViewTypeSchema.default('city'),
  capacity: z.object({
    max_adults: z.number().int().positive().default(2),
    max_children: z.number().int().nonnegative().default(0),
    max_occupancy: z.number().int().positive().default(2),
  }).default({}),
  bed_configuration: z.object({
    bed_count: z.number().int().positive().default(1),
    bed_type: BedTypeSchema.default('king'),
    rollaway_available: z.boolean().default(false),
  }).default({}),
  amenities: z.object({
    smart_tv: z.boolean().default(false),
    smart_speaker: z.boolean().default(false),
    minibar: z.boolean().default(false),
    coffee_machine: z.boolean().default(false),
    safe: z.boolean().default(false),
    balcony: z.boolean().default(false),
    jacuzzi: z.boolean().default(false),
  }).default({}),
  status: z.object({
    current: RoomStatusSchema.default('available'),
    next_available: z.string().datetime().optional(),
    maintenance_alerts: z.array(z.string()).default([]),
  }).default({}),
  iot_state: IoTStateSchema.default({}),
  housekeeping: HousekeepingSchema.default({}),
  revenue: RevenueSchema.default({}),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

// Venue Schema
export const VenueSchema = z.object({
  venue_id: z.string(),
  name: z.string(),
  type: VenueTypeSchema,
  capacity: z.number().int().positive(),
  hours: z.record(z.string()).optional(),
  pos_revenue_center_id: z.string().optional(),
});

// Property Twin Schema
export const PropertyTwinSchema = z.object({
  property_id: z.string(),
  brand: z.string().optional(),
  name: z.string(),
  location: z.object({
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
    timezone: z.string().default('UTC'),
  }).default({}),
  inventory: z.object({
    total_rooms: z.number().int().positive(),
    by_type: z.record(z.number()).optional(),
    available_today: z.number().int().nonnegative().optional(),
    available_tomorrow: z.number().int().nonnegative().optional(),
  }),
  venues: z.array(VenueSchema).default([]),
  staff: z.object({
    total_count: z.number().int().nonnegative().default(0),
    by_department: z.record(z.number()).optional(),
    on_duty_now: z.number().int().nonnegative().default(0),
  }).default({}),
  services: z.object({
    check_in_24h: z.boolean().default(false),
    concierge_available: z.boolean().default(false),
    room_service_hours: z.record(z.string()).optional(),
    housekeeping_schedule: z.record(z.string()).optional(),
  }).default({}),
  revenue: z.object({
    today_revenue: z.number().default(0),
    mtd_revenue: z.number().default(0),
    ytd_revenue: z.number().default(0),
    revpar: z.number().optional(),
    adr: z.number().optional(),
    occupancy_rate: z.number().min(0).max(100).optional(),
  }).default({}),
  settings: z.object({
    brand_standards_version: z.string().optional(),
    upsell_config: z.record(z.unknown()).optional(),
    pricing_rules: z.record(z.unknown()).optional(),
  }).default({}),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

// Types export
export type LoyaltyTier = z.infer<typeof LoyaltyTierSchema>;
export type RoomType = z.infer<typeof RoomTypeSchema>;
export type RoomStatus = z.infer<typeof RoomStatusSchema>;
export type ViewType = z.infer<typeof ViewTypeSchema>;
export type BedType = z.infer<typeof BedTypeSchema>;
export type SentimentTrend = z.infer<typeof SentimentTrendSchema>;
export type CommunicationChannel = z.infer<typeof CommunicationChannelSchema>;
export type ChurnRisk = z.infer<typeof ChurnRiskSchema>;
export type BlindsState = z.infer<typeof BlindsStateSchema>;
export type DoorLockState = z.infer<typeof DoorLockStateSchema>;
export type SupplyStatus = z.infer<typeof SupplyStatusSchema>;
export type VenueType = z.infer<typeof VenueTypeSchema>;

export type GuestProfile = z.infer<typeof GuestProfileSchema>;
export type Loyalty = z.infer<typeof LoyaltySchema>;
export type RoomPreferences = z.infer<typeof RoomPreferencesSchema>;
export type DiningPreferences = z.infer<typeof DiningPreferencesSchema>;
export type AmenityPreferences = z.infer<typeof AmenityPreferencesSchema>;
export type CommunicationPreferences = z.infer<typeof CommunicationPreferencesSchema>;
export type Preferences = z.infer<typeof PreferencesSchema>;
export type StayPatterns = z.infer<typeof StayPatternsSchema>;
export type Sentiment = z.infer<typeof SentimentSchema>;
export type LifetimeValue = z.infer<typeof LifetimeValueSchema>;
export type CurrentStay = z.infer<typeof CurrentStaySchema>;
export type GuestTwin = z.infer<typeof GuestTwinSchema>;
export type IoTState = z.infer<typeof IoTStateSchema>;
export type Housekeeping = z.infer<typeof HousekeepingSchema>;
export type Revenue = z.infer<typeof RevenueSchema>;
export type RoomTwin = z.infer<typeof RoomTwinSchema>;
export type Venue = z.infer<typeof VenueSchema>;
export type PropertyTwin = z.infer<typeof PropertyTwinSchema>;