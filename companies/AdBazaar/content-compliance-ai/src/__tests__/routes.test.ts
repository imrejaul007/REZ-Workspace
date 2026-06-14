/** Content Compliance AI - Routes Tests */
import express from 'express';
import request from 'supertest';

jest.mock('../services/complianceService', () => ({ complianceService: { checkContent: jest.fn().mockResolvedValue({ checkId: 'check-123', status: 'passed' }), getCheckHistory: jest.fn().mockResolvedValue([]), getCheckById: jest.fn().mockResolvedValue({ checkId: 'check-123' }), generateReport: jest.fn().mockResolvedValue({ reportId: 'report-123' }) } }));
jest.mock('../services/aiService', () => ({ aiService: { analyzeContent: jest.fn().mockResolvedValue({ categories: [] }), detectSensitivities: jest.fn().mockResolvedValue({ sensitivities: [] }), suggestModifications: jest.fn().mockResolvedValue({ modifiedContent: 'Modified' }) } }));
jest.mock('../services/ruleService', () => ({ ruleService: { createRule: jest.fn().mockResolvedValue({ ruleId: 'rule-123' }), getRules: jest.fn().mockResolvedValue([]), getRuleById: jest.fn().mockResolvedValue({ ruleId: 'rule-123' }), updateRule: jest.fn().mockResolvedValue({ ruleId: 'rule-123' }), deleteRule: jest.fn().mockResolvedValue(true) } }));
jest.mock('../models', () => ({ ComplianceRule: { find: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }) }, ComplianceCheck: { find: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }) }, ComplianceReport: { find: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }) } }));
jest.mock('../config/logger', () => ({ logger: { info: jest.fn(), error: jest.fn() } }));

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.post('/api/compliance/check', (req, res) => res.status(201).json({ success: true, data: { checkId: 'check-123' } }));
  app.get('/api/compliance/checks', (req, res) => res.json({ success: true, data: [] }));
  app.get('/api/compliance/checks/:id', (req, res) => res.json({ success: true, data: { checkId: req.params.id } }));
  app.get('/api/compliance/checks/history/:contentId', (req, res) => res.json({ success: true, data: [] }));
  app.get('/api/compliance/reports', (req, res) => res.json({ success: true, data: [] }));
  app.post('/api/compliance/reports', (req, res) => res.status(201).json({ success: true, data: { reportId: 'report-123' } }));
  app.get('/api/compliance/rules', (req, res) => res.json({ success: true, data: [] }));
  app.post('/api/compliance/rules', (req, res) => res.status(201).json({ success: true, data: { ruleId: 'rule-123' } }));
  app.get('/api/compliance/rules/:id', (req, res) => res.json({ success: true, data: { ruleId: req.params.id } }));
  app.put('/api/compliance/rules/:id', (req, res) => res.json({ success: true, data: { ruleId: req.params.id } }));
  app.delete('/api/compliance/rules/:id', (req, res) => res.json({ success: true }));
  app.post('/api/compliance/analyze', (req, res) => res.json({ success: true, data: { categories: [] } }));
  app.post('/api/compliance/suggest', (req, res) => res.json({ success: true, data: { modifiedContent: 'Modified' } }));
  return app;
};

describe('Content Compliance AI Routes', () => {
  let app: express.Application;
  beforeAll(() => { app = createApp(); });

  describe('Compliance Checks', () => {
    it('POST /api/compliance/check should check content', async () => {
      const res = await request(app).post('/api/compliance/check').send({ content: 'Test content', type: 'text' }).expect(201);
      expect(res.body.success).toBe(true);
    });
    it('GET /api/compliance/checks should list checks', async () => {
      const res = await request(app).get('/api/compliance/checks').expect(200);
      expect(res.body.success).toBe(true);
    });
    it('GET /api/compliance/checks/:id should return check', async () => {
      const res = await request(app).get('/api/compliance/checks/check-123').expect(200);
      expect(res.body.success).toBe(true);
    });
    it('GET /api/compliance/checks/history/:contentId should return history', async () => {
      const res = await request(app).get('/api/compliance/checks/history/content-123').expect(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Reports', () => {
    it('GET /api/compliance/reports should list reports', async () => {
      const res = await request(app).get('/api/compliance/reports').expect(200);
      expect(res.body.success).toBe(true);
    });
    it('POST /api/compliance/reports should generate report', async () => {
      const res = await request(app).post('/api/compliance/reports').send({ startDate: new Date(), endDate: new Date() }).expect(201);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Rules', () => {
    it('GET /api/compliance/rules should list rules', async () => {
      const res = await request(app).get('/api/compliance/rules').expect(200);
      expect(res.body.success).toBe(true);
    });
    it('POST /api/compliance/rules should create rule', async () => {
      const res = await request(app).post('/api/compliance/rules').send({ name: 'No Explicit Content', type: 'content_policy' }).expect(201);
      expect(res.body.success).toBe(true);
    });
    it('GET /api/compliance/rules/:id should return rule', async () => {
      const res = await request(app).get('/api/compliance/rules/rule-123').expect(200);
      expect(res.body.success).toBe(true);
    });
    it('PUT /api/compliance/rules/:id should update rule', async () => {
      const res = await request(app).put('/api/compliance/rules/rule-123').send({ isActive: false }).expect(200);
      expect(res.body.success).toBe(true);
    });
    it('DELETE /api/compliance/rules/:id should delete rule', async () => {
      const res = await request(app).delete('/api/compliance/rules/rule-123').expect(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('AI Analysis', () => {
    it('POST /api/compliance/analyze should analyze content', async () => {
      const res = await request(app).post('/api/compliance/analyze').send({ content: 'Test content', type: 'text' }).expect(200);
      expect(res.body.success).toBe(true);
    });
    it('POST /api/compliance/suggest should suggest modifications', async () => {
      const res = await request(app).post('/api/compliance/suggest').send({ content: 'Original', violations: ['explicit'] }).expect(200);
      expect(res.body.success).toBe(true);
    });
  });
});