import { Router, Request, Response } from 'express';
import { campaignService } from '../services/index.js';
import {
  authMiddleware,
  validateBody,
  validateQuery,
  asyncHandler,
} from '../middleware/index.js';
import {
  CreateCampaignSchema,
  UpdateCampaignSchema,
  CreateCampaignRequest,
  UpdateCampaignRequest,
  JwtPayload,
} from '../types/index.js';
import { z } from 'zod';

const router = Router();

// Get campaigns with pagination and filters
router.get(
  '/',
  authMiddleware,
  validateQuery(
    z.object({
      page: z.string().transform(Number).optional(),
      limit: z.string().transform(Number).optional(),
      status: z.enum(['active', 'paused', 'completed']).optional(),
      type: z.enum(['sponsored_products', 'display', 'video', 'search']).optional(),
    })
  ),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as Request & { user: JwtPayload }).user;
    const { page, limit, status, type } = req.query as {
      page?: number;
      limit?: number;
      status?: 'active' | 'paused' | 'completed';
      type?: 'sponsored_products' | 'display' | 'video' | 'search';
    };

    const result = await campaignService.getCampaigns(user.merchantId, {
      page,
      limit,
      status,
      type,
    });

    res.json({
      success: true,
      data: result.campaigns,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  })
);

// Create a new campaign
router.post(
  '/',
  authMiddleware,
  validateBody(CreateCampaignSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as Request & { user: JwtPayload }).user;
    const campaignData = req.body as CreateCampaignRequest;

    const campaign = await campaignService.createCampaign(
      user.merchantId,
      campaignData
    );

    res.status(201).json({
      success: true,
      data: campaign,
      message: 'Campaign created successfully',
    });
  })
);

// Get campaign by ID
router.get(
  '/:id',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as Request & { user: JwtPayload }).user;
    const { id } = req.params;

    const campaign = await campaignService.getCampaignById(id);

    if (!campaign) {
      res.status(404).json({
        success: false,
        error: 'Campaign not found',
      });
      return;
    }

    // Ensure merchant can only access their own campaigns
    if (campaign.merchantId !== user.merchantId && user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Access denied',
      });
      return;
    }

    res.json({
      success: true,
      data: campaign,
    });
  })
);

// Update campaign
router.put(
  '/:id',
  authMiddleware,
  validateBody(UpdateCampaignSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as Request & { user: JwtPayload }).user;
    const { id } = req.params;
    const updateData = req.body as UpdateCampaignRequest;

    const campaign = await campaignService.updateCampaign(
      id,
      user.merchantId,
      updateData
    );

    if (!campaign) {
      res.status(404).json({
        success: false,
        error: 'Campaign not found',
      });
      return;
    }

    res.json({
      success: true,
      data: campaign,
      message: 'Campaign updated successfully',
    });
  })
);

// Delete campaign
router.delete(
  '/:id',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as Request & { user: JwtPayload }).user;
    const { id } = req.params;

    const deleted = await campaignService.deleteCampaign(id, user.merchantId);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Campaign not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Campaign deleted successfully',
    });
  })
);

// Get campaign stats
router.get(
  '/stats/summary',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const user = (req as Request & { user: JwtPayload }).user;

    const stats = await campaignService.getCampaignStats(user.merchantId);

    res.json({
      success: true,
      data: stats,
    });
  })
);

export default router;