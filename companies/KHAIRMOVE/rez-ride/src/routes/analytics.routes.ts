import { logger } from '../../shared/logger';
import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limit analytics endpoint
const analyticsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 events per minute
  message: { error: 'Too many analytics events' },
});

/**
 * @route POST /api/analytics/batch
 * @desc Receive batch analytics events
 */
router.post('/batch', analyticsLimiter, async (req: Request, res: Response) => {
  try {
    const { events } = req.body;

    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: 'Invalid events array' });
    }

    // Process events (in production, send to analytics service)
    const processed = events.map((event: any) => ({
      ...event,
      receivedAt: new Date().toISOString(),
      serverTimestamp: Date.now(),
    }));

    // Log for development
    if (process.env.NODE_ENV !== 'production') {
      logger.info('[Analytics Batch]', processed.length, 'events received');
      processed.forEach((e: any) => {
        logger.info(`  - ${e.event}:`, e.properties);
      });
    }

    // In production: forward to analytics service (Segment, Amplitude, etc.)
    // await forwardToAnalyticsService(processed);

    res.json({ success: true, processed: processed.length });
  } catch (error) {
    logger.error('Analytics batch error:', error);
    res.status(500).json({ error: 'Failed to process analytics' });
  }
});

/**
 * @route POST /api/analytics/track
 * @desc Single event tracking
 */
router.post('/track', async (req: Request, res: Response) => {
  try {
    const { event, properties, userId } = req.body;

    if (!event) {
      return res.status(400).json({ error: 'Event name required' });
    }

    const analyticsEvent = {
      event,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        userId,
      },
      receivedAt: new Date().toISOString(),
    };

    // Log for development
    if (process.env.NODE_ENV !== 'production') {
      logger.info('[Analytics Track]', event, properties);
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Analytics track error:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
});

export default router;
