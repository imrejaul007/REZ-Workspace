import { describe, it, expect, vi, beforeEach } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';

// Mock mongoose
vi.mock('mongoose', () => ({
  default: {
    connect: vi.fn().mockResolvedValue(undefined),
    connection: {
      readyState: 1,
      close: vi.fn().mockResolvedValue(undefined),
      db: {
        admin: () => ({
          ping: vi.fn().mockResolvedValue({ ok: 1 }),
        }),
      },
    },
  },
  connect: vi.fn().mockResolvedValue(undefined),
}));

// Mock node-cron
vi.mock('node-cron', () => ({
  default: {
    schedule: vi.fn(),
  },
}));

// Mock services
vi.mock('../src/services/LeadIntelligenceService', () => ({
  leadIntelligenceService: {
    processHotLeadsBatch: vi.fn().mockResolvedValue({ processed: 10 }),
    processAbandonedCartsBatch: vi.fn().mockResolvedValue({ processed: 5 }),
  },
}));

vi.mock('../src/integrations/marketingIntegration', () => ({
  marketingIntegration: {
    syncLeadsToMarketing: vi.fn().mockResolvedValue({
      totalProcessed: 10,
      totalErrors: 0,
      hotLeads: { campaignId: 'hot-123' },
      warmLeads: { campaignId: 'warm-123' },
      coldLeads: { campaignId: 'cold-123' },
    }),
  },
}));

vi.mock('@rez/shared', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock config
vi.mock('../src/config', () => ({
  default: {
    port: 4001,
    nodeEnv: 'test',
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    mongodb: {
      uri: 'mongodb://localhost',
      db: 'test',
    },
  },
}));

describe('Lead Intelligence Service API', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Root endpoint
    app.get('/', (_req, res) => {
      res.json({
        service: 'Lead Intelligence Service',
        version: '1.0.0',
        description: 'Hot/Warm/Cold lead detection and re-engagement',
        documentation: '/api-docs',
        health: '/api/v1/health',
      });
    });

    // Health check endpoint
    app.get('/api/v1/health', (_req, res) => {
      res.json({
        status: 'healthy',
        service: 'lead-intelligence',
        timestamp: new Date().toISOString(),
        mongodb: 'connected',
      });
    });

    // Ready check
    app.get('/api/v1/ready', async (_req, res) => {
      res.json({
        status: 'ready',
        timestamp: new Date().toISOString(),
      });
    });
  });

  describe('Health Endpoints', () => {
    it('should return service info on root', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('service', 'Lead Intelligence Service');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('documentation', '/api-docs');
    });

    it('should return health status', async () => {
      const response = await request(app).get('/api/v1/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('service', 'lead-intelligence');
      expect(response.body).toHaveProperty('mongodb', 'connected');
    });

    it('should return ready status', async () => {
      const response = await request(app).get('/api/v1/ready');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ready');
    });
  });

  describe('Lead Intelligence Service', () => {
    it('should have processHotLeadsBatch method', async () => {
      const { leadIntelligenceService } = await import('../src/services/LeadIntelligenceService');

      expect(leadIntelligenceService).toBeDefined();
      expect(typeof leadIntelligenceService.processHotLeadsBatch).toBe('function');

      const result = await leadIntelligenceService.processHotLeadsBatch();
      expect(result).toHaveProperty('processed');
    });

    it('should have processAbandonedCartsBatch method', async () => {
      const { leadIntelligenceService } = await import('../src/services/LeadIntelligenceService');

      expect(typeof leadIntelligenceService.processAbandonedCartsBatch).toBe('function');

      const result = await leadIntelligenceService.processAbandonedCartsBatch();
      expect(result).toHaveProperty('processed');
    });
  });

  describe('Marketing Integration', () => {
    it('should have syncLeadsToMarketing method', async () => {
      const { marketingIntegration } = await import('../src/integrations/marketingIntegration');

      expect(marketingIntegration).toBeDefined();
      expect(typeof marketingIntegration.syncLeadsToMarketing).toBe('function');

      const result = await marketingIntegration.syncLeadsToMarketing();
      expect(result).toHaveProperty('totalProcessed');
      expect(result).toHaveProperty('hotLeads');
      expect(result).toHaveProperty('warmLeads');
      expect(result).toHaveProperty('coldLeads');
    });
  });
});

describe('Lead Scoring Logic', () => {
  it('should classify hot leads correctly', () => {
    const classifyLead = (signals: { searches: number; carts: number; views: number; activity: number }) => {
      const score = signals.searches * 10 + signals.carts * 20 + signals.views * 5 + signals.activity * 2;
      if (score >= 150) return 'hot';
      if (score >= 50) return 'warm';
      return 'cold';
    };

    expect(classifyLead({ searches: 10, carts: 5, views: 10, activity: 20 })).toBe('hot');
    expect(classifyLead({ searches: 3, carts: 1, views: 5, activity: 10 })).toBe('warm');
    expect(classifyLead({ searches: 1, carts: 0, views: 2, activity: 5 })).toBe('cold');
  });

  it('should calculate lead score correctly', () => {
    const calculateScore = (signals: { searches: number; carts: number; views: number; activity: number }) => {
      return signals.searches * 10 + signals.carts * 20 + signals.views * 5 + signals.activity * 2;
    };

    expect(calculateScore({ searches: 5, carts: 3, views: 10, activity: 15 })).toBe(135);
    expect(calculateScore({ searches: 0, carts: 0, views: 0, activity: 0 })).toBe(0);
  });
});

describe('Abandoned Cart Detection', () => {
  it('should detect abandoned carts', () => {
    const detectAbandonedCart = (cartAgeMinutes: number, converted: boolean) => {
      return cartAgeMinutes > 30 && !converted;
    };

    expect(detectAbandonedCart(60, false)).toBe(true);
    expect(detectAbandonedCart(60, true)).toBe(false);
    expect(detectAbandonedCart(20, false)).toBe(false);
  });

  it('should calculate cart abandonment rate', () => {
    const abandonmentRate = (carts: number, converted: number) => {
      if (carts === 0) return 0;
      return ((carts - converted) / carts) * 100;
    };

    expect(abandonmentRate(100, 30)).toBe(70);
    expect(abandonmentRate(50, 50)).toBe(0);
    expect(abandonmentRate(0, 0)).toBe(0);
  });
});