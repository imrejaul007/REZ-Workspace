import { z } from 'zod';

// ============================================================================
// GUEST TWIN SCHEMAS
// ============================================================================

// Enums
export const LoyaltyTierSchema = z.enum(['bronze', 'silver', 'gold', 'platinum']);
export const SentimentTrendSchema = z.enum(['improving', 'stable', 'declining']);
export const ChurnRiskSchema = z.enum(['low', 'medium', 'high']);
export const PreferredChannelSchema = z.enum(['email', 'sms', 'app_push', 'whatsapp']);
export const ViewPreferenceSchema = z.enum(['city', 'pool', 'garden', 'ocean', 'mountain']);
export const BedConfigurationSchema = z.enum(['king', 'queen', 'twin', 'bunk', 'custom']);
export const LightingPreferenceSchema = z.enum(['bright', 'dim', 'night', 'custom']);
export const RoomStatusSchema = z.enum(['available', 'occupied', 'blocked', 'out_of_order', 'cleaning', 'inspected']);
export const ThermostatModeSchema = z.enum(['heat', 'cool', 'auto', 'off']);
export const BlindsStateSchema = z.enum(['open', 'closed', 'partial']);
export const DoorLockStateSchema = z.enum(['locked', 'unlocked']);
export const MinibarDoorStateSchema = z.enum(['closed', 'open']);
export const HousekeepingFrequencySchema = z.enum(['daily', 'weekly', 'on_departure']);
export const SupplyStatusSchema = z.enum(['adequate', 'low', 'critical']);
export const RoomTypeSchema = z.enum(['standard', 'deluxe', 'suite', 'penthouse', 'accessible']);
export const StaffDepartmentSchema = z.enum(['front_desk', 'housekeeping', 'f_and_b', 'maintenance', 'management', 'spa', 'concierge']);
export const StaffLevelSchema = z.enum(['junior', 'senior', 'lead', 'manager', 'director']);
export const ShiftTypeSchema = z.enum(['regular', 'overtime', 'on_call']);
export const ExperienceTypeSchema = z.enum(['dining', 'spa', 'activity', 'tour', 'event', 'room_service']);
export const VenueTypeSchema = z.enum(['restaurant', 'bar', 'spa', 'gym', 'pool', 'meeting_room']);

// ============================================================================
// GUEST PROFILE SCHEMA
// ============================================================================

export const GuestProfileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  nationality: z.string().optional(),
  language_preference: z.string().default('en'),
  accessibility_needs: z.array(z.string()).default([]),
});

export type GuestProfile = z.infer<typeof GuestProfileSchema>;

// ============================================================================
// LOYALTY SCHEMA
// ============================================================================

export const LoyaltySchema = z.object({
  tier: LoyaltyTierSchema.default('bronze'),
  points_balance: z.number().int().min(0).default(0),
  member_since: z.string().datetime().optional(),
  total_stays: z.number().int().min(0).default(0),
  total_spend: z.number().min(0).default(0),
});

export type Loyalty = z.infer<typeof LoyaltySchema>;

// ============================================================================
// PREFERENCES SCHEMA
// ============================================================================

