/** Snapchat Integration - Service Tests */
import { SnapchatApiService } from '../services/snapchatApiService';
import { CampaignService } from '../services/campaignService';

jest.mock('../models', () => ({
  SnapchatCampaign: { find: jest.fn(), findById: jest.fn(), create: jest.fn(), findByIdAndUpdate: jest.fn() },
  SnapchatAd: { find: jest.fn(), create: jest.fn(), findByIdAndUpdate: jest.fn() },
  SnapchatAudience: { find: jest.fn(), create: jest.fn() },
  SnapchatAdAccount: { findById: jest.fn(), create: jest.fn() },
  SnapchatPixel: { find: jest.fn(), create: jest.fn() },
}));

describe('SnapchatApiService', () => {
  let service: SnapchatApiService;

  beforeEach(() => { jest.clearAllMocks(); service = new SnapchatApiService({ accessToken: 'test-token', adAccountId: 'test-account' }); });

  describe('createCampaign', () => {
    it('should create campaign via API', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'snap-camp-123', name: 'Test' }) } as Response));
      const result = await service.createCampaign({ name: 'Test', objective: 'REACH' });
      expect(result).toBeDefined();
    });
  });

  describe('createAd', () => {
    it('should create ad via API', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'snap-ad-123' }) } as Response);
      const result = await service.createAd({ campaignId: 'camp-123', name: 'Test Ad', adType: 'SINGLE_IMAGE' });
      expect(result).toBeDefined();
    });
  });

  describe('getCampaignStats', () => {
    it('should return campaign statistics', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({ ok: true, json: async () => ({ impressions: 10000, clicks: 500 }) } as Response);
      const result = await service.getCampaignStats('camp-123');
      expect(result).toBeDefined();
    });
  });
});

describe('CampaignService', () => {
  let service: CampaignService;

  beforeEach(() => { jest.clearAllMocks(); service = new CampaignService(); });

  describe('createCampaign', () => {
    it('should create and save campaign', async () => {
      const SnapchatCampaign = require('../models').SnapchatCampaign;
      SnapchatCampaign.create.mockResolvedValue(createMockCampaign());
      const result = await service.createCampaign({ name: 'Test', budget: 1000, objective: 'AWARENESS' });
      expect(result.name).toBe('Test');
    });
  });

  describe('getCampaigns', () => {
    it('should return all campaigns', async () => {
      const SnapchatCampaign = require('../models').SnapchatCampaign;
      SnapchatCampaign.find.mockResolvedValue([createMockCampaign(), createMockCampaign({ name: 'Campaign 2' })]);
      const result = await service.getCampaigns();
      expect(result).toHaveLength(2);
    });
  });

  describe('updateCampaign', () => {
    it('should update campaign status', async () => {
      const SnapchatCampaign = require('../models').SnapchatCampaign;
      SnapchatCampaign.findByIdAndUpdate.mockResolvedValue(createMockCampaign({ status: 'paused' }));
      const result = await service.updateCampaign('camp-123', { status: 'paused' });
      expect(result?.status).toBe('paused');
    });
  });
});