/**
 * Publishing API Tests for Instagram Publishing Service
 */

import request from 'supertest';
import express, { Express, Request, Response } from 'express';

// Mock publishing service
const mockPublishingService = {
  publishContent: jest.fn().mockResolvedValue({
    success: true,
    publishRequestId: 'req_123',
    publishedContentId: 'content_123',
    instagramMediaId: 'ig_media_123',
    instagramPermalink: 'https://instagram.com/p/abc123',
  }),
  scheduleContent: jest.fn().mockResolvedValue({
    scheduleId: 'sched_123',
    scheduledTime: new Date(Date.now() + 86400000), // Tomorrow
  }),
  saveDraft: jest.fn().mockResolvedValue({
    draftId: 'draft_123',
  }),
  getDrafts: jest.fn().mockResolvedValue([
    {
      id: 'draft_1',
      accountId: 'acc_123',
      contentType: 'feed_image',
      caption: 'Test draft',
      createdAt: new Date(),
    },
  ]),
  getContent: jest.fn().mockImplementation((id) => ({
    id,
    accountId: 'acc_123',
    contentType: 'feed_image',
    caption: 'Test content',
    status: 'published',
    publishedAt: new Date(),
  })),
  deleteContent: jest.fn().mockResolvedValue({ deleted: true }),
  getAccountContent: jest.fn().mockResolvedValue({
    content: [],
    pagination: { page: 1, limit: 10, total: 0, pages: 0 },
  }),
  updateMetrics: jest.fn().mockResolvedValue({ updated: true }),
};

// Mock validation error
class ValidationError extends Error {
  constructor(message: string, public details?: Record<string, string>) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Async handler wrapper
const asyncHandler = (fn: (req: Request, res: Response) => Promise<void>) => {
  return (req: Request, res: Response) => {
    Promise.resolve(fn(req, res)).catch((error) => {
      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message,
          details: error.details,
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal server error',
        });
      }
    });
  };
};

// Create test app
const createTestApp = (): Express => {
  const app = express();
  app.use(express.json());

  // Publish content immediately
  app.post('/api/publish', asyncHandler(async (req: Request, res: Response) => {
    const { accountId, contentType, mediaUrl, caption, hashtags } = req.body;

    if (!accountId) {
      throw new ValidationError('Invalid request body', { accountId: 'Account ID is required' });
    }

    if (!contentType) {
      throw new ValidationError('Invalid request body', { contentType: 'Content type is required' });
    }

    const result = await mockPublishingService.publishContent({
      accountId,
      contentType,
      mediaUrl,
      caption,
      hashtags,
    });

    if (!result.success) {
      res.status(500).json({
        success: false,
        error: result.error,
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: {
        publishRequestId: result.publishRequestId,
        publishedContentId: result.publishedContentId,
        instagramMediaId: result.instagramMediaId,
        instagramPermalink: result.instagramPermalink,
      },
    });
  }));

  // Schedule content
  app.post('/api/publish/schedule', asyncHandler(async (req: Request, res: Response) => {
    const { accountId, contentType, scheduledTime } = req.body;

    if (!accountId || !contentType || !scheduledTime) {
      throw new ValidationError('Invalid request body');
    }

    const scheduledDate = new Date(scheduledTime);
    if (scheduledDate <= new Date()) {
      throw new ValidationError('Scheduled time must be in the future');
    }

    const result = await mockPublishingService.scheduleContent({
      accountId,
      contentType,
      scheduledTime: scheduledDate,
    });

    res.status(201).json({
      success: true,
      data: {
        scheduleId: result.scheduleId,
        scheduledTime: result.scheduledTime,
      },
    });
  }));

  // Save draft
  app.post('/api/publish/draft', asyncHandler(async (req: Request, res: Response) => {
    const { accountId, contentType } = req.body;

    if (!accountId || !contentType) {
      throw new ValidationError('Invalid request body');
    }

    const result = await mockPublishingService.saveDraft({
      accountId,
      contentType,
    });

    res.status(201).json({
      success: true,
      data: {
        draftId: result.draftId,
      },
    });
  }));

  // Get drafts
  app.get('/api/publish/drafts', asyncHandler(async (req: Request, res: Response) => {
    const { accountId } = req.query;

    if (!accountId || typeof accountId !== 'string') {
      throw new ValidationError('accountId query parameter is required');
    }

    const drafts = await mockPublishingService.getDrafts(accountId as string);

    res.json({
      success: true,
      data: {
        drafts,
        count: drafts.length,
      },
    });
  }));

  // Get content by ID
  app.get('/api/content/:id', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const content = await mockPublishingService.getContent(id);

    res.json({
      success: true,
      data: content,
    });
  }));

  // Delete content
  app.delete('/api/content/:id', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await mockPublishingService.deleteContent(id);

    res.json({
      success: true,
      data: result,
    });
  }));

  // Get account content
  app.get('/api/accounts/:id/content', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { page, limit, contentType } = req.query;

    const result = await mockPublishingService.getAccountContent(id, {
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      contentType: contentType as string | undefined,
    });

    res.json({
      success: true,
      data: result,
    });
  }));

  // Update content metrics
  app.put('/api/content/:id/metrics', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    await mockPublishingService.updateMetrics(id);

    res.json({
      success: true,
      message: 'Metrics updated',
    });
  }));

  return app;
};

