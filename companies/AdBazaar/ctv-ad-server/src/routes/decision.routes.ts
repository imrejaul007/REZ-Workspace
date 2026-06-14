import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { adDecisionService } from '../services/index.js';
import { asyncHandler, ValidationError } from '../middleware/index.js';
import { recordAdRequest, recordAdImpression, recordAdRevenue } from '../middleware/metrics.middleware.js';

const router = Router();

// Validation schema for decision request
const DecisionRequestSchema = z.object({
  placementId: z.string().min(1),
  deviceType: z.string().optional().default('smarttv'),
  deviceId: z.string().optional(),
  appId: z.string().optional(),
  geo: z.string().optional(),
  contentCategory: z.string().optional(),
  videoDuration: z.number().optional(),
  userAgent: z.string().optional(),
  ip: z.string().optional(),
  timestamp: z.number().optional(),
  skipOffset: z.number().optional(),
  podPosition: z.number().optional(),
  maxAds: z.number().optional(),
});

/**
 * POST /api/decision
 * Real-time ad decision request
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  // Validate request body
  const parseResult = DecisionRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    throw new ValidationError(parseResult.error.errors[0].message);
  }

  const request = parseResult.data;

  // Record ad request metric
  recordAdRequest(request.placementId, request.deviceType, 'preroll');

  // Make ad decision
  const decision = await adDecisionService.makeDecision(request);

  // Record metrics
  if (decision.campaignId) {
    recordAdImpression(decision.campaignId, 'preroll');
    recordAdRevenue(decision.campaignId, 'cpm', decision.revenue);
  }

  res.json({
    success: true,
    data: {
      requestId: decision.requestId,
      vastXml: decision.vastXml,
      campaignId: decision.campaignId,
      impressions: decision.impressions,
      revenue: decision.revenue,
      creatives: decision.creatives.map((c) => ({
        creativeId: c.creativeId,
        name: c.name,
        duration: c.duration,
      })),
    },
    timestamp: new Date().toISOString(),
  });
}));

/**
 * POST /api/decision/pod
 * Pod ad decision request
 */
router.post('/pod', asyncHandler(async (req: Request, res: Response) => {
  // Validate request body
  const parseResult = DecisionRequestSchema.extend({
    maxAds: z.number().min(1).max(10).default(3),
  }).safeParse(req.body);

  if (!parseResult.success) {
    throw new ValidationError(parseResult.error.errors[0].message);
  }

  const request = parseResult.data;

  // Record ad request metric
  recordAdRequest(request.placementId, request.deviceType, 'pod');

  // Make pod decision
  const decision = await adDecisionService.makePodDecision(request);

  // Record metrics
  decision.creatives.forEach((creative) => {
    if (decision.campaignId) {
      recordAdImpression(decision.campaignId, 'pod');
      recordAdRevenue(decision.campaignId, 'cpm', decision.revenue / decision.creatives.length);
    }
  });

  res.json({
    success: true,
    data: {
      requestId: decision.requestId,
      vastXml: decision.vastXml,
      campaignId: decision.campaignId,
      impressions: decision.impressions,
      revenue: decision.revenue,
      creatives: decision.creatives.map((c) => ({
        creativeId: c.creativeId,
        name: c.name,
        duration: c.duration,
      })),
    },
    timestamp: new Date().toISOString(),
  });
}));

export default router;