import { z } from 'zod';

// ============================================
// Room Twin Schemas
// ============================================

export const IoTDeviceSchema = z.object({
  deviceId: z.string(),
  deviceType: z.enum(['thermostat', 'lighting', 'locks', 'tv', 'minibar', 'climate', 'sensors', 'blinds']),
  manufacturer: z.string(),
  model: z.string(),
  firmwareVersion: z.string(),
  status: z.enum(['online', 'offline', 'error']).optional(),
  lastHeartbeat: z.date().optional(),
  metadata: z.record(z.unknown()).optional()
});

export const IoTStateSchema = z.object({
  temperature: z.number().min(-50).max(100).optional(),
  targetTemperature: z.number().min(-50).max(100).optional(),
  humidity: z.number().min(0).max(100).optional(),
  lighting: z.object({
    main: z.number().min(0).max(100).optional(),
    ambient: z.number().min(0).max(100).optional(),
    bathroom: z.number().min(0).max(100).optional()
  }).optional(),
  climate: z.object({
    mode: z.enum(['off', 'heat', 'cool', 'auto']).optional(),
    fanSpeed: z.enum(['auto', 'low', 'medium', 'high']).optional()
  }).optional(),
  blinds: z.object({
    level: z.number().min(0).max(100).optional(),
    mode: z.enum(['open', 'closed', 'auto']).optional()
  }).optional(),
  doorLock: z.boolean().optional(),
  minibar: z.object({
    doorOpen: z.boolean().optional(),
    items: z.array(z.object({
      productId: z.string(),
      name: z.string(),
      quantity: z.number().min(0),
      price: z.number().min(0)
    })).optional()
  }).optional(),
  tv: z.object({
    power: z.boolean().optional(),
    channel: z.number().min(0).optional(),
    volume: z.number().min(0).max(100).optional(),
    input: z.string().optional()
  }).optional(),
  occupancy: z.object({
    detected: z.boolean().optional(),
    lastMotion: z.date().optional(),
    guestPresent: z.boolean().optional()
  }).optional(),
  energy: z.object({
    consumption: z.number().min(0).optional(),
    unit: z.string().optional()
  }).optional(),
  timestamp: z.date().optional()
});

export const RoomFeaturesSchema = z.object({
  bedType: z.string(),
  maxOccupancy: z.number().min(1).max(10).optional(),
  size: z.number().positive(),
  sizeUnit: z.enum(['sqft', 'sqm']).optional(),
  view: z.string().optional(),
  balcony: z.boolean().optional(),
  floor: z.number(),
  amenities: z.array(z.string()).optional(),
  smoking: z.boolean().optional(),
  petFriendly: z.boolean().optional()
});

export const MaintenanceIssueSchema = z.object({
  reportedAt: z.date(),
  description: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  resolved: z.boolean().optional(),
  resolvedAt: z.date().optional()
});

export const CreateRoomTwinSchema = z.object({
  roomId: z.string().min(1),
  propertyId: z.string().min(1),
  floor: z.number().int().min(1),
  roomNumber: z.string().min(1),
  category: z.enum(['standard', 'deluxe', 'suite', 'penthouse', 'villa', 'accessible']).optional(),
  features: RoomFeaturesSchema,
  devices: z.array(IoTDeviceSchema).optional()
});

export const UpdateRoomTwinSchema = z.object({
  status: z.enum(['available', 'occupied', 'maintenance', 'out-of-order', 'cleaning', 'do-not-disturb']).optional(),
  occupancy: z.enum(['vacant', 'occupied', 'checked-out', 'reserved']).optional(),
  currentGuestId: z.string().optional(),
  currentReservationId: z.string().optional(),
  features: RoomFeaturesSchema.optional(),
  iotState: IoTStateSchema.optional()
});

export const RoomStatusResponseSchema = z.object({
  roomId: z.string(),
  roomNumber: z.string(),
  status: z.string(),
  occupancy: z.string(),
  iotState: IoTStateSchema,
  currentGuestId: z.string().nullable(),
  lastUpdated: z.date()
});

// ============================================
// Guest Twin Schemas
// ============================================

export const GuestProfileSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  nationality: z.string().optional(),
  idType: z.string().optional(),
  idNumber: z.string().optional(),
  dateOfBirth: z.date().optional(),
  profileImage: z.string().url().optional()
});

export const GuestPreferencesSchema = z.object({
  room: z.object({
    temperature: z.number().min(16).max(30).optional(),
    lighting: z.number().min(0).max(100).optional(),
    pillowType: z.string().optional(),
    bedConfiguration: z.string().optional()
  }).optional(),
  amenities: z.array(z.string()).optional(),
  dietary: z.array(z.string()).optional(),
  accessibility: z.array(z.string()).optional(),
  language: z.string().optional(),
  notifications: z.object({
    email: z.boolean().optional(),
    sms: z.boolean().optional(),
    push: z.boolean().optional()
  }).optional()
});

