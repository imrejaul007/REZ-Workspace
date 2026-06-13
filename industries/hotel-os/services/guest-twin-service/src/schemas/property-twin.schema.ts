import { z } from 'zod';

// ============================================================================
// PROPERTY TWIN SCHEMAS
// ============================================================================

export const VenueHoursSchema = z.object({
  monday: z.object({
    open: z.string().regex(/^\d{2}:\d{2}$/),
    close: z.string().regex(/^\d{2}:\d{2}$/),
  }).optional(),
  tuesday: z.object({
    open: z.string().regex(/^\d{2}:\d{2}$/),
    close: z.string().regex(/^\d{2}:\d{2}$/),
  }).optional(),
  wednesday: z.object({
    open: z.string().regex(/^\d{2}:\d{2}$/),
    close: z.string().regex(/^\d{2}:\d{2}$/),
  }).optional(),
  thursday: z.object({
    open: z.string().regex(/^\d{2}:\d{2}$/),
    close: z.string().regex(/^\d{2}:\d{2}$/),
  }).optional(),
  friday: z.object({
    open: z.string().regex(/^\d{2}:\d{2}$/),
    close: z.string().regex(/^\d{2}:\d{2}$/),
  }).optional(),
  saturday: z.object({
    open: z.string().regex(/^\d{2}:\d{2}$/),
    close: z.string().regex(/^\d{2}:\d{2}$/),
  }).optional(),
  sunday: z.object({
    open: z.string().regex(/^\d{2}:\d{2}$/),
    close: z.string().regex(/^\d{2}:\d{2}$/),
  }).optional(),
});

export const VenueSchema = z.object({
  venue_id: z.string(),
  name: z.string(),
  type: z.enum(['restaurant', 'bar', 'spa', 'gym', 'pool', 'meeting_room']),
  capacity: z.number().int().min(0),
  hours: VenueHoursSchema.optional(),
  pos_revenue_center_id: z.string().optional(),
});

export const InventoryByTypeSchema = z.object({
  standard: z.number().int().min(0).default(0),
  deluxe: z.number().int().min(0).default(0),
  suite: z.number().int().min(0).default(0),
  penthouse: z.number().int().min(0).default(0),
  accessible: z.number().int().min(0).default(0),
});

export const InventorySchema = z.object({
  total_rooms: z.number().int().min(0),
  by_type: InventoryByTypeSchema.default({}),
  available_today: z.number().int().min(0),
  available_tomorrow: z.number().int().min(0),
});

export const StaffCountByDepartmentSchema = z.object({
  front_desk: z.number().int().min(0).default(0),
  housekeeping: z.number().int().min(0).default(0),
  f_and_b: z.number().int().min(0).default(0),
  maintenance: z.number().int().min(0).default(0),
  management: z.number().int().min(0).default(0),
  spa: z.number().int().min(0).default(0),
  concierge: z.number().int().min(0).default(0),
});

export const StaffSchema = z.object({
  total_count: z.number().int().min(0),
  by_department: StaffCountByDepartmentSchema.default({}),
  on_duty_now: z.number().int().min(0),
});

export const ServicesSchema = z.object({
  check_in_24h: z.boolean().default(false),
  concierge_available: z.boolean().default(false),
  room_service_hours: z.object({
    start: z.string().regex(/^\d{2}:\d{2}$/),
    end: z.string().regex(/^\d{2}:\d{2}$/),
  }).optional(),
  housekeeping_schedule: z.object({
    start: z.string().regex(/^\d{2}:\d{2}$/),
    end: z.string().regex(/^\d{2}:\d{2}$/),
  }).optional(),
});

export const RevenueMetricsSchema = z.object({
  today_revenue: z.number().min(0).default(0),
  mtd_revenue: z.number().min(0).default(0),
  ytd_revenue: z.number().min(0).default(0),
  revpar: z.number().min(0).default(0),
  adr: z.number().min(0).default(0),
  occupancy_rate: z.number().min(0).max(100).default(0),
});

export const SettingsSchema = z.object({
  brand_standards_version: z.string().optional(),
  upsell_config: z.record(z.any()).optional(),
  pricing_rules: z.record(z.any()).optional(),
});

export const PropertyTwinSchema = z.object({
  property_id: z.string().min(1, 'Property ID is required'),
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
    timezone: z.string().default('UTC'),
  }),
  inventory: InventorySchema,
  venues: z.array(VenueSchema).default([]),
  staff: StaffSchema.default({}),
  services: ServicesSchema.default({}),
  revenue: RevenueMetricsSchema.default({}),
  settings: SettingsSchema.default({}),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  version: z.number().int().default(1),
});

export type PropertyTwin = z.infer<typeof PropertyTwinSchema>;

// ============================================================================
// API REQUEST/RESPONSE SCHEMAS
// ============================================================================

export const CreatePropertyTwinRequestSchema = PropertyTwinSchema.omit({
  twin_id: true,
  created_at: true,
  updated_at: true,
  version: true,
});

export const UpdatePropertyRequestSchema = z.object({
  name: z.string().optional(),
  venues: z.array(VenueSchema).optional(),
  services: ServicesSchema.optional(),
  settings: SettingsSchema.optional(),
});

export const UpdateRevenueRequestSchema = z.object({
  today_revenue: z.number().min(0).optional(),
  mtd_revenue: z.number().min(0).optional(),
  ytd_revenue: z.number().min(0).optional(),
  revpar: z.number().min(0).optional(),
  adr: z.number().min(0).optional(),
  occupancy_rate: z.number().min(0).max(100).optional(),
});

export const PropertyTwinResponseSchema = PropertyTwinSchema;
export const PropertyTwinListResponseSchema = z.object({
  twins: z.array(PropertyTwinSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

export type CreatePropertyTwinRequest = z.infer<typeof CreatePropertyTwinRequestSchema>;
export type UpdatePropertyRequest = z.infer<typeof UpdatePropertyRequestSchema>;
export type UpdateRevenueRequest = z.infer<typeof UpdateRevenueRequestSchema>;
export type PropertyTwinResponse = z.infer<typeof PropertyTwinResponseSchema>;
export type PropertyTwinListResponse = z.infer<typeof PropertyTwinListResponseSchema>;
