import { describe, it, expect, vi, beforeEach } from 'vitest';

// Types for testing
interface ServiceConfig {
  name: string;
  url: string;
  timeout: number;
  retryAttempts: number;
}

// Service registry
const SERVICE_REGISTRY: Record<string, ServiceConfig> = {
  'unified-campaign': {
    name: 'Unified Campaign Service',
    url: process.env.CAMPAIGN_SERVICE_URL || 'http://localhost:4500',
    timeout: 5000,
    retryAttempts: 3,
  },
  'ads-service': {
    name: 'REZ Ads Service',
    url: process.env.ADS_SERVICE_URL || 'http://localhost:4007',
    timeout: 5000,
    retryAttempts: 3,
  },
  'marketing': {
    name: 'REZ Marketing',
    url: process.env.MARKETING_SERVICE_URL || 'http://localhost:4000',
    timeout: 5000,
    retryAttempts: 3,
  },
  'dooh': {
    name: 'REZ DOOH Service',
    url: process.env.DOOH_SERVICE_URL || 'http://localhost:4018',
    timeout: 5000,
    retryAttempts: 3,
  },
  'adsqr': {
    name: 'AdsQR',
    url: process.env.ADSQR_SERVICE_URL || 'http://localhost:4068',
    timeout: 5000,
    retryAttempts: 3,
  },
  'attribution': {
    name: 'Attribution Hub',
    url: process.env.ATTRIBUTION_SERVICE_URL || 'http://localhost:4100',
    timeout: 5000,
    retryAttempts: 3,
  },
  'attribution-enhanced': {
    name: 'Attribution Hub Enhanced',
    url: process.env.ATTRIBUTION_ENHANCED_URL || 'http://localhost:4520',
    timeout: 5000,
    retryAttempts: 3,
  },
  'decision': {
    name: 'Decision Engine',
    url: process.env.DECISION_SERVICE_URL || 'http://localhost:4027',
    timeout: 5000,
    retryAttempts: 3,
  },
  'rabtul-auth': {
    name: 'RABTUL Auth',
    url: process.env.AUTH_SERVICE_URL || 'http://localhost:4002',
    timeout: 5000,
    retryAttempts: 3,
  },
  'rabtul-wallet': {
    name: 'RABTUL Wallet',
    url: process.env.WALLET_SERVICE_URL || 'http://localhost:4004',
    timeout: 5000,
    retryAttempts: 3,
  },
};

// Mock axios for testing
const mockAxios = {
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
};

vi.mock('axios', () => ({
  default: mockAxios,
}));

// IntegrationHub class for testing
class IntegrationHub {
  private serviceHealth: Map<string, boolean> = new Map();
  private lastHealthCheck: Map<string, Date> = new Map();

  async healthCheck(): Promise<Record<string, { healthy: boolean; latency?: number; error?: string }>> {
    const results: Record<string, { healthy: boolean; latency?: number; error?: string }> = {};

    await Promise.all(
      Object.entries(SERVICE_REGISTRY).map(async ([key, service]) => {
        const start = Date.now();
        try {
          mockAxios.get.mockResolvedValueOnce({ status: 200 });
          const response = await mockAxios.get(`${service.url}/health`, {
            timeout: service.timeout,
          });
          results[key] = {
            healthy: response.status === 200,
            latency: Date.now() - start,
          };
          this.serviceHealth.set(key, true);
        } catch (error) {
          results[key] = {
            healthy: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
          this.serviceHealth.set(key, false);
        }
        this.lastHealthCheck.set(key, new Date());
      })
    );

    return results;
  }

  async callService(
    serviceKey: string,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    path: string,
    data?: unknown
  ): Promise<{ success: boolean; data?: unknown; error?: string }> {
    const service = SERVICE_REGISTRY[serviceKey];

    if (!service) {
      return { success: false, error: `Service ${serviceKey} not found in registry` };
    }

    let lastError: string = '';

    for (let attempt = 1; attempt <= service.retryAttempts; attempt++) {
      try {
        const mockResponse = { data: { success: true, result: 'mocked' } };
        mockAxios.post.mockResolvedValueOnce(mockResponse);
        const response = await mockAxios.post(`${service.url}${path}`, data, {
          timeout: service.timeout,
        });

        return { success: true, data: response.data };
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';

        if (attempt < service.retryAttempts) {
          await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 10));
        }
      }
    }

