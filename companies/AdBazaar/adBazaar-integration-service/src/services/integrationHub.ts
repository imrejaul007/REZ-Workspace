/**
 * AdBazaar Integration Hub
 *
 * Central integration service that connects all AdBazaar services:
 * - Unified Campaign Service
 * - DOOH Service
 * - QR Campaigns
 * - Attribution Hub
 * - RABTUL Services
 * - REZ Intelligence
 *
 * This is the "glue" that makes the ecosystem work together.
 *
 * Port: 4570
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import axios from 'axios';

// ============================================================================
// SERVICE REGISTRY
// ============================================================================

interface ServiceConfig {
  name: string;
  url: string;
  timeout: number;
  retryAttempts: number;
}

const SERVICE_REGISTRY: Record<string, ServiceConfig> = {
  // Campaign Services
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

  // DOOH Services
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

  // Attribution
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

  // Intelligence
  'decision': {
    name: 'Decision Engine',
    url: process.env.DECISION_SERVICE_URL || 'http://localhost:4027',
    timeout: 5000,
    retryAttempts: 3,
  },
  'hojai': {
    name: 'Hojai AI Gateway',
    url: process.env.HOJAI_URL || 'http://localhost:4560',
    timeout: 5000,
    retryAttempts: 3,
  },

  // Inventory
  'inventory': {
    name: 'Inventory Classifier',
    url: process.env.INVENTORY_SERVICE_URL || 'http://localhost:4515',
    timeout: 5000,
    retryAttempts: 3,
  },

  // Tenant
  'tenant': {
    name: 'Tenant Registry',
    url: process.env.TENANT_SERVICE_URL || 'http://localhost:4510',
    timeout: 5000,
    retryAttempts: 3,
  },

  // Ecosystem
  'ride': {
    name: 'ReZ Ride Integration',
    url: process.env.RIDE_SERVICE_URL || 'http://localhost:4530',
    timeout: 5000,
    retryAttempts: 3,
  },
  'hospitality': {
    name: 'Hospitality Integration',
    url: process.env.HOSPITALITY_SERVICE_URL || 'http://localhost:4535',
    timeout: 5000,
    retryAttempts: 3,
  },
  'buzzlocal': {
    name: 'BuzzLocal Integration',
    url: process.env.BUZZLOCAL_SERVICE_URL || 'http://localhost:4545',
    timeout: 5000,
    retryAttempts: 3,
  },
  'corpperks': {
    name: 'CorpPerks Integration',
    url: process.env.CORPPERKS_SERVICE_URL || 'http://localhost:4555',
    timeout: 5000,
    retryAttempts: 3,
  },
  'commerce': {
    name: 'Commerce Graph',
    url: process.env.COMMERCE_SERVICE_URL || 'http://localhost:4540',
    timeout: 5000,
    retryAttempts: 3,
  },
  'flywheel': {
    name: 'Flywheel Analytics',
    url: process.env.FLYWHEEL_SERVICE_URL || 'http://localhost:4550',
    timeout: 5000,
    retryAttempts: 3,
  },

  // RABTUL Services
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
  'rabtul-notifications': {
    name: 'RABTUL Notifications',
    url: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4011',
    timeout: 5000,
    retryAttempts: 3,
  },
  'rabtul-payment': {
    name: 'RABTUL Payment',
    url: process.env.PAYMENT_SERVICE_URL || 'http://localhost:4001',
    timeout: 5000,
    retryAttempts: 3,
  },
};

// ============================================================================
// INTEGRATION HUB
// ============================================================================

class IntegrationHub {
  private serviceHealth: Map<string, boolean> = new Map();
  private lastHealthCheck: Map<string, Date> = new Map();

  /**
   * Health check all services
   */
  async healthCheck(): Promise<Record<string, { healthy: boolean; latency?: number; error?: string }>> {
    const results: Record<string, { healthy: boolean; latency?: number; error?: string }> = {};

    await Promise.all(
      Object.entries(SERVICE_REGISTRY).map(async ([key, service]) => {
        const start = Date.now();
        try {
          const response = await axios.get(`${service.url}/health`, {
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

  /**
   * Call a service with retry
   */
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
        const response = await axios({
          method,
          url: `${service.url}${path}`,
          data,
          timeout: service.timeout,
        });

        return { success: true, data: response.data };
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';

        if (attempt < service.retryAttempts) {
          // Wait before retry (exponential backoff)
          await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 100));
        }
      }
    }

    return { success: false, error: lastError };
  }

  /**
   * Get unified campaign data
   */
  async getUnifiedCampaign(campaignId: string): Promise<unknown> {
    const result = await this.callService('unified-campaign', 'GET', `/api/campaigns/${campaignId}`);
    return result.data;
  }

  /**
   * Create campaign across all platforms
   */
  async createCrossPlatformCampaign(params: {
    name: string;
    inventory: string[];
    budget: number;
    targeting: Record<string, unknown>;
  }): Promise<{
    campaignId: string;
    platformResults: Record<string, unknown>;
  }> {
    // 1. Create unified campaign
    const unifiedResult = await this.callService('unified-campaign', 'POST', '/api/campaigns', {
      name: params.name,
      inventory: params.inventory,
      budget: params.budget,
      targeting: params.targeting,
    });

    if (!unifiedResult.success) {
      throw new Error('Failed to create unified campaign');
    }

    const campaignId = (unifiedResult.data as { data: { id: string } }).data.id;

    // 2. Create DOOH campaign if DOOH inventory
    const platformResults: Record<string, unknown> = { unified: unifiedResult.data };

    if (params.inventory.some(i => i.includes('dooh'))) {
      const doohResult = await this.callService('dooh', 'POST', '/api/campaigns', {
        name: params.name,
        inventory: params.inventory.filter(i => i.includes('dooh')),
        budget: params.budget * 0.3, // 30% to DOOH
      });
      platformResults.dooh = doohResult;
    }

    // 3. Create QR campaign if QR inventory
    if (params.inventory.some(i => i.includes('qr'))) {
      const qrResult = await this.callService('adsqr', 'POST', '/api/campaigns', {
        name: params.name,
        inventory: params.inventory.filter(i => i.includes('qr')),
        budget: params.budget * 0.2, // 20% to QR
      });
      platformResults.qr = qrResult;
    }

    return { campaignId, platformResults };
  }

  /**
   * Get cross-platform metrics
   */
  async getCrossPlatformMetrics(campaignId: string): Promise<{
    unified: unknown;
    dooh: unknown;
    qr: unknown;
    combined: {
      impressions: number;
      clicks: number;
      conversions: number;
      spend: number;
    };
  }> {
    const [unified, dooh, qr, attribution] = await Promise.all([
      this.callService('unified-campaign', 'GET', `/api/campaigns/${campaignId}/metrics`).catch(() => ({ success: false })),
      this.callService('dooh', 'GET', `/api/campaigns/${campaignId}/metrics`).catch(() => ({ success: false })),
      this.callService('adsqr', 'GET', `/api/campaigns/${campaignId}`).catch(() => ({ success: false })),
      this.callService('attribution-enhanced', 'POST', '/api/campaign/attribution', { campaignId }).catch(() => ({ success: false })),
    ]);

    // Combine metrics
    const combined = {
      impressions: 0,
      clicks: 0,
      conversions: 0,
      spend: 0,
    };

    // Extract from unified
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

  /**
   * Get audience data from all sources
   */
  async getUnifiedAudience(params: {
    city?: string;
    interests?: string[];
    demographics?: Record<string, unknown>;
  }): Promise<{
    ride: unknown;
    hospitality: unknown;
    buzzlocal: unknown;
    corpperks: unknown;
    commerce: unknown;
    combined: { totalReach: number; segments: string[] };
  }> {
    const [ride, hospitality, buzzlocal, corpperks, commerce] = await Promise.all([
      params.city ? this.callService('ride', 'POST', '/api/area/users', { city: params.city }).catch(() => ({ success: false })) : { success: false },
      params.city ? this.callService('hospitality', 'GET', `/api/guests/active?city=${params.city}`).catch(() => ({ success: false })) : { success: false },
      params.city ? this.callService('buzzlocal', 'GET', `/api/communities?city=${params.city}`).catch(() => ({ success: false })) : { success: false },
      params.city ? this.callService('corpperks', 'GET', `/api/employees?city=${params.city}`).catch(() => ({ success: false })) : { success: false },
      params.interests ? this.callService('commerce', 'POST', '/api/audience/category', { categories: params.interests }).catch(() => ({ success: false })) : { success: false },
    ]);

    // Calculate combined reach
    let totalReach = 0;
    const segments: string[] = [];

    if (ride.success && ride.data) {
      const data = ride.data as { data?: { count?: number } };
      totalReach += data?.data?.count || 0;
      segments.push('ride_users');
    }

    if (hospitality.success && hospitality.data) {
      const data = hospitality.data as { data?: { count?: number } };
      totalReach += data?.data?.count || 0;
      segments.push('travelers');
    }

    if (buzzlocal.success && buzzlocal.data) {
      const data = buzzlocal.data as { data?: { count?: number } };
      totalReach += data?.data?.count || 0;
      segments.push('residents');
    }

    if (corpperks.success && corpperks.data) {
      const data = corpperks.data as { data?: { count?: number } };
      totalReach += data?.data?.count || 0;
      segments.push('employees');
    }

    return {
      ride: ride.data,
      hospitality: hospitality.data,
      buzzlocal: buzzlocal.data,
      corpperks: corpperks.data,
      commerce: commerce.data,
      combined: { totalReach, segments },
    };
  }

  /**
   * Record event across attribution services
   */
  async recordAttributionEvent(params: {
    userId: string;
    sessionId: string;
    source: string;
    campaignId: string;
    value?: number;
  }): Promise<void> {
    await Promise.all([
      this.callService('attribution', 'POST', '/api/events', params).catch(() => {}),
      this.callService('attribution-enhanced', 'POST', '/api/touchpoint', {
        sessionId: params.sessionId,
        userId: params.userId,
        source: params.source,
        campaignId: params.campaignId,
      }).catch(() => {}),
      this.callService('flywheel', 'POST', '/api/events', {
        eventType: 'campaign',
        source: 'adbazaar',
        userId: params.userId,
        campaignId: params.campaignId,
        value: params.value,
      }).catch(() => {}),
    ]);
  }

  /**
   * Get service status
   */
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

    const healthy = Array.from(this.serviceHealth.values()).filter(v => v).length;
    const unhealthy = Array.from(this.serviceHealth.values()).filter(v => !v).length;

    return {
      services,
      overall: { healthy, unhealthy },
    };
  }
}

const integrationHub = new IntegrationHub();

// ============================================================================
// APP
// ============================================================================

const app = express();
const PORT = parseInt(process.env.PORT || '4570', 10);

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'adBazaar-integration-hub', version: '1.0.0' });
});

