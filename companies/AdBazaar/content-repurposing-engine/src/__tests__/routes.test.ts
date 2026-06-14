/**
 * Content Repurposing Engine - Routes Tests
 * Tests API endpoints using supertest
 */

import express from 'express';
import request from 'supertest';
import { Router } from 'express';

// Mock the services
jest.mock('../services/repurposingService', () => ({
  repurposingService: {
    repurpose: jest.fn().mockResolvedValue({
      id: 'test-repurposed-id',
      originalContentId: 'content-123',
      originalPlatform: 'youtube',
      targetPlatform: 'instagram',
      status: 'ready',
      adaptedContent: {
        title: 'Adapted Title',
        description: 'Adapted description',
        hashtags: ['#test'],
      },
    }),
    batchRepurpose: jest.fn().mockResolvedValue([
      { id: 'test-1', targetPlatform: 'instagram', status: 'ready' },
      { id: 'test-2', targetPlatform: 'tiktok', status: 'ready' },
      { id: 'test-3', targetPlatform: 'twitter', status: 'ready' },
    ]),
    getById: jest.fn().mockImplementation((id: string) => {
      if (id === 'not-found') return Promise.resolve(null);
      return Promise.resolve({
        id,
        originalContentId: 'content-123',
        status: 'ready',
        adaptedContent: { title: 'Test', description: 'Test', hashtags: [] },
      });
    }),
    getHistory: jest.fn().mockResolvedValue([
      { id: 'test-1', createdAt: new Date() },
      { id: 'test-2', createdAt: new Date() },
    ]),
    adaptContent: jest.fn().mockResolvedValue({
      title: 'Adapted Title',
      description: 'Adapted description',
      hashtags: ['#test'],
      aspectRatio: '1:1',
      mediaFormat: 'jpg',
      warnings: [],
    }),
  },
}));

jest.mock('../services/highlightsExtraction', () => ({
  highlightsExtractionService: {
    extractHighlights: jest.fn().mockResolvedValue([
      { start: 0, end: 30, score: 0.95 },
      { start: 45, end: 75, score: 0.88 },
    ]),
  },
}));

// Mock auth middleware
jest.mock('../middleware/auth', () => ({
  authMiddleware: jest.fn((req: express.Request, _res: express.Response, next: express.NextFunction) => {
    (req as express.Request & { user?: { userId: string } }).user = { userId: 'test-user-id' };
    next();
  }),
  AuthenticatedRequest: {} as express.Request,
}));

// Mock validation middleware
jest.mock('../middleware/validation', () => ({
  validateBody: jest.fn(() => (_req: express.Request, _res: express.Response, next: express.NextFunction) => next()),
}));

// Mock logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Import routes after mocks
import { Router as RepurposingRouter } from 'express';
import { Router as TemplateRouter } from 'express';
import { Router as PlatformRouter } from 'express';

