import { Router, Response } from 'express';
import { driverTwinService, DriverTwinQuery } from '../services/index.js';
import { apiKeyAuth, internalAuth, AuthRequest, validateBody, parsePagination } from '../middleware/index.js';
import {
  CreateDriverTwinRequestSchema,
  UpdateDriverTwinRequestSchema,
  UpdateStatusRequestSchema,
  UpdateLocationRequestSchema,
  UpdatePerformanceRequestSchema,
  UpdateEarningsRequestSchema,
  UpdateScheduleRequestSchema,
  StartShiftRequestSchema,
  EndShiftRequestSchema,
  RatingRequestSchema,
  NearbyDriversRequestSchema,
} from '../schemas/index.js';

const router = Router();

// Apply auth to all routes
router.use(apiKeyAuth);

// ============================================================================
// CREATE DRIVER TWIN
// ============================================================================

/**
 * POST /api/twins/driver
 * Create a new driver twin
 */
router.post('/', validateBody(CreateDriverTwinRequestSchema), async (req: AuthRequest, res: Response) => {
  try {
    const driverTwin = await driverTwinService.create(req.validatedBody);

    res.status(201).json({
      success: true,
      data: driverTwin,
      twin_id: driverTwin.twin_id,
    });
  } catch (error: any) {
    console.error('[Driver Routes] Error creating driver twin:', error);

    if (error.message.includes('already exists')) {
      res.status(409).json({
        success: false,
        error: error.message,
        code: 'DRIVER_TWIN_EXISTS',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create driver twin',
    });
  }
});

// ============================================================================
// GET DRIVER TWIN
// ============================================================================

/**
 * GET /api/twins/driver/:id
 * Get driver twin by ID (driver_id or twin_id)
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    let driverTwin = await driverTwinService.getById(id);

    if (!driverTwin && id.startsWith('twin.transport.driver.')) {
      driverTwin = await driverTwinService.getByTwinId(id);
    }

    if (!driverTwin) {
      res.status(404).json({
        success: false,
        error: `Driver twin not found: ${id}`,
        code: 'DRIVER_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: driverTwin,
    });
  } catch (error) {
    console.error('[Driver Routes] Error getting driver twin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get driver twin',
    });
  }
});

// ============================================================================
// LIST DRIVER TWINS
// ============================================================================

/**
 * GET /api/twins/driver
 * List driver twins with pagination and filters
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit } = parsePagination(req.query);
    const query: DriverTwinQuery = {
      page,
      limit,
    };

    if (req.query.fleet_id) query.fleet_id = req.query.fleet_id as string;
    if (req.query.vehicle_id) query.vehicle_id = req.query.vehicle_id as string;
    if (req.query.status) query.status = req.query.status as string;
    if (req.query.min_rating) {
      query['performance.avg_rating'] = { $gte: parseFloat(req.query.min_rating as string) };
    }

    const result = await driverTwinService.list(query);

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
    console.error('[Driver Routes] Error listing driver twins:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list driver twins',
    });
  }
});

// ============================================================================
// UPDATE DRIVER TWIN
// ============================================================================

/**
 * PUT /api/twins/driver/:id
 * Update driver twin
 */
router.put('/:id', validateBody(UpdateDriverTwinRequestSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const driverTwin = await driverTwinService.update(id, req.body);

    if (!driverTwin) {
      res.status(404).json({
        success: false,
        error: `Driver twin not found: ${id}`,
        code: 'DRIVER_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: driverTwin,
    });
  } catch (error) {
    console.error('[Driver Routes] Error updating driver twin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update driver twin',
    });
  }
});

// ============================================================================
// UPDATE STATUS
// ============================================================================

/**
 * PUT /api/twins/driver/:id/status
 * Update driver status
 */
router.put('/:id/status', validateBody(UpdateStatusRequestSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const driverTwin = await driverTwinService.updateStatus(id, req.body);

    if (!driverTwin) {
      res.status(404).json({
        success: false,
        error: `Driver twin not found: ${id}`,
        code: 'DRIVER_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: driverTwin.status,
      updated: driverTwin,
    });
  } catch (error) {
    console.error('[Driver Routes] Error updating status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update status',
    });
  }
});

// ============================================================================
// UPDATE LOCATION
// ============================================================================

/**
 * PUT /api/twins/driver/:id/location
 * Update driver location
 */
router.put('/:id/location', validateBody(UpdateLocationRequestSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { lat, lng } = req.body;
    const driverTwin = await driverTwinService.updateLocation(id, { lat, lng });

    if (!driverTwin) {
      res.status(404).json({
        success: false,
        error: `Driver twin not found: ${id}`,
        code: 'DRIVER_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: driverTwin.status.location,
    });
  } catch (error) {
    console.error('[Driver Routes] Error updating location:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update location',
    });
  }
});

// ============================================================================
// UPDATE PERFORMANCE
// ============================================================================

/**
 * PUT /api/twins/driver/:id/performance
 * Update driver performance
 */
router.put('/:id/performance', validateBody(UpdatePerformanceRequestSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const driverTwin = await driverTwinService.updatePerformance(id, req.body);

    if (!driverTwin) {
      res.status(404).json({
        success: false,
        error: `Driver twin not found: ${id}`,
        code: 'DRIVER_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: driverTwin.performance,
    });
  } catch (error) {
    console.error('[Driver Routes] Error updating performance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update performance',
    });
  }
});

