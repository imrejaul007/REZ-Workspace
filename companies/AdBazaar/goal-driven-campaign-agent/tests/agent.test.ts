import { AgentService } from '../src/services/agent.service';
import { campaignService } from '../src/services/campaign.service';

// Mock dependencies
jest.mock('../src/services/campaign.service');
jest.mock('../src/config/redis', () => ({
  setCache: jest.fn().mockResolvedValue(undefined),
  getCache: jest.fn().mockResolvedValue(null),
  deleteCache: jest.fn().mockResolvedValue(undefined)
}));
jest.mock('axios');

describe('AgentService', () => {
  let agentService: AgentService;

  const mockCampaign = {
    campaignId: 'camp_test_123',
    agentId: 'agent_test_123',
    advertiserId: 'adv_test_123',
    name: 'Test Campaign',
    goal: {
      type: 'leads' as const,
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
    status: 'planning' as const,
    logs: []
  };

  beforeEach(() => {
    agentService = new AgentService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any running agents
    agentService.stopAllAgents();
  });

  describe('startAgent', () => {
    it('should start agent for a campaign', async () => {
      (campaignService.getCampaign as jest.Mock).mockResolvedValue(mockCampaign);
      (campaignService.updateStatus as jest.Mock).mockResolvedValue(mockCampaign);
      (campaignService.updateDecisions as jest.Mock).mockResolvedValue(mockCampaign);
      (campaignService.addAgentAction as jest.Mock).mockResolvedValue(mockCampaign);

      await agentService.startAgent('camp_test_123');

      expect(campaignService.updateStatus).toHaveBeenCalledWith('camp_test_123', 'running');
      expect(agentService.isAgentRunning('camp_test_123')).toBe(true);
    });

    it('should throw error if campaign not found', async () => {
      (campaignService.getCampaign as jest.Mock).mockResolvedValue(null);

      await expect(agentService.startAgent('nonexistent')).rejects.toThrow('Campaign not found');
    });

    it('should not start if agent already running', async () => {
      (campaignService.getCampaign as jest.Mock).mockResolvedValue(mockCampaign);
      (campaignService.updateStatus as jest.Mock).mockResolvedValue(mockCampaign);
      (campaignService.updateDecisions as jest.Mock).mockResolvedValue(mockCampaign);
      (campaignService.addAgentAction as jest.Mock).mockResolvedValue(mockCampaign);

      await agentService.startAgent('camp_test_123');
      await agentService.startAgent('camp_test_123');

      // Should only be called once
      expect(campaignService.updateStatus).toHaveBeenCalledTimes(1);
    });
  });

  describe('stopAgent', () => {
    it('should stop a running agent', async () => {
      (campaignService.getCampaign as jest.Mock).mockResolvedValue(mockCampaign);
      (campaignService.updateStatus as jest.Mock).mockResolvedValue(mockCampaign);
      (campaignService.updateDecisions as jest.Mock).mockResolvedValue(mockCampaign);
      (campaignService.addAgentAction as jest.Mock).mockResolvedValue(mockCampaign);

      await agentService.startAgent('camp_test_123');
      expect(agentService.isAgentRunning('camp_test_123')).toBe(true);

      await agentService.stopAgent('camp_test_123');
      expect(agentService.isAgentRunning('camp_test_123')).toBe(false);
    });
  });

  describe('pauseAgent', () => {
    it('should pause the agent', async () => {
      (campaignService.getCampaign as jest.Mock).mockResolvedValue(mockCampaign);
      (campaignService.updateStatus as jest.Mock).mockResolvedValue(mockCampaign);
      (campaignService.updateDecisions as jest.Mock).mockResolvedValue(mockCampaign);
      (campaignService.addAgentAction as jest.Mock).mockResolvedValue(mockCampaign);

      await agentService.startAgent('camp_test_123');
      await agentService.pauseAgent('camp_test_123');

      expect(campaignService.updateStatus).toHaveBeenLastCalledWith('camp_test_123', 'paused');
    });
  });

  describe('isAgentRunning', () => {
    it('should return true for running agent', async () => {
      (campaignService.getCampaign as jest.Mock).mockResolvedValue(mockCampaign);
      (campaignService.updateStatus as jest.Mock).mockResolvedValue(mockCampaign);
      (campaignService.updateDecisions as jest.Mock).mockResolvedValue(mockCampaign);
      (campaignService.addAgentAction as jest.Mock).mockResolvedValue(mockCampaign);

      await agentService.startAgent('camp_test_123');

      expect(agentService.isAgentRunning('camp_test_123')).toBe(true);
    });

    it('should return false for stopped agent', async () => {
      expect(agentService.isAgentRunning('camp_test_123')).toBe(false);
    });
  });

  describe('getRunningAgents', () => {
    it('should return list of running agent campaign IDs', async () => {
      (campaignService.getCampaign as jest.Mock).mockResolvedValue(mockCampaign);
      (campaignService.updateStatus as jest.Mock).mockResolvedValue(mockCampaign);
      (campaignService.updateDecisions as jest.Mock).mockResolvedValue(mockCampaign);
      (campaignService.addAgentAction as jest.Mock).mockResolvedValue(mockCampaign);

      await agentService.startAgent('camp_test_123');

      const runningAgents = agentService.getRunningAgents();
      expect(runningAgents).toContain('camp_test_123');
    });
  });

  describe('stopAllAgents', () => {
    it('should stop all running agents', async () => {
      (campaignService.getCampaign as jest.Mock).mockResolvedValue(mockCampaign);
      (campaignService.updateStatus as jest.Mock).mockResolvedValue(mockCampaign);
      (campaignService.updateDecisions as jest.Mock).mockResolvedValue(mockCampaign);
      (campaignService.addAgentAction as jest.Mock).mockResolvedValue(mockCampaign);

      await agentService.startAgent('camp_test_123');
      await agentService.stopAllAgents();

      expect(agentService.getRunningAgents()).toHaveLength(0);
    });
  });
});