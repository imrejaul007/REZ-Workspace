import { z } from 'zod';

/**
 * Coin Types supported by the unified loyalty system
 */
export enum CoinType {
  REZ = 'REZ',           // Primary platform coins
  PROMO = 'PROMO',       // Promotional coins
  BRANDED = 'BRANDED',   // Brand-specific coins
  PRIVE = 'PRIVE'        // Premium/Exclusive coins
}

/**
 * User tier levels
 */
export enum TierLevel {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM'
}

/**
 * Transaction types for coin operations
 */
export enum TransactionType {
  EARN = 'EARN',
  REDEEM = 'REDEEM',
  EXPIRE = 'EXPIRE',
  ADJUST = 'ADJUST',
  TRANSFER_IN = 'TRANSFER_IN',
  TRANSFER_OUT = 'TRANSFER_OUT',
  BONUS = 'BONUS',
  REFUND = 'REFUND',
  SYNC_IN = 'SYNC_IN',
  SYNC_OUT = 'SYNC_OUT'
}

/**
 * Source applications for coin transactions
 */
export enum CoinSource {
  RABTUL_WALLET = 'RABTUL_WALLET',
  REZ_MEDIA_ENGAGEMENT = 'REZ_MEDIA_ENGAGEMENT',
  REZ_NOW = 'REZ_NOW',
  REZ_APP = 'REZ_APP',
  DOOH = 'DOOH',
  KARMA = 'KARMA',
  MANUAL = 'MANUAL',
  SYSTEM = 'SYSTEM'
}

/**
 * Reward categories
 */
export enum RewardCategory {
  DISCOUNT = 'DISCOUNT',
  FREE_ITEM = 'FREE_ITEM',
  CASHBACK = 'CASHBACK',
  EXPERIENCE = 'EXPERIENCE',
  TIER_UPGRADE = 'TIER_UPGRADE',
  PARTNER_OFFER = 'PARTNER_OFFER'
}

/**
 * Reward status
 */
export enum RewardStatus {
  AVAILABLE = 'AVAILABLE',
  CLAIMED = 'CLAIMED',
  EXPIRED = 'EXPIRED',
  USED = 'USED'
}

/**
 * User identification across apps
 */
export interface UserIdentity {
  userId: string;
  rbtulUserId?: string;
  rezMediaUserId?: string;
  rezNowUserId?: string;
  email?: string;
  phone?: string;
}

/**
 * Coin balance for a specific coin type
 */
export interface CoinBalance {
  coinType: CoinType;
  available: number;
  locked: number;
  expired: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
}

/**
 * Complete coin wallet for a user
 */
export interface CoinWallet {
  userId: string;
  balances: Map<CoinType, CoinBalance>;
  totalValueUSD: number;
  lastUpdated: Date;
}

/**
 * Coin transaction record
 */
