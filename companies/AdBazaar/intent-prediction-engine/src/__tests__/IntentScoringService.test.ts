import { IntentSignal } from '../types.js';

// Mock dependencies before importing the service
jest.mock('../config/redis.js', () => ({
  cacheGet: jest.fn().mockResolvedValue(null),
  cacheSet: jest.fn().mockResolvedValue(undefined),
  cacheDelete: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../config/logger.js', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('IntentScoringService', () => {
  let IntentScoringService: any;
  let intentScoringService: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await import('../services/IntentScoringService.js');
    IntentScoringService = module.IntentScoringService;
    intentScoringService = new IntentScoringService();
  });

  describe('scoreIntent', () => {
    it('should score intent with valid signal', async () => {
      const signal: IntentSignal = {
        userId: 'user-123',
        category: 'DINING',
        intentKey: 'restaurant_search',
        signals: {
          searchQueries: ['italian restaurant near me'],
          pageViews: 5,
          dwellTime: 120,
          clicks: 3,
          conversions: 0,
          engagementScore: 0.6,
        },
        timestamp: new Date(),
      };

      const result = await intentScoringService.scoreIntent(signal);

      expect(result).toBeDefined();
      expect(result.userId).toBe('user-123');
      expect(result.category).toBe('DINING');
      expect(result.intentKey).toBe('restaurant_search');
      expect(result.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(result.confidenceScore).toBeLessThanOrEqual(1);
      expect(result.conversionLikelihood).toBeGreaterThanOrEqual(0);
      expect(result.conversionLikelihood).toBeLessThanOrEqual(1);
      expect(result.stage).toBeDefined();
      expect(result.factors).toBeDefined();
      expect(result.factors.recency).toBeDefined();
      expect(result.factors.frequency).toBeDefined();
      expect(result.factors.engagement).toBeDefined();
      expect(result.factors.historical).toBeDefined();
    });

    it('should calculate factors correctly', async () => {
      const signal: IntentSignal = {
        userId: 'user-456',
        category: 'TRAVEL',
        intentKey: 'flight_booking',
        signals: {
          pageViews: 15,
          dwellTime: 300,
          clicks: 10,
          conversions: 2,
          engagementScore: 0.8,
        },
        timestamp: new Date(),
      };

      const result = await intentScoringService.scoreIntent(signal);

      expect(result.factors.recency).toBe(1.0); // Recent signal
      expect(result.factors.frequency).toBeGreaterThanOrEqual(0.4); // 10 clicks
      expect(result.factors.engagement).toBe(0.8); // From signal
      expect(result.factors.historical).toBeGreaterThanOrEqual(0.4); // 2 conversions
    });

    it('should determine correct intent stage', async () => {
      const highIntentSignal: IntentSignal = {
        userId: 'user-789',
        category: 'RETAIL',
        intentKey: 'purchase',
        signals: {
          pageViews: 50,
          dwellTime: 600,
          clicks: 25,
          conversions: 5,
          engagementScore: 0.95,
        },
        timestamp: new Date(),
      };

      const result = await intentScoringService.scoreIntent(highIntentSignal);

      expect(['awareness', 'consideration', 'intent', 'purchase', 'loyalty']).toContain(result.stage);
    });
  });

  describe('batchScore', () => {
    it('should batch score multiple signals', async () => {
      const signals: IntentSignal[] = [
        {
          userId: 'user-1',
          category: 'DINING',
          intentKey: 'restaurant_search',
          signals: { pageViews: 5, clicks: 3 },
          timestamp: new Date(),
        },
        {
          userId: 'user-2',
          category: 'TRAVEL',
          intentKey: 'flight_search',
          signals: { pageViews: 10, clicks: 5 },
          timestamp: new Date(),
        },
        {
          userId: 'user-3',
          category: 'RETAIL',
          intentKey: 'product_search',
          signals: { pageViews: 3, clicks: 1 },
          timestamp: new Date(),
        },
      ];

      const results = await intentScoringService.batchScore(signals);

      expect(results).toHaveLength(3);
      expect(results[0].userId).toBe('user-1');
      expect(results[1].userId).toBe('user-2');
      expect(results[2].userId).toBe('user-3');
    });
  });

  describe('clearCache', () => {
    it('should clear cache for user', async () => {
      await expect(intentScoringService.clearCache('user-123')).resolves.not.toThrow();
    });
  });
});