import {
  CustomerPoints,
  ICustomerPoints,
} from '../models/CustomerPoints';
import { PointsTransaction } from '../models/PointsTransaction';
import { LoyaltyProgram } from '../models/LoyaltyProgram';
import {
  TIER_THRESHOLDS,
  TIER_MULTIPLIERS,
  TIER_NAMES,
  TRANSACTION_TYPES,
} from '../config/constants';
import type { TierName } from '../config/constants';

export interface TierBenefits {
  pointsMultiplier: number;
  redemptionPercentage: number;
  birthdayBonus: boolean;
  prioritySupport: boolean;
  exclusiveAccess: boolean;
  freeDelivery: boolean;
}

export interface TierInfo {
  name: TierName;
  benefits: TierBenefits;
  threshold: number;
  color: string;
}

export const TIER_BENEFITS: Record<TierName, TierBenefits> = {
  BRONZE: {
    pointsMultiplier: TIER_MULTIPLIERS.BRONZE,
    redemptionPercentage: 25,
    birthdayBonus: true,
    prioritySupport: false,
    exclusiveAccess: false,
    freeDelivery: false,
  },
  SILVER: {
    pointsMultiplier: TIER_MULTIPLIERS.SILVER,
    redemptionPercentage: 50,
    birthdayBonus: true,
    prioritySupport: true,
    exclusiveAccess: false,
    freeDelivery: false,
  },
  GOLD: {
    pointsMultiplier: TIER_MULTIPLIERS.GOLD,
    redemptionPercentage: 75,
    birthdayBonus: true,
    prioritySupport: true,
    exclusiveAccess: true,
    freeDelivery: true,
  },
  PLATINUM: {
    pointsMultiplier: TIER_MULTIPLIERS.PLATINUM,
    redemptionPercentage: 100,
    birthdayBonus: true,
    prioritySupport: true,
    exclusiveAccess: true,
    freeDelivery: true,
  },
};

export const TIER_COLORS: Record<TierName, string> = {
  BRONZE: '#CD7F32',
  SILVER: '#C0C0C0',
  GOLD: '#FFD700',
  PLATINUM: '#E5E4E2',
};

export class TierService {
  /**
   * Get all tier information with benefits
   */
  getAllTiers(): TierInfo[] {
    return TIER_NAMES.map((name) => ({
      name,
      threshold: TIER_THRESHOLDS[name],
      benefits: TIER_BENEFITS[name],
      color: TIER_COLORS[name],
    }));
  }

  /**
   * Get tier benefits for a specific tier
   */
  getTierBenefits(tier: TierName): TierBenefits {
    return TIER_BENEFITS[tier];
  }

  /**
   * Check if customer qualifies for tier upgrade
   */
  async checkTierUpgrade(
    customerId: string,
    programId: string
  ): Promise<{ upgraded: boolean; newTier: TierName | null }> {
    const customerPoints = await CustomerPoints.findOne({ customerId, programId });

    if (!customerPoints) {
      return { upgraded: false, newTier: null };
    }

    const { tier: newTier } = this.calculateTierFromPoints(customerPoints.lifetimePoints);

    if (newTier !== customerPoints.tier) {
      // Update customer tier
      const tierInfo = this.calculateTierFromPoints(customerPoints.lifetimePoints);
      customerPoints.tier = tierInfo.tier;
      customerPoints.nextTier = tierInfo.nextTier;
      customerPoints.pointsToNextTier = tierInfo.pointsToNextTier;
      customerPoints.tierProgress = tierInfo.tierProgress;
      await customerPoints.save();

      return { upgraded: true, newTier };
    }

    return { upgraded: false, newTier: null };
  }

