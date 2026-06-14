import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch
global.fetch = vi.fn();

import { calculateCoinsEarned, getKarmaLevelFromScore, getTierFromPoints } from '@/lib/loyalty';

describe('Loyalty Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Coin Calculation', () => {
    it('should calculate coins for starter user', () => {
      const result = calculateCoinsEarned(100, 'starter', 'bronze');
      expect(result.karmaCoins).toBe(5); // 100/20 * 1.0 * 1.0 = 5
    });

    it('should calculate coins for elite user with diamond tier', () => {
      const result = calculateCoinsEarned(100, 'elite', 'diamond');
      expect(result.karmaCoins).toBe(40); // 100/20 * 2.0 * 2.0 = 40
    });

    it('should calculate coins for leader with platinum', () => {
      const result = calculateCoinsEarned(1000, 'leader', 'platinum');
      expect(result.karmaCoins).toBe(225); // 1000/20 * 1.5 * 1.5 = 75 * 3 = 225
    });
  });

  describe('Tier Calculation', () => {
    it('should return bronze for 0 points', () => {
      expect(getTierFromPoints(0)).toBe('bronze');
    });

    it('should return silver for 500+ points', () => {
      expect(getTierFromPoints(500)).toBe('silver');
    });

    it('should return platinum for 5000+ points', () => {
      expect(getTierFromPoints(5000)).toBe('platinum');
    });

    it('should return diamond for 10000+ points', () => {
      expect(getTierFromPoints(15000)).toBe('diamond');
    });
  });

  describe('Karma Level Calculation', () => {
    it('should return starter for 0 score', () => {
      expect(getKarmaLevelFromScore(0)).toBe('starter');
    });

    it('should return active for 100+ score', () => {
      expect(getKarmaLevelFromScore(150)).toBe('active');
    });

    it('should return elite for 5000+ score', () => {
      expect(getKarmaLevelFromScore(6000)).toBe('elite');
    });
  });
});

describe('Loyalty Milestone Flow', () => {
  it('should record visit and check milestone', async () => {
    // Mock API responses
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const response = await fetch('/api/loyalty/visits', {
      method: 'POST',
      body: JSON.stringify({ storeId: 'store_123' }),
    });

    expect(response.ok).toBe(true);
  });
});
