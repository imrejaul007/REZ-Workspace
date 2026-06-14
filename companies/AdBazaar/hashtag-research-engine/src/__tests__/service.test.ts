/**
 * Service Tests for Hashtag Research Engine
 * Tests business logic for hashtag research and analytics
 */

import { HashtagResearchService } from '../services/hashtagResearchService';
import { HashtagAnalyticsService } from '../services/hashtagAnalyticsService';
import { TrendingHashtagsService } from '../services/trendingHashtagsService';
import { Hashtag, HashtagAnalytics, TrendingHashtag } from '../models';

// Mock dependencies
jest.mock('../models');
jest.mock('../services/hashtagResearchService');
jest.mock('../services/hashtagAnalyticsService');
jest.mock('../services/trendingHashtagsService');
jest.mock('../utils/logger');

describe('HashtagResearchService', () => {
  let hashtagResearchService: HashtagResearchService;

  const mockHashtag = {
    _id: 'hashtag-123',
    name: 'travel',
    postsCount: 1000000,
    avgLikes: 500,
    avgComments: 50,
    avgReach: 10000,
    lastUpdated: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    hashtagResearchService = new HashtagResearchService();
  });

  describe('searchHashtags', () => {
    it('should search hashtags by name', async () => {
      (Hashtag.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockHashtag]),
      });

      const result = await hashtagResearchService.searchHashtags('travel');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('travel');
    });

    it('should return empty array for no matches', async () => {
      (Hashtag.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await hashtagResearchService.searchHashtags('nonexistent');

      expect(result).toHaveLength(0);
    });
  });

  describe('getHashtagDetails', () => {
    it('should return hashtag details', async () => {
      (Hashtag.findOne as jest.Mock).mockResolvedValue(mockHashtag);

      const result = await hashtagResearchService.getHashtagDetails('travel');

      expect(result).toEqual(mockHashtag);
    });

    it('should return null for non-existent hashtag', async () => {
      (Hashtag.findOne as jest.Mock).mockResolvedValue(null);

      const result = await hashtagResearchService.getHashtagDetails('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('analyzeHashtagPerformance', () => {
    it('should analyze hashtag performance', async () => {
      const mockAnalytics = {
        avgEngagement: 500,
        bestTimeToPost: '9:00 AM',
        topPosts: [],
      };

      (HashtagAnalytics.findOne as jest.Mock).mockResolvedValue(mockAnalytics);

      const result = await hashtagResearchService.analyzeHashtagPerformance('travel');

      expect(result).toBeDefined();
    });
  });

  describe('getRelatedHashtags', () => {
    it('should return related hashtags', async () => {
      const mockRelated = [
        { name: 'travelphotography', postsCount: 500000 },
        { name: 'travelgram', postsCount: 800000 },
      ];

      (Hashtag.find as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockRelated),
      });

      const result = await hashtagResearchService.getRelatedHashtags('travel');

      expect(result).toHaveLength(2);
    });
  });

  describe('trackHashtag', () => {
    it('should track a hashtag', async () => {
      const mockSave = jest.fn().mockResolvedValue(undefined);
      const mockHashtag = {
        name: 'newHashtag',
        postsCount: 0,
        save: mockSave,
      };

      (Hashtag as unknown as jest.Mock).mockImplementation(() => mockHashtag);

      const result = await hashtagResearchService.trackHashtag('newHashtag');

      expect(result).toBeDefined();
    });
  });
});

describe('HashtagAnalyticsService', () => {
  let hashtagAnalyticsService: HashtagAnalyticsService;

  beforeEach(() => {
    jest.clearAllMocks();
    hashtagAnalyticsService = new HashtagAnalyticsService();
  });

  describe('getEngagementMetrics', () => {
    it('should return engagement metrics for hashtags', async () => {
      const mockMetrics = {
        avgLikes: 500,
        avgComments: 50,
        avgSaves: 20,
        avgShares: 10,
 totalPosts: 10000,
      };

      (HashtagAnalytics.aggregate as jest.Mock).mockResolvedValue([mockMetrics]);

      const result = await hashtagAnalyticsService.getEngagementMetrics(['travel', 'photography']);

      expect(result).toBeDefined();
    });
  });

  describe('getBestTimeToPost', () => {
    it('should return best time to post for hashtag', async () => {
      const mockBestTime = {
        day: 'monday',
        hour: 9,
        avgEngagement: 800,
      };

      (HashtagAnalytics.findOne as jest.Mock).mockResolvedValue({
        bestTimes: [mockBestTime],
      });

      const result = await hashtagAnalyticsService.getBestTimeToPost('travel');

      expect(result).toBeDefined();
    });
  });

  describe('compareHashtags', () => {
    it('should compare multiple hashtags', async () => {
      const mockComparison = [
        { name: 'travel', engagement: 500 },
        { name: 'photography', engagement: 700 },
      ];

      (Hashtag.find as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockComparison),
      });

      const result = await hashtagAnalyticsService.compareHashtags(['travel', 'photography']);

      expect(result).toHaveLength(2);
    });
  });

  describe('getHashtagSuggestions', () => {
    it('should suggest related hashtags', async () => {
      const mockSuggestions = [
        { name: 'travelphotography', score: 0.9 },
        { name: 'travelgram', score: 0.85 },
      ];

      (Hashtag.find as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSuggestions),
      });

      const result = await hashtagAnalyticsService.getHashtagSuggestions('travel', 5);

      expect(result).toHaveLength(2);
    });
  });
});

describe('TrendingHashtagsService', () => {
  let trendingHashtagsService: TrendingHashtagsService;

  beforeEach(() => {
    jest.clearAllMocks();
    trendingHashtagsService = new TrendingHashtagsService();
  });

  describe('getTrendingHashtags', () => {
    it('should return trending hashtags', async () => {
      const mockTrending = [
        { name: 'trending1', growthRate: 50, postsCount: 100000 },
        { name: 'trending2', growthRate: 40, postsCount: 80000 },
      ];

      (TrendingHashtag.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockTrending),
      });

      const result = await trendingHashtagsService.getTrendingHashtags(10);

      expect(result).toHaveLength(2);
    });

    it('should filter by category', async () => {
      (TrendingHashtag.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });

      await trendingHashtagsService.getTrendingHashtags(10, 'travel');

      expect(TrendingHashtag.find).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'travel' })
      );
    });
  });

  describe('updateTrendingHashtags', () => {
    it('should update trending hashtags', async () => {
      const mockSave = jest.fn().mockResolvedValue(undefined);
      const mockTrending = {
        name: 'newTrending',
        growthRate: 100,
        save: mockSave,
      };

      (TrendingHashtag as unknown as jest.Mock).mockImplementation(() => mockTrending);

      const result = await trendingHashtagsService.updateTrendingHashtags();

      expect(result).toBeDefined();
    });
  });

  describe('getHashtagGrowthRate', () => {
    it('should return growth rate for hashtag', async () => {
      const mockHashtag = {
        name: 'travel',
        postsCount: 1000000,
        previousPostsCount: 900000,
      };

      (Hashtag.findOne as jest.Mock).mockResolvedValue(mockHashtag);

      const result = await trendingHashtagsService.getHashtagGrowthRate('travel');

      expect(result).toBeGreaterThan(0);
    });
  });
});
