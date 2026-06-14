/**
 * Campaign Routes
 */

import { Router, Response } from 'express';
import { campaignService } from '../services';
import { verifyAuth, AuthenticatedRequest, asyncHandler, AppError } from '../middleware';
import { validateBody } from '../middleware';
import { campaignCreateSchema, campaignUpdateSchema, campaignMatchSchema } from '../utils/validation';
import logger from 'utils/logger.js';

const router = Router();

/**
 * GET /api/campaigns
 * List campaigns
 */
router.get('/',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { page, limit, brandId, status, minBudget, maxBudget } = req.query as any;
    const result = await campaignService.listCampaigns({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      brandId,
      status,
      minBudget: minBudget ? parseInt(minBudget) : undefined,
      maxBudget: maxBudget ? parseInt(maxBudget) : undefined
    });

    res.json({
      success: true,
      data: result.campaigns,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: result.pages
      }
    });
  })
);

/**
 * POST /api/campaigns
 * Create campaign
 */
router.post('/',
  verifyAuth,
  validateBody(campaignCreateSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const campaign = await campaignService.createCampaign(req.body);
    res.status(201).json({
      success: true,
      data: campaign
    });
  })
);

/**
 * GET /api/campaigns/:id
 * Get campaign by ID
 */
router.get('/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const campaign = await campaignService.getCampaignById(req.params.id);
    if (!campaign) {
      throw new AppError('Campaign not found', 404);
    }
    res.json({
      success: true,
      data: campaign
    });
  })
);

/**
 * PATCH /api/campaigns/:id
 * Update campaign
 */
router.patch('/:id',
  verifyAuth,
  validateBody(campaignUpdateSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const campaign = await campaignService.getCampaignById(req.params.id);
    if (!campaign) {
      throw new AppError('Campaign not found', 404);
    }

    const updatedCampaign = await campaignService.updateCampaign(req.params.id, req.body);
    res.json({
      success: true,
      data: updatedCampaign
    });
  })
);

/**
 * GET /api/campaigns/:id/stats
 * Get campaign statistics
 */
router.get('/:id/stats',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const stats = await campaignService.getCampaignStats(req.params.id);
    if (!stats) {
      throw new AppError('Campaign not found', 404);
    }
    res.json({
      success: true,
      data: stats
    });
  })
);

/**
 * POST /api/campaigns/:id/match
 * Match influencers to campaign
 */
router.post('/:id/match',
  verifyAuth,
  validateBody(campaignMatchSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const campaign = await campaignService.getCampaignById(req.params.id);
    if (!campaign) {
      throw new AppError('Campaign not found', 404);
    }

    const matches = await campaignService.matchInfluencers(req.params.id, req.body);
    res.json({
      success: true,
      data: matches
    });
  })
);

/**
 * GET /api/campaigns/brand/:brandId
 * Get campaigns by brand ID
 */
router.get('/brand/:brandId',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const campaigns = await campaignService.getCampaignsByBrandId(req.params.brandId);
    res.json({
      success: true,
      data: campaigns
    });
  })
);

export default router;