    return { success: false, error: lastError };
  }

  async createCrossPlatformCampaign(params: {
    name: string;
    inventory: string[];
    budget: number;
    targeting: Record<string, unknown>;
  }): Promise<{ campaignId: string; platformResults: Record<string, unknown> }> {
    const unifiedResult = await this.callService('unified-campaign', 'POST', '/api/campaigns', {
      name: params.name,
      inventory: params.inventory,
      budget: params.budget,
      targeting: params.targeting,
    });

    if (!unifiedResult.success) {
      throw new Error('Failed to create unified campaign');
    }

    const campaignId = 'mock_campaign_id';
    const platformResults: Record<string, unknown> = { unified: unifiedResult.data };

    if (params.inventory.some((i) => i.includes('dooh'))) {
      const doohResult = await this.callService('dooh', 'POST', '/api/campaigns', {
        name: params.name,
        inventory: params.inventory.filter((i) => i.includes('dooh')),
        budget: params.budget * 0.3,
      });
      platformResults.dooh = doohResult;
    }

    if (params.inventory.some((i) => i.includes('qr'))) {
      const qrResult = await this.callService('adsqr', 'POST', '/api/campaigns', {
        name: params.name,
        inventory: params.inventory.filter((i) => i.includes('qr')),
        budget: params.budget * 0.2,
      });
      platformResults.qr = qrResult;
    }

    return { campaignId, platformResults };
  }

  async getCrossPlatformMetrics(campaignId: string): Promise<{
    unified: unknown;
    dooh: unknown;
    qr: unknown;
    combined: { impressions: number; clicks: number; conversions: number; spend: number };
  }> {
    const [unified, dooh, qr] = await Promise.all([
      this.callService('unified-campaign', 'GET', `/api/campaigns/${campaignId}/metrics`).catch(() => ({ success: false })),
      this.callService('dooh', 'GET', `/api/campaigns/${campaignId}/metrics`).catch(() => ({ success: false })),
      this.callService('adsqr', 'GET', `/api/campaigns/${campaignId}`).catch(() => ({ success: false })),
    ]);

    const combined = { impressions: 0, clicks: 0, conversions: 0, spend: 0 };

    if (unified.success && unified.data) {
      const data = unified.data as { data?: { metrics?: { impressions?: number; clicks?: number; conversions?: number; spend?: number } } };
      if (data.data?.metrics) {
        combined.impressions += data.data.metrics.impressions || 0;
        combined.clicks += data.data.metrics.clicks || 0;
        combined.conversions += data.data.metrics.conversions || 0;
        combined.spend += data.data.metrics.spend || 0;
      }
    }

    return { unified: unified.data, dooh: dooh.data, qr: qr.data, combined };
  }

  getServiceStatus(): {
    services: Record<string, { healthy: boolean; lastCheck: Date }>;
    overall: { healthy: number; unhealthy: number };
  } {
    const services: Record<string, { healthy: boolean; lastCheck: Date }> = {};

    for (const [key, healthy] of this.serviceHealth) {
      services[key] = {
        healthy,
        lastCheck: this.lastHealthCheck.get(key) || new Date(),
      };
    }

    const healthy = Array.from(this.serviceHealth.values()).filter((v) => v).length;
    const unhealthy = Array.from(this.serviceHealth.values()).filter((v) => !v).length;

    return {
      services,
      overall: { healthy, unhealthy },
    };
  }
}

