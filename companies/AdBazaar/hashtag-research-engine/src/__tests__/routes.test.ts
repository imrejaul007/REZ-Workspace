/**
 * Route Tests for Hashtag Research Engine
 * Tests all API endpoints using supertest
 */

import request from 'supertest';
import express, { Express } from 'express';
import routes from '../routes';
import { HashtagResearchService, HashtagAnalyticsService, TrendingHashtagsService } from '../services';
import { authMiddleware, errorHandler, notFoundHandler } from '../middleware';

// Mock services
jest.mock('../services/hashtagResearchService');
jest.mock('../services/hashtagAnalyticsService');
jest.mock('../services/trendingHashtagsService');
jest.mock('../utils/logger');

// Create test app
function createTestApp(): Express {
  const app = express();
  app.use(express.json());

  // Health check (public)
  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'hashtag-research-engine' });
  });

  // Auth middleware for API routes
  app.use('/api', authMiddleware);

  // Routes
  app.use('/api', routes);

  // Error handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

describe('Hashtag Research Routes', () => {
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

  describe('GET /api/hashtags/search', () => {
    it('should search hashtags', async () => {
      (HashtagResearchService.searchHashtags as jest.Mock).mockResolvedValue([
        { name: 'travel', postsCount: 1000000 },
      ]);

      const response = await request(app)
        .get('/api/hashtags/search')
        .set('Authorization', 'Bearer test-token-12345')
        .query({ q: 'travel' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 400 for missing query', async () => {
      const response = await request(app)
        .get('/api/hashtags/search')
        .set('Authorization', 'Bearer test-token-12345');

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/hashtags/:name', () => {
    it('should return hashtag details', async () => {
      (HashtagResearchService.getHashtagDetails as jest.Mock).mockResolvedValue({
        name: 'travel',
        postsCount: 1000000,
        avgLikes: 500,
      });

      const response = await request(app)
        .get('/api/hashtags/travel')
        .set('Authorization', 'Bearer test-token-12345');

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('travel');
    });

    it('should return 404 for non-existent hashtag', async () => {
      (HashtagResearchService.getHashtagDetails as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/hashtags/nonexistent')
        .set('Authorization', 'Bearer test-token-12345');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/hashtags/:name/analytics', () => {
    it('should return hashtag analytics', async () => {
      (HashtagAnalyticsService.getEngagementMetrics as jest.Mock).mockResolvedValue({
        avgEngagement: 500,
        totalPosts: 10000,
      });

      const response = await request(app)
        .get('/api/hashtags/travel/analytics')
        .set('Authorization', 'Bearer test-token-12345');

      expect(response.status).toBe(200);
      expect(response.body.data.avgEngagement).toBe(500);
    });
  });

  describe('GET /api/hashtags/:name/related', () => {
    it('should return related hashtags', async () => {
      (HashtagResearchService.getRelatedHashtags as jest.Mock).mockResolvedValue([
        { name: 'travelphotography', postsCount: 500000 },
      ]);

      const response = await request(app)
        .get('/api/hashtags/travel/related')
        .set('Authorization', 'Bearer test-token-12345');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/hashtags/:name/best-time', () => {
    it('should return best time to post', async () => {
      (HashtagAnalyticsService.getBestTimeToPost as jest.Mock).mockResolvedValue({
        day: 'monday',
        hour: 9,
        avgEngagement: 800,
      });

      const response = await request(app)
        .get('/api/hashtags/travel/best-time')
        .set('Authorization', 'Bearer test-token-12345');

      expect(response.status).toBe(200);
      expect(response.body.data.day).toBe('monday');
    });
  });

  describe('POST /api/hashtags/:name/track', () => {
    it('should track a hashtag', async () => {
      (HashtagResearchService.trackHashtag as jest.Mock).mockResolvedValue({
        name: 'newhashtag',
        tracking: true,
      });

      const response = await request(app)
        .post('/api/hashtags/newhashtag/track')
        .set('Authorization', 'Bearer test-token-12345');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/hashtags/compare', () => {
    it('should compare hashtags', async () => {
      (HashtagAnalyticsService.compareHashtags as jest.Mock).mockResolvedValue([
        { name: 'travel', engagement: 500 },
        { name: 'photography', engagement: 700 },
      ]);

      const response = await request(app)
        .get('/api/hashtags/compare')
        .set('Authorization', 'Bearer test-token-12345')
        .query({ hashtags: 'travel,photography' });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('GET /api/hashtags/suggest', () => {
    it('should suggest hashtags', async () => {
      (HashtagAnalyticsService.getHashtagSuggestions as jest.Mock).mockResolvedValue([
        { name: 'travelphotography', score: 0.9 },
      ]);

      const response = await request(app)
        .get('/api/hashtags/suggest')
        .set('Authorization', 'Bearer test-token-12345')
        .query({ seed: 'travel', limit: '5' });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
    });
  });
});

describe('Trending Routes', () => {
  let app: Express;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe('GET /api/trending', () => {
    it('should return trending hashtags', async () => {
      (TrendingHashtagsService.getTrendingHashtags as jest.Mock).mockResolvedValue([
        { name: 'trending1', growthRate: 50 },
        { name: 'trending2', growthRate: 40 },
      ]);

      const response = await request(app)
        .get('/api/trending')
        .set('Authorization', 'Bearer test-token-12345')
        .query({ limit: '10' });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
    });

    it('should filter by category', async () => {
      (TrendingHashtagsService.getTrendingHashtags as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/trending')
        .set('Authorization', 'Bearer test-token-12345')
        .query({ category: 'travel' });

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/trending/:name/growth', () => {
    it('should return hashtag growth rate', async () => {
      (TrendingHashtagsService.getHashtagGrowthRate as jest.Mock).mockResolvedValue(11.11);

      const response = await request(app)
        .get('/api/trending/travel/growth')
        .set('Authorization', 'Bearer test-token-12345');

      expect(response.status).toBe(200);
      expect(response.body.data.growthRate).toBe(11.11);
    });
  });
});

describe('Auth Middleware', () => {
  let app: Express;

  beforeEach(() => {
    app = createTestApp();
  });

  it('should return 401 without auth token', async () => {
    const response = await request(app).get('/api/hashtags/search').query({ q: 'travel' });

    expect(response.status).toBe(401);
  });

  it('should return 401 with invalid token', async () => {
    const response = await request(app)
      .get('/api/hashtags/search')
      .query({ q: 'travel' })
      .set('Authorization', 'Bearer short');

    expect(response.status).toBe(401);
  });
});

describe('404 Handler', () => {
  let app: Express;

  beforeEach(() => {
    app = createTestApp();
  });

  it('should return 404 for unknown routes', async () => {
    const response = await request(app)
      .get('/api/unknown-route')
      .set('Authorization', 'Bearer test-token-12345');

    expect(response.status).toBe(404);
  });
});