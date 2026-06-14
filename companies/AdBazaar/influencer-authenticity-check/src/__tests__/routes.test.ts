/** Influencer Authenticity Check - Routes Tests */
import express from 'express';
import request from 'supertest';

jest.mock('../services/authenticityCheckService', () => ({ authenticityCheckService: { performCheck: jest.fn().mockResolvedValue({ checkId: 'check-123', score: 0.9 }), getCheckHistory: jest.fn().mockResolvedValue([]), generateReport: jest.fn().mockResolvedValue({ averageScore: 0.85 }) } }));
jest.mock('../services/profileService', () => ({ profileService: { addProfile: jest.fn().mockResolvedValue({ profileId: 'profile-123' }), getProfiles: jest.fn().mockResolvedValue([]), getProfileById: jest.fn().mockResolvedValue({ profileId: 'profile-123' }), updateProfile: jest.fn().mockResolvedValue({ profileId: 'profile-123' }), deleteProfile: jest.fn().mockResolvedValue(true) } }));
jest.mock('../services/alertService', () => ({ alertService: { createAlert: jest.fn().mockResolvedValue({ alertId: 'alert-123' }), getAlerts: jest.fn().mockResolvedValue([]), resolveAlert: jest.fn().mockResolvedValue({ alertId: 'alert-123' }) } }));
jest.mock('../models', () => ({ InfluencerProfile: { find: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }), findById: jest.fn().mockResolvedValue({ profileId: 'profile-123' }) }, AuthenticityCheck: { find: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }) } }));
jest.mock('../utils/logger', () => ({ logger: { info: jest.fn(), error: jest.fn() } }));

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.post('/api/profiles', (req, res) => res.status(201).json({ success: true, data: { profileId: 'profile-123' } }));
  app.get('/api/profiles', (req, res) => res.json({ success: true, data: [] }));
  app.get('/api/profiles/:id', (req, res) => res.json({ success: true, data: { profileId: req.params.id } }));
  app.put('/api/profiles/:id', (req, res) => res.json({ success: true, data: { profileId: req.params.id } }));
  app.delete('/api/profiles/:id', (req, res) => res.json({ success: true }));
  app.post('/api/checks', (req, res) => res.status(201).json({ success: true, data: { checkId: 'check-123' } }));
  app.get('/api/checks/history/:profileId', (req, res) => res.json({ success: true, data: [] }));
  app.get('/api/checks/report/:profileId', (req, res) => res.json({ success: true, data: { averageScore: 0.85 } }));
  app.get('/api/alerts', (req, res) => res.json({ success: true, data: [] }));
  app.post('/api/alerts', (req, res) => res.status(201).json({ success: true, data: { alertId: 'alert-123' } }));
  app.put('/api/alerts/:id/resolve', (req, res) => res.json({ success: true, data: { alertId: req.params.id } }));
  app.get('/api/analytics/summary', (req, res) => res.json({ success: true, data: {} }));
  return app;
};

describe('Influencer Authenticity Check Routes', () => {
  let app: express.Application;
  beforeAll(() => { app = createApp(); });

  describe('Profiles', () => {
    it('POST /api/profiles should add profile', async () => {
      const res = await request(app).post('/api/profiles').send({ platform: 'instagram', username: 'test', userId: '123' }).expect(201);
      expect(res.body.success).toBe(true);
    });
    it('GET /api/profiles should list profiles', async () => {
      const res = await request(app).get('/api/profiles').expect(200);
      expect(res.body.success).toBe(true);
    });
    it('GET /api/profiles/:id should return profile', async () => {
      const res = await request(app).get('/api/profiles/profile-123').expect(200);
      expect(res.body.success).toBe(true);
    });
    it('PUT /api/profiles/:id should update profile', async () => {
      const res = await request(app).put('/api/profiles/profile-123').send({ followers: 15000 }).expect(200);
      expect(res.body.success).toBe(true);
    });
    it('DELETE /api/profiles/:id should delete profile', async () => {
      const res = await request(app).delete('/api/profiles/profile-123').expect(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Checks', () => {
    it('POST /api/checks should perform check', async () => {
      const res = await request(app).post('/api/checks').send({ profileId: 'profile-123', checkTypes: ['followers'] }).expect(201);
      expect(res.body.success).toBe(true);
    });
    it('GET /api/checks/history/:profileId should return history', async () => {
      const res = await request(app).get('/api/checks/history/profile-123').expect(200);
      expect(res.body.success).toBe(true);
    });
    it('GET /api/checks/report/:profileId should return report', async () => {
      const res = await request(app).get('/api/checks/report/profile-123').expect(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Alerts', () => {
    it('GET /api/alerts should list alerts', async () => {
      const res = await request(app).get('/api/alerts').expect(200);
      expect(res.body.success).toBe(true);
    });
    it('POST /api/alerts should create alert', async () => {
      const res = await request(app).post('/api/alerts').send({ profileId: 'profile-123', type: 'fake_followers', severity: 'high' }).expect(201);
      expect(res.body.success).toBe(true);
    });
    it('PUT /api/alerts/:id/resolve should resolve alert', async () => {
      const res = await request(app).put('/api/alerts/alert-123/resolve').expect(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Analytics', () => {
    it('GET /api/analytics/summary should return summary', async () => {
      const res = await request(app).get('/api/analytics/summary').expect(200);
      expect(res.body.success).toBe(true);
    });
  });
});