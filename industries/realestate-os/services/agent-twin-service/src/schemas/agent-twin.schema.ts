import { z } from 'zod';

// ============================================================================
// ENUMS
// ============================================================================

export const AgentAvailabilityStatusSchema = z.enum(['available', 'busy', 'unavailable']);
export const PropertyTypeSchema = z.enum([
  'single_family',
  'condo',
  'townhouse',
  'multi_family',
  'land',
  'commercial',
  'industrial',
  'mixed_use'
]);
export const OwnerTypeSchema = z.enum(['individual', 'llc', 'corporation', 'trust']);

// ============================================================================
// PROFILE SCHEMA
// ============================================================================

export const AgentNameSchema = z.object({
  first: z.string().min(1, 'First name is required'),
  last: z.string().min(1, 'Last name is required'),
  prefix: z.string().nullable().optional(),
});

export const AgentProfileSchema = z.object({
  name: AgentNameSchema,
  photo_url: z.string().url().optional().or(z.string().length(0)).optional(),
  bio: z.string().max(2000).optional(),
  languages: z.array(z.string()).default([]),
  specialties: z.array(z.string()).default([]),
  license_number: z.string().min(1, 'License number is required'),
  license_state: z.string().min(2).max(2),
  license_expiration: z.string().datetime({ message: 'Invalid date format' }),
});

export type AgentProfile = z.infer<typeof AgentProfileSchema>;

// ============================================================================
// CONTACT SCHEMA
// ============================================================================

export const AgentContactSchema = z.object({
  phone: z.string().min(10, 'Valid phone number is required'),
  email: z.string().email('Invalid email format'),
  website: z.string().url().nullable().optional(),
  social: z.object({
    linkedin: z.string().url().nullable().optional(),
    facebook: z.string().url().nullable().optional(),
    instagram: z.string().url().nullable().optional(),
  }).optional(),
});

export type AgentContact = z.infer<typeof AgentContactSchema>;

// ============================================================================
// BROKERAGE SCHEMA
// ============================================================================

export const BrokerageSchema = z.object({
  brokerage_id: z.string().min(1, 'Brokerage ID is required'),
  brokerage_name: z.string().min(1, 'Brokerage name is required'),
  brokerage_address: z.string().optional(),
  team_name: z.string().nullable().optional(),
});

export type Brokerage = z.infer<typeof BrokerageSchema>;

// ============================================================================
// PERFORMANCE SCHEMA
// ============================================================================

export const AgentPerformanceSchema = z.object({
  transactions_ytd: z.number().int().min(0).default(0),
  volume_ytd: z.number().min(0).default(0),
  avg_days_to_close: z.number().min(0).default(0),
  list_to_sale_ratio: z.number().min(0).max(100).default(0),
  client_rating: z.number().min(1).max(5).default(0),
  review_count: z.number().int().min(0).default(0),
  recommendation_rate: z.number().min(0).max(100).default(0),
});

export type AgentPerformance = z.infer<typeof AgentPerformanceSchema>;

// ============================================================================
// EXPERTISE SCHEMA
// ============================================================================

export const PriceRangeSchema = z.object({
  min: z.number().min(0).default(0),
  max: z.number().min(0).default(0),
});

export const AgentExpertiseSchema = z.object({
  areas: z.array(z.string()).default([]),
  property_types: z.array(PropertyTypeSchema).default([]),
  price_ranges: PriceRangeSchema.default({}),
  years_experience: z.number().int().min(0).default(0),
});

export type AgentExpertise = z.infer<typeof AgentExpertiseSchema>;

// ============================================================================
// WORKING HOURS SCHEMA
// ============================================================================

export const DayHoursSchema = z.object({
  start: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  end: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
}).nullable().optional();

export const WorkingHoursSchema = z.object({
  monday: DayHoursSchema,
  tuesday: DayHoursSchema,
  wednesday: DayHoursSchema,
  thursday: DayHoursSchema,
  friday: DayHoursSchema,
  saturday: DayHoursSchema,
  sunday: DayHoursSchema,
});

export type WorkingHours = z.infer<typeof WorkingHoursSchema>;

// ============================================================================
// AVAILABILITY SCHEMA
// ============================================================================

export const AgentAvailabilitySchema = z.object({
  status: AgentAvailabilityStatusSchema.default('available'),
  response_time_avg_minutes: z.number().int().min(0).default(0),
  working_hours: WorkingHoursSchema.default({}),
});

export type AgentAvailability = z.infer<typeof AgentAvailabilitySchema>;

// ============================================================================
// LEAD PREFERENCES SCHEMA
// ============================================================================

export const LeadPreferencesSchema = z.object({
  min_budget: z.number().min(0).default(0),
  max_budget: z.number().min(0).default(0),
  property_types: z.array(PropertyTypeSchema).default([]),
  areas: z.array(z.string()).default([]),
  lead_routing_enabled: z.boolean().default(true),
});

export type LeadPreferences = z.infer<typeof LeadPreferencesSchema>;

// ============================================================================
// COMPENSATION SCHEMA
// ============================================================================

