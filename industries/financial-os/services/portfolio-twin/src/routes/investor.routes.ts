import { Router, Response } from 'express';
import { investorTwinService, InvestorTwinQuery } from '../services/index.js';
import { apiKeyAuth, internalAuth, AuthRequest, validateBody, parsePagination } from '../middleware/index.js';
import {
  CreateInvestorTwinRequestSchema,
  UpdateInvestorTwinRequestSchema,
  LinkAccountRequestSchema,
  AddPortfolioRequestSchema,
} from '../schemas/index.js';

const router = Router();

// Apply auth to all routes
router.use(apiKeyAuth);

// ============================================================================
// CREATE INVESTOR TWIN
// ============================================================================

/**
 * POST /api/twins/investor
 * Create a new investor twin
 */
router.post('/', validateBody(CreateInvestorTwinRequestSchema), async (req: AuthRequest, res: Response) => {
  try {
    const investorTwin = await investorTwinService.create(req.validatedBody as Parameters<typeof investorTwinService.create>[0]);

    res.status(201).json({
      success: true,
      data: investorTwin,
      investor_id: investorTwin.investor_id,
      twin_id: investorTwin.twin_id,
    });
  } catch (error: any) {
    console.error('[Investor Routes] Error creating investor twin:', error);

    if (error.message.includes('already exists')) {
      res.status(409).json({
        success: false,
        error: error.message,
        code: 'INVESTOR_TWIN_EXISTS',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create investor twin',
    });
  }
});

// ============================================================================
// GET INVESTOR TWIN
// ============================================================================

/**
 * GET /api/twins/investor/:id
 * Get investor twin by ID
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    let investorTwin = await investorTwinService.getById(id);

    if (!investorTwin && id.startsWith('twin.finance.investor.')) {
      investorTwin = await investorTwinService.getByTwinId(id);
    }

    if (!investorTwin) {
      res.status(404).json({
        success: false,
        error: `Investor twin not found: ${id}`,
        code: 'INVESTOR_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: investorTwin,
    });
  } catch (error) {
    console.error('[Investor Routes] Error getting investor twin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get investor twin',
    });
  }
});

// ============================================================================
// LIST INVESTOR TWINS
// ============================================================================

/**
 * GET /api/twins/investor
 * List investor twins with pagination and filters
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit } = parsePagination(req.query as Record<string, unknown>);
    const query: InvestorTwinQuery = {
      page,
      limit,
    };

    if (req.query.investor_type) query.investor_type = req.query.investor_type as string;
    if (req.query.risk_rating) query.risk_rating = req.query.risk_rating as string;

    const result = await investorTwinService.list(query);

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
    console.error('[Investor Routes] Error listing investor twins:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list investor twins',
    });
  }
});

// ============================================================================
// UPDATE INVESTOR TWIN
// ============================================================================

/**
 * PUT /api/twins/investor/:id
 * Update investor twin
 */
router.put('/:id', validateBody(UpdateInvestorTwinRequestSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const investorTwin = await investorTwinService.update(id, req.validatedBody as Parameters<typeof investorTwinService.update>[1]);

    if (!investorTwin) {
      res.status(404).json({
        success: false,
        error: `Investor twin not found: ${id}`,
        code: 'INVESTOR_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: investorTwin,
    });
  } catch (error) {
    console.error('[Investor Routes] Error updating investor twin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update investor twin',
    });
  }
});

// ============================================================================
// LINK ACCOUNT
// ============================================================================

/**
 * POST /api/twins/investor/:id/accounts
 * Link an account to investor
 */
