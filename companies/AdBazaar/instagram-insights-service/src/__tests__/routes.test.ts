/**
 * Route Tests for Instagram Insights Service
 * Tests all API endpoints using supertest
 */

import request from 'supertest';
import express, { Express } from 'express';
import { insightsRouter } from '../routes';
import { insightsService } from '../services';
import { errorHandler, notFoundHandler } from '../middleware';

// Mock services
jest.mock('../services/insightsService');
jest.mock('../services/instagramApiService');
jest.mock('../services/cacheService');

// Create test app
function createTestApp(): Express {
  const app = express();
  app.use(express.json());

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'instagram-insights-service' });
  });

  // Routes
  app.use('/api/insights', insightsRouter);

  // Error handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

describe('Insights Routes', () => {
  let app: Express;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
    });
  });

  describe('GET /api/insights/account', () => {
    it('should return account insights', async () => {
      const mockInsights = {
        instagramAccountId: 'acc-123',
        impressions: 1000,
        reach: 800,
        profileViews: 100,
      };

      (insightsService.getAccountInsights as jest.Mock).mockResolvedValue(mockInsights);

      const response = await request(app)
        .get('/api/insights/account')
        .query({ accountId: 'acc-123', startDate: '2024-01-01', endDate: '2024-01-31' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.impressions).toBe(1000);
    });

    it('should return 400 when accountId is missing', async () => {
      const response = await request(app).get('/api/insights/account');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/insights/content', () => {
    it('should return content insights', async () => {
      const mockContent = [
        { id: 'media-1', caption: 'Post 1', likeCount: 100 },
        { id: 'media-2', caption: 'Post 2', likeCount: 200 },
      ];

      (insightsService.getContentInsights as jest.Mock).mockResolvedValue(mockContent);

      const response = await request(app)
        .get('/api/insights/content')
        .query({ accountId: 'acc-123', limit: '10' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should filter by media type', async () => {
      (insightsService.getContentInsights as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/insights/content')
        .query({ accountId: 'acc-123', mediaType: 'IMAGE' });

      expect(response.status).toBe(200);
      expect(insightsService.getContentInsights).toHaveBeenCalledWith('acc-123', {
        limit: 10,
        mediaType: 'IMAGE',
        startDate: undefined,
        endDate: undefined,
      });
    });
  });

  describe('GET /api/insights/content/:id', () => {
    it('should return content details by ID', async () => {
      const mockContent = {
        id: 'media-123',
        instagramMediaId: 'ig-media-123',
        caption: 'Test post',
        mediaType: 'IMAGE',
        likeCount: 100,
        commentsCount: 10,
      };

      (insightsService.getContentById as jest.Mock).mockResolvedValue(mockContent);

      const response = await request(app).get('/api/insights/content/media-123');

      expect(response.status).toBe(200);
      expect(response.body.data.caption).toBe('Test post');
    });

    it('should return 404 for non-existent content', async () => {
      (insightsService.getContentById as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/api/insights/content/nonexistent');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/insights/audience', () => {
    it('should return audience insights', async () => {
      const mockAudience = {
        instagramAccountId: 'acc-123',
        gender: { male: 40, female: 60 },
        ageRanges: { '18-24': 30, '25-34': 40 },
        topCountries: [{ country: 'IN', percentage: 80 }],
      };

      (insightsService.getAudienceInsights as jest.Mock).mockResolvedValue(mockAudience);

      const response = await request(app)
        .get('/api/insights/audience')
        .query({ accountId: 'acc-123' });

      expect(response.status).toBe(200);
      expect(response.body.data.gender).toBeDefined();
    });

    it('should return 400 when accountId is missing', async () => {
      const response = await request(app).get('/api/insights/audience');

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/insights/audience/active', () => {
    it('should return active times data', async () => {
      const mockActiveTimes = {
        monday: [{ hour: 9, percentage: 20 }],
        tuesday: [{ hour: 10, percentage: 25 }],
      };

      (insightsService.getActiveTimes as jest.Mock).mockResolvedValue(mockActiveTimes);

      const response = await request(app)
        .get('/api/insights/audience/active')
        .query({ accountId: 'acc-123', period: 'week' });

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('GET /api/insights/stories', () => {
    it('should return story insights', async () => {
      const mockStories = [
        { id: 'story-1', views: 500, replies: 10 },
        { id: 'story-2', views: 600, replies: 15 },
      ];

      (insightsService.getStoryInsights as jest.Mock).mockResolvedValue(mockStories);

      const response = await request(app)
        .get('/api/insights/stories')
        .query({ accountId: 'acc-123', days: '7' });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('GET /api/insights/reels', () => {
    it('should return reels insights', async () => {
      const mockReels = [
        { id: 'reel-1', views: 1000, likes: 100 },
      ];

      (insightsService.getReelsInsights as jest.Mock).mockResolvedValue(mockReels);

      const response = await request(app)
        .get('/api/insights/reels')
        .query({ accountId: 'acc-123', days: '30' });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/insights/hashtags', () => {
    it('should return hashtag performance', async () => {
      const mockHashtags = [
        { hashtag: 'travel', impressions: 5000, engagement: 500 },
        { hashtag: 'photography', impressions: 3000, engagement: 300 },
      ];

      (insightsService.getHashtagPerformance as jest.Mock).mockResolvedValue(mockHashtags);

      const response = await request(app)
        .get('/api/insights/hashtags')
        .query({ accountId: 'acc-123' });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('GET /api/insights/best-times', () => {
    it('should return best posting times', async () => {
      const mockBestTimes = [
        { day: 'monday', hour: 9, avgEngagement: 500 },
        { day: 'tuesday', hour: 10, avgEngagement: 450 },
      ];

      (insightsService.getBestPostingTimes as jest.Mock).mockResolvedValue(mockBestTimes);

      const response = await request(app)
        .get('/api/insights/best-times')
        .query({ accountId: 'acc-123', days: '30' });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('POST /api/insights/export', () => {
    it('should export insights data', async () => {
      (insightsService.exportInsights as jest.Mock).mockResolvedValue({
        url: 'https://example.com/export.csv',
        format: 'csv',
      });

      const response = await request(app)
        .post('/api/insights/export')
        .send({
          accountId: 'acc-123',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          format: 'csv',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.url).toBeDefined();
    });

    it('should return 400 when accountId is missing', async () => {
      const response = await request(app)
        .post('/api/insights/export')
        .send({ format: 'csv' });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/insights/dashboard', () => {
    it('should return dashboard data', async () => {
      const mockDashboard = {
        accountInsights: { impressions: 1000 },
        audienceInsights: { totalFollowers: 5000 },
        topContent: [],
        bestTimes: [],
      };

      (insightsService.getDashboardData as jest.Mock).mockResolvedValue(mockDashboard);

      const response = await request(app)
        .get('/api/insights/dashboard')
        .query({ accountId: 'acc-123' });

      expect(response.status).toBe(200);
      expect(response.body.data.accountInsights).toBeDefined();
    });
  });

  describe('GET /api/insights/compare', () => {
    it('should return comparison data', async () => {
      const mockComparison = {
        current: { impressions: 1000 },
        previous: { impressions: 800 },
        growth: { percentage: 25 },
      };

      (insightsService.comparePeriods as jest.Mock).mockResolvedValue(mockComparison);

      const response = await request(app)
        .get('/api/insights/compare')
        .query({
          accountId: 'acc-123',
          currentStart: '2024-01-01',
          currentEnd: '2024-01-31',
          previousStart: '2023-12-01',
          previousEnd: '2023-12-31',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.growth).toBeDefined();
    });
  });
});

describe('404 Handler', () => {
  let app: Express;

  beforeEach(() => {
    app = createTestApp();
  });

  it('should return 404 for unknown routes', async () => {
    const response = await request(app).get('/api/unknown-route');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });
});