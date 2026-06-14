import { z } from 'zod';

// Address Schema
export const AddressSchema = z.object({
  street: z.string().min(1).max(200),
  area: z.string().min(1).max(100),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode format'),
  country: z.string().min(1).max(100).default('India'),
});

// Location Schema
export const LocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

// Demographics Schema
export const DemographicsSchema = z.object({
  totalFlats: z.number().int().positive(),
  occupiedFlats: z.number().int().nonnegative(),
  avgFamilySize: z.number().positive().default(4),
  estimatedResidents: z.number().int().nonnegative(),
  incomeLevel: z.enum(['low', 'middle', 'upper_middle', 'high']),
});

// Targeting Schema
export const TargetingSchema = z.object({
  enabled: z.boolean().default(true),
  minAge: z.number().int().min(0).max(120).optional(),
  maxAge: z.number().int().min(0).max(120).optional(),
  interests: z.array(z.string()).optional(),
  incomeBrackets: z.array(z.string()).optional(),
});

// Apartment Type Enum
export const ApartmentTypeSchema = z.enum(['apartment', 'gated_community', 'standalone']);

// Status Enum
export const StatusSchema = z.enum(['active', 'inactive']);

// Create Apartment Input
export const CreateApartmentSchema = z.object({
  name: z.string().min(1).max(200),
  type: ApartmentTypeSchema,
  address: AddressSchema,
  location: LocationSchema,
  demographics: DemographicsSchema,
  amenities: z.array(z.string()).default([]),
  nearbyPOIs: z.array(z.string()).default([]),
  targeting: TargetingSchema.default({ enabled: true }),
});

// Update Apartment Input
export const UpdateApartmentSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  type: ApartmentTypeSchema.optional(),
  address: AddressSchema.partial().optional(),
  location: LocationSchema.partial().optional(),
  demographics: DemographicsSchema.partial().optional(),
  amenities: z.array(z.string()).optional(),
  nearbyPOIs: z.array(z.string()).optional(),
  targeting: TargetingSchema.partial().optional(),
  status: StatusSchema.optional(),
});

// Create Targeting Config Input
export const CreateTargetingConfigSchema = z.object({
  enabled: z.boolean().default(true),
  minAge: z.number().int().min(0).max(120).optional(),
  maxAge: z.number().int().min(0).max(120).optional(),
  interests: z.array(z.string()).optional(),
  incomeBrackets: z.array(z.string()).optional(),
  targetDevices: z.number().int().positive().optional(),
  targetFamilies: z.number().int().positive().optional(),
});

// Nearby Query Schema
export const NearbyQuerySchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  radius: z.number().positive().default(5000), // meters
  limit: z.number().int().positive().max(100).default(20),
  incomeLevel: z.enum(['low', 'middle', 'upper_middle', 'high']).optional(),
  minResidents: z.number().int().nonnegative().optional(),
});

// List Query Schema
export const ListApartmentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  city: z.string().optional(),
  state: z.string().optional(),
  incomeLevel: z.enum(['low', 'middle', 'upper_middle', 'high']).optional(),
  type: ApartmentTypeSchema.optional(),
  status: StatusSchema.optional(),
  minResidents: z.number().int().nonnegative().optional(),
  maxResidents: z.number().int().positive().optional(),
  amenities: z.string().transform(s => s.split(',')).optional(),
  search: z.string().optional(),
});

// Types
export type Address = z.infer<typeof AddressSchema>;
export type Location = z.infer<typeof LocationSchema>;
export type Demographics = z.infer<typeof DemographicsSchema>;
export type Targeting = z.infer<typeof TargetingSchema>;
export type ApartmentType = z.infer<typeof ApartmentTypeSchema>;
export type Status = z.infer<typeof StatusSchema>;
export type CreateApartmentInput = z.infer<typeof CreateApartmentSchema>;
export type UpdateApartmentInput = z.infer<typeof UpdateApartmentSchema>;
export type CreateTargetingConfigInput = z.infer<typeof CreateTargetingConfigSchema>;
export type NearbyQuery = z.infer<typeof NearbyQuerySchema>;
export type ListApartmentsQuery = z.infer<typeof ListApartmentsQuerySchema>;

// Full Apartment Interface
export interface Apartment {
  apartmentId: string;
  name: string;
  type: ApartmentType;
  address: Address;
  location: Location;
  demographics: Demographics;
  amenities: string[];
  nearbyPOIs: string[];
  targeting: Targeting;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
}

// Targeting Config Interface
export interface TargetingConfig {
  targetingId: string;
  apartmentId: string;
  enabled: boolean;
  minAge?: number;
  maxAge?: number;
  interests?: string[];
  incomeBrackets?: string[];
  targetDevices?: number;
  targetFamilies?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Resident Stats Interface
export interface ResidentStats {
  apartmentId: string;
  totalFlats: number;
  occupiedFlats: number;
  estimatedResidents: number;
  avgFamilySize: number;
  occupancyRate: number;
  incomeLevel: string;
  estimatedHouseholds: number;
  estimatedTargetableDevices: number;
}

// API Response Types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
 };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// JWT Payload
export interface JWTPayload {
  userId: string;
  email: string;
  role: 'admin' | 'advertiser' | 'viewer';
  iat?: number;
  exp?: number;
}

// BuzzLocal Integration Types
export interface BuzzLocalApartment {
  apartmentId: string;
  name: string;
  residents: number;
  location: Location;
  societyId?: string;
}

export interface BuzzLocalIntegrationConfig {
  enabled: boolean;
  buzzLocalUrl: string;
  syncInterval: number; // minutes
  lastSyncAt?: Date;
}