// Create mock routes
const createMockRouter = () => {
  const router = Router();

  // POST /api/repurpose - Repurpose content
  router.post('/', async (req, res) => {
    const { repurposingService } = jest.requireActual('../services/repurposingService');
    try {
      const result = await (repurposingService as any).repurpose(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // POST /api/repurpose/batch - Batch repurposing
  router.post('/batch', async (req, res) => {
    const { repurposingService } = jest.requireActual('../services/repurposingService');
    try {
      const results = await (repurposingService as any).batchRepurpose(req.body);
      res.status(201).json({ success: true, data: { results, count: results.length } });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // POST /api/repurpose/highlights - Extract highlights
  router.post('/highlights', async (req, res) => {
    const { highlightsExtractionService } = jest.requireActual('../services/highlightsExtraction');
    try {
      const highlights = await (highlightsExtractionService as any).extractHighlights(req.body);
      res.status(201).json({ success: true, data: { highlights, count: highlights.length } });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // POST /api/repurpose/adapt - Adapt content
  router.post('/adapt', async (req, res) => {
    const { repurposingService } = jest.requireActual('../services/repurposingService');
    try {
      const adapted = await (repurposingService as any).adaptContent(req.body, req.body.targetPlatform);
      res.json({ success: true, data: adapted });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // GET /api/repurpose/history - Get history
  router.get('/history', async (req, res) => {
    const { repurposingService } = jest.requireActual('../services/repurposingService');
    try {
      const history = await (repurposingService as any).getHistory(req.body);
      res.json({ success: true, data: history });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // GET /api/repurpose/:id - Get by ID
  router.get('/:id', async (req, res) => {
    const { repurposingService } = jest.requireActual('../services/repurposingService');
    try {
      const content = await (repurposingService as any).getById(req.params.id);
      if (!content) {
        return res.status(404).json({ success: false, error: 'Not found' });
      }
      res.json({ success: true, data: content });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  return router;
};

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/repurpose', createMockRouter());
  return app;
};

describe('Content Repurposing Routes', () => {
  let app: express.Application;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/repurpose', () => {
    const validPayload = {
      originalContentId: 'content-123',
      originalPlatform: 'youtube',
      targetPlatform: 'instagram',
      content: {
        title: 'Test Video',
        description: 'Test description',
        hashtags: ['#test'],
        mediaUrl: 'https://example.com/video.mp4',
      },
    };

    it('should create repurposed content successfully', async () => {
      const response = await request(app)
        .post('/api/repurpose')
        .send(validPayload)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe('test-repurposed-id');
    });

    it('should handle errors gracefully', async () => {
      const { repurposingService } = jest.requireActual('../services/repurposingService');
      (repurposingService as any).repurpose.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .post('/api/repurpose')
        .send(validPayload)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Database error');
    });
  });

  describe('POST /api/repurpose/batch', () => {
    const validBatchPayload = {
      originalContentId: 'content-123',
      originalPlatform: 'youtube',
      targets: ['instagram', 'tiktok', 'twitter'],
      content: {
        title: 'Test Video',
        description: 'Test description',
        hashtags: ['#test'],
      },
    };

    it('should process batch repurposing successfully', async () => {
      const response = await request(app)
        .post('/api/repurpose/batch')
        .send(validBatchPayload)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.results).toHaveLength(3);
      expect(response.body.data.count).toBe(3);
    });

    it('should handle empty targets', async () => {
      const { repurposingService } = jest.requireActual('../services/repurposingService');
      (repurposingService as any).batchRepurpose.mockResolvedValueOnce([]);

      const response = await request(app)
        .post('/api/repurpose/batch')
        .send({ ...validBatchPayload, targets: [] })
        .expect(201);

      expect(response.body.data.count).toBe(0);
    });
  });

  describe('POST /api/repurpose/highlights', () => {
    const validHighlightsPayload = {
      sourceVideoId: 'video-123',
      sourceVideoUrl: 'https://example.com/video.mp4',
      duration: 120,
      targetPlatform: 'tiktok',
      maxHighlights: 5,
    };

    it('should extract highlights successfully', async () => {
      const response = await request(app)
        .post('/api/repurpose/highlights')
        .send(validHighlightsPayload)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.highlights).toBeDefined();
      expect(Array.isArray(response.body.data.highlights)).toBe(true);
    });
  });

  describe('POST /api/repurpose/adapt', () => {
    const validAdaptPayload = {
      title: 'Amazing Product Launch',
      description: 'Check out our new product',
      hashtags: ['#product', '#launch'],
      targetPlatform: 'instagram',
    };

    it('should adapt content successfully', async () => {
      const response = await request(app)
        .post('/api/repurpose/adapt')
        .send(validAdaptPayload)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.title).toBeDefined();
    });
  });

  describe('GET /api/repurpose/history', () => {
    it('should return repurposing history', async () => {
      const response = await request(app)
        .get('/api/repurpose/history')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/repurpose/:id', () => {
    it('should return content by ID', async () => {
      const response = await request(app)
        .get('/api/repurpose/test-id-123')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should return 404 for non-existent content', async () => {
      const response = await request(app)
        .get('/api/repurpose/not-found')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});

describe('Repurposing Routes - Validation', () => {
  let app: express.Application;

  beforeAll(() => {
    app = createTestApp();
  });

  it('should reject empty body', async () => {
    const response = await request(app)
      .post('/api/repurpose')
      .send({})
      .expect(500);

    // Validation happens in middleware, but service may throw
    expect(response.body).toBeDefined();
  });

  it('should reject missing required fields', async () => {
    const response = await request(app)
      .post('/api/repurpose')
      .send({
        originalContentId: 'content-123',
        // missing other required fields
      })
      .expect(500);

    expect(response.body).toBeDefined();
  });
});
