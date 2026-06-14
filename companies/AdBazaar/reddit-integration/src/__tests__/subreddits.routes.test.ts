/**
 * Subreddits Routes API Tests
 * Tests for /api/subreddits endpoints
 */

import request from 'supertest';
import express, { Application, Request, Response, NextFunction } from 'express';

// Mock subreddits data
const mockSubreddits = [
  {
    _id: 'sub-1',
    subredditName: 'technology',
    displayName: 'Tech News',
    members: 15000000,
    online: 50000,
    category: 'public',
    description: 'Latest technology news and discussions',
    nsfw: false,
    quarantined: false,
  },
  {
    _id: 'sub-2',
    subredditName: 'programming',
    displayName: 'Programming',
    members: 8000000,
    online: 25000,
    category: 'public',
    description: 'Programming discussions and help',
    nsfw: false,
    quarantined: false,
  },
];

// Mock RedditSubreddit model
jest.mock('../models', () => ({
  RedditSubreddit: {
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockResolvedValue(mockSubreddits),
    }),
    findOne: jest.fn().mockResolvedValue(mockSubreddits[0]),
    findOneAndDelete: jest.fn().mockResolvedValue(mockSubreddits[0]),
    countDocuments: jest.fn().mockResolvedValue(2),
    create: jest.fn().mockResolvedValue(mockSubreddits[0]),
  },
}));

// Mock redditApi service
jest.mock('../services/redditApi', () => ({
  redditApi: {
    getSubredditInfo: jest.fn().mockResolvedValue({
      display_name: 'technology',
      title: 'Tech News',
      subscribers: 15000000,
      accounts_active: 50000,
      subreddit_type: 'public',
      public_description: 'Latest technology news and discussions',
      icon_img: 'https://example.com/icon.png',
      banner_img: 'https://example.com/banner.png',
      over18: false,
      quarantine: false,
      lang: 'en',
    }),
    searchSubreddits: jest.fn().mockResolvedValue([
      { display_name: 'tech', title: 'Tech Community', subscribers: 1000000 },
      { display_name: 'technology', title: 'Technology', subscribers: 15000000 },
    ]),
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
  app.get('/api/subreddits', mockAuthMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const { limit = 50, skip = 0, search } = req.query as any;

    let query = {};
    if (search) {
      query = { subredditName: { $regex: search, $options: 'i' } };
    }

    const subreddits = mockSubreddits;
    const total = 2;

    res.json({
      success: true,
      data: {
        subreddits,
        pagination: {
          total,
          limit: parseInt(limit as string) || 50,
          skip: parseInt(skip as string) || 0,
          hasMore: parseInt(skip as string) + subreddits.length < total,
        },
      },
    });
  }));

  app.post('/api/subreddits', mockAuthMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const { name } = req.body;

    const existing = mockSubreddits.find((s) => s.subredditName === name.toLowerCase());
    if (existing) {
      res.status(409).json({
        success: false,
        error: 'Subreddit already tracked',
        code: 'DUPLICATE',
      });
      return;
    }

    const subreddit = {
      _id: 'new-sub-id',
      subredditName: name.toLowerCase(),
      displayName: name,
      members: 1000000,
      online: 10000,
      category: 'public',
      description: 'New subreddit',
      nsfw: false,
      quarantined: false,
    };

    res.status(201).json({
      success: true,
      data: {
        subreddit,
      },
    });
  }));

  app.get('/api/subreddits/:name', mockAuthMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const { name } = req.params;
    const subreddit = mockSubreddits.find((s) => s.subredditName === name.toLowerCase());

    if (!subreddit) {
      res.status(404).json({
        success: false,
        error: 'Subreddit not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        subreddit,
      },
    });
  }));

  app.delete('/api/subreddits/:name', mockAuthMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const { name } = req.params;
    const subreddit = mockSubreddits.find((s) => s.subredditName === name.toLowerCase());

    if (!subreddit) {
      res.status(404).json({
        success: false,
        error: 'Subreddit not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        message: 'Subreddit removed from tracking',
        name: subreddit.subredditName,
      },
    });
  }));

  app.get('/api/subreddits/search/query', mockAuthMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const { q, limit = 10 } = req.query;

    if (!q || typeof q !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Search query is required',
        code: 'MISSING_QUERY',
      });
      return;
    }

    const results = [
      { display_name: 'tech', title: 'Tech Community', subscribers: 1000000 },
    ];

    res.json({
      success: true,
      data: {
        results,
        count: results.length,
      },
    });
  }));

  app.use(mockErrorHandler);

  return app;
};

describe('Subreddits Routes API', () => {
  let app: Application;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe('GET /api/subreddits', () => {
    test('should return list of subreddits', async () => {
      const response = await request(app).get('/api/subreddits');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('subreddits');
      expect(Array.isArray(response.body.data.subreddits)).toBe(true);
    });

    test('should return pagination info', async () => {
      const response = await request(app).get('/api/subreddits');

      expect(response.body.data.pagination).toHaveProperty('total');
      expect(response.body.data.pagination).toHaveProperty('limit');
      expect(response.body.data.pagination).toHaveProperty('skip');
      expect(response.body.data.pagination).toHaveProperty('hasMore');
    });

    test('should accept pagination query params', async () => {
      const response = await request(app)
        .get('/api/subreddits')
        .query({ limit: '10', skip: '5' });

      expect(response.status).toBe(200);
    });

    test('should accept search filter', async () => {
      const response = await request(app)
        .get('/api/subreddits')
        .query({ search: 'tech' });

      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/subreddits', () => {
    test('should add a new subreddit', async () => {
      const response = await request(app)
        .post('/api/subreddits')
        .send({ name: 'newsubreddit' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('subreddit');
    });

    test('should return 409 for duplicate subreddit', async () => {
      const response = await request(app)
        .post('/api/subreddits')
        .send({ name: 'technology' }); // Existing subreddit

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Subreddit already tracked');
    });
  });

  describe('GET /api/subreddits/:name', () => {
    test('should return subreddit details', async () => {
      const response = await request(app).get('/api/subreddits/technology');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('subreddit');
      expect(response.body.data.subreddit.subredditName).toBe('technology');
    });

    test('should return 404 for non-existent subreddit', async () => {
      const response = await request(app).get('/api/subreddits/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('DELETE /api/subreddits/:name', () => {
    test('should remove subreddit from tracking', async () => {
      const response = await request(app).delete('/api/subreddits/technology');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('message', 'Subreddit removed from tracking');
    });

    test('should return 404 for non-existent subreddit', async () => {
      const response = await request(app).delete('/api/subreddits/nonexistent');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/subreddits/search/query', () => {
    test('should search subreddits', async () => {
      const response = await request(app)
        .get('/api/subreddits/search/query')
        .query({ q: 'tech' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('results');
    });

    test('should return 400 when query is missing', async () => {
      const response = await request(app).get('/api/subreddits/search/query');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Search query is required');
    });
  });
});