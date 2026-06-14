/**
 * REZ Loyalty Gateway - Unified Types
 * Single source of truth for all loyalty-related types
 */

// ============================================================
// CANONICAL COIN TYPES (Source of Truth: REZ-unified-loyalty)
// ============================================================

export enum CoinType {
  REZ = 'REZ',
  PROMO = 'PROMO',
  BRANDED = 'BRANDED',
  PRIVE = 'PRIVE',
  CASHBACK = 'CASHBACK',
  REFERRAL = 'REFERRAL'
}

// Legacy aliases mapped to canonical types
export const COIN_TYPE_ALIASES: Record<string, CoinType> = {
  // Legacy aliases
  nuqta: CoinType.REZ,
  wasil_coins: CoinType.REZ,
  wasil_bonus: CoinType.REZ,
  earning: CoinType.REZ,
  earnings: CoinType.REZ,
  karma_points: CoinType.REZ,
  karma_coins: CoinType.REZ,
  rez_coins: CoinType.REZ,
  wallet_coins: CoinType.REZ,
  platform_coins: CoinType.REZ,
  loyalty: CoinType.REZ,
  reward: CoinType.PROMO,
  bonus: CoinType.PROMO,
  promotional: CoinType.PROMO,
  promotional_coins: CoinType.PROMO,
  branded_coin: CoinType.BRANDED,
  branded_coins: CoinType.BRANDED,
  prive_coins: CoinType.PRIVE,
  stayown_coins: CoinType.BRANDED,
  risnacare_coins: CoinType.BRANDED,
  khairmove_coins: CoinType.BRANDED,
};

/**
 * Normalize any coin type string to canonical CoinType
 */
export function normalizeCoinType(input: string): CoinType {
  const normalized = input.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  return COIN_TYPE_ALIASES[normalized] ?? CoinType.REZ;
}

// ============================================================
// TIER LEVELS
// ============================================================

export enum TierLevel {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM'
}

export enum PriveTier {
  NONE = 'none',
  ENTRY = 'entry',
  SIGNATURE = 'signature',
  ELITE = 'elite'
}

// Prive 6-Pillar types
export type PillarId = 'engagement' | 'trust' | 'influence' | 'economic' | 'brand_affinity' | 'network';

export interface PillarScore {
  id: PillarId;
  name: string;
  shortName: string;
  score: number;
  weight: number;
  weightedScore: number;
  trend: 'up' | 'down' | 'stable';
  icon: string;
  color: string;
  description: string;
  improvementTips: string[];
}

// ============================================================
// TRANSACTION TYPES
// ============================================================

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

// ============================================================
// REWARD TYPES
// ============================================================

export enum RewardCategory {
  DISCOUNT = 'DISCOUNT',
  FREE_ITEM = 'FREE_ITEM',
  CASHBACK = 'CASHBACK',
  EXPERIENCE = 'EXPERIENCE',
  TIER_UPGRADE = 'TIER_UPGRADE',
  PARTNER_OFFER = 'PARTNER_OFFER'
}

export enum RewardStatus {
  AVAILABLE = 'AVAILABLE',
  CLAIMED = 'CLAIMED',
  EXPIRED = 'EXPIRED',
  USED = 'USED'
}

// ============================================================
// TIER BENEFITS CONFIGURATION
// ============================================================

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

export const TIER_THRESHOLDS: Record<string, number> = {
  bronze: 0,
  silver: 1000,
  gold: 5000,
  platinum: 20000
};

// Prive tier configuration
export const PRIVE_TIER_CONFIG: Record<PriveTier, { minScore: number; maxScore: number; multiplier: number; monthlyBonus: number }> = {
  [PriveTier.NONE]: { minScore: 0, maxScore: 49, multiplier: 0, monthlyBonus: 0 },
  [PriveTier.ENTRY]: { minScore: 50, maxScore: 69, multiplier: 1.0, monthlyBonus: 0 },
  [PriveTier.SIGNATURE]: { minScore: 70, maxScore: 84, multiplier: 1.25, monthlyBonus: 500 },
  [PriveTier.ELITE]: { minScore: 85, maxScore: 100, multiplier: 1.5, monthlyBonus: 1000 }
};

// ============================================================
// UNIFIED BALANCE TYPES
// ============================================================

export interface CoinBalance {
  available: number;
  locked: number;
  expired: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  expiresAt?: Date;
}

export interface REZBalance extends CoinBalance {
  totalValueUSD: number;
  conversionRate: number;
}

export interface BrandedBalance extends CoinBalance {
  byMerchant: Record<string, number>;
}

export interface PriveBalance extends CoinBalance {
  score: number;
  tier: PriveTier;
  pillars: PillarScore[];
}

export interface UnifiedBalance {
  userId: string;
  balances: {
    REZ: REZBalance;
    PROMO: CoinBalance;
    BRANDED: BrandedBalance;
    PRIVE: PriveBalance;
    CASHBACK: CoinBalance;
    REFERRAL: CoinBalance;
  };
  totalValueUSD: number;
  conversionRate: number;
  lastSyncedAt: Date;
  syncStatus: 'synced' | 'partial' | 'stale';
}

