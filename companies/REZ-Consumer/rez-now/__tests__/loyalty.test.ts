/**
 * Unit tests for Loyalty API
 * Tests consumer and merchant loyalty API methods
 */

import { loyaltyApi, merchantLoyaltyApi } from '@/lib/loyalty';

// ── Mock dependencies ─────────────────────────────────────────────────────────

jest.mock('@/lib/api/client', () => ({
  authClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

jest.mock('@/lib/api/api-client', () => ({
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

import { authClient, apiClient } from '@/lib/api/client';
import { default as apiClientDefault } from '@/lib/api/api-client';

describe('Loyalty API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return loyalty profile', async () => {
      const mockProfile = {
        currentPoints: 500,
        tier: 'silver',
        nextTier: 'gold',
        pointsToNextTier: 500,
        lifetimePoints: 1000,
        expiringPoints: 100,
      };

      (authClient.get as jest.Mock).mockResolvedValueOnce({
        data: { data: mockProfile },
      });

      const profile = await loyaltyApi.getProfile();

      expect(profile.tier).toBe('silver');
      expect(profile.currentPoints).toBe(500);
      expect(authClient.get).toHaveBeenCalledWith('/loyalty');
    });

    it('should return default profile on error', async () => {
      (authClient.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const profile = await loyaltyApi.getProfile();

      expect(profile.tier).toBe('bronze');
      expect(profile.currentPoints).toBe(0);
    });

    it('should handle response with direct data property', async () => {
      const mockProfile = {
        currentPoints: 750,
        tier: 'gold',
        nextTier: 'platinum',
        pointsToNextTier: 250,
        lifetimePoints: 2000,
        expiringPoints: 0,
      };

      (authClient.get as jest.Mock).mockResolvedValueOnce({
        data: mockProfile,
      });

      const profile = await loyaltyApi.getProfile();

      expect(profile.tier).toBe('gold');
      expect(profile.currentPoints).toBe(750);
    });
  });

  describe('getVisitStreak', () => {
    it('should return visit streak data', async () => {
      const mockStreak = {
        totalVisits: 15,
        currentStreak: 5,
        longestStreak: 10,
        nextMilestone: {
          visitsNeeded: 5,
          totalRequired: 20,
          reward: 50,
          name: '20 Visits',
        },
        recentVisits: [],
      };

      (authClient.get as jest.Mock).mockResolvedValueOnce({
        data: { data: mockStreak },
      });

      const streak = await loyaltyApi.getVisitStreak();

      expect(streak.currentStreak).toBe(5);
      expect(streak.totalVisits).toBe(15);
      expect(streak.nextMilestone?.name).toBe('20 Visits');
      expect(authClient.get).toHaveBeenCalledWith('/users/visit-streak');
    });

    it('should return default streak on error', async () => {
      (authClient.get as jest.Mock).mockRejectedValueOnce(new Error('API error'));

      const streak = await loyaltyApi.getVisitStreak();

      expect(streak.totalVisits).toBe(0);
      expect(streak.currentStreak).toBe(0);
      expect(streak.nextMilestone).toBeNull();
    });
  });

  describe('recordVisit', () => {
    it('should record a visit successfully', async () => {
      (authClient.post as jest.Mock).mockResolvedValueOnce({
        data: { success: true },
      });

      await expect(loyaltyApi.recordVisit('store_123')).resolves.not.toThrow();
      expect(authClient.post).toHaveBeenCalledWith('/loyalty/visits', {
        storeId: 'store_123',
        visitType: 'dine_in',
      });
    });

    it('should accept custom visit type', async () => {
      (authClient.post as jest.Mock).mockResolvedValueOnce({
        data: { success: true },
      });

      await loyaltyApi.recordVisit('store_123', 'takeaway');

      expect(authClient.post).toHaveBeenCalledWith('/loyalty/visits', {
        storeId: 'store_123',
        visitType: 'takeaway',
      });
    });

    it('should handle errors silently', async () => {
      (authClient.post as jest.Mock).mockRejectedValueOnce(new Error('Failed'));

      // Should not throw
      await expect(loyaltyApi.recordVisit('store_123')).resolves.toBeUndefined();
    });
  });

  describe('getCoins', () => {
    it('should return coin balance', async () => {
      const mockCoins = {
        available: 250,
        expiring: 50,
        expiryDate: '2026-06-01',
      };

      (authClient.get as jest.Mock).mockResolvedValueOnce({
        data: { data: mockCoins },
      });

      const coins = await loyaltyApi.getCoins();

      expect(coins.available).toBe(250);
      expect(coins.expiring).toBe(50);
      expect(authClient.get).toHaveBeenCalledWith('/loyalty/coins');
    });

    it('should return default coins on error', async () => {
      (authClient.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const coins = await loyaltyApi.getCoins();

      expect(coins.available).toBe(0);
      expect(coins.expiring).toBe(0);
      expect(coins.expiryDate).toBe('');
    });
  });

  describe('getBadges', () => {
    it('should return badges list', async () => {
      const mockBadges = [
        {
          id: 'badge_1',
          name: 'First Visit',
          icon: 'star',
          rarity: 'common' as const,
          earnedAt: '2025-01-01',
        },
      ];

      (authClient.get as jest.Mock).mockResolvedValueOnce({
        data: { data: mockBadges },
      });

      const badges = await loyaltyApi.getBadges();

      expect(badges).toHaveLength(1);
      expect(badges[0].name).toBe('First Visit');
    });

    it('should return empty array on error', async () => {
      (authClient.get as jest.Mock).mockRejectedValueOnce(new Error('Failed'));

      const badges = await loyaltyApi.getBadges();

      expect(badges).toEqual([]);
    });
  });

  describe('getStreaks', () => {
    it('should return gamification streaks', async () => {
      const mockStreaks = {
        login: { current: 5, required: 7, reward: 10 },
        order: { current: 3, required: 5, reward: 25 },
        review: null,
        savings: null,
      };

      (authClient.get as jest.Mock).mockResolvedValueOnce({
        data: { data: mockStreaks },
      });

      const streaks = await loyaltyApi.getStreaks();

      expect(streaks.login?.current).toBe(5);
      expect(streaks.order?.required).toBe(5);
    });

    it('should return null values on error', async () => {
      (authClient.get as jest.Mock).mockRejectedValueOnce(new Error('Failed'));

      const streaks = await loyaltyApi.getStreaks();

      expect(streaks.login).toBeNull();
      expect(streaks.order).toBeNull();
    });
  });

  describe('getFrequentItems', () => {
    it('should return frequent items for store', async () => {
      const mockItems = [
        {
          menuItemId: 'item_1',
          name: 'Butter Chicken',
          price: 299,
          orderCount: 10,
          lastOrderedAt: '2026-05-01',
        },
      ];

      (authClient.get as jest.Mock).mockResolvedValueOnce({
        data: { data: mockItems },
      });

      const items = await loyaltyApi.getFrequentItems('punjabi-grill');

      expect(items).toHaveLength(1);
      expect(items[0].name).toBe('Butter Chicken');
    });

    it('should return empty array on error', async () => {
      (authClient.get as jest.Mock).mockRejectedValueOnce(new Error('Failed'));

      const items = await loyaltyApi.getFrequentItems('unknown-store');

      expect(items).toEqual([]);
    });
  });
});

describe('Merchant Loyalty API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getConfig', () => {
    it('should return loyalty config for store', async () => {
      const mockConfig = {
        enabled: true,
        coinsPerVisit: 10,
        coinsPerRupee: 0.01,
        tierThresholds: [0, 500, 1500, 5000],
      };

      (apiClientDefault.get as jest.Mock).mockResolvedValueOnce({
        data: { data: mockConfig },
      });

      const config = await merchantLoyaltyApi.getConfig('store_456');

      expect(config?.enabled).toBe(true);
      expect(config?.coinsPerVisit).toBe(10);
    });

    it('should return null on error', async () => {
      (apiClientDefault.get as jest.Mock).mockRejectedValueOnce(new Error('Failed'));

      const config = await merchantLoyaltyApi.getConfig('store_456');

      expect(config).toBeNull();
    });
  });

  describe('getCustomerStats', () => {
    it('should return customer stats', async () => {
      const mockStats = {
        userId: 'user_123',
        visits: 10,
        totalSpent: 5000,
        coinsEarned: 150,
        currentTier: 'silver',
        lastVisit: '2026-05-01',
        frequentItems: [],
      };

      (authClient.get as jest.Mock).mockResolvedValueOnce({
        data: { data: mockStats },
      });

      const stats = await merchantLoyaltyApi.getCustomerStats('user_123', 'store_456');

      expect(stats?.visits).toBe(10);
      expect(stats?.totalSpent).toBe(5000);
    });

    it('should return null on error', async () => {
      (authClient.get as jest.Mock).mockRejectedValueOnce(new Error('Failed'));

      const stats = await merchantLoyaltyApi.getCustomerStats('user_123', 'store_456');

      expect(stats).toBeNull();
    });
  });

  describe('awardCoins', () => {
    it('should award coins to user', async () => {
      (authClient.post as jest.Mock).mockResolvedValueOnce({
        data: { success: true, newBalance: 350 },
      });

      const result = await merchantLoyaltyApi.awardCoins('user_123', 100, 'Test bonus', 'store_456');

      expect(result?.success).toBe(true);
      expect(result?.newBalance).toBe(350);
    });

    it('should return null on error', async () => {
      (authClient.post as jest.Mock).mockRejectedValueOnce(new Error('Failed'));

      const result = await merchantLoyaltyApi.awardCoins('user_123', 100, 'Test', 'store_456');

      expect(result).toBeNull();
    });
  });

  describe('recordVisit', () => {
    it('should record store visit', async () => {
      const mockResult = {
        visitId: 'visit_123',
        coinsEarned: 10,
        pointsEarned: 100,
      };

      (authClient.post as jest.Mock).mockResolvedValueOnce({
        data: { data: mockResult },
      });

      const result = await merchantLoyaltyApi.recordVisit('user_123', 'store_456');

      expect(result?.visitId).toBe('visit_123');
      expect(result?.coinsEarned).toBe(10);
    });

    it('should accept custom visit type', async () => {
      (authClient.post as jest.Mock).mockResolvedValueOnce({
        data: { data: { visitId: 'visit_1', coinsEarned: 5, pointsEarned: 50 } },
      });

      await merchantLoyaltyApi.recordVisit('user_123', 'store_456', 'delivery');

      expect(authClient.post).toHaveBeenCalledWith('/store-visits', {
        userId: 'user_123',
        storeId: 'store_456',
        visitType: 'delivery',
      });
    });
  });

  describe('getLeaderboard', () => {
    it('should return store leaderboard', async () => {
      const mockLeaderboard = [
        { rank: 1, userId: 'user_1', displayName: 'Top Customer', visits: 50, tier: 'diamond' },
        { rank: 2, userId: 'user_2', displayName: 'Regular', visits: 30, tier: 'gold' },
      ];

      (apiClientDefault.get as jest.Mock).mockResolvedValueOnce({
        data: { data: mockLeaderboard },
      });

      const leaderboard = await merchantLoyaltyApi.getLeaderboard('store_456', 10);

      expect(leaderboard).toHaveLength(2);
      expect(leaderboard[0].rank).toBe(1);
    });

    it('should return empty array on error', async () => {
      (apiClientDefault.get as jest.Mock).mockRejectedValueOnce(new Error('Failed'));

      const leaderboard = await merchantLoyaltyApi.getLeaderboard('store_456');

      expect(leaderboard).toEqual([]);
    });
  });
});

describe('recordVisit helper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should record visit with order details', async () => {
    const { recordVisit } = await import('@/lib/loyalty');

    const mockResult = {
      visitId: 'visit_abc',
      earnedPoints: 50,
      earnedCoins: 25,
      newTier: undefined,
      events: [],
      unlockedMilestones: [],
    };

    (authClient.post as jest.Mock).mockResolvedValueOnce({
      data: { data: mockResult },
    });

    const result = await recordVisit({
      orderId: 'order_123',
      storeSlug: 'punjabi-grill',
      storeName: 'Punjabi Grill',
      orderTotal: 500,
    });

    expect(result.earnedPoints).toBe(50);
    expect(result.earnedCoins).toBe(25);
  });

  it('should handle errors gracefully', async () => {
    const { recordVisit } = await import('@/lib/loyalty');

    (authClient.post as jest.Mock).mockRejectedValueOnce(new Error('API error'));

    const result = await recordVisit({
      orderId: 'order_123',
      storeSlug: 'punjabi-grill',
      storeName: 'Punjabi Grill',
      orderTotal: 500,
    });

    expect(result.earnedPoints).toBe(0);
    expect(result.earnedCoins).toBe(0);
    expect(result.unlockedMilestones).toEqual([]);
  });
});
