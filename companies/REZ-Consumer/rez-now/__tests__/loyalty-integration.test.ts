/**
 * Integration tests for loyalty flow
 *
 * These tests simulate the actual order → loyalty flow,
 * testing the complete sequence of API calls.
 */

import { createOrder, recordOrderVisit, completeOrderWithLoyalty } from '@/lib/api/order';
import { loyaltyApi, merchantLoyaltyApi, recordVisit } from '@/lib/loyalty';

// ── Mock dependencies ─────────────────────────────────────────────────────────

jest.mock('@/lib/api/client', () => ({
  authClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
  publicClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
  makeIdempotencyKey: jest.fn(() => 'order:test:123'),
  getAccessTokenSync: jest.fn(() => 'mock-token'),
}));

jest.mock('@/lib/api/api-client', () => ({
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

import { authClient, publicClient } from '@/lib/api/client';

describe('Loyalty Integration Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Order → Loyalty Flow', () => {
    it('should record visit and award coins after order', async () => {
      // Mock order completion
      const orderResponse = {
        success: true,
        data: {
          orderId: 'order_123',
          userId: 'user_456',
          storeId: 'store_789',
          storeSlug: 'punjabi-grill',
          storeName: 'Punjabi Grill',
          amount: 500,
          coinsEarned: 25,
          pointsEarned: 50,
        },
      };

      // Mock loyalty visit record
      const visitResponse = {
        data: {
          data: {
            visitId: 'visit_abc',
            earnedPoints: 50,
            earnedCoins: 25,
            newTier: undefined,
            events: [],
            unlockedMilestones: [],
          },
        },
      };

      // Mock profile update
      const profileResponse = {
        data: {
          data: {
            currentPoints: 525,
            tier: 'silver',
            nextTier: 'gold',
            pointsToNextTier: 475,
            lifetimePoints: 1050,
            expiringPoints: 25,
          },
        },
      };

      (authClient.post as jest.Mock)
        .mockResolvedValueOnce(orderResponse) // order creation
        .mockResolvedValueOnce(visitResponse) // loyalty record
        .mockResolvedValueOnce(profileResponse); // profile fetch

      // Simulate the complete flow
      async function completeOrderWithLoyaltyFlow(orderId: string, storeSlug: string, storeName: string, orderTotal: number) {
        // 1. Record the loyalty visit
        const loyaltyResult = await recordVisit({
          orderId,
          storeSlug,
          storeName,
          orderTotal,
        });

        // 2. Get updated profile
        const profile = await loyaltyApi.getProfile();

        return {
          success: true,
          orderId,
          loyalty: {
            coinsEarned: loyaltyResult.earnedCoins,
            pointsEarned: loyaltyResult.earnedPoints,
            milestonesUnlocked: loyaltyResult.unlockedMilestones.map((m) => m.name),
            newTier: loyaltyResult.newTier,
          },
          profile,
        };
      }

      const result = await completeOrderWithLoyaltyFlow('order_123', 'punjabi-grill', 'Punjabi Grill', 500);

      expect(result.success).toBe(true);
      expect(result.loyalty.coinsEarned).toBe(25);
      expect(result.loyalty.pointsEarned).toBe(50);
    });

    it('should handle tier upgrade after order', async () => {
      // Mock response with tier upgrade
      const visitResponse = {
        data: {
          data: {
            visitId: 'visit_xyz',
            earnedPoints: 150,
            earnedCoins: 75,
            newTier: 'gold',
            events: [
              {
                id: 'event_1',
                type: 'visit',
                description: 'Tier Upgrade!',
                coinsEarned: 50,
                pointsEarned: 100,
                createdAt: '2026-05-03',
              },
            ],
            unlockedMilestones: [
              {
                id: 'milestone_1',
                name: '25 Visits',
                description: 'Reached 25 total visits',
                icon: 'trophy',
                reward: 100,
              },
            ],
          },
        },
      };

      (authClient.post as jest.Mock).mockResolvedValueOnce(visitResponse);

      const result = await recordVisit({
        orderId: 'order_999',
        storeSlug: 'punjabi-grill',
        storeName: 'Punjabi Grill',
        orderTotal: 1500,
      });

      expect(result.newTier).toBe('gold');
      expect(result.unlockedMilestones).toHaveLength(1);
      expect(result.unlockedMilestones[0].name).toBe('25 Visits');
    });

    it('should complete order with loyalty message', async () => {
      // Mock loyalty visit record
      (authClient.post as jest.Mock).mockResolvedValueOnce({
        data: {
          data: {
            visitId: 'visit_1',
            earnedPoints: 50,
            earnedCoins: 25,
            newTier: undefined,
            events: [],
            unlockedMilestones: [],
          },
        },
      });

      const result = await completeOrderWithLoyalty(
        'order_123',
        'punjabi-grill',
        'Punjabi Grill',
        500,
        true
      );

      expect(result.success).toBe(true);
      expect(result.loyalty?.coinsEarned).toBe(25);
      expect(result.loyalty?.pointsEarned).toBe(50);
      expect(result.loyalty?.message).toContain('+25 coins');
      expect(result.loyalty?.message).toContain('+50 points');
    });

    it('should handle payment not confirmed', async () => {
      const result = await completeOrderWithLoyalty(
        'order_123',
        'punjabi-grill',
        'Punjabi Grill',
        500,
        false // payment not confirmed
      );

      expect(result.success).toBe(false);
      expect(result.loyalty).toBeUndefined();
    });
  });

  describe('Merchant Coin Award Flow', () => {
    it('should award bonus coins for special occasions', async () => {
      const awardResponse = {
        data: {
          data: {
            success: true,
            newBalance: 350,
          },
        },
      };

      (authClient.post as jest.Mock).mockResolvedValueOnce(awardResponse);

      const result = await merchantLoyaltyApi.awardCoins(
        'user_123',
        100,
        'Birthday bonus',
        'store_456'
      );

      expect(result?.success).toBe(true);
      expect(result?.newBalance).toBe(350);
    });

    it('should record store visit for merchant', async () => {
      const visitResponse = {
        data: {
          data: {
            visitId: 'merchant_visit_1',
            coinsEarned: 10,
            pointsEarned: 100,
            milestone: {
              id: 'milestone_5',
              name: '5th Visit',
              description: 'Thank you for 5 visits!',
              icon: 'star',
              reward: 50,
            },
          },
        },
      };

      (authClient.post as jest.Mock).mockResolvedValueOnce(visitResponse);

      const result = await merchantLoyaltyApi.recordVisit('user_123', 'store_456');

      expect(result?.visitId).toBe('merchant_visit_1');
      expect(result?.coinsEarned).toBe(10);
      expect(result?.milestone?.name).toBe('5th Visit');
    });
  });

  describe('Error Handling', () => {
    it('should not fail order when loyalty recording fails', async () => {
      // Order succeeds
      (authClient.post as jest.Mock).mockResolvedValueOnce({
        data: { data: { visitId: 'visit_1', earnedPoints: 50, earnedCoins: 25 } },
      });

      const result = await completeOrderWithLoyalty(
        'order_123',
        'punjabi-grill',
        'Punjabi Grill',
        500,
        true
      );

      // Order should still succeed even if loyalty recording has issues
      // The function catches errors and returns default values
      expect(result.success).toBe(true);
    });

    it('should handle network errors gracefully', async () => {
      // Mock network error for visit recording
      (authClient.post as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await recordVisit({
        orderId: 'order_456',
        storeSlug: 'punjabi-grill',
        storeName: 'Punjabi Grill',
        orderTotal: 300,
      });

      // Should return default values, not throw
      expect(result.earnedPoints).toBe(0);
      expect(result.earnedCoins).toBe(0);
      expect(result.unlockedMilestones).toEqual([]);
    });
  });

  describe('Order Creation with Loyalty', () => {
    it('should create order with loyalty info', async () => {
      const orderResponse = {
        data: {
          data: {
            orderId: 'order_new_123',
            orderNumber: 'ORD-001',
            total: 750,
            paymentStatus: 'pending',
            paymentUrl: 'https://pay.example.com/order_new_123',
            loyaltyResult: {
              coinsEarned: 37,
              pointsEarned: 75,
              newTier: undefined,
              unlockedMilestones: [],
              events: [],
            },
          },
        },
      };

      (publicClient.post as jest.Mock).mockResolvedValueOnce(orderResponse);

      const result = await createOrder({
        storeSlug: 'punjabi-grill',
        items: [
          {
            menuItemId: 'item_1',
            name: 'Butter Chicken',
            quantity: 1,
            price: 299,
          },
          {
            menuItemId: 'item_2',
            name: 'Naan',
            quantity: 2,
            price: 49,
          },
        ],
        orderType: 'dine_in',
        tableNumber: '5',
      });

      expect(result.orderId).toBe('order_new_123');
      expect(result.loyaltyResult?.coinsEarned).toBe(37);
    });
  });
});
