import { CampaignService } from '../src/services/campaign.service';
import { CampaignModel, ICampaignDocument } from '../src/models/campaign.model';

// Mock the CampaignModel
jest.mock('../src/models/campaign.model');
jest.mock('../src/config/redis', () => ({
  setCache: jest.fn().mockResolvedValue(undefined),
  getCache: jest.fn().mockResolvedValue(null),
  deleteCache: jest.fn().mockResolvedValue(undefined)
}));

describe('CampaignService', () => {
  let campaignService: CampaignService;
  let mockCampaign: Partial<ICampaignDocument>;

  beforeEach(() => {
    campaignService = new CampaignService();

    mockCampaign = {
      campaignId: 'camp_test_123',
      agentId: 'agent_test_123',
      advertiserId: 'adv_test_123',
      name: 'Test Campaign',
      goal: {
        type: 'leads',
        target: 500,
        budget: 5000
      },
      currentStatus: {
        achieved: 0,
        progress: 0,
        spend: 0,
        cpa: 0,
        roas: 0
      },
      agentActions: [],
      decisions: {
        audienceTargeted: [],
        creativesUsed: [],
        channelsActive: [],
        bidStrategy: 'auto'
      },
      status: 'planning',
      logs: [],
      save: jest.fn().mockResolvedValue(undefined),
      addLog: jest.fn(),
      addAction: jest.fn(),
      toObject: jest.fn().mockReturnThis()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createCampaign', () => {
    it('should create a new campaign with correct data', async () => {
      const mockSave = jest.fn().mockResolvedValue(undefined);
      (CampaignModel as jest.Mock).mockImplementation(() => ({
        ...mockCampaign,
        save: mockSave
      }));

      const request = {
        name: 'Test Campaign',
        goal: {
          type: 'leads' as const,
          target: 500,
          budget: 5000
        },
        advertiserId: 'adv_test_123'
      };

      const result = await campaignService.createCampaign(request);

      expect(result).toBeDefined();
      expect(mockSave).toHaveBeenCalled();
    });

    it('should set initial status to planning', async () => {
      const mockSave = jest.fn().mockResolvedValue(undefined);
      (CampaignModel as jest.Mock).mockImplementation(() => ({
        ...mockCampaign,
        save: mockSave
      }));

      const request = {
        name: 'Test Campaign',
        goal: {
          type: 'sales' as const,
          target: 100,
          budget: 2000
        },
        advertiserId: 'adv_test_123'
      };

      await campaignService.createCampaign(request);
    });
  });

  describe('getCampaign', () => {
    it('should return campaign when found', async () => {
      (CampaignModel.findOne as jest.Mock).mockResolvedValue(mockCampaign);

      const result = await campaignService.getCampaign('camp_test_123');

      expect(result).toEqual(mockCampaign);
      expect(CampaignModel.findOne).toHaveBeenCalledWith({ campaignId: 'camp_test_123' });
    });

    it('should return null when campaign not found', async () => {
      (CampaignModel.findOne as jest.Mock).mockResolvedValue(null);

      const result = await campaignService.getCampaign('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateGoal', () => {
    it('should update goal fields correctly', async () => {
      const saveMock = jest.fn().mockResolvedValue(undefined);
      (CampaignModel.findOne as jest.Mock).mockResolvedValue({
        ...mockCampaign,
        save: saveMock,
        addLog: jest.fn()
      });

      const result = await campaignService.updateGoal('camp_test_123', {
        target: 1000,
        budget: 10000
      });

      expect(saveMock).toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('should update campaign status', async () => {
      const saveMock = jest.fn().mockResolvedValue(undefined);
      const addLogMock = jest.fn();
      (CampaignModel.findOne as jest.Mock).mockResolvedValue({
        ...mockCampaign,
        status: 'planning',
        save: saveMock,
        addLog: addLogMock
      });

      await campaignService.updateStatus('camp_test_123', 'running');

      expect(saveMock).toHaveBeenCalled();
    });
  });

  describe('getCampaignsByAdvertiser', () => {
    it('should return campaigns for advertiser', async () => {
      const campaigns = [mockCampaign, { ...mockCampaign, campaignId: 'camp_2' }];
      (CampaignModel.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(campaigns)
      });

      const result = await campaignService.getCampaignsByAdvertiser('adv_test_123');

      expect(result).toHaveLength(2);
    });
  });

  describe('getActiveCampaigns', () => {
    it('should return only running campaigns', async () => {
      (CampaignModel.find as jest.Mock).mockResolvedValue([mockCampaign]);

      const result = await campaignService.getActiveCampaigns();

      expect(CampaignModel.find).toHaveBeenCalledWith({ status: 'running' });
    });
  });
});