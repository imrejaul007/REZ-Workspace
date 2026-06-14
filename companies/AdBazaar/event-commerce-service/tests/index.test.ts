import { describe, it, expect, vi, beforeEach } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';

describe('Event Commerce Service API', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Health endpoint
    app.get('/health', (_req, res) => {
      res.json({ status: 'ok', service: 'event-commerce', version: '1.0.0', events: 2 });
    });

    // Mock events data
    const events = [
      { id: 'evt_001', name: 'IPL Final', type: 'sports', city: 'Bangalore', venue: 'Chinnaswamy Stadium', startDate: '2026-06-15', endDate: '2026-06-15', expectedAttendees: 40000, category: ['cricket', 'sports', 'entertainment'] },
      { id: 'evt_002', name: 'Food Festival', type: 'festival', city: 'Mumbai', venue: 'Jio Garden', startDate: '2026-06-20', endDate: '2026-06-22', expectedAttendees: 50000, category: ['food', 'culture'] },
    ];

    const campaigns: any[] = [];

    // List events
    app.get('/api/events', (req, res) => {
      const { city, type, upcoming } = req.query;
      let filtered = [...events];
      if (city) filtered = filtered.filter((e: any) => e.city === city);
      if (type) filtered = filtered.filter((e: any) => e.type === type);
      if (upcoming === 'true') filtered = filtered.filter((e: any) => new Date(e.startDate) > new Date());
      res.json({ success: true, data: filtered });
    });

    // Get event
    app.get('/api/events/:id', (req, res) => {
      const event = events.find(e => e.id === req.params.id);
      if (!event) return res.status(404).json({ success: false, error: 'Event not found' });
      res.json({ success: true, data: event });
    });

    // Create campaign
    app.post('/api/campaigns', (req, res) => {
      const { advertiserId, eventId, name, strategy, budget } = req.body;
      const campaign = {
        id: `ec_${Date.now()}`,
        advertiserId,
        eventId,
        name,
        strategy: strategy || 'during',
        budget,
        spent: 0,
        status: 'draft',
        stats: { impressions: 0, conversions: 0, revenue: 0, footfall: 0 },
      };
      campaigns.push(campaign);
      res.json({ success: true, data: campaign });
    });

    // List campaigns
    app.get('/api/campaigns', (_req, res) => {
      res.json({ success: true, data: campaigns });
    });

    // Get campaign
    app.get('/api/campaigns/:id', (req, res) => {
      const campaign = campaigns.find(c => c.id === req.params.id);
      if (!campaign) return res.status(404).json({ success: false, error: 'Campaign not found' });
      res.json({ success: true, data: campaign });
    });

    // Update status
    app.patch('/api/campaigns/:id/status', (req, res) => {
      const campaign = campaigns.find(c => c.id === req.params.id);
      if (!campaign) return res.status(404).json({ success: false, error: 'Campaign not found' });
      campaign.status = req.body.status;
      res.json({ success: true, data: campaign });
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('service', 'event-commerce');
      expect(response.body).toHaveProperty('version', '1.0.0');
    });
  });

  describe('Events', () => {
    it('should list all events', async () => {
      const response = await request(app).get('/api/events');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter events by city', async () => {
      const response = await request(app).get('/api/events?city=Mumbai');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].city).toBe('Mumbai');
    });

    it('should filter events by type', async () => {
      const response = await request(app).get('/api/events?type=sports');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].type).toBe('sports');
    });

    it('should get a single event', async () => {
      const response = await request(app).get('/api/events/evt_001');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('name', 'IPL Final');
    });

    it('should return 404 for non-existent event', async () => {
      const response = await request(app).get('/api/events/evt_999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Event not found');
    });
  });

  describe('Campaigns', () => {
    it('should create a campaign', async () => {
      const response = await request(app)
        .post('/api/campaigns')
        .send({
          advertiserId: 'adv_001',
          eventId: 'evt_001',
          name: 'IPL Final Campaign',
          strategy: 'during',
          budget: 10000,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('status', 'draft');
      expect(response.body.data).toHaveProperty('stats');
    });

    it('should list campaigns', async () => {
      // First create a campaign
      await request(app)
        .post('/api/campaigns')
        .send({
          advertiserId: 'adv_001',
          eventId: 'evt_001',
          name: 'Test Campaign',
          budget: 5000,
        });

      const response = await request(app).get('/api/campaigns');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should get a single campaign', async () => {
      // First create a campaign
      const createResponse = await request(app)
        .post('/api/campaigns')
        .send({
          advertiserId: 'adv_001',
          eventId: 'evt_001',
          name: 'Test Campaign',
          budget: 5000,
        });

      const campaignId = createResponse.body.data.id;

      const response = await request(app).get(`/api/campaigns/${campaignId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id', campaignId);
    });

    it('should update campaign status', async () => {
      // First create a campaign
      const createResponse = await request(app)
        .post('/api/campaigns')
        .send({
          advertiserId: 'adv_001',
          eventId: 'evt_001',
          name: 'Test Campaign',
          budget: 5000,
        });

      const campaignId = createResponse.body.data.id;

      const response = await request(app)
        .patch(`/api/campaigns/${campaignId}/status`)
        .send({ status: 'active' });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('active');
    });
  });
});

describe('Event Commerce Logic', () => {
  it('should calculate event ad value', () => {
    const calculateEventValue = (expectedAttendees: number, cpm: number) => {
      return (expectedAttendees / 1000) * cpm;
    };

    expect(calculateEventValue(40000, 10)).toBe(400);
    expect(calculateEventValue(50000, 15)).toBe(750);
  });

  it('should determine campaign strategy timing', () => {
    const getStrategyTiming = (
      campaignStart: Date,
      eventStart: Date,
      eventEnd: Date
    ): 'pre' | 'during' | 'post' => {
      if (campaignStart < eventStart) return 'pre';
      if (campaignStart >= eventStart && campaignStart <= eventEnd) return 'during';
      return 'post';
    };

    const eventStart = new Date('2026-06-15');
    const eventEnd = new Date('2026-06-15');

    expect(getStrategyTiming(new Date('2026-06-10'), eventStart, eventEnd)).toBe('pre');
    expect(getStrategyTiming(new Date('2026-06-15'), eventStart, eventEnd)).toBe('during');
    expect(getStrategyTiming(new Date('2026-06-20'), eventStart, eventEnd)).toBe('post');
  });

  it('should estimate campaign reach', () => {
    const estimateReach = (
      expectedAttendees: number,
      adImpressions: number,
      conversionRate: number
    ) => {
      return Math.round(adImpressions * (expectedAttendees / 100000) * conversionRate);
    };

    expect(estimateReach(40000, 100000, 0.05)).toBe(200);
    expect(estimateReach(50000, 200000, 0.1)).toBe(1000);
  });

  it('should calculate footfall attribution', () => {
    const attributionRate = (drivenFootfall: number, totalFootfall: number) => {
      if (totalFootfall === 0) return 0;
      return Math.round((drivenFootfall / totalFootfall) * 100);
    };

    expect(attributionRate(1000, 40000)).toBe(2.5);
    expect(attributionRate(500, 50000)).toBe(1);
  });

  it('should calculate ROI for event campaigns', () => {
    const calculateROI = (revenue: number, cost: number) => {
      if (cost === 0) return 0;
      return Math.round(((revenue - cost) / cost) * 100);
    };

    expect(calculateROI(15000, 10000)).toBe(50);
    expect(calculateROI(8000, 10000)).toBe(-20);
  });
});