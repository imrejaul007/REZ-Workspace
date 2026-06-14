import { z } from 'zod';

// Loyalty Tiers
export enum LoyaltyTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  DIAMOND = 'diamond',
}

// Customer Preferences
export const CustomerPreferencesSchema = z.object({
  newsletter: z.boolean().default(true),
  smsNotifications: z.boolean().default(false),
  pushNotifications: z.boolean().default(true),
  preferredContact: z.enum(['email', 'sms', 'phone', 'whatsapp']).default('email'),
  language: z.string().default('en'),
  currency: z.string().default('INR'),
});

export type CustomerPreferences = z.infer<typeof CustomerPreferencesSchema>;

// Customer Address
export const AddressSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['billing', 'shipping', 'both']).default('both'),
  name: z.string().min(1),
  phone: z.string().optional(),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string(),
  state: z.string(),
  postalCode: z.string(),
  country: z.string().default('India'),
  isDefault: z.boolean().default(false),
});

export type Address = z.infer<typeof AddressSchema>;

// Purchase History Entry
export const PurchaseHistoryEntrySchema = z.object({
  id: z.string().uuid(),
  orderId: z.string(),
  date: z.date(),
  total: z.number().min(0),
  items: z.number().int().positive(),
  pointsEarned: z.number().int().default(0),
  status: z.enum(['completed', 'refunded', 'partial_refund']),
});

export type PurchaseHistoryEntry = z.infer<typeof PurchaseHistoryEntrySchema>;

// Customer Schema
export const CustomerSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().optional(), // RABTUL user ID
  email: z.string().email().optional(),
  phone: z.string().optional(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().max(100).optional(),
  dateOfBirth: z.date().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  avatar: z.string().url().optional(),
  loyaltyTier: z.nativeEnum(LoyaltyTier).default(LoyaltyTier.BRONZE),
  loyaltyPoints: z.number().int().min(0).default(0),
  totalSpent: z.number().min(0).default(0),
  totalOrders: z.number().int().min(0).default(0),
  averageOrderValue: z.number().min(0).default(0),
  purchaseHistory: z.array(PurchaseHistoryEntrySchema).default([]),
  preferences: CustomerPreferencesSchema.default({}),
  addresses: z.array(AddressSchema).default([]),
  tags: z.array(z.string()).default([]),
  notes: z.string().max(1000).optional(),
  isActive: z.boolean().default(true),
  isVerified: z.boolean().default(false),
  lastPurchaseDate: z.date().optional(),
  firstPurchaseDate: z.date().optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type Customer = z.infer<typeof CustomerSchema>;
export type CustomerInput = Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>;

// Customer Segment
export const CustomerSegmentSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  criteria: z.record(z.unknown()), // Segment filter criteria
  customerCount: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  createdAt: z.date().default(() => new Date()),
});

export type CustomerSegment = z.infer<typeof CustomerSegmentSchema>;

// Customer Activity
export const CustomerActivitySchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  type: z.enum([
    'login', 'purchase', 'return', 'review', 'wishlist',
    'cart_abandon', 'newsletter_open', 'promotion_click',
    'birthday', 'anniversary', 'tier_upgrade', 'tier_downgrade'
  ]),
  description: z.string(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date().default(() => new Date()),
});

export type CustomerActivity = z.infer<typeof CustomerActivitySchema>;

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Customer Filter
export interface CustomerFilter {
  search?: string;
  loyaltyTier?: LoyaltyTier;
  tags?: string[];
  isActive?: boolean;
  isVerified?: boolean;
  minTotalSpent?: number;
  maxTotalSpent?: number;
  lastPurchaseAfter?: Date;
  lastPurchaseBefore?: Date;
}

// Segment Filter
export interface SegmentCriteria {
  loyaltyTier?: LoyaltyTier[];
  totalSpentMin?: number;
  totalSpentMax?: number;
  orderCountMin?: number;
  orderCountMax?: number;
  tags?: string[];
  lastPurchaseDays?: number;
  hasPurchasedInCategories?: string[];
}
