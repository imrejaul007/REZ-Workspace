import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { campaignService } from '../services/campaign.service.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { ValidationError } from '../utils/errors.js';

const router = Router();

const createCampaignSchema = z.object({
  adAccountId: z.string().min(1),
  name: z.string().min(1),
  objective: z.enum(['VIDEO_VIEW', 'WEB_VIEW', 'APP_INSTALL', 'AUDIENCE', 'BRAND_AWARENESS']),
  dailyBudget: z.number().positive(),
  totalBudget: z.number().positive(),
  startDate: z.string().transform((s) => new Date(s)),
  endDate: z.string().transform((s) => new Date(s)).optional(),
  targeting: z
    .object({
      ageMin: z.number().optional(),
      ageMax: z.number().optional(),
      genders: z.array(z.string()).optional(),
      countries: z.array(z.string()).optional(),
      interests: z.array(z.string()).optional(),
    })
    .optional(),
});

const updateCampaignSchema = z.object({
  name: z.string().min(1).optional(),
  objective: z.enum(['VIDEO_VIEW', 'WEB_VIEW', 'APP_INSTALL', 'AUDIENCE', 'BRAND_AWARENESS']).optional(),
  dailyBudget: z.number().positive().optional(),
  totalBudget: z.number().positive().optional(),
  startDate: z.string().transform((s) => new Date(s)).optional(),
  endDate: z.string().transform((s) => new Date(s)).optional(),
  targeting: z
    .object({
      ageMin: z.number().optional(),
      ageMax: z.number().optional(),
      genders: z.array(z.string()).optional(),
      countries: z.array(z.string()).optional(),
      interests: z.array(z.string()).optional(),
    })
    .optional(),
});

router.post(
  '/',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const organizationId = req.user!.organizationId;

    const validationResult = createCampaignSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new ValidationError(validationResult.error.message);
    }

    const campaign = await campaignService.createCampaign(organizationId, validationResult.data);

    res.status(201).json({
      success: true,
      data: campaign,
    });
  })
);

router.get(
  '/',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const organizationId = req.user!.organizationId;
    const adAccountId = req.query.adAccountId as string | undefined;

    const campaigns = await campaignService.getCampaigns(organizationId, adAccountId);

    res.json({
      success: true,
      data: campaigns,
      total: campaigns.length,
    });
  })
);

router.get(
  '/:id',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const organizationId = req.user!.organizationId;
    const { id } = req.params;

    const campaign = await campaignService.getCampaign(organizationId, id);

    res.json({
      success: true,
      data: campaign,
    });
  })
);

router.patch(
  '/:id',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const organizationId = req.user!.organizationId;
    const { id } = req.params;

    const validationResult = updateCampaignSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new ValidationError(validationResult.error.message);
    }

    const campaign = await campaignService.updateCampaign(organizationId, id, validationResult.data);

    res.json({
      success: true,
      data: campaign,
    });
  })
);

router.post(
  '/:id/start',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const organizationId = req.user!.organizationId;
    const { id } = req.params;

    const campaign = await campaignService.startCampaign(organizationId, id);

    res.json({
      success: true,
      data: campaign,
      message: 'Campaign started successfully',
    });
  })
);

router.post(
  '/:id/pause',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const organizationId = req.user!.organizationId;
    const { id } = req.params;

    const campaign = await campaignService.pauseCampaign(organizationId, id);

    res.json({
      success: true,
      data: campaign,
      message: 'Campaign paused successfully',
    });
  })
);

router.get(
  '/:id/analytics',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const organizationId = req.user!.organizationId;
    const { id } = req.params;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    if (!startDate || !endDate) {
      throw new ValidationError('startDate and endDate are required');
    }

    const analytics = await campaignService.getCampaignAnalytics(
      organizationId,
      id,
      startDate,
      endDate
    );

    res.json({
      success: true,
      data: analytics,
    });
  })
);

export default router;