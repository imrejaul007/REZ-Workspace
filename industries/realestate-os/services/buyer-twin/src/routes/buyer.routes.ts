import { Router, Response } from 'express';
import { buyerService } from '../services/index.js';
import { internalAuth, AuthRequest } from '../middleware/index.js';
import {
  CreateBuyerSchema,
  UpdateBuyerSchema,
  PropertyInteractionSchema
} from '../middleware/validation.js';

const router = Router();

// Apply internal auth to all routes
router.use(internalAuth);

// ============================================================================
// BUYER CRUD ROUTES
// ============================================================================

/**
 * Create a new buyer
 * POST /api/v1/buyers
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = CreateBuyerSchema.parse(req.body);
    const result = await buyerService.createBuyer(data);

    if (!result.success) {
      const status = result.error === 'Buyer already exists' ? 409 : 500;
      return res.status(status).json({
        success: false,
        error: result.error
      });
    }

    res.status(201).json({
      success: true,
      data: result.data
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: (error as any).errors
      });
    }

    console.error('[Buyer Routes] Error creating buyer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create buyer'
    });
  }
});

/**
 * Get buyer by ID
 * GET /api/v1/buyers/:buyerId
 */
router.get('/:buyerId', async (req: AuthRequest, res: Response) => {
  try {
    const buyerId = req.params['buyerId'] as string;
    const tenantIdHeader = req.headers['x-tenant-id'] as string | undefined;
    const result = await buyerService.getBuyer(buyerId, tenantIdHeader);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error: unknown) {
    console.error('[Buyer Routes] Error getting buyer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get buyer'
    });
  }
});

/**
 * Update buyer
 * PATCH /api/v1/buyers/:buyerId
 */
router.patch('/:buyerId', async (req: AuthRequest, res: Response) => {
  try {
    const buyerId = req.params['buyerId'] as string;
    const tenantIdHeader = req.headers['x-tenant-id'] as string | undefined;
    const data = UpdateBuyerSchema.parse(req.body);
    const result = await buyerService.updateBuyer(buyerId, data, tenantIdHeader);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: (error as any).errors
      });
    }

    console.error('[Buyer Routes] Error updating buyer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update buyer'
    });
  }
});

/**
 * Delete buyer (soft delete)
 * DELETE /api/v1/buyers/:buyerId
 */
router.delete('/:buyerId', async (req: AuthRequest, res: Response) => {
  try {
    const buyerId = req.params['buyerId'] as string;
    const tenantIdHeader = req.headers['x-tenant-id'] as string | undefined;
    const result = await buyerService.deleteBuyer(buyerId, tenantIdHeader);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      message: result.message
    });
  } catch (error: unknown) {
    console.error('[Buyer Routes] Error deleting buyer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete buyer'
    });
  }
});

// ============================================================================
// BUYER LISTING ROUTES
// ============================================================================

/**
 * List buyers for tenant
 * GET /api/v1/buyers
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const tenantIdHeader = req.headers['x-tenant-id'] as string | undefined;

    if (!tenantIdHeader) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID required'
      });
    }

    const {
      status,
      stage,
      agentId,
      page = '1',
      limit = '20'
    } = req.query;

    const result = await buyerService.listBuyers(tenantIdHeader, {
      status: status as string | undefined,
      stage: stage as string | undefined,
      agentId: agentId as string | undefined,
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10)
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error: unknown) {
    console.error('[Buyer Routes] Error listing buyers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list buyers'
    });
  }
});

// ============================================================================
// BUYER STATUS ROUTES
// ============================================================================

/**
 * Update buyer status
 * PATCH /api/v1/buyers/:buyerId/status
 */
router.patch('/:buyerId/status', async (req: AuthRequest, res: Response) => {
  try {
    const buyerId = req.params['buyerId'] as string;
    const tenantIdHeader = req.headers['x-tenant-id'] as string | undefined;
    const { current, stage } = req.body;

    if (!current && !stage) {
      return res.status(400).json({
        success: false,
        error: 'Status update requires current or stage'
      });
    }

    const result = await buyerService.updateBuyerStatus(
      buyerId,
      { current, stage },
      tenantIdHeader
    );

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error: unknown) {
    console.error('[Buyer Routes] Error updating buyer status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update buyer status'
    });
  }
});

