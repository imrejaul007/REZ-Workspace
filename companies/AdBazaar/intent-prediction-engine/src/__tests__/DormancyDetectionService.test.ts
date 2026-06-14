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

jest.mock('../models/DormantIntent.js', () => {
  const mockDormantIntent = {
    find: jest.fn().mockReturnThis(),
    findOne: jest.fn().mockReturnThis(),
    findRevivalCandidates: jest.fn().mockResolvedValue([]),
    findByUser: jest.fn().mockResolvedValue([]),
    countDocuments: jest.fn().mockResolvedValue(0),
    aggregate: jest.fn().mockResolvedValue([]),
    bulkWrite: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    save: jest.fn().mockResolvedValue(undefined),
  };

  return {
    DormantIntent: mockDormantIntent,
 };
});

describe('DormancyDetectionService', () => {
  let DormancyDetectionService: any;
  let dormancyDetectionService: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await import('../services/DormancyDetectionService.js');
    DormancyDetectionService = module.DormancyDetectionService;
    dormancyDetectionService = new DormancyDetectionService();
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      expect(dormancyDetectionService.config).toBeDefined();
      expect(dormancyDetectionService.config.thresholdDays).toBe(7);
      expect(dormancyDetectionService.config.minRevivalScore).toBe(0.3);
    });
  });

  describe('calculateRevivalScore', () => {
    it('should calculate high score for 7-14 days dormant', async () => {
      const dormantIntent = {
        dormantIntentId: 'test-id',
        userId: 'user-123',
        category: 'DINING',
        intentKey: 'restaurant_search',
        lastSignalTimestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        daysDormant: 10,
        revivalScore: 0,
      };

      const score = await dormancyDetectionService.calculateRevivalScore(dormantIntent as any);

      expect(score).toBeGreaterThanOrEqual(0.6);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should calculate lower score for > 30 days dormant', async () => {
      const dormantIntent = {
        dormantIntentId: 'test-id',
        userId: 'user-123',
        category: 'DINING',
        intentKey: 'restaurant_search',
        lastSignalTimestamp: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
        daysDormant: 45,
        revivalScore: 0,
      };

      const score = await dormancyDetectionService.calculateRevivalScore(dormantIntent as any);

      expect(score).toBeLessThan(0.5);
    });
  });

  describe('findRevivalCandidates', () => {
    it('should call find with correct parameters', async () => {
      const mockCandidates = [
        {
          dormantIntentId: 'cand-1',
          userId: 'user-1',
          category: 'DINING',
          daysDormant: 14,
          revivalScore: 0.8,
        },
      ];

      const { DormantIntent } = require('../models/DormantIntent.js');
      DormantIntent.find.mockResolvedValue(mockCandidates);

      const candidates = await dormancyDetectionService.findRevivalCandidates({
        minScore: 0.7,
        maxDaysDormant: 30,
        limit: 50,
      });

      expect(candidates).toEqual(mockCandidates);
    });
  });

  describe('getStatistics', () => {
    it('should return statistics object', async () => {
      const mockStats = [
        { _id: 'DINING', count: 100, avgDaysDormant: 15, avgRevivalScore: 0.6 },
        { _id: 'TRAVEL', count: 50, avgDaysDormant: 20, avgRevivalScore: 0.5 },
      ];

      const { DormantIntent } = require('../models/DormantIntent.js');
      DormantIntent.aggregate.mockResolvedValue(mockStats);
      DormantIntent.countDocuments.mockResolvedValue(150);

      const stats = await dormancyDetectionService.getStatistics();

      expect(stats).toBeDefined();
      expect(stats.totalDormant).toBe(150);
      expect(stats.byCategory).toBeDefined();
      expect(stats.byCategory['DINING']).toBeDefined();
      expect(stats.byCategory['DINING'].count).toBe(100);
    });
  });
});