import express, { Application } from 'express';
import request from 'supertest';
import routes from '../src/routes';
import { generateToken } from '../src/middleware/auth.middleware';

// Mock the services
jest.mock('../src/services/campaign-builder.service', () => ({
  campaignBuilderService: {
    build: jest.fn().mockResolvedValue({
      buildId: 'test-build-id',
      success: true,
      campaign: {
        name: 'Test Campaign',
        objective: 'sales',
        status: 'draft',
        budget: { amount: 50000, currency: 'INR' },
        targeting: { locations: ['Bangalore'] },
        ads: [{ id: '1', type: 'image', headline: 'Test', callToAction: 'Shop Now' }],
        schedule: { startDate: new Date() },
        bidStrategy: { type: 'cpa' }
      },
      parsed: {
        goal: { type: 'sales', target: 1000 },
        audience: { location: ['Bangalore'] },
        budget: { amount: 50000, currency: 'INR' }
      },
      confidence: 0.85,
      suggestions: ['Add more ad variations'],
      warnings: []
    }),
    getBuild: jest.fn().mockResolvedValue({
      buildId: 'test-build-id',
      advertiserId: 'advertiser-123',
      naturalLanguage: 'Test input',
      status: 'completed',
      confidence: 0.85
    }),
    getCampaign: jest.fn().mockResolvedValue({
      name: 'Test Campaign',
      objective: 'sales'
    }),
    validate: jest.fn().mockResolvedValue({
      valid: true,
      errors: [],
      warnings: [],
      score: 100
    }),
    adjust: jest.fn().mockResolvedValue({
      success: true,
      updatedCampaign: { name: 'Updated Campaign' },
      confidence: 0.9,
      appliedChanges: ['Updated name']
    }),
    getBuildsByAdvertiser: jest.fn().mockResolvedValue([]),
    getRecentBuilds: jest.fn().mockResolvedValue([])
  }
}));

jest.mock('../src/services/nlp-parser.service', () => ({
  nlpParserService: {
    parse: jest.fn().mockResolvedValue({
      parsed: {
        goal: { type: 'sales', target: 1000 },
        audience: { location: ['Bangalore'] },
        budget: { amount: 50000, currency: 'INR' }
      },
      confidence: 0.85,
      warnings: []
    })
  }
}));

jest.mock('../src/services/campaign-generator.service', () => ({
  campaignGeneratorService: {
    generate: jest.fn().mockResolvedValue({
      campaign: { name: 'Generated Campaign' },
      suggestions: [],
      warnings: []
    }),
    adjust: jest.fn().mockResolvedValue({
      campaign: { name: 'Adjusted Campaign' },
      appliedChanges: []
    })
  }
}));

describe('API Routes', () => {
  let app: Application;
  let authToken: string;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(routes);

    authToken = generateToken({
      userId: 'user-123',
      advertiserId: 'advertiser-123',
      role: 'advertiser',
      permissions: ['campaign:read', 'campaign:write']
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.service).toBe('nl-campaign-builder-v2');
    });
  });

  describe('GET /ready', () => {
    it('should return readiness status', async () => {
      const response = await request(app).get('/ready');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ready');
      expect(response.body.checks).toBeDefined();
    });
  });

  describe('POST /api/nl/build', () => {
    it('should build campaign from natural language', async () => {
      const response = await request(app)
        .post('/api/nl/build')
        .send({
          naturalLanguage: 'I want to sell 1000 phones in Bangalore',
          advertiserId: 'advertiser-123'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.buildId).toBeDefined();
      expect(response.body.campaign).toBeDefined();
      expect(response.body.confidence).toBeDefined();
    });

    it('should return 400 for missing naturalLanguage', async () => {
      const response = await request(app)
        .post('/api/nl/build')
        .send({
          advertiserId: 'advertiser-123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for missing advertiserId', async () => {
      const response = await request(app)
        .post('/api/nl/build')
        .send({
          naturalLanguage: 'I want to sell products in Bangalore'
        });

      expect(response.status).toBe(400);
    });

    it('should use authenticated advertiserId when available', async () => {
      const response = await request(app)
        .post('/api/nl/build')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          naturalLanguage: 'I want to sell products in Bangalore'
        });

      expect(response.status).toBe(201);
    });
  });

  describe('GET /api/nl/campaigns/:id', () => {
    it('should get campaign by ID', async () => {
      const response = await request(app)
        .get('/api/nl/campaigns/test-build-id');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.campaign).toBeDefined();
    });

    it('should return 404 for non-existent campaign', async () => {
      const { campaignBuilderService } = require('../src/services/campaign-builder.service');
      campaignBuilderService.getCampaign.mockResolvedValueOnce(null);

      const response = await request(app)
        .get('/api/nl/campaigns/non-existent-id');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/nl/validate', () => {
    it('should validate campaign', async () => {
      const response = await request(app)
        .post('/api/nl/validate')
        .send({
          campaign: {
            name: 'Test Campaign',
            objective: 'sales',
            budget: { amount: 50000, currency: 'INR' },
            targeting: { locations: ['Bangalore'] },
            ads: [{ id: '1', type: 'image', headline: 'Test', callToAction: 'Shop Now' }],
            schedule: { startDate: new Date() },
            bidStrategy: { type: 'cpa' }
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.valid).toBe(true);
      expect(response.body.score).toBeDefined();
    });

    it('should detect validation errors', async () => {
      const { campaignBuilderService } = require('../src/services/campaign-builder.service');
      campaignBuilderService.validate.mockResolvedValueOnce({
        valid: false,
        errors: [{ field: 'name', message: 'Campaign name is required', severity: 'error' }],
        warnings: [],
        score: 80
      });

      const response = await request(app)
        .post('/api/nl/validate')
        .send({
          campaign: {
            objective: 'sales'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(false);
      expect(response.body.errors.length).toBeGreaterThan(0);
    });
  });

  describe('PUT /api/nl/campaigns/:id/adjust', () => {
    it('should adjust campaign based on feedback', async () => {
      const response = await request(app)
        .put('/api/nl/campaigns/test-build-id/adjust')
        .send({
          feedback: 'increase budget by 20%'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.appliedChanges).toBeDefined();
    });

    it('should return 400 for missing feedback', async () => {
      const response = await request(app)
        .put('/api/nl/campaigns/test-build-id/adjust')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/nl/builds', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/nl/builds');

      expect(response.status).toBe(401);
    });

    it('should return builds for authenticated user', async () => {
      const response = await request(app)
        .get('/api/nl/builds')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.builds).toBeDefined();
    });
  });

  describe('POST /api/nl/parse', () => {
    it('should parse natural language input', async () => {
      const response = await request(app)
        .post('/api/nl/parse')
        .send({
          naturalLanguage: 'I want to sell 1000 phones in Bangalore'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.parsed).toBeDefined();
      expect(response.body.confidence).toBeDefined();
    });

    it('should return 400 for short input', async () => {
      const response = await request(app)
        .post('/api/nl/parse')
        .send({
          naturalLanguage: 'sell'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /metrics', () => {
    it('should return Prometheus metrics', async () => {
      const response = await request(app)
        .get('/metrics');

      expect(response.status).toBe(200);
      expect(response.type).toContain('text/plain');
    });
  });
});