router.post('/:id/accounts', validateBody(LinkAccountRequestSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const investorTwin = await investorTwinService.linkAccount(id, req.validatedBody as Parameters<typeof investorTwinService.linkAccount>[1]);

    if (!investorTwin) {
      res.status(404).json({
        success: false,
        error: `Investor twin not found: ${id}`,
        code: 'INVESTOR_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Account linked successfully',
      data: investorTwin,
    });
  } catch (error: any) {
    console.error('[Investor Routes] Error linking account:', error);

    if (error.message.includes('already linked')) {
      res.status(409).json({
        success: false,
        error: error.message,
        code: 'ACCOUNT_ALREADY_LINKED',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to link account',
    });
  }
});

// ============================================================================
// UNLINK ACCOUNT
// ============================================================================

/**
 * DELETE /api/twins/investor/:id/accounts/:accountId
 * Unlink an account
 */
router.delete('/:id/accounts/:accountId', async (req: AuthRequest, res: Response) => {
  try {
    const { id, accountId } = req.params;
    const investorTwin = await investorTwinService.unlinkAccount(id, accountId);

    if (!investorTwin) {
      res.status(404).json({
        success: false,
        error: `Investor twin or account not found`,
        code: 'NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Account unlinked successfully',
      data: investorTwin,
    });
  } catch (error) {
    console.error('[Investor Routes] Error unlinking account:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unlink account',
    });
  }
});

// ============================================================================
// ADD PORTFOLIO
// ============================================================================

/**
 * POST /api/twins/investor/:id/portfolios
 * Add a portfolio to investor
 */
router.post('/:id/portfolios', validateBody(AddPortfolioRequestSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { portfolio_id } = req.validatedBody as { portfolio_id: string };
    const investorTwin = await investorTwinService.addPortfolio(id, portfolio_id);

    if (!investorTwin) {
      res.status(404).json({
        success: false,
        error: `Investor twin not found: ${id}`,
        code: 'INVESTOR_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Portfolio added successfully',
      data: investorTwin,
    });
  } catch (error) {
    console.error('[Investor Routes] Error adding portfolio:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add portfolio',
    });
  }
});

// ============================================================================
// REMOVE PORTFOLIO
// ============================================================================

/**
 * DELETE /api/twins/investor/:id/portfolios/:portfolioId
 * Remove a portfolio from investor
 */
router.delete('/:id/portfolios/:portfolioId', async (req: AuthRequest, res: Response) => {
  try {
    const { id, portfolioId } = req.params;
    const investorTwin = await investorTwinService.removePortfolio(id, portfolioId);

    if (!investorTwin) {
      res.status(404).json({
        success: false,
        error: `Investor twin not found: ${id}`,
        code: 'INVESTOR_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Portfolio removed successfully',
      data: investorTwin,
    });
  } catch (error) {
    console.error('[Investor Routes] Error removing portfolio:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove portfolio',
    });
  }
});

// ============================================================================
// UPDATE KYC
// ============================================================================

/**
 * PUT /api/twins/investor/:id/kyc
 * Update KYC status
 */
router.put('/:id/kyc', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const investorTwin = await investorTwinService.updateKYC(id, req.body);

    if (!investorTwin) {
      res.status(404).json({
        success: false,
        error: `Investor twin not found: ${id}`,
        code: 'INVESTOR_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: investorTwin.kyc,
      updated: investorTwin,
    });
  } catch (error) {
    console.error('[Investor Routes] Error updating KYC:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update KYC',
    });
  }
});

// ============================================================================
// GET STATS
// ============================================================================

/**
 * GET /api/twins/investor/stats
 * Get investor statistics
 */
router.get('/stats/summary', async (req: AuthRequest, res: Response) => {
  try {
    const stats = await investorTwinService.getStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('[Investor Routes] Error getting stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get stats',
    });
  }
});

// ============================================================================
// DELETE INVESTOR TWIN
// ============================================================================

/**
 * DELETE /api/twins/investor/:id
 * Delete investor twin
 */
router.delete('/:id', internalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await investorTwinService.delete(id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: `Investor twin not found: ${id}`,
        code: 'INVESTOR_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Investor twin deleted successfully',
    });
  } catch (error) {
    console.error('[Investor Routes] Error deleting investor twin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete investor twin',
    });
  }
});

export default router;
