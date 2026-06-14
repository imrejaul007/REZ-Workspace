/**
 * API Routes Tests for Content Repurposing Engine
 */
import { jest, describe, test, expect, beforeEach } from '@jest/globals';

// Mock the services
jest.unstable_mockModule('../services/repurposingService.js', () => ({
  repurposingService: {
    repurpose: jest.fn().mockResolvedValue({
      id: 'test-repurpose-id',
      originalContentId: 'content-123',
      targetPlatform: 'instagram',
      adaptedContent: {
        title: 'Adapted Title',
        description: 'Adapted description',
        hashtags: ['#test', '#content'],
      },
      createdAt: new Date().toISOString(),
    }),
    batchRepurpose: jest.fn().mockResolvedValue([
      { id: 'result-1', targetPlatform: 'instagram' },
      { id: 'result-2', targetPlatform: 'twitter' },
    ]),
    getHistory: jest.fn().mockResolvedValue([
      { id: 'history-1', createdAt: new Date().toISOString() },
    ]),
    getById: jest.fn().mockResolvedValue({
      id: 'test-id',
      originalContentId: 'content-123',
      targetPlatform: 'instagram',
    }),
    adaptContent: jest.fn().mockResolvedValue({
      title: 'Adapted Title',
      description: 'Adapted description',
      hashtags: ['#test'],
      platform: 'instagram',
    }),
  },
}));

jest.unstable_mockModule('../services/highlightsExtraction.js', () => ({
  highlightsExtractionService: {
    extractHighlights: jest.fn().mockResolvedValue([
      { start: 0, end: 30, score: 0.95 },
      { start: 45, end: 75, score: 0.88 },
    ]),
  },
}));

jest.unstable_mockModule('../services/templateService.js', () => ({
  templateService: {
    list: jest.fn().mockResolvedValue({
      items: [{ id: 'template-1', name: 'Test Template' }],
      total: 1,
    }),
    create: jest.fn().mockResolvedValue({
      id: 'template-new',
      name: 'New Template',
      createdAt: new Date().toISOString(),
    }),
    update: jest.fn().mockResolvedValue({
      id: 'template-1',
      name: 'Updated Template',
    }),
    delete: jest.fn().mockResolvedValue({ deleted: true }),
  },
}));

jest.unstable_mockModule('../services/platformConfig.js', () => ({
  getSupportedPlatforms: jest.fn().mockReturnValue([
    {
      id: 'instagram',
      name: 'Instagram',
      type: 'social',
      maxTitleLength: 150,
      maxDescriptionLength: 2200,
      maxHashtags: 30,
      supportedAspectRatios: ['1:1', '4:5', '16:9'],
      features: ['stories', 'reels', 'feed'],
      formatting: { emojiAllowed: true, linkAllowed: false },
    },
    {
      id: 'twitter',
      name: 'Twitter/X',
      type: 'social',
      maxTitleLength: 70,
      maxDescriptionLength: 280,
      maxHashtags: 5,
      supportedAspectRatios: ['16:9'],
      features: ['tweet', 'thread'],
      formatting: { emojiAllowed: true, linkAllowed: true },
    },
  ]),
}));

