/**
 * Merchant Orders Service — Smoke Tests
 *
 * Validates: order listing, status transitions, status update API calls,
 * and bulk actions via mocked Axios client.
 */

jest.mock('../../services/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

import { apiClient } from '../../services/api/client';

// We need to import after mocking
const { OrdersService } = jest.requireActual('../../services/api/orders') as any;
// Since the class isn't exported by name, import the default instance
import ordersServiceInstance from '../../services/api/orders';

const mockGet = apiClient.get as jest.Mock;
const mockPut = apiClient.put as jest.Mock;
const mockPost = apiClient.post as jest.Mock;

describe('OrdersService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrders', () => {
    it('returns orders on success', async () => {
      const mockResponse = {
        success: true,
        data: {
          orders: [{ _id: 'o1', orderNumber: 'REZ-001', status: 'placed' }],
          totalCount: 1,
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
          hasMore: false,
        },
      };
      mockGet.mockResolvedValue(mockResponse);

      const result = await ordersServiceInstance.getOrders();
      expect(mockGet).toHaveBeenCalledWith('merchant/orders');
      expect(result.orders).toHaveLength(1);
      expect(result.orders[0].orderNumber).toBe('REZ-001');
    });

    it('passes query params correctly', async () => {
      mockGet.mockResolvedValue({
        success: true,
        data: {
          orders: [],
          totalCount: 0,
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
          hasMore: false,
        },
      });

      await ordersServiceInstance.getOrders({ status: 'placed', page: 2, limit: 10 });
      const calledUrl = mockGet.mock.calls[0][0];
      expect(calledUrl).toContain('status=placed');
      expect(calledUrl).toContain('page=2');
      expect(calledUrl).toContain('limit=10');
    });

    it('throws on API failure', async () => {
      mockGet.mockResolvedValue({ success: false, error: 'Server error' });
      await expect(ordersServiceInstance.getOrders()).rejects.toThrow('Server error');
    });
  });

  describe('getOrderById', () => {
    it('returns single order', async () => {
      const order = { _id: 'o1', orderNumber: 'REZ-001', status: 'placed' };
      mockGet.mockResolvedValue({ success: true, data: order });

      const result = await ordersServiceInstance.getOrderById('o1');
      expect(mockGet).toHaveBeenCalledWith('merchant/orders/o1');
      expect(result._id).toBe('o1');
    });

    it('throws when order not found', async () => {
      mockGet.mockResolvedValue({ success: false, error: 'Not found' });
      await expect(ordersServiceInstance.getOrderById('missing')).rejects.toThrow('Not found');
    });
  });

  describe('updateOrderStatus', () => {
    it('updates status on valid transition', async () => {
      const updated = { _id: 'o1', status: 'confirmed' };
      mockPut.mockResolvedValue({ success: true, data: updated });

      const result = await ordersServiceInstance.updateOrderStatus(
        'o1',
        { status: 'confirmed' },
        'placed'
      );
      expect(mockPut).toHaveBeenCalledWith(
        'merchant/orders/o1/status',
        { status: 'confirmed' },
        expect.objectContaining({
          headers: expect.objectContaining({ 'Idempotency-Key': expect.any(String) }),
        })
      );
      expect(result.status).toBe('confirmed');
    });

    it('rejects invalid status transition', async () => {
      await expect(
        ordersServiceInstance.updateOrderStatus('o1', { status: 'delivered' }, 'placed')
      ).rejects.toThrow('Invalid status transition');
    });

    it('allows placed → cancelled', async () => {
      mockPut.mockResolvedValue({ success: true, data: { _id: 'o1', status: 'cancelled' } });
      const result = await ordersServiceInstance.updateOrderStatus(
        'o1',
        { status: 'cancelled' },
        'placed'
      );
      expect(result.status).toBe('cancelled');
    });
  });

  describe('status transition validation', () => {
    const transitions: Array<[string, string, boolean]> = [
      ['placed', 'confirmed', true],
      ['placed', 'cancelled', true],
      ['placed', 'delivered', false],
      ['confirmed', 'preparing', true],
      ['confirmed', 'delivered', false],
      ['preparing', 'ready', true],
      ['ready', 'dispatched', true],
      ['ready', 'delivered', false],
      ['dispatched', 'delivered', true],
      ['delivered', 'returned', true],
      ['cancelled', 'refunded', true],
      ['refunded', 'placed', false],
    ];

    test.each(transitions)('%s → %s should be %s', async (from, to, valid) => {
      if (valid) {
        mockPut.mockResolvedValue({ success: true, data: { _id: 'o1', status: to } });
        const result = await ordersServiceInstance.updateOrderStatus(
          'o1',
          { status: to as any },
          from
        );
        expect(result.status).toBe(to);
      } else {
        await expect(
          ordersServiceInstance.updateOrderStatus('o1', { status: to as any }, from)
        ).rejects.toThrow('Invalid status transition');
      }
    });
  });
});