export const AgentCompensationSchema = z.object({
  commission_split: z.number().min(0).max(100).default(70),
  referral_fee_rate: z.number().min(0).max(100).default(25),
});

export type AgentCompensation = z.infer<typeof AgentCompensationSchema>;

// ============================================================================
// FULL AGENT TWIN SCHEMA
// ============================================================================

export const AgentTwinSchema = z.object({
  agent_id: z.string().min(1, 'Agent ID is required'),
  twin_id: z.string().optional(),
  profile: AgentProfileSchema,
  contact: AgentContactSchema,
  brokerage: BrokerageSchema,
  performance: AgentPerformanceSchema.default({}),
  expertise: AgentExpertiseSchema.default({}),
  availability: AgentAvailabilitySchema.default({}),
  lead_preferences: LeadPreferencesSchema.default({}),
  compensation: AgentCompensationSchema.default({}),
  active_listings: z.array(z.string()).default([]),
  active_deals: z.array(z.string()).default([]),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  version: z.number().int().default(1),
});

export type AgentTwin = z.infer<typeof AgentTwinSchema>;

// ============================================================================
// API REQUEST SCHEMAS
// ============================================================================

// ============================================================================
// API REQUEST SCHEMAS
// ============================================================================

export const CreateAgentTwinRequestSchema = AgentTwinSchema
  .omit({
    twin_id: true,
    created_at: true,
    updated_at: true,
    version: true,
    active_listings: true,
    active_deals: true,
  })
  .extend({
    agent_id: z.string().min(1),
  });

export const UpdateAgentTwinRequestSchema = z.object({
  profile: AgentProfileSchema.optional(),
  contact: AgentContactSchema.optional(),
  brokerage: BrokerageSchema.optional(),
  expertise: AgentExpertiseSchema.optional(),
  availability: AgentAvailabilitySchema.optional(),
  lead_preferences: LeadPreferencesSchema.optional(),
  compensation: AgentCompensationSchema.optional(),
});

export const UpdatePerformanceRequestSchema = z.object({
  transactions_ytd: z.number().int().min(0).optional(),
  volume_ytd: z.number().min(0).optional(),
  avg_days_to_close: z.number().min(0).optional(),
  list_to_sale_ratio: z.number().min(0).max(100).optional(),
  client_rating: z.number().min(1).max(5).optional(),
  review_count: z.number().int().min(0).optional(),
  recommendation_rate: z.number().min(0).max(100).optional(),
});

export const UpdateAvailabilityRequestSchema = z.object({
  status: AgentAvailabilityStatusSchema.optional(),
  working_hours: WorkingHoursSchema.optional(),
});

export const UpdateLeadPreferencesRequestSchema = z.object({
  min_budget: z.number().min(0).optional(),
  max_budget: z.number().min(0).optional(),
  property_types: z.array(PropertyTypeSchema).optional(),
  areas: z.array(z.string()).optional(),
  lead_routing_enabled: z.boolean().optional(),
});

export const AddListingRequestSchema = z.object({
  listing_id: z.string().min(1),
});

export const RemoveListingRequestSchema = z.object({
  listing_id: z.string().min(1),
});

export const AddDealRequestSchema = z.object({
  deal_id: z.string().min(1),
});

export const RemoveDealRequestSchema = z.object({
  deal_id: z.string().min(1),
});

// ============================================================================
// API RESPONSE SCHEMAS
// ============================================================================

export const AgentTwinResponseSchema = AgentTwinSchema;
export const AgentTwinListResponseSchema = z.object({
  twins: z.array(AgentTwinSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

export const AgentStatsResponseSchema = z.object({
  total_agents: z.number(),
  by_status: z.record(z.string(), z.number()),
  by_tier: z.record(z.string(), z.number()),
  avg_transactions_ytd: z.number(),
  avg_rating: z.number(),
  total_volume_ytd: z.number(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CreateAgentTwinRequest = z.infer<typeof CreateAgentTwinRequestSchema>;
export type UpdateAgentTwinRequest = z.infer<typeof UpdateAgentTwinRequestSchema>;
export type UpdatePerformanceRequest = z.infer<typeof UpdatePerformanceRequestSchema>;
export type UpdateAvailabilityRequest = z.infer<typeof UpdateAvailabilityRequestSchema>;
export type UpdateLeadPreferencesRequest = z.infer<typeof UpdateLeadPreferencesRequestSchema>;
export type AddListingRequest = z.infer<typeof AddListingRequestSchema>;
export type RemoveListingRequest = z.infer<typeof RemoveListingRequestSchema>;
export type AddDealRequest = z.infer<typeof AddDealRequestSchema>;
export type RemoveDealRequest = z.infer<typeof RemoveDealRequestSchema>;
export type AgentTwinResponse = z.infer<typeof AgentTwinResponseSchema>;
export type AgentTwinListResponse = z.infer<typeof AgentTwinListResponseSchema>;
export type AgentStatsResponse = z.infer<typeof AgentStatsResponseSchema>;