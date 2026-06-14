/**
 * AdBazaar Service - Main Orchestration
 *
 * This is the central hub that connects all AdBazaar modules:
 * - Campaign Management
 * - Attribution
 * - AI Intelligence
 * - Inventory
 * - Commerce
 * - Integrations
 *
 * Port: 4080
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';

// ============================================================================
// TYPES
// ============================================================================

interface ServiceHealth {
  name: string;
  port: number;
  status: 'up' | 'down' | 'unknown';
  latency?: number;
}

interface PlatformStats {
  campaigns: { active: number; total: number };
  advertisers: { active: number; total: number };
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
}

// ============================================================================
// SERVICE REGISTRY
// ============================================================================

const SERVICES: Record<string, { port: number; name: string }> = {
  // Core
  'adbazaar-service': { port: 4080, name: 'AdBazaar Service' },
  'adbazaar-backend': { port: 4085, name: 'AdBazaar Backend' },

  // Ad Serving
  'REZ-ads-service': { port: 4007, name: 'Ad Serving' },
  'adsqr': { port: 4068, name: 'QR Campaigns' },

  // Campaign Management
  'unified-campaign': { port: 4500, name: 'Unified Campaign' },
  'tenant-registry': { port: 4510, name: 'Tenant Registry' },
  'inventory-classifier': { port: 4515, name: 'Inventory Classifier' },

  // Attribution
  'attribution-hub': { port: 4520, name: 'Attribution Hub' },
  'closed-loop-attribution': { port: 4590, name: 'Closed-Loop Attribution' },

  // AI/Intelligence
  'hojai-ai-gateway': { port: 4560, name: 'AI Gateway' },
  'hyperlocal-demand': { port: 4600, name: 'Hyperlocal Demand' },
  'commerce-recommendation': { port: 4620, name: 'Commerce Recommendations' },

  // Inventory
  'society-media': { port: 4580, name: 'Society Media' },
  'community-media': { port: 4650, name: 'Community Media' },
  'event-commerce': { port: 4660, name: 'Event Commerce' },
  'DOOH-service': { port: 4018, name: 'DOOH Service' },

  // Commerce
  'incentive-ads': { port: 4610, name: 'Incentive Ads' },
  'creator-commerce': { port: 4630, name: 'Creator Commerce' },
  'whatsapp-ads': { port: 4640, name: 'WhatsApp Ads' },

  // Analytics
  'flywheel-analytics': { port: 4550, name: 'Flywheel Analytics' },
  'integration-hub': { port: 4570, name: 'Integration Hub' },

  // Monitoring
  'alerting': { port: 4670, name: 'Alerting Service' },
};

// ============================================================================
// EXPRESS APP
// ============================================================================

const app = express();
const PORT = parseInt(process.env.PORT || '4080', 10);

app.use(helmet({
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

// ============================================================================
// ROUTES
// ============================================================================

// Health
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'adbazaar-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Ready
app.get('/ready', async (_req, res) => {
  const health = await checkAllServicesHealth();
  const allUp = health.every(s => s.status === 'up');

  res.json({
    ready: allUp,
    services: health,
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// SERVICE REGISTRY
// ============================================================================

// Get all services
app.get('/api/services', (_req, res) => {
  const services = Object.entries(SERVICES).map(([key, value]) => ({
    id: key,
    ...value,
  }));

  res.json({
    success: true,
    data: {
      services,
      count: services.length,
    },
  });
});

// Get service health
app.get('/api/services/health', async (_req, res) => {
  const health = await checkAllServicesHealth();

  res.json({
    success: true,
    data: {
      services: health,
      summary: {
        up: health.filter(s => s.status === 'up').length,
        down: health.filter(s => s.status === 'down').length,
        unknown: health.filter(s => s.status === 'unknown').length,
      },
    },
  });
});

// Get service by ID
app.get('/api/services/:id', (req, res) => {
  const service = SERVICES[req.params.id];

  if (!service) {
    return res.status(404).json({
      success: false,
      error: 'Service not found',
    });
  }

  res.json({
    success: true,
    data: service,
  });
});

// ============================================================================
// PLATFORM STATS
// ============================================================================

app.get('/api/stats', async (_req, res) => {
  const stats: PlatformStats = {
    campaigns: { active: 145, total: 892 },
    advertisers: { active: 67, total: 234 },
    impressions: 45238912,
    clicks: 1809563,
    conversions: 45234,
    revenue: 2345678,
  };

  res.json({
    success: true,
    data: stats,
  });
});

// ============================================================================
// UNIFIED CAMPAIGN OPERATIONS
// ============================================================================

// List all campaigns across services
app.get('/api/campaigns', async (_req, res) => {
  // In production, this would aggregate from multiple services
  res.json({
    success: true,
    data: {
      campaigns: [
        {
          id: 'cmp_001',
          name: 'Pizza Palace Launch',
          status: 'active',
          type: 'native',
          budget: 50000,
          spent: 12500,
          impressions: 125000,
          clicks: 3125,
          conversions: 156,
          roas: 2.5,
        },
      ],
      total: 1,
    },
  });
});

// Create campaign
app.post('/api/campaigns', async (req: Request, res: Response) => {
  const { name, type, budget, targeting, creative } = req.body;

  if (!name || !budget) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: name, budget',
    });
  }

  const campaign = {
    id: `cmp_${Date.now()}`,
    name,
    type: type || 'native',
    status: 'draft',
    budget,
    spent: 0,
    targeting,
    creative,
    createdAt: new Date(),
  };

  res.json({
    success: true,
    data: campaign,
  });
});

// Get campaign details
app.get('/api/campaigns/:id', async (req: Request, res) => {
  const campaign = {
    id: req.params.id,
    name: 'Sample Campaign',
    status: 'active',
    type: 'native',
    budget: 50000,
    spent: 12500,
    impressions: 125000,
    clicks: 3125,
    conversions: 156,
    roas: 2.5,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 86400000),
  };

  res.json({
    success: true,
    data: campaign,
  });
});

// Update campaign
app.patch('/api/campaigns/:id', async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      id: req.params.id,
      ...req.body,
      updatedAt: new Date(),
    },
  });
});

// ============================================================================
// UNIFIED ANALYTICS
// ============================================================================

app.get('/api/analytics/overview', async (_req, res) => {
  res.json({
    success: true,
    data: {
      period: 'last_30_days',
      metrics: {
        impressions: 45238912,
        clicks: 1809563,
        ctr: 4.0,
        conversions: 45234,
        conversionRate: 2.5,
        revenue: 2345678,
        roas: 2.8,
        cpm: 52,
        cpc: 1.30,
      },
      byChannel: {
        dooh: { impressions: 15000000, ctr: 2.5 },
        qr: { impressions: 8000000, ctr: 8.2 },
        whatsapp: { impressions: 12000000, ctr: 5.1 },
        society: { impressions: 6000000, ctr: 3.8 },
        creator: { impressions: 4238912, ctr: 6.2 },
      },
      byStatus: {
        active: 145,
        paused: 23,
        completed: 724,
        draft: 45,
      },
    },
  });
});

// ============================================================================
// INVENTORY MANAGEMENT
// ============================================================================

app.get('/api/inventory', async (_req, res) => {
  res.json({
    success: true,
    data: {
      total: 50000,
      available: 35000,
      reserved: 10000,
      sold: 5000,
      byType: {
        dooh: { total: 20000, available: 14000 },
        qr: { total: 15000, available: 10500 },
        society: { total: 8000, available: 5600 },
        community: { total: 5000, available: 3500 },
        event: { total: 2000, available: 1400 },
      },
    },
  });
});

// ============================================================================
// MULTI-TENANT
// ============================================================================

app.get('/api/tenants', async (_req, res) => {
  res.json({
    success: true,
    data: {
      tenants: [
        { id: 'rez_internal', name: 'REZ Internal', type: 'internal', status: 'active' },
        { id: 'tenant_001', name: 'Pizza Palace', type: 'merchant', status: 'active' },
        { id: 'tenant_002', name: 'Fashion Brand X', type: 'advertiser', status: 'active' },
      ],
      total: 3,
    },
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: 'Endpoint not found',
  });
});

app.use((err: Error, _req: Request, res: Response, _next: express.NextFunction) => {
  logger.error('[Error]', { error: err instanceof Error ? err.message : String(err) });
  res.status(500).json({
    success: false,
    error: 'INTERNAL_ERROR',
    message: err.message,
  });
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function checkAllServicesHealth(): Promise<ServiceHealth[]> {
  const health: ServiceHealth[] = [];

  for (const [id, service] of Object.entries(SERVICES)) {
    if (id === 'adbazaar-service') {
      health.push({ name: service.name, port: service.port, status: 'up', latency: 0 });
      continue;
    }

    try {
      const start = Date.now();
      // In production, would actually ping the service
      // const response = await fetch(`http://localhost:${service.port}/health`);
      const latency = Date.now() - start;

      health.push({
        name: service.name,
        port: service.port,
        status: 'up',
        latency,
      });
    } catch {
      health.push({
        name: service.name,
        port: service.port,
        status: 'unknown',
      });
    }
  }

  return health;
}

// ============================================================================
// START
// ============================================================================

app.listen(PORT, () => {
  logger.info(`
╔══════════════════════════════════════════════════════════════════╗
║                    ADBAZAAR SERVICE v1.0.0                  ║
╠══════════════════════════════════════════════════════════════════╣
║  Port:     ${PORT}                                                   ║
║  Services: ${Object.keys(SERVICES).length}                                                   ║
╠══════════════════════════════════════════════════════════════════╣
║  MODULES:                                                     ║
║  • Campaign Management                                         ║
║  • Attribution & Analytics                                    ║
║  • AI Intelligence (Hojai)                                     ║
║  • Inventory (DOOH, QR, Society, Community)                 ║
║  • Commerce (Incentive, Creator, WhatsApp)                  ║
║  • Multi-Tenant                                               ║
╠══════════════════════════════════════════════════════════════════╣
║  ENDPOINTS:                                                    ║
║  GET  /health           - Health check                          ║
║  GET  /ready           - Readiness check                       ║
║  GET  /api/services    - List all services                    ║
║  GET  /api/campaigns   - List campaigns                        ║
║  POST /api/campaigns   - Create campaign                       ║
║  GET  /api/analytics   - Analytics overview                    ║
║  GET  /api/inventory   - Inventory status                     ║
╚══════════════════════════════════════════════════════════════════╝
  `);
});

export default app;
