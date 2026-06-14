// Profile Types - Static/Semi-static data only
// Real-time data comes from Wallet + REE

export interface UserProfile {
  id: string;
  phone?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  bio?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  role: 'user' | 'consumer' | 'merchant' | 'admin' | 'support' | 'operator' | 'super_admin';
  segment: IdentitySegment;
  isVerified: boolean;
  isOnboarded: boolean;
  createdAt: string;
  updatedAt: string;
  // Lifetime spend for tier calculations
  lifetimeSpend?: number;
}

export type IdentitySegment =
  | 'normal'
  | 'verified'
  | 'student'
  | 'pro'
  | 'creator'
  | 'business'
  | 'influencer'
  | 'host'
  | 'vip';

export interface Preferences {
  language: string;
  currency: string;
  theme: 'light' | 'dark';
  notifications: {
    push: boolean;
    sms: boolean;
    email: boolean;
    whatsapp: boolean;
  };
}

export interface Address {
  id: string;
  label: 'home' | 'office' | 'other';
  name?: string;
  phone?: string;
  address: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  isDefault: boolean;
  instructions?: string;
}

export interface PaymentMethod {
  id: string;
  type: 'upi' | 'card' | 'netbanking' | 'wallet';
  isDefault: boolean;
  upi?: { id: string };
  card?: { last4: string; brand: string; expiry: string };
}

export interface CachedTier {
  subscriptionTier: string;
  karmaTier: string;
  cachedAt: string;
  expiresAt: string;
}

export interface UserHiddenKB {
  behavioral: {
    avgOrderValue: number;
    orderFrequency: 'daily' | 'weekly' | 'monthly' | 'occasional';
    preferredCuisine: string[];
    preferredPriceRange: 'budget' | 'mid' | 'premium' | 'luxury';
    diningTime: string;
    partySize: number;
    leadTime: number;
  };
  intents: {
    lastIntent: string;
    dormantScore: number;
    predictedNext: string;
    churnRisk: number;
    ltv: number;
  };
  engagement: {
    lastActive: string;
    sessionCount: number;
    avgSessionDuration: number;
    conversionRate: number;
    npsScore?: number;
  };
  insights: {
    preferences: string[];
    triggers: string[];
    barriers: string[];
    bestTimeToNudge: string;
    preferredChannel: 'push' | 'sms' | 'whatsapp';
    sensitivityToDiscount: number;
    brandAffinity: Record<string, number>;
  };
}
