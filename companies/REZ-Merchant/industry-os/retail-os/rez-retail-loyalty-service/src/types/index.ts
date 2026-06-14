import { z } from 'zod';

// Reward Types
export enum RewardType {
  POINTS = 'points',
  DISCOUNT_PERCENT = 'discount_percent',
  DISCOUNT_AMOUNT = 'discount_amount',
  FREE_ITEM = 'free_item',
  FREE_DELIVERY = 'free_delivery',
  CASHBACK = 'cashback',
}

// Reward Status
export enum RewardStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
  REDEEMED = 'redeemed',
}

// Reward Schema
export const RewardSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  type: z.nativeEnum(RewardType),
  value: z.number().positive(),
  pointsCost: z.number().int().min(0),
  minPurchaseAmount: z.number().min(0).default(0),
  maxDiscountAmount: z.number().positive().optional(),
  applicableCategories: z.array(z.string()).default([]),
  applicableProducts: z.array(z.string()).default([]),
  usageLimit: z.number().int().positive().optional(),
  usageCount: z.number().int().min(0).default(0),
  validFrom: z.date().optional(),
  validUntil: z.date().optional(),
  isActive: z.boolean().default(true),
  image: z.string().url().optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type Reward = z.infer<typeof RewardSchema>;

// Tier Configuration
export const TierConfigSchema = z.object({
  tier: z.enum(['bronze', 'silver', 'gold', 'platinum', 'diamond']),
  name: z.string().min(1),
  minPoints: z.number().int().min(0),
  pointsMultiplier: z.number().positive().default(1),
  discountPercent: z.number().min(0).max(100).default(0),
  freeDeliveryThreshold: z.number().min(0).default(0),
  birthdayBonus: z.number().int().min(0).default(0),
  anniversaryBonus: z.number().int().min(0).default(0),
  perks: z.array(z.string()).default([]),
});

export type TierConfig = z.infer<typeof TierConfigSchema>;

// Loyalty Program Schema
export const LoyaltyProgramSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  pointsPerRupee: z.number().positive().default(1),
  rupeesPerPoint: z.number().positive().default(0.25),
  pointsExpirationDays: z.number().int().positive().optional(),
  minRedemptionPoints: z.number().int().min(1).default(100),
  welcomePoints: z.number().int().min(0).default(0),
  referralPoints: z.number().int().min(0).default(0),
  tiers: z.array(TierConfigSchema).default([]),
  isActive: z.boolean().default(true),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type LoyaltyProgram = z.infer<typeof LoyaltyProgramSchema>;

// Customer Loyalty Record
export const CustomerLoyaltySchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  programId: z.string().uuid(),
  currentTier: z.enum(['bronze', 'silver', 'gold', 'platinum', 'diamond']).default('bronze'),
  totalPoints: z.number().int().min(0).default(0),
  availablePoints: z.number().int().min(0).default(0),
  lifetimePoints: z.number().int().min(0).default(0),
  pointsEarned: z.number().int().min(0).default(0),
  pointsRedeemed: z.number().int().min(0).default(0),
  tierProgress: z.number().min(0).max(100).default(0),
  nextTier: z.enum(['bronze', 'silver', 'gold', 'platinum', 'diamond']).nullable().optional(),
  pointsToNextTier: z.number().int().min(0).default(0),
  birthdayPointsClaimed: z.boolean().default(false),
  anniversaryPointsClaimed: z.boolean().default(false),
  lastActivityDate: z.date().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type CustomerLoyalty = z.infer<typeof CustomerLoyaltySchema>;

// Points Transaction
export const PointsTransactionSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  type: z.enum(['earned', 'redeemed', 'expired', 'adjusted', 'bonus']),
  points: z.number().int(),
  balance: z.number().int(),
  orderId: z.string().optional(),
  rewardId: z.string().uuid().optional(),
  description: z.string().optional(),
  expiresAt: z.date().optional(),
  isExpired: z.boolean().default(false),
  createdAt: z.date().default(() => new Date()),
});

export type PointsTransaction = z.infer<typeof PointsTransactionSchema>;

// Redemption Record
export const RedemptionSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  rewardId: z.string().uuid(),
  pointsSpent: z.number().int(),
  rewardValue: z.number(),
  orderId: z.string().optional(),
  couponCode: z.string().optional(),
  isUsed: z.boolean().default(false),
  usedAt: z.date().optional(),
  expiresAt: z.date().optional(),
  createdAt: z.date().default(() => new Date()),
});

export type Redemption = z.infer<typeof RedemptionSchema>;

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
