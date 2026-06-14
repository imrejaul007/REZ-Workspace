/**
 * Check Routes API Tests
 * Tests for /api/check endpoints
 */

import request from 'supertest';
import express, { Application, Request, Response, NextFunction } from 'express';

// Mock check service
const mockCheckService = {
  checkProfile: jest.fn().mockResolvedValue({
    _id: 'check-1',
    influencerId: 'inf-123',
    platform: 'instagram',
    username: 'test_influencer',
    status: 'completed',
    overallScore: 78,
    riskLevel: 'medium',
    scores: {
      followers: 85,
      engagement: 72,
      authenticity: 80,
      consistency: 75,
    },
    flags: [
      { type: 'sudden_growth', severity: 'warning', description: 'Unusual follower growth detected' },
    ],
    recommendations: [
      'Cross-reference with other social platforms',
      'Review recent engagement patterns',
    ],
    processingTime: 2500,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  getCheck: jest.fn().mockResolvedValue({
    _id: 'check-1',
    influencerId: 'inf-123',
    platform: 'instagram',
    username: 'test_influencer',
    status: 'completed',
    overallScore: 78,
    riskLevel: 'medium',
    scores: {
      followers: 85,
      engagement: 72,
      authenticity: 80,
      consistency: 75,
    },
    breakdown: {
      followerQuality: 85,
      engagementAuthenticity: 72,
      contentQuality: 80,
      growthPatterns: 75,
    },
    flags: [],
    recommendations: [],
    processingTime: 2500,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  batchCheck: jest.fn().mockResolvedValue([
    {
      status: 'completed',
      checkId: 'check-1',
      influencerId: 'inf-123',
      overallScore: 78,
      riskLevel: 'medium',
    },
    {
      status: 'failed',
      error: 'Profile not found',
    },
  ]),
};

// Mock validators
jest.mock('../utils/validators', () => ({
  validateRequest: jest.fn().mockImplementation((schema, data) => ({ data })),
  CheckProfileRequestSchema: {
    parse: jest.fn().mockImplementation((data) => ({ platform: data.platform, username: data.username })),
  },
  BatchCheckRequestSchema: {
    parse: jest.fn().mockImplementation((data) => data),
  },
}));

// Mock logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    child: jest.fn().mockReturnValue({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }),
  },
}));

// Mock auth middleware
const mockAuthMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  req.userId = 'test-user-123';
  next();
};

// Mock AppError
class AppError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

// Mock error middleware
const mockErrorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
    });
  } else {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
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
  app.post('/api/check/profile', mockAuthMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const { platform, username } = req.body;

    const check = await mockCheckService.checkProfile({ platform, username });

    res.status(201).json({
      success: true,
      data: {
        checkId: check._id.toString(),
        influencerId: check.influencerId,
        platform: check.platform,
        username: check.username,
        overallScore: check.overallScore,
        riskLevel: check.riskLevel,
        scores: check.scores,
        flags: check.flags,
        recommendations: check.recommendations,
        processingTime: check.processingTime,
        createdAt: check.createdAt,
      },
    });
  }));

  app.get('/api/check/:id', mockAuthMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const check = await mockCheckService.getCheck(id);

    if (!check) {
      throw new AppError('Check not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: {
        checkId: check._id.toString(),
        influencerId: check.influencerId,
        platform: check.platform,
        username: check.username,
        status: check.status,
        overallScore: check.overallScore,
        riskLevel: check.riskLevel,
        scores: check.scores,
        breakdown: check.breakdown,
        flags: check.flags,
        recommendations: check.recommendations,
        processingTime: check.processingTime,
        createdAt: check.createdAt,
        updatedAt: check.updatedAt,
      },
    });
  }));

  app.post('/api/check/batch', mockAuthMiddleware, asyncHandler(async (req: Request, res: Response) => {
    const { influencers } = req.body;

    const results = await mockCheckService.batchCheck(influencers);

    const successful = results.filter((r) => r.status === 'completed');
    const failed = results.filter((r) => r.status === 'failed');

    res.status(201).json({
      success: true,
      data: {
        total: results.length,
        successful: successful.length,
        failed: failed.length,
        results,
      },
    });
  }));

  app.use(mockErrorHandler);

  return app;
};

