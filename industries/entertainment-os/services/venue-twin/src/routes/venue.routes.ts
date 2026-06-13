import { Router, Response } from 'express';
import { venueTwinService, VenueTwinQuery } from '../services/index.js';
import { apiKeyAuth, internalAuth, AuthRequest, validateBody, parsePagination } from '../middleware/index.js';
import {
  CreateVenueTwinSchema,
  UpdateVenueTwinSchema,
  UpdateOperationalMetricsSchema,
  UpdateDOOHConfigSchema,
  UpdateAudienceProfileSchema,
} from '../schemas/index.js';

const router = Router();

// Apply auth to all routes
router.use(apiKeyAuth);

// ============================================================================
// CREATE VENUE TWIN
// ============================================================================

/**
 * POST /api/twins/venue
 * Create a new venue twin
 */
router.post('/', validateBody(CreateVenueTwinSchema), async (req: AuthRequest, res: Response) => {
  try {
    const twin = await venueTwinService.create(req.validatedBody);

    res.status(201).json({
      success: true,
      data: twin,
      twin_id: twin.twin_id,
    });
  } catch (error: any) {
    console.error('[Venue Routes] Error creating venue twin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create venue twin',
    });
  }
});

// ============================================================================
// GET VENUE TWIN
// ============================================================================

/**
 * GET /api/twins/venue/:id
 * Get venue twin by ID
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const twin = await venueTwinService.getById(id);

    if (!twin) {
      res.status(404).json({
        success: false,
        error: `Venue twin not found: ${id}`,
        code: 'VENUE_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: twin,
    });
  } catch (error) {
    console.error('[Venue Routes] Error getting venue twin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get venue twin',
    });
  }
});

// ============================================================================
// LIST VENUE TWINS
// ============================================================================

/**
 * GET /api/twins/venue
 * List venue twins with pagination and filters
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit } = parsePagination(req.query);
    const query: VenueTwinQuery = { page, limit };

    if (req.query.venue_type) query.venue_type = req.query.venue_type as string;
    if (req.query.city) query.city = req.query.city as string;
    if (req.query.country) query.country = req.query.country as string;
    if (req.query.min_capacity) query.min_capacity = parseInt(req.query.min_capacity as string);
    if (req.query.has_dooh) query.has_dooh = req.query.has_dooh === 'true';

    const result = await venueTwinService.list(query);

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
    console.error('[Venue Routes] Error listing venue twins:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list venue twins',
    });
  }
});

// ============================================================================
// FIND NEARBY VENUES
// ============================================================================

/**
 * GET /api/twins/venue/nearby
 * Find venues near coordinates
 */
router.get('/search/nearby', async (req: AuthRequest, res: Response) => {
  try {
    const latitude = parseFloat(req.query.latitude as string);
    const longitude = parseFloat(req.query.longitude as string);
    const radius = parseFloat(req.query.radius as string) || 10;
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));

    if (isNaN(latitude) || isNaN(longitude)) {
      res.status(400).json({
        success: false,
        error: 'latitude and longitude are required',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    const venues = await venueTwinService.findNearby(latitude, longitude, radius, limit);

    res.json({
      success: true,
      data: venues,
    });
  } catch (error) {
    console.error('[Venue Routes] Error finding nearby venues:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to find nearby venues',
    });
  }
});

// ============================================================================
// UPDATE VENUE TWIN
// ============================================================================

/**
 * PUT /api/twins/venue/:id
 * Update venue twin
 */
router.put('/:id', validateBody(UpdateVenueTwinSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const twin = await venueTwinService.update(id, req.validatedBody);

    if (!twin) {
      res.status(404).json({
        success: false,
        error: `Venue twin not found: ${id}`,
        code: 'VENUE_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: twin,
    });
  } catch (error) {
    console.error('[Venue Routes] Error updating venue twin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update venue twin',
    });
  }
});

// ============================================================================
// UPDATE OPERATIONAL METRICS
// ============================================================================

/**
 * PUT /api/twins/venue/:id/metrics
 * Update venue operational metrics
 */
router.put('/:id/metrics', validateBody(UpdateOperationalMetricsSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const twin = await venueTwinService.updateOperationalMetrics(id, req.validatedBody);

    if (!twin) {
      res.status(404).json({
        success: false,
        error: `Venue twin not found: ${id}`,
        code: 'VENUE_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: twin.operational_metrics,
      updated: twin,
    });
  } catch (error) {
    console.error('[Venue Routes] Error updating metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update metrics',
    });
  }
});

// ============================================================================
// UPDATE DOOH CONFIG
// ============================================================================

/**
 * PUT /api/twins/venue/:id/dooh
 * Update venue DOOH configuration
 */
router.put('/:id/dooh', validateBody(UpdateDOOHConfigSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const twin = await venueTwinService.updateDOOHConfig(id, req.validatedBody);

    if (!twin) {
      res.status(404).json({
        success: false,
        error: `Venue twin not found: ${id}`,
        code: 'VENUE_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: twin.dooh_configuration,
      updated: twin,
    });
  } catch (error) {
    console.error('[Venue Routes] Error updating DOOH config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update DOOH config',
    });
  }
});

// ============================================================================
// UPDATE AUDIENCE PROFILE
// ============================================================================

/**
 * PUT /api/twins/venue/:id/audience
 * Update venue audience profile
 */
router.put('/:id/audience', validateBody(UpdateAudienceProfileSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const twin = await venueTwinService.updateAudienceProfile(id, req.validatedBody);

    if (!twin) {
      res.status(404).json({
        success: false,
        error: `Venue twin not found: ${id}`,
        code: 'VENUE_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: twin.audience_profile,
      updated: twin,
    });
  } catch (error) {
    console.error('[Venue Routes] Error updating audience profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update audience profile',
    });
  }
});

// ============================================================================
// GET DOOH INVENTORY
// ============================================================================

/**
 * GET /api/twins/venue/:id/inventory
 * Get venue DOOH inventory
 */
router.get('/:id/inventory', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const inventory = await venueTwinService.getDOOHInventory(id);

    res.json({
      success: true,
      data: inventory,
    });
  } catch (error: any) {
    console.error('[Venue Routes] Error getting inventory:', error);
    res.status(404).json({
      success: false,
      error: error.message || 'Failed to get inventory',
    });
  }
});

// ============================================================================
// GET STATS
// ============================================================================

/**
 * GET /api/twins/venue/stats
 * Get venue twin statistics
 */
router.get('/stats/summary', async (req: AuthRequest, res: Response) => {
  try {
    const stats = await venueTwinService.getStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('[Venue Routes] Error getting stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get stats',
    });
  }
});

// ============================================================================
// DELETE VENUE TWIN
// ============================================================================

/**
 * DELETE /api/twins/venue/:id
 * Delete venue twin
 */
router.delete('/:id', internalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await venueTwinService.delete(id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: `Venue twin not found: ${id}`,
        code: 'VENUE_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Venue twin deleted successfully',
    });
  } catch (error) {
    console.error('[Venue Routes] Error deleting venue twin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete venue twin',
    });
  }
});

export default router;