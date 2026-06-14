// @ts-nocheck
import cashbackApi from '@/services/cashbackApi';

jest.mock('@/services/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockClient = require('@/services/apiClient').default;

describe('cashbackApi', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getCashbackSummary', () => {
    it('returns cashback summary', async () => {
      mockClient.get.mockResolvedValueOnce({
        success: true,
        data: { totalEarned: 500, pending: 100, credited: 400, expired: 0, cancelled: 0, pendingCount: 2, creditedCount: 10, expiredCount: 0 },
      });
      const res = await cashbackApi.getCashbackSummary();
      expect(res.success).toBe(true);
      expect(res.data?.totalEarned).toBe(500);
      expect(mockClient.get).toHaveBeenCalledWith('/cashback/summary');
    });

    it('re-throws on API error', async () => {
      // getCashbackSummary re-throws — it does not return {success:false}
      mockClient.get.mockRejectedValueOnce(new Error('Network error'));
      await expect(cashbackApi.getCashbackSummary()).rejects.toThrow('Network error');
    });
  });

  describe('getCashbackHistory', () => {
    it('returns history with pagination', async () => {
      mockClient.get.mockResolvedValueOnce({
        success: true,
        data: { cashbacks: [{ _id: 'cb1', amount: 50, status: 'credited' }], pagination: { total: 1, page: 1, pages: 1, limit: 10 } },
      });
      const res = await cashbackApi.getCashbackHistory({ page: 1, limit: 10 });
      expect(res.success).toBe(true);
      expect(res.data?.cashbacks).toHaveLength(1);
    });

    it('filters by status', async () => {
      mockClient.get.mockResolvedValueOnce({ success: true, data: { cashbacks: [], pagination: { total: 0, page: 1, pages: 0, limit: 10 } } });
      await cashbackApi.getCashbackHistory({ status: 'pending' });
      expect(mockClient.get).toHaveBeenCalledWith('/cashback/history', expect.objectContaining({ status: 'pending' }));
    });
  });

  describe('getPendingCashback', () => {
    it('returns pending cashbacks', async () => {
      mockClient.get.mockResolvedValueOnce({ success: true, data: { cashbacks: [], total: 0, count: 0 } });
      const res = await cashbackApi.getPendingCashback();
      expect(res.success).toBe(true);
      expect(mockClient.get).toHaveBeenCalledWith('/cashback/pending');
    });
  });

  describe('getExpiringSoon', () => {
    it('returns cashbacks expiring in given days', async () => {
      mockClient.get.mockResolvedValueOnce({ success: true, data: { cashbacks: [], total: 0, count: 0 } });
      await cashbackApi.getExpiringSoon(7);
      expect(mockClient.get).toHaveBeenCalledWith('/cashback/expiring-soon', { days: 7 });
    });
  });

  describe('redeemCashback', () => {
    it('redeems available cashback', async () => {
      mockClient.post.mockResolvedValueOnce({ success: true, data: { totalAmount: 400, count: 3, cashbacks: [] } });
      const res = await cashbackApi.redeemCashback();
      expect(res.success).toBe(true);
      expect(res.data?.totalAmount).toBe(400);
      expect(mockClient.post).toHaveBeenCalledWith('/cashback/redeem');
    });

    it('handles nothing to redeem', async () => {
      mockClient.post.mockResolvedValueOnce({ success: false, message: 'No cashback available' });
      const res = await cashbackApi.redeemCashback();
      expect(res.success).toBe(false);
    });
  });

  describe('getActiveCampaigns', () => {
    it('returns active cashback campaigns', async () => {
      mockClient.get.mockResolvedValueOnce({ success: true, data: { campaigns: [{ id: 'c1', title: '5% Cashback' }] } });
      const res = await cashbackApi.getActiveCampaigns();
      expect(res.success).toBe(true);
      expect(res.data?.campaigns).toHaveLength(1);
    });
  });

  describe('getStatistics', () => {
    it('returns cashback statistics', async () => {
      mockClient.get.mockResolvedValueOnce({ success: true, data: { monthly: [], bySource: {}, trend: 'up' } });
      const res = await cashbackApi.getStatistics();
      expect(res.success).toBe(true);
      expect(mockClient.get).toHaveBeenCalledWith('/cashback/statistics', expect.anything());
    });
  });
});