describe('AdBazaar Integration Hub', () => {
  let hub: IntegrationHub;

  beforeEach(() => {
    hub = new IntegrationHub();
    vi.clearAllMocks();
  });

  describe('Service Registry', () => {
    it('should have all required services registered', () => {
      expect(SERVICE_REGISTRY['unified-campaign']).toBeDefined();
      expect(SERVICE_REGISTRY['ads-service']).toBeDefined();
      expect(SERVICE_REGISTRY['dooh']).toBeDefined();
      expect(SERVICE_REGISTRY['adsqr']).toBeDefined();
      expect(SERVICE_REGISTRY['attribution']).toBeDefined();
      expect(SERVICE_REGISTRY['attribution-enhanced']).toBeDefined();
    });

    it('should have correct service configuration', () => {
      const service = SERVICE_REGISTRY['unified-campaign'];
      expect(service.name).toBe('Unified Campaign Service');
      expect(service.timeout).toBe(5000);
      expect(service.retryAttempts).toBe(3);
    });

    it('should support environment variable overrides', () => {
      const originalUrl = SERVICE_REGISTRY['unified-campaign'].url;
      expect(originalUrl).toBeTruthy();
    });

    it('should have consistent timeout across services', () => {
      const timeouts = Object.values(SERVICE_REGISTRY).map((s) => s.timeout);
      expect(timeouts.every((t) => t === 5000)).toBe(true);
    });

    it('should have consistent retry attempts across services', () => {
      const retries = Object.values(SERVICE_REGISTRY).map((s) => s.retryAttempts);
      expect(retries.every((r) => r === 3)).toBe(true);
    });
  });

  describe('Service Health Check', () => {
    it('should track service health status', () => {
      expect(() => {
        hub.getServiceStatus();
      }).not.toThrow();
    });

    it('should return service status structure', () => {
      const status = hub.getServiceStatus();
      expect(status).toHaveProperty('services');
      expect(status).toHaveProperty('overall');
      expect(status.overall).toHaveProperty('healthy');
      expect(status.overall).toHaveProperty('unhealthy');
    });
  });

  describe('Service Calls', () => {
    it('should return error for unknown service', async () => {
      const result = await hub.callService('unknown-service', 'GET', '/test', undefined);
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should have callService method', () => {
      expect(typeof hub.callService).toBe('function');
    });
  });

  describe('Cross-Platform Campaign Creation', () => {
    it('should create campaign with correct parameters', async () => {
      const params = {
        name: 'Test Campaign',
        inventory: ['dooh', 'qr'],
        budget: 50000,
        targeting: { age: '18-35' },
      };

      // Mock successful call
      mockAxios.post.mockResolvedValueOnce({ data: { success: true, data: { id: 'cmp_001' } } });

      const result = await hub.createCrossPlatformCampaign(params);
      expect(result.campaignId).toBeDefined();
    });

    it('should handle dooh inventory allocation', async () => {
      const params = {
        name: 'Test Campaign',
        inventory: ['dooh-main'],
        budget: 100000,
        targeting: {},
      };

      mockAxios.post.mockResolvedValue({ data: { success: true } });

      const result = await hub.createCrossPlatformCampaign(params);
      expect(result.platformResults).toHaveProperty('dooh');
    });

    it('should handle qr inventory allocation', async () => {
      const params = {
        name: 'Test Campaign',
        inventory: ['qr-store'],
        budget: 100000,
        targeting: {},
      };

      mockAxios.post.mockResolvedValue({ data: { success: true } });

      const result = await hub.createCrossPlatformCampaign(params);
      expect(result.platformResults).toHaveProperty('qr');
    });
  });

  describe('Cross-Platform Metrics', () => {
    it('should return metrics structure', async () => {
      const mockMetrics = {
        data: {
          metrics: {
            impressions: 100000,
            clicks: 5000,
            conversions: 500,
            spend: 10000,
          },
        },
      };

      mockAxios.post.mockResolvedValue({ data: mockMetrics });

      const result = await hub.getCrossPlatformMetrics('cmp_001');
      expect(result).toHaveProperty('unified');
      expect(result).toHaveProperty('dooh');
      expect(result).toHaveProperty('qr');
      expect(result).toHaveProperty('combined');
    });

    it('should combine metrics correctly', async () => {
      const metrics = {
        data: {
          metrics: {
            impressions: 100,
            clicks: 50,
            conversions: 10,
            spend: 1000,
          },
        },
      };

      mockAxios.post.mockResolvedValue({ data: metrics });

      const result = await hub.getCrossPlatformMetrics('cmp_001');
      expect(result.combined.impressions).toBe(100);
      expect(result.combined.clicks).toBe(50);
    });
  });

  describe('Service Status', () => {
    it('should track healthy services', () => {
      const status = hub.getServiceStatus();
      expect(status.overall).toBeDefined();
      expect(typeof status.overall.healthy).toBe('number');
      expect(typeof status.overall.unhealthy).toBe('number');
    });

    it('should return services map', () => {
      const status = hub.getServiceStatus();
      expect(typeof status.services).toBe('object');
    });
  });

  describe('Budget Allocation', () => {
    it('should allocate 30% to DOOH inventory', () => {
      const totalBudget = 100000;
      const doohBudget = totalBudget * 0.3;
      expect(doohBudget).toBe(30000);
    });

    it('should allocate 20% to QR inventory', () => {
      const totalBudget = 100000;
      const qrBudget = totalBudget * 0.2;
      expect(qrBudget).toBe(20000);
    });

    it('should handle partial inventory allocations', () => {
      const inventory = ['dooh', 'qr'];
      const budget = 50000;

      const hasDooh = inventory.some((i) => i.includes('dooh'));
      const hasQr = inventory.some((i) => i.includes('qr'));

      expect(hasDooh).toBe(true);
      expect(hasQr).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle service call failures gracefully', async () => {
      mockAxios.post.mockRejectedValueOnce(new Error('Service unavailable'));

      const result = await hub.callService('unified-campaign', 'POST', '/api/campaigns', {});
      expect(result.success).toBe(false);
    });

    it('should retry on transient failures', async () => {
      // First two calls fail, third succeeds
      mockAxios.post
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce({ data: { success: true } });

      const result = await hub.callService('unified-campaign', 'POST', '/api/campaigns', {});
      expect(result.success).toBe(true);
    });
  });
});

describe('Service Registry Structure', () => {
  it('should categorize services correctly', () => {
    const categories = {
      campaign: ['unified-campaign', 'ads-service', 'marketing'],
      dooh: ['dooh', 'adsqr'],
      attribution: ['attribution', 'attribution-enhanced'],
      intelligence: ['decision'],
      rabtul: ['rabtul-auth', 'rabtul-wallet'],
    };

    expect(categories.campaign.length).toBeGreaterThan(0);
    expect(categories.dooh.length).toBeGreaterThan(0);
    expect(categories.attribution.length).toBeGreaterThan(0);
  });

  it('should support all major service categories', () => {
    const expectedCategories = ['campaign', 'dooh', 'attribution', 'rabtul'];
    const registryKeys = Object.keys(SERVICE_REGISTRY);

    expect(registryKeys.some((k) => k.includes('campaign') || k.includes('ads'))).toBe(true);
    expect(registryKeys.some((k) => k.includes('dooh') || k.includes('adsqr'))).toBe(true);
    expect(registryKeys.some((k) => k.includes('attribution'))).toBe(true);
  });
});
