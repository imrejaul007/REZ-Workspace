import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { recordHeartbeat, getActivePlayerSessions, getTotalActiveViewers } from '../services/heartbeatService.js';
import { streamingMetrics } from '../middleware/metrics.js';
import { optionalAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// Validation schemas
const HeartbeatSchema = z.object({
  deviceId: z.string(),
  contentId: z.string(),
  position: z.number(),
  quality: z.string(),
  timestamp: z.string().datetime(),
});

// POST /api/heartbeat - Player heartbeat
router.post(
  '/',
  optionalAuth,
  validateBody(HeartbeatSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const heartbeat = req.body;

    const result = await recordHeartbeat(heartbeat);

    if (!result.recorded) {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to record heartbeat',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Track heartbeat metrics
    streamingMetrics.heartbeatRate.inc();

    res.json({
      success: true,
      data: {
        recorded: true,
        sessionId: result.sessionId,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

// GET /api/heartbeat/active - Get active player sessions
router.get(
  '/active',
  asyncHandler(async (_req: Request, res: Response) => {
    const sessions = await getActivePlayerSessions();
    const totalViewers = await getTotalActiveViewers();

    res.json({
      success: true,
      data: {
        sessions,
        totalViewers,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

// GET /api/heartbeat/active/:contentId - Get active sessions for content
router.get(
  '/active/:contentId',
  asyncHandler(async (req: Request, res: Response) => {
    const { contentId } = req.params;

    const sessions = await getActivePlayerSessions(contentId);

    res.json({
      success: true,
      data: {
        sessions,
        count: sessions.length,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
