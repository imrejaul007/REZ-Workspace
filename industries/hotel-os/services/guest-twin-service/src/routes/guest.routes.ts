import { Router, Response } from 'express';
import { z } from 'zod';
import { guestTwinService, GuestTwinQuery } from '../services/index.js';
import { apiKeyAuth, internalAuth, AuthRequest, validateBody, parsePagination, parseNumber } from '../middleware/index.js';
import { CreateGuestTwinRequestSchema, UpdatePreferencesRequestSchema, UpdateSentimentRequestSchema, CheckInRequestSchema, CheckOutRequestSchema } from '../schemas/index.js';

const router = Router();

// Apply auth to all routes
router.use(apiKeyAuth);

// ============================================================================
// CREATE GUEST TWIN
// ============================================================================

/**
 * POST /api/twins/guest
 * Create a new guest twin
 */
router.post('/', validateBody(CreateGuestTwinRequestSchema), async (req: AuthRequest, res: Response) => {
  try {
    const guestTwin = await guestTwinService.create(req.validatedBody);

    res.status(201).json({
      success: true,
      data: guestTwin,
      twin_id: guestTwin.twin_id,
    });
  } catch (error: any) {
    console.error('[Guest Routes] Error creating guest twin:', error);

    if (error.message.includes('already exists')) {
      res.status(409).json({
        success: false,
        error: error.message,
        code: 'GUEST_TWIN_EXISTS',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create guest twin',
    });
  }
});

// ============================================================================
// GET GUEST TWIN
// ============================================================================

/**
 * GET /api/twins/guest/:id
 * Get guest twin by ID (guest_id or twin_id)
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Try to find by guest_id first, then by twin_id
    let guestTwin = await guestTwinService.getById(id);

    if (!guestTwin && id.startsWith('twin.hotel.guest.')) {
      guestTwin = await guestTwinService.getByTwinId(id);
    }

    if (!guestTwin) {
      res.status(404).json({
        success: false,
        error: `Guest twin not found: ${id}`,
        code: 'GUEST_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: guestTwin,
    });
  } catch (error) {
    console.error('[Guest Routes] Error getting guest twin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get guest twin',
    });
  }
});

// ============================================================================
// LIST GUEST TWINS
// ============================================================================

/**
 * GET /api/twins/guest
 * List guest twins with pagination and filters
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit } = parsePagination(req.query);
    const query: GuestTwinQuery = {
      page,
      limit,
    };

    if (req.query.property_id) query.property_id = req.query.property_id as string;
    if (req.query.tier) query['loyalty.tier'] = req.query.tier as string;
    if (req.query.sentiment_trend) query['sentiment.trend'] = req.query.sentiment_trend as string;
    if (req.query.churn_risk) query['lifetime_value.churn_risk'] = req.query.churn_risk as string;

    const result = await guestTwinService.list(query);

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
    console.error('[Guest Routes] Error listing guest twins:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list guest twins',
    });
  }
});

// ============================================================================
// UPDATE GUEST TWIN
// ============================================================================

/**
 * PUT /api/twins/guest/:id
 * Update guest twin
 */
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const guestTwin = await guestTwinService.update(id, req.body);

    if (!guestTwin) {
      res.status(404).json({
        success: false,
        error: `Guest twin not found: ${id}`,
        code: 'GUEST_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: guestTwin,
    });
  } catch (error) {
    console.error('[Guest Routes] Error updating guest twin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update guest twin',
    });
  }
});

// ============================================================================
// UPDATE PREFERENCES
// ============================================================================

/**
 * PUT /api/twins/guest/:id/preferences
 * Update guest preferences
 */
router.put('/:id/preferences', validateBody(UpdatePreferencesRequestSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const guestTwin = await guestTwinService.updatePreferences(id, req.validatedBody);

    if (!guestTwin) {
      res.status(404).json({
        success: false,
        error: `Guest twin not found: ${id}`,
        code: 'GUEST_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: guestTwin.preferences,
      updated: guestTwin,
    });
  } catch (error) {
    console.error('[Guest Routes] Error updating preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update preferences',
    });
  }
});

// ============================================================================
// GET PREFERENCES
// ============================================================================

/**
 * GET /api/twins/guest/:id/preferences
 * Get guest preferences
 */
