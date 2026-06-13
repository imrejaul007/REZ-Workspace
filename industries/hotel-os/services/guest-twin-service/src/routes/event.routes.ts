import { Router, Response } from 'express';
import { getEventEmitter, TwinEventType } from '../events/index.js';
import { apiKeyAuth, AuthRequest } from '../middleware/index.js';

const router = Router();

router.use(apiKeyAuth);

/**
 * GET /api/events/subscriptions
 * Get available event types
 */
router.get('/subscriptions', (req: AuthRequest, res: Response) => {
  const events = Object.values(TwinEventType);
  res.json({
    success: true,
    data: {
      events,
      description: 'Available event types for subscription',
    },
  });
});

/**
 * POST /api/events/publish
 * Publish a custom event (for testing or internal use)
 */
router.post('/publish', async (req: AuthRequest, res: Response) => {
  try {
    const { type, twin_id, twin_type, data, metadata } = req.body;

    if (!type || !twin_id || !twin_type) {
      res.status(400).json({
        success: false,
        error: 'type, twin_id, and twin_type are required',
      });
      return;
    }

    const emitter = getEventEmitter();
    const event = await emitter.emit(
      type as TwinEventType,
      twin_id,
      twin_type as 'guest' | 'room' | 'property',
      data || {},
      metadata
    );

    res.json({
      success: true,
      event,
    });
  } catch (error: any) {
    console.error('[Event Routes] Error publishing event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to publish event',
    });
  }
});

export default router;