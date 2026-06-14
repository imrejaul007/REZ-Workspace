import { Router, Request, Response } from 'express';
import { adDecisionService } from '../services/index.js';
import { vastGeneratorService } from '../services/index.js';
import { campaignService } from '../services/index.js';
import { asyncHandler, ValidationError } from '../middleware/index.js';
import { recordAdRequest, recordAdImpression } from '../middleware/metrics.middleware.js';

const router = Router();

/**
 * GET /api/vast/:placementId
 * Get VAST XML for CTV placement
 */
router.get('/:placementId', asyncHandler(async (req: Request, res: Response) => {
  const { placementId } = req.params;
  const {
    deviceType = 'smarttv',
    deviceId,
    appId,
    geo,
    contentCategory,
    videoDuration,
    skipOffset,
    podPosition,
    maxAds,
    format,
  } = req.query;

  // Validate placementId
  if (!placementId) {
    throw new ValidationError('Placement ID is required');
  }

  // Record ad request metric
  recordAdRequest(placementId, deviceType as string, format as string || 'preroll');

  // Make ad decision
  const decision = await adDecisionService.makeDecision({
    placementId,
    deviceType: deviceType as string,
    deviceId: deviceId as string | undefined,
    appId: appId as string | undefined,
    geo: geo as string | undefined,
    contentCategory: contentCategory as string | undefined,
    videoDuration: videoDuration ? parseInt(videoDuration as string, 10) : undefined,
    skipOffset: skipOffset ? parseInt(skipOffset as string, 10) : undefined,
    podPosition: podPosition ? parseInt(podPosition as string, 10) : undefined,
    maxAds: maxAds ? parseInt(maxAds as string, 10) : undefined,
  });

  // Record metrics
  if (decision.campaignId) {
    recordAdImpression(decision.campaignId, format as string || 'preroll');
  }

  // Return VAST XML
  res.set('Content-Type', 'application/xml');
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Accept');

  res.send(decision.vastXml);
}));

/**
 * GET /api/vast/:placementId/pod
 * Get VAST XML for CTV pod (multiple ads)
 */
router.get('/:placementId/pod', asyncHandler(async (req: Request, res: Response) => {
  const { placementId } = req.params;
  const {
    deviceType = 'smarttv',
    deviceId,
    appId,
    geo,
    contentCategory,
    videoDuration,
    skipOffset,
    maxAds,
  } = req.query;

  // Validate placementId
  if (!placementId) {
    throw new ValidationError('Placement ID is required');
  }

  // Record ad request metric
  recordAdRequest(placementId, deviceType as string, 'pod');

  // Make pod decision
  const decision = await adDecisionService.makePodDecision({
    placementId,
    deviceType: deviceType as string,
    deviceId: deviceId as string | undefined,
    appId: appId as string | undefined,
    geo: geo as string | undefined,
    contentCategory: contentCategory as string | undefined,
    videoDuration: videoDuration ? parseInt(videoDuration as string, 10) : undefined,
    skipOffset: skipOffset ? parseInt(skipOffset as string, 10) : undefined,
    maxAds: maxAds ? parseInt(maxAds as string, 10) : 3,
  });

  // Record metrics
  decision.creatives.forEach((creative) => {
    if (decision.campaignId) {
      recordAdImpression(decision.campaignId, 'pod');
    }
  });

  // Return VAST XML
  res.set('Content-Type', 'application/xml');
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Accept');

  res.send(decision.vastXml);
}));

/**
 * OPTIONS /api/vast/:placementId
 * CORS preflight
 */
router.options('/:placementId', (_req: Request, res: Response) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.sendStatus(200);
});

export default router;