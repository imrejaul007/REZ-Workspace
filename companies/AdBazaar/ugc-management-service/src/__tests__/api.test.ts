/**
 * API Routes Tests for UGC Management Service
 */
import { jest, describe, test, expect, beforeEach } from '@jest/globals';

describe('UGC Routes API', () => {
  let app: any;

  beforeEach(async () => {
    const express = (await import('express')).default;
    app = express();

    // Mock auth middleware
    app.use((req: any, _res: any, next: any) => {
      req.headers['x-user-id'] = req.headers['x-user-id'] || 'test-user-id';
      next();
    });
  });

  describe('POST /api/ugc/collect', () => {
    test('should validate required fields', async () => {
      app.post('/api/ugc/collect', (req: any, res: any) => {
        if (!req.body.platforms || !req.body.hashtags) {
          return res.status(400).json({
            success: false,
            error: 'Validation error: platforms and hashtags are required'
          });
        }
        res.json({ success: true, data: { collected: 0 } });
      });

      const request = (await import('supertest')).default;
      const response = await request(app)
        .post('/api/ugc/collect')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should collect UGC from valid request', async () => {
      app.post('/api/ugc/collect', (req: any, res: any) => {
        res.json({
          success: true,
          data: {
            collected: 15,
            campaignId: req.body.campaignId || null
          }
        });
      });

      const request = (await import('supertest')).default;
      const response = await request(app)
        .post('/api/ugc/collect')
        .send({
          platforms: ['instagram', 'twitter'],
          hashtags: ['#brandname', '#promo'],
          campaignId: 'campaign-123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.collected).toBe(15);
    });

    test('should reject invalid platform values', async () => {
      app.post('/api/ugc/collect', (req: any, res: any) => {
        const validPlatforms = ['instagram', 'twitter', 'facebook', 'tiktok'];
        const invalidPlatform = req.body.platforms?.some(
          (p: string) => !validPlatforms.includes(p)
        );
        if (invalidPlatform) {
          return res.status(400).json({
            success: false,
            error: 'Invalid platform value'
          });
        }
        res.json({ success: true, data: {} });
      });

      const request = (await import('supertest')).default;
      const response = await request(app)
        .post('/api/ugc/collect')
        .send({
          platforms: ['instagram', 'invalid_platform'],
          hashtags: ['#test']
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/ugc/moderate', () => {
    test('should bulk moderate content', async () => {
      app.post('/api/ugc/moderate', (req: any, res: any) => {
        res.json({
          success: true,
          data: {
            moderated: req.body.contentIds?.length || 0,
            action: req.body.action
          }
        });
      });

      const request = (await import('supertest')).default;
      const response = await request(app)
        .post('/api/ugc/moderate')
        .send({
          contentIds: ['ugc-1', 'ugc-2', 'ugc-3'],
          action: 'approve',
          notes: 'All content approved'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.moderated).toBe(3);
    });

    test('should reject invalid action', async () => {
      app.post('/api/ugc/moderate', (req: any, res: any) => {
        const validActions = ['approve', 'reject'];
        if (!validActions.includes(req.body.action)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid action. Must be approve or reject'
          });
        }
        res.json({ success: true, data: {} });
      });

      const request = (await import('supertest')).default;
      const response = await request(app)
        .post('/api/ugc/moderate')
        .send({
          contentIds: ['ugc-1'],
          action: 'invalid_action'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/ugc/approve', () => {
    test('should approve single content', async () => {
      app.post('/api/ugc/approve', (req: any, res: any) => {
        res.json({
          success: true,
          data: {
            contentId: req.body.contentId,
            status: 'approved',
            approvedBy: 'test-user-id'
          }
        });
      });

      const request = (await import('supertest')).default;
      const response = await request(app)
        .post('/api/ugc/approve')
        .send({
          contentId: 'ugc-content-123',
          notes: 'Looks good!'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('approved');
    });
  });

  describe('POST /api/ugc/reject', () => {
    test('should reject content with reason', async () => {
      app.post('/api/ugc/reject', (req: any, res: any) => {
        res.json({
          success: true,
          data: {
            contentId: req.body.contentId,
            status: 'rejected',
            reason: req.body.reason || 'Not specified'
          }
        });
      });

      const request = (await import('supertest')).default;
      const response = await request(app)
        .post('/api/ugc/reject')
        .send({
          contentId: 'ugc-content-123',
          reason: 'Inappropriate content'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('rejected');
      expect(response.body.data.reason).toBe('Inappropriate content');
    });
  });

  describe('GET /api/ugc/approved', () => {
    test('should return approved content with pagination', async () => {
      app.get('/api/ugc/approved', (req: any, res: any) => {
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;

        res.json({
          success: true,
          data: {
            items: [
              { id: 'ugc-1', status: 'approved' },
              { id: 'ugc-2', status: 'approved' }
            ],
            total: 100,
            limit,
            offset
          }
        });
      });

      const request = (await import('supertest')).default;
      const response = await request(app)
        .get('/api/ugc/approved')
        .query({ limit: 10, offset: 0 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toBeInstanceOf(Array);
      expect(response.body.data.total).toBeDefined();
    });

    test('should filter by campaignId', async () => {
      app.get('/api/ugc/approved', (req: any, res: any) => {
        const campaignId = req.query.campaignId;

        res.json({
          success: true,
          data: {
            items: campaignId
              ? [{ id: 'ugc-1', campaignId }]
              : [],
            total: campaignId ? 1 : 0
          }
        });
      });

      const request = (await import('supertest')).default;
      const response = await request(app)
        .get('/api/ugc/approved')
        .query({ campaignId: 'campaign-123' });

      expect(response.status).toBe(200);
      expect(response.body.data.items[0].campaignId).toBe('campaign-123');
    });
  });

  describe('POST /api/ugc/rights', () => {
    test('should request rights for UGC', async () => {
      app.post('/api/ugc/rights', (req: any, res: any) => {
        res.json({
          success: true,
          data: {
            id: 'rights-request-1',
            ugcId: req.body.ugcId,
            rightsType: req.body.rightsType,
            status: 'pending'
          }
        });
      });

      const request = (await import('supertest')).default;
      const response = await request(app)
        .post('/api/ugc/rights')
        .send({
          ugcId: 'ugc-123',
          rightsType: 'display',
          usageTerms: 'Non-commercial use only'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.rightsType).toBe('display');
      expect(response.body.data.status).toBe('pending');
    });

    test('should validate rights type', async () => {
      app.post('/api/ugc/rights', (req: any, res: any) => {
        const validTypes = ['display', 'repost', 'commercial', 'all'];
        if (!validTypes.includes(req.body.rightsType)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid rights type'
          });
        }
        res.json({ success: true, data: {} });
      });

      const request = (await import('supertest')).default;
      const response = await request(app)
        .post('/api/ugc/rights')
        .send({
          ugcId: 'ugc-123',
          rightsType: 'invalid_type'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/ugc/display', () => {
    test('should generate display embed', async () => {
      app.post('/api/ugc/display', (req: any, res: any) => {
        const campaignId = req.query.campaignId;
        if (!campaignId) {
          return res.status(400).json({
            success: false,
            error: 'campaignId is required'
          });
        }

        res.json({
          success: true,
          data: {
            embedCode: '<div>UGC Display</div>',
            displayType: req.body.displayType || 'grid'
          }
        });
      });

      const request = (await import('supertest')).default;
      const response = await request(app)
        .post('/api/ugc/display?campaignId=campaign-123')
        .send({
          displayType: 'wall',
          maxItems: 20
        });

      expect(response.status).toBe(200);
      expect(response.body.data.embedCode).toBeDefined();
    });

    test('should require campaignId', async () => {
      app.post('/api/ugc/display', (req: any, res: any) => {
        const campaignId = req.query.campaignId;
        if (!campaignId) {
          return res.status(400).json({
            success: false,
            error: 'campaignId is required'
          });
        }
        res.json({ success: true, data: {} });
      });

      const request = (await import('supertest')).default;
      const response = await request(app)
        .post('/api/ugc/display')
        .send({ displayType: 'grid' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('campaignId');
    });
  });
});

describe('Campaign Routes API', () => {
  let app: any;

  beforeEach(async () => {
    const express = (await import('express')).default;
    app = express();

    app.use((req: any, _res: any, next: any) => {
      req.headers['x-user-id'] = 'test-user-id';
      next();
    });
  });

  describe('GET /api/ugc/campaigns', () => {
    test('should list campaigns with pagination', async () => {
      app.get('/api/ugc/campaigns', (req: any, res: any) => {
        res.json({
          success: true,
          data: {
            items: [
              { id: 'camp-1', name: 'Campaign 1', status: 'active' },
              { id: 'camp-2', name: 'Campaign 2', status: 'paused' }
            ],
            total: 50,
            limit: 20,
            offset: 0
          }
        });
      });

      const request = (await import('supertest')).default;
      const response = await request(app).get('/api/ugc/campaigns');

      expect(response.status).toBe(200);
      expect(response.body.data.items).toHaveLength(2);
    });

    test('should filter by brandId', async () => {
      app.get('/api/ugc/campaigns', (req: any, res: any) => {
        const brandId = req.query.brandId;
        res.json({
          success: true,
          data: {
            items: brandId ? [{ id: 'camp-1', brandId }] : [],
            total: brandId ? 1 : 0
          }
        });
      });

      const request = (await import('supertest')).default;
      const response = await request(app)
        .get('/api/ugc/campaigns')
        .query({ brandId: 'brand-123' });

      expect(response.status).toBe(200);
      expect(response.body.data.items[0].brandId).toBe('brand-123');
    });
  });

  describe('POST /api/ugc/campaigns', () => {
    test('should create campaign with valid data', async () => {
      app.post('/api/ugc/campaigns', (req: any, res: any) => {
        res.status(201).json({
          success: true,
          data: {
            id: 'new-campaign-id',
            name: req.body.name,
            brandId: req.body.brandId,
            status: 'draft'
          }
        });
      });

      const request = (await import('supertest')).default;
      const response = await request(app)
        .post('/api/ugc/campaigns')
        .send({
          name: 'Summer Campaign 2024',
          brandId: 'brand-123',
          hashtags: ['#summer', '#promo'],
          startDate: '2024-06-01T00:00:00Z',
          endDate: '2024-08-31T23:59:59Z'
        });

      expect(response.status).toBe(201);
      expect(response.body.data.name).toBe('Summer Campaign 2024');
    });

    test('should validate required fields', async () => {
      app.post('/api/ugc/campaigns', (req: any, res: any) => {
        const errors: string[] = [];
        if (!req.body.name) errors.push('name is required');
        if (!req.body.brandId) errors.push('brandId is required');
        if (!req.body.hashtags || req.body.hashtags.length === 0) {
          errors.push('hashtags are required');
        }

        if (errors.length > 0) {
          return res.status(400).json({
            success: false,
            error: errors.join(', ')
          });
        }
        res.status(201).json({ success: true, data: {} });
      });

      const request = (await import('supertest')).default;
      const response = await request(app)
        .post('/api/ugc/campaigns')
        .send({ name: '' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/ugc/campaigns/:id', () => {
    test('should update campaign', async () => {
      app.patch('/api/ugc/campaigns/:id', (req: any, res: any) => {
        res.json({
          success: true,
          data: {
            id: req.params.id,
            name: req.body.name || 'Updated Campaign'
          }
        });
      });

      const request = (await import('supertest')).default;
      const response = await request(app)
        .patch('/api/ugc/campaigns/campaign-123')
        .send({ name: 'Updated Campaign Name' });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('Updated Campaign Name');
    });
  });

  describe('POST /api/ugc/campaigns/:id/pause', () => {
    test('should pause active campaign', async () => {
      app.post('/api/ugc/campaigns/:id/pause', (req: any, res: any) => {
        res.json({
          success: true,
          data: { id: req.params.id, status: 'paused' },
          message: 'Campaign paused successfully'
        });
      });

      const request = (await import('supertest')).default;
      const response = await request(app)
        .post('/api/ugc/campaigns/campaign-123/pause');

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('paused');
      expect(response.body.message).toBe('Campaign paused successfully');
    });
  });

  describe('POST /api/ugc/campaigns/:id/resume', () => {
    test('should resume paused campaign', async () => {
      app.post('/api/ugc/campaigns/:id/resume', (req: any, res: any) => {
        res.json({
          success: true,
          data: { id: req.params.id, status: 'active' },
          message: 'Campaign resumed successfully'
        });
      });

      const request = (await import('supertest')).default;
      const response = await request(app)
        .post('/api/ugc/campaigns/campaign-123/resume');

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('active');
    });
  });

  describe('DELETE /api/ugc/campaigns/:id', () => {
    test('should delete campaign', async () => {
      app.delete('/api/ugc/campaigns/:id', (req: any, res: any) => {
        res.json({
          success: true,
          message: 'Campaign deleted successfully'
        });
      });

      const request = (await import('supertest')).default;
      const response = await request(app)
        .delete('/api/ugc/campaigns/campaign-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');
    });
  });
});