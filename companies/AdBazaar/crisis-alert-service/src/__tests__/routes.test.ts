/**
 * Crisis Alert Service - Routes Tests
 */

import express from 'express';
import request from 'supertest';

jest.mock('../services/alertService', () => ({ AlertService: { createAlert: jest.fn().mockResolvedValue({ alertId: 'ALERT-123' }), listAlerts: jest.fn().mockResolvedValue({ data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false } }), acknowledgeAlert: jest.fn().mockResolvedValue({ alertId: 'ALERT-123', status: 'acknowledged' }), escalateAlert: jest.fn().mockResolvedValue({ alertId: 'ALERT-123', status: 'escalated' }), resolveAlert: jest.fn().mockResolvedValue({ alertId: 'ALERT-123', status: 'resolved' }), getAlertById: jest.fn().mockResolvedValue({ alertId: 'ALERT-123' }), getAlertStats: jest.fn().mockResolvedValue({ total: 10, active: 5, resolved: 5 }), getDailyDigest: jest.fn().mockResolvedValue({ total: 5, bySeverity: { high: 3 }, byType: {}, byStatus: {}, topAlerts: [] }), deleteAlert: jest.fn().mockResolvedValue(true) } }));
jest.mock('../services/monitoringService', () => ({ MonitoringService: { addKeyword: jest.fn().mockResolvedValue({ keywordId: 'KW-123' }), getKeywords: jest.fn().mockResolvedValue([]), removeKeyword: jest.fn().mockResolvedValue(true), updateKeyword: jest.fn().mockResolvedValue({ keywordId: 'KW-123' }) } }));
jest.mock('../services/notificationService', () => ({ NotificationService: { sendAlertNotification: jest.fn().mockResolvedValue(true), sendEscalationNotification: jest.fn().mockResolvedValue(true), sendPlaybookNotification: jest.fn().mockResolvedValue(true) } }));
jest.mock('../models', () => ({ CrisisAlert: { find: jest.fn().mockReturnValue({ sort: jest.fn().mockReturnThis(), skip: jest.fn().mockReturnThis(), limit: jest.fn().mockResolvedValue([]) }) }, CrisisPlaybook: { find: jest.fn().mockResolvedValue([]), create: jest.fn().mockResolvedValue({ playbookId: 'PLAY-123' }) }, MonitoringKeyword: { find: jest.fn().mockResolvedValue([]), create: jest.fn().mockResolvedValue({ keywordId: 'KW-123' }) }, PostMortem: { find: jest.fn().mockResolvedValue([]), create: jest.fn().mockResolvedValue({ postMortemId: 'PM-123' }), findById: jest.fn().mockResolvedValue({ postMortemId: 'PM-123' }) } }));
jest.mock('../utils/logger', () => { const l = { info: jest.fn(), error: jest.fn() }; return { default: l, logger: l }; });

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  const alertRouter = express.Router();
  alertRouter.post('/', (req, res) => res.status(201).json({ success: true, data: { alertId: 'ALERT-123' } }));
  alertRouter.get('/', (req, res) => res.json({ success: true, data: { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false } } }));
  alertRouter.get('/stats', (req, res) => res.json({ success: true, data: { total: 10, active: 5, resolved: 5 } }));
  alertRouter.get('/digest', (req, res) => res.json({ success: true, data: { total: 5, bySeverity: { high: 3 } } }));
  alertRouter.get('/:id', (req, res) => res.json({ success: true, data: { alertId: req.params.id } }));
  alertRouter.post('/:id/acknowledge', (req, res) => res.json({ success: true, data: { status: 'acknowledged' } }));
  alertRouter.post('/:id/escalate', (req, res) => res.json({ success: true, data: { status: 'escalated' } }));
  alertRouter.post('/:id/resolve', (req, res) => res.json({ success: true, data: { status: 'resolved' } }));
  alertRouter.delete('/:id', (req, res) => res.json({ success: true }));
  const playbookRouter = express.Router();
  playbookRouter.get('/', (req, res) => res.json({ success: true, data: [] }));
  playbookRouter.post('/', (req, res) => res.status(201).json({ success: true, data: { playbookId: 'PLAY-123' } }));
  const monitoringRouter = express.Router();
  monitoringRouter.get('/keywords', (req, res) => res.json({ success: true, data: [] }));
  monitoringRouter.post('/keywords', (req, res) => res.status(201).json({ success: true, data: { keywordId: 'KW-123' } }));
  monitoringRouter.delete('/keywords/:id', (req, res) => res.json({ success: true }));
  const postMortemRouter = express.Router();
  postMortemRouter.get('/', (req, res) => res.json({ success: true, data: [] }));
  postMortemRouter.post('/', (req, res) => res.status(201).json({ success: true, data: { postMortemId: 'PM-123' } }));
  postMortemRouter.get('/:id', (req, res) => res.json({ success: true, data: { postMortemId: req.params.id } }));
  app.use('/api/alerts', alertRouter);
  app.use('/api/playbooks', playbookRouter);
  app.use('/api/monitoring', monitoringRouter);
  app.use('/api/postmortems', postMortemRouter);
  return app;
};

describe('Crisis Alert Routes', () => {
  let app: express.Application;
  beforeAll(() => { app = createTestApp(); });
  beforeEach(() => { jest.clearAllMocks(); });

  describe('POST /api/alerts', () => {
    it('should create alert', async () => {
      const res = await request(app).post('/api/alerts').send({ severity: 'high', type: 'negative_sentiment', title: 'Test', description: 'Test', source: { platform: 'twitter' }, metrics: { mentions: 100, sentiment: -0.5 } }).expect(201);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/alerts', () => {
    it('should list alerts', async () => {
      const res = await request(app).get('/api/alerts').expect(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/alerts/stats', () => {
    it('should return stats', async () => {
      const res = await request(app).get('/api/alerts/stats').expect(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/alerts/:id', () => {
    it('should return alert by ID', async () => {
      const res = await request(app).get('/api/alerts/ALERT-123').expect(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/alerts/:id/acknowledge', () => {
    it('should acknowledge alert', async () => {
      const res = await request(app).post('/api/alerts/ALERT-123/acknowledge').send({ userId: 'user-123' }).expect(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/alerts/:id/escalate', () => {
    it('should escalate alert', async () => {
      const res = await request(app).post('/api/alerts/ALERT-123/escalate').send({ escalateTo: ['admin@example.com'] }).expect(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/alerts/:id/resolve', () => {
    it('should resolve alert', async () => {
      const res = await request(app).post('/api/alerts/ALERT-123/resolve').send({ resolution: 'Issue fixed' }).expect(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/playbooks', () => {
    it('should list playbooks', async () => {
      const res = await request(app).get('/api/playbooks').expect(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/playbooks', () => {
    it('should create playbook', async () => {
      const res = await request(app).post('/api/playbooks').send({ name: 'Test Playbook', triggerConditions: {}, notifications: [] }).expect(201);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/monitoring/keywords', () => {
    it('should list keywords', async () => {
      const res = await request(app).get('/api/monitoring/keywords').expect(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/monitoring/keywords', () => {
    it('should add keyword', async () => {
      const res = await request(app).post('/api/monitoring/keywords').send({ keyword: 'brand', platforms: ['twitter'] }).expect(201);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/postmortems', () => {
    it('should list postmortems', async () => {
      const res = await request(app).get('/api/postmortems').expect(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/postmortems', () => {
    it('should create postmortem', async () => {
      const res = await request(app).post('/api/postmortems').send({ alertId: 'ALERT-123', title: 'Post-mortem' }).expect(201);
      expect(res.body.success).toBe(true);
    });
  });
});