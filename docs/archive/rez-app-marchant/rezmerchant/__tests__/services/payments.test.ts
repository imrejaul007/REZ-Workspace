/**
 * Merchant Payments Service — Smoke Tests
 *
 * Validates: payment listing, stats fetching, recent payments shortcut,
 * query param construction, and error handling.
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
import paymentsService from '../../services/api/payments';

const mockGet = apiClient.get as jest.Mock;

describe('PaymentsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPayments', () => {
    it('fetches payments for a store', async () => {
      const mockData = {
        success: true,
        data: {
          transactions: [{ paymentId: 'p1', storeId: 's1', amount: 500, status: 'completed' }],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          },
        },
      };
      mockGet.mockResolvedValue(mockData);

      const result = await paymentsService.getPayments('s1');
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('store-payment/history/s1'));
      expect(result.data.transactions).toHaveLength(1);
      expect(result.data.transactions[0].amount).toBe(500);
    });

    it('passes filter params correctly', async () => {
      mockGet.mockResolvedValue({
        success: true,
        data: {
          transactions: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        },
      });

      await paymentsService.getPayments('s1', { page: 2, limit: 10, status: 'completed' });
      const url = mockGet.mock.calls[0][0];
      expect(url).toContain('page=2');
      expect(url).toContain('limit=10');
      expect(url).toContain('status=completed');
    });

    it('throws on API failure', async () => {
      mockGet.mockResolvedValue({ success: false, message: 'Store not found' });
      await expect(paymentsService.getPayments('invalid')).rejects.toThrow('Store not found');
    });
  });

  describe('getPaymentStats', () => {
    it('returns payment statistics', async () => {
      const mockStats = {
        success: true,
        data: {
          today: { paymentCount: 5, revenue: 2500 },
          thisMonth: { paymentCount: 150, revenue: 75000, averageTransactionValue: 500 },
          paymentMethods: [{ method: 'upi', count: 100, total: 50000 }],
        },
      };
      mockGet.mockResolvedValue(mockStats);

      const result = await paymentsService.getPaymentStats('s1');
      expect(mockGet).toHaveBeenCalledWith('store-payment/stats/s1');
      expect(result.data.today.revenue).toBe(2500);
      expect(result.data.paymentMethods).toHaveLength(1);
    });

    it('throws on failure', async () => {
      mockGet.mockResolvedValue({ success: false, message: 'Unauthorized' });
      await expect(paymentsService.getPaymentStats('s1')).rejects.toThrow('Unauthorized');
    });
  });

  describe('getRecentPayments', () => {
    it('delegates to getPayments with limit', async () => {
      mockGet.mockResolvedValue({
        success: true,
        data: {
          transactions: [],
          pagination: {
            page: 1,
            limit: 5,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        },
      });

      await paymentsService.getRecentPayments('s1', 3);
      const url = mockGet.mock.calls[0][0];
      expect(url).toContain('page=1');
      expect(url).toContain('limit=3');
    });

    it('defaults to limit of 5', async () => {
      mockGet.mockResolvedValue({
        success: true,
        data: {
          transactions: [],
          pagination: {
            page: 1,
            limit: 5,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        },
      });

      await paymentsService.getRecentPayments('s1');
      const url = mockGet.mock.calls[0][0];
      expect(url).toContain('limit=5');
    });
  });
});
