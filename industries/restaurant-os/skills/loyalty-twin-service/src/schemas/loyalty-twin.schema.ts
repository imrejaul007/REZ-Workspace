// Loyalty Twin Schema - Defines types and validation for Loyalty Twin Service

export enum LoyaltyTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum'
}

export enum TransactionType {
  EARN = 'earn',
  REDEEM = 'redeem',
  BONUS = 'bonus',
  EXPIRE = 'expire',
  ADJUST = 'adjust'
}

export interface LoyaltyReward {
  rewardId: string;
  name: string;
  pointsCost: number;
  description: string;
  category: string;
  isActive: boolean;
}

export interface PointsTransaction {
  transactionId: string;
  customerId: string;
  type: TransactionType;
  points: number;
  orderId?: string;
  description: string;
  timestamp: string;
}

export interface TierBenefit {
  tier: LoyaltyTier;
  name: string;
  earnMultiplier: number;
  redeemMultiplier: number;
  benefits: string[];
  minPoints: number;
  maxPoints: number;
}

export interface LoyaltyTwinDocument {
  twinId: string;
  loyaltyId: string;
  merchantId: string;
  customerId: string;
  currentTier: LoyaltyTier;
  pointsBalance: number;
  lifetimePoints: number;
  tierProgress: number;
  transactions: PointsTransaction[];
  rewards: LoyaltyReward[];
  tierBenefits: TierBenefit[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateLoyaltyTwinRequest {
  customerId: string;
  merchantId: string;
}

export interface CreateLoyaltyTwinResponse {
  twinId: string;
  loyaltyId: string;
  customerId: string;
  twinOsEntityId: string;
  currentTier: LoyaltyTier;
  pointsBalance: number;
  createdAt: string;
}

export interface EarnPointsRequest {
  customerId: string;
  points: number;
  orderId?: string;
  description?: string;
}

export interface RedeemPointsRequest {
  customerId: string;
  points: number;
  rewardId?: string;
  description?: string;
}

export interface GetLoyaltyStatusResponse {
  twinId: string;
  customerId: string;
  currentTier: LoyaltyTier;
  pointsBalance: number;
  lifetimePoints: number;
  tierProgress: number;
  nextTier?: LoyaltyTier;
  pointsToNextTier: number;
}

// Tier thresholds
export const TIER_THRESHOLDS: Record<LoyaltyTier, number> = {
  [LoyaltyTier.BRONZE]: 0,
  [LoyaltyTier.SILVER]: 1000,
  [LoyaltyTier.GOLD]: 5000,
  [LoyaltyTier.PLATINUM]: 20000
};

// Default tier benefits
export const TIER_BENEFITS: TierBenefit[] = [
  { tier: LoyaltyTier.BRONZE, name: 'Bronze', earnMultiplier: 1, redeemMultiplier: 1, benefits: ['Basic rewards'], minPoints: 0, maxPoints: 999 },
  { tier: LoyaltyTier.SILVER, name: 'Silver', earnMultiplier: 1.1, redeemMultiplier: 1.1, benefits: ['5% bonus points', 'Birthday reward'], minPoints: 1000, maxPoints: 4999 },
  { tier: LoyaltyTier.GOLD, name: 'Gold', earnMultiplier: 1.2, redeemMultiplier: 1.2, benefits: ['10% bonus points', 'Priority service', 'Exclusive offers'], minPoints: 5000, maxPoints: 19999 },
  { tier: LoyaltyTier.PLATINUM, name: 'Platinum', earnMultiplier: 1.5, redeemMultiplier: 1.5, benefits: ['20% bonus points', 'VIP perks', 'Free delivery', 'Exclusive events'], minPoints: 20000, maxPoints: Infinity }
];