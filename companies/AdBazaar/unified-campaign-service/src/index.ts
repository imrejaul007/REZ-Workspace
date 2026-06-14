/**
 * Unified Campaign Service - Main Entry Point
 *
 * Port: 4500
 *
 * Unified cross-platform campaign orchestration service for AdBazaar.
 * Supports:
 * - Multi-tenant campaign management
 * - Cross-platform targeting (DOOH, QR, WhatsApp, Creator, App)
 * - Inventory classification (internal vs marketplace)
 * - Budget allocation
 * - Attribution tracking
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

// Tenant middleware
import {
  tenantMiddleware,
  TenantContext,
  TenantType,
  InventoryCategory,
  Platform,
  isInternalInventory,
  filterAccessibleInventory,
} from '@rez/tenant-middleware';

// Campaign orchestrator
import { campaignOrchestrator, CampaignOrchestrator } from './services/campaignOrchestrator';

// Types
import {
  CampaignStatus,
  CampaignType,
  CreateCampaignRequest,
  UpdateCampaignRequest,
  BudgetModel,
} from './types';

// ============================================================================
// APP SETUP
// ============================================================================

const app = express();
const PORT = parseInt(process.env.PORT || '4500', 10);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// HEALTH ENDPOINTS
// ============================================================================

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'unified-campaign-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/ready', async (_req, res) => {
  // Check dependencies
  const checks = {
    memory: true, // In-memory storage always ready
    timestamp: new Date().toISOString(),
  };

  const allReady = Object.values(checks).every(v => v === true || typeof v === 'string');

  res.json({
    ready: allReady,
    checks,
  });
});

// ============================================================================
// TENANT CONTEXT
// ============================================================================

// Extend Request type
declare global {
  namespace Express {
    interface Request {
      tenant?: TenantContext;
      requestId?: string;
    }
  }
}

// Request ID middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  req.requestId = req.headers['x-request-id'] as string || `req_${uuidv4().substring(0, 8)}`;
  next();
});

// Apply tenant middleware
app.use(tenantMiddleware());

// ============================================================================
// CAMPAIGN ROUTES
// ============================================================================

/**
 * POST /api/campaigns
 * Create a new unified campaign
 */
app.post('/api/campaigns', async (req: Request, res: Response) => {
  try {
    const tenant = req.tenant;
    if (!tenant) {
      res.status(401).json({ success: false, error: 'TENANT_REQUIRED' });
      return;
    }

    // Validate request body
    const { name, objective, inventory, budget, targeting, schedule, creative } = req.body;

    if (!name || !objective || !inventory || !budget || !creative) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Missing required fields: name, objective, inventory, budget, creative',
      });
      return;
    }

    // Create campaign
    const request: CreateCampaignRequest = {
      name,
      description: req.body.description,
      objective,
      inventory: {
        categories: inventory.categories || [],
        platforms: inventory.platforms || [],
      },
      budget: {
        totalBudget: budget.totalBudget,
        model: budget.model || BudgetModel.TOTAL,
        dailyLimit: budget.dailyLimit,
        allocation: budget.allocation,
      },
      targeting: targeting || {},
      schedule: schedule || { startDate: new Date() },
      creative,
      attribution: req.body.attribution,
      optimization: req.body.optimization,
    };

    const campaign = await campaignOrchestrator.createCampaign(tenant, request);

    logger.info(`[${req.requestId}] Campaign created: ${campaign.id}`);

    res.status(201).json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    logger.error(`[${req.requestId}] Create campaign error:`, { error: error instanceof Error ? error.message : String(error) });
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.includes('NO_INVENTORY_ACCESS')) {
      res.status(403).json({ success: false, error: 'INVENTORY_ACCESS_DENIED', message });
      return;
    }

    if (message.includes('MIN_BUDGET')) {
      res.status(400).json({ success: false, error: 'BUDGET_ERROR', message });
      return;
    }

    res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message });
  }
});

/**
 * GET /api/campaigns
 * List campaigns for tenant
 */