// ============================================================
// HYBRID TIER INFO
// ============================================================

export interface HybridTierInfo {
  userId: string;
  rezTier: TierLevel;
  priveTier?: PriveTier;
  priveScore?: number;
  privePillars?: PillarScore[];
  combinedMultiplier: number;
  benefits: TierBenefits;
  tierProgress: number;
  coinsToNextTier: number;
  nextTier?: TierLevel;
}

// ============================================================
// EARN/REDEEM PARAMS
// ============================================================

export interface EarnParams {
  userId: string;
  amount: number;
  coinType: CoinType;
  source: CoinSource;
  description: string;
  referenceId?: string;
  metadata?: Record<string, unknown>;
  context?: 'default' | 'restaurant' | 'prive' | 'referral';
}

export interface RedeemParams {
  userId: string;
  amount: number;
  coinType: CoinType;
  description: string;
  referenceId?: string;
  metadata?: Record<string, unknown>;
  context?: 'default' | 'restaurant' | 'prive' | 'referral';
}

export interface EarnResult {
  success: boolean;
  transactionId: string;
  newBalance: number;
  coinType: CoinType;
  message: string;
}

export interface RedeemResult {
  success: boolean;
  transactionId: string;
  newBalance: number;
  coinType: CoinType;
  message: string;
}

// ============================================================
// TRANSACTION HISTORY
// ============================================================

export interface UnifiedTransaction {
  id: string;
  userId: string;
  coinType: CoinType;
  amount: number;
  type: TransactionType;
  source: CoinSource;
  description: string;
  referenceId?: string;
  expiresAt?: Date;
  createdAt: Date;
  sourceService: string;
}

// ============================================================
// EVENT TYPES (for Redis pub/sub)
// ============================================================

export interface CoinSyncEvent {
  eventId: string;
  eventType: 'coin.earned' | 'coin.redeemed' | 'coin.expired' | 'coin.transferred';
  userId: string;
  sourceApp: string;
  coinType: CoinType;
  amount: number;
  transactionId: string;
  referenceId: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface TierChangedEvent {
  eventId: string;
  eventType: 'tier.changed';
  userId: string;
  previousTier: TierLevel;
  newTier: TierLevel;
  source: string;
  timestamp: string;
}

// ============================================================
// SERVICE REGISTRY
// ============================================================

export interface ServiceConfig {
  name: string;
  baseUrl: string;
  timeout: number;
  circuitBreaker: {
    failures: number;
    resetTimeout: number;
  };
}

export const SERVICE_REGISTRY: Record<string, ServiceConfig> = {
  wallet: {
    name: 'wallet-service',
    baseUrl: process.env.WALLET_SERVICE_URL || 'http://localhost:4004',
    timeout: 10000,
    circuitBreaker: { failures: 5, resetTimeout: 30000 }
  },
  unifiedLoyalty: {
    name: 'unified-loyalty',
    baseUrl: process.env.UNIFIED_LOYALTY_URL || 'http://localhost:4602',
    timeout: 10000,
    circuitBreaker: { failures: 5, resetTimeout: 30000 }
  },
  prive: {
    name: 'prive-service',
    baseUrl: process.env.PRIVE_SERVICE_URL || 'http://localhost:4070',
    timeout: 10000,
    circuitBreaker: { failures: 5, resetTimeout: 30000 }
  },
  restaurantLoyalty: {
    name: 'restaurant-loyalty',
    baseUrl: process.env.RESTAURANT_LOYALTY_URL || 'http://localhost:4301',
    timeout: 10000,
    circuitBreaker: { failures: 5, resetTimeout: 30000 }
  },
  referralOS: {
    name: 'referral-os',
    baseUrl: process.env.REFERRAL_OS_URL || 'http://localhost:4302',
    timeout: 10000,
    circuitBreaker: { failures: 5, resetTimeout: 30000 }
  },
  cashbackService: {
    name: 'cashback-service',
    baseUrl: process.env.CASHBACK_SERVICE_URL || 'http://localhost:4303',
    timeout: 10000,
    circuitBreaker: { failures: 5, resetTimeout: 30000 }
  }
};

// ============================================================
// COIN TYPE → SERVICE MAPPING
// ============================================================

export const COIN_TYPE_SERVICE_MAP: Record<CoinType, string> = {
  [CoinType.REZ]: 'wallet',
  [CoinType.PROMO]: 'wallet',
  [CoinType.BRANDED]: 'restaurantLoyalty',
  [CoinType.PRIVE]: 'prive',
  [CoinType.CASHBACK]: 'cashbackService',
  [CoinType.REFERRAL]: 'referralOS'
};

// ============================================================
// SPEND PRIORITY ORDER
// ============================================================

export const SPEND_PRIORITY: CoinType[] = [
  CoinType.PROMO,      // Spend promo first (limited time)
  CoinType.BRANDED,    // Then branded (merchant-specific)
  CoinType.PRIVE,      // Then prive (premium perks)
  CoinType.CASHBACK,   // Then cashback (purchase cashback)
  CoinType.REFERRAL,   // Then referral (referral bonuses)
  CoinType.REZ         // Finally REZ (universal reserve)
];
