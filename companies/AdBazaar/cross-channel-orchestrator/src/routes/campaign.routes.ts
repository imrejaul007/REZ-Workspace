import { Router, Request, Response } from 'express';
import { campaignService } from '../services/campaign.service';
import { channelDispatcher } from '../services/channel-dispatcher.service';
import { metricsService } from '../services/metrics.service';
import { authenticate, asyncHandler, APIError } from '../middleware';
import { CreateCampaignSchema, UpdateCampaignSchema, ChannelInfo, Channel } from '../types';
import { logger } from '../services/logger.service';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * POST /api/campaigns
 * Create a new cross-channel campaign
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const advertiserId = req.advertiserId!;

    // Validate request body
    const validationResult = CreateCampaignSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw APIError.badRequest('Invalid campaign data', validationResult.error.errors);
    }

    // Create campaign
    const campaign = await campaignService.createCampaign(advertiserId, validationResult.data);

    // Record metrics
    metricsService.recordCampaignCreated(advertiserId, validationResult.data.objective, validationResult.data.channels);

    logger.info('Campaign created via API', { campaignId: campaign.campaignId, advertiserId });

    res.status(201).json({
      success: true,
      data: {
        campaignId: campaign.campaignId,
        name: campaign.name,
        status: campaign.status,
        channels: campaign.channels,
        budget: campaign.budget,
        createdAt: campaign.createdAt,
      },
    });
  })
);

/**
 * GET /api/campaigns
 * List campaigns for the authenticated advertiser
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const advertiserId = req.advertiserId!;
    const status = req.query.status as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const result = await campaignService.listCampaigns(advertiserId, {
      status: status as 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | undefined,
      page,
      limit,
    });

    res.json({
      success: true,
      data: result.campaigns,
      meta: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  })
);

/**
 * GET /api/campaigns/:id
 * Get campaign details by ID
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const advertiserId = req.advertiserId!;

    const campaign = await campaignService.getCampaign(id, advertiserId);
    if (!campaign) {
      throw APIError.notFound('Campaign not found');
    }

    res.json({
      success: true,
      data: campaign,
    });
  })
);

/**
 * PUT /api/campaigns/:id
 * Update campaign
 */
router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const advertiserId = req.advertiserId!;

    // Validate request body
    const validationResult = UpdateCampaignSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw APIError.badRequest('Invalid update data', validationResult.error.errors);
    }

    const campaign = await campaignService.updateCampaign(id, advertiserId, validationResult.data);
    if (!campaign) {
      throw APIError.notFound('Campaign not found');
    }

    logger.info('Campaign updated via API', { campaignId: id, advertiserId });

    res.json({
      success: true,
      data: campaign,
    });
  })
);

/**
 * POST /api/campaigns/:id/launch
 * Launch campaign
 */
router.post(
  '/:id/launch',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const advertiserId = req.advertiserId!;

    const campaign = await campaignService.launchCampaign(id, advertiserId);
    if (!campaign) {
      throw APIError.notFound('Campaign not found');
    }

    metricsService.recordCampaignLaunched(advertiserId, campaign.objective, campaign.status);

    logger.info('Campaign launched via API', { campaignId: id, advertiserId, status: campaign.status });

    res.json({
      success: true,
      data: {
        campaignId: campaign.campaignId,
        status: campaign.status,
        launchedAt: campaign.launchedAt,
      },
    });
  })
);

/**
 * POST /api/campaigns/:id/pause
 * Pause active campaign
 */
router.post(
  '/:id/pause',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const advertiserId = req.advertiserId!;

    const campaign = await campaignService.pauseCampaign(id, advertiserId);
    if (!campaign) {
      throw APIError.notFound('Campaign not found');
    }

    metricsService.recordStatusChange('active', 'paused');

    logger.info('Campaign paused via API', { campaignId: id, advertiserId });

    res.json({
      success: true,
      data: {
        campaignId: campaign.campaignId,
        status: campaign.status,
        pausedAt: campaign.pausedAt,
      },
    });
  })
);

/**
 * POST /api/campaigns/:id/resume
 * Resume paused campaign
 */
router.post(
  '/:id/resume',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const advertiserId = req.advertiserId!;

    const campaign = await campaignService.resumeCampaign(id, advertiserId);
    if (!campaign) {
      throw APIError.notFound('Campaign not found');
    }

    metricsService.recordStatusChange('paused', 'active');

    logger.info('Campaign resumed via API', { campaignId: id, advertiserId });

    res.json({
      success: true,
      data: {
        campaignId: campaign.campaignId,
        status: campaign.status,
      },
    });
  })
);

/**
 * GET /api/campaigns/:id/stats
 * Get campaign statistics
 */
router.get(
  '/:id/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const advertiserId = req.advertiserId;

    const stats = await campaignService.getCampaignStatistics(id, advertiserId);
    if (!stats) {
      throw APIError.notFound('Campaign not found');
    }

    res.json({
      success: true,
      data: stats,
    });
  })
);

/**
 * DELETE /api/campaigns/:id
 * Delete campaign (only draft campaigns)
 */
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const advertiserId = req.advertiserId!;

    const campaign = await campaignService.getCampaign(id, advertiserId);
    if (!campaign) {
      throw APIError.notFound('Campaign not found');
    }

    if (campaign.status !== 'draft') {
      throw APIError.badRequest('Only draft campaigns can be deleted');
    }

    await campaign.deleteOne();

    logger.info('Campaign deleted via API', { campaignId: id, advertiserId });

    res.json({
      success: true,
      data: { deleted: true, campaignId: id },
    });
  })
);

export default router;