import { z } from 'zod';

// ============================================================================
// ROOM TWIN SCHEMAS
// ============================================================================

export const BedConfigurationRoomSchema = z.object({
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
    mode: z.enum(['heat', 'cool', 'auto', 'off']),
  }).optional(),
  lighting: z.object({
    scene: z.string(),
    brightness: z.number().min(0).max(100),
  }).optional(),
  blinds: z.enum(['open', 'closed', 'partial']).optional(),
  door_lock: z.enum(['locked', 'unlocked']).optional(),
  minibar_door: z.enum(['closed', 'open']).optional(),
  occupancy_sensor: z.boolean().optional(),
});

export const HousekeepingSchema = z.object({
  last_cleaned: z.string().datetime().optional(),
  next_scheduled: z.string().datetime().optional(),
  frequency: z.enum(['daily', 'weekly', 'on_departure']).default('daily'),
  supply_status: z.enum(['adequate', 'low', 'critical']).default('adequate'),
});

export const RevenueSchema = z.object({
  base_rate: z.number().min(0),
  rack_rate: z.number().min(0),
  minibar_balance: z.number().min(0).default(0),
  last_rate_update: z.string().datetime().optional(),
});

export const RoomCapacitySchema = z.object({
  max_adults: z.number().int().min(1).default(2),
  max_children: z.number().int().min(0).default(0),
  max_occupancy: z.number().int().min(1).default(2),
});

export const RoomTwinSchema = z.object({
  room_id: z.string().min(1, 'Room ID is required'),
  twin_id: z.string().optional(),
  property_id: z.string().optional(),
  room_number: z.string(),
  room_type: z.enum(['standard', 'deluxe', 'suite', 'penthouse', 'accessible']).default('standard'),
  floor: z.number().int().min(0),
  view: z.enum(['city', 'pool', 'garden', 'ocean', 'mountain']).default('city'),
  capacity: RoomCapacitySchema.default({}),
  bed_configuration: BedConfigurationRoomSchema.default({}),
  amenities: RoomAmenitiesSchema.default({}),
  status: RoomStatusSchema.default({}),
  iot_state: IoTStateSchema.default({}),
  housekeeping: HousekeepingSchema.default({}),
  revenue: RevenueSchema.default({}),
  current_guest_id: z.string().nullable().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  version: z.number().int().default(1),
});

export type RoomTwin = z.infer<typeof RoomTwinSchema>;

// ============================================================================
// API REQUEST/RESPONSE SCHEMAS
// ============================================================================

export const CreateRoomTwinRequestSchema = RoomTwinSchema.omit({
  twin_id: true,
  created_at: true,
  updated_at: true,
  version: true,
});

export const UpdateRoomStatusRequestSchema = z.object({
  status: z.enum(['available', 'occupied', 'blocked', 'out_of_order', 'cleaning', 'inspected']),
  next_available: z.string().datetime().optional(),
  maintenance_alerts: z.array(z.string()).optional(),
});

export const UpdateIoTStateRequestSchema = z.object({
  thermostat: z.object({
    current: z.number().optional(),
    target: z.number().optional(),
    mode: z.enum(['heat', 'cool', 'auto', 'off']).optional(),
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

export const RoomTwinResponseSchema = RoomTwinSchema;
export const RoomTwinListResponseSchema = z.object({
  twins: z.array(RoomTwinSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

export type CreateRoomTwinRequest = z.infer<typeof CreateRoomTwinRequestSchema>;
export type UpdateRoomStatusRequest = z.infer<typeof UpdateRoomStatusRequestSchema>;
export type UpdateIoTStateRequest = z.infer<typeof UpdateIoTStateRequestSchema>;
export type RoomTwinResponse = z.infer<typeof RoomTwinResponseSchema>;
export type RoomTwinListResponse = z.infer<typeof RoomTwinListResponseSchema>;
