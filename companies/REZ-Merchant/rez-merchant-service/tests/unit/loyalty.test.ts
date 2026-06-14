/**
 * Unit Tests - Loyalty Service
 */

import { describe, test, expect } from '@jest/globals';

// Points calculation
function calculatePoints(amount: number, multiplier = 1): number {
  return Math.floor(amount * multiplier);
}

// Tier definitions
const TIERS = {
  bronze: { minPoints: 0, multiplier: 1, name: 'Bronze' },
  silver: { minPoints: 1000, multiplier: 1.25, name: 'Silver' },
  gold: { minPoints: 5000, multiplier: 1.5, name: 'Gold' },
  platinum: { minPoints: 15000, multiplier: 2, name: 'Platinum' },
};

function getTier(points: number): string {
  if (points >= TIERS.platinum.minPoints) return 'platinum';
  if (points >= TIERS.gold.minPoints) return 'gold';
  if (points >= TIERS.silver.minPoints) return 'silver';
  return 'bronze';
}

function getTierMultiplier(points: number): number {
  const tier = getTier(points);
  return TIERS[tier as keyof typeof TIERS].multiplier;
}

// Stamp card
function addStamp(stamps: number, required: number): { completed: boolean; stamps: number; remaining: number } {
  const newStamps = stamps + 1;
  return {
    completed: newStamps >= required,
    stamps: newStamps,
    remaining: Math.max(0, required - newStamps),
  };
}

// Points redemption
function redeemPoints(points: number, redemptionPoints: number): { success: boolean; remaining: number; message: string } {
  if (points < redemptionPoints) {
    return { success: false, remaining: points, message: 'Insufficient points' };
  }
  return { success: true, remaining: points - redemptionPoints, message: 'Redemption successful' };
}

describe('Points Calculation', () => {
  test('calculates base points', () => {
    expect(calculatePoints(100)).toBe(100);
    expect(calculatePoints(99)).toBe(99);
  });

  test('applies multiplier', () => {
    expect(calculatePoints(100, 1.5)).toBe(150);
  });

  test('floors fractional points', () => {
    expect(calculatePoints(99.9)).toBe(99);
  });
});

describe('Tier System', () => {
  test('bronze tier for 0 points', () => {
    expect(getTier(0)).toBe('bronze');
  });

  test('silver tier at 1000 points', () => {
    expect(getTier(1000)).toBe('silver');
  });

  test('gold tier at 5000 points', () => {
    expect(getTier(5000)).toBe('gold');
  });

  test('platinum tier at 15000 points', () => {
    expect(getTier(15000)).toBe('platinum');
  });

  test('correct multipliers', () => {
    expect(getTierMultiplier(0)).toBe(1);
    expect(getTierMultiplier(1000)).toBe(1.25);
    expect(getTierMultiplier(5000)).toBe(1.5);
    expect(getTierMultiplier(15000)).toBe(2);
  });
});

describe('Stamp Cards', () => {
  test('adds stamp correctly', () => {
    const result = addStamp(0, 10);
    expect(result.stamps).toBe(1);
    expect(result.completed).toBe(false);
  });

  test('completes when reaching required', () => {
    const result = addStamp(9, 10);
    expect(result.completed).toBe(true);
    expect(result.remaining).toBe(0);
  });

  test('tracks remaining stamps', () => {
    const result = addStamp(5, 10);
    expect(result.remaining).toBe(4);
  });
});

describe('Points Redemption', () => {
  test('successful redemption', () => {
    const result = redeemPoints(1000, 500);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(500);
  });

  test('insufficient points', () => {
    const result = redeemPoints(100, 500);
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(100);
  });

  test('exact points redemption', () => {
    const result = redeemPoints(500, 500);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(0);
  });
});

describe('Expiry Rules', () => {
  test('points expire after 365 days', () => {
    const checkExpiry = (earnedAt: Date): boolean => {
      const daysSince = (Date.now() - earnedAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince > 365;
    };

    const oldPoints = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000);
    const recentPoints = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    expect(checkExpiry(oldPoints)).toBe(true);
    expect(checkExpiry(recentPoints)).toBe(false);
  });
});
