import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true, coerceTypes: true });
addFormats(ajv);

// Enums
export enum VenueType {
  RESTAURANT = 'restaurant',
  BAR = 'bar',
  SPA = 'spa',
  GYM = 'gym',
  POOL = 'pool',
  MEETING_ROOM = 'meeting_room'
}

// Type definitions
export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Location {
  address: string;
  city: string;
  country: string;
  coordinates: Coordinates;
  timezone: string;
}

export interface InventoryByType {
  [roomType: string]: number;
}

export interface Inventory {
  totalRooms: number;
  byType: InventoryByType;
  availableToday: number;
  availableTomorrow: number;
}

export interface VenueHours {
  [day: string]: { open: string; close: string } | null;
}

export interface Venue {
  venueId: string;
  name: string;
  type: VenueType;
  capacity: number;
  hours: VenueHours;
  posRevenueCenterId: string;
  isActive: boolean;
}

export interface StaffByDepartment {
  [department: string]: number;
}

export interface Staff {
  totalCount: number;
  byDepartment: StaffByDepartment;
  onDutyNow: number;
}

export interface ServiceHours {
  [service: string]: { open: string; close: string } | null;
}

export interface Services {
  checkIn24h: boolean;
  conciergeAvailable: boolean;
  roomServiceHours: ServiceHours;
  housekeepingSchedule: ServiceHours;
}

export interface Revenue {
  todayRevenue: number;
  mtdRevenue: number;
  ytdRevenue: number;
  revpar: number;
  adr: number;
  occupancyRate: number;
}

export interface UpsellConfig {
  enabledUpgradeTypes: string[];
  maxUpgradeDiscount: number;
  upgradeProbabilityThreshold: number;
}

export interface PricingRules {
  seasonalPricing: boolean;
  weekendPricing: boolean;
  lastMinuteDiscount: number;
  earlyBirdDiscount: number;
}

export interface Settings {
  brandStandardsVersion: string;
  upsellConfig: UpsellConfig;
  pricingRules: PricingRules;
}

export interface PropertyTwinDocument {
  twinId: string;
  propertyId: string;
  brand: string;
  name: string;
  location: Location;
  inventory: Inventory;
  venues: Venue[];
  staff: Staff;
  services: Services;
  revenue: Revenue;
  settings: Settings;
  createdAt: string;
  updatedAt: string;
}

// Request/Response DTOs
export interface CreatePropertyTwinRequest {
  propertyId: string;
  brand: string;
  name: string;
  location: Location;
  inventory: Inventory;
  venues?: Venue[];
  staff?: Staff;
  services?: Services;
  settings?: Settings;
}

export interface CreatePropertyTwinResponse {
  twinId: string;
  propertyId: string;
  twinOsEntityId: string;
  createdAt: string;
}

export interface GetPropertyTwinResponse {
  twinId: string;
  propertyId: string;
  brand: string;
  name: string;
  location: Location;
  inventory: Inventory;
  venues: Venue[];
  staff: Staff;
  services: Services;
  revenue: Revenue;
  settings: Settings;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateVenueRequest {
  venueId: string;
  venue: Partial<Venue>;
}

export interface UpdateRevenueRequest {
  revenue: Partial<Revenue>;
}

// API Schemas for validation
export const createPropertyTwinSchema = {
  type: 'object',
  properties: {
    propertyId: { type: 'string', minLength: 1 },
    brand: { type: 'string', minLength: 1 },
    name: { type: 'string', minLength: 1 },
    location: {
      type: 'object',
      properties: {
        address: { type: 'string' },
        city: { type: 'string' },
        country: { type: 'string' },
        coordinates: {
          type: 'object',
          properties: {
            lat: { type: 'number' },
            lng: { type: 'number' }
          },
          required: ['lat', 'lng']
        },
        timezone: { type: 'string' }
      },
      required: ['city', 'country']
    },
    inventory: {
      type: 'object',
      properties: {
        totalRooms: { type: 'number', minimum: 0 },
        byType: { type: 'object' },
        availableToday: { type: 'number', minimum: 0 },
        availableTomorrow: { type: 'number', minimum: 0 }
      },
      required: ['totalRooms']
    },
    venues: { type: 'array' },
    staff: { type: 'object' },
    services: { type: 'object' },
    settings: { type: 'object' }
  },
  required: ['propertyId', 'brand', 'name', 'location', 'inventory']
} as const;

export const updateVenueSchema = {
  type: 'object',
  properties: {
    venueId: { type: 'string', minLength: 1 },
    venue: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        type: { type: 'string', enum: ['restaurant', 'bar', 'spa', 'gym', 'pool', 'meeting_room'] },
        capacity: { type: 'number', minimum: 0 },
        hours: { type: 'object' },
        posRevenueCenterId: { type: 'string' },
        isActive: { type: 'boolean' }
      }
    }
  },
  required: ['venueId', 'venue']
} as const;

export const updateRevenueSchema = {
  type: 'object',
  properties: {
    revenue: {
      type: 'object',
      properties: {
        todayRevenue: { type: 'number', minimum: 0 },
        mtdRevenue: { type: 'number', minimum: 0 },
        ytdRevenue: { type: 'number', minimum: 0 },
        revpar: { type: 'number', minimum: 0 },
        adr: { type: 'number', minimum: 0 },
        occupancyRate: { type: 'number', minimum: 0, maximum: 100 }
      }
    }
  },
  required: ['revenue']
} as const;

// Validation functions
export const validateCreatePropertyTwin = ajv.compile(createPropertyTwinSchema);
export const validateUpdateVenue = ajv.compile(updateVenueSchema);
export const validateUpdateRevenue = ajv.compile(updateRevenueSchema);

// Default values
export const defaultStaff: Staff = {
  totalCount: 0,
  byDepartment: {},
  onDutyNow: 0
};

export const defaultServices: Services = {
  checkIn24h: true,
  conciergeAvailable: true,
  roomServiceHours: {},
  housekeepingSchedule: {}
};

export const defaultRevenue: Revenue = {
  todayRevenue: 0,
  mtdRevenue: 0,
  ytdRevenue: 0,
  revpar: 0,
  adr: 0,
  occupancyRate: 0
};

export const defaultSettings: Settings = {
  brandStandardsVersion: '1.0.0',
  upsellConfig: {
    enabledUpgradeTypes: ['deluxe', 'suite', 'penthouse'],
    maxUpgradeDiscount: 30,
    upgradeProbabilityThreshold: 0.5
  },
  pricingRules: {
    seasonalPricing: true,
    weekendPricing: true,
    lastMinuteDiscount: 10,
    earlyBirdDiscount: 15
  }
};
