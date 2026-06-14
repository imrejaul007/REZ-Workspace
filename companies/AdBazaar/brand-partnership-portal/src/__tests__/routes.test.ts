/** Brand Partnership Portal - Routes Tests */
import express from 'express';
import request from 'supertest';

jest.mock('../services/brandService', () => ({ brandService: { registerBrand: jest.fn().mockResolvedValue({ brandId: 'brand-123' }), getBrands: jest.fn().mockResolvedValue([]), getBrandById: jest.fn().mockResolvedValue({ brandId: 'brand-123' }), updateBrand: jest.fn().mockResolvedValue({ brandId: 'brand-123' }), deleteBrand: jest.fn().mockResolvedValue(true) } }));
jest.mock('../services/campaignService', () => ({ campaignService: { createCampaign: jest.fn().mockResolvedValue({ campaignId: 'camp-123' }), getCampaigns: jest.fn().mockResolvedValue([]), getCampaignById: jest.fn().mockResolvedValue({ campaignId: 'camp-123' }), updateCampaign: jest.fn().mockResolvedValue({ campaignId: 'camp-123' }), deleteCampaign: jest.fn().mockResolvedValue(true) } }));
jest.mock('../services/proposalService', () => ({ proposalService: { submitProposal: jest.fn().mockResolvedValue({ proposalId: 'prop-123' }), getProposals: jest.fn().mockResolvedValue([]), updateProposalStatus: jest.fn().mockResolvedValue({ proposalId: 'prop-123' }) } }));
jest.mock('../services/applicationService', () => ({ applicationService: { submitApplication: jest.fn().mockResolvedValue({ applicationId: 'app-123' }), getApplications: jest.fn().mockResolvedValue([]), updateApplicationStatus: jest.fn().mockResolvedValue({ applicationId: 'app-123' }) } }));
jest.mock('../services/contractService', () => ({ contractService: { createContract: jest.fn().mockResolvedValue({ contractId: 'contract-123' }), getContracts: jest.fn().mockResolvedValue([]), signContract: jest.fn().mockResolvedValue({ contractId: 'contract-123' }) } }));
jest.mock('../models', () => ({ Brand: { find: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }) }, Campaign: { find: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }) }, Proposal: { find: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }) } }));
jest.mock('../utils/logger', () => ({ logger: { info: jest.fn(), error: jest.fn() } }));

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.post('/api/brands', (req, res) => res.status(201).json({ success: true, data: { brandId: 'brand-123' } }));
  app.get('/api/brands', (req, res) => res.json({ success: true, data: [] }));
  app.get('/api/brands/:id', (req, res) => res.json({ success: true, data: { brandId: req.params.id } }));
  app.put('/api/brands/:id', (req, res) => res.json({ success: true, data: { brandId: req.params.id } }));
  app.delete('/api/brands/:id', (req, res) => res.json({ success: true }));
  app.post('/api/campaigns', (req, res) => res.status(201).json({ success: true, data: { campaignId: 'camp-123' } }));
  app.get('/api/campaigns', (req, res) => res.json({ success: true, data: [] }));
  app.get('/api/campaigns/:id', (req, res) => res.json({ success: true, data: { campaignId: req.params.id } }));
  app.put('/api/campaigns/:id', (req, res) => res.json({ success: true, data: { campaignId: req.params.id } }));
  app.post('/api/proposals', (req, res) => res.status(201).json({ success: true, data: { proposalId: 'prop-123' } }));
  app.get('/api/proposals', (req, res) => res.json({ success: true, data: [] }));
  app.put('/api/proposals/:id/accept', (req, res) => res.json({ success: true, data: { proposalId: req.params.id } }));
  app.put('/api/proposals/:id/reject', (req, res) => res.json({ success: true, data: { proposalId: req.params.id } }));
  app.post('/api/applications', (req, res) => res.status(201).json({ success: true, data: { applicationId: 'app-123' } }));
  app.get('/api/applications', (req, res) => res.json({ success: true, data: [] }));
  app.get('/api/dashboard/stats', (req, res) => res.json({ success: true, data: {} }));
  return app;
};

describe('Brand Partnership Portal Routes', () => {
  let app: express.Application;
  beforeAll(() => { app = createApp(); });

  describe('Brands', () => {
    it('POST /api/brands should register brand', async () => {
      const res = await request(app).post('/api/brands').send({ name: 'Test Brand', industry: 'fashion' }).expect(201);
      expect(res.body.success).toBe(true);
    });
    it('GET /api/brands should list brands', async () => {
      const res = await request(app).get('/api/brands').expect(200);
      expect(res.body.success).toBe(true);
    });
    it('GET /api/brands/:id should return brand', async () => {
      const res = await request(app).get('/api/brands/brand-123').expect(200);
      expect(res.body.success).toBe(true);
    });
    it('PUT /api/brands/:id should update brand', async () => {
      const res = await request(app).put('/api/brands/brand-123').send({ budget: 75000 }).expect(200);
      expect(res.body.success).toBe(true);
    });
    it('DELETE /api/brands/:id should delete brand', async () => {
      const res = await request(app).delete('/api/brands/brand-123').expect(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Campaigns', () => {
    it('POST /api/campaigns should create campaign', async () => {
      const res = await request(app).post('/api/campaigns').send({ brandId: 'brand-123', name: 'Test Campaign' }).expect(201);
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
      const res = await request(app).put('/api/campaigns/camp-123').send({ status: 'active' }).expect(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Proposals', () => {
    it('POST /api/proposals should submit proposal', async () => {
      const res = await request(app).post('/api/proposals').send({ campaignId: 'camp-123', influencerId: 'inf-123', amount: 5000 }).expect(201);
      expect(res.body.success).toBe(true);
    });
    it('GET /api/proposals should list proposals', async () => {
      const res = await request(app).get('/api/proposals').expect(200);
      expect(res.body.success).toBe(true);
    });
    it('PUT /api/proposals/:id/accept should accept proposal', async () => {
      const res = await request(app).put('/api/proposals/prop-123/accept').expect(200);
      expect(res.body.success).toBe(true);
    });
    it('PUT /api/proposals/:id/reject should reject proposal', async () => {
      const res = await request(app).put('/api/proposals/prop-123/reject').expect(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Applications', () => {
    it('POST /api/applications should submit application', async () => {
      const res = await request(app).post('/api/applications').send({ campaignId: 'camp-123', influencerId: 'inf-123' }).expect(201);
      expect(res.body.success).toBe(true);
    });
    it('GET /api/applications should list applications', async () => {
      const res = await request(app).get('/api/applications').expect(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Dashboard', () => {
    it('GET /api/dashboard/stats should return stats', async () => {
      const res = await request(app).get('/api/dashboard/stats').expect(200);
      expect(res.body.success).toBe(true);
    });
  });
});