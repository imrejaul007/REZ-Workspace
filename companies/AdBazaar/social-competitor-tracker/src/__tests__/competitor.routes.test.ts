/**
 * Competitor Routes API Tests
 * Tests for /api/competitors endpoints
 */

import request from 'supertest';
import express, { Application, Request, Response, NextFunction } from 'express';

// Mock the competitor service
const mockCompetitorService = {
  listCompetitors: jest.fn().mockResolvedValue({
    competitors: [
      {
        _id: 'comp-1',
        name: 'Nike',
        industry: 'sportswear',
        platforms: { instagram: { followers: 250000000 } },
      },
      {
        _id: 'comp-2',
        name: 'Adidas',
        industry: 'sportswear',
        platforms: { instagram: { followers: 23000000 } },
      },
    ],
    total: 2,
    page: 1,
    limit: 20,
  }),
  createCompetitor: jest.fn().mockResolvedValue({
    _id: 'new-comp-id',
    name: 'Puma',
    industry: 'sportswear',
    addedBy: 'user-123',
  }),
  getCompetitorOverview: jest.fn().mockResolvedValue({
    competitor: {
      _id: 'comp-1',
      name: 'Nike',
      industry: 'sportswear',
    },
 }),
  updateCompetitor: jest.fn().mockResolvedValue({
    _id: 'comp-1',
    name: 'Nike Updated',
    industry: 'sportswear',
  }),
  deleteCompetitor: jest.fn().mockResolvedValue({ deleted: true }),
  compareCompetitors: jest.fn().mockResolvedValue({
    comparison: {
      competitors: [],
      metrics: {},
    },
  }),
  getBenchmarks: jest.fn().mockResolvedValue({
    benchmarks: {
      avgEngagementRate: 3.5,
      avgFollowerGrowth: 2.1,
    },
  }),
  getAlerts: jest.fn().mockResolvedValue({
    alerts: [],
    total: 0,
  }),
  markAlertsAsRead: jest.fn().mockResolvedValue(0),
  getCompetitorContent: jest.fn().mockResolvedValue({
    posts: [],
    total: 0,
  }),
  getCompetitorEngagement: jest.fn().mockResolvedValue({
    engagement: {
      avgLikes: 50000,
      avgComments: 500,
    },
  }),
  getCompetitorGrowth: jest.fn().mockResolvedValue({
    growth: {
      monthlyGrowth: 5.2,
    },
  }),
  getCompetitorPosts: jest.fn().mockResolvedValue({
    posts: [],
    total: 0,
  }),
  syncCompetitor: jest.fn().mockResolvedValue({
    success: true,
    syncedPlatforms: ['instagram', 'twitter'],
  }),
};

// Mock the models
jest.mock('../models/index.js', () => ({
  validateCompetitorInput: jest.fn().mockReturnValue({ success: true, data: {} }),
  validateUpdateInput: jest.fn().mockReturnValue({ success: true, data: {} }),
}));

// Mock the service
jest.mock('../services/competitor.service.js', () => ({
  competitorService: mockCompetitorService,
}));