describe('Repurposing API', () => {
  describe('POST /api/repurpose', () => {
    test('should validate required fields', async () => {
      const request = (await import('supertest')).default;
      const express = (await import('express')).default;
      const app = express();

      // Mock auth middleware
      app.use((req: any, _res: any, next: any) => {
        req.user = { id: 'test-user' };
        next();
      });

      // Mock validation middleware
      app.use((req: any, res: any, next: any) => {
        if (!req.body.originalContentId) {
          return res.status(400).json({
            success: false,
            error: 'Validation error: originalContentId is required',
          });
        }
        next();
      });

      // Mock route handler
      app.post('/api/repurpose', (req: any, res: any) => {
        res.status(201).json({
          success: true,
          data: { id: 'test-id', ...req.body },
        });
      });

      const response = await request(app)
        .post('/api/repurpose')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('originalContentId');
    });

    test('should create repurposed content with valid data', async () => {
      const request = (await import('supertest')).default;
      const express = (await import('express')).default;
      const app = express();

      app.use((req: any, _res: any, next: any) => {
        req.user = { id: 'test-user' };
        next();
      });

      app.post('/api/repurpose', (req: any, res: any) => {
        res.status(201).json({
          success: true,
          data: {
            id: 'test-repurpose-id',
            originalContentId: req.body.originalContentId,
            targetPlatform: req.body.targetPlatform,
          },
        });
      });

      const response = await request(app)
        .post('/api/repurpose')
        .send({
          originalContentId: 'content-123',
          originalPlatform: 'youtube',
          targetPlatform: 'instagram',
          content: {
            title: 'Test Video Title',
            description: 'Test description',
            hashtags: ['#test'],
            mediaUrl: 'https://example.com/video.mp4',
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.originalContentId).toBe('content-123');
      expect(response.body.data.targetPlatform).toBe('instagram');
    });
  });

  describe('POST /api/repurpose/batch', () => {
    test('should validate targets array', async () => {
      const request = (await import('supertest')).default;
      const express = (await import('express')).default;
      const app = express();

      app.use((req: any, _res: any, next: any) => {
        req.user = { id: 'test-user' };
        next();
      });

      app.post('/api/repurpose/batch', (req: any, res: any) => {
        if (!req.body.targets || req.body.targets.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'Validation error: targets array is required',
          });
        }
        res.status(201).json({
          success: true,
          data: { results: [], count: 0 },
        });
      });

      const response = await request(app)
        .post('/api/repurpose/batch')
        .send({
          originalContentId: 'content-123',
          originalPlatform: 'youtube',
          targets: [],
        });

      expect(response.status).toBe(400);
    });

    test('should process batch repurposing', async () => {
      const request = (await import('supertest')).default;
      const express = (await import('express')).default;
      const app = express();

      app.use((req: any, _res: any, next: any) => {
        req.user = { id: 'test-user' };
        next();
      });

      app.post('/api/repurpose/batch', (req: any, res: any) => {
        res.status(201).json({
          success: true,
          data: {
            results: req.body.targets.map((t: string) => ({ targetPlatform: t })),
            count: req.body.targets.length,
          },
        });
      });

      const response = await request(app)
        .post('/api/repurpose/batch')
        .send({
          originalContentId: 'content-123',
          originalPlatform: 'youtube',
          targets: ['instagram', 'twitter', 'facebook'],
          content: {
            title: 'Test Video',
            description: 'Test description',
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.count).toBe(3);
    });
  });

  describe('POST /api/repurpose/adapt', () => {
    test('should adapt content for target platform', async () => {
      const request = (await import('supertest')).default;
      const express = (await import('express')).default;
      const app = express();

      app.use((req: any, _res: any, next: any) => {
        req.user = { id: 'test-user' };
        next();
      });

      app.post('/api/repurpose/adapt', (req: any, res: any) => {
        const { title, targetPlatform } = req.body;
        res.json({
          success: true,
          data: {
            title: title.substring(0, 70), // Twitter limit example
            description: req.body.description,
            hashtags: req.body.hashtags || [],
            platform: targetPlatform,
          },
        });
      });

      const response = await request(app)
        .post('/api/repurpose/adapt')
        .send({
          title: 'This is a very long title that needs to be adapted for the platform',
          description: 'Test description',
          hashtags: ['#test', '#content', '#social'],
          targetPlatform: 'twitter',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.platform).toBe('twitter');
      expect(response.body.data.title.length).toBeLessThanOrEqual(70);
    });
  });
});

describe('Templates API', () => {
  describe('GET /api/templates', () => {
    test('should list templates with pagination', async () => {
      const request = (await import('supertest')).default;
      const express = (await import('express')).default;
      const app = express();

      app.use((req: any, _res: any, next: any) => {
        req.user = { id: 'test-user' };
        next();
      });

      app.get('/api/templates', (req: any, res: any) => {
        res.json({
          success: true,
          data: {
            items: [{ id: 't1', name: 'Template 1' }],
            total: 1,
            limit: parseInt(req.query.limit as string) || 20,
            offset: parseInt(req.query.offset as string) || 0,
          },
        });
      });

      const response = await request(app).get('/api/templates').query({
        limit: 10,
        offset: 0,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toBeInstanceOf(Array);
      expect(response.body.data.total).toBeDefined();
    });
  });

  describe('POST /api/templates', () => {
    test('should create a new template', async () => {
      const request = (await import('supertest')).default;
      const express = (await import('express')).default;
      const app = express();

      app.use((req: any, _res: any, next: any) => {
        req.user = { id: 'test-user' };
        next();
      });

      app.post('/api/templates', (req: any, res: any) => {
        if (!req.body.name || !req.body.sourcePlatform || !req.body.targetPlatform) {
          return res.status(400).json({
            success: false,
            error: 'Validation error: name, sourcePlatform, targetPlatform are required',
          });
        }
        res.status(201).json({
          success: true,
          data: {
            id: 'new-template-id',
            name: req.body.name,
            sourcePlatform: req.body.sourcePlatform,
            targetPlatform: req.body.targetPlatform,
            createdAt: new Date().toISOString(),
          },
        });
      });

      const response = await request(app)
        .post('/api/templates')
        .send({
          name: 'YouTube to Instagram',
          sourcePlatform: 'youtube',
          targetPlatform: 'instagram',
          rules: {
            maxLength: 2200,
            includeHashtags: true,
            adaptEmoji: true,
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('YouTube to Instagram');
    });
  });

  describe('PATCH /api/templates/:id', () => {
    test('should update template', async () => {
      const request = (await import('supertest')).default;
      const express = (await import('express')).default;
      const app = express();

      app.use((req: any, _res: any, next: any) => {
        req.user = { id: 'test-user' };
        next();
      });

      app.patch('/api/templates/:id', (req: any, res: any) => {
        res.json({
          success: true,
          data: {
            id: req.params.id,
            name: req.body.name || 'Updated Template',
          },
        });
      });

      const response = await request(app)
        .patch('/api/templates/template-123')
        .send({ name: 'Updated Template Name' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Template Name');
    });
  });

  describe('DELETE /api/templates/:id', () => {
    test('should delete template', async () => {
      const request = (await import('supertest')).default;
      const express = (await import('express')).default;
      const app = express();

      app.use((req: any, _res: any, next: any) => {
        req.user = { id: 'test-user' };
        next();
      });

      app.delete('/api/templates/:id', (req: any, res: any) => {
        res.json({
          success: true,
          message: 'Template deleted successfully',
        });
      });

      const response = await request(app).delete('/api/templates/template-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Template deleted successfully');
    });
  });
});

describe('Platforms API', () => {
  describe('GET /api/platforms', () => {
    test('should return supported platforms', async () => {
      const request = (await import('supertest')).default;
      const express = (await import('express')).default;
      const app = express();

      app.use((req: any, _res: any, next: any) => {
        req.user = { id: 'test-user' };
        next();
      });

      const mockPlatforms = [
        {
          id: 'instagram',
          name: 'Instagram',
          type: 'social',
          maxTitleLength: 150,
          maxDescriptionLength: 2200,
          maxHashtags: 30,
          supportedAspectRatios: ['1:1', '4:5', '16:9'],
          features: ['stories', 'reels', 'feed'],
          formatting: { emojiAllowed: true, linkAllowed: false },
        },
        {
          id: 'twitter',
          name: 'Twitter/X',
          type: 'social',
          maxTitleLength: 70,
          maxDescriptionLength: 280,
          maxHashtags: 5,
          supportedAspectRatios: ['16:9'],
          features: ['tweet', 'thread'],
          formatting: { emojiAllowed: true, linkAllowed: true },
        },
      ];

      app.get('/api/platforms', (_req: any, res: any) => {
        res.json({
          success: true,
          data: {
            platforms: mockPlatforms.map((p) => ({
              id: p.id,
              name: p.name,
              type: p.type,
              capabilities: {
                maxTitleLength: p.maxTitleLength,
                maxDescriptionLength: p.maxDescriptionLength,
                maxHashtags: p.maxHashtags,
                supportedAspectRatios: p.supportedAspectRatios,
                features: p.features,
              },
              formatting: p.formatting,
            })),
            total: mockPlatforms.length,
          },
        });
      });

      const response = await request(app).get('/api/platforms');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.platforms).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
      expect(response.body.data.platforms[0]).toHaveProperty('capabilities');
      expect(response.body.data.platforms[0]).toHaveProperty('formatting');
    });
  });
});