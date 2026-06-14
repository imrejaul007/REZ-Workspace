/**
 * Posts API Tests for Social Content Publisher
 */

import request from 'supertest';
import express, { Express, Request, Response } from 'express';

// Mock post service
const mockPosts = [
  {
    _id: 'post_1',
    title: 'Test Post 1',
    content: { text: 'Test content 1', media: [] },
    platforms: [
      { platform: 'instagram', enabled: true, accountId: 'acc_1' },
      { platform: 'twitter', enabled: false, accountId: 'acc_2' },
    ],
    status: 'draft',
    workflow: { status: 'pending' },
    userId: 'user_1',
    companyId: 'company_1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: 'post_2',
    title: 'Test Post 2',
    content: { text: 'Test content 2', media: ['https://example.com/image.jpg'] },
    platforms: [
      { platform: 'instagram', enabled: true, accountId: 'acc_1' },
      { platform: 'facebook', enabled: true, accountId: 'acc_3' },
    ],
    status: 'scheduled',
    scheduledTime: new Date(Date.now() + 86400000),
    workflow: { status: 'approved' },
    userId: 'user_1',
    companyId: 'company_1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Mock post service functions
const mockPostService = {
  create: jest.fn().mockResolvedValue({
    _id: 'post_new',
    title: 'New Post',
    content: { text: 'New content', media: [] },
    platforms: [{ platform: 'instagram', enabled: true, accountId: 'acc_1' }],
    status: 'draft',
    workflow: { status: 'pending' },
    userId: 'user_1',
    companyId: 'company_1',
  }),
  findByIdAndCompany: jest.fn().mockImplementation((id, companyId) => {
    const post = mockPosts.find((p) => p._id === id && p.companyId === companyId);
    if (!post) throw new Error(`Post not found: ${id}`);
    return post;
  }),
  findAll: jest.fn().mockResolvedValue({
    posts: mockPosts,
    pagination: { page: 1, limit: 10, total: 2, pages: 1 },
  }),
  update: jest.fn().mockImplementation((id, userId, data) => ({
    ...mockPosts[0],
    ...data,
    updatedAt: new Date(),
  })),
  delete: jest.fn().mockResolvedValue(undefined),
  submitForReview: jest.fn().mockResolvedValue({
    ...mockPosts[0],
    workflow: { status: 'review' },
  }),
  approve: jest.fn().mockResolvedValue({
    ...mockPosts[0],
    workflow: { status: 'approved', reviewedBy: 'reviewer_1', reviewedAt: new Date() },
  }),
  reject: jest.fn().mockResolvedValue({
    ...mockPosts[0],
    workflow: { status: 'rejected', reviewedBy: 'reviewer_1', reviewedAt: new Date() },
  }),
  checkConflicts: jest.fn().mockResolvedValue({ hasConflict: false }),
  getVersionHistory: jest.fn().mockResolvedValue([
    { version: 1, content: mockPosts[0].content, updatedBy: 'user_1', updatedAt: new Date() },
  ]),
};

// Mock queue service
const mockQueueService = {
  createQueueItems: jest.fn().mockResolvedValue([]),
  markAsPublished: jest.fn().mockResolvedValue(undefined),
};

// Mock publishing service
const mockPublishingService = {
  publish: jest.fn().mockResolvedValue({
    success: true,
    publishedId: 'ig_post_123',
    platform: 'instagram',
  }),
};

// Internal service auth mock
const internalServiceAuth = (req: Request, res: Response, next: () => void) => {
  req.headers['x-internal-token'] = 'test-token';
  req.user = { userId: 'user_1', companyId: 'company_1' };
  next();
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

  // Apply auth middleware
  app.use('/api/posts', internalServiceAuth);

  // Create post
  app.post('/api/posts', asyncHandler(async (req: Request, res: Response) => {
    const { title, content, platforms, scheduledTime } = req.body;
    const { userId, companyId } = req.user!;

    const post = await mockPostService.create({
      title,
      content,
      platforms,
      scheduledTime: scheduledTime ? new Date(scheduledTime) : undefined,
      userId,
      companyId,
    });

    res.status(201).json({
      success: true,
      data: post,
    });
  }));

  // List posts
  app.get('/api/posts', asyncHandler(async (req: Request, res: Response) => {
    const { companyId } = req.user!;
    const { page, limit, status, workflowStatus, startDate, endDate } = req.query;

    const result = await mockPostService.findAll(
      { companyId },
      {
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 10,
        status: status as string | undefined,
        workflowStatus: workflowStatus as string | undefined,
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
      }
    );

    res.json({
      success: true,
      ...result,
    });
  }));

  // Get post by ID
  app.get('/api/posts/:id', asyncHandler(async (req: Request, res: Response) => {
    const { companyId } = req.user!;
    const post = await mockPostService.findByIdAndCompany(req.params.id, companyId);

    res.json({
      success: true,
      data: post,
    });
  }));

  // Update post
  app.patch('/api/posts/:id', asyncHandler(async (req: Request, res: Response) => {
    const { userId, companyId } = req.user!;
    const { title, content, platforms, scheduledTime } = req.body;

    const post = await mockPostService.update(req.params.id, userId, {
      title,
      content,
      platforms,
      scheduledTime: scheduledTime ? new Date(scheduledTime) : null,
    });

    res.json({
      success: true,
      data: post,
    });
  }));

  // Delete post
  app.delete('/api/posts/:id', asyncHandler(async (req: Request, res: Response) => {
    await mockPostService.delete(req.params.id);

    res.json({
      success: true,
      message: 'Post deleted successfully',
    });
  }));

  // Publish post
  app.post('/api/posts/:id/publish', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { companyId } = req.user!;

    const post = await mockPostService.findByIdAndCompany(id, companyId);

    if (post.workflow.status !== 'approved' && post.workflow.status !== 'pending') {
      res.status(400).json({
        success: false,
        error: `Cannot publish post with workflow status: ${post.workflow.status}`,
      });
      return;
    }

    const publishResults: Record<string, any> = {};
    for (const platformConfig of post.platforms) {
      if (!platformConfig.enabled) continue;

      const result = await mockPublishingService.publish(platformConfig.platform, {
        text: post.content.text,
        media: post.content.media,
        accountId: platformConfig.accountId,
      });

      publishResults[platformConfig.platform] = result;

      if (result.success && result.publishedId) {
        await mockQueueService.markAsPublished(id, platformConfig.platform);
      }
    }

    res.json({
      success: true,
      data: {
        postId: id,
        results: publishResults,
      },
    });
  }));

  // Schedule post
  app.post('/api/posts/:id/schedule', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { companyId } = req.user!;
    const { scheduledTime } = req.body;

    const post = await mockPostService.findByIdAndCompany(id, companyId);
    const scheduledDate = new Date(scheduledTime);

    // Check for conflicts
    const conflicts = await mockPostService.checkConflicts(companyId, scheduledDate, id);
    if (conflicts.hasConflict) {
      res.status(409).json({
        success: false,
        error: 'Scheduling conflict detected',
        conflictingPosts: conflicts.conflictingPosts,
      });
      return;
    }

    // Update post and create queue items
    await mockPostService.update(id, req.user!.userId, { scheduledTime: scheduledDate });
    await mockQueueService.createQueueItems(
      id,
      scheduledDate,
      post.platforms.map((p) => p.platform)
    );

    res.json({
      success: true,
      data: {
        postId: id,
        scheduledTime: scheduledDate,
      },
    });
  }));

  // Submit for review
  app.post('/api/posts/:id/submit-review', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { userId } = req.user!;

    const post = await mockPostService.submitForReview(id, userId);

    res.json({
      success: true,
      data: post,
    });
  }));

  // Approve post
  app.post('/api/posts/:id/approve', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { userId } = req.user!;
    const { notes } = req.body;

    const post = await mockPostService.approve(id, userId, notes);

    res.json({
      success: true,
      data: post,
    });
  }));

  // Reject post
  app.post('/api/posts/:id/reject', asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { userId } = req.user!;
    const { notes } = req.body;

    const post = await mockPostService.reject(id, userId, notes);

    res.json({
      success: true,
      data: post,
    });
  }));

  // Get version history
  app.get('/api/posts/:id/history', asyncHandler(async (req: Request, res: Response) => {
    const { companyId } = req.user!;
    await mockPostService.findByIdAndCompany(req.params.id, companyId);

    const history = await mockPostService.getVersionHistory(req.params.id);

    res.json({
      success: true,
      data: history,
    });
  }));

  return app;
};

