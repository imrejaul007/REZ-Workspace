import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { requireInternalToken } from '../middleware/internalAuth';
import { campaignEngine } from '../services/campaignEngine';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const createCampaignSchema = z.object({
  type: z.enum(['consumer', 'merchant', 'creator']),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  sponsorId: z.string().optional(),
  sponsorType: z.enum(['merchant', 'brand']).optional(),
  budget: z.number().positive().optional(),
  referrerReward: z.object({
    type: z.enum(['fixed', 'percentage', 'coins', 'discount']),
    value: z.number().positive(),
    coinType: z.string().optional(),
  }),
  refereeReward: z.object({
    type: z.enum(['fixed', 'percentage', 'coins', 'discount']),
    value: z.number().positive(),
    coinType: z.string().optional(),
  }).optional(),
  targetSegments: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  companies: z.array(z.string()).optional(),
  maxRewards: z.number().positive().optional(),
  maxRewardsPerUser: z.number().positive().optional(),
  minPurchaseAmount: z.number().positive().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
});

/**
 * GET /
 * List active campaigns
 */
router.get('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const type = req.query.type as string;
    const companyId = (req.query.companyId as string) || 'rez';

    const campaigns = await campaignEngine.getActiveCampaigns({
      type: type as 'consumer' | 'merchant' | 'creator' | undefined,
      companyId,
    });

    return sendSuccess(res, {
      campaigns: campaigns.map((c) => ({
        id: c._id,
        name: c.name,
        description: c.description,
        type: c.type,
        sponsorType: c.sponsorType,
        referrerReward: c.referrerReward,
        refereeReward: c.refereeReward,
        startDate: c.startDate,
        endDate: c.endDate,
        isActive: c.isActive,
      })),
    });
  } catch (error) {
    logger.error('[CampaignRoutes] Error listing campaigns:', error);
    return sendError(res, 'INTERNAL_ERROR', 500);
  }
});

/**
 * GET /api/campaigns/:id
 * Get campaign detail
 */
router.get('/:id', optionalAuth, async (req: Request, res: Response) => {
  try {
    const campaignId = req.params.id;

    const campaign = await campaignEngine.getCampaign(campaignId);

    if (!campaign) {
      return sendError(res, 'REFERRAL_CAMPAIGN_NOT_FOUND', 404);
    }

    const stats = await campaignEngine.getCampaignStats(campaignId);

    return sendSuccess(res, {
      campaign: {
        id: campaign._id,
        name: campaign.name,
        description: campaign.description,
        type: campaign.type,
        sponsorId: campaign.sponsorId,
        sponsorType: campaign.sponsorType,
        budget: campaign.budget,
        spent: campaign.spent,
        referrerReward: campaign.referrerReward,
        refereeReward: campaign.refereeReward,
        targetSegments: campaign.targetSegments,
        categories: campaign.categories,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        isActive: campaign.isActive,
        isLive: campaign.isLive,
        stats,
      },
    });
  } catch (error) {
    logger.error('[CampaignRoutes] Error getting campaign:', error);
    return sendError(res, 'INTERNAL_ERROR', 500);
  }
});

/**
 * POST /api/campaigns
 * Create campaign (internal or merchant)
 */
router.post('', requireInternalToken, async (req: Request, res: Response) => {
  try {
    const validation = createCampaignSchema.safeParse(req.body);

    if (!validation.success) {
      return sendError(res, 'VALIDATION_ERROR', 400, validation.error.errors);
    }

    const data = validation.data;
    const companyId = (req.body.companyId as string) || 'rez';

    const campaign = await campaignEngine.createCampaign({
      ...data,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      companyId,
    });

    return sendSuccess(res, {
      campaign: {
        id: campaign._id,
        name: campaign.name,
        type: campaign.type,
        referrerReward: campaign.referrerReward,
        refereeReward: campaign.refereeReward,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        isActive: campaign.isActive,
      },
    }, 201);
  } catch (error) {
    logger.error('[CampaignRoutes] Error creating campaign:', error);
    return sendError(res, 'INTERNAL_ERROR', 500);
  }
});

/**
 * PATCH /api/campaigns/:id
 * Update campaign
 */
router.patch('/:id', requireInternalToken, async (req: Request, res: Response) => {
  try {
    const campaignId = req.params.id;

    const campaign = await campaignEngine.updateCampaign(campaignId, req.body);

    if (!campaign) {
      return sendError(res, 'REFERRAL_CAMPAIGN_NOT_FOUND', 404);
    }

    return sendSuccess(res, {
      campaign: {
        id: campaign._id,
        name: campaign.name,
        isActive: campaign.isActive,
        budget: campaign.budget,
        spent: campaign.spent,
      },
    });
  } catch (error) {
    logger.error('[CampaignRoutes] Error updating campaign:', error);
    return sendError(res, 'INTERNAL_ERROR', 500);
  }
});

/**
 * POST /api/campaigns/:id/enroll
 * Enroll as referrer in campaign
 */
router.post('/:id/enroll', requireAuth, async (req: Request, res: Response) => {
  try {
    const campaignId = req.params.id;
    const userId = req.userId!;

    const result = await campaignEngine.enrollInCampaign(campaignId, userId);

    if (!result.success) {
      return sendError(res, 'VALIDATION_ERROR', 400, result.error);
    }

    return sendSuccess(res, {
      enrolled: true,
      referralCode: result.referralCode,
    });
  } catch (error) {
    logger.error('[CampaignRoutes] Error enrolling:', error);
    return sendError(res, 'INTERNAL_ERROR', 500);
  }
});

/**
 * GET /api/campaigns/:id/referrers
 * List referrers in campaign
 */
router.get('/:id/referrers', requireInternalToken, async (req: Request, res: Response) => {
  try {
    const campaignId = req.params.id;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = parseInt(req.query.skip as string) || 0;

    const referrers = await campaignEngine.getCampaignReferrers(campaignId, { limit, skip });

    return sendSuccess(res, {
      referrers,
      pagination: { limit, skip, total: referrers.length },
    });
  } catch (error) {
    logger.error('[CampaignRoutes] Error listing referrers:', error);
    return sendError(res, 'INTERNAL_ERROR', 500);
  }
});

export default router;
