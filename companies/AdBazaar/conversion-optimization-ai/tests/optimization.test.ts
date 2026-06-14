/**
 * Conversion Optimization AI Service Tests
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import { OptimizationService } from '../src/services/optimization.service';
import { Optimization } from '../src/models';
import { OptimizationGoals } from '../src/types';

// Mock dependencies
jest.mock('../src/models');
jest.mock('../src/services/redis.service', () => ({
  redisService: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
    isReady: jest.fn().mockReturnValue(true),
  },
}));

describe('OptimizationService', () => {
  let service: OptimizationService;

  beforeAll(() => {
    service = new OptimizationService();
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createOptimization', () => {
    it('should create a new optimization with valid parameters', async () => {
      const mockOptimization = {
        optimizationId: 'opt-12345678',
        campaignId: 'campaign-1',
        advertiserId: 'advertiser-1',
        status: 'active',
        goals: { targetCPA: 50 },
        currentPerformance: {
          cpa: 0,
          roas: 0,
          conversions: 0,
          spend: 0,
          revenue: 0,
        },
        aiActions: {
          bidAdjustments: [],
          audienceChanges: [],
          budgetReallocation: [],
        },
        recommendations: [],
        startedAt: new Date(),
        save: jest.fn().mockResolvedValue(undefined),
        toObject: jest.fn().mockReturnValue({
          optimizationId: 'opt-12345678',
          campaignId: 'campaign-1',
          advertiserId: 'advertiser-1',
          status: 'active',
        }),
      };

      (Optimization as unknown as jest.Mock).mockImplementation(() => mockOptimization);

      const goals: OptimizationGoals = { targetCPA: 50 };
      const result = await service.createOptimization('campaign-1', 'advertiser-1', goals);

      expect(result).toBeDefined();
      expect(result.campaignId).toBe('campaign-1');
      expect(result.advertiserId).toBe('advertiser-1');
      expect(result.status).toBe('active');
      expect(mockOptimization.save).toHaveBeenCalled();
    });
  });

  describe('getOptimization', () => {
    it('should return optimization by ID', async () => {
      const mockOptimization = {
        optimizationId: 'opt-12345678',
        campaignId: 'campaign-1',
        advertiserId: 'advertiser-1',
        status: 'active',
        toObject: jest.fn().mockReturnValue({
          optimizationId: 'opt-12345678',
          campaignId: 'campaign-1',
        }),
      };

      (Optimization.findOne as jest.Mock).mockResolvedValue(mockOptimization);

      const result = await service.getOptimization('opt-12345678');

      expect(result).toBeDefined();
      expect(result?.optimizationId).toBe('opt-12345678');
      expect(Optimization.findOne).toHaveBeenCalledWith({ optimizationId: 'opt-12345678' });
    });

    it('should return null for non-existent optimization', async () => {
      (Optimization.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.getOptimization('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('pauseOptimization', () => {
    it('should pause an active optimization', async () => {
      const mockOptimization = {
        optimizationId: 'opt-12345678',
        status: 'paused',
        updatedAt: new Date(),
      };

      (Optimization.findOneAndUpdate as jest.Mock).mockResolvedValue(mockOptimization);

      const result = await service.pauseOptimization('opt-12345678');

      expect(result).toBeDefined();
      expect(result?.status).toBe('paused');
    });
  });

  describe('resumeOptimization', () => {
    it('should resume a paused optimization', async () => {
      const mockOptimization = {
        optimizationId: 'opt-12345678',
        status: 'active',
        updatedAt: new Date(),
      };

      (Optimization.findOneAndUpdate as jest.Mock).mockResolvedValue(mockOptimization);

      const result = await service.resumeOptimization('opt-12345678');

      expect(result).toBeDefined();
      expect(result?.status).toBe('active');
    });
  });

  describe('generateBidRecommendation', () => {
    it('should generate bid recommendation with valid parameters', async () => {
      const mockOptimization = {
        optimizationId: 'opt-12345678',
        campaignId: 'campaign-1',
      };

      (Optimization.findOne as jest.Mock)
        .mockResolvedValueOnce(mockOptimization)
        .mockResolvedValueOnce(mockOptimization);

      const result = await service.generateBidRecommendation(
        'campaign-1',
        'placement-1',
        1.50,
        30
      );

      expect(result).toBeDefined();
      expect(result.placementId).toBe('placement-1');
      expect(result.recommendedBid).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThanOrEqual(0.5);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('getInsights', () => {
    it('should return optimization insights', async () => {
      const mockOptimization = {
        optimizationId: 'opt-12345678',
        campaignId: 'campaign-1',
        advertiserId: 'advertiser-1',
        goals: { targetCPA: 50 },
        recommendations: [],
      };

      (Optimization.findOne as jest.Mock).mockResolvedValue(mockOptimization);

      const result = await service.getInsights('opt-12345678');

      expect(result).toBeDefined();
      expect(result.insights).toBeDefined();
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });
  });

  describe('analyzeAudience', () => {
    it('should return audience segments', async () => {
      const result = await service.analyzeAudience('campaign-1');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      const segment = result[0];
      expect(segment).toHaveProperty('segmentId');
      expect(segment).toHaveProperty('name');
      expect(segment).toHaveProperty('conversionRate');
      expect(segment).toHaveProperty('performance');
    });
  });

  describe('getTimeSlotAnalysis', () => {
    it('should return time slot performance data', async () => {
      const result = await service.getTimeSlotAnalysis('campaign-1');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(24); // 24 hours

      const slot = result[9]; // 9 AM
      expect(slot).toHaveProperty('hour');
      expect(slot).toHaveProperty('avgCTR');
      expect(slot).toHaveProperty('avgCPC');
      expect(slot.hour).toBe(9);
    });
  });

  describe('generateABTestRecommendations', () => {
    it('should return A/B test recommendations', async () => {
      const result = await service.generateABTestRecommendations('campaign-1');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);

      if (result.length > 0) {
        const test = result[0];
        expect(test).toHaveProperty('testId');
        expect(test).toHaveProperty('hypothesis');
        expect(test).toHaveProperty('expectedLift');
        expect(test).toHaveProperty('status');
      }
    });
  });

  describe('getCompetitorInsights', () => {
    it('should return competitor insights', async () => {
      const result = await service.getCompetitorInsights('campaign-1');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);

      if (result.length > 0) {
        const competitor = result[0];
        expect(competitor).toHaveProperty('competitorId');
        expect(competitor).toHaveProperty('avgBid');
        expect(competitor).toHaveProperty('winRate');
      }
    });
  });
});

describe('Validation Schemas', () => {
  it('should validate create optimization schema', () => {
    const { schemas } = require('../src/middleware/validation.middleware');

    // Valid input
    const validInput = {
      campaignId: 'campaign-1',
      goals: { targetCPA: 50 },
    };
    const validResult = schemas.createOptimization.safeParse(validInput);
    expect(validResult.success).toBe(true);

    // Invalid input - no goals
    const invalidInput = {
      campaignId: 'campaign-1',
      goals: {},
    };
    const invalidResult = schemas.createOptimization.safeParse(invalidInput);
    expect(invalidResult.success).toBe(false);
  });

  it('should validate bid optimization schema', () => {
    const { schemas } = require('../src/middleware/validation.middleware');

    // Valid input
    const validInput = {
      campaignId: 'campaign-1',
      placementId: 'placement-1',
      currentBid: 1.50,
    };
    const validResult = schemas.bidOptimization.safeParse(validInput);
    expect(validResult.success).toBe(true);

    // Invalid input - negative bid
    const invalidInput = {
      campaignId: 'campaign-1',
      placementId: 'placement-1',
      currentBid: -1,
    };
    const invalidResult = schemas.bidOptimization.safeParse(invalidInput);
    expect(invalidResult.success).toBe(false);
  });
});

describe('Types', () => {
  it('should have correct CampaignOptimization interface', () => {
    const { CampaignOptimization, BidRecommendation } = require('../src/types');

    const optimization: CampaignOptimization = {
      optimizationId: 'opt-12345678',
      campaignId: 'campaign-1',
      status: 'active',
      goals: { targetCPA: 50 },
      currentPerformance: {
        cpa: 30,
        roas: 4.0,
        conversions: 100,
        spend: 3000,
        revenue: 12000,
      },
      aiActions: {
        bidAdjustments: [],
        audienceChanges: [],
        budgetReallocation: [],
      },
      recommendations: [],
      startedAt: new Date(),
      updatedAt: new Date(),
    };

    expect(optimization.optimizationId).toBeDefined();
    expect(optimization.status).toBe('active');
    expect(optimization.goals.targetCPA).toBe(50);
  });

  it('should have correct BidRecommendation interface', () => {
    const { BidRecommendation } = require('../src/types');

    const recommendation: BidRecommendation = {
      placementId: 'placement-1',
      recommendedBid: 1.75,
      maxBid: 2.28,
      expectedCPC: 1.49,
      expectedCTR: 0.029,
      expectedConversions: 10,
      confidence: 0.85,
      reasoning: 'Strong historical CTR and high audience overlap',
    };

    expect(recommendation.placementId).toBe('placement-1');
    expect(recommendation.confidence).toBeGreaterThanOrEqual(0);
    expect(recommendation.confidence).toBeLessThanOrEqual(1);
  });
});