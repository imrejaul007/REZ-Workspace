import { Router, Response } from 'express';
import { getEventEmitter, TwinEventType, TwinEvent } from '../events/index.js';
import { apiKeyAuth, AuthRequest } from '../middleware/index.js';

const router = Router();

router.use(apiKeyAuth);

// ============================================================================
// EVENT ROUTES
// ============================================================================

/**
 * GET /api/events
 * List available event types
 */
router.get('/', (_req: AuthRequest, res: Response) => {
  const eventTypes = Object.values(TwinEventType);
  res.json({
    success: true,
    data: {
      event_types: eventTypes,
      descriptions: {
        [TwinEventType.DRIVER_TWIN_CREATED]: 'Emitted when a new driver twin is created',
        [TwinEventType.DRIVER_TWIN_UPDATED]: 'Emitted when a driver twin is updated',
        [TwinEventType.DRIVER_STATUS_CHANGED]: 'Emitted when driver status changes',
        [TwinEventType.DRIVER_LOCATION_UPDATED]: 'Emitted when driver location is updated',
        [TwinEventType.DRIVER_PERFORMANCE_UPDATED]: 'Emitted when driver performance metrics change',
        [TwinEventType.DRIVER_EARNINGS_UPDATED]: 'Emitted when driver earnings are updated',
        [TwinEventType.DRIVER_SCHEDULE_UPDATED]: 'Emitted when driver schedule changes',
        [TwinEventType.DRIVER_RATING_RECEIVED]: 'Emitted when driver receives a rating',
        [TwinEventType.DRIVER_SHIFT_STARTED]: 'Emitted when driver starts a shift',
        [TwinEventType.DRIVER_SHIFT_ENDED]: 'Emitted when driver ends a shift',
        [TwinEventType.DRIVER_LICENSE_EXPIRING]: 'Emitted when driver license is expiring',
        [TwinEventType.DRIVER_BACKGROUND_UPDATED]: 'Emitted when driver background check is updated',
        [TwinEventType.DRIVER_ORDER_ACCEPTED]: 'Emitted when driver accepts an order',
        [TwinEventType.DRIVER_ORDER_CANCELLED]: 'Emitted when driver cancels an order',
        [TwinEventType.DRIVER_VEHICLE_ASSIGNED]: 'Emitted when vehicle is assigned to driver',
        [TwinEventType.DRIVER_VEHICLE_UNASSIGNED]: 'Emitted when vehicle is unassigned from driver',
        [TwinEventType.DRIVER_FLEET_ASSIGNED]: 'Emitted when driver is assigned to a fleet',
        [TwinEventType.TWIN_ERROR]: 'Emitted when a twin error occurs',
        [TwinEventType.TWIN_SYNC]: 'Emitted during twin synchronization',
      },
    },
  });
});

/**
 * GET /api/events/stream
 * SSE endpoint for real-time event streaming
 */
router.get('/stream', (req: AuthRequest, res: Response) => {
  const eventEmitter = getEventEmitter();
  const { event_type } = req.query;

  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);

  // Subscribe to events
  const handler = (event: TwinEvent) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  if (event_type && Object.values(TwinEventType).includes(event_type as TwinEventType)) {
    eventEmitter.on(event_type as TwinEventType, handler);
  } else {
    eventEmitter.onAny(handler);
  }

  // Keep connection alive with heartbeat
  const heartbeat = setInterval(() => {
    res.write(`:heartbeat\n\n`);
  }, 30000);

  // Clean up on disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
    if (event_type) {
      eventEmitter.off(event_type as TwinEventType, handler);
    } else {
      eventEmitter.off('*' as any, handler);
    }
  });
});

/**
 * POST /api/events/test
 * Emit a test event (internal use only)
 */
router.post('/test', async (req: AuthRequest, res: Response) => {
  try {
    const eventEmitter = getEventEmitter();
    const { type, twin_id, data } = req.body;

    if (!type || !twin_id) {
      res.status(400).json({
        success: false,
        error: 'type and twin_id are required',
      });
      return;
    }

    const event = await eventEmitter.emit(type as TwinEventType, twin_id, 'driver', data || {});

    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error('[Event Routes] Error emitting test event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to emit test event',
    });
  }
});

export default router;
