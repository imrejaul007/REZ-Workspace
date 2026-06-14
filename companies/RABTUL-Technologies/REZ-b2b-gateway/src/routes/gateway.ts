import { Router, Request, Response, NextFunction } from 'express';
import { proxyService, ProxyError } from '../services/proxyService';
import { unifiedService } from '../services/unifiedService';
import { ServiceName } from '../config/services';

const router = Router();

// Route mappings
const ROUTE_MAP: Record<string, ServiceName> = {
  // TAM Builder
  '/api/b2b/icps': 'tamBuilder',
  '/api/b2b/companies': 'tamBuilder',
  '/api/b2b/accounts': 'tamBuilder',
  '/api/b2b/contacts': 'tamBuilder',
  '/api/b2b/tam': 'tamBuilder',

  // Signal Service
  '/api/b2b/signals': 'signalService',
  '/api/b2b/alerts': 'signalService',
  '/api/b2b/trends': 'signalService',

  // Outbound Service
  '/api/b2b/sequences': 'outboundService',
  '/api/b2b/prospects': 'outboundService',
  '/api/b2b/outbound': 'outboundService',

  // Deal Intelligence
  '/api/b2b/deals': 'dealIntelligence',
  '/api/b2b/scores': 'dealIntelligence',
  '/api/b2b/intelligence': 'dealIntelligence',

  // Activity Service
  '/api/b2b/activities': 'activityService',

  // Meeting Notes
  '/api/b2b/notes': 'meetingNotes',
  '/api/b2b/meetings': 'meetingNotes',

  // Buyer Mapping
  '/api/b2b/personas': 'buyerMapping',
  '/api/b2b/stakeholders': 'buyerMapping',
  '/api/b2b/matrix': 'buyerMapping',
  '/api/b2b/mapping': 'buyerMapping',

  // Personalization
  '/api/b2b/templates': 'personalization',
  '/api/b2b/rules': 'personalization',
  '/api/b2b/generate': 'personalization',
  '/api/b2b/personalize': 'personalization',

  // AI CRM Updates
  '/api/b2b/ai-updates': 'aiCrmUpdates',

  // Pipeline
  '/api/b2b/pipelines': 'pipelineSuggestions',
  '/api/b2b/forecasts': 'pipelineSuggestions',
  '/api/b2b/suggestions': 'pipelineSuggestions'
};

/**
 * Unified endpoints
 */

// Get complete account view
router.get('/api/unified/account/:accountId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const view = await unifiedService.getAccountView(tenantId, req.params.accountId);
    res.json({ success: true, data: view });
  } catch (error) {
    next(error);
  }
});

// Get deal with full context
router.get('/api/unified/deal/:dealId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const view = await unifiedService.getDealView(tenantId, req.params.dealId);
    res.json({ success: true, data: view });
  } catch (error) {
    next(error);
  }
});

// Get pipeline overview
router.get('/api/unified/pipeline', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { pipelineId } = req.query;
    const overview = await unifiedService.getPipelineOverview(tenantId, pipelineId as string);
    res.json({ success: true, data: overview });
  } catch (error) {
    next(error);
  }
});

// Get outreach summary
router.get('/api/unified/outreach/:prospectId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const summary = await unifiedService.getOutreachSummary(tenantId, req.params.prospectId);
    res.json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
});

// Health check
router.get('/health', async (req: Request, res: Response) => {
  const health = await proxyService.healthCheckAll();
  res.json({
    status: health.overall,
    timestamp: new Date().toISOString(),
    service: 'REZ-b2b-gateway',
    version: '1.0.0',
    services: health.services
  });
});

// Service health individual
router.get('/health/:service', async (req: Request, res: Response) => {
  const serviceName = req.params.service as ServiceName;
  const health = await proxyService.healthCheck(serviceName);
  res.json(health);
});

/**
 * Dynamic proxy routes
 */

// Generic proxy handler
router.all('/api/b2b/*', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const path = '/api/b2b' + req.params[0];

    // Find matching service
    let serviceName: ServiceName | undefined;
    for (const [route, service] of Object.entries(ROUTE_MAP)) {
      if (path.startsWith(route)) {
        serviceName = service;
        break;
      }
    }

    if (!serviceName) {
      res.status(404).json({ error: 'Route not found' });
      return;
    }

    // Convert b2b path to service path
    const servicePath = path.replace('/api/b2b', '');

    // Extract query params
    const queryParams = Object.entries(req.query)
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
    const fullPath = queryParams ? `${servicePath}?${queryParams}` : servicePath;

    // Make proxied request
    const result = await proxyService.proxyRequest(
      serviceName,
      req.method.toLowerCase() as 'get' | 'post' | 'put' | 'patch' | 'delete',
      fullPath,
      req.body,
      {
        'x-tenant-id': req.headers['x-tenant-id'] as string,
        'x-user-id': req.headers['x-user-id'] as string
      }
    );

    res.json(result);
  } catch (error) {
    if (error instanceof ProxyError) {
      res.status(error.statusCode).json({ error: error.message, service: error.service });
    } else {
      next(error);
    }
  }
});

export default router;
