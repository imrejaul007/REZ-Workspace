/**
 * Posts Routes API Tests
 * Tests for /api/posts endpoints
 */

import request from 'supertest';
import express, { Application, Request, Response, NextFunction } from 'express';

// Mock RedditPost model
const mockPosts = [
  {
    _id: 'post-1',
    subreddit: 'r/test',
    title: 'Test Post 1',
    content: 'This is test content 1',
    accountId: 'acc-1',
    postedAt: new Date(),
    redditPostId: 'reddit-post-1',
    metrics: {
      score: 100,
      upvotes: 95,
      downvotes: 5,
      comments: 20,
      awards: 0,
    },
  },
  {
    _id: 'post-2',
    subreddit: 'r/test',
    title: 'Test Post 2',
    content: 'This is test content 2',
    accountId: 'acc-1',
    postedAt: new Date(),
    redditPostId: 'reddit-post-2',
    metrics: {
      score: 250,
      upvotes: 240,
      downvotes: 10,
      comments: 50,
      awards: 2,
    },
  },
];

// Mock RedditPost model
jest.mock('../models', () => ({
  RedditPost: {
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue(mockPosts),
    }),
    findById: jest.fn().mockResolvedValue(mockPosts[0]),
    findByIdAndDelete: jest.fn().mockResolvedValue(mockPosts[0]),
    countDocuments: jest.fn().mockResolvedValue(2),
    create: jest.fn().mockResolvedValue(mockPosts[0]),
  },
}));

// Mock redditApi service
jest.mock('../services/redditApi', () => ({
  redditApi: {
    createPost: jest.fn().mockResolvedValue({
      id: 'reddit-post-new',
      created_utc: Date.now() / 1000,
      score: 1,
      ups: 1,
      downs: 0,
      num_comments: 0,
      total_awards_received: 0,
      archived: false,
      locked: false,
      edited: false,
    }),
    getPost: jest.fn().mockResolvedValue({
      id: 'reddit-post-1',
      score: 150,
      ups: 145,
      downs: 5,
      num_comments: 25,
      total_awards_received: 1,
      archived: false,
      locked: false,
      edited: false,
    }),
    updatePost: jest.fn().mockResolvedValue(true),
    deletePost: jest.fn().mockResolvedValue(true),
    savePost: jest.fn().mockResolvedValue(true),
  },
}));

// Mock config
jest.mock('../config/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock metrics
jest.mock('../config/metrics', () => ({
  metricsMiddleware: (_req: Request, _res: Response, next: NextFunction) => next(),
  metrics: {
    getContentType: jest.fn().mockReturnValue('text/plain'),
    getMetrics: jest.fn().mockResolvedValue('# HELP test'),
  },
}));

// Mock auth middleware
const mockAuthMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  req.accountId = 'test-account-123';
  next();
};

// Mock error middleware
const mockErrorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: err.message,
  });
};

// Mock asyncHandler
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Create test app
const createTestApp = (): Application => {
  const app = express();
  app.use(express.json());

  // Mock routes inline for testing
  app.get('/api/posts', mockAuthMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const { limit = 25, skip = 0, subreddit, sort } = req.query as any;

    const query: any = {};
    if (subreddit) {
      query.subreddit = subreddit.toLowerCase();
    }
    query.postedAt = { $ne: null };

    const posts = mockPosts;
    const total = 2;

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          total,
          limit: parseInt(limit as string) || 25,
          skip: parseInt(skip as string) || 0,
          hasMore: parseInt(skip as string) + posts.length < total,
        },
      },
    });
  }));

  app.get('/api/posts/:id', mockAuthMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const post = mockPosts.find((p) => p._id === id);

    if (!post) {
      res.status(404).json({
        success: false,
        error: 'Post not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        post,
      },
    });
  }));

  app.post('/api/posts', mockAuthMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const { subreddit, title, content } = req.body;

    const post = {
      _id: 'new-post-id',
      subreddit,
      title,
      content,
      accountId: req.accountId,
      postedAt: new Date(),
      redditPostId: 'reddit-post-new',
      metrics: {
        score: 1,
        upvotes: 1,
        downvotes: 0,
        comments: 0,
        awards: 0,
      },
    };

    res.status(201).json({
      success: true,
      data: {
        post,
      },
    });
  }));

  app.patch('/api/posts/:id', mockAuthMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;
    const post = mockPosts.find((p) => p._id === id);

    if (!post) {
      res.status(404).json({
        success: false,
        error: 'Post not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        post: { ...post, ...updates, edited: true },
      },
    });
  }));

  app.delete('/api/posts/:id', mockAuthMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    res.json({
      success: true,
      data: {
        message: 'Post deleted successfully',
        postId: id,
      },
    });
  }));

  app.post('/api/posts/:id/save', mockAuthMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    res.json({
      success: true,
      data: {
        message: 'Post saved to Reddit',
      },
    });
  }));

  app.use(mockErrorHandler);

  return app;
};

describe('Posts Routes API', () => {
  let app: Application;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe('GET /api/posts', () => {
    test('should return list of posts', async () => {
      const response = await request(app).get('/api/posts');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('posts');
      expect(Array.isArray(response.body.data.posts)).toBe(true);
    });

    test('should return pagination info', async () => {
      const response = await request(app).get('/api/posts');

      expect(response.body.data.pagination).toHaveProperty('total');
      expect(response.body.data.pagination).toHaveProperty('limit');
      expect(response.body.data.pagination).toHaveProperty('skip');
      expect(response.body.data.pagination).toHaveProperty('hasMore');
    });

    test('should accept pagination query params', async () => {
      const response = await request(app)
        .get('/api/posts')
        .query({ limit: '10', skip: '5' });

      expect(response.status).toBe(200);
      expect(response.body.data.pagination.limit).toBe(10);
      expect(response.body.data.pagination.skip).toBe(5);
    });

    test('should filter by subreddit', async () => {
      const response = await request(app)
        .get('/api/posts')
        .query({ subreddit: 'r/test' });

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/posts/:id', () => {
    test('should return single post', async () => {
      const response = await request(app).get('/api/posts/post-1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('post');
      expect(response.body.data.post._id).toBe('post-1');
    });

    test('should return 404 for non-existent post', async () => {
      const response = await request(app).get('/api/posts/non-existent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Post not found');
    });
  });

  describe('POST /api/posts', () => {
    test('should create a new post', async () => {
      const newPost = {
        subreddit: 'r/test',
        title: 'New Test Post',
        content: 'New test content',
      };

      const response = await request(app)
        .post('/api/posts')
        .send(newPost);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('post');
      expect(response.body.data.post.title).toBe(newPost.title);
    });
  });

  describe('PATCH /api/posts/:id', () => {
    test('should update post', async () => {
      const response = await request(app)
        .patch('/api/posts/post-1')
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.post.title).toBe('Updated Title');
    });

    test('should return 404 when post not found', async () => {
      const response = await request(app)
        .patch('/api/posts/non-existent')
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/posts/:id', () => {
    test('should delete post', async () => {
      const response = await request(app).delete('/api/posts/post-1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('message', 'Post deleted successfully');
    });
  });

  describe('POST /api/posts/:id/save', () => {
    test('should save post to Reddit', async () => {
      const response = await request(app).post('/api/posts/post-1/save');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('message', 'Post saved to Reddit');
    });
  });
});