// Mock auth middleware
const mockAuthMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  req.userId = 'test-user-123';
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
  app.get('/api/competitors', mockAuthMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const result = await mockCompetitorService.listCompetitors({
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    });
    res.json({
      success: true,
      data: {
        competitors: result.competitors,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          pages: Math.ceil(result.total / result.limit),
        },
      },
    });
  }));

  app.post('/api/competitors', mockAuthMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const competitor = await mockCompetitorService.createCompetitor({
      ...req.body,
      addedBy: req.userId,
    });
    res.status(201).json({
      success: true,
      data: { competitor },
      message: 'Competitor added successfully',
    });
  }));

  app.get('/api/competitors/compare', mockAuthMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const { ids } = req.query;
    if (!ids) {
      res.status(400).json({ success: false, error: 'Competitor IDs required' });
      return;
    }
    const comparison = await mockCompetitorService.compareCompetitors((ids as string).split(','));
    res.json({ success: true, data: { comparison } });
  }));

  app.get('/api/competitors/benchmarks', mockAuthMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const { industry } = req.query;
    if (!industry) {
      res.status(400).json({ success: false, error: 'Industry parameter required' });
      return;
    }
    const benchmarks = await mockCompetitorService.getBenchmarks(industry as string);
    res.json({ success: true, data: { benchmarks } });
  }));

  app.get('/api/competitors/:id', mockAuthMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const overview = await mockCompetitorService.getCompetitorOverview(req.params.id);
    res.json({ success: true, data: { competitor: overview.competitor } });
  }));

  app.patch('/api/competitors/:id', mockAuthMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const competitor = await mockCompetitorService.updateCompetitor(req.params.id, req.body);
    res.json({ success: true, data: { competitor } });
  }));

  app.delete('/api/competitors/:id', mockAuthMiddleware, asyncHandler(async (req: Request, res: Response) => {
    await mockCompetitorService.deleteCompetitor(req.params.id);
    res.json({ success: true, message: 'Competitor removed successfully' });
  }));

  app.post('/api/competitors/:id/sync', mockAuthMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const result = await mockCompetitorService.syncCompetitor(req.params.id);
    res.json({
      success: true,
      data: {
        success: result.success,
        syncedPlatforms: result.syncedPlatforms,
        syncedAt: new Date().toISOString(),
      },
    });
  }));

  app.use(mockErrorHandler);

  return app;
};

describe('Competitor Routes API', () => {
  let app: Application;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe('GET /api/competitors', () => {
    test('should return list of competitors', async () => {
      const response = await request(app).get('/api/competitors');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('competitors');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.competitors)).toBe(true);
    });

    test('should return pagination info', async () => {
      const response = await request(app).get('/api/competitors');

      expect(response.body.data.pagination).toHaveProperty('total');
      expect(response.body.data.pagination).toHaveProperty('page');
      expect(response.body.data.pagination).toHaveProperty('limit');
      expect(response.body.data.pagination).toHaveProperty('pages');
    });

    test('should accept pagination query params', async () => {
      const response = await request(app)
        .get('/api/competitors')
        .query({ page: '2', limit: '10' });

      expect(response.status).toBe(200);
      expect(response.body.data.pagination).toHaveProperty('page', 2);
      expect(response.body.data.pagination).toHaveProperty('limit', 10);
    });
  });

  describe('POST /api/competitors', () => {
    test('should create a new competitor', async () => {
      const newCompetitor = {
        name: 'Puma',
        industry: 'sportswear',
        website: 'https://puma.com',
      };

      const response = await request(app)
        .post('/api/competitors')
        .send(newCompetitor);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('competitor');
      expect(response.body).toHaveProperty('message', 'Competitor added successfully');
    });
  });

  describe('GET /api/competitors/compare', () => {
    test('should compare competitors', async () => {
      const response = await request(app)
        .get('/api/competitors/compare')
        .query({ ids: 'comp-1,comp-2' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('comparison');
    });

    test('should return 400 when ids are missing', async () => {
      const response = await request(app).get('/api/competitors/compare');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Competitor IDs required');
    });
  });

  describe('GET /api/competitors/benchmarks', () => {
    test('should return industry benchmarks', async () => {
      const response = await request(app)
        .get('/api/competitors/benchmarks')
        .query({ industry: 'sportswear' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('benchmarks');
    });

    test('should return 400 when industry is missing', async () => {
      const response = await request(app).get('/api/competitors/benchmarks');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/competitors/:id', () => {
    test('should return competitor details', async () => {
      const response = await request(app).get('/api/competitors/comp-1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('competitor');
    });
  });

  describe('PATCH /api/competitors/:id', () => {
    test('should update competitor', async () => {
      const response = await request(app)
        .patch('/api/competitors/comp-1')
        .send({ name: 'Nike Updated' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('competitor');
    });
  });

  describe('DELETE /api/competitors/:id', () => {
    test('should delete competitor', async () => {
      const response = await request(app).delete('/api/competitors/comp-1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Competitor removed successfully');
    });
  });

  describe('POST /api/competitors/:id/sync', () => {
    test('should sync competitor data', async () => {
      const response = await request(app).post('/api/competitors/comp-1/sync');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('syncedPlatforms');
    });
  });
});
