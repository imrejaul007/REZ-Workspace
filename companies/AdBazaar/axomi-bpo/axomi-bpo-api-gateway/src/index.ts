/**
 * ADBAZAR BPO API Gateway
 * Port: 4971
 *
 * Routes to:
 * - Voice BPO Service (4970)
 * - External integrations
 */

import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = parseInt(process.env.PORT || '4971', 10);

// Health check service endpoints (mock data for gateway routing)
const serviceHealth = new Map<string, { status: string; lastCheck: Date; latency: number }>();

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] || uuidv4();
  (req as any).requestId = requestId;

  const start = Date.now();
  res.on('finish', () => {
    logger.info(`[${requestId}] ${req.method} ${req.path} ${res.statusCode} ${Date.now() - start}ms`);
  });

  res.setHeader('X-Request-Id', requestId as string);
  next();
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'api-gateway',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// SERVICE REGISTRY
// ============================================

interface ServiceEndpoint {
  id: string;
  name: string;
  url: string;
  port: number;
  health: string;
  capabilities: string[];
  lastCheck: Date;
}

const registeredServices: Map<string, ServiceEndpoint> = new Map([
  ['voice-bpo', {
    id: 'voice-bpo',
    name: 'Voice BPO Service',
    url: 'http://localhost',
    port: 4970,
    health: 'healthy',
    capabilities: ['campaigns', 'agents', 'calls', 'ivr', 'queues'],
    lastCheck: new Date(),
  }],
]);

/**
 * GET /services
 * List registered services
 */
app.get('/services', (req: Request, res: Response) => {
  const services = Array.from(registeredServices.values());
  res.json({ success: true, data: { services, total: services.length } });
});

/**
 * POST /services
 * Register a new service
 */
app.post('/services', (req: Request, res: Response) => {
  const { id, name, url, port, capabilities } = req.body;

  if (!id || !name || !url || !port) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'id, name, url, and port are required' } });
    return;
  }

  const service: ServiceEndpoint = {
    id,
    name,
    url,
    port,
    health: 'unknown',
    capabilities: capabilities || [],
    lastCheck: new Date(),
  };

  registeredServices.set(id, service);

  res.json({ success: true, data: service });
});

/**
 * GET /services/:id
 * Get service details
 */
app.get('/services/:id', (req: Request, res: Response) => {
  const service = registeredServices.get(req.params.id);

  if (!service) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Service not found' } });
    return;
  }

  res.json({ success: true, data: service });
});

/**
 * POST /services/:id/health
 * Update service health
 */
app.post('/services/:id/health', (req: Request, res: Response) => {
  const service = registeredServices.get(req.params.id);

  if (!service) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Service not found' } });
    return;
  }

  const { status, latency } = req.body;

  service.health = status || 'unknown';
  service.lastCheck = new Date();

  res.json({ success: true, data: service });
});

// ============================================
// GATEWAY ROUTES (Proxy to Voice BPO)
// ============================================

/**
 * GET /voice/campaigns
 * Proxy to Voice BPO campaigns
 */
app.get('/voice/campaigns', async (req: Request, res: Response) => {
  // In production, would proxy to voice-bpo service
  res.json({
    success: true,
    data: { message: 'Proxy to Voice BPO - GET /campaigns' },
    proxied: 'voice-bpo',
  });
});

/**
 * POST /voice/campaigns
 * Proxy to Voice BPO create campaign
 */
app.post('/voice/campaigns', async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: { message: 'Proxy to Voice BPO - POST /campaigns' },
    proxied: 'voice-bpo',
  });
});

/**
 * GET /voice/agents
 * Proxy to Voice BPO agents
 */
app.get('/voice/agents', async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: { message: 'Proxy to Voice BPO - GET /agents' },
    proxied: 'voice-bpo',
  });
});

/**
 * POST /voice/agents
 * Proxy to Voice BPO create agent
 */
app.post('/voice/agents', async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: { message: 'Proxy to Voice BPO - POST /agents' },
    proxied: 'voice-bpo',
  });
});

/**
 * GET /voice/calls
 * Proxy to Voice BPO calls
 */
app.get('/voice/calls', async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: { message: 'Proxy to Voice BPO - GET /calls' },
    proxied: 'voice-bpo',
  });
});

/**
 * POST /voice/calls
 * Proxy to Voice BPO initiate call
 */
app.post('/voice/calls', async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: { message: 'Proxy to Voice BPO - POST /calls' },
    proxied: 'voice-bpo',
  });
});

// ============================================
// REPORTS
// ============================================

/**
 * GET /reports/bpo
 * Get BPO reports
 */
