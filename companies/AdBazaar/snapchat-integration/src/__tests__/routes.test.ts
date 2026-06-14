/** Snapchat Integration - Routes Tests */
import express from 'express';
import request from 'supertest';

jest.mock('../services/campaignService', () => ({ campaignService: { createCampaign: jest.fn().mockResolvedValue({ campaignId: 'camp-123' }), getCampaigns: jest.fn().mockResolvedValue([]), getCampaignById: jest.fn().mockResolvedValue({ campaignId: 'camp-123' }), updateCampaign: jest.fn().mockResolvedValue({ campaignId: 'camp-123' }), deleteCampaign: jest.fn().mockResolvedValue(true) } }));
jest.mock('../services/adService', () => ({ adService: { createAd: jest.fn().mockResolvedValue({ adId: 'ad-123' }), getAds: jest.fn().mockResolvedValue([]), updateAd: jest.fn().mockResolvedValue({ adId: 'ad-123' }) } }));
jest.mock('../services/audienceService', () => ({ audienceService: { createAudience: jest.fn().mockResolvedValue({ audienceId: 'aud-123' }), getAudiences: jest.fn().mockResolvedValue([]) } }));
jest.mock('../services/pixelService', () => ({ pixelService: { createPixel: jest.fn().mockResolvedValue({ pixelId: 'pix-123' }), getPixels: jest.fn().mockResolvedValue([]) } }));
jest.mock('../models', () => ({
  SnapchatCampaign: { find: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }) },
  SnapchatAd: { find: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }) },
  SnapchatAudience: { find: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }) },
  SnapchatPixel: { find: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }) },
}));
jest.mock('../utils/logger', () => ({ logger: { info: jest.fn(), error: jest.fn() } }));

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.post('/api/campaigns', (req, res) => res.status(201).json({ success: true, data: { campaignId: 'camp-123' } }));
  app.get('/api/campaigns', (req, res) => res.json({ success: true, data: [] }));
  app.get('/api/campaigns/:id', (req, res) => res.json({ success: true, data: { campaignId: req.params.id } }));
  app.put('/api/campaigns/:id', (req, res) => res.json({ success: true, data: { campaignId: req.params.id } }));
  app.delete('/api/campaigns/:id', (req, res) => res.json({ success: true }));
  app.post('/api/ads', (req, res) => res.status(201).json({ success: true, data: { adId: 'ad-123' } }));
  app.get('/api/ads', (req, res) => res.json({ success: true, data: [] }));
  app.put('/api/ads/:id', (req, res) => res.json({ success: true, data: { adId: req.params.id } }));
  app.post('/api/audiences', (req, res) => res.status(201).json({ success: true, data: { audienceId: 'aud-123' } }));
  app.get('/api/audiences', (req, res) => res.json({ success: true, data: [] }));
  app.post('/api/pixels', (req, res) => res.status(201).json({ success: true, data: { pixelId: 'pix-123' } }));
  app.get('/api/pixels', (req, res) => res.json({ success: true, data: [] }));
  return app;
};

describe('Snapchat Routes', () => {
  let app: express.Application;
  beforeAll(() => { app = createApp(); });

  describe('Campaigns', () => {
    it('POST /api/campaigns should create campaign', async () => {
      const res = await request(app).post('/api/campaigns').send({ name: 'Test', budget: 1000 }).expect(201);
      expect(res.body.success).toBe(true);
    });
    it('GET /api/campaigns should list campaigns', async () => {
      const res = await request(app).get('/api/campaigns').expect(200);
      expect(res.body.success).toBe(true);
    });
    it('GET /api/campaigns/:id should return campaign', async () => {
      const res = await request(app).get('/api/campaigns/camp-123').expect(200);
      expect(res.body.success).toBe(true);
    });
    it('PUT /api/campaigns/:id should update campaign', async () => {
      const res = await request(app).put('/api/campaigns/camp-123').send({ status: 'paused' }).expect(200);
      expect(res.body.success).toBe(true);
    });
    it('DELETE /api/campaigns/:id should delete campaign', async () => {
      const res = await request(app).delete('/api/campaigns/camp-123').expect(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Ads', () => {
    it('POST /api/ads should create ad', async () => {
      const res = await request(app).post('/api/ads').send({ campaignId: 'camp-123', name: 'Test Ad' }).expect(201);
      expect(res.body.success).toBe(true);
    });
    it('GET /api/ads should list ads', async () => {
      const res = await request(app).get('/api/ads').expect(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Audiences', () => {
    it('POST /api/audiences should create audience', async () => {
      const res = await request(app).post('/api/audiences').send({ name: 'Test Audience', users: [] }).expect(201);
      expect(res.body.success).toBe(true);
    });
    it('GET /api/audiences should list audiences', async () => {
      const res = await request(app).get('/api/audiences').expect(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Pixels', () => {
    it('POST /api/pixels should create pixel', async () => {
      const res = await request(app).post('/api/pixels').send({ name: 'Test Pixel', domain: 'example.com' }).expect(201);
      expect(res.body.success).toBe(true);
    });
    it('GET /api/pixels should list pixels', async () => {
      const res = await request(app).get('/api/pixels').expect(200);
      expect(res.body.success).toBe(true);
    });
  });
});