export const StayHistorySchema = z.object({
  reservationId: z.string(),
  propertyId: z.string(),
  roomId: z.string(),
  checkIn: z.date(),
  checkOut: z.date(),
  totalSpend: z.number().optional(),
  feedback: z.object({
    rating: z.number().min(1).max(5),
    comment: z.string().optional()
  }).optional()
});

export const CreateGuestTwinSchema = z.object({
  guestId: z.string().min(1),
  profile: GuestProfileSchema,
  loyalty: z.object({
    tier: z.enum(['bronze', 'silver', 'gold', 'platinum', 'diamond']).optional(),
    points: z.number().min(0).optional(),
    lifetimePoints: z.number().min(0).optional()
  }).optional(),
  preferences: GuestPreferencesSchema.optional()
});

export const UpdateGuestPreferencesSchema = z.object({
  preferences: GuestPreferencesSchema
});

export const GuestTwinResponseSchema = z.object({
  guestId: z.string(),
  profile: GuestProfileSchema,
  loyalty: z.object({
    tier: z.string(),
    points: z.number(),
    lifetimePoints: z.number(),
    memberSince: z.date()
  }),
  preferences: GuestPreferencesSchema,
  stayHistory: z.array(StayHistorySchema),
  sentiment: z.object({
    overall: z.number(),
    lastUpdated: z.date(),
    sources: z.array(z.string())
  }),
  createdAt: z.date(),
  updatedAt: z.date()
});

// ============================================
// Property Twin Schemas
// ============================================

export const VenueSchema = z.object({
  venueId: z.string(),
  name: z.string(),
  type: z.enum(['restaurant', 'bar', 'spa', 'gym', 'pool', 'conference', 'lounge']),
  capacity: z.number().min(0).optional(),
  operatingHours: z.object({
    open: z.string(),
    close: z.string(),
    days: z.array(z.number().int().min(0).max(6))
  }).optional(),
  amenities: z.array(z.string()).optional()
});

export const RevenueCenterSchema = z.object({
  centerId: z.string(),
  name: z.string(),
  type: z.enum(['fnb', 'spa', 'retail', 'parking', 'laundry', 'business']),
  revenue: z.number().min(0).optional(),
  target: z.number().min(0).optional(),
  currency: z.string().optional()
});

export const PropertyPoliciesSchema = z.object({
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  cancellationPolicy: z.string().optional(),
  petPolicy: z.string().optional(),
  smokingPolicy: z.string().optional(),
  paymentMethods: z.array(z.string()).optional(),
  depositRequired: z.boolean().optional(),
  depositAmount: z.number().min(0).optional()
});

export const CreatePropertyTwinSchema = z.object({
  propertyId: z.string().min(1),
  name: z.string().min(1),
  brand: z.string().min(1),
  type: z.enum(['hotel', 'resort', 'boutique', 'hostel', 'aparthotel']).optional(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    country: z.string(),
    postalCode: z.string(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number()
    }).optional()
  }),
  contact: z.object({
    phone: z.string(),
    email: z.string().email(),
    website: z.string().url().optional()
  }),
  venues: z.array(VenueSchema).optional(),
  amenities: z.array(z.string()).optional(),
  policies: PropertyPoliciesSchema.optional(),
  revenueCenters: z.array(RevenueCenterSchema).optional()
});

// ============================================
// IoT Event Schemas
// ============================================

export const IoTEventSchema = z.object({
  deviceId: z.string(),
  roomId: z.string(),
  eventType: z.enum(['state_change', 'heartbeat', 'alert', 'command_ack']),
  payload: z.record(z.unknown()),
  timestamp: z.date()
});

export const IoTCommandSchema = z.object({
  deviceId: z.string(),
  roomId: z.string(),
  command: z.string(),
  parameters: z.record(z.unknown()).optional()
});

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: Date;
    requestId: string;
  };
}

export function createSuccessResponse<T>(data: T, requestId: string): ApiResponse<T> {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date(),
      requestId
    }
  };
}

export function createErrorResponse(
  code: string,
  message: string,
  details?: unknown,
  requestId?: string
): ApiResponse<never> {
  return {
    success: false,
    error: {
      code,
      message,
      details
    },
    meta: {
      timestamp: new Date(),
      requestId: requestId || ''
    }
  };
}

// Type exports
export type CreateRoomTwinInput = z.infer<typeof CreateRoomTwinSchema>;
export type UpdateRoomTwinInput = z.infer<typeof UpdateRoomTwinSchema>;
export type CreateGuestTwinInput = z.infer<typeof CreateGuestTwinSchema>;
export type UpdateGuestPreferencesInput = z.infer<typeof UpdateGuestPreferencesSchema>;
export type CreatePropertyTwinInput = z.infer<typeof CreatePropertyTwinSchema>;
export type IoTEventInput = z.infer<typeof IoTEventSchema>;
export type IoTCommandInput = z.infer<typeof IoTCommandSchema>;
