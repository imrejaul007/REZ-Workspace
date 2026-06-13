import { z } from 'zod';

// Enums as Zod enums
export const VehicleCategorySchema = z.enum([
  'sedan', 'suv', 'van', 'truck', 'motorcycle', 'electric', 'bike', 'scooter'
]);

export const VehicleOwnershipTypeSchema = z.enum([
  'owned', 'leased', 'rented', 'partner'
]);

export const VehicleStatusSchema = z.enum([
  'available', 'busy', 'offline', 'maintenance', 'charging', 'cleaning'
]);

export const EngineStatusSchema = z.enum(['ok', 'warning', 'critical']);
export const BrakeStatusSchema = z.enum(['ok', 'warning', 'critical']);

// Sub-schemas
export const VehicleCapacitySchema = z.object({
  passengers: z.number().min(1),
  cargoWeightKg: z.number().min(0).default(0),
  cargoVolumeM3: z.number().min(0).default(0)
});

export const VehicleProfileSchema = z.object({
  vin: z.string().min(1, 'VIN is required'),
  licensePlate: z.string().min(1, 'License plate is required'),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.number().min(1900).max(new Date().getFullYear() + 1),
  color: z.string().min(1, 'Color is required'),
  category: VehicleCategorySchema,
  capacity: VehicleCapacitySchema
});

export const VehicleOwnershipSchema = z.object({
  type: VehicleOwnershipTypeSchema,
  ownerId: z.string().min(1, 'Owner ID is required'),
  fleetId: z.string().nullable().default(null)
});

export const VehicleLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  address: z.string().nullable().default(null),
  updatedAt: z.date().default(() => new Date())
});

export const VehicleDiagnosticsSchema = z.object({
  engineStatus: EngineStatusSchema.default('ok'),
  tirePressure: z.array(z.number()).default([]),
  brakeStatus: BrakeStatusSchema.default('ok'),
  oilLevel: z.number().min(0).max(100).default(100),
  coolantTemp: z.number().default(90),
  errorCodes: z.array(z.string()).default([])
});

export const VehicleTelemetrySchema = z.object({
  fuelLevel: z.number().min(0).max(100).nullable().default(null),
  batteryLevel: z.number().min(0).max(100).nullable().default(null),
  odometer: z.number().min(0).default(0),
  engineHours: z.number().min(0).default(0),
  diagnostics: VehicleDiagnosticsSchema.default(() => ({}))
});

export const MaintenanceRecordSchema = z.object({
  nextServiceDate: z.date().optional(),
  nextServiceKm: z.number().optional(),
  lastServiceDate: z.date().optional(),
  lastServiceKm: z.number().optional(),
  insuranceExpiry: z.date().optional(),
  registrationExpiry: z.date().optional(),
  inspectionExpiry: z.date().optional(),
  alerts: z.array(z.string()).default([])
});

export const VehicleUtilizationSchema = z.object({
  todayTrips: z.number().min(0).default(0),
  todayRevenue: z.number().min(0).default(0),
  weekTrips: z.number().min(0).default(0),
  weekRevenue: z.number().min(0).default(0),
  utilizationRate: z.number().min(0).max(100).default(0),
  avgTripDistanceKm: z.number().min(0).default(0),
  avgTripDurationMinutes: z.number().min(0).default(0)
});

export const VehicleCleanlinessSchema = z.object({
  lastCleaned: z.date().default(() => new Date()),
  cleanlinessScore: z.number().min(1).max(5).default(5),
  needsCleaning: z.boolean().default(false)
});

export const VehicleStatusInnerSchema = z.object({
  current: VehicleStatusSchema.default('offline'),
  location: VehicleLocationSchema.default(() => ({})),
  heading: z.number().default(0),
  speed: z.number().min(0).default(0),
  since: z.date().default(() => new Date())
});

