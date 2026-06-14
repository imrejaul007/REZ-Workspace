/**
 * Unit tests for useLoyalty hook
 * Tests React hooks that manage loyalty state
 */

import { renderHook, waitFor, act } from '@testing-library/react';

// Mock the loyalty API
jest.mock('@/lib/loyalty', () => ({
  loyaltyApi: {
    getProfile: jest.fn(),
    getVisitStreak: jest.fn(),
    getCoins: jest.fn(),
    getBadges: jest.fn(),
    recordVisit: jest.fn(),
    checkInStreak: jest.fn(),
    getStreaks: jest.fn(),
    getFrequentItems: jest.fn(),
    getTasteProfile: jest.fn(),
  },
  merchantLoyaltyApi: {
    getCustomerStats: jest.fn(),
  },
}));

import { loyaltyApi, merchantLoyaltyApi } from '@/lib/loyalty';

describe('useLoyalty', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should load loyalty profile on mount', async () => {
    const mockProfile = {
      currentPoints: 500,
      tier: 'silver' as const,
      nextTier: 'gold',
      pointsToNextTier: 500,
      lifetimePoints: 1000,
      expiringPoints: 100,
    };

    const mockStreak = {
      totalVisits: 10,
      currentStreak: 3,
      longestStreak: 5,
      nextMilestone: null,
      recentVisits: [],
    };

    const mockCoins = {
      available: 250,
      expiring: 50,
      expiryDate: '2026-06-01',
    };

    (loyaltyApi.getProfile as jest.Mock).mockResolvedValueOnce(mockProfile);
    (loyaltyApi.getVisitStreak as jest.Mock).mockResolvedValueOnce(mockStreak);
    (loyaltyApi.getCoins as jest.Mock).mockResolvedValueOnce(mockCoins);
    (loyaltyApi.getBadges as jest.Mock).mockResolvedValueOnce([]);

    const { useLoyalty } = await import('@/lib/hooks/useLoyalty');

    const { result } = renderHook(() => useLoyalty());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.profile?.tier).toBe('silver');
    expect(result.current.streak?.currentStreak).toBe(3);
    expect(result.current.coins?.available).toBe(250);
  });

  it('should handle errors gracefully', async () => {
    (loyaltyApi.getProfile as jest.Mock).mockRejectedValueOnce(new Error('API Error'));
    (loyaltyApi.getVisitStreak as jest.Mock).mockRejectedValueOnce(new Error('API Error'));
    (loyaltyApi.getCoins as jest.Mock).mockRejectedValueOnce(new Error('API Error'));
    (loyaltyApi.getBadges as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    const { useLoyalty } = await import('@/lib/hooks/useLoyalty');

    const { result } = renderHook(() => useLoyalty());

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(result.current.profile).toBeNull();
  });

  it('should load badges', async () => {
    const mockBadges = [
      {
        id: 'badge_1',
        name: 'First Visit',
        icon: 'star',
        rarity: 'common' as const,
        earnedAt: '2025-01-01',
      },
      {
        id: 'badge_2',
        name: '10 Orders',
        icon: 'trophy',
        rarity: 'rare' as const,
        earnedAt: '2025-03-15',
      },
    ];

    (loyaltyApi.getProfile as jest.Mock).mockResolvedValueOnce({
      currentPoints: 100,
      tier: 'bronze' as const,
      nextTier: 'silver',
      pointsToNextTier: 100,
      lifetimePoints: 100,
      expiringPoints: 0,
    });
    (loyaltyApi.getVisitStreak as jest.Mock).mockResolvedValueOnce({
      totalVisits: 0,
      currentStreak: 0,
      longestStreak: 0,
      nextMilestone: null,
      recentVisits: [],
    });
    (loyaltyApi.getCoins as jest.Mock).mockResolvedValueOnce({
      available: 0,
      expiring: 0,
      expiryDate: '',
    });
    (loyaltyApi.getBadges as jest.Mock).mockResolvedValueOnce(mockBadges);

    const { useLoyalty } = await import('@/lib/hooks/useLoyalty');

    const { result } = renderHook(() => useLoyalty());

    await waitFor(() => {
      expect(result.current.badges).toHaveLength(2);
    });

    expect(result.current.badges?.[0].name).toBe('First Visit');
    expect(result.current.badges?.[1].rarity).toBe('rare');
  });
});

