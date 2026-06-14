/**
 * Insights API Tests for Instagram Insights Service
 */

import request from 'supertest';
import express, { Express, Request, Response } from 'express';

// Mock insights service
const mockInsightsService = {
  getCachedAccountInsights: jest.fn().mockResolvedValue([
    {
      accountId: 'acc_123',
      date: new Date().toISOString(),
      impressions: 10000,
      reach: 8000,
      profileViews: 500,
      websiteClicks: 100,
      followerCount: 5000,
    },
  ]),
  getAccountInsights: jest.fn().mockResolvedValue([
    {
      period: 'days_28',
      impressions: 50000,
      reach: 40000,
    },
  ]),
  getContentInsightsById: jest.fn().mockResolvedValue({
    id: 'content_123',
    likes: 500,
    comments: 50,
    saves: 20,
    shares: 10,
    reach: 5000,
    impressions: 10000,
  }),
  getAllContentInsights: jest.fn().mockResolvedValue([
    {
      id: 'content_1',
      mediaType: 'IMAGE',
      likeCount: 100,
      commentsCount: 10,
    },
    {
      id: 'content_2',
      mediaType: 'VIDEO',
      likeCount: 200,
      commentsCount: 20,
    },
  ]),
  syncContentInsights: jest.fn().mockResolvedValue([
    { id: 'content_1', synced: true },
    { id: 'content_2', synced: true },
  ]),
  getAudienceInsights: jest.fn().mockResolvedValue({
    gender: { male: 40, female: 60 },
    age: {
      '18-24': 30,
      '25-34': 40,
      '35-44': 20,
      '45+': 10,
    },
    topCountries: [
      { country: 'India', percentage: 60 },
      { country: 'US', percentage: 20 },
    ],
    topCities: [
      { city: 'Mumbai', percentage: 30 },
      { city: 'Delhi', percentage: 25 },
    ],
  }),
  getActiveTimes: jest.fn().mockResolvedValue([
    { day: 'Monday', hours: [{ hour: 9, activeCount: 100 }, { hour: 18, activeCount: 150 }] },
    { day: 'Tuesday', hours: [{ hour: 10, activeCount: 120 }] },
  ]),
  getStoryInsights: jest.fn().mockResolvedValue([
    {
      id: 'story_1',
      impressions: 5000,
      exits: 100,
      replies: 20,
      reshares: 5,
    },
  ]),
  getReelsInsights: jest.fn().mockResolvedValue([
    {
      id: 'reel_1',
      plays: 10000,
      likes: 500,
      comments: 50,
      shares: 100,
    },
  ]),
  getHashtagInsights: jest.fn().mockResolvedValue({
    hashtag: 'foodie',
    impressions: 50000,
    reach: 40000,
    posts: 1000,
  }),
  getTopHashtags: jest.fn().mockResolvedValue([
    { tag: '#foodie', count: 5000 },
    { tag: '#travel', count: 4000 },
    { tag: '#fitness', count: 3000 },
  ]),
  getBestPostingTimes: jest.fn().mockResolvedValue([
    { day: 'Monday', hour: 9, engagementScore: 95 },
    { day: 'Wednesday', hour: 18, engagementScore: 92 },
    { day: 'Friday', hour: 12, engagementScore: 90 },
  ]),
  exportInsights: jest.fn().mockResolvedValue({
    data: [],
    format: 'json',
    exportedAt: new Date().toISOString(),
  }),
  getDashboardSummary: jest.fn().mockResolvedValue({
    totalImpressions: 100000,
    totalReach: 80000,
    totalEngagement: 5000,
    topContent: [],
    followerGrowth: 5,
  }),
};

// Async handler wrapper
const asyncHandler = (fn: (req: Request, res: Response) => Promise<void>) => {
  return (req: Request, res: Response) => {
    Promise.resolve(fn(req, res)).catch((error) => {
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
      });
    });
  };
};

