import { z } from 'zod';

// ============================================================================
// Guest Twin Schemas
// ============================================================================

export const GuestProfileSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  nationality: z.string().optional(),
  language_preference: z.string().default('en'),
  accessibility_needs: z.array(z.string()).default([]),
});

export const LoyaltySchema = z.object({
  tier: z.enum(['bronze', 'silver', 'gold', 'platinum']),
  points_balance: z.number().int().min(0).default(0),
  member_since: z.string().datetime().optional(),
  total_stays: z.number().int().min(0).default(0),
  total_spend: z.number().min(0).default(0),
});

export const RoomPreferencesSchema = z.object({
  floor_preference: z.string().optional(),
  view_preference: z.string().optional(),
  bed_configuration: z.string().optional(),
  temperature_setting: z.object({
    default: z.number(),
    range: z.object({ min: z.number(), max: z.number() }).optional(),
  }).optional(),
  lighting_preference: z.string().optional(),
  noise_tolerance: z.number().int().min(1).max(10).optional(),
});

export const DiningPreferencesSchema = z.object({
  dietary_restrictions: z.array(z.string()).default([]),
  allergies: z.array(z.string()).default([]),
  favorite_items: z.array(z.string()).default([]),
  beverage_preferences: z.array(z.string()).default([]),
  typical_spend_range: z.object({
    min: z.number(),
    max: z.number(),
  }).optional(),
});

export const AmenityPreferencesSchema = z.object({
  spa_interests: z.array(z.string()).default([]),
  fitness_habits: z.boolean().default(false),
  pool_usage: z.boolean().default(false),
  business_amenities: z.array(z.string()).default([]),
});

export const CommunicationPreferencesSchema = z.object({
  preferred_channel: z.enum(['email', 'sms', 'app_push', 'whatsapp']).default('email'),
  opt_ins: z.array(z.string()).default([]),
  quiet_hours: z.object({
    start: z.string().regex(/^\d{2}:\d{2}$/),
    end: z.string().regex(/^\d{2}:\d{2}$/),
  }).optional(),
});

export const PreferencesSchema = z.object({
  room: RoomPreferencesSchema.default({}),
  dining: DiningPreferencesSchema.default({}),
  amenities: AmenityPreferencesSchema.default({}),
  communication: CommunicationPreferencesSchema.default({}),
});

export const StayPatternsSchema = z.object({
  typical_check_in_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  typical_check_out_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  weekend_vs_weekday: z.enum(['weekend', 'weekday', 'mixed']).optional(),
  seasonal_patterns: z.array(z.string()).default([]),
  booking_lead_time: z.number().int().min(0).optional(),
});

export const SentimentSchema = z.object({
  current_score: z.number().min(0).max(100).default(50),
  trend: z.enum(['improving', 'stable', 'declining']).default('stable'),
  last_feedback_date: z.string().datetime().optional(),
  key_topics: z.array(z.string()).default([]),
});

export const LifetimeValueSchema = z.object({
  clv: z.number().min(0).default(0),
  potential_clv: z.number().min(0).default(0),
  churn_risk: z.enum(['low', 'medium', 'high']).default('low'),
  recommendation_eligibility: z.boolean().default(true),
});

export const CurrentStaySchema = z.object({
  room_id: z.string(),
  check_in: z.string().datetime(),
  check_out: z.string().datetime(),
  adults: z.number().int().min(1).default(1),
  children: z.number().int().min(0).default(0),
  rate_code: z.string().optional(),
  special_requests: z.array(z.string()).default([]),
  occasion: z.string().nullable().optional(),
});

