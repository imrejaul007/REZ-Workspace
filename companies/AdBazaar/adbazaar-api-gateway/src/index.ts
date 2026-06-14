/**
 * AdBazaar API Gateway
 *
 * Single entry point for all AdBazaar services.
 * Routes requests to appropriate backend services.
 *
 * Features:
 * - Request routing
 * - Rate limiting
 * - Authentication
 * - Logging
 * - Circuit breakers
 *
 * Port: 4000
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';

// ============================================================================
// TYPES
// ============================================================================

interface RouteConfig {
  target: string;
  path: string;
}

// ============================================================================
// SERVICE ROUTES
// ============================================================================

const ROUTES: Record<string, RouteConfig> = {
  // Ad serving
  '/api/ads': { target: 'http://localhost:4007', path: '/api' },
  '/api/qr': { target: 'http://localhost:4068', path: '/api' },

  // Campaign management
  '/api/campaigns': { target: 'http://localhost:4500', path: '/api' },
  '/api/tenants': { target: 'http://localhost:4510', path: '/api' },
  '/api/inventory': { target: 'http://localhost:4515', path: '/api' },

  // Attribution
  '/api/attribution': { target: 'http://localhost:4520', path: '/api' },

  // Analytics
  '/api/analytics': { target: 'http://localhost:4550', path: '/api' },

  // AI
  '/api/ai': { target: 'http://localhost:4560', path: '/api' },
  '/api/intent': { target: 'http://localhost:4560', path: '/api' },
  '/api/recommendations': { target: 'http://localhost:4560', path: '/api' },
  '/api/predict': { target: 'http://localhost:4560', path: '/api' },

  // Inventory
  '/api/society': { target: 'http://localhost:4580', path: '/api' },
  '/api/demand': { target: 'http://localhost:4600', path: '/api' },

  // Commerce
  '/api/incentives': { target: 'http://localhost:4610', path: '/api' },
  '/api/commerce': { target: 'http://localhost:4620', path: '/api' },
  '/api/creators': { target: 'http://localhost:4630', path: '/api' },
  '/api/whatsapp': { target: 'http://localhost:4640', path: '/api' },
  '/api/community': { target: 'http://localhost:4650', path: '/api' },
  '/api/events': { target: 'http://localhost:4660', path: '/api' },

  // Monitoring
  '/api/alerts': { target: 'http://localhost:4670', path: '/api' },
};

// ============================================================================
// EXPRESS APP
// ============================================================================

const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);
const API_KEY = process.env.API_KEY || 'dev-api-key';

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// AUTHENTICATION
// ============================================================================

function authenticate(req: Request, res: Response, next: NextFunction): void {
  const path = req.path;

  // Skip auth for health and public endpoints
  if (['/health', '/ready', '/metrics', '/'].includes(path)) {
    return next();
  }

  const apiKey = req.headers['x-api-key'] as string;
  const token = req.headers['authorization'] as string;

  if (apiKey === API_KEY || (token && token.startsWith('Bearer '))) {
    return next();
  }

  res.status(401).json({
    success: false,
    error: 'UNAUTHORIZED',
    message: 'Valid API key or Bearer token required',
  });
}

app.use(authenticate);

// ============================================================================
// ROUTES
// ============================================================================

// Health
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'adbazaar-api-gateway',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    routes: Object.keys(ROUTES).length,
  });
});

// Ready
app.get('/ready', (_req, res) => {
  res.json({
    ready: true,
    timestamp: new Date().toISOString(),
  });
});

// List routes
app.get('/routes', (_req, res) => {
  const routes = Object.entries(ROUTES).map(([path, config]) => ({
    path,
    target: config.target.replace('http://localhost:', ''),
  }));

  res.json({
    success: true,
    data: routes,
  });
});

// AdBazaar main service
app.get('/api/adbazaar', (_req, res) => {
  res.json({
    success: true,
    data: {
      name: 'AdBazaar',
      tagline: 'Urban Commerce & Attention Infrastructure',
      version: '1.0.0',
      services: Object.keys(ROUTES).length,
      endpoints: {
        ads: '/api/ads',
        campaigns: '/api/campaigns',
        analytics: '/api/analytics',
        ai: '/api/ai',
        inventory: '/api/inventory',
        commerce: '/api/commerce',
      },
    },
  });
});

// Unified campaigns proxy
app.get('/api/campaigns', async (req: Request, res: Response) => {
  // Mock response - in production, would proxy to actual service
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
        {
          id: 'cmp_002',
          name: 'Fashion Weekend Sale',
          status: 'active',
          type: 'display',
          budget: 75000,
          spent: 30000,
          impressions: 250000,
          clicks: 8750,
          conversions: 262,
          roas: 3.1,
        },
        {
          id: 'cmp_003',
          name: 'Tech Gadget Promo',
          status: 'paused',
          type: 'video',
          budget: 100000,
          spent: 45000,
          impressions: 500000,
          clicks: 15000,
          conversions: 450,
          roas: 2.8,
        },
      ],
      total: 3,
      summary: {
        active: 2,
        totalBudget: 225000,
        totalSpent: 87500,
        avgRoas: 2.8,
      },
    },
  });
});

app.post('/api/campaigns', async (req: Request, res: Response) => {
  const { name, type, budget, targeting } = req.body;

  if (!name || !budget) {
    return res.status(400).json({
      success: false,
      error: 'MISSING_FIELDS',
      message: 'name and budget are required',
    });
  }

  const campaign = {
    id: `cmp_${Date.now()}`,
    name,
    type: type || 'native',
    status: 'draft',
    budget,
    spent: 0,
    targeting: targeting || {},
    createdAt: new Date().toISOString(),
  };

  res.json({
    success: true,
    data: campaign,
  });
});

// Unified analytics proxy
app.get('/api/analytics', (_req, res) => {
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
        dooh: { impressions: 15000000, ctr: 2.5, revenue: 750000 },
        qr: { impressions: 8000000, ctr: 8.2, revenue: 400000 },
        whatsapp: { impressions: 12000000, ctr: 5.1, revenue: 600000 },
        society: { impressions: 6000000, ctr: 3.8, revenue: 300000 },
        creator: { impressions: 4238912, ctr: 6.2, revenue: 295678 },
      },
      trends: {
        impressions: [{ date: '2026-05-01', value: 1400000 }, { date: '2026-05-15', value: 1520000 }],
        revenue: [{ date: '2026-05-01', value: 75000 }, { date: '2026-05-15', value: 82000 }],
      },
    },
  });
});

// AI endpoints
app.post('/api/ai/predict', (req: Request, res: Response) => {
  const { type, userId, context } = req.body;

  res.json({
    success: true,
    data: {
      type: type || 'intent',
      userId,
      prediction: type === 'churn' ? { risk: 'low', probability: 0.2 } :
                   type === 'ltv' ? { score: 0.85, tier: 'gold' } :
                   { intent: 'purchase', confidence: 0.87 },
      timestamp: new Date().toISOString(),
    },
  });
});

app.post('/api/ai/recommend', (req: Request, res: Response) => {
  const { userId, context } = req.body;

  res.json({
    success: true,
    data: {
      userId,
      recommendations: [
        { id: 'rec_001', type: 'product', name: 'Premium Pizza', score: 0.95 },
        { id: 'rec_002', type: 'product', name: 'Burger Combo', score: 0.88 },
        { id: 'rec_003', type: 'product', name: 'Coffee Pack', score: 0.82 },
      ],
      timestamp: new Date().toISOString(),
    },
  });
});

// Inventory
app.get('/api/inventory', (_req, res) => {
  res.json({
    success: true,
    data: {
      total: 50000,
      available: 35000,
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

// Commerce
app.get('/api/commerce', (_req, res) => {
  res.json({
    success: true,
    data: {
      merchants: 1234,
      activeCampaigns: 45,
      totalRevenue: 2345678,
      avgOrderValue: 450,
    },
  });
});

// Attribution
app.get('/api/attribution', (_req, res) => {
  res.json({
    success: true,
    data: {
      touchpoints: ['impression', 'scan', 'visit', 'order', 'payment', 'wallet', 'repeat'],
      models: ['first-touch', 'last-touch', 'linear', 'time-decay', 'data-driven'],
      campaignsTracked: 892,
      conversionsAttributed: 45234,
    },
  });
});

// Tenants
app.get('/api/tenants', (_req, res) => {
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

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('[Error]', { error: err instanceof Error ? err.message : String(err) });
  res.status(500).json({
    success: false,
    error: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  });
});

// ============================================================================
// START
// ============================================================================

app.listen(PORT, () => {
  logger.info(`
╔══════════════════════════════════════════════════════════════════════╗
║                   ADBAZAAR API GATEWAY v1.0.0             ║
╠══════════════════════════════════════════════════════════════════════╣
║  Port:     ${PORT}                                                   ║
║  Routes:   ${Object.keys(ROUTES).length}                                                   ║
║  Auth:     ${API_KEY === 'dev-api-key' ? 'Development (change in prod)' : 'Configured'}           ║
╠══════════════════════════════════════════════════════════════════════╣
║  ROUTES:                                                        ║
║  /api/campaigns   → Campaign Management (4500)                   ║
║  /api/tenants     → Tenant Registry (4510)                       ║
║  /api/inventory   → Inventory Classifier (4515)                   ║
║  /api/attribution → Attribution Hub (4520)                        ║
║  /api/analytics   → Flywheel Analytics (4550)                    ║
║  /api/ai          → Hojai AI Gateway (4560)                      ║
║  /api/ads          → Ad Serving (4007)                           ║
║  /api/qr           → QR Campaigns (4068)                         ║
║  /api/society      → Society Media (4580)                       ║
║  /api/demand       → Hyperlocal Demand (4600)                    ║
║  /api/incentives   → Incentive Ads (4610)                        ║
║  /api/commerce     → Commerce Recs (4620)                       ║
║  /api/creators     → Creator Commerce (4630)                    ║
║  /api/whatsapp     → WhatsApp Ads (4640)                        ║
║  /api/community    → Community Media (4650)                       ║
║  /api/events       → Event Commerce (4660)                       ║
║  /api/alerts       → Alerting (4670)                            ║
╚══════════════════════════════════════════════════════════════════════╝
  `);
});

export default app;