export const RoomPreferencesSchema = z.object({
  floor_preference: z.string().optional(),
  view_preference: ViewPreferenceSchema.optional(),
  bed_configuration: BedConfigurationSchema.optional(),
  temperature_setting: z.object({
    default: z.number().min(60).max(85),
    range: z.object({
      min: z.number().min(60),
      max: z.number().max(85),
    }).optional(),
  }).optional(),
  lighting_preference: LightingPreferenceSchema.optional(),
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

export const AmenitiesPreferencesSchema = z.object({
  spa_interests: z.array(z.string()).default([]),
  fitness_habits: z.boolean().default(false),
  pool_usage: z.boolean().default(false),
  business_amenities: z.array(z.string()).default([]),
});

export const CommunicationPreferencesSchema = z.object({
  preferred_channel: PreferredChannelSchema.default('email'),
  opt_ins: z.array(z.string()).default([]),
  quiet_hours: z.object({
    start: z.string().regex(/^\d{2}:\d{2}$/),
    end: z.string().regex(/^\d{2}:\d{2}$/),
  }).optional(),
});

export const PreferencesSchema = z.object({
  room: RoomPreferencesSchema.default({}),
  dining: DiningPreferencesSchema.default({}),
  amenities: AmenitiesPreferencesSchema.default({}),
  communication: CommunicationPreferencesSchema.default({}),
});

export type Preferences = z.infer<typeof PreferencesSchema>;

// ============================================================================
// STAY PATTERNS SCHEMA
// ============================================================================

export const StayPatternsSchema = z.object({
  typical_check_in_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  typical_check_out_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  weekend_vs_weekday: z.enum(['weekend', 'weekday', 'equal']).optional(),
  seasonal_patterns: z.array(z.string()).default([]),
  booking_lead_time: z.number().int().min(0).optional(),
});

export type StayPatterns = z.infer<typeof StayPatternsSchema>;

// ============================================================================
// SENTIMENT SCHEMA
// ============================================================================

export const SentimentSchema = z.object({
  current_score: z.number().min(0).max(100).default(50),
  trend: SentimentTrendSchema.default('stable'),
  last_feedback_date: z.string().datetime().optional(),
  key_topics: z.array(z.string()).default([]),
});

export type Sentiment = z.infer<typeof SentimentSchema>;

// ============================================================================
// LIFETIME VALUE SCHEMA
// ============================================================================

export const LifetimeValueSchema = z.object({
  clv: z.number().min(0).default(0),
  potential_clv: z.number().min(0).default(0),
  churn_risk: ChurnRiskSchema.default('low'),
  recommendation_eligibility: z.boolean().default(true),
});

export type LifetimeValue = z.infer<typeof LifetimeValueSchema>;

// ============================================================================
// CURRENT STAY SCHEMA
// ============================================================================

export const CurrentStaySchema = z.object({
  room_id: z.string().optional(),
  check_in: z.string().datetime().optional(),
  check_out: z.string().datetime().optional(),
  adults: z.number().int().min(1).default(1),
  children: z.number().int().min(0).default(0),
  rate_code: z.string().optional(),
  special_requests: z.array(z.string()).default([]),
  occasion: z.string().nullable().optional(),
});

export type CurrentStay = z.infer<typeof CurrentStaySchema>;

// ============================================================================
// GUEST TWIN FULL SCHEMA
// ============================================================================

export const GuestTwinSchema = z.object({
  guest_id: z.string().min(1, 'Guest ID is required'),
  twin_id: z.string().optional(),
  property_id: z.string().optional(),
  profile: GuestProfileSchema,
  loyalty: LoyaltySchema.default({}),
  preferences: PreferencesSchema.default({}),
  stay_patterns: StayPatternsSchema.default({}),
  sentiment: SentimentSchema.default({}),
  lifetime_value: LifetimeValueSchema.default({}),
  current_stay: CurrentStaySchema.default({}),
  stay_history: z.array(z.object({
    room_id: z.string(),
    check_in: z.string().datetime(),
    check_out: z.string().datetime(),
    total_spend: z.number().min(0),
    rating: z.number().min(1).max(5).optional(),
  })).default([]),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  version: z.number().int().default(1),
});

export type GuestTwin = z.infer<typeof GuestTwinSchema>;

// ============================================================================
// API REQUEST/RESPONSE SCHEMAS
// ============================================================================

export const CreateGuestTwinRequestSchema = GuestTwinSchema.omit({
  twin_id: true,
  created_at: true,
  updated_at: true,
  version: true,
}).extend({
  guest_id: z.string().min(1),
});

export const UpdatePreferencesRequestSchema = z.object({
  preferences: PreferencesSchema,
  merge: z.boolean().default(true),
});

export const UpdateSentimentRequestSchema = z.object({
  score: z.number().min(0).max(100),
  feedback_date: z.string().datetime().optional(),
  topics: z.array(z.string()).optional(),
});

export const CheckInRequestSchema = z.object({
  room_id: z.string().min(1),
  check_in: z.string().datetime(),
  check_out: z.string().datetime(),
  adults: z.number().int().min(1).default(1),
  children: z.number().int().min(0).default(0),
  rate_code: z.string().optional(),
  special_requests: z.array(z.string()).default([]),
  occasion: z.string().nullable().optional(),
});

export const CheckOutRequestSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  feedback: z.string().optional(),
  total_spend: z.number().min(0).optional(),
});

// API Response schemas
export const GuestTwinResponseSchema = GuestTwinSchema;
export const GuestTwinListResponseSchema = z.object({
  twins: z.array(GuestTwinSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

export type CreateGuestTwinRequest = z.infer<typeof CreateGuestTwinRequestSchema>;
export type UpdatePreferencesRequest = z.infer<typeof UpdatePreferencesRequestSchema>;
export type UpdateSentimentRequest = z.infer<typeof UpdateSentimentRequestSchema>;
export type CheckInRequest = z.infer<typeof CheckInRequestSchema>;
export type CheckOutRequest = z.infer<typeof CheckOutRequestSchema>;
export type GuestTwinResponse = z.infer<typeof GuestTwinResponseSchema>;
export type GuestTwinListResponse = z.infer<typeof GuestTwinListResponseSchema>;