export const GuestTwinSchema = z.object({
  guest_id: z.string(),
  twin_id: z.string().optional(),
  profile: GuestProfileSchema,
  loyalty: LoyaltySchema.optional(),
  preferences: PreferencesSchema.optional(),
  stay_patterns: StayPatternsSchema.optional(),
  sentiment: SentimentSchema.optional(),
  lifetime_value: LifetimeValueSchema.optional(),
  current_stay: CurrentStaySchema.optional(),
  preferred_property_id: z.string().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export const CreateGuestTwinRequestSchema = GuestTwinSchema.omit({ twin_id: true, created_at: true, updated_at: true });
export const UpdateGuestPreferencesRequestSchema = z.object({
  preferences: PreferencesSchema,
});

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
export type CreateGuestTwinRequest = z.infer<typeof CreateGuestTwinRequestSchema>;
export type UpdateGuestPreferencesRequest = z.infer<typeof UpdateGuestPreferencesRequestSchema>;

// ============================================================================
// Room Twin Schemas
// ============================================================================

export const CapacitySchema = z.object({
  max_adults: z.number().int().min(1).default(2),
  max_children: z.number().int().min(0).default(0),
  max_occupancy: z.number().int().min(1).default(2),
});

export const BedConfigurationSchema = z.object({
  bed_count: z.number().int().min(1).default(1),
  bed_type: z.enum(['king', 'queen', 'twin', 'bunk']),
  rollaway_available: z.boolean().default(false),
});

export const RoomAmenitiesSchema = z.object({
  smart_tv: z.boolean().default(false),
  smart_speaker: z.boolean().default(false),
  minibar: z.boolean().default(false),
  coffee_machine: z.boolean().default(false),
  safe: z.boolean().default(false),
  balcony: z.boolean().default(false),
  jacuzzi: z.boolean().default(false),
});

export const RoomStatusSchema = z.object({
  current: z.enum(['available', 'occupied', 'blocked', 'out_of_order', 'cleaning', 'inspected']),
  next_available: z.string().datetime().optional(),
  maintenance_alerts: z.array(z.string()).default([]),
});

export const IoTStateSchema = z.object({
  thermostat: z.object({
    current: z.number(),
    target: z.number(),
    mode: z.string(),
  }).optional(),
  lighting: z.object({
    scene: z.string(),
    brightness: z.number().int().min(0).max(100),
  }).optional(),
  blinds: z.enum(['open', 'closed', 'partial']).optional(),
  door_lock: z.enum(['locked', 'unlocked']).optional(),
  minibar_door: z.enum(['closed', 'open']).optional(),
  occupancy_sensor: z.boolean().optional(),
});

export const HousekeepingStateSchema = z.object({
  last_cleaned: z.string().datetime().optional(),
  next_scheduled: z.string().datetime().optional(),
  frequency: z.enum(['daily', 'weekly', 'on_departure']).default('daily'),
  supply_status: z.enum(['adequate', 'low', 'critical']).default('adequate'),
});

export const RevenueStateSchema = z.object({
  base_rate: z.number().min(0),
  rack_rate: z.number().min(0),
  minibar_balance: z.number().min(0).default(0),
  last_rate_update: z.string().datetime().optional(),
});

export const RoomTwinSchema = z.object({
  room_id: z.string(),
  twin_id: z.string().optional(),
  property_id: z.string(),
  room_number: z.string(),
  room_type: z.enum(['standard', 'deluxe', 'suite', 'penthouse', 'accessible']),
  floor: z.number().int().min(1),
  view: z.enum(['city', 'pool', 'garden', 'ocean', 'mountain']),
  capacity: CapacitySchema,
  bed_configuration: BedConfigurationSchema,
  amenities: RoomAmenitiesSchema,
  status: RoomStatusSchema,
  iot_state: IoTStateSchema.optional(),
  housekeeping: HousekeepingStateSchema,
  revenue: RevenueStateSchema,
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export const CreateRoomTwinRequestSchema = RoomTwinSchema.omit({ twin_id: true, created_at: true, updated_at: true });
export const UpdateRoomStatusRequestSchema = z.object({
  status: RoomStatusSchema,
});
export const UpdateHousekeepingRequestSchema = z.object({
  housekeeping: HousekeepingStateSchema,
});

export type Capacity = z.infer<typeof CapacitySchema>;
export type BedConfiguration = z.infer<typeof BedConfigurationSchema>;
export type RoomAmenities = z.infer<typeof RoomAmenitiesSchema>;
export type RoomStatus = z.infer<typeof RoomStatusSchema>;
export type IoTState = z.infer<typeof IoTStateSchema>;
export type HousekeepingState = z.infer<typeof HousekeepingStateSchema>;
export type RevenueState = z.infer<typeof RevenueStateSchema>;
export type RoomTwin = z.infer<typeof RoomTwinSchema>;
export type CreateRoomTwinRequest = z.infer<typeof CreateRoomTwinRequestSchema>;
export type UpdateRoomStatusRequest = z.infer<typeof UpdateRoomStatusRequestSchema>;
export type UpdateHousekeepingRequest = z.infer<typeof UpdateHousekeepingRequestSchema>;

// ============================================================================
// Property Twin Schemas
// ============================================================================

export const VenueSchema = z.object({
  venue_id: z.string(),
  name: z.string(),
  type: z.enum(['restaurant', 'bar', 'spa', 'gym', 'pool', 'meeting_room']),
  capacity: z.number().int().min(1),
  hours: z.record(z.string(), z.string()),
  pos_revenue_center_id: z.string().optional(),
});

export const StaffSummarySchema = z.object({
  total_count: z.number().int().min(0),
  by_department: z.record(z.string(), z.number().int()),
  on_duty_now: z.number().int().min(0),
});

export const ServicesSchema = z.object({
  check_in_24h: z.boolean().default(false),
  concierge_available: z.boolean().default(false),
  room_service_hours: z.object({
    start: z.string(),
    end: z.string(),
  }).optional(),
  housekeeping_schedule: z.object({
    start: z.string(),
    end: z.string(),
  }).optional(),
});

export const RevenueSummarySchema = z.object({
  today_revenue: z.number().min(0).default(0),
  mtd_revenue: z.number().min(0).default(0),
  ytd_revenue: z.number().min(0).default(0),
  revpar: z.number().min(0).optional(),
  adr: z.number().min(0).optional(),
  occupancy_rate: z.number().min(0).max(100).optional(),
});

export const PropertySettingsSchema = z.object({
  brand_standards_version: z.string().optional(),
  upsell_config: z.record(z.unknown()).optional(),
  pricing_rules: z.record(z.unknown()).optional(),
});

export const PropertyTwinSchema = z.object({
  property_id: z.string(),
  twin_id: z.string().optional(),
  brand: z.string(),
  name: z.string(),
  location: z.object({
    address: z.string(),
    city: z.string(),
    country: z.string(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }),
    timezone: z.string(),
  }),
  inventory: z.object({
    total_rooms: z.number().int().min(0),
    by_type: z.record(z.string(), z.number().int()),
    available_today: z.number().int().min(0),
    available_tomorrow: z.number().int().min(0),
  }),
  venues: z.array(VenueSchema).default([]),
  staff: StaffSummarySchema,
  services: ServicesSchema,
  revenue: RevenueSummarySchema,
  settings: PropertySettingsSchema,
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export const CreatePropertyTwinRequestSchema = PropertyTwinSchema.omit({ twin_id: true, created_at: true, updated_at: true });

export type Venue = z.infer<typeof VenueSchema>;
export type StaffSummary = z.infer<typeof StaffSummarySchema>;
export type Services = z.infer<typeof ServicesSchema>;
export type RevenueSummary = z.infer<typeof RevenueSummarySchema>;
export type PropertySettings = z.infer<typeof PropertySettingsSchema>;
export type PropertyTwin = z.infer<typeof PropertyTwinSchema>;
export type CreatePropertyTwinRequest = z.infer<typeof CreatePropertyTwinRequestSchema>;

// ============================================================================
// Housekeeping Scheduling Schemas
// ============================================================================

export const HousekeeperSchema = z.object({
  staff_id: z.string(),
  name: z.string(),
  property_id: z.string(),
  department: z.enum(['housekeeping']),
  level: z.enum(['junior', 'senior', 'lead', 'manager']),
  certifications: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
  max_rooms_per_shift: z.number().int().min(1).default(15),
  efficiency_rating: z.number().min(0).max(100).default(80),
});

export const CleaningTaskSchema = z.object({
  task_id: z.string(),
  room_id: z.string(),
  room_number: z.string(),
  room_type: z.enum(['standard', 'deluxe', 'suite', 'penthouse', 'accessible']),
  priority: z.enum(['high', 'medium', 'low']),
  task_type: z.enum(['checkout', 'turndown', 'daily', 'deep_clean', 'maintenance']),
  estimated_duration_minutes: z.number().int().min(5).default(25),
  special_requirements: z.array(z.string()).default([]),
  assigned_to: z.string().nullable().optional(),
  scheduled_time: z.string().datetime().optional(),
  completed_at: z.string().datetime().nullable().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).default('pending'),
});

export const ScheduleRequestSchema = z.object({
  property_id: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  shift_start: z.string().regex(/^\d{2}:\d{2}$/),
  shift_end: z.string().regex(/^\d{2}:\d{2}$/),
  available_staff: z.array(z.string()),
  priority_rooms: z.array(z.string()).default([]),
});

export const ScheduleResponseSchema = z.object({
  schedule_id: z.string(),
  property_id: z.string(),
  date: z.string(),
  shift_start: z.string(),
  shift_end: z.string(),
  assignments: z.array(z.object({
    task: CleaningTaskSchema,
    housekeeper: HousekeeperSchema,
    start_time: z.string().datetime(),
    end_time: z.string().datetime(),
  })),
  unassigned_tasks: z.array(CleaningTaskSchema),
  total_tasks: z.number().int(),
  completed_tasks: z.number().int(),
  efficiency_score: z.number().min(0).max(100),
  generated_at: z.string().datetime(),
});

export const OccupancyForecastSchema = z.object({
  property_id: z.string(),
  date: z.string(),
  predicted_checkouts: z.number().int().min(0),
  predicted_checkins: z.number().int().min(0),
  net_occupancy_change: z.number().int(),
  high_priority_rooms: z.array(z.string()),
  confidence_score: z.number().min(0).max(100),
});

export const MaintenancePredictionSchema = z.object({
  room_id: z.string(),
  room_number: z.string(),
  property_id: z.string(),
  issue_type: z.enum(['hvac', 'plumbing', 'electrical', 'furniture', 'iot', 'general']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  predicted_occurrence: z.string().datetime(),
  confidence_score: z.number().min(0).max(100),
  recommended_action: z.string(),
  estimated_repair_time_minutes: z.number().int().min(0),
});

export type Housekeeper = z.infer<typeof HousekeeperSchema>;
export type CleaningTask = z.infer<typeof CleaningTaskSchema>;
export type ScheduleRequest = z.infer<typeof ScheduleRequestSchema>;
export type ScheduleResponse = z.infer<typeof ScheduleResponseSchema>;
export type OccupancyForecast = z.infer<typeof OccupancyForecastSchema>;
export type MaintenancePrediction = z.infer<typeof MaintenancePredictionSchema>;
