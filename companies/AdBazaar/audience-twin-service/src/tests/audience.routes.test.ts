import request from 'supertest';
import express, { Application } from 'express';
import jwt from 'jsonwebtoken';
import { audienceRoutes } from '../routes';
import { audienceTwinService } from '../services';
import { errorHandler } from '../middleware';

// Mock services
jest.mock('../services', () => ({
  audienceTwinService: {
    createAudienceTwin: jest.fn(),
    getAudienceTwin: jest.fn(),
    getAudienceTwinById: jest.fn(),
    listAudienceTwins: jest.fn(),
    predictBehavior: jest.fn(),
    getSegments: jest.fn(),
    refreshAudienceTwin: jest.fn(),
    deleteAudienceTwin: jest.fn(),
  },
}));

// Mock JWT verification
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

describe('Audience Routes', () => {
  let app: Application;
  const testUser = {
    userId: 'user-123',
    email: 'test@example.com',
    role: 'admin',
  };
  const validToken = 'valid-test-token';

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // Add mock user to request
    app.use((req, _res, next) => {
      (req as { user?: typeof testUser }).user = testUser;
      next();
    });

    app.use('/api/audience', audienceRoutes);
    app.use(errorHandler);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (jwt.verify as jest.Mock).mockReturnValue(testUser);
  });

  describe('POST /api/audience/create', () => {
    it('should create an audience twin', async () => {
      const mockTwin = {
        twinId: 'twin-123',
        name: 'Test Audience',
        category: 'retail',
        size: 100,
        memberUserIds: ['user-1', 'user-2'],
        attributes: {
          interests: ['electronics'],
          intentLikelihood: 0.8,
          channelPreference: 'whatsapp',
          timingPreference: '10:00-14:00',
          lifetimeValue: 5000,
          brandAffinities: {},
        },
        behavioralModel: {
          avgSessionDuration: 300,
          avgPurchaseFrequency: 5,
          avgOrderValue: 500,
          preferredCategories: ['electronics'],
          churnRisk: 0.2,
        },
        qualityScore: 8,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (audienceTwinService.createAudienceTwin as jest.Mock).mockResolvedValue(mockTwin);

      const response = await request(app)
        .post('/api/audience/create')
        .send({
          name: 'Test Audience',
          category: 'retail',
          criteria: {
            interests: ['electronics'],
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.twinId).toBe('twin-123');
    });

    it('should return 400 for invalid request body', async () => {
      const response = await request(app)
        .post('/api/audience/create')
        .send({
          // Missing required fields
          name: '',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/audience/:id', () => {
    it('should get an audience twin by ID', async () => {
      const mockTwin = {
        twinId: 'twin-123',
        name: 'Test Audience',
        category: 'retail',
        size: 100,
      };

      (audienceTwinService.getAudienceTwin as jest.Mock).mockResolvedValue(mockTwin);

      const response = await request(app).get('/api/audience/twin-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.twinId).toBe('twin-123');
    });

    it('should return 404 for non-existent twin', async () => {
      (audienceTwinService.getAudienceTwin as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/api/audience/non-existent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/audience/:id/predict', () => {
    it('should predict behavior', async () => {
      const mockPrediction = {
        action: 'purchase',
        probability: 0.75,
        confidence: 0.8,
        factors: [{ factor: 'intent_likelihood', impact: 0.8 }],
        recommendedChannel: 'whatsapp',
        recommendedTiming: '10:00-14:00',
      };

      (audienceTwinService.getAudienceTwinById as jest.Mock).mockResolvedValue({
        twinId: 'twin-123',
      });
      (audienceTwinService.predictBehavior as jest.Mock).mockResolvedValue(mockPrediction);

      const response = await request(app)
        .post('/api/audience/twin-123/predict')
        .send({ action: 'purchase' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.probability).toBe(0.75);
    });
  });

  describe('GET /api/audience/:id/segments', () => {
    it('should get segment assignments', async () => {
      const mockSegments = [
        {
          segmentId: 'seg-high-value',
          segmentName: 'High Value Customers',
          confidence: 0.9,
          assignedAt: new Date(),
        },
      ];

      (audienceTwinService.getAudienceTwinById as jest.Mock).mockResolvedValue({
        twinId: 'twin-123',
      });
      (audienceTwinService.getSegments as jest.Mock).mockResolvedValue(mockSegments);

      const response = await request(app).get('/api/audience/twin-123/segments');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('POST /api/audience/:id/refresh', () => {
    it('should refresh audience twin', async () => {
      const mockRefreshedTwin = {
        twinId: 'twin-123',
        name: 'Test Audience',
        category: 'retail',
        size: 150,
        qualityScore: 8.5,
      };

      (audienceTwinService.getAudienceTwin as jest.Mock).mockResolvedValue({
        twinId: 'twin-123',
      });
      (audienceTwinService.refreshAudienceTwin as jest.Mock).mockResolvedValue(mockRefreshedTwin);

      const response = await request(app)
        .post('/api/audience/twin-123/refresh');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.size).toBe(150);
    });
  });

  describe('DELETE /api/audience/:id', () => {
    it('should delete audience twin', async () => {
      (audienceTwinService.deleteAudienceTwin as jest.Mock).mockResolvedValue(true);

      const response = await request(app).delete('/api/audience/twin-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 when twin not found', async () => {
      (audienceTwinService.deleteAudienceTwin as jest.Mock).mockResolvedValue(false);

      const response = await request(app).delete('/api/audience/non-existent');

      expect(response.status).toBe(404);
    });
  });
});