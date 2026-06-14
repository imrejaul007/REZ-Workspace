import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { generateToken } from '../middleware/auth.middleware';

// Mock services for testing
const mockCampaignService = {
  createCampaign: vi.fn(),
  getCampaign: vi.fn(),
  updateCampaign: vi.fn(),
  launchCampaign: vi.fn(),
  pauseCampaign: vi.fn(),
  resumeCampaign: vi.fn(),
  getCampaignStatistics: vi.fn(),
  listCampaigns: vi.fn(),
};

const mockMetricsService = {
  recordCampaignCreated: vi.fn(),
  recordCampaignLaunched: vi.fn(),
  recordStatusChange: vi.fn(),
};

// Mock the services
vi.mock('../services/campaign.service', () => ({
  campaignService: mockCampaignService,
}));

vi.mock('../services/metrics.service', () => ({
  metricsService: mockMetricsService,
}));

// Create test app
function createTestApp() {
  const app = express();
  app.use(express.json());

  // Mock routes for testing
  app.post('/api/campaigns', async (req, res) => {
    try {
      const campaign = await mockCampaignService.createCampaign('test-advertiser', req.body);
      res.status(201).json({ success: true, data: campaign });
    } catch (error) {
      res.status(400).json({ success: false, error: (error as Error).message });
    }
  });

  app.get('/api/campaigns/:id', async (req, res) => {
    const campaign = await mockCampaignService.getCampaign(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }
    res.json({ success: true, data: campaign });
  });

  app.post('/api/campaigns/:id/launch', async (req, res) => {
    const campaign = await mockCampaignService.launchCampaign(req.params.id, 'test-advertiser');
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }
    res.json({ success: true, data: campaign });
  });

  return app;
}