export interface CoinTransaction {
  id: string;
  userId: string;
  coinType: CoinType;
  amount: number;
  type: TransactionType;
  source: CoinSource;
  sourceAppUserId?: string;
  description: string;
  referenceId?: string;
  relatedTransactionId?: string;
  expiresAt?: Date;
  tierAtTransaction: TierLevel;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

/**
 * Tier benefits
 */
export interface TierBenefits {
  tier: TierLevel;
  earningMultiplier: number;
  redemptionMultiplier: number;
  birthdayBonus: number;
  anniversaryBonus: number;
  exclusiveRewards: boolean;
  prioritySupport: boolean;
  freeDelivery: boolean;
  earlyAccess: boolean;
  maxCoinHolding: number;
}

/**
 * User tier status
 */
export interface TierStatus {
  userId: string;
  currentTier: TierLevel;
  lifetimeCoins: number;
  currentPeriodCoins: number;
  previousTier: TierLevel;
  tierProgress: number;
  nextTier?: TierLevel;
  coinsToNextTier: number;
  tierBenefits: TierBenefits;
  tierEnrolledAt: Date;
  tierValidUntil: Date;
  lastTierCalculation: Date;
}

/**
 * Reward definition
 */
export interface Reward {
  id: string;
  name: string;
  description: string;
  category: RewardCategory;
  coinCost: number;
  coinType: CoinType;
  discountValue?: number;
  freeItemId?: string;
  minTier: TierLevel;
  maxClaimPerUser: number;
  totalQuantity?: number;
  claimedQuantity: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  terms?: string;
  imageUrl?: string;
  metadata?: Record<string, unknown>;
}

/**
 * User reward claim
 */
export interface UserReward {
  id: string;
  userId: string;
  rewardId: string;
  reward: Reward;
  status: RewardStatus;
  claimedAt: Date;
  expiresAt: Date;
  usedAt?: Date;
  code?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Cross-app sync record
 */
export interface SyncRecord {
  id: string;
  userId: string;
  source: CoinSource;
  target: CoinSource;
  coinType: CoinType;
  amount: number;
  direction: 'IN' | 'OUT';
  status: 'PENDING' | 'SYNCED' | 'FAILED' | 'ROLLED_BACK';
  syncedAt?: Date;
  error?: string;
  retryCount: number;
  createdAt: Date;
}

/**
 * Birthday/Anniversary reward eligibility
 */
export interface SpecialEventEligibility {
  userId: string;
  eventType: 'BIRTHDAY' | 'ANNIVERSARY' | 'MEMBERSHIP_DAY';
  eventDate: Date;
  eligible: boolean;
  bonusPercentage: number;
  bonusCoins: number;
  rewardId?: string;
  alreadyClaimed: boolean;
}

/**
 * Tier threshold configuration
 */
export interface TierThresholds {
  bronze: number;
  silver: number;
  gold: number;
  platinum: number;
}

/**
 * Tier benefits by tier level
 */
export const TIER_BENEFITS: Record<TierLevel, TierBenefits> = {
  [TierLevel.BRONZE]: {
    tier: TierLevel.BRONZE,
    earningMultiplier: 1.0,
    redemptionMultiplier: 1.0,
    birthdayBonus: 50,
    anniversaryBonus: 100,
    exclusiveRewards: false,
    prioritySupport: false,
    freeDelivery: false,
    earlyAccess: false,
    maxCoinHolding: 10000
  },
  [TierLevel.SILVER]: {
    tier: TierLevel.SILVER,
    earningMultiplier: 1.25,
    redemptionMultiplier: 1.1,
    birthdayBonus: 100,
    anniversaryBonus: 250,
    exclusiveRewards: false,
    prioritySupport: false,
    freeDelivery: false,
    earlyAccess: false,
    maxCoinHolding: 25000
  },
  [TierLevel.GOLD]: {
    tier: TierLevel.GOLD,
    earningMultiplier: 1.5,
    redemptionMultiplier: 1.25,
    birthdayBonus: 250,
    anniversaryBonus: 500,
    exclusiveRewards: true,
    prioritySupport: true,
    freeDelivery: true,
    earlyAccess: true,
    maxCoinHolding: 50000
  },
  [TierLevel.PLATINUM]: {
    tier: TierLevel.PLATINUM,
    earningMultiplier: 2.0,
    redemptionMultiplier: 1.5,
    birthdayBonus: 500,
    anniversaryBonus: 1000,
    exclusiveRewards: true,
    prioritySupport: true,
    freeDelivery: true,
    earlyAccess: true,
    maxCoinHolding: 100000
  }
};

/**
 * Tier thresholds
 */
export const TIER_THRESHOLDS: TierThresholds = {
  bronze: 0,
  silver: 1000,
  gold: 5000,
  platinum: 20000
};

// Zod Schemas for validation

export const CoinTypeSchema = z.nativeEnum(CoinType);
export const TierLevelSchema = z.nativeEnum(TierLevel);
export const TransactionTypeSchema = z.nativeEnum(TransactionType);
export const CoinSourceSchema = z.nativeEnum(CoinSource);
export const RewardCategorySchema = z.nativeEnum(RewardCategory);
export const RewardStatusSchema = z.nativeEnum(RewardStatus);

export const EarnCoinsSchema = z.object({
  userId: z.string().min(1),
  amount: z.number().positive(),
  coinType: CoinTypeSchema.default(CoinType.REZ),
  source: CoinSourceSchema,
  description: z.string().min(1).max(500),
  referenceId: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
});

export const RedeemCoinsSchema = z.object({
  userId: z.string().min(1),
  amount: z.number().positive(),
  coinType: CoinTypeSchema.default(CoinType.REZ),
  description: z.string().min(1).max(500),
  referenceId: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
});

export const TransferCoinsSchema = z.object({
  fromUserId: z.string().min(1),
  toUserId: z.string().min(1),
  amount: z.number().positive(),
  coinType: CoinTypeSchema.default(CoinType.REZ),
  description: z.string().min(1).max(500)
});

export const GetBalanceSchema = z.object({
  userId: z.string().min(1),
  coinType: CoinTypeSchema.optional()
});

export const ClaimRewardSchema = z.object({
  userId: z.string().min(1),
  rewardId: z.string().min(1)
});

export const SyncCoinsSchema = z.object({
  userId: z.string().min(1),
  source: CoinSourceSchema,
  target: CoinSourceSchema,
  amount: z.number().positive(),
  coinType: CoinTypeSchema.default(CoinType.REZ),
  direction: z.enum(['IN', 'OUT'])
});

export type EarnCoinsInput = z.infer<typeof EarnCoinsSchema>;
export type RedeemCoinsInput = z.infer<typeof RedeemCoinsSchema>;
export type TransferCoinsInput = z.infer<typeof TransferCoinsSchema>;
export type GetBalanceInput = z.infer<typeof GetBalanceSchema>;
export type ClaimRewardInput = z.infer<typeof ClaimRewardSchema>;
export type SyncCoinsInput = z.infer<typeof SyncCoinsSchema>;
