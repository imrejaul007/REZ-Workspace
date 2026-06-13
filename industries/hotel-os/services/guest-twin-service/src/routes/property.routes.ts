import { Router, Response } from 'express';
import { propertyTwinService, PropertyTwinQuery } from '../services/index.js';
import { apiKeyAuth, AuthRequest, validateBody, parsePagination } from '../middleware/index.js';
import { CreatePropertyTwinRequestSchema, UpdatePropertyRequestSchema, UpdateRevenueRequestSchema } from '../schemas/index.js';

const router = Router();

// Apply auth to all routes
router.use(apiKeyAuth);

// ============================================================================
// CREATE PROPERTY TWIN
// ============================================================================

/**
 * POST /api/twins/property
 * Create a new property twin
 */
router.post('/', validateBody(CreatePropertyTwinRequestSchema), async (req: AuthRequest, res: Response) => {
  try {
    const propertyTwin = await propertyTwinService.create(req.validatedBody);

    res.status(201).json({
      success: true,
      data: propertyTwin,
      twin_id: propertyTwin.twin_id,
    });
  } catch (error: any) {
    console.error('[Property Routes] Error creating property twin:', error);

    if (error.message.includes('already exists')) {
      res.status(409).json({
        success: false,
        error: error.message,
        code: 'PROPERTY_TWIN_EXISTS',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create property twin',
    });
  }
});

// ============================================================================
// GET PROPERTY TWIN
// ============================================================================

/**
 * GET /api/twins/property/:id
 * Get property twin by ID (property_id or twin_id)
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Try to find by property_id first, then by twin_id
    let propertyTwin = await propertyTwinService.getById(id);

    if (!propertyTwin && id.startsWith('twin.hotel.property.')) {
      propertyTwin = await propertyTwinService.getByTwinId(id);
    }

    if (!propertyTwin) {
      res.status(404).json({
        success: false,
        error: `Property twin not found: ${id}`,
        code: 'PROPERTY_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: propertyTwin,
    });
  } catch (error) {
    console.error('[Property Routes] Error getting property twin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get property twin',
    });
  }
});

// ============================================================================
// LIST PROPERTY TWINS
// ============================================================================

/**
 * GET /api/twins/property
 * List property twins with pagination and filters
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit } = parsePagination(req.query);
    const query: PropertyTwinQuery = {
      page,
      limit,
    };

    if (req.query.brand) query.brand = req.query.brand as string;
    if (req.query.city) query.city = req.query.city as string;

    const result = await propertyTwinService.list(query);

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
    console.error('[Property Routes] Error listing property twins:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list property twins',
    });
  }
});

// ============================================================================
// UPDATE PROPERTY TWIN
// ============================================================================

/**
 * PUT /api/twins/property/:id
 * Update property twin
 */
router.put('/:id', validateBody(UpdatePropertyRequestSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const propertyTwin = await propertyTwinService.update(id, req.validatedBody);

    if (!propertyTwin) {
      res.status(404).json({
        success: false,
        error: `Property twin not found: ${id}`,
        code: 'PROPERTY_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: propertyTwin,
    });
  } catch (error) {
    console.error('[Property Routes] Error updating property twin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update property twin',
    });
  }
});

// ============================================================================
// UPDATE INVENTORY
// ============================================================================

/**
 * PUT /api/twins/property/:id/inventory
 * Update property inventory
 */
router.put('/:id/inventory', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const propertyTwin = await propertyTwinService.updateInventory(id, req.body);

    if (!propertyTwin) {
      res.status(404).json({
        success: false,
        error: `Property twin not found: ${id}`,
        code: 'PROPERTY_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: propertyTwin.inventory,
      updated: propertyTwin,
    });
  } catch (error) {
    console.error('[Property Routes] Error updating inventory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update inventory',
    });
  }
});

// ============================================================================
// UPDATE REVENUE
// ============================================================================

/**
 * PUT /api/twins/property/:id/revenue
 * Update revenue metrics
 */
router.put('/:id/revenue', validateBody(UpdateRevenueRequestSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const propertyTwin = await propertyTwinService.updateRevenue(id, req.validatedBody);

    if (!propertyTwin) {
      res.status(404).json({
        success: false,
        error: `Property twin not found: ${id}`,
        code: 'PROPERTY_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: propertyTwin.revenue,
      updated: propertyTwin,
    });
  } catch (error) {
    console.error('[Property Routes] Error updating revenue:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update revenue',
    });
  }
});

// ============================================================================
// ADD/UPDATE VENUE
// ============================================================================

/**
 * POST /api/twins/property/:id/venues
 * Add or update a venue
 */
router.post('/:id/venues', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const propertyTwin = await propertyTwinService.upsertVenue(id, req.body);

    if (!propertyTwin) {
      res.status(404).json({
        success: false,
        error: `Property twin not found: ${id}`,
        code: 'PROPERTY_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: propertyTwin.venues,
      updated: propertyTwin,
    });
  } catch (error) {
    console.error('[Property Routes] Error adding venue:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add venue',
    });
  }
});

// ============================================================================
// REMOVE VENUE
// ============================================================================

/**
 * DELETE /api/twins/property/:id/venues/:venueId
 * Remove a venue
 */
router.delete('/:id/venues/:venueId', async (req: AuthRequest, res: Response) => {
  try {
    const { id, venueId } = req.params;
    const propertyTwin = await propertyTwinService.removeVenue(id, venueId);

    if (!propertyTwin) {
      res.status(404).json({
        success: false,
        error: `Property twin not found: ${id}`,
        code: 'PROPERTY_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Venue removed successfully',
      data: propertyTwin.venues,
      updated: propertyTwin,
    });
  } catch (error) {
    console.error('[Property Routes] Error removing venue:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove venue',
    });
  }
});

// ============================================================================
// UPDATE STAFF
// ============================================================================

/**
 * PUT /api/twins/property/:id/staff
 * Update staff counts
 */
router.put('/:id/staff', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const propertyTwin = await propertyTwinService.updateStaff(id, req.body);

    if (!propertyTwin) {
      res.status(404).json({
        success: false,
        error: `Property twin not found: ${id}`,
        code: 'PROPERTY_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: propertyTwin.staff,
      updated: propertyTwin,
    });
  } catch (error) {
    console.error('[Property Routes] Error updating staff:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update staff',
    });
  }
});

// ============================================================================
// GET STATS
// ============================================================================

/**
 * GET /api/twins/property/stats
 * Get property twin statistics
 */
router.get('/stats/summary', async (req: AuthRequest, res: Response) => {
  try {
    const stats = await propertyTwinService.getStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('[Property Routes] Error getting stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get stats',
    });
  }
});

// ============================================================================
// DELETE PROPERTY TWIN
// ============================================================================

/**
 * DELETE /api/twins/property/:id
 * Delete property twin
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await propertyTwinService.delete(id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: `Property twin not found: ${id}`,
        code: 'PROPERTY_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Property twin deleted successfully',
    });
  } catch (error) {
    console.error('[Property Routes] Error deleting property twin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete property twin',
    });
  }
});

export default router;