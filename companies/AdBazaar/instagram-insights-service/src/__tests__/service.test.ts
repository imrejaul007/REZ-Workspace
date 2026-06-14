/**
 * Service Tests for Instagram Insights Service
 * Tests business logic for insights and analytics services
 */

import { InstagramApiService } from '../services/instagramApiService';
import { InsightsService } from '../services/insightsService';
import { CacheService } from '../services/cacheService';
import { InstagramMedia, InstagramAccountInsights, InstagramAudienceInsights } from '../models';

// Mock dependencies
jest.mock('../models');
jest.mock('../services/instagramApiService');
jest.mock('../services/cacheService');
jest.mock('../config/logger');

describe('InsightsService', () => {
  let insightsService: InsightsService;

  const mockInstagramMedia = {
    _id: 'media-123',
    instagramMediaId: 'ig-media-123',
    instagramAccountId: 'acc-123',
    caption: 'Test post',
    mediaType: 'IMAGE',
    likeCount: 100,
    commentsCount: 10,
    saveCount: 5,
    reach: 500,
    impressions: 700,
    timestamp: new Date(),
  };

  const mockAccountInsights = {
    _id: 'insights-123',
    instagramAccountId: 'acc-123',
    date: new Date(),
    impressions: 1000,
    reach: 800,
    profileViews: 100,
    websiteClicks: 50,
    followerCount: 1000,
    followerDelta: 10,
  };

  const mockAudienceInsights = {
    _id: 'audience-123',
    instagramAccountId: 'acc-123',
    date: new Date(),
    gender: { male: 40, female: 60 },
    ageRanges: { '18-24': 30, '25-34': 40, '35-44': 20, '45+': 10 },
    topCountries: [{ country: 'IN', percentage: 80 }, { country: 'US', percentage: 10 }],
    topCities: [{ city: 'Mumbai', percentage: 30 }, { city: 'Delhi', percentage: 25 }],
    activeTimes: { monday: [], tuesday: [], wednesday: [] },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    insightsService = new InsightsService();
  });

  describe('getAccountInsights', () => {
    it('should return account insights', async () => {
      (InstagramAccountInsights.findOne as jest.Mock).mockResolvedValue(mockAccountInsights);

      const result = await insightsService.getAccountInsights('acc-123', new Date(), new Date());

      expect(result).toBeDefined();
    });

    it('should return null for non-existent insights', async () => {
      (InstagramAccountInsights.findOne as jest.Mock).mockResolvedValue(null);

      const result = await insightsService.getAccountInsights('nonexistent', new Date(), new Date());

      expect(result).toBeNull();
    });
  });

  describe('getContentInsights', () => {
    it('should return content insights for account', async () => {
      (InstagramMedia.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockInstagramMedia]),
      });

      const result = await insightsService.getContentInsights('acc-123', { limit: 10 });

      expect(result).toHaveLength(1);
      expect(result[0].caption).toBe('Test post');
    });

    it('should filter by media type', async () => {
      (InstagramMedia.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });

      await insightsService.getContentInsights('acc-123', { mediaType: 'IMAGE' });

      expect(InstagramMedia.find).toHaveBeenCalledWith(
        expect.objectContaining({ mediaType: 'IMAGE' })
      );
    });
  });

  describe('getAudienceInsights', () => {
    it('should return audience insights', async () => {
      (InstagramAudienceInsights.findOne as jest.Mock).mockResolvedValue(mockAudienceInsights);

      const result = await insightsService.getAudienceInsights('acc-123');

      expect(result).toBeDefined();
    });
  });

  describe('getActiveTimes', () => {
    it('should return active times data', async () => {
      const mockActiveTimes = {
        _id: 'active-123',
        instagramAccountId: 'acc-123',
        monday: [{ hour: 9, percentage: 20 }],
        tuesday: [{ hour: 10, percentage: 25 }],
      };

      (InstagramAudienceInsights.findOne as jest.Mock).mockResolvedValue(mockActiveTimes);

      const result = await insightsService.getActiveTimes('acc-123', 'week');

      expect(result).toBeDefined();
    });
  });

  describe('getStoryInsights', () => {
    it('should return story insights', async () => {
      const mockStories = [
        { id: 'story-1', views: 500, replies: 10, exits: 5 },
        { id: 'story-2', views: 600, replies: 15, exits: 8 },
      ];

      (InstagramApiService.getStoryInsights as jest.Mock).mockResolvedValue(mockStories);

      const result = await insightsService.getStoryInsights('acc-123', 7);

      expect(result).toHaveLength(2);
    });
  });

  describe('getReelsInsights', () => {
    it('should return reels insights', async () => {
      const mockReels = [
        { id: 'reel-1', views: 1000, likes: 100, comments: 20 },
      ];

      (InstagramApiService.getReelsInsights as jest.Mock).mockResolvedValue(mockReels);

      const result = await insightsService.getReelsInsights('acc-123', 30);

      expect(result).toHaveLength(1);
    });
  });

  describe('trackHashtagPerformance', () => {
    it('should track hashtag performance', async () => {
      const mockHashtagData = {
        hashtag: 'travel',
        impressions: 5000,
        reach: 3000,
        engagement: 500,
      };

      const mockSave = jest.fn().mockResolvedValue(undefined);
      (InstagramMedia as unknown as jest.Mock).mockImplementation(() => ({
        save: mockSave,
      }));

      const result = await insightsService.trackHashtagPerformance('acc-123', 'travel');

      expect(result).toBeDefined();
    });
  });

  describe('getBestPostingTimes', () => {
    it('should return best posting times', async () => {
      const mockBestTimes = {
        _id: 'best-times-123',
        instagramAccountId: 'acc-123',
        bestTimes: [
          { day: 'monday', hour: 9, avgEngagement: 500 },
          { day: 'tuesday', hour: 10, avgEngagement: 450 },
        ],
      };

      (InstagramMedia.find as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await insightsService.getBestPostingTimes('acc-123', 30);

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getDashboardData', () => {
    it('should return complete dashboard data', async () => {
      (InstagramAccountInsights.findOne as jest.Mock).mockResolvedValue(mockAccountInsights);
      (InstagramAudienceInsights.findOne as jest.Mock).mockResolvedValue(mockAudienceInsights);
      (InstagramMedia.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockInstagramMedia]),
      });

      const result = await insightsService.getDashboardData('acc-123');

      expect(result).toBeDefined();
    });
  });
});

