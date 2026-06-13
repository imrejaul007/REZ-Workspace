import { z } from 'zod';

// ============================================================================
// DRIVER TWIN SCHEMAS
// ============================================================================

// Enums
export const DriverStatusSchema = z.enum(['online', 'busy', 'offline', 'break', 'suspended']);
export const LicenseTypeSchema = z.enum(['standard', 'commercial', 'professional', 'motorcycle', 'bus']);
export const BackgroundCheckStatusSchema = z.enum(['clear', 'pending', 'failed']);
export const VehicleCategorySchema = z.enum(['sedan', 'suv', 'van', 'truck', 'motorcycle', 'electric', 'bike', 'scooter']);
export const ServiceTypeSchema = z.enum(['economy', 'comfort', 'premium', 'van', 'truck', 'moto']);

// ============================================================================
// DRIVER PROFILE SCHEMA
// ============================================================================

export const DriverProfileSchema = z.object({
  name: z.object({
    first: z.string().min(1, 'First name is required'),
    last: z.string().min(1, 'Last name is required'),
  }),
  email: z.string().email('Invalid email format'),
  phone: z.string().min(1, 'Phone is required'),
  photo_url: z.string().url().optional(),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format').optional(),
  language: z.string().default('en'),
});

export type DriverProfile = z.infer<typeof DriverProfileSchema>;

// ============================================================================
// LICENSING SCHEMA
// ============================================================================

export const DriverLicensingSchema = z.object({
  license_number: z.string().min(1, 'License number is required'),
  license_type: LicenseTypeSchema.default('standard'),
  license_expiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  license_images: z.array(z.string().url()).default([]),
  background_check: z.object({
    status: BackgroundCheckStatusSchema.default('pending'),
    completed_at: z.string().datetime().nullable().optional(),
  }).optional(),
});

export type DriverLicensing = z.infer<typeof DriverLicensingSchema>;

// ============================================================================
// STATUS SCHEMA
// ============================================================================

export const DriverLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  updated_at: z.string().datetime(),
});

export const DriverStatusSchema_Internal = z.object({
  current: DriverStatusSchema.default('offline'),
  location: DriverLocationSchema.optional(),
  vehicle_id: z.string().nullable().optional(),
  current_order_id: z.string().nullable().optional(),
});

export type DriverStatus = z.infer<typeof DriverStatusSchema_Internal>;

// ============================================================================
// PERFORMANCE SCHEMA
// ============================================================================

export const DriverPerformanceSchema = z.object({
  total_trips: z.number().int().min(0).default(0),
  total_distance_km: z.number().min(0).default(0),
  total_earnings: z.number().min(0).default(0),
  avg_rating: z.number().min(1).max(5).default(5),
  rating_count: z.number().int().min(0).default(0),
  acceptance_rate: z.number().min(0).max(100).default(100),
  cancellation_rate: z.number().min(0).max(100).default(0),
  on_time_rate: z.number().min(0).max(100).default(100),
});

export type DriverPerformance = z.infer<typeof DriverPerformanceSchema>;

// ============================================================================
// EARNINGS SCHEMA
// ============================================================================

export const LastPayoutSchema = z.object({
  amount: z.number().min(0),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
});

export const DriverEarningsSchema = z.object({
  today_earnings: z.number().min(0).default(0),
  week_earnings: z.number().min(0).default(0),
  month_earnings: z.number().min(0).default(0),
  pending_payout: z.number().min(0).default(0),
  last_payout: LastPayoutSchema.optional(),
});

export type DriverEarnings = z.infer<typeof DriverEarningsSchema>;

// ============================================================================
// SCHEDULE SCHEMA
// ============================================================================

export const DriverScheduleSchema = z.object({
  today_hours: z.number().min(0).default(0),
  week_hours: z.number().min(0).default(0),
  regulatory_hours_remaining: z.number().min(0).default(12),
  shift_start: z.string().datetime().nullable().optional(),
  shift_end: z.string().datetime().nullable().optional(),
});

export type DriverSchedule = z.infer<typeof DriverScheduleSchema>;

// ============================================================================
// DRIVER TWIN FULL SCHEMA
// ============================================================================

export const DriverTwinSchema = z.object({
  driver_id: z.string().min(1, 'Driver ID is required'),
  twin_id: z.string().optional(),
  profile: DriverProfileSchema,
  licensing: DriverLicensingSchema,
  status: DriverStatusSchema_Internal,
  performance: DriverPerformanceSchema,
  earnings: DriverEarningsSchema,
  schedule: DriverScheduleSchema,
  vehicle_id: z.string().nullable().optional(),
  fleet_id: z.string().nullable().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  version: z.number().int().default(1),
});

export type DriverTwin = z.infer<typeof DriverTwinSchema>;

// ============================================================================
// API REQUEST/RESPONSE SCHEMAS
// ============================================================================