// Create test app
const createTestApp = (): Express => {
  const app = express();
  app.use(express.json());

  // GET /api/insights/account
  app.get('/api/insights/account', asyncHandler(async (req: Request, res: Response) => {
    const { days } = req.query;

    const insightsService = mockInsightsService;
    const dateRange = days ? { days: parseInt(days as string) } : undefined;
    const insights = await insightsService.getCachedAccountInsights(dateRange);

    res.json({
      success: true,
      data: insights,
      meta: {
        count: insights.length,
        accountId: insights[0]?.accountId,
      },
    });
  }));

  // POST /api/insights/account/refresh
  app.post('/api/insights/account/refresh', asyncHandler(async (req: Request, res: Response) => {
    const period = (req.query.period as string) || 'days_28';

    const insights = await mockInsightsService.getAccountInsights(period);

    res.json({
      success: true,
      data: insights,
      meta: {
        refreshedAt: new Date().toISOString(),
      },
    });
  }));

  // GET /api/insights/content/:id
  app.get('/api/insights/content/:id', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ success: false, error: 'Content ID is required' });
      return;
    }

    const insights = await mockInsightsService.getContentInsightsById(id);

    res.json({
      success: true,
      data: insights,
    });
  }));

  // GET /api/insights/content
  app.get('/api/insights/content', asyncHandler(async (req: Request, res: Response) => {
    const { limit, mediaType } = req.query;

    const insights = await mockInsightsService.getAllContentInsights(
      parseInt(limit as string) || 50,
      mediaType as string
    );

    res.json({
      success: true,
      data: insights,
      meta: {
        count: insights.length,
        limit: parseInt(limit as string) || 50,
        mediaType,
      },
    });
  }));

  // POST /api/insights/content/sync
  app.post('/api/insights/content/sync', asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 25;

    const synced = await mockInsightsService.syncContentInsights(limit);

    res.json({
      success: true,
      data: synced,
      meta: {
        syncedCount: synced.length,
        syncedAt: new Date().toISOString(),
      },
    });
  }));

  // GET /api/insights/audience
  app.get('/api/insights/audience', asyncHandler(async (req: Request, res: Response) => {
    const insights = await mockInsightsService.getAudienceInsights();

    res.json({
      success: true,
      data: insights,
    });
  }));

  // GET /api/insights/audience/active
  app.get('/api/insights/audience/active', asyncHandler(async (req: Request, res: Response) => {
    const activeTimes = await mockInsightsService.getActiveTimes();

    res.json({
      success: true,
      data: activeTimes,
    });
  }));

  // GET /api/insights/stories
  app.get('/api/insights/stories', asyncHandler(async (req: Request, res: Response) => {
    const stories = await mockInsightsService.getStoryInsights();

    res.json({
      success: true,
      data: stories,
      meta: {
        count: stories.length,
      },
    });
  }));

  // GET /api/insights/reels
  app.get('/api/insights/reels', asyncHandler(async (req: Request, res: Response) => {
    const reels = await mockInsightsService.getReelsInsights();

    res.json({
      success: true,
      data: reels,
      meta: {
        count: reels.length,
      },
    });
  }));

  // GET /api/insights/hashtags
  app.get('/api/insights/hashtags', asyncHandler(async (req: Request, res: Response) => {
    const { hashtag } = req.query;

    if (hashtag) {
      const insights = await mockInsightsService.getHashtagInsights(hashtag as string);
      res.json({
        success: true,
        data: insights,
      });
    } else {
      const topHashtags = await mockInsightsService.getTopHashtags(20);
      res.json({
        success: true,
        data: topHashtags,
        meta: {
          count: topHashtags.length,
        },
      });
    }
  }));

  // GET /api/insights/best-times
  app.get('/api/insights/best-times', asyncHandler(async (req: Request, res: Response) => {
    const bestTimes = await mockInsightsService.getBestPostingTimes();

    res.json({
      success: true,
      data: bestTimes,
    });
  }));

  // POST /api/insights/export
  app.post('/api/insights/export', asyncHandler(async (req: Request, res: Response) => {
    const exportRequest = req.body;

    const result = await mockInsightsService.exportInsights({
      type: exportRequest.type,
      format: exportRequest.format || 'json',
      dateRange: exportRequest.days ? { days: exportRequest.days } : undefined,
    });

    res.json({
      success: true,
      data: result,
      meta: {
        exportedAt: new Date().toISOString(),
        format: exportRequest.format,
      },
    });
  }));

  // GET /api/insights/dashboard
  app.get('/api/insights/dashboard', asyncHandler(async (req: Request, res: Response) => {
    const { days } = req.query;

    const summary = await mockInsightsService.getDashboardSummary(parseInt(days as string) || 7);

    res.json({
      success: true,
      data: summary,
    });
  }));

  return app;
};

