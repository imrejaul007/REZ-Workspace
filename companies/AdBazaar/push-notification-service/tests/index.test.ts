import { describe, it, expect, vi, beforeEach } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';

describe('Push Notification Service API', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mock data stores
    const devices: any[] = [];
    const campaigns: any[] = [];
    const sentPushes: any[] = [];

    // Health
    app.get('/health', (_, res) => {
      res.json({
        status: 'ok',
        service: 'push-notification-service',
        firebase: 'configured',
        timestamp: new Date().toISOString(),
      });
    });

    app.get('/ready', (_, res) => {
      res.json({ status: 'ready', mongodb: 'connected' });
    });

    // Devices
    app.post('/api/devices', (req, res) => {
      const { advertiserId, userId, platform, fcmToken, metadata } = req.body;

      if (!platform || !fcmToken) {
        return res.status(400).json({ success: false, error: 'platform and fcmToken required' });
      }

      const existingDevice = devices.find(d => d.fcmToken === fcmToken);
      if (existingDevice) {
        existingDevice.status = 'active';
        return res.json({ success: true, data: existingDevice, message: 'Device updated' });
      }

      const device = {
        deviceId: `DEV-${Date.now().toString(16).toUpperCase()}`,
        advertiserId,
        userId,
        platform,
        fcmToken,
        status: 'active',
        metadata,
        createdAt: new Date(),
      };
      devices.push(device);
      res.status(201).json({ success: true, data: device });
    });

    app.get('/api/devices', (req, res) => {
      const { advertiserId, platform, status } = req.query;
      let filtered = [...devices];
      if (advertiserId) filtered = filtered.filter(d => d.advertiserId === advertiserId);
      if (platform) filtered = filtered.filter(d => d.platform === platform);
      if (status) filtered = filtered.filter(d => d.status === status);

      res.json({ success: true, data: filtered, count: filtered.length });
    });

    // Campaigns
    app.post('/api/campaigns', (req, res) => {
      const { advertiserId, name, title, body, imageUrl, data, target, scheduledAt, metadata } = req.body;

      if (!advertiserId || !name || !title || !body) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
      }

      const campaign = {
        campaignId: `PUSH-${Date.now().toString(16).toUpperCase()}`,
        advertiserId,
        name,
        title,
        body,
        imageUrl,
        data: data || {},
        target: target || { type: 'all' },
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        status: scheduledAt ? 'scheduled' : 'draft',
        stats: { sent: 0, delivered: 0, opened: 0, clicked: 0, failed: 0 },
        metadata,
        createdAt: new Date(),
      };
      campaigns.push(campaign);
      res.status(201).json({ success: true, data: campaign });
    });

    app.get('/api/campaigns', (req, res) => {
      const { advertiserId, status } = req.query;
      let filtered = [...campaigns];
      if (advertiserId) filtered = filtered.filter(c => c.advertiserId === advertiserId);
      if (status) filtered = filtered.filter(c => c.status === status);

      res.json({ success: true, data: filtered });
    });

    app.get('/api/campaigns/:id', (req, res) => {
      const campaign = campaigns.find(c => c.campaignId === req.params.id);
      if (!campaign) {
        return res.status(404).json({ success: false, error: 'Campaign not found' });
      }
      res.json({ success: true, data: campaign });
    });

    app.post('/api/campaigns/:id/send', (req, res) => {
      const campaign = campaigns.find(c => c.campaignId === req.params.id);
      if (!campaign) {
        return res.status(404).json({ success: false, error: 'Campaign not found' });
      }

      if (campaign.status === 'sending') {
        return res.status(400).json({ success: false, error: 'Campaign already sending' });
      }

      const targetDevices = devices.filter(d =>
        d.advertiserId === campaign.advertiserId && d.status === 'active'
      );

      let sent = 0;
      let failed = 0;

      for (const device of targetDevices) {
        sentPushes.push({
          pushId: `PUSH-${Date.now().toString(16).toUpperCase()}`,
          campaignId: campaign.campaignId,
          deviceId: device.deviceId,
          status: 'sent',
          sentAt: new Date(),
        });
        sent++;
      }

      campaign.status = 'sent';
      campaign.stats.sent = sent;
      campaign.stats.failed = failed;

      res.json({
        success: true,
        data: {
          campaignId: campaign.campaignId,
          sent,
          failed,
          total: targetDevices.length,
        },
      });
    });

    // Webhooks
    app.post('/api/webhooks/fcm', (req, res) => {
      const { messageId, event, device_token } = req.body;

      const push = sentPushes.find(p => p.fcmMessageId === messageId);
      if (push) {
        switch (event) {
          case 'DELIVERED':
            push.status = 'delivered';
            push.deliveredAt = new Date();
            break;
          case 'OPEN':
            push.status = 'opened';
            push.openedAt = new Date();
            break;
        }
      }

      res.sendStatus(200);
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('service', 'push-notification-service');
      expect(response.body).toHaveProperty('firebase');
    });

    it('should return ready status', async () => {
      const response = await request(app).get('/ready');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ready');
    });
  });

  describe('Devices', () => {
    it('should register a device', async () => {
      const response = await request(app)
        .post('/api/devices')
        .send({
          advertiserId: 'adv_001',
          userId: 'user_123',
          platform: 'android',
          fcmToken: 'fcm_token_123',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('deviceId');
      expect(response.body.data).toHaveProperty('platform', 'android');
      expect(response.body.data).toHaveProperty('status', 'active');
    });

    it('should update existing device', async () => {
      // First register
      await request(app)
        .post('/api/devices')
        .send({
          advertiserId: 'adv_001',
          platform: 'ios',
          fcmToken: 'existing_token',
        });

      // Register again with same token
      const response = await request(app)
        .post('/api/devices')
        .send({
          advertiserId: 'adv_001',
          platform: 'ios',
          fcmToken: 'existing_token',
          userId: 'new_user',
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Device updated');
    });

    it('should return error for missing platform', async () => {
      const response = await request(app)
        .post('/api/devices')
        .send({ fcmToken: 'token' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should list devices with filters', async () => {
      // Register devices
      await request(app)
        .post('/api/devices')
        .send({ advertiserId: 'adv_001', platform: 'android', fcmToken: 'token1' });

      await request(app)
        .post('/api/devices')
        .send({ advertiserId: 'adv_001', platform: 'ios', fcmToken: 'token2' });

      const response = await request(app).get('/api/devices?advertiserId=adv_001');

      expect(response.status).toBe(200);
      expect(response.body.count).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Campaigns', () => {
    it('should create a campaign', async () => {
      const response = await request(app)
        .post('/api/campaigns')
        .send({
          advertiserId: 'adv_001',
          name: 'Summer Sale',
          title: '50% Off!',
          body: 'Check out our summer collection',
          target: { type: 'all' },
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('campaignId');
      expect(response.body.data).toHaveProperty('status', 'draft');
    });

    it('should return error for missing fields', async () => {
      const response = await request(app)
        .post('/api/campaigns')
        .send({ advertiserId: 'adv_001' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should list campaigns', async () => {
      await request(app)
        .post('/api/campaigns')
        .send({
          advertiserId: 'adv_001',
          name: 'Test Campaign',
          title: 'Test',
          body: 'Test body',
        });

      const response = await request(app).get('/api/campaigns');

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should get a single campaign', async () => {
      const createResponse = await request(app)
        .post('/api/campaigns')
        .send({
          advertiserId: 'adv_001',
          name: 'Get Campaign',
          title: 'Test',
          body: 'Test body',
        });

      const campaignId = createResponse.body.data.campaignId;

      const response = await request(app).get(`/api/campaigns/${campaignId}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('campaignId', campaignId);
    });

    it('should return 404 for non-existent campaign', async () => {
      const response = await request(app).get('/api/campaigns/non_existent');

      expect(response.status).toBe(404);
    });

    it('should send a campaign', async () => {
      // Register device
      await request(app)
        .post('/api/devices')
        .send({
          advertiserId: 'adv_001',
          platform: 'android',
          fcmToken: 'send_token',
        });

      // Create campaign
      const createResponse = await request(app)
        .post('/api/campaigns')
        .send({
          advertiserId: 'adv_001',
          name: 'Send Campaign',
          title: 'Test',
          body: 'Test body',
        });

      const campaignId = createResponse.body.data.campaignId;

      // Send campaign
      const response = await request(app).post(`/api/campaigns/${campaignId}/send`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('sent');
      expect(response.body.data).toHaveProperty('failed');
    });

    it('should prevent sending already sending campaign', async () => {
      // Create and send campaign
      const createResponse = await request(app)
        .post('/api/campaigns')
        .send({
          advertiserId: 'adv_001',
          name: 'Double Send',
          title: 'Test',
          body: 'Test body',
        });

      const campaignId = createResponse.body.data.campaignId;
      await request(app).post(`/api/campaigns/${campaignId}/send`);

      // Try to send again
      const response = await request(app).post(`/api/campaigns/${campaignId}/send`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Campaign already sending');
    });
  });

  describe('Webhooks', () => {
    it('should process DELIVERED webhook', async () => {
      const response = await request(app)
        .post('/api/webhooks/fcm')
        .send({ messageId: 'msg_123', event: 'DELIVERED' });

      expect(response.status).toBe(200);
    });

    it('should process OPEN webhook', async () => {
      const response = await request(app)
        .post('/api/webhooks/fcm')
        .send({ messageId: 'msg_456', event: 'OPEN' });

      expect(response.status).toBe(200);
    });
  });
});

describe('Push Notification Logic', () => {
  it('should generate device ID correctly', () => {
    const generateDeviceId = () => {
      const hex = Date.now().toString(16).toUpperCase();
      return `DEV-${hex}`;
    };

    const deviceId = generateDeviceId();
    expect(deviceId).toMatch(/^DEV-[A-F0-9]+$/);
  });

  it('should generate campaign ID correctly', () => {
    const generateCampaignId = () => {
      const hex = Date.now().toString(16).toUpperCase();
      return `PUSH-${hex}`;
    };

    const campaignId = generateCampaignId();
    expect(campaignId).toMatch(/^PUSH-[A-F0-9]+$/);
  });

  it('should calculate delivery rate', () => {
    const deliveryRate = (sent: number, delivered: number) => {
      if (sent === 0) return 0;
      return Math.round((delivered / sent) * 100);
    };

    expect(deliveryRate(100, 85)).toBe(85);
    expect(deliveryRate(100, 100)).toBe(100);
    expect(deliveryRate(0, 0)).toBe(0);
  });

  it('should calculate open rate', () => {
    const openRate = (delivered: number, opened: number) => {
      if (delivered === 0) return 0;
      return Math.round((opened / delivered) * 100);
    };

    expect(openRate(100, 45)).toBe(45);
    expect(openRate(100, 60)).toBe(60);
  });

  it('should calculate click-through rate', () => {
    const ctr = (delivered: number, clicked: number) => {
      if (delivered === 0) return 0;
      return Math.round((clicked / delivered) * 100);
    };

    expect(ctr(100, 10)).toBe(10);
    expect(ctr(100, 5)).toBe(5);
  });

  it('should validate campaign status transitions', () => {
    const canTransition = (from: string, to: string) => {
      const validTransitions: Record<string, string[]> = {
        draft: ['scheduled', 'sending', 'paused'],
        scheduled: ['sending', 'paused'],
        sending: ['sent', 'paused'],
        sent: [],
        paused: ['sending', 'draft'],
        failed: ['draft'],
      };
      return validTransitions[from]?.includes(to) || false;
    };

    expect(canTransition('draft', 'scheduled')).toBe(true);
    expect(canTransition('draft', 'sending')).toBe(true);
    expect(canTransition('sending', 'sent')).toBe(true);
    expect(canTransition('sent', 'draft')).toBe(false);
    expect(canTransition('draft', 'sent')).toBe(false);
  });
});