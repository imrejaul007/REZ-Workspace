/**
 * Tier Benefits Configuration for ReZ Loyalty Program
 *
 * Defines the benefits and perks for each loyalty tier:
 * - Bronze: Entry level (0-999 points)
 * - Silver: 1000-2499 points
 * - Gold: 2500-4999 points
 * - Platinum: 5000+ points (max tier)
 */

export interface TierBenefit {
  cashback: number;           // percentage
  birthdayBonus: number;       // bonus points
  freeDelivery: boolean;
  prioritySupport: boolean;
  exclusiveAccess: boolean;
  anniversaryBonus: number;    // bonus points
  earlyAccess: boolean;
}

export interface TierConfig {
  name: string;
  minPoints: number;
  maxPoints: number;
  benefits: TierBenefit;
  perks: string[];
}

export const TIER_BENEFITS: Record<string, TierConfig> = {
  bronze: {
    name: 'Bronze',
    minPoints: 0,
    maxPoints: 999,
    benefits: {
      cashback: 1,
      birthdayBonus: 50,
      freeDelivery: false,
      prioritySupport: false,
      exclusiveAccess: false,
      anniversaryBonus: 0,
      earlyAccess: false,
    },
    perks: ['basic_rewards'],
  },
  silver: {
    name: 'Silver',
    minPoints: 1000,
    maxPoints: 2499,
    benefits: {
      cashback: 2,
      birthdayBonus: 100,
      freeDelivery: false,
      prioritySupport: false,
      exclusiveAccess: false,
      anniversaryBonus: 250,
      earlyAccess: false,
    },
    perks: ['basic_rewards', 'silver_exclusive'],
  },
  gold: {
    name: 'Gold',
    minPoints: 2500,
    maxPoints: 4999,
    benefits: {
      cashback: 3,
      birthdayBonus: 200,
      freeDelivery: true,
      prioritySupport: true,
      exclusiveAccess: false,
      anniversaryBonus: 500,
      earlyAccess: true,
    },
    perks: ['basic_rewards', 'silver_exclusive', 'gold_perks'],
  },
  platinum: {
    name: 'Platinum',
    minPoints: 5000,
    maxPoints: Infinity,
    benefits: {
      cashback: 5,
      birthdayBonus: 500,
      freeDelivery: true,
      prioritySupport: true,
      exclusiveAccess: true,
      anniversaryBonus: 1000,
      earlyAccess: true,
    },
    perks: ['basic_rewards', 'silver_exclusive', 'gold_perks', 'platinum_lounge'],
  },
};

export const TIER_ORDER = ['bronze', 'silver', 'gold', 'platinum'];

export function getTierBenefits(tier: string): TierConfig {
  return TIER_BENEFITS[tier.toLowerCase()] || TIER_BENEFITS.bronze;
}

export function calculateTier(userPoints: number): string {
  if (userPoints >= 5000) return 'platinum';
  if (userPoints >= 2500) return 'gold';
  if (userPoints >= 1000) return 'silver';
  return 'bronze';
}

export function getNextTier(currentTier: string): string | null {
  const currentIndex = TIER_ORDER.indexOf(currentTier.toLowerCase());
  if (currentIndex === -1 || currentIndex >= TIER_ORDER.length - 1) {
    return null;
  }
  return TIER_ORDER[currentIndex + 1];
}

export function getPointsToNextTier(userPoints: number, currentTier: string): number | null {
  const nextTier = getNextTier(currentTier);
  if (!nextTier) return null;

  const nextTierConfig = TIER_BENEFITS[nextTier];
  const pointsNeeded = nextTierConfig.minPoints - userPoints;
  return Math.max(0, pointsNeeded);
}

export function getTierProgress(userPoints: number): {
  currentTier: string;
  nextTier: string | null;
  pointsToNextTier: number | null;
  progressPercent: number;
} {
  const currentTier = calculateTier(userPoints);
  const nextTier = getNextTier(currentTier);
  const pointsToNextTier = getPointsToNextTier(userPoints, currentTier);

  let progressPercent = 100;
  if (nextTier) {
    const currentTierConfig = TIER_BENEFITS[currentTier];
    const tierRange = currentTierConfig.maxPoints - currentTierConfig.minPoints;
    const pointsInTier = userPoints - currentTierConfig.minPoints;
    progressPercent = Math.min(100, Math.round((pointsInTier / tierRange) * 100));
  }

  return {
    currentTier,
    nextTier,
    pointsToNextTier,
    progressPercent,
  };
}
