import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { viewabilityService } from '../services/viewability.service';
import { videoService } from '../services/video.service';
import { analyticsService } from '../services/analytics.service';
import { createLogger } from '../utils/logger';

const router = Router();
const logger = createLogger('TrackingRoutes');

// Validation schemas
const TrackImpressionSchema = z.object({
  adId: z.string(),
  placementId: z.string().optional(),
  campaignId: z.string().optional(),
  sessionId: z.string().uuid(),
  userId: z.string().optional(),
  timestamp: z.string().datetime().optional(),
  metadata: z.object({
    width: z.number(),
    height: z.number(),
    position: z.enum(['above', 'below', 'unknown']).optional(),
    format: z.enum(['display', 'video', 'native', 'rich_media']).optional(),
  }).optional(),
});

const TrackViewEventSchema = z.object({
  adId: z.string(),
  impressionId: z.string().uuid().optional(),
  sessionId: z.string().uuid(),
  eventType: z.enum(['enter_viewport', 'exit_viewport', '50_percent_viewable', '100_percent_viewable', 'background', 'foreground']),
  timestamp: z.string().datetime().optional(),
  viewportInfo: z.object({
    visibleArea: z.number(),
    timeInView: z.number(),
    percentVisible: z.number(),
    isVisible: z.boolean(),
  }).optional(),
});

const TrackVideoEventSchema = z.object({
  adId: z.string(),
  impressionId: z.string().uuid().optional(),
  sessionId: z.string().uuid(),
  eventType: z.enum(['start', 'firstQuartile', 'midpoint', 'thirdQuartile', 'complete', 'pause', 'resume', 'mute', 'unmute', 'fullscreen', 'exitFullscreen']),
  timestamp: z.string().datetime().optional(),
  videoInfo: z.object({
    currentTime: z.number(),
    duration: z.number(),
    volume: z.number(),
    isMuted: z.boolean(),
    isFullscreen: z.boolean(),
  }).optional(),
});

// Track impression
router.post('/impression', (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = TrackImpressionSchema.parse(req.body);

    const impression = viewabilityService.createImpression({
      adId: data.adId,
      placementId: data.placementId,
      campaignId: data.campaignId,
      sessionId: data.sessionId,
      userId: data.userId,
      timestamp: data.timestamp ? new Date(data.timestamp) : undefined,
      metadata: data.metadata,
    });

    res.status(201).json({
      success: true,
      data: {
        impressionId: impression.id,
        adId: impression.adId,
        sessionId: impression.sessionId,
        timestamp: impression.timestamp,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
        timestamp: new Date().toISOString(),
      });
      return;
    }
    next(error);
  }
});

// Track view event
router.post('/view', (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = TrackViewEventSchema.parse(req.body);

    if (!data.impressionId) {
      // Try to find impression by adId and sessionId
      const impressions = viewabilityService.getImpressionsByAd(data.adId);
      const existing = impressions.find(i => i.sessionId === data.sessionId);

      if (!existing) {
        // Create impression first
        const impression = viewabilityService.createImpression({
          adId: data.adId,
          sessionId: data.sessionId,
        });
        data.impressionId = impression.id;
      } else {
        data.impressionId = existing.id;
      }
    }

    const event = viewabilityService.recordViewEvent({
      impressionId: data.impressionId,
      adId: data.adId,
      sessionId: data.sessionId,
      eventType: data.eventType,
      timestamp: data.timestamp ? new Date(data.timestamp) : undefined,
      viewportInfo: data.viewportInfo,
    });

    if (!event) {
      res.status(404).json({
        success: false,
        error: 'Impression not found',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.json({
      success: true,
      data: {
        eventId: event.id,
        impressionId: event.impressionId,
        viewable: viewabilityService.isViewable(event.impressionId),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
        timestamp: new Date().toISOString(),
      });
      return;
    }
    next(error);
  }
});

// Track video event
router.post('/video', (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = TrackVideoEventSchema.parse(req.body);

    if (!data.impressionId) {
      const impressions = viewabilityService.getImpressionsByAd(data.adId);
      const existing = impressions.find(i => i.sessionId === data.sessionId);

      if (!existing) {
        const impression = viewabilityService.createImpression({
          adId: data.adId,
          sessionId: data.sessionId,
        });
        data.impressionId = impression.id;
      } else {
        data.impressionId = existing.id;
      }
    }

    const event = videoService.recordEvent({
      impressionId: data.impressionId,
      adId: data.adId,
      sessionId: data.sessionId,
      eventType: data.eventType,
      timestamp: data.timestamp ? new Date(data.timestamp) : undefined,
      videoInfo: data.videoInfo,
    });

    res.status(201).json({
      success: true,
      data: {
        eventId: event.id,
        impressionId: event.impressionId,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
        timestamp: new Date().toISOString(),
      });
      return;
    }
    next(error);
  }
});

// Get impression
router.get('/impression/:impressionId', (req: Request, res: Response) => {
  const { impressionId } = req.params;

  const impression = viewabilityService.getImpression(impressionId);

  if (!impression) {
    res.status(404).json({
      success: false,
      error: 'Impression not found',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const viewEvents = viewabilityService.getViewEvents(impressionId);

  res.json({
    success: true,
    data: {
      ...impression,
      viewEvents,
      isViewable: viewabilityService.isViewable(impressionId),
    },
    timestamp: new Date().toISOString(),
  });
});

// Get viewability metrics
router.get('/metrics/:adId', (req: Request, res: Response) => {
  const { adId } = req.params;

  const metrics = viewabilityService.calculateViewabilityMetrics(adId);
  const videoMetrics = videoService.calculateVideoMetrics(adId);

  res.json({
    success: true,
    data: {
      viewability: metrics,
      video: videoMetrics,
    },
    timestamp: new Date().toISOString(),
  });
});

// Get viewability report
router.get('/report', (req: Request, res: Response) => {
  const { date, adId, campaignId, placementId } = req.query;

  const report = analyticsService.getViewabilityReport({
    date: date as string || new Date().toISOString().split('T')[0],
    adId: adId as string | undefined,
    campaignId: campaignId as string | undefined,
    placementId: placementId as string | undefined,
  });

  res.json({
    success: true,
    data: report,
    timestamp: new Date().toISOString(),
  });
});

// Get historical viewability
router.get('/history/:adId', (req: Request, res: Response) => {
  const { adId } = req.params;
  const { days } = req.query;

  const history = analyticsService.getHistoricalViewability(
    adId,
    days ? parseInt(days as string, 10) : 7
  );

  res.json({
    success: true,
    data: history,
    timestamp: new Date().toISOString(),
  });
});

// Compare viewability across ads
router.post('/compare', (req: Request, res: Response) => {
  const { adIds } = req.body;

  if (!Array.isArray(adIds) || adIds.length < 2) {
    res.status(400).json({
      success: false,
      error: 'Please provide at least 2 ad IDs to compare',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const comparison = analyticsService.compareViewability(adIds);

  res.json({
    success: true,
    data: comparison,
    timestamp: new Date().toISOString(),
  });
});

// Get service stats
router.get('/stats', (req: Request, res: Response) => {
  const viewStats = viewabilityService.getStats();
  const videoStats = videoService.getStats();

  res.json({
    success: true,
    data: {
      impressions: viewStats.impressions,
      viewEvents: viewStats.viewEvents,
      videoSessions: videoStats.sessions,
      videoEvents: videoStats.events,
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;