/**
 * GET /api/services
 * Get service registry
 */
app.get('/api/services', (_req, res) => {
  const status = integrationHub.getServiceStatus();

  res.json({
    success: true,
    data: {
      registry: SERVICE_REGISTRY,
      status: status.services,
      summary: status.overall,
    },
  });
});

/**
 * GET /api/services/health
 * Health check all services
 */
app.get('/api/services/health', async (_req, res) => {
  const health = await integrationHub.healthCheck();

  const allHealthy = Object.values(health).every(s => s.healthy);

  res.json({
    success: true,
    status: allHealthy ? 'healthy' : 'degraded',
    services: health,
  });
});

/**
 * GET /api/campaigns/:id
 * Get unified campaign data
 */
app.get('/api/campaigns/:id', async (req, res) => {
  try {
    const data = await integrationHub.getUnifiedCampaign(req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    logger.error('Get campaign error:', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * POST /api/campaigns
 * Create cross-platform campaign
 */
app.post('/api/campaigns', async (req, res) => {
  try {
    const result = await integrationHub.createCrossPlatformCampaign(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Create campaign error:', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * GET /api/campaigns/:id/metrics
 * Get cross-platform metrics
 */
app.get('/api/campaigns/:id/metrics', async (req, res) => {
  try {
    const metrics = await integrationHub.getCrossPlatformMetrics(req.params.id);
    res.json({ success: true, data: metrics });
  } catch (error) {
    logger.error('Get metrics error:', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * POST /api/audience
 * Get unified audience data
 */
app.post('/api/audience', async (req, res) => {
  try {
    const audience = await integrationHub.getUnifiedAudience(req.body);
    res.json({ success: true, data: audience });
  } catch (error) {
    logger.error('Get audience error:', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * POST /api/events
 * Record attribution event
 */
app.post('/api/events', async (req, res) => {
  try {
    await integrationHub.recordAttributionEvent(req.body);
    res.json({ success: true });
  } catch (error) {
    logger.error('Record event error:', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * POST /api/forward/:service
 * Forward request to a service
 */
app.post('/api/forward/:service', async (req, res) => {
  try {
    const { service } = req.params;
    const result = await integrationHub.callService(service, 'POST', req.body.path, req.body.data);

    if (result.success) {
      res.json({ success: true, data: result.data });
    } else {
      res.status(502).json({ success: false, error: result.error });
    }
  } catch (error) {
    logger.error('Forward error:', error);
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

app.listen(PORT, () => {
  logger.info(`[AdBazaar Integration Hub] Running on port ${PORT}`);
});

export default app;
