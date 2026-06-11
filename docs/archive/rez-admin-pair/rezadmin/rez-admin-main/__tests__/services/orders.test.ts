/**
 * Admin Orders Service — Smoke Tests
 *
 * Validates: order listing, filtering, stats, status updates, and refunds.
 */

jest.mock('../../services/api/apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

import { apiClient } from '../../services/api/apiClient';

const mockGet = apiClient.get as jest.Mock;
const mockPut = apiClient.put as jest.Mock;
const mockPost = apiClient.post as jest.Mock;

let ordersService: any;
beforeAll(async () => {
  ordersService = await import('../../services/api/orders');
});

const MOCK_ORDER = {
  _id: 'o1',
  orderNumber: 'REZ-0001',
  status: 'placed',
  paymentStatus: 'paid',
  paymentMethod: 'razorpay',
  deliveryType: 'delivery',
  totals: { subtotal: 500, tax: 25, total: 545 },
  createdAt: '2024-06-01T10:00:00Z',
};

describe('OrdersService (Admin)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrders', () => {
    it('fetches orders with default params', async () => {
      mockGet.mockResolvedValue({
        success: true,
        data: { orders: [MOCK_ORDER], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } },
      });

      const result = await ordersService.default.getOrders();
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('admin/orders'));
      expect(result.orders).toBeDefined();
    });

    it('passes filter params', async () => {
      mockGet.mockResolvedValue({
        success: true,
        data: { orders: [], pagination: { page: 2, limit: 20, total: 0, totalPages: 0 } },
      });

      await ordersService.default.getOrders(2, 20, 'cancelled');
      const url = mockGet.mock.calls[0][0];
      expect(url).toContain('status=cancelled');
      expect(url).toContain('page=2');
    });
  });

  describe('getOrder', () => {
    it('fetches single order', async () => {
      mockGet.mockResolvedValue({ success: true, data: MOCK_ORDER });

      const result = await ordersService.default.getOrder('o1');
      expect(mockGet).toHaveBeenCalledWith('admin/orders/o1');
      expect(result._id).toBe('o1');
    });
  });

  describe('getStats', () => {
    it('fetches order statistics', async () => {
      const stats = { total: 1500, today: 45, thisWeek: 300, thisMonth: 1200 };
      mockGet.mockResolvedValue({ success: true, data: stats });

      const result = await ordersService.default.getStats();
      expect(mockGet).toHaveBeenCalledWith('admin/orders/stats');
      expect(result.total).toBe(1500);
    });
  });

  describe('updateOrderStatus', () => {
    it('updates order status', async () => {
      mockPut.mockResolvedValue({ success: true, message: 'Status updated' });

      const result = await ordersService.default.updateOrderStatus(
        'o1',
        'confirmed',
        'Verified payment'
      );
      expect(mockPut).toHaveBeenCalledWith('admin/orders/o1/status', {
        status: 'confirmed',
        notes: 'Verified payment',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('refundOrder', () => {
    it('processes refund for an order', async () => {
      mockPost.mockResolvedValue({ success: true, message: 'Order refunded' });

      const result = await ordersService.default.refundOrder('o1', 199.99, 'Customer request');
      expect(mockPost).toHaveBeenCalledWith('admin/orders/o1/refund', {
        amount: 199.99,
        reason: 'Customer request',
        idempotencyKey: expect.any(String),
        includeCoins: true,
      });
      expect(result.success).toBe(true);
    });
  });
});
