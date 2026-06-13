import { Router, Response } from 'express';
import { portfolioTwinService, PortfolioTwinQuery } from '../services/index.js';
import { apiKeyAuth, internalAuth, AuthRequest, validateBody, parsePagination } from '../middleware/index.js';
import {
  CreatePortfolioTwinRequestSchema,
  UpdatePortfolioTwinRequestSchema,
  AddHoldingRequestSchema,
  UpdateHoldingRequestSchema,
  RebalanceRequestSchema,
  UpdatePerformanceRequestSchema,
  UpdateRiskMetricsRequestSchema,
} from '../schemas/index.js';

const router = Router();

// Apply auth to all routes
router.use(apiKeyAuth);

// ============================================================================
// CREATE PORTFOLIO TWIN
// ============================================================================

/**
 * POST /api/twins/portfolio
 * Create a new portfolio twin
 */
router.post('/', validateBody(CreatePortfolioTwinRequestSchema), async (req: AuthRequest, res: Response) => {
  try {
    const portfolioTwin = await portfolioTwinService.create(req.validatedBody as Parameters<typeof portfolioTwinService.create>[0]);

    res.status(201).json({
      success: true,
      data: portfolioTwin,
      portfolio_id: portfolioTwin.portfolio_id,
      twin_id: portfolioTwin.twin_id,
    });
  } catch (error: any) {
    console.error('[Portfolio Routes] Error creating portfolio twin:', error);

    if (error.message.includes('already exists')) {
      res.status(409).json({
        success: false,
        error: error.message,
        code: 'PORTFOLIO_TWIN_EXISTS',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create portfolio twin',
    });
  }
});

// ============================================================================
// GET PORTFOLIO TWIN
// ============================================================================

/**
 * GET /api/twins/portfolio/:id
 * Get portfolio twin by ID
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    let portfolioTwin = await portfolioTwinService.getById(id);

    if (!portfolioTwin && id.startsWith('twin.finance.portfolio.')) {
      portfolioTwin = await portfolioTwinService.getByTwinId(id);
    }

    if (!portfolioTwin) {
      res.status(404).json({
        success: false,
        error: `Portfolio twin not found: ${id}`,
        code: 'PORTFOLIO_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: portfolioTwin,
    });
  } catch (error) {
    console.error('[Portfolio Routes] Error getting portfolio twin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get portfolio twin',
    });
  }
});

// ============================================================================
// LIST PORTFOLIO TWINS
// ============================================================================

/**
 * GET /api/twins/portfolio
 * List portfolio twins with pagination and filters
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit } = parsePagination(req.query as Record<string, unknown>);
    const query: PortfolioTwinQuery = {
      page,
      limit,
    };

    if (req.query.investor_id) query.investor_id = req.query.investor_id as string;
    if (req.query.type) query.type = req.query.type as string;
    if (req.query.status) query.status = req.query.status as string;

    const result = await portfolioTwinService.list(query);

    res.json({
      success: true,
      data: result.twins,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        total_pages: Math.ceil(result.total / result.limit),
      },
    });
  } catch (error) {
    console.error('[Portfolio Routes] Error listing portfolio twins:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list portfolio twins',
    });
  }
});

// ============================================================================
// UPDATE PORTFOLIO TWIN
// ============================================================================

/**
 * PUT /api/twins/portfolio/:id
 * Update portfolio twin
 */
router.put('/:id', validateBody(UpdatePortfolioTwinRequestSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const portfolioTwin = await portfolioTwinService.update(id, req.validatedBody as Parameters<typeof portfolioTwinService.update>[1]);

    if (!portfolioTwin) {
      res.status(404).json({
        success: false,
        error: `Portfolio twin not found: ${id}`,
        code: 'PORTFOLIO_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: portfolioTwin,
    });
  } catch (error) {
    console.error('[Portfolio Routes] Error updating portfolio twin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update portfolio twin',
    });
  }
});

// ============================================================================
// ADD HOLDING
// ============================================================================

/**
 * POST /api/twins/portfolio/:id/holdings
 * Add a holding to portfolio
 */
router.post('/:id/holdings', validateBody(AddHoldingRequestSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const portfolioTwin = await portfolioTwinService.addHolding(id, req.validatedBody as Parameters<typeof portfolioTwinService.addHolding>[1]);

    if (!portfolioTwin) {
      res.status(404).json({
        success: false,
        error: `Portfolio twin not found: ${id}`,
        code: 'PORTFOLIO_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Holding added successfully',
      data: portfolioTwin,
    });
  } catch (error) {
    console.error('[Portfolio Routes] Error adding holding:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add holding',
    });
  }
});

