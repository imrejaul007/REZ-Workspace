import Ajv, { JSONSchemaType } from 'ajv';
import addFormats from 'ajv-formats';

// Initialize AJV with formats
const ajv = new Ajv({ allErrors: true, coerceTypes: true });
addFormats(ajv);

// Enums
export enum LoyaltyTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum'
}

export enum SentimentTrend {
  IMPROVING = 'improving',
  STABLE = 'stable',
  DECLINING = 'declining'
}

export enum ChurnRisk {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export enum PreferredChannel {
  EMAIL = 'email',
  SMS = 'sms',
  APP_PUSH = 'app_push',
  WHATSAPP = 'whatsapp'
}

// Type definitions
export interface GuestProfile {
  name: string;
  email: string;
  phone: string;
  nationality?: string;
  languagePreference?: string;
  accessibilityNeeds?: string[];
}

export interface RoomPreferences {
  floorPreference?: string;
  viewPreference?: string;
  bedConfiguration?: string;
  temperatureSetting?: {
    default: number;
    range?: { min: number; max: number };
  };
  lightingPreference?: string;
  noiseTolerance?: number;
}

export interface DiningPreferences {
  dietaryRestrictions?: string[];
  allergies?: string[];
  favoriteItems?: string[];
  beveragePreferences?: string[];
  typicalSpendRange?: { min: number; max: number };
}

export interface AmenityPreferences {
  spaInterests?: string[];
  fitnessHabits?: boolean;
  poolUsage?: boolean;
  businessAmenities?: string[];
}

export interface CommunicationPreferences {
  preferredChannel: PreferredChannel;
  optIns?: string[];
  quietHours?: { start: string; end: string };
}

export interface GuestPreferences {
  room?: RoomPreferences;
  dining?: DiningPreferences;
  amenities?: AmenityPreferences;
  communication?: CommunicationPreferences;
}

export interface StayPatterns {
  typicalCheckInTime?: string;
  typicalCheckOutTime?: string;
  weekendVsWeekday?: string;
  seasonalPatterns?: string[];
  bookingLeadTime?: number;
}

export interface GuestSentiment {
  currentScore: number;
  trend: SentimentTrend;
  lastFeedbackDate?: string;
  keyTopics?: string[];
}

export interface LifetimeValue {
  clv: number;
  potentialClv?: number;
  churnRisk: ChurnRisk;
  recommendationEligibility?: boolean;
}

export interface CurrentStay {
  roomId?: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  children?: number;
  rateCode?: string;
  specialRequests?: string[];
  occasion?: string | null;
}

export interface GuestLoyalty {
  tier: LoyaltyTier;
  pointsBalance: number;
  memberSince?: string;
  totalStays?: number;
  totalSpend?: number;
}

export interface GuestTwinDocument {
  twinId: string;
  guestId: string;
  profile: GuestProfile;
  loyalty: GuestLoyalty;
  preferences: GuestPreferences;
  stayPatterns?: StayPatterns;
  sentiment?: GuestSentiment;
  lifetimeValue?: LifetimeValue;
  currentStay?: CurrentStay;
  stayHistory?: string[];
  propertyIds?: string[];
  createdAt: string;
  updatedAt: string;
}

// Request/Response DTOs
export interface CreateGuestTwinRequest {
  guestId: string;
  profile: GuestProfile;
  loyalty?: Partial<GuestLoyalty>;
  preferences?: GuestPreferences;
  stayPatterns?: StayPatterns;
  propertyId?: string;
}

export interface CreateGuestTwinResponse {
  twinId: string;
  guestId: string;
  twinOsEntityId: string;
  createdAt: string;
}

export interface GetGuestTwinResponse {
  twinId: string;
  guestId: string;
  twinOsEntityId: string;
  profile: GuestProfile;
  loyalty: GuestLoyalty;
  preferences: GuestPreferences;
  stayPatterns?: StayPatterns;
  sentiment?: GuestSentiment;
  lifetimeValue?: LifetimeValue;
  currentStay?: CurrentStay;
  stayHistory?: Array<{
    stayId: string;
    propertyId: string;
    checkIn: string;
    checkOut: string;
    roomId: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePreferencesRequest {
  preferences: GuestPreferences;
}

export interface UpdatePreferencesResponse {
  twinId: string;
  guestId: string;
  preferences: GuestPreferences;
  updatedAt: string;
}

// API Schemas for validation
export const createGuestTwinSchema = {
  type: 'object',
  properties: {
    guestId: { type: 'string', minLength: 1 },
    profile: {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 1 },
        email: { type: 'string', format: 'email' },
        phone: { type: 'string', minLength: 1 },
        nationality: { type: 'string' },
        languagePreference: { type: 'string' },
        accessibilityNeeds: { type: 'array', items: { type: 'string' } }
      },
      required: ['name', 'email', 'phone']
    },
    loyalty: {
      type: 'object',
      properties: {
        tier: { type: 'string', enum: ['bronze', 'silver', 'gold', 'platinum'] },
        pointsBalance: { type: 'number', minimum: 0 },
        memberSince: { type: 'string', format: 'date-time' },
        totalStays: { type: 'number', minimum: 0 },
        totalSpend: { type: 'number', minimum: 0 }
      }
    },
    preferences: { type: 'object' },
    stayPatterns: { type: 'object' },
    propertyId: { type: 'string' }
  },
  required: ['guestId', 'profile']
} as const;

export const updatePreferencesSchema = {
  type: 'object',
  properties: {
    preferences: {
      type: 'object',
      properties: {
        room: { type: 'object' },
        dining: { type: 'object' },
        amenities: { type: 'object' },
        communication: { type: 'object' }
      }
    }
  },
  required: ['preferences']
} as const;

// Validation functions
export const validateCreateGuestTwin = ajv.compile(createGuestTwinSchema);
export const validateUpdatePreferences = ajv.compile(updatePreferencesSchema);

// Default values
export const defaultLoyalty: GuestLoyalty = {
  tier: LoyaltyTier.BRONZE,
  pointsBalance: 0
};

export const defaultPreferences: GuestPreferences = {
  communication: {
    preferredChannel: PreferredChannel.EMAIL
  }
};

export const defaultSentiment: GuestSentiment = {
  currentScore: 50,
  trend: SentimentTrend.STABLE
};

export const defaultLifetimeValue: LifetimeValue = {
  clv: 0,
  churnRisk: ChurnRisk.LOW,
  recommendationEligibility: true
};
