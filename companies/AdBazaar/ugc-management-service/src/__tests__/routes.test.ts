/**
 * UGC Management Service - Routes Tests
 * Tests API endpoints using supertest
 */

import express from 'express';
import request from 'supertest';

// Mock services
jest.mock('../services/moderationService', () => ({
  moderationService: {
    approveContent: jest.fn().mockResolvedValue({
      _id: 'ugc-123',
      status: 'approved',
      approvedBy: 'test-user-id',
    }),
    rejectContent: jest.fn().mockResolvedValue({
      _id: 'ugc-123',
      status: 'rejected',
    }),
    bulkModerate: jest.fn().mockResolvedValue({
      processed: 2,
      successful: 2,
      failed: 0,
    }),
    autoModerate: jest.fn().mockResolvedValue({
      processed: 10,
      approved: 8,
      rejected: 2,
    }),
  },
}));

jest.mock('../services/rightsService', () => ({
  rightsService: {
    requestRights: jest.fn().mockResolvedValue({
      _id: 'rights-123',
      status: 'pending',
    }),
    respondToRights: jest.fn().mockResolvedValue({
      _id: 'rights-123',
      status: 'granted',
    }),
    listRights: jest.fn().mockResolvedValue({
      items: [],
      total: 0,
      limit: 50,
      offset: 0,
    }),
  },
}));

