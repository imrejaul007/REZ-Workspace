// @ts-nocheck
/**
 * Checkout API Tests
 * Tests for checkoutApi.ts - 1-Click checkout
 */

import * as checkoutApi from '@/services/checkoutApi';

// Mock the API client
jest.mock('@/services/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.Mock,
  },
  ApiResponse: {},
}));

import apiClient from '@/services/apiClient';

describe('Checkout API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCheckoutSession', () => {
    it('should create checkout session', async () => {
      const mockSession = {
        id: 'session-123',
        userId: 'user-1',
        status: 'initiated' as const,
        createdAt: '2026-05-15T10:00:00Z',
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: mockSession,
      });

      const result = await checkoutApi.createCheckoutSession({ cartId: 'cart-1' });
      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('initiated');
    });
  });

  describe('applyCoupon', () => {
    it('should apply valid coupon', async () => {
      const mockResponse = {
        session: {
          id: 'session-123',
          appliedCoupons: [{ code: 'SAVE20', discount: 100 }],
        },
        discount: 100,
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: mockResponse,
      });

      const result = await checkoutApi.applyCoupon('session-123', 'SAVE20');
      expect(result.success).toBe(true);
      expect(result.data?.discount).toBe(100);
    });

    it('should reject invalid coupon', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        success: false,
        error: 'Invalid coupon code',
      });

      const result = await checkoutApi.applyCoupon('session-123', 'INVALID');
      expect(result.success).toBe(false);
    });
  });

  describe('calculateTotals', () => {
    it('should calculate checkout totals', async () => {
      const mockTotals = {
        subtotal: 1000,
        shipping: 50,
        tax: 90,
        discount: 100,
        couponDiscount: 0,
        loyaltyDiscount: 0,
        total: 1040,
        currency: 'INR',
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: mockTotals,
      });

      const result = await checkoutApi.calculateTotals('session-123');
      expect(result.success).toBe(true);
      expect(result.data?.total).toBe(1040);
    });
  });

  describe('completeCheckout', () => {
    it('should complete 1-click checkout', async () => {
      const mockResponse = {
        orderId: 'order-123',
        paymentId: 'pay-456',
        status: 'confirmed',
      };

      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: mockResponse,
      });

      const result = await checkoutApi.completeCheckout('session-123', {
        addressId: 'addr-1',
        paymentMethodId: 'pm-1',
      });

      expect(result.success).toBe(true);
      expect(result.data?.orderId).toBe('order-123');
    });
  });

  describe('getAbandonedCarts', () => {
    it('should fetch abandoned carts', async () => {
      const mockCarts = {
        carts: [
          { id: 'cart-1', total: 500, status: 'pending' as const },
        ],
        pagination: { page: 1, limit: 10, total: 1, pages: 1 },
      };

      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: mockCarts,
      });

      const result = await checkoutApi.getAbandonedCarts({ page: 1 });
      expect(result.success).toBe(true);
      expect(result.data?.carts).toHaveLength(1);
    });
  });
});
