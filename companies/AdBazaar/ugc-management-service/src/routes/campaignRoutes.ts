import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { campaignService } from '../services';
import { logger } from '../config/logger';

const router = Router();

// Validation schemas
const createCampaignSchema = z.object({
  name: z.string().min(1).max(200),
  brandId: z.string().min(1),
  hashtags: z.array(z.string()).min(1),
  mentions: z.array(z.string()).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  autoModeration: z.boolean().optional(),
  approvalRequired: z.boolean().optional(),
  moderationRules: z.object({
    minFollowers: z.number().optional(),
    maxFollowers: z.number().optional(),
    excludeHashtags: z.array(z.string()).optional(),
    requireHashtags: z.array(z.string()).optional(),
    sentimentThreshold: z.number().optional(),
    excludeAccounts: z.array(z.string()).optional()
  }).optional(),
  displaySettings: z.object({
    autoDisplay: z.boolean().optional(),
    displayDuration: z.number().optional(),
    rotationSpeed: z.number().optional()
  }).optional()
});

const updateCampaignSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  hashtags: z.array(z.string()).optional(),
  mentions: z.array(z.string()).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  autoModeration: z.boolean().optional(),
  approvalRequired: z.boolean().optional(),
  moderationRules: z.object({
    minFollowers: z.number().optional(),
    maxFollowers: z.number().optional(),
    excludeHashtags: z.array(z.string()).optional(),
    requireHashtags: z.array(z.string()).optional(),
    sentimentThreshold: z.number().optional(),
    excludeAccounts: z.array(z.string()).optional()
  }).optional(),
  displaySettings: z.object({
    autoDisplay: z.boolean().optional(),
    displayDuration: z.number().optional(),
    rotationSpeed: z.number().optional()
  }).optional()
});

// Middleware for async error handling
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * @route GET /api/ugc/campaigns
 * @desc List campaigns
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const brandId = req.query.brandId as string;
  const status = req.query.status as any;
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;

  const result = await campaignService.listCampaigns({
    brandId,
    status,
    limit,
    offset
  });

  res.json({
    success: true,
    data: result
  });
}));

/**
 * @route POST /api/ugc/campaigns
 * @desc Create campaign
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const input = createCampaignSchema.parse(req.body);

  logger.info('Campaign creation requested', { name: input.name, brandId: input.brandId });

  const campaign = await campaignService.createCampaign({
    ...input,
    startDate: new Date(input.startDate),
    endDate: new Date(input.endDate)
  });

  res.status(201).json({
    success: true,
    data: campaign
  });
}));

/**
 * @route GET /api/ugc/campaigns/:id
 * @desc Get campaign by ID
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const campaign = await campaignService.getCampaign(req.params.id);

  if (!campaign) {
    res.status(404).json({ success: false, error: 'Campaign not found' });
    return;
  }

  res.json({
    success: true,
    data: campaign
  });
}));

/**
 * @route PATCH /api/ugc/campaigns/:id
 * @desc Update campaign
 */
router.patch('/:id', asyncHandler(async (req: Request, res: Response) => {
  const updateData = updateCampaignSchema.parse(req.body);

  logger.info('Campaign update requested', { campaignId: req.params.id });

  // Convert date strings to Date objects
  if (updateData.startDate) {
    updateData.startDate = new Date(updateData.startDate);
  }
  if (updateData.endDate) {
    updateData.endDate = new Date(updateData.endDate);
  }

  const campaign = await campaignService.updateCampaign(req.params.id, updateData);

  res.json({
    success: true,
    data: campaign
  });
}));

/**
 * @route GET /api/ugc/campaigns/:id/stats
 * @desc Get campaign stats
 */
router.get('/:id/stats', asyncHandler(async (req: Request, res: Response) => {
  const stats = await campaignService.getCampaignStats(req.params.id);

  res.json({
    success: true,
    data: stats
  });
}));

/**
 * @route POST /api/ugc/campaigns/:id/pause
 * @desc Pause campaign
 */
router.post('/:id/pause', asyncHandler(async (req: Request, res: Response) => {
  logger.info('Campaign pause requested', { campaignId: req.params.id });

  const campaign = await campaignService.pauseCampaign(req.params.id);

  res.json({
    success: true,
    data: campaign,
    message: 'Campaign paused successfully'
  });
}));

/**
 * @route POST /api/ugc/campaigns/:id/resume
 * @desc Resume campaign
 */
router.post('/:id/resume', asyncHandler(async (req: Request, res: Response) => {
  logger.info('Campaign resume requested', { campaignId: req.params.id });

  const campaign = await campaignService.resumeCampaign(req.params.id);

  res.json({
    success: true,
    data: campaign,
    message: 'Campaign resumed successfully'
  });
}));

/**
 * @route POST /api/ugc/campaigns/:id/complete
 * @desc Complete campaign
 */
router.post('/:id/complete', asyncHandler(async (req: Request, res: Response) => {
  logger.info('Campaign complete requested', { campaignId: req.params.id });

  const campaign = await campaignService.completeCampaign(req.params.id);

  res.json({
    success: true,
    data: campaign,
    message: 'Campaign completed successfully'
  });
}));

/**
 * @route DELETE /api/ugc/campaigns/:id
 * @desc Delete campaign
 */
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  logger.info('Campaign delete requested', { campaignId: req.params.id });

  await campaignService.deleteCampaign(req.params.id);

  res.json({
    success: true,
    message: 'Campaign deleted successfully'
  });
}));

/**
 * @route POST /api/ugc/campaigns/:id/auto-moderate
 * @desc Run auto-moderation on campaign
 */
router.post('/:id/auto-moderate', asyncHandler(async (req: Request, res: Response) => {
  const { moderationService } = await import('../services');

  logger.info('Auto-moderation requested', { campaignId: req.params.id });

  const result = await moderationService.autoModerate(req.params.id);

  res.json({
    success: true,
    data: result
  });
}));

export default router;