import { z } from 'zod';

// Place Types
export type PlaceType =
  | 'mall'
  | 'airport'
  | 'hospital'
  | 'hotel'
  | 'school'
  | 'office'
  | 'restaurant'
  | 'retail'
  | 'event_venue'
  | 'transit';

export type PlaceStatus = 'active' | 'inactive';

export type SizeCategory = 'small' | 'medium' | 'large';

export type IncomeLevel = 'low' | 'middle' | 'upper-middle' | 'high';

// Address Schema
export interface Address {
  street: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

// Location Schema
export interface GeoLocation {
  lat: number;
  lng: number;
}

// Place Attributes
export interface PlaceAttributes {
  size?: SizeCategory;
  ratings?: number;
  visitorCount?: number;
  operatingHours?: string;
  priceRange?: string;
}

// Demographics
export interface Demographics {
  ageGroups: Record<string, number>;
  genderSplit: Record<string, number>;
  incomeLevel: IncomeLevel;
}

// Visitor Patterns
export interface VisitorPatterns {
  peakHours: string[];
  busyDays: string[];
  seasonalTrends: string[];
}

// Audience Profile
export interface AudienceProfile {
  demographics: Demographics;
  visitorPatterns: VisitorPatterns;
  commonPurposes: string[];
}

// Advertising Options
export interface AdvertisingPricing {
  cpm: number;
  minBudget: number;
}

export interface Advertising {
  availableFormats: string[];
  pricing: AdvertisingPricing;
  targetingOptions: string[];
}

// Main Place Interface
export interface IPlace {
  placeId: string;
  name: string;
  type: PlaceType;
  category: string;
  address: Address;
  location: GeoLocation;
  attributes: PlaceAttributes;
  audienceProfile: AudienceProfile;
  advertising: Advertising;
  nearbyPlaces: string[];
  status: PlaceStatus;
  createdAt: Date;
  updatedAt: Date;
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

// Query Types
export interface PlaceFilters {
  type?: PlaceType;
  category?: string;
  city?: string;
  state?: string;
  status?: PlaceStatus;
  minRating?: number;
  size?: SizeCategory;
}

export interface NearbyQuery {
  lat: number;
  lng: number;
  radius: number; // in meters
  type?: PlaceType;
  limit?: number;
}

export interface SearchQuery {
  q: string;
  type?: PlaceType;
  city?: string;
  limit?: number;
  offset?: number;
}

// Zod Schemas for Validation
export const AddressSchema = z.object({
  street: z.string().min(1),
  area: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().min(1),
  country: z.string().min(1),
});

export const GeoLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const PlaceAttributesSchema = z.object({
  size: z.enum(['small', 'medium', 'large']).optional(),
  ratings: z.number().min(0).max(5).optional(),
  visitorCount: z.number().int().positive().optional(),
  operatingHours: z.string().optional(),
  priceRange: z.string().optional(),
});

export const DemographicsSchema = z.object({
  ageGroups: z.record(z.string(), z.number().min(0).max(100)),
  genderSplit: z.record(z.string(), z.number().min(0).max(100)),
  incomeLevel: z.enum(['low', 'middle', 'upper-middle', 'high']),
});

export const VisitorPatternsSchema = z.object({
  peakHours: z.array(z.string()),
  busyDays: z.array(z.string()),
  seasonalTrends: z.array(z.string()),
});

export const AudienceProfileSchema = z.object({
  demographics: DemographicsSchema,
  visitorPatterns: VisitorPatternsSchema,
  commonPurposes: z.array(z.string()),
});

export const AdvertisingPricingSchema = z.object({
  cpm: z.number().positive(),
  minBudget: z.number().positive(),
});

export const AdvertisingSchema = z.object({
  availableFormats: z.array(z.string()),
  pricing: AdvertisingPricingSchema,
  targetingOptions: z.array(z.string()),
});

export const CreatePlaceSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum([
    'mall',
    'airport',
    'hospital',
    'hotel',
    'school',
    'office',
    'restaurant',
    'retail',
    'event_venue',
    'transit',
  ]),
  category: z.string().min(1),
  address: AddressSchema,
  location: GeoLocationSchema,
  attributes: PlaceAttributesSchema.optional(),
  audienceProfile: AudienceProfileSchema.optional(),
  advertising: AdvertisingSchema.optional(),
  nearbyPlaces: z.array(z.string()).optional(),
});

export const UpdatePlaceSchema = CreatePlaceSchema.partial();

// JWT Payload
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Express Request with User
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

// Redis Cache Types
export interface CacheOptions {
  ttl?: number;
  prefix?: string;
}

// Audience Estimate
export interface AudienceEstimate {
  placeId: string;
  placeName: string;
  estimatedDaily: number;
  estimatedMonthly: number;
  demographics: Demographics;
  peakTimes: {
    morning: number;
    afternoon: number;
    evening: number;
    night: number;
  };
  reachability: {
    transitScore: number;
    parkingScore: number;
    accessibilityScore: number;
  };
}

// Place Statistics
export interface PlaceStatistics {
  totalPlaces: number;
  byType: Record<PlaceType, number>;
  byStatus: Record<PlaceStatus, number>;
  averageRating: number;
  topCategories: Array<{ category: string; count: number }>;
}

// Event Bus Types
export interface PlaceEvent {
  type: 'place_created' | 'place_updated' | 'place_deleted';
  placeId: string;
  data: Partial<IPlace>;
  timestamp: Date;
}