  /**
   * Calculate tier from lifetime points
   */
  calculateTierFromPoints(lifetimePoints: number): {
    tier: TierName;
    nextTier: TierName | null;
    pointsToNextTier: number;
    tierProgress: number;
  } {
    let currentTier: TierName = 'BRONZE';
    let nextTier: TierName | null = null;
    let pointsToNextTier = TIER_THRESHOLDS.SILVER;
    let tierProgress = 0;

    for (const tier of [...TIER_NAMES].reverse()) {
      if (lifetimePoints >= TIER_THRESHOLDS[tier]) {
        currentTier = tier;
        const currentIndex = TIER_NAMES.indexOf(tier);

        if (currentIndex < TIER_NAMES.length - 1) {
          nextTier = TIER_NAMES[currentIndex + 1];
          const nextThreshold = TIER_THRESHOLDS[nextTier];
          const currentThreshold = TIER_THRESHOLDS[tier];
          const pointsInTier = lifetimePoints - currentThreshold;
          const tierRange = nextThreshold - currentThreshold;
          tierProgress = Math.round((pointsInTier / tierRange) * 100);
          pointsToNextTier = nextThreshold - lifetimePoints;
        } else {
          nextTier = null;
          pointsToNextTier = 0;
          tierProgress = 100;
        }
        break;
      }
    }

    return { tier: currentTier, nextTier, pointsToNextTier, tierProgress };
  }

  /**
   * Get tier summary with customer progress
   */
  async getCustomerTierSummary(
    customerId: string,
    programId: string
  ): Promise<{
    currentTier: TierInfo;
    nextTier: TierInfo | null;
    progress: number;
    pointsToNextTier: number;
    lifetimePoints: number;
    tierHistory: { tier: TierName; since: Date }[];
  } | null> {
    const customerPoints = await CustomerPoints.findOne({ customerId, programId });

    if (!customerPoints) {
      return null;
    }

    // Get tier upgrade history from transactions
    const tierUpgrades = await PointsTransaction.find({
      customerId,
      programId,
      type: 'ADJUST',
      'metadata.tierChange': { $exists: true },
    }).sort({ createdAt: 1 });

    const tierHistory = tierUpgrades.map((tx) => ({
      tier: tx.metadata?.newTier as TierName || 'BRONZE',
      since: tx.createdAt,
    }));

    // Add current tier
    if (tierHistory.length === 0 || tierHistory[tierHistory.length - 1].tier !== customerPoints.tier) {
      tierHistory.push({
        tier: customerPoints.tier as TierName,
        since: customerPoints.updatedAt,
      });
    }

    const currentTierInfo = this.getAllTiers().find((t) => t.name === customerPoints.tier)!;
    const nextTierInfo = customerPoints.nextTier
      ? this.getAllTiers().find((t) => t.name === customerPoints.nextTier)!
      : null;

    return {
      currentTier: currentTierInfo,
      nextTier: nextTierInfo,
      progress: customerPoints.tierProgress,
      pointsToNextTier: customerPoints.pointsToNextTier,
      lifetimePoints: customerPoints.lifetimePoints,
      tierHistory,
    };
  }

  /**
   * Calculate points value based on tier redemption rate
   */
  calculatePointsValue(points: number, tier: TierName): number {
    const redemptionRate = TIER_BENEFITS[tier].redemptionPercentage;
    const baseValue = points / 100; // 100 points = ₹1
    return Math.round(baseValue * (redemptionRate / 100) * 100) / 100;
  }

  /**
   * Get tier-specific offer eligibility
   */
  async getEligibleOffers(
    customerId: string,
    programId: string
  ): Promise<{
    tierExclusive: TierName[];
    birthdayBonus: boolean;
    freeDelivery: boolean;
    prioritySupport: boolean;
  } | null> {
    const customerPoints = await CustomerPoints.findOne({ customerId, programId });

    if (!customerPoints) {
      return null;
    }

    const benefits = TIER_BENEFITS[customerPoints.tier as TierName];

    return {
      tierExclusive: TIER_NAMES.filter((t) => {
        const tierIndex = TIER_NAMES.indexOf(t);
        const customerTierIndex = TIER_NAMES.indexOf(customerPoints.tier as TierName);
        return tierIndex <= customerTierIndex;
      }),
      birthdayBonus: benefits.birthdayBonus,
      freeDelivery: benefits.freeDelivery,
      prioritySupport: benefits.prioritySupport,
    };
  }
}
