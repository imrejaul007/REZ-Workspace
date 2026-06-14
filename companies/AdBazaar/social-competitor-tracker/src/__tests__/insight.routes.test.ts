/**
 * Insight Routes API Tests
 * Tests for /api/insights endpoints
 */

import request from 'supertest';
import express, { Application, Request, Response, NextFunction } from 'express';

// Mock the insight service
const mockInsightService = {
  getBestContent: jest.fn().mockResolvedValue([
    {
      contentId: 'content-1',
      platform: 'instagram',
      engagementRate: 5.2,
      likes: 50000,
      comments: 1200,
    },
    {
      contentId: 'content-2',
      platform: 'instagram',
      engagementRate: 4.8,
      likes: 45000,
      comments: 980,
    },
  ]),
  getStrategyInsights: jest.fn().mockResolvedValue([
    {
      id: 'insight-1',
      category: 'content',
      title: 'Video content performs better',
      description: 'Competitors using video see 2x engagement',
      priority: 'high',
    },
    {
      id: 'insight-2',
      category: 'growth',
      title: 'Follower growth accelerating',
      description: 'Industry avg growth increased 15%',
      priority: 'medium',
    },
    {
      id: 'insight-3',
      category: 'engagement',
      title: 'Stories usage increasing',
      description: 'Stories now used by 80% of competitors',
      priority: 'low',
    },
  ]),
  getCompetitorAnalysis: jest.fn().mockResolvedValue({
    competitorId: 'comp-1',
    strengths: ['Strong brand awareness', 'Large following'],
    weaknesses: ['Lower engagement rate', 'Less video content'],
    opportunities: ['Reels growth', 'Partnership potential'],
    threats: ['Fast-growing competitors', 'Algorithm changes'],
  }),
};

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
  app.get('/api/insights/best-content', mockAuthMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const bestContent = await mockInsightService.getBestContent({
      competitorIds: req.query.competitorIds ? (req.query.competitorIds as string).split(',') : undefined,
      platform: req.query.platform as string,
      days: req.query.days ? parseInt(req.query.days as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      industry: req.query.industry as string,
    });

    res.json({
      success: true,
      data: {
        bestContent,
        count: bestContent.length,
      },
    });
  }));

  app.get('/api/insights/strategy', mockAuthMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const insights = await mockInsightService.getStrategyInsights({
      competitorIds: req.query.competitorIds ? (req.query.competitorIds as string).split(',') : undefined,
      industry: req.query.industry as string,
      days: req.query.days ? parseInt(req.query.days as string) : undefined,
    });

    const groupedInsights = insights.reduce(
      (acc, insight) => {
        if (!acc[insight.category]) {
          acc[insight.category] = [];
        }
        acc[insight.category].push(insight);
        return acc;
      },
      {} as Record<string, typeof insights>
    );

    res.json({
      success: true,
      data: {
        insights,
        groupedByCategory: groupedInsights,
        summary: {
          total: insights.length,
          highPriority: insights.filter((i) => i.priority === 'high').length,
          mediumPriority: insights.filter((i) => i.priority === 'medium').length,
          lowPriority: insights.filter((i) => i.priority === 'low').length,
        },
      },
    });
  }));

  app.get('/api/insights/competitor/:id', mockAuthMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const analysis = await mockInsightService.getCompetitorAnalysis(req.params.id);
    res.json({ success: true, data: { analysis } });
  }));

  app.get('/api/insights/trends', mockAuthMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const daysNum = req.query.days ? parseInt(req.query.days as string) : 30;
    const insights = await mockInsightService.getStrategyInsights({
      industry: req.query.industry as string,
      days: daysNum,
    });

    const trendInsights = insights.filter(
      (i) =>
        i.category === 'growth' ||
        i.category === 'engagement' ||
        i.category === 'benchmark'
    );

    res.json({
      success: true,
      data: {
        trends: trendInsights,
        period: daysNum,
        generatedAt: new Date().toISOString(),
      },
    });
  }));

  app.use(mockErrorHandler);

  return app;
};

describe('Insight Routes API', () => {
  let app: Application;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe('GET /api/insights/best-content', () => {
    test('should return best performing content', async () => {
      const response = await request(app).get('/api/insights/best-content');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('bestContent');
      expect(Array.isArray(response.body.data.bestContent)).toBe(true);
    });

    test('should return content count', async () => {
      const response = await request(app).get('/api/insights/best-content');

      expect(response.body.data).toHaveProperty('count');
      expect(typeof response.body.data.count).toBe('number');
    });

    test('should accept platform filter', async () => {
      const response = await request(app)
        .get('/api/insights/best-content')
        .query({ platform: 'instagram' });

      expect(response.status).toBe(200);
    });

    test('should accept days filter', async () => {
      const response = await request(app)
        .get('/api/insights/best-content')
        .query({ days: '7' });

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/insights/strategy', () => {
    test('should return strategy insights', async () => {
      const response = await request(app).get('/api/insights/strategy');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('insights');
      expect(Array.isArray(response.body.data.insights)).toBe(true);
    });

    test('should group insights by category', async () => {
      const response = await request(app).get('/api/insights/strategy');

      expect(response.body.data).toHaveProperty('groupedByCategory');
      expect(typeof response.body.data.groupedByCategory).toBe('object');
    });

    test('should return summary with priority counts', async () => {
      const response = await request(app).get('/api/insights/strategy');

      expect(response.body.data.summary).toHaveProperty('total');
      expect(response.body.data.summary).toHaveProperty('highPriority');
      expect(response.body.data.summary).toHaveProperty('mediumPriority');
      expect(response.body.data.summary).toHaveProperty('lowPriority');
    });

    test('should accept competitor IDs filter', async () => {
      const response = await request(app)
        .get('/api/insights/strategy')
        .query({ competitorIds: 'comp-1,comp-2' });

      expect(response.status).toBe(200);
    });

    test('should accept industry filter', async () => {
      const response = await request(app)
        .get('/api/insights/strategy')
        .query({ industry: 'sportswear' });

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/insights/competitor/:id', () => {
    test('should return competitor SWOT analysis', async () => {
      const response = await request(app).get('/api/insights/competitor/comp-1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('analysis');
      expect(response.body.data.analysis).toHaveProperty('competitorId');
      expect(response.body.data.analysis).toHaveProperty('strengths');
      expect(response.body.data.analysis).toHaveProperty('weaknesses');
      expect(response.body.data.analysis).toHaveProperty('opportunities');
      expect(response.body.data.analysis).toHaveProperty('threats');
    });
  });

  describe('GET /api/insights/trends', () => {
    test('should return trend insights', async () => {
      const response = await request(app).get('/api/insights/trends');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('trends');
      expect(Array.isArray(response.body.data.trends)).toBe(true);
    });

    test('should include period in response', async () => {
      const response = await request(app).get('/api/insights/trends');

      expect(response.body.data).toHaveProperty('period');
      expect(typeof response.body.data.period).toBe('number');
    });

    test('should include generated timestamp', async () => {
      const response = await request(app).get('/api/insights/trends');

      expect(response.body.data).toHaveProperty('generatedAt');
    });

    test('should accept custom days parameter', async () => {
      const response = await request(app)
        .get('/api/insights/trends')
        .query({ days: '14' });

      expect(response.status).toBe(200);
      expect(response.body.data.period).toBe(14);
    });
  });
});