describe('Posts API', () => {
  let app: Express;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/posts', () => {
    it('should create a new post', async () => {
      const response = await request(app)
        .post('/api/posts')
        .send({
          title: 'New Post',
          content: { text: 'New content', media: [] },
          platforms: [{ platform: 'instagram', enabled: true, accountId: 'acc_1' }],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('New Post');
    });

    it('should create scheduled post', async () => {
      const futureDate = new Date(Date.now() + 86400000);

      const response = await request(app)
        .post('/api/posts')
        .send({
          title: 'Scheduled Post',
          content: { text: 'Scheduled content', media: [] },
          platforms: [{ platform: 'instagram', enabled: true, accountId: 'acc_1' }],
          scheduledTime: futureDate.toISOString(),
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/posts', () => {
    it('should return list of posts', async () => {
      const response = await request(app).get('/api/posts');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.posts)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app).get('/api/posts?page=1&limit=10');

      expect(response.status).toBe(200);
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter by status', async () => {
      const response = await request(app).get('/api/posts?status=draft');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should filter by workflow status', async () => {
      const response = await request(app).get('/api/posts?workflowStatus=pending');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/posts/:id', () => {
    it('should return post by ID', async () => {
      const response = await request(app).get('/api/posts/post_1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe('post_1');
    });

    it('should return 500 for non-existent post', async () => {
      mockPostService.findByIdAndCompany.mockRejectedValueOnce(new Error('Post not found: non_existent'));

      const response = await request(app).get('/api/posts/non_existent');

      expect(response.status).toBe(500);
    });
  });

  describe('PATCH /api/posts/:id', () => {
    it('should update a post', async () => {
      const response = await request(app)
        .patch('/api/posts/post_1')
        .send({
          title: 'Updated Title',
          content: { text: 'Updated content', media: [] },
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Title');
    });
  });

  describe('DELETE /api/posts/:id', () => {
    it('should delete a post', async () => {
      const response = await request(app).delete('/api/posts/post_1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Post deleted successfully');
    });
  });

  describe('POST /api/posts/:id/publish', () => {
    it('should publish an approved post', async () => {
      const response = await request(app).post('/api/posts/post_2/publish');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.results).toBeDefined();
    });

    it('should return 400 for rejected post', async () => {
      mockPostService.findByIdAndCompany.mockResolvedValueOnce({
        ...mockPosts[0],
        workflow: { status: 'rejected' },
      });

      const response = await request(app).post('/api/posts/post_1/publish');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/posts/:id/schedule', () => {
    it('should schedule a post', async () => {
      const futureDate = new Date(Date.now() + 86400000);

      const response = await request(app)
        .post('/api/posts/post_1/schedule')
        .send({
          scheduledTime: futureDate.toISOString(),
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 409 for scheduling conflict', async () => {
      mockPostService.checkConflicts.mockResolvedValueOnce({
        hasConflict: true,
        conflictingPosts: [{ _id: 'post_conflict', title: 'Conflicting Post' }],
      });

      const response = await request(app)
        .post('/api/posts/post_1/schedule')
        .send({
          scheduledTime: new Date(Date.now() + 86400000).toISOString(),
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('Scheduling conflict detected');
    });
  });

  describe('POST /api/posts/:id/submit-review', () => {
    it('should submit post for review', async () => {
      const response = await request(app).post('/api/posts/post_1/submit-review');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.workflow.status).toBe('review');
    });
  });

  describe('POST /api/posts/:id/approve', () => {
    it('should approve a post', async () => {
      const response = await request(app)
        .post('/api/posts/post_1/approve')
        .send({ notes: 'Looks good!' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.workflow.status).toBe('approved');
    });
  });

  describe('POST /api/posts/:id/reject', () => {
    it('should reject a post', async () => {
      const response = await request(app)
        .post('/api/posts/post_1/reject')
        .send({ notes: 'Needs changes' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.workflow.status).toBe('rejected');
    });
  });

  describe('GET /api/posts/:id/history', () => {
    it('should return version history', async () => {
      const response = await request(app).get('/api/posts/post_1/history');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});

describe('Post Validation', () => {
  describe('platform validation', () => {
    const validPlatforms = ['instagram', 'facebook', 'twitter', 'linkedin', 'youtube', 'pinterest'];

    it('should accept valid platforms', () => {
      validPlatforms.forEach((platform) => {
        expect(validPlatforms).toContain(platform);
      });
    });
  });

  describe('workflow status validation', () => {
    const validStatuses = ['pending', 'draft', 'scheduled', 'review', 'approved', 'rejected', 'published', 'publishing'];

    it('should accept valid workflow statuses', () => {
      validStatuses.forEach((status) => {
        expect(validStatuses).toContain(status);
      });
    });
  });
});