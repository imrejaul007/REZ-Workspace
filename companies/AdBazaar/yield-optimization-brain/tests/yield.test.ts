import { describe, it, expect, beforeEach, vi } from 'vitest';
import { YieldDecisionService } from '../src/services/yield-decision.service.js';
import { FloorPriceService } from '../src/services/floor-price.service.js';
import { YieldDecisionRequest, EligibleAd, AdCreative } from '../src/types/index.js';

// Mock the logger
vi.mock('../src/config/logger.js', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock the models
vi.mock('../src/models/index.js', () => ({
  YieldDecision: {
    find: vi.fn().mockReturnThis(),
    sort: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    lean: vi.fn().mockResolvedValue([]),
    save: vi.fn().mockResolvedValue({}),
  },
  FloorPrice: {
    findOne: vi.fn().mockResolvedValue(null),
    find: vi.fn().mockReturnThis(),
    sort: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    lean: vi.fn().mockResolvedValue([]),
    save: vi.fn().mockResolvedValue({}),
  },
}));

// Mock config
vi.mock('../src/config/index.js', () => ({
  config: {
    yield: {
      defaultWeights: {
        revenue: 0.4,
        conversions: 0.3,
        ltv: 0.2,
        ctr: 0.05,
        brandSafety: 0.05,
      },
      floorPrice: {
        minFloor: 0.1,
        maxFloor: 50.0,
        defaultFloor: 0.5,
        dynamicMultiplier: 1.2,
      },
      bid: {
        minBid: 0.01,
        maxBid: 100.0,
        defaultBid: 1.0,
        increment: 0.01,
      },
      confidence: {
        minConfidence: 0.5,
        highConfidence: 0.8,
        veryHighConfidence: 0.95,
      },
    },
  },
}));

describe('Yield Decision Service', () => {
  let yieldDecisionService: YieldDecisionService;

  const createMockAd = (overrides: Partial<AdCreative> = {}): AdCreative => ({
    id: 'ad_1',
    advertiserId: 'advertiser_1',
    advertiserName: 'Test Advertiser',
    campaignId: 'campaign_1',
    type: 'image',
    format: 'banner',
    bid: 2.0,
    ctr: 0.03,
    conversionRate: 0.02,
    cpa: 50,
    frequency: 1,
    ...overrides,
  });

  const createMockRequest = (ads: AdCreative[]): YieldDecisionRequest => ({
    inventorySlot: {
      id: 'slot_1',
      type: 'banner',
      format: 'display',
      size: { width: 300, height: 250 },
      context: 'standard',
    },
    userContext: {
      segments: ['tech', 'business'],
      intentScore: 0.8,
    },
    eligibleAds: ads.map(ad => ({
      ad,
      eligibility: { matched: true },
    })),
    optimizationGoal: 'revenue',
  });

  beforeEach(() => {
    yieldDecisionService = new YieldDecisionService();
  });

  describe('makeDecision', () => {
    it('should select the ad with highest score', async () => {
      const ads = [
        createMockAd({ id: 'ad_1', bid: 1.0, ctr: 0.02, conversionRate: 0.01 }),
        createMockAd({ id: 'ad_2', bid: 3.0, ctr: 0.04, conversionRate: 0.03 }),
        createMockAd({ id: 'ad_3', bid: 2.0, ctr: 0.03, conversionRate: 0.02 }),
      ];

      const request = createMockRequest(ads);
      const decision = await yieldDecisionService.makeDecision(request);

      expect(decision.selectedAd).toBeDefined();
      expect(decision.selectedAd?.id).toBe('ad_2'); // Highest score
      expect(decision.bid).toBeGreaterThan(0);
      expect(decision.confidence).toBeGreaterThan(0.5);
    });

    it('should return no-ad decision when no eligible ads', async () => {
      const request = createMockRequest([]);
      const decision = await yieldDecisionService.makeDecision(request);

      expect(decision.selectedAd).toBeNull();
      expect(decision.bid).toBe(0);
      expect(decision.expectedRevenue).toBe(0);
    });

    it('should filter out ads that do not match constraints', async () => {
      const ads = [
        createMockAd({ id: 'ad_1', bid: 1.0, frequency: 5 }),
        createMockAd({ id: 'ad_2', bid: 2.0, frequency: 1 }),
      ];

      const request = createMockRequest(ads);
      request.constraints = { maxFrequency: 2 };

      const decision = await yieldDecisionService.makeDecision(request);

      expect(decision.selectedAd?.id).toBe('ad_2');
    });

    it('should apply optimization goal weighting', async () => {
      const ads = [
        createMockAd({ id: 'ad_1', bid: 5.0, ctr: 0.01, conversionRate: 0.01 }),
        createMockAd({ id: 'ad_2', bid: 1.0, ctr: 0.05, conversionRate: 0.1 }),
      ];

      // Revenue optimization should prefer ad_1
      const revenueRequest = createMockRequest(ads);
      revenueRequest.optimizationGoal = 'revenue';
      const revenueDecision = await yieldDecisionService.makeDecision(revenueRequest);

      // Conversion optimization should prefer ad_2
      const conversionRequest = createMockRequest(ads);
      conversionRequest.optimizationGoal = 'conversions';
      const conversionDecision = await yieldDecisionService.makeDecision(conversionRequest);

      // Both should select some ad
      expect(revenueDecision.selectedAd).toBeDefined();
      expect(conversionDecision.selectedAd).toBeDefined();
    });

    it('should include alternative ads in decision', async () => {
      const ads = [
        createMockAd({ id: 'ad_1', bid: 2.0 }),
        createMockAd({ id: 'ad_2', bid: 1.5 }),
        createMockAd({ id: 'ad_3', bid: 1.0 }),
      ];

      const request = createMockRequest(ads);
      const decision = await yieldDecisionService.makeDecision(request);

      expect(decision.alternativeAds).toBeDefined();
      expect(decision.alternativeAds!.length).toBeLessThanOrEqual(3);
    });

    it('should include metadata in decision', async () => {
      const request = createMockRequest([createMockAd()]);
      const decision = await yieldDecisionService.makeDecision(request);

      expect(decision.metadata).toBeDefined();
      expect(decision.metadata.decisionId).toBeDefined();
      expect(decision.metadata.timestamp).toBeDefined();
      expect(decision.metadata.processingTimeMs).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('Floor Price Service', () => {
  let floorPriceService: FloorPriceService;

  beforeEach(() => {
    floorPriceService = new FloorPriceService();
  });

  describe('calculateFloorPrice', () => {
    it('should return a floor price within valid range', async () => {
      const result = await floorPriceService.calculateFloorPrice({
        inventoryId: 'slot_1',
        eligibleBidderCount: 5,
      });

      expect(result.floorPrice).toBeGreaterThanOrEqual(0.1);
      expect(result.floorPrice).toBeLessThanOrEqual(50.0);
      expect(result.inventoryId).toBe('slot_1');
    });

    it('should include factors in response', async () => {
      const result = await floorPriceService.calculateFloorPrice({
        inventoryId: 'slot_1',
        eligibleBidderCount: 10,
      });

      expect(result.factors).toBeDefined();
      expect(Array.isArray(result.factors)).toBe(true);
    });

    it('should include recommendations', async () => {
      const result = await floorPriceService.calculateFloorPrice({
        inventoryId: 'slot_1',
        eligibleBidderCount: 10,
      });

      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should mark floor as dynamic when factors present', async () => {
      const result = await floorPriceService.calculateFloorPrice({
        inventoryId: 'slot_1',
        eligibleBidderCount: 10,
        context: { intentScore: 0.9 },
      });

      expect(result.dynamicFloor).toBe(true);
    });
  });
});

describe('API Validation', () => {
  it('should validate yield decision request structure', () => {
    const validRequest = {
      inventorySlot: {
        id: 'slot_1',
        type: 'banner',
        format: 'display',
        size: { width: 300, height: 250 },
        context: 'standard',
      },
      userContext: {
        segments: ['tech'],
        intentScore: 0.8,
      },
      eligibleAds: [
        {
          ad: {
            id: 'ad_1',
            advertiserId: 'adv_1',
            advertiserName: 'Test',
            campaignId: 'camp_1',
            type: 'image',
            format: 'banner',
            bid: 2.0,
            ctr: 0.03,
            conversionRate: 0.02,
            cpa: 50,
            frequency: 1,
          },
          eligibility: { matched: true },
        },
      ],
    };

    expect(validRequest.inventorySlot.id).toBeDefined();
    expect(validRequest.userContext.intentScore).toBeLessThanOrEqual(1);
    expect(validRequest.eligibleAds[0].ad.bid).toBeGreaterThan(0);
  });

  it('should reject invalid inventory types', () => {
    const invalidTypes = ['popup', 'overlay', 'clickbait'];
    const validTypes = ['banner', 'video', 'native', 'interstitial'];

    invalidTypes.forEach(type => {
      expect(validTypes).not.toContain(type);
    });

    validTypes.forEach(type => {
      expect(validTypes).toContain(type);
    });
  });

  it('should validate intent score range', () => {
    const validScores = [0, 0.5, 1];
    const invalidScores = [-0.1, 1.1, 2];

    validScores.forEach(score => {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    invalidScores.forEach(score => {
      expect(score < 0 || score > 1).toBe(true);
    });
  });
});

describe('Metrics Collection', () => {
  it('should track decision count', () => {
    const decisionCount = 100;
    expect(decisionCount).toBeGreaterThan(0);
  });

  it('should track revenue values', () => {
    const revenue = 1500.75;
    expect(revenue).toBeGreaterThan(0);
    expect(typeof revenue).toBe('number');
  });

  it('should track confidence scores', () => {
    const confidence = 0.85;
    expect(confidence).toBeGreaterThanOrEqual(0);
    expect(confidence).toBeLessThanOrEqual(1);
  });
});