/**
 * Get buyer stage distribution
 * GET /api/v1/buyers/stats/by-stage
 */
router.get('/stats/by-stage', async (req: AuthRequest, res: Response) => {
  try {
    const tenantIdHeader = req.headers['x-tenant-id'] as string | undefined;

    if (!tenantIdHeader) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID required'
      });
    }

    const result = await buyerService.getBuyerStats(tenantIdHeader);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error: unknown) {
    console.error('[Buyer Routes] Error getting buyer stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get buyer stats'
    });
  }
});

// ============================================================================
// AGENT ASSIGNMENT ROUTES
// ============================================================================

/**
 * Assign agent to buyer
 * POST /api/v1/buyers/:buyerId/agent
 */
router.post('/:buyerId/agent', async (req: AuthRequest, res: Response) => {
  try {
    const buyerId = req.params['buyerId'] as string;
    const { agentId } = req.body;
    const tenantIdHeader = req.headers['x-tenant-id'] as string | undefined;

    if (!agentId) {
      return res.status(400).json({
        success: false,
        error: 'Agent ID required'
      });
    }

    const result = await buyerService.assignAgent(buyerId, agentId, tenantIdHeader);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error: unknown) {
    console.error('[Buyer Routes] Error assigning agent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign agent'
    });
  }
});

/**
 * Get buyers by agent
 * GET /api/v1/buyers/agent/:agentId
 */
router.get('/agent/:agentId', async (req: AuthRequest, res: Response) => {
  try {
    const agentId = req.params['agentId'] as string;
    const pageParam = req.query['page'] as string | undefined;
    const limitParam = req.query['limit'] as string | undefined;

    const result = await buyerService.getBuyersByAgent(agentId, {
      page: parseInt(pageParam || '1', 10),
      limit: parseInt(limitParam || '20', 10)
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error: unknown) {
    console.error('[Buyer Routes] Error getting buyers by agent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get buyers by agent'
    });
  }
});

// ============================================================================
// PROPERTY INTERACTION ROUTES
// ============================================================================

/**
 * Record property interaction
 * POST /api/v1/buyers/:buyerId/property
 */
router.post('/:buyerId/property', async (req: AuthRequest, res: Response) => {
  try {
    const buyerId = req.params['buyerId'] as string;
    const tenantIdHeader = req.headers['x-tenant-id'] as string | undefined;
    const data = PropertyInteractionSchema.parse(req.body);

    const result = await buyerService.recordPropertyInteraction(
      buyerId,
      data,
      tenantIdHeader
    );

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: (error as any).errors
      });
    }

    console.error('[Buyer Routes] Error recording property interaction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record property interaction'
    });
  }
});

// ============================================================================
// SEARCH ROUTES
// ============================================================================

/**
 * Search buyers
 * POST /api/v1/buyers/search
 */
router.post('/search', async (req: AuthRequest, res: Response) => {
  try {
    const tenantIdHeader = req.headers['x-tenant-id'] as string | undefined;

    if (!tenantIdHeader) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID required'
      });
    }

    const { query, name, email, phone, minBudget, maxBudget, propertyTypes, areas, urgency } = req.body;
    const pageParam = req.query['page'] as string | undefined;
    const limitParam = req.query['limit'] as string | undefined;

    const result = await buyerService.searchBuyers(
      tenantIdHeader,
      { query, name, email, phone, minBudget, maxBudget, propertyTypes, areas, urgency },
      { page: parseInt(pageParam || '1', 10), limit: parseInt(limitParam || '20', 10) }
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error: unknown) {
    console.error('[Buyer Routes] Error searching buyers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search buyers'
    });
  }
});

export default router;