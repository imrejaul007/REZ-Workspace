/**
 * Cross-Merchant Service - Badge Progress Test Suite
 *
 * Tests for:
 * - Badge progress tracking across merchants
 * - Cross-merchant badge eligibility
 * - Badge unlock conditions
 * - Badge category calculations
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// ============================================================================
// Types
// ============================================================================

type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';
type BadgeCategory = 'social' | 'merchant' | 'spending' | 'streak';
type BadgeSource = 'karma' | 'loyalty';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon?: string;
  rarity: BadgeRarity;
  category: BadgeCategory;
  source: BadgeSource;
  earnedAt?: Date;
  progress?: number;
  target?: number;
}

interface BadgeProgress {
  badgeId: string;
  userId: string;
  merchantId?: string;
  current: number;
  target: number;
  percentage: number;
  isComplete: boolean;
  earnedAt?: Date;
}

interface UserBadges {
  userId: string;
  badges: Badge[];
  progress: BadgeProgress[];
  totalEarned: number;
  categoryProgress: Record<BadgeCategory, { earned: number; total: number }>;
}

interface MerchantVisit {
  merchantId: string;
  merchantName: string;
  visitCount: number;
  totalSpent: number;
  lastVisit: Date;
}

// ============================================================================
// Mock Data Generators
// ============================================================================

function generateMockBadge(overrides?: Partial<Badge>): Badge {
  return {
    id: 'badge_1',
    name: 'First Steps',
    description: 'Complete your first action',
    rarity: 'common',
    category: 'merchant',
    source: 'loyalty',
    ...overrides,
  };
}

function generateMockBadgeProgress(overrides?: Partial<BadgeProgress>): BadgeProgress {
  return {
    badgeId: 'badge_1',
    userId: 'user_123',
    current: 0,
    target: 10,
    percentage: 0,
    isComplete: false,
    ...overrides,
  };
}

function generateMockUserBadges(userId: string): UserBadges {
  return {
    userId,
    badges: [],
    progress: [],
    totalEarned: 0,
    categoryProgress: {
      social: { earned: 0, total: 5 },
      merchant: { earned: 0, total: 10 },
      spending: { earned: 0, total: 8 },
      streak: { earned: 0, total: 6 },
    },
  };
}

// ============================================================================
// Badge Definitions
// ============================================================================

const BADGE_DEFINITIONS: Badge[] = [
  // Merchant Badges
  { id: 'first_visit', name: 'First Steps', description: 'Visit your first merchant', rarity: 'common', category: 'merchant', source: 'loyalty' },
  { id: 'explorer', name: 'Explorer', description: 'Visit 5 different merchants', rarity: 'common', category: 'merchant', source: 'loyalty', progress: 0, target: 5 },
  { id: 'adventurer', name: 'Adventurer', description: 'Visit 10 different merchants', rarity: 'rare', category: 'merchant', source: 'loyalty', progress: 0, target: 10 },
  { id: 'world_traveler', name: 'World Traveler', description: 'Visit 25 different merchants', rarity: 'epic', category: 'merchant', source: 'loyalty', progress: 0, target: 25 },
  { id: 'global_explorer', name: 'Global Explorer', description: 'Visit 50 different merchants', rarity: 'legendary', category: 'merchant', source: 'loyalty', progress: 0, target: 50 },

  // Spending Badges
  { id: 'first_purchase', name: 'First Purchase', description: 'Complete your first purchase', rarity: 'common', category: 'spending', source: 'loyalty' },
  { id: 'big_spender', name: 'Big Spender', description: 'Spend 5000 total', rarity: 'common', category: 'spending', source: 'loyalty', progress: 0, target: 5000 },
  { id: 'vip_customer', name: 'VIP Customer', description: 'Spend 25000 total', rarity: 'rare', category: 'spending', source: 'loyalty', progress: 0, target: 25000 },
  { id: 'platinum_member', name: 'Platinum Member', description: 'Spend 100000 total', rarity: 'epic', category: 'spending', source: 'loyalty', progress: 0, target: 100000 },
  { id: 'diamond_elite', name: 'Diamond Elite', description: 'Spend 500000 total', rarity: 'legendary', category: 'spending', source: 'loyalty', progress: 0, target: 500000 },

  // Streak Badges
  { id: 'streak_7', name: 'Week Warrior', description: '7-day activity streak', rarity: 'common', category: 'streak', source: 'karma', progress: 0, target: 7 },
  { id: 'streak_30', name: 'Month Master', description: '30-day activity streak', rarity: 'rare', category: 'streak', source: 'karma', progress: 0, target: 30 },
  { id: 'streak_100', name: 'Century Club', description: '100-day activity streak', rarity: 'epic', category: 'streak', source: 'karma', progress: 0, target: 100 },
  { id: 'streak_365', name: 'Year Champion', description: '365-day activity streak', rarity: 'legendary', category: 'streak', source: 'karma', progress: 0, target: 365 },

  // Social Badges
  { id: 'social_butterfly', name: 'Social Butterfly', description: 'Refer 3 friends', rarity: 'common', category: 'social', source: 'loyalty', progress: 0, target: 3 },
  { id: 'influencer', name: 'Influencer', description: 'Refer 10 friends', rarity: 'rare', category: 'social', source: 'loyalty', progress: 0, target: 10 },
  { id: 'trendsetter', name: 'Trendsetter', description: 'Refer 25 friends', rarity: 'epic', category: 'social', source: 'loyalty', progress: 0, target: 25 },
];

// ============================================================================
// Badge Progress Logic (to be tested)
// ============================================================================

function calculateProgress(current: number, target: number): number {
  if (target === 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

function isBadgeComplete(current: number, target: number): boolean {
  return current >= target;
}

function updateBadgeProgress(
  progress: BadgeProgress,
  increment: number
): BadgeProgress {
  const newCurrent = progress.current + increment;
  const isComplete = newCurrent >= progress.target;

  return {
    ...progress,
    current: newCurrent,
    percentage: calculateProgress(newCurrent, progress.target),
    isComplete,
    earnedAt: isComplete && !progress.isComplete ? new Date() : progress.earnedAt,
  };
}

function getBadgesForCategory(category: BadgeCategory): Badge[] {
  return BADGE_DEFINITIONS.filter(b => b.category === category);
}

function getBadgesForRarity(rarity: BadgeRarity): Badge[] {
  return BADGE_DEFINITIONS.filter(b => b.rarity === rarity);
}

function getNextBadgeInCategory(category: BadgeCategory, currentProgress: number): Badge | null {
  const categoryBadges = getBadgesForCategory(category)
    .filter(b => b.target !== undefined)
    .sort((a, b) => (a.target || 0) - (b.target || 0));

  return categoryBadges.find(b => (b.target || 0) > currentProgress) || null;
}

function calculateCategoryCompletion(category: BadgeCategory, earnedIds: Set<string>): { earned: number; total: number; percentage: number } {
  const categoryBadges = getBadgesForCategory(category);
  const earned = categoryBadges.filter(b => earnedIds.has(b.id)).length;
  const total = categoryBadges.length;
  const percentage = total > 0 ? Math.round((earned / total) * 100) : 0;

  return { earned, total, percentage };
}

function calculateTotalCompletion(earnedIds: Set<string>): { earned: number; total: number; percentage: number } {
  const earned = earnedIds.size;
  const total = BADGE_DEFINITIONS.length;
  const percentage = total > 0 ? Math.round((earned / total) * 100) : 0;

  return { earned, total, percentage };
}

function calculateMerchantVisitProgress(visits: MerchantVisit[]): BadgeProgress {
  const uniqueMerchants = new Set(visits.map(v => v.merchantId));
  const current = uniqueMerchants.size;

  return {
    badgeId: 'explorer',
    userId: 'user_123',
    current,
    target: 5,
    percentage: calculateProgress(current, 5),
    isComplete: isBadgeComplete(current, 5),
  };
}

function calculateSpendingProgress(totalSpent: number): BadgeProgress[] {
  const spendingBadges = getBadgesForCategory('spending').filter(b => b.target !== undefined);
  const progresses: BadgeProgress[] = [];

  for (const badge of spendingBadges) {
    progresses.push({
      badgeId: badge.id,
      userId: 'user_123',
      current: totalSpent,
      target: badge.target || 0,
      percentage: calculateProgress(totalSpent, badge.target || 0),
      isComplete: isBadgeComplete(totalSpent, badge.target || 0),
    });
  }

  return progresses;
}

// ============================================================================
// Test Suites
// ============================================================================

describe('Badge Progress', () => {

  describe('Progress Calculation', () => {
    it('should calculate 0% for 0 progress', () => {
      expect(calculateProgress(0, 10)).toBe(0);
      expect(calculateProgress(0, 100)).toBe(0);
    });

    it('should calculate 100% for complete progress', () => {
      expect(calculateProgress(10, 10)).toBe(100);
      expect(calculateProgress(100, 100)).toBe(100);
    });

    it('should calculate correct percentage for partial progress', () => {
      expect(calculateProgress(5, 10)).toBe(50);
      expect(calculateProgress(3, 10)).toBe(30);
      expect(calculateProgress(1, 10)).toBe(10);
    });

    it('should cap at 100% for over-target progress', () => {
      expect(calculateProgress(15, 10)).toBe(100);
      expect(calculateProgress(200, 100)).toBe(100);
    });

    it('should handle zero target gracefully', () => {
      expect(calculateProgress(5, 0)).toBe(0);
    });

    it('should round to nearest integer', () => {
      expect(calculateProgress(1, 3)).toBe(33);
      expect(calculateProgress(2, 3)).toBe(67);
    });
  });

  describe('Badge Completion', () => {
    it('should return false for incomplete badge', () => {
      expect(isBadgeComplete(5, 10)).toBe(false);
      expect(isBadgeComplete(9, 10)).toBe(false);
    });

    it('should return true for complete badge', () => {
      expect(isBadgeComplete(10, 10)).toBe(true);
      expect(isBadgeComplete(15, 10)).toBe(true);
    });

    it('should handle zero target', () => {
      expect(isBadgeComplete(5, 0)).toBe(true); // Anything >= 0 is complete
    });
  });

  describe('Badge Progress Update', () => {
    it('should update progress correctly', () => {
      const progress = generateMockBadgeProgress({ current: 3, target: 10 });
      const updated = updateBadgeProgress(progress, 2);

      expect(updated.current).toBe(5);
      expect(updated.percentage).toBe(50);
      expect(updated.isComplete).toBe(false);
    });

    it('should mark badge complete when target reached', () => {
      const progress = generateMockBadgeProgress({ current: 8, target: 10 });
      const updated = updateBadgeProgress(progress, 3);

      expect(updated.current).toBe(11);
      expect(updated.percentage).toBe(100);
      expect(updated.isComplete).toBe(true);
      expect(updated.earnedAt).toBeDefined();
    });

    it('should not update earnedAt if already complete', () => {
      const existingDate = new Date('2025-01-01');
      const progress = generateMockBadgeProgress({ current: 10, target: 10, isComplete: true, earnedAt: existingDate });
      const updated = updateBadgeProgress(progress, 1);

      expect(updated.earnedAt).toEqual(existingDate);
    });

    it('should not affect other fields during update', () => {
      const progress = generateMockBadgeProgress({
        current: 5,
        target: 10,
        userId: 'user_456',
        merchantId: 'merchant_123',
      });
      const updated = updateBadgeProgress(progress, 1);

      expect(updated.userId).toBe('user_456');
      expect(updated.merchantId).toBe('merchant_123');
      expect(updated.badgeId).toBe('badge_1');
    });
  });

  describe('Badge Filtering', () => {
    it('should return all merchant badges', () => {
      const merchantBadges = getBadgesForCategory('merchant');

      expect(merchantBadges.length).toBe(5);
      expect(merchantBadges.every(b => b.category === 'merchant')).toBe(true);
    });

    it('should return all spending badges', () => {
      const spendingBadges = getBadgesForCategory('spending');

      expect(spendingBadges.length).toBe(5);
      expect(spendingBadges.every(b => b.category === 'spending')).toBe(true);
    });

    it('should return all streak badges', () => {
      const streakBadges = getBadgesForCategory('streak');

      expect(streakBadges.length).toBe(4);
      expect(streakBadges.every(b => b.category === 'streak')).toBe(true);
    });

    it('should return all social badges', () => {
      const socialBadges = getBadgesForCategory('social');

      expect(socialBadges.length).toBe(3);
      expect(socialBadges.every(b => b.category === 'social')).toBe(true);
    });

    it('should return all legendary badges', () => {
      const legendaryBadges = getBadgesForRarity('legendary');

      expect(legendaryBadges.length).toBe(3);
      expect(legendaryBadges.every(b => b.rarity === 'legendary')).toBe(true);
    });

    it('should return all rare badges', () => {
      const rareBadges = getBadgesForRarity('rare');

      expect(rareBadges.length).toBeGreaterThan(0);
      expect(rareBadges.every(b => b.rarity === 'rare')).toBe(true);
    });
  });

  describe('Next Badge Calculation', () => {
    it('should return next badge for 0 progress', () => {
      const next = getNextBadgeInCategory('merchant', 0);

      expect(next).toBeDefined();
      expect(next?.id).toBe('explorer');
      expect(next?.target).toBe(5);
    });

    it('should return next badge for mid-progress', () => {
      const next = getNextBadgeInCategory('merchant', 5);

      expect(next).toBeDefined();
      expect(next?.id).toBe('adventurer');
      expect(next?.target).toBe(10);
    });

    it('should return null when all badges complete', () => {
      const next = getNextBadgeInCategory('merchant', 50);

      expect(next).toBeNull();
    });

    it('should skip completed badges', () => {
      const next = getNextBadgeInCategory('spending', 5000);

      expect(next).toBeDefined();
      expect(next?.id).toBe('vip_customer');
    });
  });

  describe('Category Completion', () => {
    it('should calculate correct merchant category completion', () => {
      const earnedIds = new Set<string>(['first_visit', 'explorer']);
      const completion = calculateCategoryCompletion('merchant', earnedIds);

      expect(completion.earned).toBe(2);
      expect(completion.total).toBe(5);
      expect(completion.percentage).toBe(40);
    });

    it('should calculate 0% for no badges earned', () => {
      const earnedIds = new Set<string>();
      const completion = calculateCategoryCompletion('spending', earnedIds);

      expect(completion.earned).toBe(0);
      expect(completion.percentage).toBe(0);
    });

    it('should calculate 100% for all badges earned', () => {
      const merchantBadgeIds = getBadgesForCategory('merchant').map(b => b.id);
      const earnedIds = new Set<string>(merchantBadgeIds);
      const completion = calculateCategoryCompletion('merchant', earnedIds);

      expect(completion.earned).toBe(5);
      expect(completion.percentage).toBe(100);
    });
  });

  describe('Total Completion', () => {
    it('should calculate correct total completion', () => {
      const earnedIds = new Set<string>(['first_visit', 'first_purchase', 'streak_7']);
      const completion = calculateTotalCompletion(earnedIds);

      expect(completion.earned).toBe(3);
      expect(completion.total).toBe(20);
      expect(completion.percentage).toBe(15);
    });

    it('should handle empty badge set', () => {
      const earnedIds = new Set<string>();
      const completion = calculateTotalCompletion(earnedIds);

      expect(completion.earned).toBe(0);
      expect(completion.percentage).toBe(0);
    });
  });

  describe('Merchant Visit Progress', () => {
    it('should calculate progress for unique merchant visits', () => {
      const visits: MerchantVisit[] = [
        { merchantId: 'm1', merchantName: 'Store 1', visitCount: 5, totalSpent: 1000, lastVisit: new Date() },
        { merchantId: 'm2', merchantName: 'Store 2', visitCount: 3, totalSpent: 500, lastVisit: new Date() },
        { merchantId: 'm1', merchantName: 'Store 1', visitCount: 6, totalSpent: 1500, lastVisit: new Date() }, // Duplicate
      ];

      const progress = calculateMerchantVisitProgress(visits);

      expect(progress.current).toBe(2);
      expect(progress.target).toBe(5);
      expect(progress.percentage).toBe(40);
    });

    it('should mark complete when visiting enough merchants', () => {
      const visits: MerchantVisit[] = [
        { merchantId: 'm1', merchantName: 'Store 1', visitCount: 1, totalSpent: 100, lastVisit: new Date() },
        { merchantId: 'm2', merchantName: 'Store 2', visitCount: 1, totalSpent: 100, lastVisit: new Date() },
        { merchantId: 'm3', merchantName: 'Store 3', visitCount: 1, totalSpent: 100, lastVisit: new Date() },
        { merchantId: 'm4', merchantName: 'Store 4', visitCount: 1, totalSpent: 100, lastVisit: new Date() },
        { merchantId: 'm5', merchantName: 'Store 5', visitCount: 1, totalSpent: 100, lastVisit: new Date() },
      ];

      const progress = calculateMerchantVisitProgress(visits);

      expect(progress.current).toBe(5);
      expect(progress.isComplete).toBe(true);
    });
  });

  describe('Spending Progress', () => {
    it('should calculate progress for all spending badges', () => {
      const progress = calculateSpendingProgress(10000);

      expect(progress.length).toBe(5);
    });

    it('should mark correct badges as complete', () => {
      const progress = calculateSpendingProgress(6000);

      // 5000 target should be complete
      const bigSpender = progress.find(p => p.badgeId === 'big_spender');
      expect(bigSpender?.isComplete).toBe(true);

      // 25000 target should not be complete
      const vip = progress.find(p => p.badgeId === 'vip_customer');
      expect(vip?.isComplete).toBe(false);
    });

    it('should calculate correct percentages', () => {
      const progress = calculateSpendingProgress(12500);

      const bigSpender = progress.find(p => p.badgeId === 'big_spender');
      expect(bigSpender?.percentage).toBe(100);

      const vip = progress.find(p => p.badgeId === 'vip_customer');
      expect(vip?.percentage).toBe(50);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large progress values', () => {
      const progress = calculateProgress(1000000, 100);
      expect(progress).toBe(100);
    });

    it('should handle decimal values', () => {
      const progress = calculateProgress(2.5, 10);
      expect(progress).toBe(25);
    });

    it('should handle empty merchant visit list', () => {
      const progress = calculateMerchantVisitProgress([]);
      expect(progress.current).toBe(0);
      expect(progress.isComplete).toBe(false);
    });

    it('should handle zero spending', () => {
      const progress = calculateSpendingProgress(0);
      expect(progress.every(p => p.isComplete === false)).toBe(true);
      expect(progress.every(p => p.percentage === 0)).toBe(true);
    });
  });
});
