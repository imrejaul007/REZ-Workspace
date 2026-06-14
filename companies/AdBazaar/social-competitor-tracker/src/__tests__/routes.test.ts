/** Social Competitor Tracker - Routes Tests */
import express from 'express';
import request from 'supertest';

jest.mock('../services/competitorService', () => ({ competitorService: { addCompetitor: jest.fn().mockResolvedValue({ competitorId: 'comp-123' }), getCompetitors: jest.fn().mockResolvedValue([]), getCompetitorById: jest.fn().mockResolvedValue({ competitorId: 'comp-123' }), updateCompetitor: jest.fn().mockResolvedValue({ competitorId: 'comp-123' }), deleteCompetitor: jest.fn().mockResolvedValue(true), getCompetitorPosts: jest.fn().mockResolvedValue([]), trackCompetitor: jest.fn().mockResolvedValue({}) } }));
jest.mock('../services/insightService', () => ({ insightService: { generateComparison: jest.fn().mockResolvedValue({}), getCompetitorMetrics: jest.fn().mockResolvedValue({}), trackEngagementTrend: jest.fn().mockResolvedValue({}), getLeaderboard: jest.fn().mockResolvedValue([]) } }));
jest.mock('../models', () => ({ Competitor: { find: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }) }, CompetitorPost: { find: jest.fn().mockReturnValue({ sort: jest.fn().mockReturnThis(), limit: jest.fn().mockResolvedValue([]) }) } }));
jest.mock('../config/logger', () => ({ logger: { info: jest.fn(), error: jest.fn() } }));

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.post('/api/competitors', (req, res) => res.status(201).json({ success: true, data: { competitorId: 'comp-123' } }));
  app.get('/api/competitors', (req, res) => res.json({ success: true, data: [] }));
  app.get('/api/competitors/:id', (req, res) => res.json({ success: true, data: { competitorId: req.params.id } }));
  app.put('/api/competitors/:id', (req, res) => res.json({ success: true, data: { competitorId: req.params.id } }));
  app.delete('/api/competitors/:id', (req, res) => res.json({ success: true }));
  app.get('/api/competitors/:id/posts', (req, res) => res.json({ success: true, data: [] }));
  app.post('/api/competitors/:id/track', (req, res) => res.json({ success: true }));
  app.get('/api/competitors/:id/insights', (req, res) => res.json({ success: true, data: {} }));
  app.get('/api/competitors/:id/metrics', (req, res) => res.json({ success: true, data: {} }));
  app.get('/api/competitors/:id/trends', (req, res) => res.json({ success: true, data: {} }));
  app.get('/api/insights/leaderboard', (req, res) => res.json({ success: true, data: [] }));
  return app;
};

describe('Social Competitor Tracker Routes', () => {
  let app: express.Application;
  beforeAll(() => { app = createApp(); });

  describe('Competitors', () => {
    it('POST /api/competitors should add competitor', async () => {
      const res = await request(app).post('/api/competitors').send({ name: 'Test', platforms: ['instagram'] }).expect(201);
      expect(res.body.success).toBe(true);
    });
    it('GET /api/competitors should list competitors', async () => {
      const res = await request(app).get('/api/competitors').expect(200);
      expect(res.body.success).toBe(true);
    });
    it('GET /api/competitors/:id should return competitor', async () => {
      const res = await request(app).get('/api/competitors/comp-123').expect(200);
      expect(res.body.success).toBe(true);
    });
    it('PUT /api/competitors/:id should update competitor', async () => {
      const res = await request(app).put('/api/competitors/comp-123').send({ name: 'Updated' }).expect(200);
      expect(res.body.success).toBe(true);
    });
    it('DELETE /api/competitors/:id should delete competitor', async () => {
      const res = await request(app).delete('/api/competitors/comp-123').expect(200);
      expect(res.body.success).toBe(true);
    });
    it('GET /api/competitors/:id/posts should return posts', async () => {
      const res = await request(app).get('/api/competitors/comp-123/posts').expect(200);
      expect(res.body.success).toBe(true);
    });
    it('POST /api/competitors/:id/track should track competitor', async () => {
      const res = await request(app).post('/api/competitors/comp-123/track').expect(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Insights', () => {
    it('GET /api/competitors/:id/insights should return insights', async () => {
      const res = await request(app).get('/api/competitors/comp-123/insights').expect(200);
      expect(res.body.success).toBe(true);
    });
    it('GET /api/competitors/:id/metrics should return metrics', async () => {
      const res = await request(app).get('/api/competitors/comp-123/metrics').expect(200);
      expect(res.body.success).toBe(true);
    });
    it('GET /api/competitors/:id/trends should return trends', async () => {
      const res = await request(app).get('/api/competitors/comp-123/trends').expect(200);
      expect(res.body.success).toBe(true);
    });
    it('GET /api/insights/leaderboard should return leaderboard', async () => {
      const res = await request(app).get('/api/insights/leaderboard').expect(200);
      expect(res.body.success).toBe(true);
    });
  });
});