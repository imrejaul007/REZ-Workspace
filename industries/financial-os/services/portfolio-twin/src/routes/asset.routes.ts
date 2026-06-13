import { Router, Response } from 'express';
import { assetTwinService, AssetTwinQuery } from '../services/index.js';
import { apiKeyAuth, internalAuth, AuthRequest, validateBody, parsePagination } from '../middleware/index.js';
import {
  CreateAssetTwinRequestSchema,
  UpdateAssetTwinRequestSchema,
  UpdatePricingRequestSchema,
  AddNewsRequestSchema,
} from '../schemas/index.js';

const router = Router();

// Apply auth to all routes
router.use(apiKeyAuth);

// ============================================================================
// CREATE ASSET TWIN
// ============================================================================

/**
 * POST /api/twins/asset
 * Create a new asset twin
 */
router.post('/', validateBody(CreateAssetTwinRequestSchema), async (req: AuthRequest, res: Response) => {
  try {
    const assetTwin = await assetTwinService.create(req.validatedBody as Parameters<typeof assetTwinService.create>[0]);

    res.status(201).json({
      success: true,
      data: assetTwin,
      asset_id: assetTwin.asset_id,
      twin_id: assetTwin.twin_id,
    });
  } catch (error: any) {
    console.error('[Asset Routes] Error creating asset twin:', error);

    if (error.message.includes('already exists')) {
      res.status(409).json({
        success: false,
        error: error.message,
        code: 'ASSET_TWIN_EXISTS',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create asset twin',
    });
  }
});

// ============================================================================
// GET ASSET TWIN
// ============================================================================

/**
 * GET /api/twins/asset/:id
 * Get asset twin by ID or ticker
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    let assetTwin = await assetTwinService.getById(id);

    if (!assetTwin && id.startsWith('twin.finance.asset.')) {
      assetTwin = await assetTwinService.getByTwinId(id);
    }

    if (!assetTwin) {
      // Try by ticker
      assetTwin = await assetTwinService.getByTicker(id);
    }

    if (!assetTwin) {
      res.status(404).json({
        success: false,
        error: `Asset twin not found: ${id}`,
        code: 'ASSET_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: assetTwin,
    });
  } catch (error) {
    console.error('[Asset Routes] Error getting asset twin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get asset twin',
    });
  }
});

// ============================================================================
// LIST ASSET TWINS
// ============================================================================

/**
 * GET /api/twins/asset
 * List asset twins with pagination and filters
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit } = parsePagination(req.query as Record<string, unknown>);
    const query: AssetTwinQuery = {
      page,
      limit,
    };

    if (req.query.ticker) query.ticker = req.query.ticker as string;
    if (req.query.asset_class) query.asset_class = req.query.asset_class as string;
    if (req.query.trend) query.trend = req.query.trend as string;

    const result = await assetTwinService.list(query);

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
    console.error('[Asset Routes] Error listing asset twins:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list asset twins',
    });
  }
});

// ============================================================================
// UPDATE ASSET TWIN
// ============================================================================

/**
 * PUT /api/twins/asset/:id
 * Update asset twin
 */
router.put('/:id', validateBody(UpdateAssetTwinRequestSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const assetTwin = await assetTwinService.update(id, req.validatedBody as Parameters<typeof assetTwinService.update>[1]);

    if (!assetTwin) {
      res.status(404).json({
        success: false,
        error: `Asset twin not found: ${id}`,
        code: 'ASSET_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: assetTwin,
    });
  } catch (error) {
    console.error('[Asset Routes] Error updating asset twin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update asset twin',
    });
  }
});

// ============================================================================
// UPDATE PRICING
// ============================================================================

/**
 * PUT /api/twins/asset/:id/pricing
 * Update pricing for asset
 */
router.put('/:id/pricing', validateBody(UpdatePricingRequestSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const assetTwin = await assetTwinService.updatePricing(id, req.validatedBody as Parameters<typeof assetTwinService.updatePricing>[1]);

    if (!assetTwin) {
      res.status(404).json({
        success: false,
        error: `Asset twin not found: ${id}`,
        code: 'ASSET_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: assetTwin.pricing,
      updated: assetTwin,
    });
  } catch (error) {
    console.error('[Asset Routes] Error updating pricing:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update pricing',
    });
  }
});

// ============================================================================
// ADD NEWS
// ============================================================================

/**
 * POST /api/twins/asset/:id/news
 * Add news to asset
 */
router.post('/:id/news', validateBody(AddNewsRequestSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const assetTwin = await assetTwinService.addNews(id, req.validatedBody as Parameters<typeof assetTwinService.addNews>[1]);

    if (!assetTwin) {
      res.status(404).json({
        success: false,
        error: `Asset twin not found: ${id}`,
        code: 'ASSET_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      message: 'News added successfully',
      data: assetTwin,
    });
  } catch (error) {
    console.error('[Asset Routes] Error adding news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add news',
    });
  }
});

// ============================================================================
// SEARCH ASSETS
// ============================================================================

/**
 * GET /api/twins/asset/search/:query
 * Search assets by ticker
 */
router.get('/search/:query', async (req: AuthRequest, res: Response) => {
  try {
    const { query } = req.params;
    const limit = Math.min(parseInt(String(req.query.limit || '10'), 10), 50);
    const assets = await assetTwinService.search(query, limit);

    res.json({
      success: true,
      data: assets,
    });
  } catch (error) {
    console.error('[Asset Routes] Error searching assets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search assets',
    });
  }
});

// ============================================================================
// GET TOP PERFORMERS
// ============================================================================

/**
 * GET /api/twins/asset/top/performers
 * Get top performing assets
 */
router.get('/top/performers', async (req: AuthRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit || '10'), 10), 50);
    const assets = await assetTwinService.getTopPerformers(limit);

    res.json({
      success: true,
      data: assets,
    });
  } catch (error) {
    console.error('[Asset Routes] Error getting top performers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get top performers',
    });
  }
});

// ============================================================================
// GET ISLAMIC COMPLIANT
// ============================================================================

/**
 * GET /api/twins/asset/islamic/compliant
 * Get Islamic-compliant assets
 */
router.get('/islamic/compliant', async (req: AuthRequest, res: Response) => {
  try {
    const assets = await assetTwinService.getIslamicCompliant();

    res.json({
      success: true,
      data: assets,
    });
  } catch (error) {
    console.error('[Asset Routes] Error getting Islamic compliant assets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Islamic compliant assets',
    });
  }
});

// ============================================================================
// GET STATS
// ============================================================================

/**
 * GET /api/twins/asset/stats
 * Get asset statistics
 */
router.get('/stats/summary', async (req: AuthRequest, res: Response) => {
  try {
    const stats = await assetTwinService.getStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('[Asset Routes] Error getting stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get stats',
    });
  }
});

// ============================================================================
// DELETE ASSET TWIN
// ============================================================================

/**
 * DELETE /api/twins/asset/:id
 * Delete asset twin
 */
router.delete('/:id', internalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await assetTwinService.delete(id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: `Asset twin not found: ${id}`,
        code: 'ASSET_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Asset twin deleted successfully',
    });
  } catch (error) {
    console.error('[Asset Routes] Error deleting asset twin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete asset twin',
    });
  }
});

export default router;
