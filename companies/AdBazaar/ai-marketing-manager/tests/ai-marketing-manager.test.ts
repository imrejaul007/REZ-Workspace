import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

// Mock services
jest.mock('../src/services/database.service', () => ({
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
  isHealthy: jest.fn().mockReturnValue(true),
}));

jest.mock('../src/services/redis.service', () => ({
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
  isHealthy: jest.fn().mockReturnValue(true),
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
}));

// Mock models
jest.mock('../src/models', () => ({
  AIMarketingManager: {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    deleteOne: jest.fn(),
  },
  Campaign: {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
  },
  ScheduleEvent: {
    find: jest.fn(),
    create: jest.fn(),
  },
  Review: {
    find: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

import routes from '../src/routes';
import { errorHandler } from '../src/middleware';
import { config } from '../src/config';

describe('AI Marketing Manager API', () => {
  let app: express.Application;
  let authToken: string;

  beforeAll(() => {
    // Create test app
    app = express();
    app.use(express.json());
    app.use('/api', routes);
    app.use(errorHandler);

    // Generate test token
    authToken = jwt.sign(
      {
        userId: 'test-user-123',
        merchantId: 'merchant-123',
        role: 'admin',
      },
      config.jwt.secret,
      { expiresIn: '1h' }
    );
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  describe('Health Check', () => {
    test('GET /health should return healthy status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('service', 'ai-marketing-manager');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Authentication', () => {
    test('POST /api/ai/initialize should require auth', async () => {
      const response = await request(app)
        .post('/api/ai/initialize')
        .send({
          merchantId: 'merchant-123',
          businessProfile: {
            name: 'Test Business',
            category: 'restaurant',
            location: 'Test Location',
          },
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Initialize AI Manager', () => {
    test('POST /api/ai/initialize should create manager with valid data', async () => {
      const mockManager = {
        managerId: 'AIMM-12345678',
        merchantId: 'merchant-123',
        businessProfile: {
          name: 'Test Business',
          category: 'restaurant',
          location: 'Test Location',
        },
        capabilities: {
          adCreation: true,
          reviewManagement: true,
          socialPosting: true,
          whatsappCampaigns: true,
          localSEO: true,
        },
        status: 'active',
        createdAt: new Date(),
      };

      const { AIMarketingManager } = require('../src/models');
      AIMarketingManager.findOne.mockResolvedValue(null);
      AIMarketingManager.create.mockResolvedValue(mockManager);

      const response = await request(app)
        .post('/api/ai/initialize')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          merchantId: 'merchant-123',
          businessProfile: {
            name: 'Test Business',
            category: 'restaurant',
            location: 'Test Location',
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('managerId');
      expect(response.body.data).toHaveProperty('merchantId');
    });
  });

  describe('Get Manager Status', () => {
    test('GET /api/ai/manager/:merchantId should return manager', async () => {
      const mockManager = {
        managerId: 'AIMM-12345678',
        merchantId: 'merchant-123',
        businessProfile: {
          name: 'Test Business',
          category: 'restaurant',
        },
        capabilities: {
          adCreation: true,
          reviewManagement: true,
        },
        activeCampaigns: [],
        status: 'active',
        performance: {
          totalReach: 1000,
          totalConversions: 50,
        },
      };

      const { AIMarketingManager } = require('../src/models');
      AIMarketingManager.findOne.mockResolvedValue(mockManager);

      const response = await request(app)
        .get('/api/ai/manager/merchant-123')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('managerId');
      expect(response.body.data).toHaveProperty('performance');
    });

    test('GET /api/ai/manager/:merchantId should return 404 if not found', async () => {
      const { AIMarketingManager } = require('../src/models');
      AIMarketingManager.findOne.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/ai/manager/unknown-merchant')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Get Recommendations', () => {
    test('POST /api/ai/recommend should return recommendations', async () => {
      const mockManager = {
        managerId: 'AIMM-12345678',
        merchantId: 'merchant-123',
        recommendations: [
          {
            id: 'rec-1',
            priority: 'high',
            category: 'social_media',
            action: 'Create Instagram Reels',
            expectedImpact: 'High engagement',
          },
          {
            id: 'rec-2',
            priority: 'medium',
            category: 'review_management',
            action: 'Request reviews',
            expectedImpact: 'More reviews',
          },
        ],
      };

      const { AIMarketingManager } = require('../src/models');
      AIMarketingManager.findOne.mockResolvedValue(mockManager);

      const response = await request(app)
        .post('/api/ai/recommend')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          merchantId: 'merchant-123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('recommendations');
      expect(Array.isArray(response.body.data.recommendations)).toBe(true);
    });
  });

  describe('Execute Action', () => {
    test('POST /api/ai/execute should execute campaign creation', async () => {
      const mockManager = {
        managerId: 'AIMM-12345678',
        merchantId: 'merchant-123',
        capabilities: {
          adCreation: true,
        },
      };

      const { AIMarketingManager } = require('../src/models');
      AIMarketingManager.findOne.mockResolvedValue(mockManager);

      const response = await request(app)
        .post('/api/ai/execute')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          merchantId: 'merchant-123',
          actionType: 'create_campaign',
          parameters: {
            type: 'facebook_ad',
            name: 'Test Campaign',
            headline: 'Test Headline',
            body: 'Test Body Content',
            budget: 1000,
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Get Calendar', () => {
    test('GET /api/ai/calendar should return calendar events', async () => {
      const mockEvents = [
        {
          eventId: 'EVT-12345678',
          type: 'post',
          content: 'Test post content',
          scheduledFor: new Date(),
          platform: 'instagram',
          status: 'pending',
        },
      ];

      const { ScheduleEvent } = require('../src/models');
      ScheduleEvent.find.mockResolvedValue(mockEvents);

      const response = await request(app)
        .get('/api/ai/calendar')
        .query({ merchantId: 'merchant-123' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('events');
    });
  });

  describe('Get Performance', () => {
    test('GET /api/ai/performance should return performance report', async () => {
      const mockManager = {
        merchantId: 'merchant-123',
        performance: {
          totalReach: 10000,
          totalEngagement: 500,
          totalConversions: 100,
          roas: 2.5,
        },
      };

      const mockCampaigns = [
        {
          performance: {
            reach: 5000,
            impressions: 10000,
            clicks: 200,
            conversions: 50,
            spend: 500,
            revenue: 1500,
          },
        },
      ];

      const { AIMarketingManager, Campaign } = require('../src/models');
      AIMarketingManager.findOne.mockResolvedValue(mockManager);
      Campaign.find.mockResolvedValue(mockCampaigns);

      const response = await request(app)
        .get('/api/ai/performance')
        .query({ merchantId: 'merchant-123' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('metrics');
    });
  });
});