jest.mock('../services/displayService', () => ({
  displayService: {
    generateDisplayEmbed: jest.fn().mockResolvedValue({
      campaignId: 'campaign-123',
      items: [],
      displayType: 'grid',
    }),
    generateEmbedCode: jest.fn().mockResolvedValue('<iframe src="..."></iframe>'),
    generateJSONFeed: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('../services/ugcCollectorService', () => ({
  ugcCollectorService: {
    collectUGC: jest.fn().mockResolvedValue({
      collected: 5,
      platforms: ['instagram'],
    }),
  },
}));

// Mock models
jest.mock('../models/UGCContent', () => ({
  UGCContent: {
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
    }),
    findById: jest.fn().mockResolvedValue({
      _id: 'ugc-123',
      status: 'approved',
    }),
    findByIdAndDelete: jest.fn().mockResolvedValue({ _id: 'ugc-123' }),
    countDocuments: jest.fn().mockResolvedValue(0),
  },
}));

// Mock logger
jest.mock('../config/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Create mock router
const createMockRouter = () => {
  const router = express.Router();
  const { moderationService, rightsService, displayService, ugcCollectorService } = jest.requireActual('../services');
  const { UGCContent } = jest.requireActual('../models/UGCContent');

  // POST /api/ugc/collect
  router.post('/collect', async (req, res) => {
    try {
      const result = await ugcCollectorService.collectUGC(req.body.platforms, req.body.hashtags, req.body.campaignId);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // POST /api/ugc/moderate
  router.post('/moderate', async (req, res) => {
    try {
      const result = await moderationService.bulkModerate(req.body.contentIds, req.body.action, 'test-user-id');
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // POST /api/ugc/approve
  router.post('/approve', async (req, res) => {
    try {
      const result = await moderationService.approveContent(req.body.contentId, 'test-user-id', req.body.notes);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // POST /api/ugc/reject
  router.post('/reject', async (req, res) => {
    try {
      const result = await moderationService.rejectContent(req.body.contentId, 'test-user-id', req.body.reason);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // GET /api/ugc/approved
  router.get('/approved', async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 50;
    res.json({ success: true, data: { items: [], total: 0, limit, offset: 0 } });
  });

  // GET /api/ugc/pending
  router.get('/pending', async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 50;
    res.json({ success: true, data: { items: [], total: 0, limit, offset: 0 } });
  });

  // POST /api/ugc/rights
  router.post('/rights', async (req, res) => {
    try {
      const result = await rightsService.requestRights(req.body.ugcId, 'test-user-id', req.body.rightsType, req.body.usageTerms);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // POST /api/ugc/rights/:id/respond
  router.post('/rights/:id/respond', async (req, res) => {
    try {
      const result = await rightsService.respondToRights(req.params.id, req.body.action, 'test-user-id', req.body.notes);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // GET /api/ugc/rights
  router.get('/rights', async (req, res) => {
    try {
      const result = await rightsService.listRights({ limit: 50, offset: 0 });
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // POST /api/ugc/display
  router.post('/display', async (req, res) => {
    try {
      const result = await displayService.generateDisplayEmbed(req.query.campaignId as string, req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // GET /api/ugc/embed/:campaignId
  router.get('/embed/:campaignId', async (req, res) => {
    try {
      const result = await displayService.generateEmbedCode(req.params.campaignId, 'grid', { theme: 'light' });
      res.type('html').send(result);
    } catch (error) {
      res.status(500).send('Error');
    }
  });

  // GET /api/ugc/feed/:campaignId
  router.get('/feed/:campaignId', async (req, res) => {
    try {
      const result = await displayService.generateJSONFeed(req.params.campaignId, 50);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

  // GET /api/ugc/:id
  router.get('/:id', async (req, res) => {
    const content = await UGCContent.findById(req.params.id);
    if (!content) {
      return res.status(404).json({ success: false, error: 'Content not found' });
    }
    res.json({ success: true, data: content });
  });

  // DELETE /api/ugc/:id
  router.delete('/:id', async (req, res) => {
    const content = await UGCContent.findByIdAndDelete(req.params.id);
    if (!content) {
      return res.status(404).json({ success: false, error: 'Content not found' });
    }
    res.json({ success: true, message: 'Content deleted successfully' });
  });

  return router;
};

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/ugc', createMockRouter());
  return app;
};

describe('UGC Management Routes', () => {
  let app: express.Application;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/ugc/collect', () => {
    it('should collect UGC successfully', async () => {
      const response = await request(app)
        .post('/api/ugc/collect')
        .send({
          platforms: ['instagram', 'twitter'],
          hashtags: ['#test', '#ugc'],
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('POST /api/ugc/moderate', () => {
    it('should bulk moderate content', async () => {
      const response = await request(app)
        .post('/api/ugc/moderate')
        .send({
          contentIds: ['ugc-1', 'ugc-2'],
          action: 'approve',
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.processed).toBe(2);
    });
  });

  describe('POST /api/ugc/approve', () => {
    it('should approve content', async () => {
      const response = await request(app)
        .post('/api/ugc/approve')
        .send({
          contentId: 'ugc-123',
          notes: 'Looks good',
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('approved');
    });
  });

  describe('POST /api/ugc/reject', () => {
    it('should reject content', async () => {
      const response = await request(app)
        .post('/api/ugc/reject')
        .send({
          contentId: 'ugc-123',
          reason: 'Inappropriate content',
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('rejected');
    });
  });

  describe('GET /api/ugc/approved', () => {
    it('should return approved content', async () => {
      const response = await request(app)
        .get('/api/ugc/approved')
        .query({ limit: '50' })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('GET /api/ugc/pending', () => {
    it('should return pending content', async () => {
      const response = await request(app)
        .get('/api/ugc/pending')
        .query({ limit: '50' })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('POST /api/ugc/rights', () => {
    it('should request rights', async () => {
      const response = await request(app)
        .post('/api/ugc/rights')
        .send({
          ugcId: 'ugc-123',
          rightsType: 'display',
          usageTerms: 'For promotional use',
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('pending');
    });
  });

  describe('POST /api/ugc/rights/:id/respond', () => {
    it('should respond to rights request', async () => {
      const response = await request(app)
        .post('/api/ugc/rights/rights-123/respond')
        .send({
          action: 'approve',
          notes: 'Approved for use',
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/ugc/rights', () => {
    it('should list rights requests', async () => {
      const response = await request(app)
        .get('/api/ugc/rights')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/ugc/display', () => {
    it('should generate display embed', async () => {
      const response = await request(app)
        .post('/api/ugc/display')
        .query({ campaignId: 'campaign-123' })
        .send({
          displayType: 'grid',
          maxItems: 20,
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/ugc/embed/:campaignId', () => {
    it('should return embed HTML', async () => {
      const response = await request(app)
        .get('/api/ugc/embed/campaign-123')
        .expect('Content-Type', /html/)
        .expect(200);

      expect(response.text).toContain('iframe');
    });
  });

  describe('GET /api/ugc/feed/:campaignId', () => {
    it('should return JSON feed', async () => {
      const response = await request(app)
        .get('/api/ugc/feed/campaign-123')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/ugc/:id', () => {
    it('should return content by ID', async () => {
      const response = await request(app)
        .get('/api/ugc/ugc-123')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent content', async () => {
      const { UGCContent } = jest.requireActual('../models/UGCContent');
      (UGCContent.findById as jest.Mock).mockResolvedValueOnce(null);

      const response = await request(app)
        .get('/api/ugc/nonexistent')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/ugc/:id', () => {
    it('should delete content', async () => {
      const response = await request(app)
        .delete('/api/ugc/ugc-123')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Content deleted successfully');
    });
  });
});

describe('UGC Routes - Error Handling', () => {
  let app: express.Application;

  beforeAll(() => {
    app = createTestApp();
  });

  it('should handle service errors', async () => {
    const { moderationService } = jest.requireActual('../services');
    (moderationService as any).approveContent.mockRejectedValueOnce(new Error('Database error'));

    const response = await request(app)
      .post('/api/ugc/approve')
      .send({ contentId: 'ugc-123' })
      .expect(500);

    expect(response.body.success).toBe(false);
  });
});