describe('InstagramApiService', () => {
  let instagramApiService: InstagramApiService;

  beforeEach(() => {
    jest.clearAllMocks();
    instagramApiService = InstagramApiService.getInstance();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = InstagramApiService.getInstance();
      const instance2 = InstagramApiService.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('getAccountInsights', () => {
    it('should fetch account insights from API', async () => {
      const mockResponse = {
        data: {
          reach: { total: 800 },
          impressions: { total: 1000 },
          profile_views: { total: 100 },
        },
      };

      (InstagramApiService as jest.Mock).mockImplementation(() => ({
        get: jest.fn().mockResolvedValue(mockResponse),
      }));

      const service = InstagramApiService.getInstance();
      // Mock the internal API call
      const result = await service.getAccountInsights('acc-123');

      expect(result).toBeDefined();
    });
  });

  describe('getMediaInsights', () => {
    it('should fetch media insights', async () => {
      const mockResponse = {
        data: {
          reach: 500,
          impressions: 700,
          likes: 100,
          comments: 10,
        },
      };

      const service = InstagramApiService.getInstance();
      const result = await service.getMediaInsights('media-123');

      expect(result).toBeDefined();
    });
  });

  describe('getAudienceDemographics', () => {
    it('should fetch audience demographics', async () => {
      const mockResponse = {
        data: {
          genders: [{ key: 'male', value: 40 }, { key: 'female', value: 60 }],
          age_ranges: [
            { key: '18-24', value: 30 },
            { key: '25-34', value: 40 },
          ],
        },
      };

      const service = InstagramApiService.getInstance();
      const result = await service.getAudienceDemographics('acc-123');

      expect(result).toBeDefined();
    });
  });

  describe('getStoryInsights', () => {
    it('should fetch story insights', async () => {
      const mockResponse = {
        data: [
          { id: 'story-1', views: 500 },
        ],
      };

      const service = InstagramApiService.getInstance();
      const result = await service.getStoryInsights('acc-123');

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getReelsInsights', () => {
    it('should fetch reels insights', async () => {
      const mockResponse = {
        data: [
          { id: 'reel-1', plays: 1000 },
        ],
      };

      const service = InstagramApiService.getInstance();
      const result = await service.getReelsInsights('acc-123');

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('healthCheck', () => {
    it('should return health status', async () => {
      const service = InstagramApiService.getInstance();
      const result = await service.healthCheck();

      expect(typeof result).toBe('boolean');
    });
  });
});

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    jest.clearAllMocks();
    cacheService = new CacheService();
  });

  describe('get', () => {
    it('should return cached data', async () => {
      const mockData = { insights: 'test-data' };

      // Mock internal cache storage
      (cacheService as any).cache = new Map([['key-123', { data: mockData, expiry: Date.now() + 10000 }]]);

      const result = await cacheService.get('key-123');

      expect(result).toEqual(mockData);
    });

    it('should return null for expired cache', async () => {
      (cacheService as any).cache = new Map([['key-expired', { data: {}, expiry: Date.now() - 1000 }]]);

      const result = await cacheService.get('key-expired');

      expect(result).toBeNull();
    });

    it('should return null for non-existent key', async () => {
      const result = await cacheService.get('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should cache data with TTL', async () => {
      const mockData = { insights: 'test' };

      await cacheService.set('key-123', mockData, 600);

      const cached = (cacheService as any).cache.get('key-123');
      expect(cached).toBeDefined();
      expect(cached.data).toEqual(mockData);
    });
  });

  describe('delete', () => {
    it('should delete cached data', async () => {
      (cacheService as any).cache = new Map([['key-123', { data: {}, expiry: Date.now() + 10000 }]]);

      await cacheService.delete('key-123');

      expect((cacheService as any).cache.has('key-123')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all cached data', async () => {
      (cacheService as any).cache = new Map([
        ['key-1', { data: {}, expiry: Date.now() + 10000 }],
        ['key-2', { data: {}, expiry: Date.now() + 10000 }],
      ]);

      await cacheService.clear();

      expect((cacheService as any).cache.size).toBe(0);
    });
  });
});
