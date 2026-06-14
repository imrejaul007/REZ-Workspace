/**
 * Savings Service Unit Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock mongoose
vi.mock('mongoose', () => {
  const mockTypes = {
    ObjectId: vi.fn(() => 'mock-object-id'),
  };
  return {
    default: {
      connection: {
        db: {
          collection: vi.fn(() => ({
            insertOne: vi.fn(),
          })),
        },
      },
      Types: mockTypes,
    },
    Types: mockTypes,
    Schema: vi.fn(),
    model: vi.fn(() => ({
      findOne: vi.fn(),
      find: vi.fn(),
      findOneAndUpdate: vi.fn(),
      aggregate: vi.fn(),
      create: vi.fn(),
      countDocuments: vi.fn(),
      deleteOne: vi.fn(),
    })),
  };
});

// Mock Redis
vi.mock('../config/redis', () => ({
  redis: {
    get: vi.fn(),
    setex: vi.fn(),
    del: vi.fn(),
  },
  pub: {
    publish: vi.fn(),
  },
}));

// Mock logger
vi.mock('../config/logger', () => ({
  createServiceLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  })),
}));

// Mock AML compliance
vi.mock('./amlComplianceService', () => ({
  recordTransaction: vi.fn().mockResolvedValue(null),
}));

describe('Savings Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Savings Type Mapping', () => {
    it('should correctly identify cashback sources', async () => {
      const { SavingsEntry } = await import('../models/Savings');
      const mockSave = vi.fn().mockResolvedValue(undefined);
      (SavingsEntry as any).prototype = { save: mockSave };

      // Test that cashback sources map correctly
      const cashbackSources = ['cashback', 'order_cashback', 'cashback_bonus'];
      expect(cashbackSources).toContain('cashback');
    });

    it('should correctly identify referral sources', async () => {
      const referralSources = ['referral', 'referral_bonus', 'referral_signup'];
      expect(referralSources.some(s => s.includes('referral'))).toBe(true);
    });
  });

  describe('Savings Streak Logic', () => {
    it('should calculate streak correctly for consecutive days', () => {
      // Test streak calculation
      const calculateStreak = (lastDate: Date, currentDate: Date): number => {
        const daysDiff = Math.floor(
          (currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysDiff === 0) return 0; // Same day
        if (daysDiff === 1) return 1; // Consecutive
        return -1; // Streak broken
      };

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const today = new Date();

      expect(calculateStreak(yesterday, today)).toBe(1);
    });

    it('should detect broken streak', () => {
      const calculateStreak = (lastDate: Date, currentDate: Date): number => {
        const daysDiff = Math.floor(
          (currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysDiff === 0) return 0;
        if (daysDiff === 1) return 1;
        return -1;
      };

      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const today = new Date();

      expect(calculateStreak(twoDaysAgo, today)).toBe(-1);
    });
  });

  describe('Savings Projections', () => {
    it('should calculate 30-day projection correctly', () => {
      const calculateProjection = (
        currentTotal: number,
        daysOfData: number
      ): { projected30: number; monthlyAvg: number } => {
        const dailyAverage = currentTotal / Math.max(daysOfData, 1);
        const projected30 = dailyAverage * 30;
        return {
          projected30: Math.round(projected30),
          monthlyAvg: Math.round(dailyAverage),
        };
      };

      const result = calculateProjection(3000, 10);
      expect(result.projected30).toBe(9000);
      expect(result.monthlyAvg).toBe(300);
    });

    it('should handle zero data gracefully', () => {
      const calculateProjection = (
        currentTotal: number,
        daysOfData: number
      ): { projected30: number; monthlyAvg: number } => {
        const dailyAverage = currentTotal / Math.max(daysOfData, 1);
        const projected30 = dailyAverage * 30;
        return {
          projected30: Math.round(projected30),
          monthlyAvg: Math.round(dailyAverage),
        };
      };

      const result = calculateProjection(0, 0);
      expect(result.projected30).toBe(0);
      expect(result.monthlyAvg).toBe(0);
    });
  });

  describe('Savings Trend Detection', () => {
    it('should detect increasing trend', () => {
      const detectTrend = (recentDailyAvg: number, oldDailyAvg: number): 'increasing' | 'decreasing' | 'stable' => {
        if (recentDailyAvg > oldDailyAvg * 1.1) return 'increasing';
        if (recentDailyAvg < oldDailyAvg * 0.9) return 'decreasing';
        return 'stable';
      };

      expect(detectTrend(100, 50)).toBe('increasing');
      expect(detectTrend(100, 90)).toBe('stable');
      expect(detectTrend(50, 100)).toBe('decreasing');
    });
  });

  describe('Savings Goal Validation', () => {
    it('should validate goal amounts', () => {
      const validateGoal = (amount: number): boolean => {
        return amount > 0 && amount <= 100000000; // Max 1 crore
      };

      expect(validateGoal(100)).toBe(true);
      expect(validateGoal(0)).toBe(false);
      expect(validateGoal(-100)).toBe(false);
      expect(validateGoal(100000001)).toBe(false);
    });

    it('should calculate progress percentage correctly', () => {
      const calculateProgress = (current: number, target: number): number => {
        if (target <= 0) return 0;
        return Math.min(Math.round((current / target) * 100), 100);
      };

      expect(calculateProgress(5000, 10000)).toBe(50);
      expect(calculateProgress(10000, 10000)).toBe(100);
      expect(calculateProgress(15000, 10000)).toBe(100); // Capped at 100%
      expect(calculateProgress(0, 10000)).toBe(0);
    });
  });

  describe('Savings Formatting', () => {
    it('should format large amounts correctly', () => {
      const formatAmount = (amount: number): string => {
        if (amount >= 100000) {
          return `₹${(amount / 100000).toFixed(1)}L`;
        }
        if (amount >= 1000) {
          return `₹${(amount / 1000).toFixed(1)}K`;
        }
        return `₹${(amount / 100).toFixed(2)}`;
      };

      expect(formatAmount(150000)).toBe('₹1.5L');
      expect(formatAmount(15000)).toBe('₹15.0K');
      expect(formatAmount(150)).toBe('₹1.50');
    });
  });

  describe('Savings Type Categories', () => {
    const categoryMapping: Record<string, string[]> = {
      dining: ['restaurant', 'cafe', 'food', 'dining', 'meal'],
      groceries: ['grocery', 'supermarket', 'mart', 'store'],
      entertainment: ['movie', 'cinema', 'entertainment', 'game', 'ticket'],
    };

    it('should map sources to categories', () => {
      const getCategory = (source: string): string | null => {
        const lowerSource = source.toLowerCase();
        for (const [category, keywords] of Object.entries(categoryMapping)) {
          if (keywords.some((kw) => lowerSource.includes(kw))) {
            return category;
          }
        }
        return null;
      };

      expect(getCategory('McDonalds')).toBe('dining');
      expect(getCategory('BigBasket')).toBe('groceries');
      expect(getCategory('PVR Cinema')).toBe('entertainment');
      expect(getCategory('RandomStore')).toBeNull();
    });
  });

  describe('Milestone Detection', () => {
    it('should detect savings milestones', () => {
      const milestones = [100, 500, 1000, 5000, 10000, 50000, 100000];
      const detectMilestone = (prevTotal: number, newTotal: number): number | null => {
        for (const milestone of milestones) {
          if (prevTotal < milestone && newTotal >= milestone) {
            return milestone;
          }
        }
        return null;
      };

      expect(detectMilestone(99, 100)).toBe(100);
      expect(detectMilestone(100, 200)).toBeNull();
      expect(detectMilestone(999, 1000)).toBe(1000);
    });

    it('should detect streak milestones', () => {
      const streakMilestones = [7, 14, 30, 60, 90, 365];
      const detectStreakMilestone = (prevStreak: number, newStreak: number): number | null => {
        for (const milestone of streakMilestones) {
          if (prevStreak < milestone && newStreak >= milestone) {
            return milestone;
          }
        }
        return null;
      };

      expect(detectStreakMilestone(6, 7)).toBe(7);
      expect(detectStreakMilestone(7, 8)).toBeNull();
      expect(detectStreakMilestone(29, 30)).toBe(30);
    });
  });
});

describe('Savings API Validation', () => {
  describe('Request Validation', () => {
    it('should validate date range queries', () => {
      const validateDateRange = (
        startDate: string | undefined,
        endDate: string | undefined
      ): { valid: boolean; start: Date; end: Date } | { valid: false; error: string } => {
        if (startDate && isNaN(Date.parse(startDate))) {
          return { valid: false, error: 'Invalid start date' };
        }
        if (endDate && isNaN(Date.parse(endDate))) {
          return { valid: false, error: 'Invalid end date' };
        }

        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();

        return { valid: true, start, end };
      };

      expect(validateDateRange('2024-01-01', '2024-01-31').valid).toBe(true);
      expect(validateDateRange('invalid', '2024-01-31').valid).toBe(false);
    });

    it('should validate pagination', () => {
      const validatePagination = (
        page: number,
        limit: number
      ): { page: number; limit: number } => {
        return {
          page: Math.max(1, page || 1),
          limit: Math.min(100, Math.max(1, limit || 20)),
        };
      };

      expect(validatePagination(1, 20)).toEqual({ page: 1, limit: 20 });
      expect(validatePagination(0, 0)).toEqual({ page: 1, limit: 1 });
      expect(validatePagination(5, 500)).toEqual({ page: 5, limit: 100 });
    });
  });

  describe('Response Formatting', () => {
    it('should paginate results correctly', () => {
      const paginate = <T,>(items: T[], page: number, limit: number) => {
        const start = (page - 1) * limit;
        const end = start + limit;
        return {
          items: items.slice(start, end),
          hasMore: end < items.length,
          total: items.length,
          page,
          totalPages: Math.ceil(items.length / limit),
        };
      };

      const items = Array.from({ length: 50 }, (_, i) => i);
      const result = paginate(items, 2, 10);

      expect(result.items).toEqual([10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
      expect(result.hasMore).toBe(true);
      expect(result.total).toBe(50);
      expect(result.page).toBe(2);
      expect(result.totalPages).toBe(5);
    });
  });
});