app.get('/reports/bpo', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      summary: {
        totalCampaigns: 0,
        activeCampaigns: 0,
        totalAgents: 0,
        availableAgents: 0,
        totalCalls: 0,
        answeredCalls: 0,
        avgHandleTime: 0,
        conversionRate: 0,
      },
      period: {
        start: new Date().toISOString(),
        end: new Date().toISOString(),
      },
    },
  });
});

/**
 * GET /reports/bpo/campaigns
 * Campaign performance report
 */
app.get('/reports/bpo/campaigns', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      campaigns: [],
      total: 0,
    },
  });
});

/**
 * GET /reports/bpo/agents
 * Agent performance report
 */
app.get('/reports/bpo/agents', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      agents: [],
      total: 0,
    },
  });
});

/**
 * GET /reports/bpo/calls
 * Call statistics report
 */
app.get('/reports/bpo/calls', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      totalCalls: 0,
      answeredCalls: 0,
      missedCalls: 0,
      avgDuration: 0,
      byStatus: {},
      byHour: {},
    },
  });
});

// ============================================
// INTEGRATIONS
// ============================================

/**
 * GET /integrations
 * List available integrations
 */
app.get('/integrations', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      integrations: [
        { id: 'twilio', name: 'Twilio', status: 'configured', capabilities: ['voice', 'sms'] },
        { id: 'nexmo', name: 'Nexmo/Vonage', status: 'available', capabilities: ['voice', 'sms'] },
        { id: 'plivo', name: 'Plivo', status: 'available', capabilities: ['voice', 'sms'] },
      ],
    },
  });
});

/**
 * POST /integrations/twilio/callback
 * Twilio webhook callback
 */
app.post('/integrations/twilio/callback', (req: Request, res: Response) => {
  const { CallSid, CallStatus, From, To, CallDuration } = req.body;

  logger.info(`Twilio callback: ${CallSid} - ${CallStatus}`);

  res.status(200).send('OK');
});

/**
 * GET /integrations/:id/status
 * Check integration status
 */
app.get('/integrations/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;

  res.json({
    success: true,
    data: {
      integration: id,
      status: 'configured',
      lastSync: new Date().toISOString(),
    },
  });
});

// ============================================
// WEBHOOKS
// ============================================

interface WebhookConfig {
  id: string;
  service: string;
  event: string;
  url: string;
  secret?: string;
  active: boolean;
}

const webhooks = new Map<string, WebhookConfig>();

/**
 * GET /webhooks
 * List webhooks
 */
app.get('/webhooks', (req: Request, res: Response) => {
  const list = Array.from(webhooks.values());
  res.json({ success: true, data: { webhooks: list, total: list.length } });
});

/**
 * POST /webhooks
 * Create webhook
 */
app.post('/webhooks', (req: Request, res: Response) => {
  const { service, event, url, secret } = req.body;

  if (!service || !event || !url) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'service, event, and url are required' } });
    return;
  }

  const webhook: WebhookConfig = {
    id: uuidv4(),
    service,
    event,
    url,
    secret,
    active: true,
  };

  webhooks.set(webhook.id, webhook);

  res.json({ success: true, data: webhook });
});

/**
 * DELETE /webhooks/:id
 * Delete webhook
 */
app.delete('/webhooks/:id', (req: Request, res: Response) => {
  const deleted = webhooks.delete(req.params.id);
  res.json({ success: deleted, data: { deleted } });
});

// ============================================
// STATISTICS
// ============================================

/**
 * GET /stats
 * Get gateway statistics
 */
app.get('/stats', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      registeredServices: registeredServices.size,
      webhooks: webhooks.size,
      requests: {
        total: 0,
        success: 0,
        errors: 0,
      },
      uptime: process.uptime(),
    },
  });
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` },
  });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', { error: err instanceof Error ? err.message : String(err) });
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
  });
});

// ============================================
// STARTUP
// ============================================

app.listen(PORT, () => {
  logger.info(`
╔══════════════════════════════════════════════════════════════════╗
║                    ADBAZAR BPO API Gateway                       ║
╠══════════════════════════════════════════════════════════════════╣
║  Status:      RUNNING                                          ║
║  Port:        ${PORT}                                                  ║
║  Version:     1.0.0                                           ║
╠══════════════════════════════════════════════════════════════════╣
║  Routes to:                                                  ║
║  • Voice BPO Service (port 4970)                             ║
╠══════════════════════════════════════════════════════════════════╣
║  Endpoints:                                                 ║
║  GET  /services      - List services                         ║
║  POST /services      - Register service                      ║
║  GET  /voice/*      - Proxy to Voice BPO                     ║
║  GET  /reports/bpo  - BPO reports                           ║
║  GET  /integrations  - List integrations                     ║
║  GET  /webhooks      - List webhooks                         ║
║  GET  /stats         - Gateway statistics                   ║
╚══════════════════════════════════════════════════════════════════╝
  `);
});

export default app;