// ============================================================================
// UPDATE EARNINGS
// ============================================================================

/**
 * PUT /api/twins/driver/:id/earnings
 * Update driver earnings
 */
router.put('/:id/earnings', validateBody(UpdateEarningsRequestSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const driverTwin = await driverTwinService.updateEarnings(id, req.body);

    if (!driverTwin) {
      res.status(404).json({
        success: false,
        error: `Driver twin not found: ${id}`,
        code: 'DRIVER_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: driverTwin.earnings,
    });
  } catch (error) {
    console.error('[Driver Routes] Error updating earnings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update earnings',
    });
  }
});

// ============================================================================
// UPDATE SCHEDULE
// ============================================================================

/**
 * PUT /api/twins/driver/:id/schedule
 * Update driver schedule
 */
router.put('/:id/schedule', validateBody(UpdateScheduleRequestSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const driverTwin = await driverTwinService.updateSchedule(id, req.body);

    if (!driverTwin) {
      res.status(404).json({
        success: false,
        error: `Driver twin not found: ${id}`,
        code: 'DRIVER_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: driverTwin.schedule,
    });
  } catch (error) {
    console.error('[Driver Routes] Error updating schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update schedule',
    });
  }
});

// ============================================================================
// START SHIFT
// ============================================================================

/**
 * POST /api/twins/driver/:id/shift/start
 * Start driver shift
 */
router.post('/:id/shift/start', validateBody(StartShiftRequestSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const driverTwin = await driverTwinService.startShift(id, req.body);

    if (!driverTwin) {
      res.status(404).json({
        success: false,
        error: `Driver twin not found: ${id}`,
        code: 'DRIVER_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Shift started successfully',
      data: driverTwin,
    });
  } catch (error: any) {
    console.error('[Driver Routes] Error starting shift:', error);

    if (error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: error.message,
        code: 'DRIVER_TWIN_NOT_FOUND',
      });
      return;
    }

    if (error.message.includes('already online')) {
      res.status(409).json({
        success: false,
        error: error.message,
        code: 'ALREADY_ONLINE',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to start shift',
    });
  }
});

// ============================================================================
// END SHIFT
// ============================================================================

/**
 * POST /api/twins/driver/:id/shift/end
 * End driver shift
 */
router.post('/:id/shift/end', validateBody(EndShiftRequestSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const driverTwin = await driverTwinService.endShift(id, req.body);

    if (!driverTwin) {
      res.status(404).json({
        success: false,
        error: `Driver twin not found: ${id}`,
        code: 'DRIVER_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Shift ended successfully',
      data: driverTwin,
    });
  } catch (error: any) {
    console.error('[Driver Routes] Error ending shift:', error);

    if (error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: error.message,
        code: 'DRIVER_TWIN_NOT_FOUND',
      });
      return;
    }

    if (error.message.includes('not on a shift')) {
      res.status(409).json({
        success: false,
        error: error.message,
        code: 'NOT_ON_SHIFT',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to end shift',
    });
  }
});

// ============================================================================
// RATE DRIVER
// ============================================================================

/**
 * POST /api/twins/driver/:id/rate
 * Record driver rating
 */
router.post('/:id/rate', validateBody(RatingRequestSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const driverTwin = await driverTwinService.recordRating(id, req.body);

    if (!driverTwin) {
      res.status(404).json({
        success: false,
        error: `Driver twin not found: ${id}`,
        code: 'DRIVER_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Rating recorded successfully',
      data: {
        new_rating: driverTwin.performance.avg_rating,
        rating_count: driverTwin.performance.rating_count,
      },
    });
  } catch (error: any) {
    console.error('[Driver Routes] Error recording rating:', error);

    if (error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: error.message,
        code: 'DRIVER_TWIN_NOT_FOUND',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to record rating',
    });
  }
});

// ============================================================================
// NEARBY DRIVERS
// ============================================================================

/**
 * GET /api/twins/driver/nearby
 * Get nearby available drivers
 */
router.get('/search/nearby', validateBody(NearbyDriversRequestSchema), async (req: AuthRequest, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radiusKm = parseFloat(req.query.radius_km as string) || 5;
    const availableOnly = req.query.available_only !== 'false';

    const drivers = await driverTwinService.getNearbyDrivers(lat, lng, radiusKm, availableOnly);

    res.json({
      success: true,
      data: drivers,
      count: drivers.length,
    });
  } catch (error) {
    console.error('[Driver Routes] Error getting nearby drivers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get nearby drivers',
    });
  }
});

// ============================================================================
// GET STATS
// ============================================================================

/**
 * GET /api/twins/driver/stats
 * Get driver statistics
 */
router.get('/stats/summary', async (req: AuthRequest, res: Response) => {
  try {
    const fleet_id = req.query.fleet_id as string | undefined;
    const stats = await driverTwinService.getStats(fleet_id);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('[Driver Routes] Error getting stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get stats',
    });
  }
});

// ============================================================================
// DELETE DRIVER TWIN
// ============================================================================

/**
 * DELETE /api/twins/driver/:id
 * Delete driver twin
 */
router.delete('/:id', internalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await driverTwinService.delete(id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: `Driver twin not found: ${id}`,
        code: 'DRIVER_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Driver twin deleted successfully',
    });
  } catch (error) {
    console.error('[Driver Routes] Error deleting driver twin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete driver twin',
    });
  }
});

export default router;
