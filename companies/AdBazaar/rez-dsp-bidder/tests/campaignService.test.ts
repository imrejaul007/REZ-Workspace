/**
 * DSP Bidder - Campaign Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock mongoose models
vi.mock('../src/models/Campaign.js', () => ({
  CampaignModel: {
    create: vi.fn(),
    findById: vi.fn(),
    find: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    findByIdAndDelete: vi.fn(),
  },
}));

vi.mock('../src/models/Creative.js', () => ({
  CreativeModel: {
    create: vi.fn(),
  },
}));

vi.mock('../src/models/BudgetTracker.js', () => ({
  BudgetTrackerModel: {
    create: vi.fn(),
    findOne: vi.fn(),
    find: vi.fn(),
  },
}));

// Import after mocking
import { CampaignService } from '../src/services/campaignService.js';

describe('CampaignService', () => {
  let service: CampaignService;

  beforeEach(() => {
    service = new CampaignService();
    vi.clearAllMocks();
  });

  describe('createCampaign', () => {
    it('should create a campaign with correct data', async () => {
      const mockCampaign = {
        _id: 'campaign-123',
        name: 'Test Campaign',
        budget: 1000,
        status: 'active',
      };

      const { CampaignModel } = await import('../src/models/Campaign.js');
      const { BudgetTrackerModel } = await import('../src/models/BudgetTracker.js');

      (CampaignModel.create as any).mockResolvedValue(mockCampaign);
      (BudgetTrackerModel.create as any).mockResolvedValue({});

      const result = await service.createCampaign({
        name: 'Test Campaign',
        budget: 1000,
        startDate: new Date(),
      });

      expect(result).toEqual(mockCampaign);
      expect(CampaignModel.create).toHaveBeenCalled();
    });
  });

  describe('getCampaign', () => {
    it('should return campaign when found', async () => {
      const mockCampaign = { _id: '123', name: 'Test' };

      const { CampaignModel } = await import('../src/models/Campaign.js');
      (CampaignModel.findById as any).mockResolvedValue(mockCampaign);

      const result = await service.getCampaign('123');
      expect(result).toEqual(mockCampaign);
    });

    it('should return null when campaign not found', async () => {
      const { CampaignModel } = await import('../src/models/Campaign.js');
      (CampaignModel.findById as any).mockResolvedValue(null);

      const result = await service.getCampaign('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('listCampaigns', () => {
    it('should return all campaigns when no filters', async () => {
      const mockCampaigns = [
        { _id: '1', name: 'Campaign 1' },
        { _id: '2', name: 'Campaign 2' },
      ];

      const { CampaignModel } = await import('../src/models/Campaign.js');
      (CampaignModel.find as any).mockReturnValue({
        sort: vi.fn().mockResolvedValue(mockCampaigns),
      });

      const result = await service.listCampaigns();
      expect(result).toEqual(mockCampaigns);
    });
  });

  describe('pauseCampaign', () => {
    it('should update status to paused', async () => {
      const mockCampaign = { _id: '123', status: 'paused' };

      const { CampaignModel } = await import('../src/models/Campaign.js');
      (CampaignModel.findByIdAndUpdate as any).mockResolvedValue(mockCampaign);

      const result = await service.pauseCampaign('123');
      expect(result?.status).toBe('paused');
    });
  });

  describe('resumeCampaign', () => {
    it('should update status to active', async () => {
      const mockCampaign = { _id: '123', status: 'active' };

      const { CampaignModel } = await import('../src/models/Campaign.js');
      (CampaignModel.findByIdAndUpdate as any).mockResolvedValue(mockCampaign);

      const result = await service.resumeCampaign('123');
      expect(result?.status).toBe('active');
    });
  });

  describe('deleteCampaign', () => {
    it('should delete inactive campaign', async () => {
      const mockCampaign = { _id: '123', status: 'ended' };

      const { CampaignModel } = await import('../src/models/Campaign.js');
      (CampaignModel.findById as any).mockResolvedValue(mockCampaign);
      (CampaignModel.findByIdAndDelete as any).mockResolvedValue(mockCampaign);

      const result = await service.deleteCampaign('123');
      expect(result).toBe(true);
    });

    it('should throw error for active campaign', async () => {
      const mockCampaign = { _id: '123', status: 'active' };

      const { CampaignModel } = await import('../src/models/Campaign.js');
      (CampaignModel.findById as any).mockResolvedValue(mockCampaign);

      await expect(service.deleteCampaign('123')).rejects.toThrow(
        'Cannot delete active campaign'
      );
    });
  });

  describe('getCampaignStats', () => {
    it('should aggregate stats from budget trackers', async () => {
      const mockTrackers = [
        { totalSpent: 100, totalImpressions: 1000, totalBids: 50, totalWins: 25 },
        { totalSpent: 50, totalImpressions: 500, totalBids: 25, totalWins: 10 },
      ];

      const { BudgetTrackerModel } = await import('../src/models/BudgetTracker.js');
      (BudgetTrackerModel.find as any).mockResolvedValue(mockTrackers);

      const result = await service.getCampaignStats('123');

      expect(result.totalSpent).toBe(150);
      expect(result.totalImpressions).toBe(1500);
      expect(result.totalBids).toBe(75);
      expect(result.totalWins).toBe(35);
    });
  });
});
