/**
 * Cross-Merchant Service Test Suite
 *
 * Tests for:
 * - Cross-merchant loyalty aggregation
 * - Merchant-specific loyalty data
 * - Cross-merchant rewards calculation
 * - Merchant tier progression
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// ============================================================================
// Types
// ============================================================================

type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

interface Merchant {
  merchantId: string;
  name: string;
  category: string;
  location: string;
  tierConfig: TierConfig;
}

interface TierConfig {
  minSpend: number;
  maxSpend: number | null;
  cashbackPercent: number;
  pointsMultiplier: number;
  perks: string[];
}

interface MerchantLoyalty {
  userId: string;
  merchantId: string;
  visits: number;
  totalSpent: number;
  currentTier: LoyaltyTier;
  lifetimePoints: number;
  currentPoints: number;
  earnedCashback: number;
  lastVisit: Date | null;
  joinedAt: Date;
  badges: string[];
}

interface CrossMerchantProfile {
  userId: string;
  merchantLoyalties: Map<string, MerchantLoyalty>;
  aggregateStats: AggregateStats;
  overallTier: LoyaltyTier;
  crossMerchantBadges: string[];
}

interface AggregateStats {
  totalMerchants: number;
  totalSpent: number;
  totalVisits: number;
  averageOrderValue: number;
  favoriteMerchant?: string;
}

// ============================================================================
// Mock Data Generators
// ============================================================================

function generateMockMerchant(overrides?: Partial<Merchant>): Merchant {
  return {
    merchantId: `merchant_${Math.random().toString(36).substring(7)}`,
    name: 'Test Merchant',
    category: 'food',
    location: 'Mumbai',
    tierConfig: {
      minSpend: 0,
      maxSpend: 4999,
      cashbackPercent: 1,
      pointsMultiplier: 1.0,
      perks: ['Basic rewards'],
    },
    ...overrides,
  };
}

function generateMockMerchantLoyalty(overrides?: Partial<MerchantLoyalty>): MerchantLoyalty {
  return {
    userId: 'user_123',
    merchantId: 'merchant_001',
    visits: 5,
    totalSpent: 2500,
    currentTier: 'bronze',
    lifetimePoints: 250,
    currentPoints: 200,
    earnedCashback: 25,
    lastVisit: new Date(),
    joinedAt: new Date('2024-01-01'),
    badges: [],
    ...overrides,
  };
}

const TIER_THRESHOLDS: TierConfig[] = [
  { minSpend: 0, maxSpend: 4999, cashbackPercent: 1, pointsMultiplier: 1.0, perks: ['Basic rewards'] },
  { minSpend: 5000, maxSpend: 14999, cashbackPercent: 2, pointsMultiplier: 1.25, perks: ['Basic rewards', 'Birthday bonus'] },
  { minSpend: 15000, maxSpend: 49999, cashbackPercent: 3, pointsMultiplier: 1.5, perks: ['Basic rewards', 'Birthday bonus', 'Priority support'] },
  { minSpend: 50000, maxSpend: null, cashbackPercent: 5, pointsMultiplier: 2.0, perks: ['Basic rewards', 'Birthday bonus', 'Priority support', 'VIP events'] },
];

// ============================================================================
// Cross-Merchant Logic (to be tested)
// ============================================================================

function calculateMerchantTier(totalSpent: number): LoyaltyTier {
  if (totalSpent >= 50000) return 'platinum';
  if (totalSpent >= 15000) return 'gold';
  if (totalSpent >= 5000) return 'silver';
  return 'bronze';
}

function getTierConfig(tier: LoyaltyTier): TierConfig {
  const tierMap: Record<LoyaltyTier, TierConfig> = {
    bronze: TIER_THRESHOLDS[0],
    silver: TIER_THRESHOLDS[1],
    gold: TIER_THRESHOLDS[2],
    platinum: TIER_THRESHOLDS[3],
    diamond: TIER_THRESHOLDS[3], // Diamond uses platinum config with 2x multiplier
  };
  return tierMap[tier];
}

function calculateCashback(amount: number, tier: LoyaltyTier): number {
  const config = getTierConfig(tier);
  return Math.floor(amount * (config.cashbackPercent / 100) * 100) / 100;
}

function calculatePoints(amount: number, tier: LoyaltyTier): number {
  const config = getTierConfig(tier);
  const basePoints = Math.floor(amount / 10); // 1 point per 10 rupees
  return Math.floor(basePoints * config.pointsMultiplier);
}

function getPointsToNextTier(totalSpent: number): number {
  if (totalSpent >= 50000) return 0;
  if (totalSpent >= 15000) return 50000 - totalSpent;
  if (totalSpent >= 5000) return 15000 - totalSpent;
  return 5000 - totalSpent;
}

function calculateAggregateStats(loyalties: MerchantLoyalty[]): AggregateStats {
  if (loyalties.length === 0) {
    return {
      totalMerchants: 0,
      totalSpent: 0,
      totalVisits: 0,
      averageOrderValue: 0,
    };
  }

  const totalSpent = loyalties.reduce((sum, l) => sum + l.totalSpent, 0);
  const totalVisits = loyalties.reduce((sum, l) => sum + l.visits, 0);

  // Find favorite merchant (most spent)
  const sorted = [...loyalties].sort((a, b) => b.totalSpent - a.totalSpent);
  const favoriteMerchant = sorted[0]?.merchantId;

  return {
    totalMerchants: loyalties.length,
    totalSpent,
    totalVisits,
    averageOrderValue: totalVisits > 0 ? Math.round((totalSpent / totalVisits) * 100) / 100 : 0,
    favoriteMerchant,
  };
}

function calculateOverallTier(loyalties: MerchantLoyalty[]): LoyaltyTier {
  if (loyalties.length === 0) return 'bronze';

  const totalSpent = loyalties.reduce((sum, l) => sum + l.totalSpent, 0);
  const avgSpent = totalSpent / loyalties.length;

  return calculateMerchantTier(avgSpent);
}

function shouldAwardBadge(
  loyalty: MerchantLoyalty,
  badgeType: string
): { awarded: boolean; reason: string } {
  switch (badgeType) {
    case 'first_visit':
      return { awarded: loyalty.visits >= 1, reason: 'First merchant visit' };
    case 'regular':
      return { awarded: loyalty.visits >= 5, reason: '5 visits to merchant' };
    case 'vip':
      return { awarded: loyalty.visits >= 20, reason: '20 visits to merchant' };
    case 'big_spender':
      return { awarded: loyalty.totalSpent >= 10000, reason: 'Spent 10000 at merchant' };
    default:
      return { awarded: false, reason: 'Unknown badge type' };
  }
}

function calculateCrossMerchantReward(
  loyalties: MerchantLoyalty[],
  merchantId: string,
  orderAmount: number
): { cashback: number; points: number; bonus: number } {
  const loyalty = loyalties.find(l => l.merchantId === merchantId);
  if (!loyalty) {
    return { cashback: 0, points: 0, bonus: 0 };
  }

  const baseCashback = calculateCashback(orderAmount, loyalty.currentTier);
  const basePoints = calculatePoints(orderAmount, loyalty.currentTier);

  // Cross-merchant bonus for being loyal to multiple merchants
  const merchantCount = loyalties.length;
  const crossMerchantBonus = merchantCount >= 3 ? 1.1 : 1.0; // 10% bonus for 3+ merchants

  return {
    cashback: baseCashback,
    points: Math.floor(basePoints * crossMerchantBonus),
    bonus: merchantCount >= 3 ? Math.floor(basePoints * 0.1) : 0,
  };
}

// ============================================================================
// Test Suites
// ============================================================================

describe('Cross-Merchant Service', () => {

  describe('Merchant Tier Calculation', () => {
    it('should calculate bronze tier for low spend', () => {
      expect(calculateMerchantTier(0)).toBe('bronze');
      expect(calculateMerchantTier(1000)).toBe('bronze');
      expect(calculateMerchantTier(4999)).toBe('bronze');
    });

    it('should calculate silver tier for medium spend', () => {
      expect(calculateMerchantTier(5000)).toBe('silver');
      expect(calculateMerchantTier(10000)).toBe('silver');
      expect(calculateMerchantTier(14999)).toBe('silver');
    });

    it('should calculate gold tier for high spend', () => {
      expect(calculateMerchantTier(15000)).toBe('gold');
      expect(calculateMerchantTier(25000)).toBe('gold');
      expect(calculateMerchantTier(49999)).toBe('gold');
    });

    it('should calculate platinum tier for very high spend', () => {
      expect(calculateMerchantTier(50000)).toBe('platinum');
      expect(calculateMerchantTier(100000)).toBe('platinum');
    });

    it('should handle boundary values correctly', () => {
      expect(calculateMerchantTier(4999)).toBe('bronze');
      expect(calculateMerchantTier(5000)).toBe('silver');
      expect(calculateMerchantTier(14999)).toBe('silver');
      expect(calculateMerchantTier(15000)).toBe('gold');
    });
  });

  describe('Tier Configuration', () => {
    it('should return correct config for bronze tier', () => {
      const config = getTierConfig('bronze');

      expect(config.cashbackPercent).toBe(1);
      expect(config.pointsMultiplier).toBe(1.0);
    });

    it('should return correct config for silver tier', () => {
      const config = getTierConfig('silver');

      expect(config.cashbackPercent).toBe(2);
      expect(config.pointsMultiplier).toBe(1.25);
    });

    it('should return correct config for gold tier', () => {
      const config = getTierConfig('gold');

      expect(config.cashbackPercent).toBe(3);
      expect(config.pointsMultiplier).toBe(1.5);
    });

    it('should return correct config for platinum tier', () => {
      const config = getTierConfig('platinum');

      expect(config.cashbackPercent).toBe(5);
      expect(config.pointsMultiplier).toBe(2.0);
    });

    it('should return correct config for diamond tier', () => {
      const config = getTierConfig('diamond');

      expect(config.cashbackPercent).toBe(5); // Same as platinum
      expect(config.pointsMultiplier).toBe(2.0);
    });

    it('should include correct perks per tier', () => {
      expect(getTierConfig('bronze').perks).toHaveLength(1);
      expect(getTierConfig('silver').perks).toHaveLength(2);
      expect(getTierConfig('gold').perks).toHaveLength(3);
      expect(getTierConfig('platinum').perks).toHaveLength(4);
    });
  });

  describe('Cashback Calculation', () => {
    it('should calculate correct cashback for bronze tier', () => {
      expect(calculateCashback(1000, 'bronze')).toBe(10);
      expect(calculateCashback(500, 'bronze')).toBe(5);
    });

    it('should calculate correct cashback for silver tier', () => {
      expect(calculateCashback(1000, 'silver')).toBe(20);
      expect(calculateCashback(500, 'silver')).toBe(10);
    });

    it('should calculate correct cashback for gold tier', () => {
      expect(calculateCashback(1000, 'gold')).toBe(30);
      expect(calculateCashback(500, 'gold')).toBe(15);
    });

    it('should calculate correct cashback for platinum tier', () => {
      expect(calculateCashback(1000, 'platinum')).toBe(50);
      expect(calculateCashback(500, 'platinum')).toBe(25);
    });

    it('should handle small amounts correctly', () => {
      expect(calculateCashback(50, 'bronze')).toBe(0);
      expect(calculateCashback(100, 'bronze')).toBe(1);
    });

    it('should round down correctly', () => {
      expect(calculateCashback(333, 'bronze')).toBe(3);
      expect(calculateCashback(777, 'silver')).toBe(15);
    });
  });

  describe('Points Calculation', () => {
    it('should calculate correct points for bronze tier', () => {
      expect(calculatePoints(100, 'bronze')).toBe(10); // 100/10 * 1.0
      expect(calculatePoints(500, 'bronze')).toBe(50);
    });

    it('should calculate correct points for silver tier', () => {
      expect(calculatePoints(1000, 'silver')).toBe(125); // 1000/10 * 1.25
      expect(calculatePoints(500, 'silver')).toBe(62);
    });

    it('should calculate correct points for gold tier', () => {
      expect(calculatePoints(1000, 'gold')).toBe(150); // 1000/10 * 1.5
    });

    it('should calculate correct points for platinum tier', () => {
      expect(calculatePoints(1000, 'platinum')).toBe(200); // 1000/10 * 2.0
    });

    it('should round down fractional points', () => {
      expect(calculatePoints(99, 'bronze')).toBe(9); // 99/10 = 9.9 -> 9
    });
  });

  describe('Points to Next Tier', () => {
    it('should calculate correct points to silver', () => {
      expect(getPointsToNextTier(0)).toBe(5000);
      expect(getPointsToNextTier(2500)).toBe(2500);
      expect(getPointsToNextTier(4999)).toBe(1);
    });

    it('should calculate correct points to gold', () => {
      expect(getPointsToNextTier(5000)).toBe(10000);
      expect(getPointsToNextTier(10000)).toBe(5000);
    });

    it('should calculate correct points to platinum', () => {
      expect(getPointsToNextTier(15000)).toBe(35000);
      expect(getPointsToNextTier(25000)).toBe(25000);
    });

    it('should return 0 for platinum tier', () => {
      expect(getPointsToNextTier(50000)).toBe(0);
      expect(getPointsToNextTier(100000)).toBe(0);
    });
  });

  describe('Aggregate Statistics', () => {
    it('should calculate correct aggregates for multiple merchants', () => {
      const loyalties = [
        generateMockMerchantLoyalty({ merchantId: 'm1', totalSpent: 1000, visits: 5 }),
        generateMockMerchantLoyalty({ merchantId: 'm2', totalSpent: 2000, visits: 10 }),
        generateMockMerchantLoyalty({ merchantId: 'm3', totalSpent: 3000, visits: 15 }),
      ];

      const stats = calculateAggregateStats(loyalties);

      expect(stats.totalMerchants).toBe(3);
      expect(stats.totalSpent).toBe(6000);
      expect(stats.totalVisits).toBe(30);
      expect(stats.averageOrderValue).toBe(200);
    });

    it('should handle empty loyalties', () => {
      const stats = calculateAggregateStats([]);

      expect(stats.totalMerchants).toBe(0);
      expect(stats.totalSpent).toBe(0);
      expect(stats.totalVisits).toBe(0);
      expect(stats.averageOrderValue).toBe(0);
    });

    it('should identify favorite merchant', () => {
      const loyalties = [
        generateMockMerchantLoyalty({ merchantId: 'm1', totalSpent: 1000 }),
        generateMockMerchantLoyalty({ merchantId: 'm2', totalSpent: 5000 }),
        generateMockMerchantLoyalty({ merchantId: 'm3', totalSpent: 2000 }),
      ];

      const stats = calculateAggregateStats(loyalties);

      expect(stats.favoriteMerchant).toBe('m2');
    });

    it('should calculate average order value correctly', () => {
      const loyalties = [
        generateMockMerchantLoyalty({ totalSpent: 1000, visits: 10 }),
      ];

      const stats = calculateAggregateStats(loyalties);

      expect(stats.averageOrderValue).toBe(100);
    });
  });

  describe('Overall Tier Calculation', () => {
    it('should calculate overall tier based on average spend', () => {
      const loyalties = [
        generateMockMerchantLoyalty({ totalSpent: 10000 }),
        generateMockMerchantLoyalty({ totalSpent: 20000 }),
      ];

      const overallTier = calculateOverallTier(loyalties);

      // Average is 15000, which is gold threshold
      expect(overallTier).toBe('gold');
    });

    it('should return bronze for new users', () => {
      const loyalties = [
        generateMockMerchantLoyalty({ totalSpent: 1000 }),
      ];

      const overallTier = calculateOverallTier(loyalties);

      expect(overallTier).toBe('bronze');
    });

    it('should handle empty loyalties', () => {
      const overallTier = calculateOverallTier([]);

      expect(overallTier).toBe('bronze');
    });

    it('should reward consistent spending across merchants', () => {
      const loyalties = [
        generateMockMerchantLoyalty({ totalSpent: 6000 }),
        generateMockMerchantLoyalty({ totalSpent: 6000 }),
        generateMockMerchantLoyalty({ totalSpent: 6000 }),
      ];

      const overallTier = calculateOverallTier(loyalties);

      // Average is 6000, which is silver
      expect(overallTier).toBe('silver');
    });
  });

  describe('Badge Awarding', () => {
    it('should award first visit badge', () => {
      const loyalty = generateMockMerchantLoyalty({ visits: 1 });
      const result = shouldAwardBadge(loyalty, 'first_visit');

      expect(result.awarded).toBe(true);
    });

    it('should not award first visit badge for no visits', () => {
      const loyalty = generateMockMerchantLoyalty({ visits: 0 });
      const result = shouldAwardBadge(loyalty, 'first_visit');

      expect(result.awarded).toBe(false);
    });

    it('should award regular badge after 5 visits', () => {
      const loyalty = generateMockMerchantLoyalty({ visits: 5 });
      const result = shouldAwardBadge(loyalty, 'regular');

      expect(result.awarded).toBe(true);
    });

    it('should award big spender badge', () => {
      const loyalty = generateMockMerchantLoyalty({ totalSpent: 15000 });
      const result = shouldAwardBadge(loyalty, 'big_spender');

      expect(result.awarded).toBe(true);
    });

    it('should award VIP badge after 20 visits', () => {
      const loyalty = generateMockMerchantLoyalty({ visits: 20 });
      const result = shouldAwardBadge(loyalty, 'vip');

      expect(result.awarded).toBe(true);
    });
  });

  describe('Cross-Merchant Rewards', () => {
    it('should calculate base rewards correctly', () => {
      const loyalties = [
        generateMockMerchantLoyalty({
          merchantId: 'm1',
          currentTier: 'bronze',
          visits: 5,
        }),
      ];

      const rewards = calculateCrossMerchantReward(loyalties, 'm1', 1000);

      expect(rewards.cashback).toBe(10); // 1% of 1000
      expect(rewards.points).toBe(100); // 1000/10 * 1.0
    });

    it('should apply tier multiplier for higher tiers', () => {
      const loyalties = [
        generateMockMerchantLoyalty({
          merchantId: 'm1',
          currentTier: 'silver',
          visits: 5,
        }),
      ];

      const rewards = calculateCrossMerchantReward(loyalties, 'm1', 1000);

      expect(rewards.cashback).toBe(20); // 2% of 1000
      expect(rewards.points).toBe(125); // 1000/10 * 1.25
    });

    it('should apply cross-merchant bonus for 3+ merchants', () => {
      const loyalties = [
        generateMockMerchantLoyalty({ merchantId: 'm1', currentTier: 'bronze', visits: 5 }),
        generateMockMerchantLoyalty({ merchantId: 'm2', currentTier: 'bronze', visits: 5 }),
        generateMockMerchantLoyalty({ merchantId: 'm3', currentTier: 'bronze', visits: 5 }),
      ];

      const rewards = calculateCrossMerchantReward(loyalties, 'm1', 1000);

      // Base: 100 points, bonus: 10% = 110
      expect(rewards.points).toBe(110);
      expect(rewards.bonus).toBe(10);
    });

    it('should not apply bonus for fewer than 3 merchants', () => {
      const loyalties = [
        generateMockMerchantLoyalty({ merchantId: 'm1', currentTier: 'bronze', visits: 5 }),
        generateMockMerchantLoyalty({ merchantId: 'm2', currentTier: 'bronze', visits: 5 }),
      ];

      const rewards = calculateCrossMerchantReward(loyalties, 'm1', 1000);

      expect(rewards.bonus).toBe(0);
    });

    it('should return zero for unknown merchant', () => {
      const loyalties = [
        generateMockMerchantLoyalty({ merchantId: 'm1', currentTier: 'bronze' }),
      ];

      const rewards = calculateCrossMerchantReward(loyalties, 'unknown', 1000);

      expect(rewards.cashback).toBe(0);
      expect(rewards.points).toBe(0);
      expect(rewards.bonus).toBe(0);
    });

    it('should combine platinum tier with cross-merchant bonus', () => {
      const loyalties = [
        generateMockMerchantLoyalty({ merchantId: 'm1', currentTier: 'platinum', visits: 5 }),
        generateMockMerchantLoyalty({ merchantId: 'm2', currentTier: 'platinum', visits: 5 }),
        generateMockMerchantLoyalty({ merchantId: 'm3', currentTier: 'platinum', visits: 5 }),
      ];

      const rewards = calculateCrossMerchantReward(loyalties, 'm1', 1000);

      // Base: 1000/10 * 2.0 = 200 points, 5% = 50 cashback
      // Cross-merchant bonus: 10% of 200 = 20
      expect(rewards.cashback).toBe(50);
      expect(rewards.points).toBe(220);
      expect(rewards.bonus).toBe(20);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large spend amounts', () => {
      const cashback = calculateCashback(1000000, 'platinum');
      expect(cashback).toBe(50000); // 5% of 1 million
    });

    it('should handle negative spend values', () => {
      const cashback = calculateCashback(-1000, 'bronze');
      expect(cashback).toBe(0); // Should not give negative cashback
    });

    it('should handle zero spend', () => {
      const points = calculatePoints(0, 'bronze');
      expect(points).toBe(0);
    });

    it('should handle decimal spend values', () => {
      const cashback = calculateCashback(1234.56, 'bronze');
      expect(cashback).toBe(12); // Floor of 12.3456
    });

    it('should handle merchant with very high visit count', () => {
      const loyalty = generateMockMerchantLoyalty({ visits: 1000 });
      const tier = calculateMerchantTier(loyalty.totalSpent);

      expect(tier).toBe('bronze'); // Only 2500 spent
    });
  });
});
