import { Router, Request, Response } from 'express';
import { adDecisionService } from '../services/index.js';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/index.js';
import { recordAdEvent } from '../middleware/metrics.middleware.js';

const router = Router();

// Valid event types
const VALID_EVENT_TYPES = [
  'impression',
  'view',
  'click',
  'skip',
  'complete',
  'firstQuartile',
  'midpoint',
  'thirdQuartile',
  'error',
] as const;

/**
 * POST /api/track/:eventType
 * Track ad events
 */
router.post('/:eventType', asyncHandler(async (req: Request, res: Response) => {
  const { eventType } = req.params;
  const { campaignId, creativeId, placementId, deviceId, deviceType, geo, podPosition, skipOffset } = req.body;

  // Validate event type
  if (!VALID_EVENT_TYPES.includes(eventType as typeof VALID_EVENT_TYPES[number])) {
    throw new ValidationError(`Invalid event type. Valid types: ${VALID_EVENT_TYPES.join(', ')}`);
  }

  // Validate required fields
  if (!campaignId) {
    throw new ValidationError('campaignId is required');
  }
  if (!creativeId) {
    throw new ValidationError('creativeId is required');
  }
  if (!deviceType) {
    throw new ValidationError('deviceType is required');
  }

  // Track the event
  await adDecisionService.trackEvent(eventType, campaignId, creativeId, {
    deviceId,
    deviceType,
    placementId,
    geo,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
    podPosition,
    skipOffset,
  });

  // Record metric
  recordAdEvent(eventType, campaignId);

  res.json({
    success: true,
    message: 'Event tracked',
    timestamp: new Date().toISOString(),
  });
}));

/**
 * GET /api/track/:campaignId/:creativeId/:eventName
 * VAST tracking pixel (1x1 transparent gif)
 */
router.get('/:campaignId/:creativeId/:eventName', asyncHandler(async (req: Request, res: Response) => {
  const { campaignId, creativeId, eventName } = req.params;
  const { deviceId, deviceType, geo, podPosition, skipOffset } = req.query;

  // Validate event name
  const validEvents = ['impression', 'start', 'firstQuartile', 'midpoint', 'thirdQuartile', 'complete', 'click', 'skip', 'pause', 'resume', 'mute', 'unmute', 'fullscreen', 'rewind', 'icon'];
  if (!validEvents.includes(eventName)) {
    // Return 1x1 transparent gif for unknown events
    res.set('Content-Type', 'image/gif');
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
    return;
  }

  // Track the event
  try {
    await adDecisionService.trackEvent(eventName, campaignId, creativeId, {
      deviceId: deviceId as string | undefined,
      deviceType: (deviceType as string) || 'unknown',
      geo: geo as string | undefined,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      podPosition: podPosition ? parseInt(podPosition as string, 10) : undefined,
      skipOffset: skipOffset ? parseInt(skipOffset as string, 10) : undefined,
    });
  } catch (error) {
    // Don't fail tracking - just log
    logger.error('Tracking error:', error);
  }

  // Record metric
  recordAdEvent(eventName, campaignId);

  // Return 1x1 transparent gif
  res.set('Content-Type', 'image/gif');
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
}));

/**
 * GET /api/track/error
 * Track errors
 */
router.get('/error', asyncHandler(async (req: Request, res: Response) => {
  const { reason, campaignId, creativeId } = req.query;

  if (campaignId && creativeId) {
    await adDecisionService.trackEvent('error', campaignId as string, creativeId as string, {
      deviceType: 'unknown',
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    });

    recordAdEvent('error', campaignId as string);
  }

  // Return 1x1 transparent gif
  res.set('Content-Type', 'image/gif');
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
}));

export default router;