// Request schemas
export const CreateVehicleSchema = z.object({
  profile: VehicleProfileSchema,
  ownership: VehicleOwnershipSchema,
  status: VehicleStatusSchema.optional(),
  location: VehicleLocationSchema.optional(),
  maintenance: MaintenanceRecordSchema.partial().optional()
});

export const UpdateVehicleStatusSchema = z.object({
  status: VehicleStatusSchema,
  location: VehicleLocationSchema.partial().optional(),
  heading: z.number().optional(),
  speed: z.number().min(0).optional()
});

export const UpdateVehicleTelemetrySchema = z.object({
  fuelLevel: z.number().min(0).max(100).nullable().optional(),
  batteryLevel: z.number().min(0).max(100).nullable().optional(),
  odometer: z.number().min(0).optional(),
  engineHours: z.number().min(0).optional(),
  diagnostics: VehicleDiagnosticsSchema.partial().optional()
});

export const LocationUpdateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  address: z.string().optional(),
  heading: z.number().optional(),
  speed: z.number().min(0).optional()
});

export const TelemetryUpdateSchema = z.object({
  fuelLevel: z.number().min(0).max(100).nullable().optional(),
  batteryLevel: z.number().min(0).max(100).nullable().optional(),
  odometer: z.number().min(0).optional(),
  engineHours: z.number().min(0).optional(),
  tirePressure: z.array(z.number()).optional(),
  oilLevel: z.number().min(0).max(100).optional(),
  coolantTemp: z.number().optional(),
  errorCodes: z.array(z.string()).optional()
});

export const UpdateMaintenanceSchema = z.object({
  nextServiceDate: z.date().optional(),
  nextServiceKm: z.number().optional(),
  lastServiceDate: z.date().optional(),
  lastServiceKm: z.number().optional(),
  insuranceExpiry: z.date().optional(),
  registrationExpiry: z.date().optional(),
  inspectionExpiry: z.date().optional()
});

export const UpdateUtilizationSchema = z.object({
  todayTrips: z.number().min(0).optional(),
  todayRevenue: z.number().min(0).optional(),
  weekTrips: z.number().min(0).optional(),
  weekRevenue: z.number().min(0).optional(),
  utilizationRate: z.number().min(0).max(100).optional(),
  avgTripDistanceKm: z.number().min(0).optional(),
  avgTripDurationMinutes: z.number().min(0).optional()
});

export const UpdateCleanlinessSchema = z.object({
  lastCleaned: z.date().optional(),
  cleanlinessScore: z.number().min(1).max(5).optional(),
  needsCleaning: z.boolean().optional()
});

// Query schemas
export const VehicleQuerySchema = z.object({
  status: VehicleStatusSchema.optional(),
  category: VehicleCategorySchema.optional(),
  fleetId: z.string().optional(),
  ownerId: z.string().optional(),
  minUtilization: z.number().min(0).max(100).optional(),
  maxUtilization: z.number().min(0).max(100).optional(),
  needsMaintenance: z.boolean().optional(),
  needsCleaning: z.boolean().optional(),
  limit: z.number().min(1).max(100).default(50),
  skip: z.number().min(0).default(0)
});

// Type exports
export type CreateVehicleInput = z.infer<typeof CreateVehicleSchema>;
export type UpdateVehicleStatusInput = z.infer<typeof UpdateVehicleStatusSchema>;
export type UpdateVehicleTelemetryInput = z.infer<typeof UpdateVehicleTelemetrySchema>;
export type LocationUpdateInput = z.infer<typeof LocationUpdateSchema>;
export type TelemetryUpdateInput = z.infer<typeof TelemetryUpdateSchema>;
export type UpdateMaintenanceInput = z.infer<typeof UpdateMaintenanceSchema>;
export type UpdateUtilizationInput = z.infer<typeof UpdateUtilizationSchema>;
export type UpdateCleanlinessInput = z.infer<typeof UpdateCleanlinessSchema>;
export type VehicleQueryInput = z.infer<typeof VehicleQuerySchema>;