app.get('/api/campaigns', async (req: Request, res: Response) => {
  try {
    const tenant = req.tenant;
    if (!tenant) {
      res.status(401).json({ success: false, error: 'TENANT_REQUIRED' });
      return;
    }

    const status = req.query.status
      ? (Array.isArray(req.query.status) ? req.query.status : [req.query.status]) as CampaignStatus[]
      : undefined;

    const type = req.query.type
      ? (Array.isArray(req.query.type) ? req.query.type : [req.query.type]) as CampaignType[]
      : undefined;

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const result = await campaignOrchestrator.listCampaigns(tenant, { status, type, page, limit });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error(`[${req.requestId}] List campaigns error:`, { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * GET /api/campaigns/:id
 * Get campaign by ID
 */
app.get('/api/campaigns/:id', async (req: Request, res: Response) => {
  try {
    const tenant = req.tenant;
    if (!tenant) {
      res.status(401).json({ success: false, error: 'TENANT_REQUIRED' });
      return;
    }

    const campaign = await campaignOrchestrator.getCampaign(tenant, req.params.id);

    if (!campaign) {
      res.status(404).json({ success: false, error: 'CAMPAIGN_NOT_FOUND' });
      return;
    }

    res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    logger.error(`[${req.requestId}] Get campaign error:`, { error: error instanceof Error ? error.message : String(error) });
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.includes('ACCESS_DENIED')) {
      res.status(403).json({ success: false, error: 'ACCESS_DENIED' });
      return;
    }

    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * PATCH /api/campaigns/:id
 * Update campaign
 */
app.patch('/api/campaigns/:id', async (req: Request, res: Response) => {
  try {
    const tenant = req.tenant;
    if (!tenant) {
      res.status(401).json({ success: false, error: 'TENANT_REQUIRED' });
      return;
    }

    const request: UpdateCampaignRequest = req.body;

    const campaign = await campaignOrchestrator.updateCampaign(tenant, req.params.id, request);

    logger.info(`[${req.requestId}] Campaign updated: ${campaign.id}`);

    res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    logger.error(`[${req.requestId}] Update campaign error:`, { error: error instanceof Error ? error.message : String(error) });
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.includes('NOT_FOUND')) {
      res.status(404).json({ success: false, error: 'CAMPAIGN_NOT_FOUND' });
      return;
    }

    if (message.includes('ACCESS_DENIED')) {
      res.status(403).json({ success: false, error: 'ACCESS_DENIED' });
      return;
    }

    if (message.includes('TRANSITION')) {
      res.status(400).json({ success: false, error: 'INVALID_TRANSITION', message });
      return;
    }

    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * DELETE /api/campaigns/:id
 * Delete campaign
 */
app.delete('/api/campaigns/:id', async (req: Request, res: Response) => {
  try {
    const tenant = req.tenant;
    if (!tenant) {
      res.status(401).json({ success: false, error: 'TENANT_REQUIRED' });
      return;
    }

    await campaignOrchestrator.deleteCampaign(tenant, req.params.id);

    logger.info(`[${req.requestId}] Campaign deleted: ${req.params.id}`);

    res.json({ success: true });
  } catch (error) {
    logger.error(`[${req.requestId}] Delete campaign error:`, { error: error instanceof Error ? error.message : String(error) });
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.includes('NOT_FOUND')) {
      res.status(404).json({ success: false, error: 'CAMPAIGN_NOT_FOUND' });
      return;
    }

    if (message.includes('ACCESS_DENIED')) {
      res.status(403).json({ success: false, error: 'ACCESS_DENIED' });
      return;
    }

    if (message.includes('DELETE')) {
      res.status(400).json({ success: false, error: 'CANNOT_DELETE', message });
      return;
    }

    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

// ============================================================================
// CAMPAIGN ACTIONS
// ============================================================================

/**
 * POST /api/campaigns/:id/activate
 * Activate campaign
 */
app.post('/api/campaigns/:id/activate', async (req: Request, res: Response) => {
  try {
    const tenant = req.tenant;
    if (!tenant) {
      res.status(401).json({ success: false, error: 'TENANT_REQUIRED' });
      return;
    }

    const campaign = await campaignOrchestrator.activateCampaign(tenant, req.params.id);

    logger.info(`[${req.requestId}] Campaign activated: ${campaign.id}`);

    res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    logger.error(`[${req.requestId}] Activate campaign error:`, { error: error instanceof Error ? error.message : String(error) });
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.includes('NOT_FOUND')) {
      res.status(404).json({ success: false, error: 'CAMPAIGN_NOT_FOUND' });
      return;
    }

    if (message.includes('ACCESS_DENIED')) {
      res.status(403).json({ success: false, error: 'ACCESS_DENIED' });
      return;
    }

    if (message.includes('BUDGET')) {
      res.status(400).json({ success: false, error: 'BUDGET_REQUIRED', message });
      return;
    }

    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * POST /api/campaigns/:id/pause
 * Pause campaign
 */
app.post('/api/campaigns/:id/pause', async (req: Request, res: Response) => {
  try {
    const tenant = req.tenant;
    if (!tenant) {
      res.status(401).json({ success: false, error: 'TENANT_REQUIRED' });
      return;
    }

    const campaign = await campaignOrchestrator.pauseCampaign(tenant, req.params.id);

    logger.info(`[${req.requestId}] Campaign paused: ${campaign.id}`);

    res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    logger.error(`[${req.requestId}] Pause campaign error:`, { error: error instanceof Error ? error.message : String(error) });
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.includes('NOT_FOUND')) {
      res.status(404).json({ success: false, error: 'CAMPAIGN_NOT_FOUND' });
      return;
    }

    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

// ============================================================================
// CAMPAIGN METRICS
// ============================================================================

/**
 * GET /api/campaigns/:id/metrics
 * Get campaign metrics
 */
app.get('/api/campaigns/:id/metrics', async (req: Request, res: Response) => {
  try {
    const tenant = req.tenant;
    if (!tenant) {
      res.status(401).json({ success: false, error: 'TENANT_REQUIRED' });
      return;
    }

    const metrics = await campaignOrchestrator.getCampaignMetrics(tenant, req.params.id);

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    logger.error(`[${req.requestId}] Get metrics error:`, { error: error instanceof Error ? error.message : String(error) });
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.includes('NOT_FOUND')) {
      res.status(404).json({ success: false, error: 'CAMPAIGN_NOT_FOUND' });
      return;
    }

    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * POST /api/campaigns/:id/metrics
 * Update campaign metrics (internal use)
 */
app.post('/api/campaigns/:id/metrics', async (req: Request, res: Response) => {
  try {
    // Internal endpoint - verify service token
    const serviceToken = req.headers['x-internal-token'] as string;
    if (serviceToken !== process.env.INTERNAL_SERVICE_TOKEN) {
      res.status(401).json({ success: false, error: 'UNAUTHORIZED' });
      return;
    }

    const { platform, impressions, clicks, conversions, spend } = req.body;

    if (!platform) {
      res.status(400).json({ success: false, error: 'PLATFORM_REQUIRED' });
      return;
    }

    await campaignOrchestrator.updateMetrics(req.params.id, platform, {
      impressions,
      clicks,
      conversions,
      spend,
    });

    res.json({ success: true });
  } catch (error) {
    logger.error(`[${req.requestId}] Update metrics error:`, { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

// ============================================================================
// AUDIENCE ESTIMATION
// ============================================================================

/**
 * POST /api/audience/estimate
 * Estimate audience size for targeting
 */
app.post('/api/audience/estimate', async (req: Request, res: Response) => {
  try {
    const tenant = req.tenant;
    if (!tenant) {
      res.status(401).json({ success: false, error: 'TENANT_REQUIRED' });
      return;
    }

    const targeting = req.body.targeting || {};

    const estimate = await campaignOrchestrator.estimateAudience(tenant, targeting);

    res.json({
      success: true,
      data: estimate,
    });
  } catch (error) {
    logger.error(`[${req.requestId}] Audience estimate error:`, { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

// ============================================================================
// INVENTORY AVAILABILITY
// ============================================================================

/**
 * GET /api/inventory/available
 * Get available inventory for tenant
 */
app.get('/api/inventory/available', async (req: Request, res: Response) => {
  try {
    const tenant = req.tenant;
    if (!tenant) {
      res.status(401).json({ success: false, error: 'TENANT_REQUIRED' });
      return;
    }

    // Return inventory based on tenant type
    const allInventory = Object.values(InventoryCategory);
    const { allowed, denied } = filterAccessibleInventory(tenant, allInventory);

    // Format response
    const inventory = allowed.map(category => ({
      category,
      isInternal: isInternalInventory(category),
      platform: getPlatformForCategory(category),
      accessible: true,
    }));

    const inaccessible = denied.map(category => ({
      category,
      isInternal: isInternalInventory(category),
      platform: getPlatformForCategory(category),
      accessible: false,
      reason: 'TENANT_TYPE_RESTRICTED',
    }));

    res.json({
      success: true,
      data: {
        inventory,
        inaccessible,
        tenantType: tenant.tenantType,
      },
    });
  } catch (error) {
    logger.error(`[${req.requestId}] Get inventory error:`, { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

/**
 * GET /api/inventory/classification
 * Get inventory classification (internal only)
 */
app.get('/api/inventory/classification', async (req: Request, res: Response) => {
  try {
    const tenant = req.tenant;
    if (!tenant) {
      res.status(401).json({ success: false, error: 'TENANT_REQUIRED' });
      return;
    }

    // Only internal tenants can see classification
    if (tenant.tenantType !== TenantType.REZ_INTERNAL) {
      res.status(403).json({
        success: false,
        error: 'INTERNAL_ONLY',
        message: 'Inventory classification is only available for internal tenants',
      });
      return;
    }

    const classification = {
      internal: {
        description: 'REZ Internal inventory - privileged access for REZ ecosystem',
        categories: Object.values(InventoryCategory).filter(c => isInternalInventory(c)),
      },
      marketplace: {
        description: 'Marketplace inventory - available to all clients',
        categories: Object.values(InventoryCategory).filter(c => !isInternalInventory(c)),
      },
    };

    res.json({
      success: true,
      data: classification,
    });
  } catch (error) {
    logger.error(`[${req.requestId}] Get classification error:`, { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getPlatformForCategory(category: InventoryCategory): Platform {
  const platformMap: Partial<Record<InventoryCategory, Platform>> = {
    [InventoryCategory.DOOH_PUBLIC]: Platform.DOOH,
    [InventoryCategory.REZ_APP_HOME_FEED]: Platform.APP,
    [InventoryCategory.REZ_APP_RECOMMENDATION]: Platform.APP,
    [InventoryCategory.REZ_RIDE_INAPP]: Platform.APP,
    [InventoryCategory.QR_PUBLIC]: Platform.QR,
    [InventoryCategory.CREATOR_PUBLIC]: Platform.CREATOR,
    [InventoryCategory.WHATSAPP_PUBLIC]: Platform.WHATSAPP,
    [InventoryCategory.EVENT_PUBLIC]: Platform.EVENT,
  };

  return platformMap[category] || Platform.DOOH;
}

// ============================================================================
// ERROR HANDLER
// ============================================================================

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error(`[${req.requestId}] Unhandled error:`, { error: err instanceof Error ? err.message : String(err) });
  res.status(500).json({
    success: false,
    error: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  logger.info(`
╔═══════════════════════════════════════════════════════════════╗
║          UNIFIED CAMPAIGN SERVICE STARTED                    ║
╠═══════════════════════════════════════════════════════════════╣
║  Port:      ${PORT}                                             ║
║  Service:   unified-campaign-service                        ║
║  Version:   1.0.0                                         ║
║  Tenant:    Multi-tenant enabled                            ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});

export default app;