router.get('/:id/preferences', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const guestTwin = await guestTwinService.getById(id);

    if (!guestTwin) {
      res.status(404).json({
        success: false,
        error: `Guest twin not found: ${id}`,
        code: 'GUEST_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: guestTwin.preferences,
    });
  } catch (error) {
    console.error('[Guest Routes] Error getting preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get preferences',
    });
  }
});

// ============================================================================
// UPDATE SENTIMENT
// ============================================================================

/**
 * PUT /api/twins/guest/:id/sentiment
 * Update guest sentiment
 */
router.put('/:id/sentiment', validateBody(UpdateSentimentRequestSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const guestTwin = await guestTwinService.updateSentiment(id, req.validatedBody);

    if (!guestTwin) {
      res.status(404).json({
        success: false,
        error: `Guest twin not found: ${id}`,
        code: 'GUEST_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: guestTwin.sentiment,
      updated: guestTwin,
    });
  } catch (error) {
    console.error('[Guest Routes] Error updating sentiment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update sentiment',
    });
  }
});

// ============================================================================
// CHECK-IN
// ============================================================================

/**
 * POST /api/twins/guest/:id/checkin
 * Process guest check-in
 */
router.post('/:id/checkin', validateBody(CheckInRequestSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const guestTwin = await guestTwinService.checkIn(id, req.validatedBody);

    if (!guestTwin) {
      res.status(404).json({
        success: false,
        error: `Guest twin not found: ${id}`,
        code: 'GUEST_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Guest checked in successfully',
      data: guestTwin,
    });
  } catch (error: any) {
    console.error('[Guest Routes] Error checking in guest:', error);

    if (error.message.includes('already checked in')) {
      res.status(409).json({
        success: false,
        error: error.message,
        code: 'ALREADY_CHECKED_IN',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to check in guest',
    });
  }
});

// ============================================================================
// CHECK-OUT
// ============================================================================

/**
 * POST /api/twins/guest/:id/checkout
 * Process guest check-out
 */
router.post('/:id/checkout', validateBody(CheckOutRequestSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const guestTwin = await guestTwinService.checkOut(id, req.validatedBody);

    if (!guestTwin) {
      res.status(404).json({
        success: false,
        error: `Guest twin not found: ${id}`,
        code: 'GUEST_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Guest checked out successfully',
      data: guestTwin,
    });
  } catch (error: any) {
    console.error('[Guest Routes] Error checking out guest:', error);

    if (error.message.includes('not checked in')) {
      res.status(409).json({
        success: false,
        error: error.message,
        code: 'NOT_CHECKED_IN',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to check out guest',
    });
  }
});

// ============================================================================
// UPDATE LOYALTY
// ============================================================================

/**
 * PUT /api/twins/guest/:id/loyalty
 * Update guest loyalty status
 */
router.put('/:id/loyalty', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { tier, points_balance } = req.body;

    const guestTwin = await guestTwinService.updateLoyalty(id, { tier, points_balance });

    if (!guestTwin) {
      res.status(404).json({
        success: false,
        error: `Guest twin not found: ${id}`,
        code: 'GUEST_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: guestTwin.loyalty,
      updated: guestTwin,
    });
  } catch (error) {
    console.error('[Guest Routes] Error updating loyalty:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update loyalty',
    });
  }
});

// ============================================================================
// GET STATS
// ============================================================================

/**
 * GET /api/twins/guest/stats
 * Get guest twin statistics
 */
router.get('/stats/summary', async (req: AuthRequest, res: Response) => {
  try {
    const property_id = req.query.property_id as string | undefined;
    const stats = await guestTwinService.getStats(property_id);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('[Guest Routes] Error getting stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get stats',
    });
  }
});

// ============================================================================
// DELETE GUEST TWIN
// ============================================================================

/**
 * DELETE /api/twins/guest/:id
 * Delete guest twin
 */
router.delete('/:id', internalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await guestTwinService.delete(id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: `Guest twin not found: ${id}`,
        code: 'GUEST_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Guest twin deleted successfully',
    });
  } catch (error) {
    console.error('[Guest Routes] Error deleting guest twin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete guest twin',
    });
  }
});

export default router;