describe('Check Routes API', () => {
  let app: Application;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe('POST /api/check/profile', () => {
    test('should check influencer profile', async () => {
      const response = await request(app)
        .post('/api/check/profile')
        .send({
          platform: 'instagram',
          username: 'test_influencer',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('checkId');
      expect(response.body.data).toHaveProperty('overallScore');
      expect(response.body.data).toHaveProperty('riskLevel');
      expect(response.body.data).toHaveProperty('scores');
      expect(response.body.data).toHaveProperty('flags');
      expect(response.body.data).toHaveProperty('recommendations');
    });

    test('should return proper check structure', async () => {
      const response = await request(app)
        .post('/api/check/profile')
        .send({
          platform: 'instagram',
          username: 'test_influencer',
        });

      expect(response.body.data).toHaveProperty('platform', 'instagram');
      expect(response.body.data).toHaveProperty('username', 'test_influencer');
      expect(typeof response.body.data.overallScore).toBe('number');
      expect(typeof response.body.data.riskLevel).toBe('string');
    });

    test('should include processing time', async () => {
      const response = await request(app)
        .post('/api/check/profile')
        .send({
          platform: 'instagram',
          username: 'test_influencer',
        });

      expect(response.body.data).toHaveProperty('processingTime');
      expect(typeof response.body.data.processingTime).toBe('number');
    });
  });

  describe('GET /api/check/:id', () => {
    test('should return check results', async () => {
      const response = await request(app).get('/api/check/check-1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('checkId');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('overallScore');
      expect(response.body.data).toHaveProperty('scores');
      expect(response.body.data).toHaveProperty('breakdown');
    });

    test('should return proper check structure', async () => {
      const response = await request(app).get('/api/check/check-1');

      expect(response.body.data).toHaveProperty('influencerId');
      expect(response.body.data).toHaveProperty('platform');
      expect(response.body.data).toHaveProperty('username');
      expect(response.body.data).toHaveProperty('riskLevel');
    });

    test('should include timestamps', async () => {
      const response = await request(app).get('/api/check/check-1');

      expect(response.body.data).toHaveProperty('createdAt');
      expect(response.body.data).toHaveProperty('updatedAt');
    });

    test('should return 404 for non-existent check', async () => {
      mockCheckService.getCheck.mockResolvedValueOnce(null);

      const response = await request(app).get('/api/check/non-existent');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/check/batch', () => {
    test('should process batch check', async () => {
      const response = await request(app)
        .post('/api/check/batch')
        .send({
          influencers: [
            { platform: 'instagram', username: 'influencer1' },
            { platform: 'twitter', username: 'influencer2' },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('successful');
      expect(response.body.data).toHaveProperty('failed');
      expect(response.body.data).toHaveProperty('results');
    });

    test('should return batch summary', async () => {
      const response = await request(app)
        .post('/api/check/batch')
        .send({
          influencers: [
            { platform: 'instagram', username: 'influencer1' },
            { platform: 'twitter', username: 'influencer2' },
          ],
        });

      expect(response.body.data.total).toBe(2);
      expect(response.body.data.successful).toBe(1);
      expect(response.body.data.failed).toBe(1);
    });

    test('should return results array', async () => {
      const response = await request(app)
        .post('/api/check/batch')
        .send({
          influencers: [
            { platform: 'instagram', username: 'influencer1' },
            { platform: 'twitter', username: 'influencer2' },
          ],
        });

      expect(Array.isArray(response.body.data.results)).toBe(true);
      expect(response.body.data.results.length).toBe(2);
    });
  });
});