// ============================================================================
// UPDATE HOLDING
// ============================================================================

/**
 * PUT /api/twins/portfolio/:id/holdings/:assetId
 * Update a holding
 */
router.put('/:id/holdings/:assetId', validateBody(UpdateHoldingRequestSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id, assetId } = req.params;
    const portfolioTwin = await portfolioTwinService.updateHolding(id, assetId, req.validatedBody as Parameters<typeof portfolioTwinService.updateHolding>[2]);

    if (!portfolioTwin) {
      res.status(404).json({
        success: false,
        error: `Portfolio twin or holding not found`,
        code: 'NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: portfolioTwin,
    });
  } catch (error) {
    console.error('[Portfolio Routes] Error updating holding:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update holding',
    });
  }
});

// ============================================================================
// REMOVE HOLDING
// ============================================================================

/**
 * DELETE /api/twins/portfolio/:id/holdings/:assetId
 * Remove a holding
 */
router.delete('/:id/holdings/:assetId', async (req: AuthRequest, res: Response) => {
  try {
    const { id, assetId } = req.params;
    const portfolioTwin = await portfolioTwinService.removeHolding(id, assetId);

    if (!portfolioTwin) {
      res.status(404).json({
        success: false,
        error: `Portfolio twin or holding not found`,
        code: 'NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Holding removed successfully',
      data: portfolioTwin,
    });
  } catch (error) {
    console.error('[Portfolio Routes] Error removing holding:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove holding',
    });
  }
});

// ============================================================================
// REBALANCE
// ============================================================================

/**
 * POST /api/twins/portfolio/:id/rebalance
 * Trigger portfolio rebalancing
 */
router.post('/:id/rebalance', validateBody(RebalanceRequestSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const portfolioTwin = await portfolioTwinService.rebalance(id, req.validatedBody as Parameters<typeof portfolioTwinService.rebalance>[1]);

    if (!portfolioTwin) {
      res.status(404).json({
        success: false,
        error: `Portfolio twin not found: ${id}`,
        code: 'PORTFOLIO_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Rebalance analysis complete',
      data: portfolioTwin,
    });
  } catch (error) {
    console.error('[Portfolio Routes] Error rebalancing portfolio:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to rebalance portfolio',
    });
  }
});

// ============================================================================
// UPDATE PERFORMANCE
// ============================================================================

/**
 * PUT /api/twins/portfolio/:id/performance
 * Update performance metrics
 */
router.put('/:id/performance', validateBody(UpdatePerformanceRequestSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const portfolioTwin = await portfolioTwinService.updatePerformance(id, req.validatedBody as Parameters<typeof portfolioTwinService.updatePerformance>[1]);

    if (!portfolioTwin) {
      res.status(404).json({
        success: false,
        error: `Portfolio twin not found: ${id}`,
        code: 'PORTFOLIO_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: portfolioTwin.performance,
      updated: portfolioTwin,
    });
  } catch (error) {
    console.error('[Portfolio Routes] Error updating performance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update performance',
    });
  }
});

// ============================================================================
// UPDATE RISK METRICS
// ============================================================================

/**
 * PUT /api/twins/portfolio/:id/risk-metrics
 * Update risk metrics
 */
router.put('/:id/risk-metrics', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const portfolioTwin = await portfolioTwinService.updateRiskMetrics(id, req.body);

    if (!portfolioTwin) {
      res.status(404).json({
        success: false,
        error: `Portfolio twin not found: ${id}`,
        code: 'PORTFOLIO_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: portfolioTwin.risk_metrics,
      updated: portfolioTwin,
    });
  } catch (error) {
    console.error('[Portfolio Routes] Error updating risk metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update risk metrics',
    });
  }
});

// ============================================================================
// GET STATS
// ============================================================================

/**
 * GET /api/twins/portfolio/stats
 * Get portfolio statistics
 */
router.get('/stats/summary', async (req: AuthRequest, res: Response) => {
  try {
    const investorId = req.query.investor_id as string | undefined;
    const stats = await portfolioTwinService.getStats(investorId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('[Portfolio Routes] Error getting stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get stats',
    });
  }
});

// ============================================================================
// DELETE PORTFOLIO TWIN
// ============================================================================

/**
 * DELETE /api/twins/portfolio/:id
 * Delete portfolio twin
 */
router.delete('/:id', internalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await portfolioTwinService.delete(id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: `Portfolio twin not found: ${id}`,
        code: 'PORTFOLIO_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Portfolio twin deleted successfully',
    });
  } catch (error) {
    console.error('[Portfolio Routes] Error deleting portfolio twin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete portfolio twin',
    });
  }
});

export default router;
