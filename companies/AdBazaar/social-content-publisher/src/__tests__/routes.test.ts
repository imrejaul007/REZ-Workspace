/**
 * Route Tests for Social Content Publisher
 * Tests all API endpoints using supertest
 */

import request from 'supertest';
import express, { Express } from 'express';
import routes from '../routes';
import { ContentPublisher, PlatformManager, SchedulerService, AnalyticsService } from '../services';
import { errorHandler, notFoundHandler, requestLogger, requestMetrics } from '../middleware';

// Mock services
jest.mock('../services/contentPublisher');
jest.mock('../services/platformManager');
jest.mock('../services/schedulerService');
jest.mock('../services/analyticsService');
jest.mock('../config/logger');

// Create test app
function createTestApp(): Express {
  const app = express();
  app.use(express.json());
  app.use(requestLogger);
  app.use(requestMetrics);

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'social-content-publisher' });
  });

  // Routes
  app.use('/api', routes);

  // Error handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

describe('Content Routes', () => {
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

  describe('POST /api/content', () => {
    const validContent = {
      title: 'Test Post',
      body: 'Content body',
      mediaUrls: ['https://example.com/image.jpg'],
      author: 'user-123',
      companyId: 'company-123',
      platforms: ['instagram'],
    };

    it('should create content', async () => {
      const mockContent = {
        id: 'content-123',
        ...validContent,
        status: 'draft',
      };

      (ContentPublisher.createContent as jest.Mock).mockResolvedValue(mockContent);

      const response = await request(app)
        .post('/api/content')
        .set('x-user-id', 'user-123')
        .set('x-company-id', 'company-123')
        .send(validContent);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/content')
        .set('x-user-id', 'user-123')
        .set('x-company-id', 'company-123')
        .send({ title: 'Test' });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/content', () => {
    it('should list content', async () => {
      (ContentPublisher.listContent as jest.Mock).mockResolvedValue({
        content: [],
        total: 0,
        page: 1,
        totalPages: 0,
      });

      const response = await request(app)
        .get('/api/content')
        .set('x-user-id', 'user-123')
        .set('x-company-id', 'company-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should filter by status', async () => {
      (ContentPublisher.listContent as jest.Mock).mockResolvedValue({
        content: [],
        total: 0,
        page: 1,
        totalPages: 0,
      });

      const response = await request(app)
        .get('/api/content')
        .set('x-user-id', 'user-123')
        .set('x-company-id', 'company-123')
        .query({ status: 'draft' });

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/content/:id', () => {
    it('should return content by ID', async () => {
      const mockContent = {
        id: 'content-123',
        title: 'Test Post',
        body: 'Content body',
      };

      (ContentPublisher.getContent as jest.Mock).mockResolvedValue(mockContent);

      const response = await request(app)
        .get('/api/content/content-123')
        .set('x-user-id', 'user-123')
        .set('x-company-id', 'company-123');

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe('Test Post');
    });

    it('should return 404 for non-existent content', async () => {
      (ContentPublisher.getContent as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/content/nonexistent')
        .set('x-user-id', 'user-123')
        .set('x-company-id', 'company-123');

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/content/:id', () => {
    it('should update content', async () => {
      const updatedContent = {
        id: 'content-123',
        title: 'Updated Post',
      };

      (ContentPublisher.updateContent as jest.Mock).mockResolvedValue(updatedContent);

      const response = await request(app)
        .put('/api/content/content-123')
        .set('x-user-id', 'user-123')
        .set('x-company-id', 'company-123')
        .send({ title: 'Updated Post' });

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe('Updated Post');
    });
  });

  describe('DELETE /api/content/:id', () => {
    it('should delete content', async () => {
      (ContentPublisher.deleteContent as jest.Mock).mockResolvedValue(true);

      const response = await request(app)
        .delete('/api/content/content-123')
        .set('x-user-id', 'user-123')
        .set('x-company-id', 'company-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});

describe('Publish Routes', () => {
  let app: Express;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe('POST /api/publish/:contentId', () => {
    it('should publish content to a platform', async () => {
      (ContentPublisher.publishToPlatform as jest.Mock).mockResolvedValue({
        success: true,
        platformPostId: 'ig-post-123',
        url: 'https://instagram.com/p/test',
      });

      const response = await request(app)
        .post('/api/publish/content-123')
        .set('x-user-id', 'user-123')
        .set('x-company-id', 'company-123')
        .send({ platform: 'instagram' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should handle publish failure', async () => {
      (ContentPublisher.publishToPlatform as jest.Mock).mockResolvedValue({
        success: false,
        error: 'API error',
      });

      const response = await request(app)
        .post('/api/publish/content-123')
        .set('x-user-id', 'user-123')
        .set('x-company-id', 'company-123')
        .send({ platform: 'instagram' });

      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/publish/:contentId/multi', () => {
    it('should publish to multiple platforms', async () => {
      (ContentPublisher.publishToMultiplePlatforms as jest.Mock).mockResolvedValue({
        successful: ['instagram', 'facebook'],
        failed: [],
      });

      const response = await request(app)
        .post('/api/publish/content-123/multi')
        .set('x-user-id', 'user-123')
        .set('x-company-id', 'company-123')
        .send({ platforms: ['instagram', 'facebook'] });

      expect(response.status).toBe(200);
      expect(response.body.data.successful).toHaveLength(2);
    });
  });
});

describe('Schedule Routes', () => {
  let app: Express;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe('POST /api/schedule', () => {
    it('should schedule content', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      (ContentPublisher.scheduleContent as jest.Mock).mockResolvedValue({
        jobId: 'job-123',
        scheduledTime: futureDate,
      });

      const response = await request(app)
        .post('/api/schedule')
        .set('x-user-id', 'user-123')
        .set('x-company-id', 'company-123')
        .send({
          contentId: 'content-123',
          scheduledTime: futureDate.toISOString(),
          platforms: ['instagram'],
        });

      expect(response.status).toBe(201);
      expect(response.body.data.jobId).toBeDefined();
    });

    it('should return 400 for past scheduled time', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const response = await request(app)
        .post('/api/schedule')
        .set('x-user-id', 'user-123')
        .set('x-company-id', 'company-123')
        .send({
          contentId: 'content-123',
          scheduledTime: pastDate.toISOString(),
          platforms: ['instagram'],
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/schedule', () => {
    it('should list scheduled content', async () => {
      (SchedulerService.getScheduledJobs as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/schedule')
        .set('x-user-id', 'user-123')
        .set('x-company-id', 'company-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('DELETE /api/schedule/:jobId', () => {
    it('should cancel scheduled content', async () => {
      (SchedulerService.cancel as jest.Mock).mockResolvedValue({ success: true });

      const response = await request(app)
        .delete('/api/schedule/job-123')
        .set('x-user-id', 'user-123')
        .set('x-company-id', 'company-123');

      expect(response.status).toBe(200);
    });
  });
});

describe('Platform Routes', () => {
  let app: Express;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe('GET /api/platforms', () => {
    it('should list connected platforms', async () => {
      (PlatformManager.listPlatforms as jest.Mock).mockResolvedValue([
        { name: 'instagram', status: 'active' },
        { name: 'facebook', status: 'active' },
      ]);

      const response = await request(app)
        .get('/api/platforms')
        .set('x-user-id', 'user-123')
        .set('x-company-id', 'company-123');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('POST /api/platforms', () => {
    it('should connect a platform', async () => {
      (PlatformManager.registerPlatform as jest.Mock).mockResolvedValue({
        name: 'twitter',
        status: 'active',
      });

      const response = await request(app)
        .post('/api/platforms')
        .set('x-user-id', 'user-123')
        .set('x-company-id', 'company-123')
        .send({
          platform: 'twitter',
          credentials: { apiKey: 'key', apiSecret: 'secret' },
        });

      expect(response.status).toBe(201);
    });
  });

  describe('GET /api/platforms/:name/status', () => {
    it('should return platform status', async () => {
      (PlatformManager.getPlatformStatus as jest.Mock).mockResolvedValue({
        name: 'instagram',
        status: 'active',
        lastSync: new Date(),
      });

      const response = await request(app)
        .get('/api/platforms/instagram/status')
        .set('x-user-id', 'user-123')
        .set('x-company-id', 'company-123');

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('active');
    });
  });
});

describe('Analytics Routes', () => {
  let app: Express;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe('GET /api/analytics/summary', () => {
    it('should return analytics summary', async () => {
      (AnalyticsService.getAnalytics as jest.Mock).mockResolvedValue({
        totalPosts: 100,
        totalEngagement: 5000,
        byPlatform: {},
      });

      const response = await request(app)
        .get('/api/analytics/summary')
        .set('x-user-id', 'user-123')
        .set('x-company-id', 'company-123');

      expect(response.status).toBe(200);
      expect(response.body.data.totalPosts).toBe(100);
    });
  });

  describe('GET /api/analytics/top-content', () => {
    it('should return top content', async () => {
      (AnalyticsService.getTopContent as jest.Mock).mockResolvedValue([
        { contentId: 'content-1', engagement: 1000 },
      ]);

      const response = await request(app)
        .get('/api/analytics/top-content')
        .set('x-user-id', 'user-123')
        .set('x-company-id', 'company-123')
        .query({ limit: '10' });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
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
  });
});