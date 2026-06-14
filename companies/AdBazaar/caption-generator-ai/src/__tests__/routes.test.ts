/**
 * Route Tests for Caption Generator AI
 * Tests all API endpoints using supertest
 */

import request from 'supertest';
import express, { Express } from 'express';
import routes from '../routes';
import { CaptionGeneratorService, CaptionOptimizerService, CaptionAnalyticsService } from '../services';
import { errorHandler, notFoundHandler } from '../middleware';

// Mock services
jest.mock('../services/captionGeneratorService');
jest.mock('../services/captionOptimizerService');
jest.mock('../services/captionAnalyticsService');
jest.mock('../utils/logger');

// Create test app
function createTestApp(): Express {
  const app = express();
  app.use(express.json());

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'caption-generator-ai' });
  });

  // Routes
  app.use('/api', routes);

  // Error handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

describe('Caption Generator Routes', () => {
  let app: Express;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
    });
  });

  describe('POST /api/generate', () => {
    const validRequest = {
      prompt: 'Generate a caption for a sunset photo',
      platform: 'instagram',
      style: 'casual',
      tone: 'enthusiastic',
    };

    it('should generate caption', async () => {
      (CaptionGeneratorService.generateCaption as jest.Mock).mockResolvedValue({
        text: 'Beautiful sunset vibes! #travel',
        hashtags: ['travel'],
        style: 'casual',
      });

      const response = await request(app)
        .post('/api/generate')
        .send(validRequest);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.text).toBeDefined();
    });

    it('should return 400 for missing prompt', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send({ platform: 'instagram' });

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid platform', async () => {
      const response = await request(app)
        .post('/api/generate')
        .send({ prompt: 'Test', platform: 'invalid' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/generate/variations', () => {
    it('should generate multiple variations', async () => {
      (CaptionGeneratorService.generateMultipleVariations as jest.Mock).mockResolvedValue([
        { text: 'Variation 1', hashtags: [] },
        { text: 'Variation 2', hashtags: [] },
      ]);

      const response = await request(app)
        .post('/api/generate/variations')
        .send({
          prompt: 'Test caption',
          count: 2,
          platform: 'instagram',
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('POST /api/optimize', () => {
    it('should optimize caption', async () => {
      (CaptionOptimizerService.optimizeForEngagement as jest.Mock).mockResolvedValue({
        text: 'Optimized caption',
        suggestions: [],
      });

      const response = await request(app)
        .post('/api/optimize')
        .send({
          text: 'Good caption',
          platform: 'instagram',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.text).toBeDefined();
    });
  });

  describe('POST /api/optimize/hashtags', () => {
    it('should add hashtags to caption', async () => {
      (CaptionOptimizerService.addHashtags as jest.Mock).mockResolvedValue(
        'Great post! #travel #photography'
      );

      const response = await request(app)
        .post('/api/optimize/hashtags')
        .send({
          caption: 'Great post!',
          count: 2,
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toContain('#');
    });
  });

  describe('POST /api/optimize/cta', () => {
    it('should add call to action', async () => {
      (CaptionOptimizerService.addCallToAction as jest.Mock).mockResolvedValue(
        'Great post! Shop now!'
      );

      const response = await request(app)
        .post('/api/optimize/cta')
        .send({
          caption: 'Great post!',
          cta: 'Shop now!',
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toContain('Shop now');
    });
  });

  describe('POST /api/translate', () => {
    it('should translate caption', async () => {
      (CaptionGeneratorService.translateCaption as jest.Mock).mockResolvedValue(
        'Hermoso atardecer!'
      );

      const response = await request(app)
        .post('/api/translate')
        .send({
          caption: 'Beautiful sunset!',
          targetLanguage: 'es',
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('GET /api/analytics/top', () => {
    it('should return top performing captions', async () => {
      (CaptionAnalyticsService.getTopPerformingCaptions as jest.Mock).mockResolvedValue([
        { text: 'Top caption', engagement: 1000 },
      ]);

      const response = await request(app)
        .get('/api/analytics/top')
        .query({ platform: 'instagram', limit: '10' });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/analytics/insights', () => {
    it('should return caption insights', async () => {
      (CaptionAnalyticsService.getCaptionInsights as jest.Mock).mockResolvedValue({
        avgEngagement: 500,
        topStyle: 'casual',
      });

      const response = await request(app)
        .get('/api/analytics/insights')
        .query({ platform: 'instagram' });

      expect(response.status).toBe(200);
      expect(response.body.data.avgEngagement).toBe(500);
    });
  });
});

describe('404 Handler', () => {
  let app: Express;

  beforeEach(() => {
    app = createTestApp();
  });

  it('should return 404 for unknown routes', async () => {
    const response = await request(app).get('/api/unknown-route');

    expect(response.status).toBe(404);
  });
});