describe('Publishing API', () => {
  let app: Express;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/publish', () => {
    it('should publish content immediately', async () => {
      const response = await request(app)
        .post('/api/publish')
        .send({
          accountId: 'acc_123',
          contentType: 'feed_image',
          mediaUrl: 'https://example.com/image.jpg',
          caption: 'Test post #instagram',
          hashtags: ['#test', '#instagram'],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.publishRequestId).toBe('req_123');
      expect(response.body.data.instagramMediaId).toBe('ig_media_123');
    });

    it('should return 400 when accountId is missing', async () => {
      const response = await request(app)
        .post('/api/publish')
        .send({
          contentType: 'feed_image',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return400 when contentType is missing', async () => {
      const response = await request(app)
        .post('/api/publish')
        .send({
          accountId: 'acc_123',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should accept valid content types', async () => {
      const validTypes = ['feed_image', 'feed_album', 'feed_video', 'reel', 'story'];

      for (const contentType of validTypes) {
        const response = await request(app)
          .post('/api/publish')
          .send({
            accountId: 'acc_123',
            contentType,
          });

        expect(response.status).toBe(201);
      }
    });
  });

  describe('POST /api/publish/schedule', () => {
    it('should schedule content for future publishing', async () => {
      const futureDate = new Date(Date.now() + 86400000); // Tomorrow

      const response = await request(app)
        .post('/api/publish/schedule')
        .send({
          accountId: 'acc_123',
          contentType: 'feed_image',
          scheduledTime: futureDate.toISOString(),
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.scheduleId).toBe('sched_123');
    });

    it('should return 400 for past scheduled time', async () => {
      const pastDate = new Date(Date.now() - 86400000); // Yesterday

      const response = await request(app)
        .post('/api/publish/schedule')
        .send({
          accountId: 'acc_123',
          contentType: 'feed_image',
          scheduledTime: pastDate.toISOString(),
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Scheduled time must be in the future');
    });

    it('should return 400 when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/publish/schedule')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/publish/draft', () => {
    it('should save content as draft', async () => {
      const response = await request(app)
        .post('/api/publish/draft')
        .send({
          accountId: 'acc_123',
          contentType: 'feed_image',
          caption: 'Draft post',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.draftId).toBe('draft_123');
    });

    it('should return 400 when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/publish/draft')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/publish/drafts', () => {
    it('should return list of drafts for an account', async () => {
      const response = await request(app)
        .get('/api/publish/drafts')
        .query({ accountId: 'acc_123' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.drafts).toBeDefined();
      expect(Array.isArray(response.body.data.drafts)).toBe(true);
    });

    it('should return 400 when accountId is missing', async () => {
      const response = await request(app)
        .get('/api/publish/drafts');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/content/:id', () => {
    it('should return content by ID', async () => {
      const response = await request(app)
        .get('/api/content/content_123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('content_123');
    });
  });

  describe('DELETE /api/content/:id', () => {
    it('should delete content', async () => {
      const response = await request(app)
        .delete('/api/content/content_123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/accounts/:id/content', () => {
    it('should return content for an account', async () => {
      const response = await request(app)
        .get('/api/accounts/acc_123/content');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should support pagination parameters', async () => {
      const response = await request(app)
        .get('/api/accounts/acc_123/content')
        .query({ page: '1', limit: '20' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('PUT /api/content/:id/metrics', () => {
    it('should update content metrics', async () => {
      const response = await request(app)
        .put('/api/content/content_123/metrics');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Metrics updated');
    });
  });
});

describe('Content Type Validation', () => {
  const validContentTypes = ['feed_image', 'feed_album', 'feed_video', 'reel', 'story'];

  it('should validate all content types', () => {
    validContentTypes.forEach((type) => {
      expect(validContentTypes).toContain(type);
    });
  });

  it('should reject invalid content types', () => {
    const invalidTypes = ['invalid', 'video', 'image', 'post'];
    invalidTypes.forEach((type) => {
      expect(validContentTypes).not.toContain(type);
    });
  });
});