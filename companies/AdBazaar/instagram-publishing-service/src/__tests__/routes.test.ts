/**
 * Route Tests for Instagram Publishing Service
 * Tests all API endpoints using supertest
 */

import request from 'supertest';
import express, { Express } from 'express';
import { publishRoutes } from '../routes/publishRoutes';
import { accountRoutes } from '../routes/accountRoutes';
import { webhookRoutes } from '../routes/webhookRoutes';
import { publishingService } from '../services/publishingService';
import { accountService } from '../services/accountService';
import { asyncHandler, errorHandler, notFoundHandler, ValidationError } from '../middleware';

// Mock services
jest.mock('../services/publishingService');
jest.mock('../services/accountService');
jest.mock('../utils/logger');

// Create test app
function createTestApp(): Express {
  const app = express();
  app.use(express.json());

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'instagram-publishing-service' });
  });

  // API documentation
  app.get('/api', (req, res) => {
    res.json({ service: 'Instagram Publishing Service', version: '1.0.0' });
  });

  // Routes
  app.use('/api/publish', publishRoutes);
  app.use('/api/accounts', accountRoutes);
  app.use('/api/webhooks', webhookRoutes);

  // Error handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

describe('Publish Routes', () => {
  let app: Express;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    });
  });

  describe('POST /api/publish', () => {
    const validContent = {
      accountId: 'acc-123',
      contentType: 'feed_image',
      mediaUrl: 'https://example.com/image.jpg',
      caption: 'Test caption',
      hashtags: ['test', 'instagram'],
    };

    it('should publish content immediately', async () => {
      (publishingService.publishContent as jest.Mock).mockResolvedValue({
        success: true,
        publishRequestId: 'req-123',
        publishedContentId: 'pub-123',
        instagramMediaId: 'ig-media-123',
        instagramPermalink: 'https://instagram.com/p/test',
      });

      const response = await request(app)
        .post('/api/publish')
        .set('X-API-Key', 'test-api-key')
        .send(validContent);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.instagramMediaId).toBe('ig-media-123');
    });

    it('should return 500 when publishing fails', async () => {
      (publishingService.publishContent as jest.Mock).mockResolvedValue({
        success: false,
        publishRequestId: 'req-123',
        error: 'Instagram API error',
      });

      const response = await request(app)
        .post('/api/publish')
        .set('X-API-Key', 'test-api-key')
        .send(validContent);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid content type', async () => {
      const response = await request(app)
        .post('/api/publish')
        .set('X-API-Key', 'test-api-key')
        .send({ ...validContent, contentType: 'invalid' });

      expect(response.status).toBe(400);
    });

    it('should return 400 when accountId is missing', async () => {
      const response = await request(app)
        .post('/api/publish')
        .set('X-API-Key', 'test-api-key')
        .send({ contentType: 'feed_image', mediaUrl: 'https://example.com/image.jpg' });

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid media URL', async () => {
      const response = await request(app)
        .post('/api/publish')
        .set('X-API-Key', 'test-api-key')
        .send({ ...validContent, mediaUrl: 'not-a-url' });

      expect(response.status).toBe(400);
    });

    it('should accept valid hashtags array', async () => {
      (publishingService.publishContent as jest.Mock).mockResolvedValue({
        success: true,
        publishRequestId: 'req-123',
        instagramMediaId: 'ig-media-123',
      });

      const response = await request(app)
        .post('/api/publish')
        .set('X-API-Key', 'test-api-key')
        .send({
          ...validContent,
          hashtags: ['hashtag1', 'hashtag2', 'hashtag3'],
        });

      expect(response.status).toBe(201);
    });

    it('should reject more than 30 hashtags', async () => {
      const response = await request(app)
        .post('/api/publish')
        .set('X-API-Key', 'test-api-key')
        .send({
          ...validContent,
          hashtags: Array(31).fill('tag'),
        });

      expect(response.status).toBe(400);
    });

    it('should accept story config', async () => {
      (publishingService.publishContent as jest.Mock).mockResolvedValue({
        success: true,
        publishRequestId: 'req-123',
        instagramMediaId: 'ig-media-123',
      });

      const response = await request(app)
        .post('/api/publish')
        .set('X-API-Key', 'test-api-key')
        .send({
          ...validContent,
          contentType: 'story',
          storyConfig: {
            type: 'poll',
            pollQuestion: 'What do you think?',
            pollOptions: ['Option A', 'Option B'],
          },
        });

      expect(response.status).toBe(201);
    });
  });

  describe('POST /api/publish/schedule', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    const validSchedule = {
      accountId: 'acc-123',
      contentType: 'feed_image',
      mediaUrl: 'https://example.com/image.jpg',
      caption: 'Scheduled post',
      scheduledTime: futureDate.toISOString(),
    };

    it('should schedule content for future', async () => {
      (publishingService.scheduleContent as jest.Mock).mockResolvedValue({
        scheduleId: 'schedule-123',
        scheduledTime: futureDate,
      });

      const response = await request(app)
        .post('/api/publish/schedule')
        .set('X-API-Key', 'test-api-key')
        .send(validSchedule);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.scheduleId).toBe('schedule-123');
    });

    it('should return 400 for past scheduled time', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const response = await request(app)
        .post('/api/publish/schedule')
        .set('X-API-Key', 'test-api-key')
        .send({
          ...validSchedule,
          scheduledTime: pastDate.toISOString(),
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/publish/draft', () => {
    const validDraft = {
      accountId: 'acc-123',
      contentType: 'feed_image',
      mediaUrl: 'https://example.com/image.jpg',
      caption: 'Draft caption',
    };

    it('should save draft content', async () => {
      (publishingService.saveDraft as jest.Mock).mockResolvedValue({
        draftId: 'draft-123',
      });

      const response = await request(app)
        .post('/api/publish/draft')
        .set('X-API-Key', 'test-api-key')
        .send(validDraft);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.draftId).toBe('draft-123');
    });
  });

  describe('GET /api/publish/drafts', () => {
    it('should return drafts for account', async () => {
      (publishingService.getDrafts as jest.Mock).mockResolvedValue([
        { _id: 'draft-1', caption: 'Draft 1' },
        { _id: 'draft-2', caption: 'Draft 2' },
      ]);

      const response = await request(app)
        .get('/api/publish/drafts')
        .set('X-API-Key', 'test-api-key')
        .query({ accountId: 'acc-123' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.drafts).toHaveLength(2);
    });

    it('should return 400 when accountId is missing', async () => {
      const response = await request(app)
        .get('/api/publish/drafts')
        .set('X-API-Key', 'test-api-key');

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/publish/content/:id', () => {
    it('should return content by ID', async () => {
      const mockContent = {
        _id: 'content-123',
        caption: 'Test content',
        contentType: 'feed_image',
      };

      (publishingService.getContent as jest.Mock).mockResolvedValue(mockContent);

      const response = await request(app)
        .get('/api/publish/content/content-123')
        .set('X-API-Key', 'test-api-key');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.caption).toBe('Test content');
    });
  });

  describe('DELETE /api/publish/content/:id', () => {
    it('should delete content', async () => {
      (publishingService.deleteContent as jest.Mock).mockResolvedValue({
        success: true,
      });

      const response = await request(app)
        .delete('/api/publish/content/content-123')
        .set('X-API-Key', 'test-api-key');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/publish/accounts/:id/content', () => {
    it('should return account content with pagination', async () => {
      (publishingService.getAccountContent as jest.Mock).mockResolvedValue({
        content: [
          { _id: 'content-1', caption: 'Content 1' },
          { _id: 'content-2', caption: 'Content 2' },
        ],
        total: 2,
        page: 1,
        totalPages: 1,
      });

      const response = await request(app)
        .get('/api/publish/accounts/acc-123/content')
        .set('X-API-Key', 'test-api-key')
        .query({ page: '1', limit: '10' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toHaveLength(2);
    });

    it('should filter by content type', async () => {
      (publishingService.getAccountContent as jest.Mock).mockResolvedValue({
        content: [],
        total: 0,
        page: 1,
        totalPages: 0,
      });

      const response = await request(app)
        .get('/api/publish/accounts/acc-123/content')
        .set('X-API-Key', 'test-api-key')
        .query({ contentType: 'feed_image' });

      expect(response.status).toBe(200);
      expect(publishingService.getAccountContent).toHaveBeenCalledWith('acc-123', {
        page: undefined,
        limit: undefined,
        contentType: 'feed_image',
      });
    });
  });

  describe('PUT /api/publish/content/:id/metrics', () => {
    it('should update content metrics', async () => {
      (publishingService.updateMetrics as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .put('/api/publish/content/content-123/metrics')
        .set('X-API-Key', 'test-api-key');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Metrics updated');
    });
  });
});

describe('Account Routes', () => {
  let app: Express;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe('GET /api/accounts', () => {
    it('should list all accounts', async () => {
      (accountService.listAccounts as jest.Mock).mockResolvedValue([
        { accountId: 'acc-1', instagramUsername: 'user1' },
        { accountId: 'acc-2', instagramUsername: 'user2' },
      ]);

      const response = await request(app)
        .get('/api/accounts')
        .set('X-API-Key', 'test-api-key');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accounts).toHaveLength(2);
    });
  });

  describe('GET /api/accounts/:id', () => {
    it('should return account details', async () => {
      const mockAccount = {
        accountId: 'acc-123',
        instagramUsername: 'test_user',
        followersCount: 1000,
        status: 'active',
      };

      (accountService.getAccount as jest.Mock).mockResolvedValue(mockAccount);

      const response = await request(app)
        .get('/api/accounts/acc-123')
        .set('X-API-Key', 'test-api-key');

      expect(response.status).toBe(200);
      expect(response.body.data.instagramUsername).toBe('test_user');
    });

    it('should return 404 for non-existent account', async () => {
      (accountService.getAccount as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/accounts/nonexistent')
        .set('X-API-Key', 'test-api-key');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/accounts/:id/connect', () => {
    it('should connect account', async () => {
      (accountService.connectAccount as jest.Mock).mockResolvedValue({
        accountId: 'acc-123',
        status: 'active',
      });

      const response = await request(app)
        .post('/api/accounts/acc-123/connect')
        .set('X-API-Key', 'test-api-key')
        .send({
          instagramId: 'ig-123',
          instagramUsername: 'test_user',
          accessToken: 'test-token',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/accounts/:id/disconnect', () => {
    it('should disconnect account', async () => {
      (accountService.disconnectAccount as jest.Mock).mockResolvedValue({
        accountId: 'acc-123',
        status: 'inactive',
      });

      const response = await request(app)
        .post('/api/accounts/acc-123/disconnect')
        .set('X-API-Key', 'test-api-key');

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('inactive');
    });
  });

  describe('POST /api/accounts/:id/sync', () => {
    it('should sync account', async () => {
      (accountService.syncAccount as jest.Mock).mockResolvedValue({
        accountId: 'acc-123',
        followersCount: 1500,
        lastSyncAt: new Date(),
      });

      const response = await request(app)
        .post('/api/accounts/acc-123/sync')
        .set('X-API-Key', 'test-api-key');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/accounts/:id/content', () => {
    it('should return account content', async () => {
      (publishingService.getAccountContent as jest.Mock).mockResolvedValue({
        content: [],
        total: 0,
        page: 1,
        totalPages: 0,
      });

      const response = await request(app)
        .get('/api/accounts/acc-123/content')
        .set('X-API-Key', 'test-api-key');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/accounts/:id/stats', () => {
    it('should return account stats', async () => {
      (accountService.getAccountStats as jest.Mock).mockResolvedValue({
        totalPosts: 100,
        totalLikes: 5000,
        totalComments: 500,
        avgLikes: 50,
      });

      const response = await request(app)
        .get('/api/accounts/acc-123/stats')
        .set('X-API-Key', 'test-api-key');

      expect(response.status).toBe(200);
      expect(response.body.data.totalPosts).toBe(100);
    });
  });
});

describe('Webhook Routes', () => {
  let app: Express;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe('GET /api/webhooks/instagram', () => {
    it('should verify webhook challenge', async () => {
      const response = await request(app)
        .get('/api/webhooks/instagram')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': 'test-verify-token',
          'hub.challenge': 'test-challenge',
        });

      expect(response.status).toBe(200);
      expect(response.text).toBe('test-challenge');
    });

    it('should return 400 when verify token does not match', async () => {
      const response = await request(app)
        .get('/api/webhooks/instagram')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': 'wrong-token',
          'hub.challenge': 'test-challenge',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/webhooks/instagram', () => {
    it('should handle incoming webhook', async () => {
      const webhookPayload = {
        object: 'instagram',
        entry: [
          {
            id: '123456',
            time: 1234567890,
            changes: [],
          },
        ],
      };

      const response = await request(app)
        .post('/api/webhooks/instagram')
        .send(webhookPayload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
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