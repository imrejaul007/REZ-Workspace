/**
 * REZ Try - Calculation Tests
 */
import { describe, it, expect } from 'vitest';

// Pure calculation functions for testing
function calculateExplorerScore(stats: {
  trialsCompleted: number;
  reviewsWritten: number;
  campaignsJoined: number;
  referrals: number;
  currentStreak: number;
}): number {
  return (
    stats.trialsCompleted * 10 +
    stats.reviewsWritten * 5 +
    stats.campaignsJoined * 15 +
    stats.referrals * 20 +
    stats.currentStreak * 3
  );
}

function determineExplorerTier(score: number): string {
  if (score >= 1000) return 'Conqueror';
  if (score >= 500) return 'Adventurer';
  if (score >= 100) return 'Explorer';
  return 'Curious';
}

function calculateBookingValidity(bookedAt: Date, validityHours: number): Date {
  const expiry = new Date(bookedAt);
  expiry.setHours(expiry.getHours() + validityHours);
  return expiry;
}

describe('Explorer Score Calculation', () => {
  it('should calculate score for new user', () => {
    const score = calculateExplorerScore({
      trialsCompleted: 0,
      reviewsWritten: 0,
      campaignsJoined: 0,
      referrals: 0,
      currentStreak: 0,
    });
    expect(score).toBe(0);
  });

  it('should calculate score for active user', () => {
    const score = calculateExplorerScore({
      trialsCompleted: 10,
      reviewsWritten: 5,
      campaignsJoined: 3,
      referrals: 2,
      currentStreak: 7,
    });
    // 10*10 + 5*5 + 3*15 + 2*20 + 7*3 = 100 + 25 + 45 + 40 + 21 = 231
    expect(score).toBe(231);
  });

  it('should calculate score for top explorer', () => {
    const score = calculateExplorerScore({
      trialsCompleted: 100,
      reviewsWritten: 50,
      campaignsJoined: 20,
      referrals: 10,
      currentStreak: 30,
    });
    expect(score).toBeGreaterThanOrEqual(1000);
  });
});

describe('Explorer Tier Determination', () => {
  it('should return Curious for score < 100', () => {
    expect(determineExplorerTier(50)).toBe('Curious');
    expect(determineExplorerTier(99)).toBe('Curious');
  });

  it('should return Explorer for score 100-499', () => {
    expect(determineExplorerTier(100)).toBe('Explorer');
    expect(determineExplorerTier(250)).toBe('Explorer');
    expect(determineExplorerTier(499)).toBe('Explorer');
  });

  it('should return Adventurer for score 500-999', () => {
    expect(determineExplorerTier(500)).toBe('Adventurer');
    expect(determineExplorerTier(750)).toBe('Adventurer');
    expect(determineExplorerTier(999)).toBe('Adventurer');
  });

  it('should return Conqueror for score >= 1000', () => {
    expect(determineExplorerTier(1000)).toBe('Conqueror');
    expect(determineExplorerTier(5000)).toBe('Conqueror');
  });
});

describe('Booking Validity', () => {
  it('should calculate expiry time correctly', () => {
    const bookedAt = new Date('2026-05-29T10:00:00Z');
    const expiry = calculateBookingValidity(bookedAt, 24);

    expect(expiry.toISOString()).toBe('2026-05-30T10:00:00.000Z');
  });

  it('should handle 48-hour validity', () => {
    const bookedAt = new Date('2026-05-29T10:00:00Z');
    const expiry = calculateBookingValidity(bookedAt, 48);

    expect(expiry.toISOString()).toBe('2026-05-31T10:00:00.000Z');
  });
});
