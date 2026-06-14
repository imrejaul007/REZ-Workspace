import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { collectPlaybackEvents, getPlaybackMetrics, getContentAnalytics } from '../services/analyticsService.js';
import { streamingMetrics } from '../middleware/metrics.js';
import { optionalAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// Validation schemas
const AnalyticsEventSchema = z.object({
  events: z.array(z.object({
    eventId: z.string().optional(),
    contentId: z.string(),
    deviceId: z.string(),
    eventType: z.enum(['play', 'pause', 'seek', 'buffer', 'complete', 'error']),
    timestamp: z.string(),
    metadata: z.object({
      position: z.number(),
      quality: z.string(),
      bitrate: z.number(),
      bufferDuration: z.number().optional(),
    }),
  })).min(1).max(100),
});

const MetricsQuerySchema = z.object({
  contentId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// POST /api/analytics - Collect playback events
router.post(
  '/',
  optionalAuth,
  validateBody(AnalyticsEventSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { events } = req.body;

    const result = await collectPlaybackEvents(events, req.appId);

    // Track event metrics
    for (const event of events) {
      streamingMetrics.totalEvents.inc({ event_type: event.eventType });
    }

    res.json({
      success: true,
      data: {
        collected: result.collected,
        failed: result.failed,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

// GET /api/analytics/metrics - Get playback metrics
router.get(
  '/metrics',
  validateQuery(MetricsQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { contentId, startDate, endDate } = req.query as {
      contentId?: string;
      startDate?: string;
      endDate?: string;
    };

    const metrics = await getPlaybackMetrics(
      contentId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString(),
    });
  })
);

// GET /api/analytics/content/:contentId - Get content-specific analytics
router.get(
  '/content/:contentId',
  asyncHandler(async (req: Request, res: Response) => {
    const { contentId } = req.params;

    const analytics = await getContentAnalytics(contentId);

    res.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
