import { AudienceTwinService } from '../services/audience-twin.service';
import { AudienceTwinModel } from '../models';
import { hojaiTwinService } from '../services/hojai-twin.service';
import { CreateAudienceTwinRequest, HojaiTwinUser } from '../types';

// Mock dependencies
jest.mock('../models');
jest.mock('../services/hojai-twin.service');
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-123'),
}));

describe('AudienceTwinService', () => {
  let service: AudienceTwinService;

  const mockUsers: HojaiTwinUser[] = [
    {
      userId: 'user-1',
      profile: {
        demographics: { age: 30, gender: 'male', location: 'Mumbai' },
        interests: ['electronics', 'fashion', 'sports'],
        behaviors: { sessions: 10, purchases: 5, avgOrderValue: 500 },
      },
      preferences: {
        channels: ['whatsapp', 'email'],
        bestTimes: ['10:00-14:00'],
      },
      riskFactors: { churnRisk: 0.2, engagementScore: 0.8 },
    },
    {
      userId: 'user-2',
      profile: {
        demographics: { age: 25, gender: 'female', location: 'Delhi' },
        interests: ['fashion', 'beauty'],
        behaviors: { sessions: 15, purchases: 8, avgOrderValue: 800 },
      },
      preferences: {
        channels: ['push'],
        bestTimes: ['18:00-21:00'],
      },
      riskFactors: { churnRisk: 0.1, engagementScore: 0.9 },
    },
  ];

  const mockInsights = {
    avgLifetimeValue: 6500,
    avgIntentLikelihood: 0.75,
    topInterests: ['electronics', 'fashion', 'beauty'],
    channelPreferences: { whatsapp: 0.4, email: 0.3, push: 0.2, sms: 0.1 },
    avgChurnRisk: 0.15,
    avgEngagementScore: 0.85,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AudienceTwinService();
  });

  describe('createAudienceTwin', () => {
    const createRequest: CreateAudienceTwinRequest = {
      name: 'Test Audience',
      description: 'Test description',
      category: 'retail',
      criteria: {
        interests: ['electronics', 'fashion'],
        engagementLevel: 'high',
      },
    };

    it('should create an audience twin with correct attributes', async () => {
      // Mock HOJAI responses
      (hojaiTwinService.searchUsersByCriteria as jest.Mock).mockResolvedValue(mockUsers);
      (hojaiTwinService.getAudienceInsights as jest.Mock).mockResolvedValue(mockInsights);

      // Mock model save
      const mockSave = jest.fn().mockResolvedValue(undefined);
      const mockToAudienceTwin = jest.fn().mockReturnValue({
        twinId: 'test-uuid-123',
        name: createRequest.name,
        category: createRequest.category,
        size: 2,
        memberUserIds: ['user-1', 'user-2'],
        attributes: {
          interests: ['electronics', 'fashion'],
          intentLikelihood: 0.75,
          channelPreference: 'whatsapp',
          timingPreference: '10:00-14:00',
          lifetimeValue: 6500,
          brandAffinities: {},
        },
        behavioralModel: {
          avgSessionDuration: 3600,
          avgPurchaseFrequency: 6.5,
          avgOrderValue: 650,
          preferredCategories: [],
          churnRisk: 0.15,
        },
        qualityScore: 8,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      (AudienceTwinModel as unknown as jest.Mock).mockImplementation(() => ({
        save: mockSave,
        toAudienceTwin: mockToAudienceTwin,
      }));

      const result = await service.createAudienceTwin(createRequest, 'owner-1');

      expect(hojaiTwinService.searchUsersByCriteria).toHaveBeenCalledWith(createRequest.criteria);
      expect(result).toBeDefined();
      expect(result.name).toBe(createRequest.name);
      expect(result.category).toBe(createRequest.category);
    });

    it('should handle empty user search results', async () => {
      (hojaiTwinService.searchUsersByCriteria as jest.Mock).mockResolvedValue([]);
      (hojaiTwinService.getAudienceInsights as jest.Mock).mockResolvedValue(null);

      const mockSave = jest.fn().mockResolvedValue(undefined);
      const mockToAudienceTwin = jest.fn().mockReturnValue({
        twinId: 'test-uuid-123',
        name: createRequest.name,
        category: createRequest.category,
        size: 0,
        memberUserIds: [],
        attributes: {
          interests: [],
          intentLikelihood: 0.5,
          channelPreference: 'push',
          timingPreference: '10:00-14:00',
          lifetimeValue: 0,
          brandAffinities: {},
        },
        behavioralModel: {
          avgSessionDuration: 0,
          avgPurchaseFrequency: 0,
          avgOrderValue: 0,
          preferredCategories: [],
          churnRisk: 0.5,
        },
        qualityScore: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      (AudienceTwinModel as unknown as jest.Mock).mockImplementation(() => ({
        save: mockSave,
        toAudienceTwin: mockToAudienceTwin,
      }));

      const result = await service.createAudienceTwin(createRequest, 'owner-1');

      expect(result.size).toBe(0);
      expect(result.qualityScore).toBe(3);
    });
  });

  describe('predictBehavior', () => {
    it('should predict purchase behavior correctly', async () => {
      const mockTwin = {
        twinId: 'test-uuid',
        attributes: {
          intentLikelihood: 0.8,
          channelPreference: 'whatsapp',
          timingPreference: '10:00-14:00',
          lifetimeValue: 5000,
          interests: ['electronics'],
          brandAffinities: {},
        },
        behavioralModel: {
          churnRisk: 0.2,
          avgPurchaseFrequency: 5,
          avgSessionDuration: 300,
          avgOrderValue: 500,
          preferredCategories: ['electronics'],
        },
      };

      (AudienceTwinModel.findOne as jest.Mock).mockResolvedValue(mockTwin);

      const result = await service.predictBehavior('test-uuid', {
        action: 'purchase',
      });

      expect(result.action).toBe('purchase');
      expect(result.probability).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.recommendedChannel).toBe('whatsapp');
      expect(result.recommendedTiming).toBe('10:00-14:00');
      expect(result.factors).toBeDefined();
    });

    it('should throw error for non-existent twin', async () => {
      (AudienceTwinModel.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.predictBehavior('non-existent', { action: 'purchase' })
      ).rejects.toThrow('Audience twin not found');
    });
  });

  describe('getSegments', () => {
    it('should assign segments based on twin characteristics', async () => {
      const mockTwin = {
        twinId: 'test-uuid',
        attributes: {
          lifetimeValue: 10000,
          interests: ['electronics'],
          intentLikelihood: 0.8,
          channelPreference: 'whatsapp',
          timingPreference: '10:00-14:00',
          brandAffinities: {},
        },
        behavioralModel: {
          avgPurchaseFrequency: 10,
          churnRisk: 0.3,
          avgSessionDuration: 600,
          avgOrderValue: 1000,
          preferredCategories: ['electronics'],
        },
        size: 500,
        save: jest.fn().mockResolvedValue(undefined),
      };

      (AudienceTwinModel.findOne as jest.Mock).mockResolvedValue(mockTwin);

      const segments = await service.getSegments('test-uuid');

      expect(segments.length).toBeGreaterThan(0);
      expect(segments).toContainEqual(
        expect.objectContaining({
          segmentId: 'seg-high-value',
          segmentName: 'High Value Customers',
        })
      );
      expect(mockTwin.save).toHaveBeenCalled();
    });
  });
});