export const CreateDriverTwinRequestSchema = DriverTwinSchema.omit({
  twin_id: true,
  created_at: true,
  updated_at: true,
  version: true,
  status: true,
  performance: true,
  earnings: true,
  schedule: true,
}).extend({
  driver_id: z.string().min(1),
});

export const UpdateDriverTwinRequestSchema = z.object({
  profile: DriverProfileSchema.partial().optional(),
  licensing: DriverLicensingSchema.partial().optional(),
  vehicle_id: z.string().nullable().optional(),
  fleet_id: z.string().nullable().optional(),
});

export const UpdateStatusRequestSchema = z.object({
  current: DriverStatusSchema,
  location: DriverLocationSchema.optional(),
  vehicle_id: z.string().nullable().optional(),
  current_order_id: z.string().nullable().optional(),
});

export const UpdateLocationRequestSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const UpdatePerformanceRequestSchema = z.object({
  total_trips: z.number().int().min(0).optional(),
  total_distance_km: z.number().min(0).optional(),
  total_earnings: z.number().min(0).optional(),
  avg_rating: z.number().min(1).max(5).optional(),
  rating_count: z.number().int().min(0).optional(),
  acceptance_rate: z.number().min(0).max(100).optional(),
  cancellation_rate: z.number().min(0).max(100).optional(),
  on_time_rate: z.number().min(0).max(100).optional(),
});

export const UpdateEarningsRequestSchema = z.object({
  today_earnings: z.number().min(0).optional(),
  week_earnings: z.number().min(0).optional(),
  month_earnings: z.number().min(0).optional(),
  pending_payout: z.number().min(0).optional(),
  last_payout: LastPayoutSchema.optional(),
});

export const UpdateScheduleRequestSchema = z.object({
  today_hours: z.number().min(0).optional(),
  week_hours: z.number().min(0).optional(),
  regulatory_hours_remaining: z.number().min(0).optional(),
  shift_start: z.string().datetime().nullable().optional(),
  shift_end: z.string().datetime().nullable().optional(),
});

export const StartShiftRequestSchema = z.object({
  vehicle_id: z.string().min(1, 'Vehicle ID is required'),
});

export const EndShiftRequestSchema = z.object({
  end_reason: z.enum(['end_of_day', 'break', 'personal']).default('end_of_day'),
});

export const RatingRequestSchema = z.object({
  rating: z.number().min(1).max(5),
  trip_id: z.string().optional(),
  order_id: z.string().optional(),
  feedback: z.string().optional(),
});

export const AcceptOrderRequestSchema = z.object({
  order_id: z.string().min(1, 'Order ID is required'),
});

export const CancelOrderRequestSchema = z.object({
  order_id: z.string().min(1, 'Order ID is required'),
  reason: z.string().optional(),
});

// API Response schemas
export const DriverTwinResponseSchema = DriverTwinSchema;
export const DriverTwinListResponseSchema = z.object({
  twins: z.array(DriverTwinSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

export const DriverStatsResponseSchema = z.object({
  total: z.number(),
  by_status: z.record(DriverStatusSchema, z.number()),
  avg_rating: z.number(),
  avg_acceptance_rate: z.number(),
  total_trips: z.number(),
  total_earnings: z.number(),
});

export const NearbyDriversRequestSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  radius_km: z.number().min(0.1).max(50).default(5),
  service_type: ServiceTypeSchema.optional(),
  available_only: z.boolean().default(true),
});

// Type exports
export type CreateDriverTwinRequest = z.infer<typeof CreateDriverTwinRequestSchema>;
export type UpdateDriverTwinRequest = z.infer<typeof UpdateDriverTwinRequestSchema>;
export type UpdateStatusRequest = z.infer<typeof UpdateStatusRequestSchema>;
export type UpdateLocationRequest = z.infer<typeof UpdateLocationRequestSchema>;
export type UpdatePerformanceRequest = z.infer<typeof UpdatePerformanceRequestSchema>;
export type UpdateEarningsRequest = z.infer<typeof UpdateEarningsRequestSchema>;
export type UpdateScheduleRequest = z.infer<typeof UpdateScheduleRequestSchema>;
export type StartShiftRequest = z.infer<typeof StartShiftRequestSchema>;
export type EndShiftRequest = z.infer<typeof EndShiftRequestSchema>;
export type RatingRequest = z.infer<typeof RatingRequestSchema>;
export type AcceptOrderRequest = z.infer<typeof AcceptOrderRequestSchema>;
export type CancelOrderRequest = z.infer<typeof CancelOrderRequestSchema>;
export type DriverTwinResponse = z.infer<typeof DriverTwinResponseSchema>;
export type DriverTwinListResponse = z.infer<typeof DriverTwinListResponseSchema>;
export type DriverStatsResponse = z.infer<typeof DriverStatsResponseSchema>;
export type NearbyDriversRequest = z.infer<typeof NearbyDriversRequestSchema>;