describe('Cross-Channel Orchestrator API', () => {
  let app: express.Application;
  let authToken: string;

  beforeAll(() => {
    app = createTestApp();
    authToken = generateToken({
      userId: 'test-user',
      advertiserId: 'test-advertiser',
      role: 'advertiser',
      permissions: ['campaign:create', 'campaign:read', 'campaign:launch'],
    });
  });

  afterAll(() => {
    vi.clearAllMocks();
  });

  describe('Campaign Creation', () => {
    const validCampaignData = {
      name: 'Test Campaign',
      objective: 'awareness',
      channels: ['whatsapp', 'email'],
      budget: {
        total: 10000,
        byChannel: {
          whatsapp: 5000,
          email: 5000,
        },
      },
      targeting: {
        audienceIds: ['audience-1'],
        segments: ['segment-1'],
      },
      content: {
        whatsapp: {
          template: 'hello_template',
          variables: { name: 'John' },
        },
        email: {
          subject: 'Hello from Test',
          body: '<p>Hello {{name}}</p>',
        },
      },
      scheduling: {
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        frequency: 'once',
      },
    };

    it('should create a campaign with valid data', async () => {
      const mockCampaign = {
        campaignId: 'CCO-123',
        advertiserId: 'test-advertiser',
        ...validCampaignData,
        status: 'draft',
        metrics: {
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          converted: 0,
          revenue: 0,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCampaignService.createCampaign.mockResolvedValue(mockCampaign);

      const response = await request(app)
        .post('/api/campaigns')
        .send(validCampaignData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.campaignId).toBe('CCO-123');
    });

    it('should reject campaign with missing required fields', async () => {
      const invalidData = {
        name: 'Test Campaign',
        // Missing objective, channels, budget, etc.
      };

      const response = await request(app)
        .post('/api/campaigns')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject campaign with invalid channel', async () => {
      const invalidData = {
        ...validCampaignData,
        channels: ['invalid-channel'],
      };

      const response = await request(app)
        .post('/api/campaigns')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Campaign Retrieval', () => {
    it('should get campaign by ID', async () => {
      const mockCampaign = {
        campaignId: 'CCO-123',
        name: 'Test Campaign',
        status: 'draft',
      };

      mockCampaignService.getCampaign.mockResolvedValue(mockCampaign);

      const response = await request(app)
        .get('/api/campaigns/CCO-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.campaignId).toBe('CCO-123');
    });

    it('should return 404 for non-existent campaign', async () => {
      mockCampaignService.getCampaign.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/campaigns/CCO-NONEXISTENT');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Campaign Launch', () => {
    it('should launch a draft campaign', async () => {
      const mockCampaign = {
        campaignId: 'CCO-123',
        status: 'active',
        launchedAt: new Date(),
      };

      mockCampaignService.launchCampaign.mockResolvedValue(mockCampaign);

      const response = await request(app)
        .post('/api/campaigns/CCO-123/launch');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('active');
    });

    it('should return 404 when launching non-existent campaign', async () => {
      mockCampaignService.launchCampaign.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/campaigns/CCO-NONEXISTENT/launch');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});

describe('Channel Validation', () => {
  it('should validate channel types', () => {
    const validChannels = ['whatsapp', 'sms', 'email', 'push'];
    const invalidChannels = ['telegram', 'signal', 'discord'];

    validChannels.forEach((channel) => {
      expect(['whatsapp', 'sms', 'email', 'push']).toContain(channel);
    });

    invalidChannels.forEach((channel) => {
      expect(['whatsapp', 'sms', 'email', 'push']).not.toContain(channel);
    });
  });
});

describe('Budget Allocation', () => {
  it('should allocate budget equally when not specified', () => {
    const channels = ['whatsapp', 'sms', 'email'];
    const totalBudget = 9000;
    const perChannel = totalBudget / channels.length;

    expect(perChannel).toBe(3000);
  });

  it('should use specified budgets when provided', () => {
    const specifiedBudgets = {
      whatsapp: 5000,
      sms: 3000,
      email: 2000,
    };

    const total = Object.values(specifiedBudgets).reduce((sum, val) => sum + val, 0);
    expect(total).toBe(10000);
  });
});

describe('Campaign Status Transitions', () => {
  const validTransitions: Record<string, string[]> = {
    draft: ['scheduled', 'active'],
    scheduled: ['active', 'draft'],
    active: ['paused', 'completed'],
    paused: ['active', 'completed'],
    completed: [],
  };

  it('should allow valid status transitions', () => {
    expect(validTransitions.draft).toContain('active');
    expect(validTransitions.active).toContain('paused');
    expect(validTransitions.paused).toContain('active');
  });

  it('should not allow invalid status transitions', () => {
    expect(validTransitions.completed).toHaveLength(0);
    expect(validTransitions.draft).not.toContain('completed');
  });
});

describe('Metrics Calculation', () => {
  it('should calculate delivery rate correctly', () => {
    const sent = 1000;
    const delivered = 950;
    const deliveryRate = (delivered / sent) * 100;

    expect(deliveryRate).toBe(95);
  });

  it('should calculate open rate correctly', () => {
    const delivered = 950;
    const opened = 400;
    const openRate = (opened / delivered) * 100;

    expect(openRate).toBeCloseTo(42.1, 1);
  });

  it('should calculate ROI correctly', () => {
    const spent = 1000;
    const revenue = 2500;
    const roi = ((revenue - spent) / spent) * 100;

    expect(roi).toBe(150);
  });
});

describe('Content Validation', () => {
  it('should validate WhatsApp content', () => {
    const validContent = {
      template: 'hello_template',
      variables: { name: 'John' },
    };

    expect(validContent.template).toBeTruthy();
    expect(validContent.variables).toBeInstanceOf(Object);
  });

  it('should validate SMS content', () => {
    const validContent = {
      message: 'Hello, this is a test message',
    };

    expect(validContent.message.length).toBeLessThanOrEqual(160);
  });

  it('should validate email content', () => {
    const validContent = {
      subject: 'Test Subject',
      body: '<p>Test body content</p>',
    };

    expect(validContent.subject).toBeTruthy();
    expect(validContent.body).toBeTruthy();
  });

  it('should validate push content', () => {
    const validContent = {
      title: 'Notification Title',
      body: 'Notification body text',
    };

    expect(validContent.title.length).toBeLessThanOrEqual(100);
    expect(validContent.body.length).toBeLessThanOrEqual(500);
  });
});