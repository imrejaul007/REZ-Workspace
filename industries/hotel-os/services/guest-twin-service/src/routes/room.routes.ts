import { Router, Response } from 'express';
import { roomTwinService, RoomTwinQuery } from '../services/index.js';
import { apiKeyAuth, AuthRequest, validateBody, parsePagination } from '../middleware/index.js';
import { CreateRoomTwinRequestSchema, UpdateRoomStatusRequestSchema, UpdateIoTStateRequestSchema } from '../schemas/index.js';

const router = Router();

// Apply auth to all routes
router.use(apiKeyAuth);

// ============================================================================
// CREATE ROOM TWIN
// ============================================================================

/**
 * POST /api/twins/room
 * Create a new room twin
 */
router.post('/', validateBody(CreateRoomTwinRequestSchema), async (req: AuthRequest, res: Response) => {
  try {
    const roomTwin = await roomTwinService.create(req.validatedBody);

    res.status(201).json({
      success: true,
      data: roomTwin,
      twin_id: roomTwin.twin_id,
    });
  } catch (error: any) {
    console.error('[Room Routes] Error creating room twin:', error);

    if (error.message.includes('already exists')) {
      res.status(409).json({
        success: false,
        error: error.message,
        code: 'ROOM_TWIN_EXISTS',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create room twin',
    });
  }
});

// ============================================================================
// GET ROOM TWIN
// ============================================================================

/**
 * GET /api/twins/room/:id
 * Get room twin by ID (room_id or twin_id)
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Try to find by room_id first, then by twin_id
    let roomTwin = await roomTwinService.getById(id);

    if (!roomTwin && id.startsWith('twin.hotel.room.')) {
      roomTwin = await roomTwinService.getByTwinId(id);
    }

    if (!roomTwin) {
      res.status(404).json({
        success: false,
        error: `Room twin not found: ${id}`,
        code: 'ROOM_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: roomTwin,
    });
  } catch (error) {
    console.error('[Room Routes] Error getting room twin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get room twin',
    });
  }
});

// ============================================================================
// GET ROOM STATUS (Simplified)
// ============================================================================

/**
 * GET /api/twins/room/:id/status
 * Get room status
 */
router.get('/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const status = await roomTwinService.getStatus(id);

    if (!status) {
      res.status(404).json({
        success: false,
        error: `Room twin not found: ${id}`,
        code: 'ROOM_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('[Room Routes] Error getting room status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get room status',
    });
  }
});

// ============================================================================
// LIST ROOM TWINS
// ============================================================================

/**
 * GET /api/twins/room
 * List room twins with pagination and filters
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit } = parsePagination(req.query);
    const query: RoomTwinQuery = {
      page,
      limit,
    };

    if (req.query.property_id) query.property_id = req.query.property_id as string;
    if (req.query.room_type) query.room_type = req.query.room_type as string;
    if (req.query.status) query.status = req.query.status as string;
    if (req.query.floor) query.floor = parseInt(req.query.floor as string, 10);

    const result = await roomTwinService.list(query);

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
    console.error('[Room Routes] Error listing room twins:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list room twins',
    });
  }
});

// ============================================================================
// UPDATE ROOM TWIN
// ============================================================================

/**
 * PUT /api/twins/room/:id
 * Update room twin
 */
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const roomTwin = await roomTwinService.update(id, req.body);

    if (!roomTwin) {
      res.status(404).json({
        success: false,
        error: `Room twin not found: ${id}`,
        code: 'ROOM_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: roomTwin,
    });
  } catch (error) {
    console.error('[Room Routes] Error updating room twin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update room twin',
    });
  }
});

// ============================================================================
// UPDATE ROOM STATUS
// ============================================================================

/**
 * PUT /api/twins/room/:id/status
 * Update room status
 */
router.put('/:id/status', validateBody(UpdateRoomStatusRequestSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const roomTwin = await roomTwinService.updateStatus(id, req.validatedBody);

    if (!roomTwin) {
      res.status(404).json({
        success: false,
        error: `Room twin not found: ${id}`,
        code: 'ROOM_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: roomTwin.status,
      updated: roomTwin,
    });
  } catch (error) {
    console.error('[Room Routes] Error updating room status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update room status',
    });
  }
});

// ============================================================================
// UPDATE IoT STATE
// ============================================================================

/**
 * PUT /api/twins/room/:id/iot
 * Update IoT state
 */
router.put('/:id/iot', validateBody(UpdateIoTStateRequestSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const roomTwin = await roomTwinService.updateIoTState(id, req.validatedBody);

    if (!roomTwin) {
      res.status(404).json({
        success: false,
        error: `Room twin not found: ${id}`,
        code: 'ROOM_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: roomTwin.iot_state,
      updated: roomTwin,
    });
  } catch (error) {
    console.error('[Room Routes] Error updating IoT state:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update IoT state',
    });
  }
});

// ============================================================================
// ASSIGN GUEST
// ============================================================================

/**
 * POST /api/twins/room/:id/assign
 * Assign guest to room
 */
router.post('/:id/assign', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { guest_id } = req.body;

    if (!guest_id) {
      res.status(400).json({
        success: false,
        error: 'guest_id is required',
      });
      return;
    }

    const roomTwin = await roomTwinService.assignGuest(id, guest_id);

    if (!roomTwin) {
      res.status(404).json({
        success: false,
        error: `Room twin not found: ${id}`,
        code: 'ROOM_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Guest assigned to room',
      data: roomTwin,
    });
  } catch (error) {
    console.error('[Room Routes] Error assigning guest:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign guest',
    });
  }
});

// ============================================================================
// CLEAR GUEST
// ============================================================================

/**
 * POST /api/twins/room/:id/clear
 * Clear guest from room
 */
router.post('/:id/clear', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const roomTwin = await roomTwinService.clearGuest(id);

    if (!roomTwin) {
      res.status(404).json({
        success: false,
        error: `Room twin not found: ${id}`,
        code: 'ROOM_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Guest cleared from room',
      data: roomTwin,
    });
  } catch (error) {
    console.error('[Room Routes] Error clearing guest:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear guest',
    });
  }
});

// ============================================================================
// UPDATE HOUSEKEEPING
// ============================================================================

/**
 * PUT /api/twins/room/:id/housekeeping
 * Update housekeeping info
 */
router.put('/:id/housekeeping', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const roomTwin = await roomTwinService.updateHousekeeping(id, req.body);

    if (!roomTwin) {
      res.status(404).json({
        success: false,
        error: `Room twin not found: ${id}`,
        code: 'ROOM_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      data: roomTwin.housekeeping,
      updated: roomTwin,
    });
  } catch (error) {
    console.error('[Room Routes] Error updating housekeeping:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update housekeeping',
    });
  }
});

// ============================================================================
// GET STATS
// ============================================================================

/**
 * GET /api/twins/room/stats
 * Get room twin statistics
 */
router.get('/stats/summary', async (req: AuthRequest, res: Response) => {
  try {
    const property_id = req.query.property_id as string | undefined;
    const stats = await roomTwinService.getStats(property_id);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('[Room Routes] Error getting stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get stats',
    });
  }
});

// ============================================================================
// DELETE ROOM TWIN
// ============================================================================

/**
 * DELETE /api/twins/room/:id
 * Delete room twin
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await roomTwinService.delete(id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: `Room twin not found: ${id}`,
        code: 'ROOM_TWIN_NOT_FOUND',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Room twin deleted successfully',
    });
  } catch (error) {
    console.error('[Room Routes] Error deleting room twin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete room twin',
    });
  }
});

export default router;