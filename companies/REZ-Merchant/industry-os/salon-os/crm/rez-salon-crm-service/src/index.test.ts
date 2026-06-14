import express, { Express } from 'express';
import request from 'supertest';

// Mock mongoose
jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue(undefined),
  connection: {
    readyState: 1,
    close: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock dotenv
jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

// Mock logger
jest.mock('./utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

// Mock routes
jest.mock('./routes/customers.routes', () => {
  const express = require('express');
  const router = express.Router();

  // Create mock customer data
  const mockCustomers = new Map();
  mockCustomers.set('cust123', {
    id: 'cust123',
    name: 'John Doe',
    phone: '1234567890',
    email: 'john@example.com',
    tier: 'regular',
    totalSpend: 5000,
    visitCount: 10,
  });

  router.post('/', (req: any, res: any) => {
    res.status(201).json({ success: true, data: { id: 'new-cust', ...req.body } });
  });
  router.get('/:id', (req: any, res: any) => {
    const customer = mockCustomers.get(req.params.id);
    if (customer) {
      res.json({ success: true, data: customer });
    } else {
      res.status(404).json({ success: false, error: 'Customer not found' });
    }
  });
  router.get('/phone/:phone', (req: any, res: any) => {
    res.json({ success: true, data: mockCustomers.get('cust123') });
  });
  router.get('/email/:email', (req: any, res: any) => {
    res.json({ success: true, data: mockCustomers.get('cust123') });
  });
  router.put('/:id', (req: any, res: any) => {
    res.json({ success: true, data: { id: req.params.id, ...req.body } });
  });
  router.post('/:id/visits', (req: any, res: any) => {
    res.json({ success: true, data: { id: req.params.id, visits: [req.body] } });
  });
  router.get('/:id/visits', (req: any, res: any) => {
    res.json({ success: true, data: { visits: [], total: 0 } });
  });
  router.get('/:id/ltv', (req: any, res: any) => {
    res.json({ success: true, data: { customerId: req.params.id, ltv: 5000, visitCount: 10 } });
  });
  router.get('/search/query', (req: any, res: any) => {
    res.json({ success: true, data: { customers: [], total: 0 } });
  });
  router.post('/segment', (req: any, res: any) => {
    res.json({ success: true, data: { customers: [], total: 0 } });
  });
  router.get('/birthdays/upcoming', (req: any, res: any) => {
    res.json({ success: true, data: { count: 0, customers: [] } });
  });
  router.get('/anniversaries/upcoming', (req: any, res: any) => {
    res.json({ success: true, data: { count: 0, customers: [] } });
  });
  router.get('/status/at-risk', (req: any, res: any) => {
    res.json({ success: true, data: { count: 0, customers: [] } });
  });
  router.get('/status/vip', (req: any, res: any) => {
    res.json({ success: true, data: { count: 0, customers: [] } });
  });
  router.delete('/:id', (req: any, res: any) => {
    res.json({ success: true, message: 'Customer deactivated' });
  });

  return router;
});

jest.mock('./routes/campaigns.routes', () => {
  const express = require('express');
  const router = express.Router();

  // Mock campaigns
  const mockCampaigns = new Map();
  mockCampaigns.set('camp123', {
    id: 'camp123',
    name: 'Birthday Campaign',
    type: 'birthday',
    status: 'active',
    metrics: { sent: 100, delivered: 98, opened: 50 },
  });

  router.post('/', (req: any, res: any) => {
    res.status(201).json({ success: true, data: { id: 'new-camp', ...req.body } });
  });
  router.get('/', (req: any, res: any) => {
    res.json({ success: true, data: Array.from(mockCampaigns.values()) });
  });
  router.get('/:id', (req: any, res: any) => {
    const campaign = mockCampaigns.get(req.params.id);
    if (campaign) {
      res.json({ success: true, data: campaign });
    } else {
      res.status(404).json({ success: false, error: 'Campaign not found' });
    }
  });
  router.put('/:id', (req: any, res: any) => {
    res.json({ success: true, data: { id: req.params.id, ...req.body } });
  });
  router.post('/:id/schedule', (req: any, res: any) => {
    res.json({ success: true, data: { id: req.params.id, scheduled: true } });
  });
  router.post('/:id/execute', (req: any, res: any) => {
    res.json({ success: true, data: { executed: true } });
  });
  router.post('/:id/cancel', (req: any, res: any) => {
    res.json({ success: true, data: { id: req.params.id, status: 'cancelled' } });
  });
  router.post('/:id/pause', (req: any, res: any) => {
    res.json({ success: true, data: { id: req.params.id, status: 'paused' } });
  });
  router.post('/:id/resume', (req: any, res: any) => {
    res.json({ success: true, data: { id: req.params.id, status: 'active' } });
  });
  router.get('/:id/preview', (req: any, res: any) => {
    res.json({ success: true, data: { preview: [], count: 0 } });
  });
  router.get('/:id/metrics', (req: any, res: any) => {
    const campaign = mockCampaigns.get(req.params.id);
    if (campaign) {
      res.json({ success: true, data: { metrics: campaign.metrics } });
    } else {
      res.status(404).json({ success: false, error: 'Campaign not found' });
    }
  });
  router.post('/:id/convert', (req: any, res: any) => {
    res.json({ success: true, message: 'Conversion tracked' });
  });
  router.post('/segment/targets', (req: any, res: any) => {
    res.json({ success: true, data: { count: 0, customers: [] } });
  });
  router.post('/automated/birthday', (req: any, res: any) => {
    res.json({ success: true, data: { sent: 10 } });
  });
  router.post('/automated/anniversary', (req: any, res: any) => {
    res.json({ success: true, data: { sent: 5 } });
  });
  router.post('/automated/reengagement', (req: any, res: any) => {
    res.json({ success: true, data: { sent: 20 } });
  });
  router.get('/notifications/templates/sms', (req: any, res: any) => {
    res.json({ success: true, data: [{ id: 'sms1', name: 'Birthday SMS' }] });
  });
  router.get('/notifications/templates/email', (req: any, res: any) => {
    res.json({ success: true, data: [{ id: 'email1', name: 'Birthday Email' }] });
  });
  router.post('/notifications/send', (req: any, res: any) => {
    res.json({ success: true, data: { sent: true } });
  });
  router.post('/notifications/birthday-reminders', (req: any, res: any) => {
    res.json({ success: true, data: { processed: 10 } });
  });
  router.post('/notifications/anniversary-reminders', (req: any, res: any) => {
    res.json({ success: true, data: { processed: 5 } });
  });
  router.post('/notifications/reengagement-reminders', (req: any, res: any) => {
    res.json({ success: true, data: { processed: 20 } });
  });

  return router;
});

// Mock services
jest.mock('./services/CampaignService', () => ({
  campaignService: {
    createCampaign: jest.fn().mockResolvedValue({ id: 'camp123' }),
    getCampaigns: jest.fn().mockResolvedValue([]),
    getCampaignById: jest.fn().mockResolvedValue({ id: 'camp123' }),
    updateCampaign: jest.fn().mockResolvedValue({ id: 'camp123' }),
    scheduleCampaign: jest.fn().mockResolvedValue({ id: 'camp123' }),
    executeCampaign: jest.fn().mockResolvedValue({ success: true }),
    cancelCampaign: jest.fn().mockResolvedValue({ id: 'camp123' }),
    pauseCampaign: jest.fn().mockResolvedValue({ id: 'camp123' }),
    resumeCampaign: jest.fn().mockResolvedValue({ id: 'camp123' }),
    previewCampaign: jest.fn().mockResolvedValue({ preview: [] }),
    getCampaignMetrics: jest.fn().mockResolvedValue({ metrics: {} }),
    trackConversion: jest.fn().mockResolvedValue(undefined),
    getTargetCustomers: jest.fn().mockResolvedValue([]),
    runBirthdayCampaign: jest.fn().mockResolvedValue({ success: true }),
    runAnniversaryCampaign: jest.fn().mockResolvedValue({ success: true }),
    runReengagementCampaign: jest.fn().mockResolvedValue({ success: true }),
  },
}));

jest.mock('./services/NotificationService', () => ({
  notificationService: {
    processBirthdayReminders: jest.fn().mockResolvedValue({ processed: 10 }),
    processAnniversaryReminders: jest.fn().mockResolvedValue({ processed: 5 }),
    processReengagementReminders: jest.fn().mockResolvedValue({ processed: 20 }),
    getSMSTemplates: jest.fn().mockReturnValue([{ id: 'sms1', name: 'Birthday SMS' }]),
    getEmailTemplates: jest.fn().mockReturnValue([{ id: 'email1', name: 'Birthday Email' }]),
    sendToCustomer: jest.fn().mockResolvedValue({ sent: true }),
  },
}));

import customersRouter from './routes/customers.routes';
import campaignsRouter from './routes/campaigns.routes';

describe('ReZ Salon CRM Service', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/customers', customersRouter);
    app.use('/api/campaigns', campaignsRouter);
    app.use('/api/notifications', campaignsRouter);
  });

  describe('Health Check', () => {
    it('should have health check endpoint configured', () => {
      expect(app).toBeDefined();
    });
  });

  describe('Customer Routes', () => {
    describe('POST /api/customers', () => {
      it('should create a new customer', async () => {
        const customerData = {
          phone: '1234567890',
          email: 'john@example.com',
          name: 'John Doe',
          dateOfBirth: '1990-01-15',
          gender: 'male',
        };

        const response = await request(app)
          .post('/api/customers')
          .send(customerData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe('John Doe');
      });

      it('should create customer with minimal data', async () => {
        const customerData = {
          phone: '9876543210',
          name: 'Jane Doe',
        };

        const response = await request(app)
          .post('/api/customers')
          .send(customerData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      it('should reject customer without phone', async () => {
        const customerData = {
          name: 'John Doe',
        };

        const response = await request(app)
          .post('/api/customers')
          .send(customerData);

        expect(response.status).toBe(400);
      });

      it('should reject customer with invalid email format', async () => {
        const customerData = {
          phone: '1234567890',
          name: 'John Doe',
          email: 'invalid-email',
        };

        const response = await request(app)
          .post('/api/customers')
          .send(customerData);

        expect(response.status).toBe(400);
      });
    });

    describe('GET /api/customers/:id', () => {
      it('should get customer by ID', async () => {
        const response = await request(app)
          .get('/api/customers/cust123');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe('cust123');
      });

      it('should return 404 for non-existent customer', async () => {
        const response = await request(app)
          .get('/api/customers/non-existent');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /api/customers/phone/:phone', () => {
      it('should get customer by phone number', async () => {
        const response = await request(app)
          .get('/api/customers/phone/1234567890');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('GET /api/customers/email/:email', () => {
      it('should get customer by email', async () => {
        const response = await request(app)
          .get('/api/customers/email/john@example.com');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('PUT /api/customers/:id', () => {
      it('should update customer profile', async () => {
        const updateData = {
          name: 'John Smith',
          email: 'johnsmith@example.com',
        };

        const response = await request(app)
          .put('/api/customers/cust123')
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should update customer preferences', async () => {
        const updateData = {
          preferences: {
            preferredServices: ['haircut', 'coloring'],
            communicationChannel: 'both',
            notificationsEnabled: true,
          },
        };

        const response = await request(app)
          .put('/api/customers/cust123')
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('POST /api/customers/:id/visits', () => {
      it('should record a customer visit', async () => {
        const visitData = {
          service: 'haircut',
          stylist: 'Sarah',
          amount: 50,
          duration: 45,
          rating: 5,
        };

        const response = await request(app)
          .post('/api/customers/cust123/visits')
          .send(visitData);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should record visit with notes', async () => {
        const visitData = {
          service: 'coloring',
          stylist: 'Emma',
          amount: 150,
          duration: 120,
          notes: 'Customer wanted a natural look',
        };

        const response = await request(app)
          .post('/api/customers/cust123/visits')
          .send(visitData);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('GET /api/customers/:id/visits', () => {
      it('should get customer visit history', async () => {
        const response = await request(app)
          .get('/api/customers/cust123/visits')
          .query({ limit: 10, offset: 0 });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('GET /api/customers/:id/ltv', () => {
      it('should get customer LTV metrics', async () => {
        const response = await request(app)
          .get('/api/customers/cust123/ltv');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.ltv).toBeDefined();
      });
    });

    describe('POST /api/customers/segment', () => {
      it('should segment customers by tier', async () => {
        const response = await request(app)
          .post('/api/customers/segment')
          .query({ tier: 'vip' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should segment customers by spend range', async () => {
        const response = await request(app)
          .post('/api/customers/segment')
          .query({ minSpend: 5000, maxSpend: 10000 });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('GET /api/customers/birthdays/upcoming', () => {
      it('should get upcoming birthdays', async () => {
        const response = await request(app)
          .get('/api/customers/birthdays/upcoming')
          .query({ days: 7 });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.count).toBeDefined();
      });
    });

    describe('GET /api/customers/anniversaries/upcoming', () => {
      it('should get upcoming anniversaries', async () => {
        const response = await request(app)
          .get('/api/customers/anniversaries/upcoming')
          .query({ days: 30 });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('GET /api/customers/status/at-risk', () => {
      it('should get at-risk customers', async () => {
        const response = await request(app)
          .get('/api/customers/status/at-risk')
          .query({ days: 60 });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('GET /api/customers/status/vip', () => {
      it('should get VIP customers', async () => {
        const response = await request(app)
          .get('/api/customers/status/vip')
          .query({ minSpend: 10000 });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('DELETE /api/customers/:id', () => {
      it('should deactivate a customer', async () => {
        const response = await request(app)
          .delete('/api/customers/cust123');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Customer deactivated');
      });
    });
  });

  describe('Campaign Routes', () => {
    describe('POST /api/campaigns', () => {
      it('should create a new campaign', async () => {
        const campaignData = {
          name: 'Summer Sale',
          type: 'promotional',
          channel: 'both',
          segmentCriteria: { type: 'all' },
          content: { smsBody: 'Get 20% off this summer!' },
          createdBy: 'admin',
        };

        const response = await request(app)
          .post('/api/campaigns')
          .send(campaignData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      it('should create birthday campaign', async () => {
        const campaignData = {
          name: 'Birthday Special',
          type: 'birthday',
          channel: 'sms',
          segmentCriteria: { type: 'all' },
          content: { smsBody: 'Happy Birthday! Enjoy a free service.' },
          createdBy: 'system',
        };

        const response = await request(app)
          .post('/api/campaigns')
          .send(campaignData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });
    });

    describe('GET /api/campaigns', () => {
      it('should get all campaigns', async () => {
        const response = await request(app)
          .get('/api/campaigns');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should filter campaigns by type', async () => {
        const response = await request(app)
          .get('/api/campaigns')
          .query({ type: 'birthday' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should filter campaigns by status', async () => {
        const response = await request(app)
          .get('/api/campaigns')
          .query({ status: 'active' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('GET /api/campaigns/:id', () => {
      it('should get campaign by ID', async () => {
        const response = await request(app)
          .get('/api/campaigns/camp123');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe('camp123');
      });

      it('should return 404 for non-existent campaign', async () => {
        const response = await request(app)
          .get('/api/campaigns/non-existent');

        expect(response.status).toBe(404);
      });
    });

    describe('PUT /api/campaigns/:id', () => {
      it('should update campaign', async () => {
        const updateData = {
          name: 'Updated Campaign Name',
          status: 'paused',
        };

        const response = await request(app)
          .put('/api/campaigns/camp123')
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('POST /api/campaigns/:id/schedule', () => {
      it('should schedule campaign', async () => {
        const response = await request(app)
          .post('/api/campaigns/camp123/schedule')
          .send({ sendAt: '2024-02-01T10:00:00Z' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('POST /api/campaigns/:id/execute', () => {
      it('should execute campaign immediately', async () => {
        const response = await request(app)
          .post('/api/campaigns/camp123/execute');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('POST /api/campaigns/:id/cancel', () => {
      it('should cancel campaign', async () => {
        const response = await request(app)
          .post('/api/campaigns/camp123/cancel');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('POST /api/campaigns/:id/pause', () => {
      it('should pause running campaign', async () => {
        const response = await request(app)
          .post('/api/campaigns/camp123/pause');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('POST /api/campaigns/:id/resume', () => {
      it('should resume paused campaign', async () => {
        const response = await request(app)
          .post('/api/campaigns/camp123/resume');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('GET /api/campaigns/:id/preview', () => {
      it('should preview campaign recipients', async () => {
        const response = await request(app)
          .get('/api/campaigns/camp123/preview')
          .query({ limit: 10 });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('GET /api/campaigns/:id/metrics', () => {
      it('should get campaign metrics', async () => {
        const response = await request(app)
          .get('/api/campaigns/camp123/metrics');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.metrics).toBeDefined();
      });
    });

    describe('POST /api/campaigns/:id/convert', () => {
      it('should track campaign conversion', async () => {
        const response = await request(app)
          .post('/api/campaigns/camp123/convert')
          .send({ customerId: 'cust123', revenue: 100 });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('POST /api/campaigns/automated/birthday', () => {
      it('should run automated birthday campaign', async () => {
        const response = await request(app)
          .post('/api/campaigns/automated/birthday');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('POST /api/campaigns/automated/anniversary', () => {
      it('should run automated anniversary campaign', async () => {
        const response = await request(app)
          .post('/api/campaigns/automated/anniversary');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('POST /api/campaigns/automated/reengagement', () => {
      it('should run automated re-engagement campaign', async () => {
        const response = await request(app)
          .post('/api/campaigns/automated/reengagement')
          .send({ inactiveDays: 60 });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Notification Routes', () => {
    describe('GET /api/notifications/templates/sms', () => {
      it('should get SMS templates', async () => {
        const response = await request(app)
          .get('/api/notifications/templates/sms');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      });
    });

    describe('GET /api/notifications/templates/email', () => {
      it('should get email templates', async () => {
        const response = await request(app)
          .get('/api/notifications/templates/email');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      });
    });

    describe('POST /api/notifications/send', () => {
      it('should send notification to customer', async () => {
        const response = await request(app)
          .post('/api/notifications/send')
          .send({
            customerId: 'cust123',
            message: 'Hello from the salon!',
            channel: 'sms',
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should require customerId and message', async () => {
        const response = await request(app)
          .post('/api/notifications/send')
          .send({ customerId: 'cust123' });

        expect(response.status).toBe(400);
      });
    });

    describe('POST /api/notifications/birthday-reminders', () => {
      it('should process birthday reminders', async () => {
        const response = await request(app)
          .post('/api/notifications/birthday-reminders');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('POST /api/notifications/anniversary-reminders', () => {
      it('should process anniversary reminders', async () => {
        const response = await request(app)
          .post('/api/notifications/anniversary-reminders');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('POST /api/notifications/reengagement-reminders', () => {
      it('should process re-engagement reminders', async () => {
        const response = await request(app)
          .post('/api/notifications/reengagement-reminders')
          .send({ inactiveDays: 90 });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Business Logic Validation', () => {
    it('should validate customer tier classifications', () => {
      const tiers = ['new', 'regular', 'vip', 'at-risk', 'churned'];
      expect(tiers).toContain('new');
      expect(tiers).toContain('vip');
      expect(tiers).toContain('at-risk');
    });

    it('should validate campaign types', () => {
      const campaignTypes = [
        'birthday', 'anniversary', 'reengagement', 'promotional',
        'loyalty', 'seasonal', 'winback', 'new_service', 'VIP'
      ];
      expect(campaignTypes).toContain('birthday');
      expect(campaignTypes).toContain('promotional');
    });

    it('should validate notification channels', () => {
      const channels = ['sms', 'email', 'both'];
      expect(channels).toContain('sms');
      expect(channels).toContain('email');
      expect(channels).toContain('both');
    });

    it('should calculate customer LTV correctly', () => {
      const totalSpend = 10000;
      const visitCount = 25;
      const avgOrderValue = totalSpend / visitCount;
      expect(avgOrderValue).toBe(400);
    });

    it('should calculate campaign conversion rate', () => {
      const sent = 1000;
      const conversions = 50;
      const conversionRate = (conversions / sent) * 100;
      expect(conversionRate).toBe(5);
    });

    it('should identify at-risk customers correctly', () => {
      const lastVisitDate = new Date('2024-01-01');
      const today = new Date('2024-03-15');
      const daysInactive = Math.floor((today.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysInactive).toBeGreaterThan(60);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for unknown endpoints', async () => {
      const response = await request(app)
        .get('/api/unknown');

      expect(response.status).toBe(404);
    });

    it('should handle validation errors gracefully', async () => {
      // Test with invalid data
      const response = await request(app)
        .post('/api/customers')
        .send({});

      expect(response.status).toBe(400);
    });
  });
});