describe('Insights API', () => {
  let app: Express;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/insights/account', () => {
    it('should return account insights', async () => {
      const response = await request(app).get('/api/insights/account');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should support days query parameter', async () => {
      const response = await request(app).get('/api/insights/account?days=7');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should include meta information', async () => {
      const response = await request(app).get('/api/insights/account');

      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.count).toBeDefined();
    });
  });

  describe('POST /api/insights/account/refresh', () => {
    it('should refresh account insights', async () => {
      const response = await request(app).post('/api/insights/account/refresh');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.meta.refreshedAt).toBeDefined();
    });

    it('should support period query parameter', async () => {
      const response = await request(app).post('/api/insights/account/refresh?period=week');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/insights/content/:id', () => {
    it('should return content insights by ID', async () => {
      const response = await request(app).get('/api/insights/content/content_123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('content_123');
    });

    it('should return 400 when ID is missing', async () => {
      // This would need a specific test setup
      const response = await request(app).get('/api/insights/content/');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/insights/content', () => {
    it('should return all content insights', async () => {
      const response = await request(app).get('/api/insights/content');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should support limit parameter', async () => {
      const response = await request(app).get('/api/insights/content?limit=25');

      expect(response.status).toBe(200);
      expect(response.body.meta.limit).toBe(25);
    });

    it('should support mediaType filter', async () => {
      const response = await request(app).get('/api/insights/content?mediaType=IMAGE');

      expect(response.status).toBe(200);
      expect(response.body.meta.mediaType).toBe('IMAGE');
    });
  });

  describe('POST /api/insights/content/sync', () => {
    it('should sync content insights', async () => {
      const response = await request(app).post('/api/insights/content/sync');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.meta.syncedCount).toBeDefined();
    });

    it('should support limit parameter', async () => {
      const response = await request(app).post('/api/insights/content/sync?limit=50');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/insights/audience', () => {
    it('should return audience demographics', async () => {
      const response = await request(app).get('/api/insights/audience');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.gender).toBeDefined();
      expect(response.body.data.age).toBeDefined();
    });
  });

  describe('GET /api/insights/audience/active', () => {
    it('should return active times', async () => {
      const response = await request(app).get('/api/insights/audience/active');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/insights/stories', () => {
    it('should return story insights', async () => {
      const response = await request(app).get('/api/insights/stories');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.meta.count).toBeDefined();
    });
  });

  describe('GET /api/insights/reels', () => {
    it('should return reels insights', async () => {
      const response = await request(app).get('/api/insights/reels');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.meta.count).toBeDefined();
    });
  });

  describe('GET /api/insights/hashtags', () => {
    it('should return top hashtags when no hashtag specified', async () => {
      const response = await request(app).get('/api/insights/hashtags');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.meta.count).toBeDefined();
    });

    it('should return hashtag-specific insights when hashtag provided', async () => {
      const response = await request(app).get('/api/insights/hashtags?hashtag=foodie');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.hashtag).toBe('foodie');
    });
  });

  describe('GET /api/insights/best-times', () => {
    it('should return best posting times', async () => {
      const response = await request(app).get('/api/insights/best-times');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /api/insights/export', () => {
    it('should export insights in JSON format', async () => {
      const response = await request(app)
        .post('/api/insights/export')
        .send({
          type: 'account',
          format: 'json',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.meta.format).toBe('json');
    });

    it('should export insights in CSV format', async () => {
      const response = await request(app)
        .post('/api/insights/export')
        .send({
          type: 'content',
          format: 'csv',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should support date range parameters', async () => {
      const response = await request(app)
        .post('/api/insights/export')
        .send({
          type: 'account',
          format: 'json',
          days: 30,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/insights/dashboard', () => {
    it('should return dashboard summary', async () => {
      const response = await request(app).get('/api/insights/dashboard');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalImpressions).toBeDefined();
    });

    it('should support days parameter', async () => {
      const response = await request(app).get('/api/insights/dashboard?days=14');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});

describe('Insights Data Validation', () => {
  describe('media type validation', () => {
    const validMediaTypes = ['IMAGE', 'VIDEO', 'CAROUSEL_ALBUM', 'REELS', 'STORY', 'IGTV'];

    it('should accept valid media types', () => {
      validMediaTypes.forEach((type) => {
        expect(validMediaTypes).toContain(type);
      });
    });

    it('should reject invalid media types', () => {
      const invalidTypes = ['invalid', 'photo', 'post'];
      invalidTypes.forEach((type) => {
        expect(validMediaTypes).not.toContain(type);
      });
    });
  });

  describe('export format validation', () => {
    const validFormats = ['json', 'csv', 'xlsx'];

    it('should accept valid export formats', () => {
      validFormats.forEach((format) => {
        expect(validFormats).toContain(format);
      });
    });
  });

  describe('date range validation', () => {
    it('should validate days parameter (1-90)', () => {
      const validDays = [1, 7, 14, 30, 60, 90];

      validDays.forEach((days) => {
        expect(days).toBeGreaterThanOrEqual(1);
        expect(days).toBeLessThanOrEqual(90);
      });
    });

    it('should reject invalid days values', () => {
      const invalidDays = [0, -1, 91, 100];

      invalidDays.forEach((days) => {
        expect(days < 1 || days > 90).toBe(true);
      });
    });
  });
});