describe('useMerchantLoyalty', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should load merchant-specific loyalty', async () => {
    const mockStats = {
      visits: 5,
      totalSpent: 2000,
      coinsEarned: 75,
      currentTier: 'bronze',
      lastVisit: '2026-05-01',
      frequentItems: [],
    };

    (merchantLoyaltyApi.getCustomerStats as jest.Mock).mockResolvedValueOnce(mockStats);

    const { useMerchantLoyalty } = await import('@/lib/hooks/useLoyalty');

    const { result } = renderHook(() => useMerchantLoyalty('store_456', 'user_123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats?.visits).toBe(5);
    expect(result.current.stats?.totalSpent).toBe(2000);
  });

  it('should not fetch when userId is missing', async () => {
    const { useMerchantLoyalty } = await import('@/lib/hooks/useLoyalty');

    const { result } = renderHook(() => useMerchantLoyalty('store_456', undefined));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats).toBeNull();
    expect(merchantLoyaltyApi.getCustomerStats).not.toHaveBeenCalled();
  });

  it('should include frequent items in stats', async () => {
    const mockStats = {
      visits: 10,
      totalSpent: 5000,
      coinsEarned: 200,
      currentTier: 'silver',
      lastVisit: '2026-05-01',
      frequentItems: [
        {
          menuItemId: 'item_1',
          name: 'Butter Chicken',
          orderCount: 5,
          lastOrderedAt: '2026-04-28',
        },
      ],
    };

    (merchantLoyaltyApi.getCustomerStats as jest.Mock).mockResolvedValueOnce(mockStats);

    const { useMerchantLoyalty } = await import('@/lib/hooks/useLoyalty');

    const { result } = renderHook(() => useMerchantLoyalty('store_456', 'user_123'));

    await waitFor(() => {
      expect(result.current.stats?.frequentItems).toHaveLength(1);
    });

    expect(result.current.stats?.frequentItems?.[0].name).toBe('Butter Chicken');
  });
});

describe('useFrequentItems', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should load frequent items for store', async () => {
    const mockItems = [
      {
        menuItemId: 'item_1',
        name: 'Butter Chicken',
        price: 299,
        orderCount: 10,
        lastOrderedAt: '2026-05-01',
        isAvailable: true,
      },
      {
        menuItemId: 'item_2',
        name: 'Naan',
        price: 49,
        orderCount: 8,
        lastOrderedAt: '2026-05-01',
        isAvailable: true,
      },
    ];

    const mockTasteProfile = {
      spiceTolerance: 7,
      preferredCuisines: ['Indian', 'Chinese'],
      orderingFrequency: 'weekly' as const,
      favoriteCategories: ['Curry', 'Breads'],
    };

    (loyaltyApi.getFrequentItems as jest.Mock).mockResolvedValueOnce(mockItems);
    (loyaltyApi.getTasteProfile as jest.Mock).mockResolvedValueOnce(mockTasteProfile);

    const { useFrequentItems } = await import('@/lib/hooks/useLoyalty');

    const { result } = renderHook(() => useFrequentItems('punjabi-grill', 5));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.items).toHaveLength(2);
    expect(result.current.tasteProfile?.spiceTolerance).toBe(7);
  });

  it('should handle errors with empty items', async () => {
    (loyaltyApi.getFrequentItems as jest.Mock).mockRejectedValueOnce(new Error('Failed'));
    (loyaltyApi.getTasteProfile as jest.Mock).mockRejectedValueOnce(new Error('Failed'));

    const { useFrequentItems } = await import('@/lib/hooks/useLoyalty');

    const { result } = renderHook(() => useFrequentItems('unknown-store'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.items).toEqual([]);
    expect(result.current.error).toBeTruthy();
  });
});

describe('useStreaks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should load gamification streaks', async () => {
    const mockStreaks = {
      login: { current: 5, required: 7, reward: 10 },
      order: { current: 3, required: 5, reward: 25 },
      review: null,
      savings: null,
    };

    (loyaltyApi.getStreaks as jest.Mock).mockResolvedValueOnce(mockStreaks);

    const { useStreaks } = await import('@/lib/hooks/useLoyalty');

    const { result } = renderHook(() => useStreaks());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.streaks.login?.current).toBe(5);
    expect(result.current.streaks.order?.required).toBe(5);
  });

  it('should handle checkIn', async () => {
    const mockCheckInResult = {
      success: true,
      currentStreak: 6,
      reward: 10,
    };

    (loyaltyApi.getStreaks as jest.Mock).mockResolvedValueOnce({
      login: { current: 5, required: 7, reward: 10 },
      order: null,
      review: null,
      savings: null,
    });
    (loyaltyApi.checkInStreak as jest.Mock).mockResolvedValueOnce(mockCheckInResult);

    const { useStreaks } = await import('@/lib/hooks/useLoyalty');

    const { result } = renderHook(() => useStreaks());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let checkInResult;
    await act(async () => {
      checkInResult = await result.current.checkIn('login');
    });

    expect(checkInResult?.success).toBe(true);
    expect(checkInResult?.currentStreak).toBe(6);
  });
});
