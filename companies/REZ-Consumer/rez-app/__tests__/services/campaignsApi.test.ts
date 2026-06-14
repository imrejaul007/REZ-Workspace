// @ts-nocheck
import campaignsApi from '@/services/campaignsApi';

jest.mock('@/services/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockClient = require('@/services/apiClient').default;

const mockCampaign = {
  _id: 'camp1',
  campaignId: 'camp1',
  title: '10% Cashback Weekend',
  subtitle: 'Earn more this weekend',
  badge: 'HOT',
  badgeBg: '#FF0000',
  badgeColor: '#fff',
  gradientColors: ['#FF0000', '#FF6600'],
  type: 'cashback' as const,
  deals: [],
  startTime: '2026-04-05T00:00:00Z',
  endTime: '2026-04-07T23:59:59Z',
  isActive: true,
  priority: 1,
};

describe('campaignsApi', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getActiveCampaigns', () => {
    it('returns active campaigns', async () => {
      mockClient.get.mockResolvedValueOnce({ success: true, data: { campaigns: [mockCampaign], total: 1 } });
      const res = await campaignsApi.getActiveCampaigns();
      expect(res.success).toBe(true);
      expect(res.data?.campaigns).toHaveLength(1);
      expect(mockClient.get).toHaveBeenCalledWith('/campaigns/active', expect.anything());
    });

    it('supports limit and type filter', async () => {
      mockClient.get.mockResolvedValueOnce({ success: true, data: { campaigns: [], total: 0 } });
      await campaignsApi.getActiveCampaigns({ limit: 3, type: 'cashback' });
      expect(mockClient.get).toHaveBeenCalledWith('/campaigns/active', expect.objectContaining({ limit: 3, type: 'cashback' }));
    });

    it('handles API error gracefully', async () => {
      mockClient.get.mockRejectedValueOnce(new Error('Network error'));
      const res = await campaignsApi.getActiveCampaigns();
      expect(res.success).toBe(false);
    });
  });

  describe('getExcitingDeals', () => {
    it('returns exciting deals', async () => {
      mockClient.get.mockResolvedValueOnce({ success: true, data: { deals: [{ id: 'd1', title: 'Deal 1' }], total: 1 } });
      const res = await campaignsApi.getExcitingDeals(6);
      expect(res.success).toBe(true);
    });
  });

  describe('getCampaignById', () => {
    it('returns campaign by id', async () => {
      mockClient.get.mockResolvedValueOnce({ success: true, data: mockCampaign });
      const res = await campaignsApi.getCampaignById('camp1');
      expect(res.success).toBe(true);
      expect(res.data?.campaignId).toBe('camp1');
      expect(mockClient.get).toHaveBeenCalledWith('/campaigns/camp1');
    });

    it('handles campaign not found', async () => {
      mockClient.get.mockResolvedValueOnce({ success: false, message: 'Campaign not found' });
      const res = await campaignsApi.getCampaignById('invalid');
      expect(res.success).toBe(false);
    });
  });

  describe('getCampaignsByType', () => {
    it('returns campaigns filtered by type', async () => {
      mockClient.get.mockResolvedValueOnce({ success: true, data: { campaigns: [mockCampaign], total: 1 } });
      const res = await campaignsApi.getCampaignsByType('cashback', 10);
      expect(res.success).toBe(true);
      expect(mockClient.get).toHaveBeenCalledWith('/campaigns/type/cashback', expect.objectContaining({ limit: 10 }));
    });
  });

  describe('getMyDeals', () => {
    it('returns user purchased deals', async () => {
      mockClient.get.mockResolvedValueOnce({ success: true, data: { redemptions: [], total: 0 } });
      const res = await campaignsApi.getMyDeals({ status: 'active' });
      expect(res.success).toBe(true);
    });
  });

  describe('redeemDeal', () => {
    it('redeems a deal', async () => {
      mockClient.post.mockResolvedValueOnce({ success: true, data: { type: 'free', redemption: { id: 'red1', code: 'DEAL123', status: 'active' } } });
      const res = await campaignsApi.redeemDeal({ campaignId: 'camp1', dealIndex: 0 });
      expect(res.success).toBe(true);
    });
  });

  describe('getRedemptionByCode', () => {
    it('returns redemption details by code', async () => {
      mockClient.get.mockResolvedValueOnce({ success: true, data: { id: 'red1', code: 'DEAL123', status: 'active' } });
      const res = await campaignsApi.getRedemptionByCode('DEAL123');
      expect(res.success).toBe(true);
    });
  });

  describe('cancelRedemption', () => {
    it('cancels a redemption', async () => {
      mockClient.delete.mockResolvedValueOnce({ success: true, data: { message: 'Cancelled' } });
      const res = await campaignsApi.cancelRedemption('red1');
      expect(res.success).toBe(true);
    });
  });
});
