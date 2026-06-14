import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { adService } from '../services/ad.service.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { ValidationError } from '../utils/errors.js';

const router = Router();

const createAdSchema = z.object({
  campaignId: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['SNAP_AD', 'STORY_AD', 'COLLECTION_AD', 'FILTER']),
  creative: z.object({
    headline: z.string().min(1),
    body: z.string().min(1),
    callToAction: z.string().min(1),
    mediaUrl: z.string().url(),
    mediaType: z.enum(['image', 'video']),
  }),
});

router.post(
  '/',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const organizationId = req.user!.organizationId;

    const validationResult = createAdSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new ValidationError(validationResult.error.message);
    }

    const ad = await adService.createAd(organizationId, validationResult.data);

    res.status(201).json({
      success: true,
      data: ad,
    });
  })
);

router.get(
  '/',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const organizationId = req.user!.organizationId;
    const campaignId = req.query.campaignId as string | undefined;

    const ads = await adService.getAds(organizationId, campaignId);

    res.json({
      success: true,
      data: ads,
      total: ads.length,
    });
  })
);

router.get(
  '/:id',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const organizationId = req.user!.organizationId;
    const { id } = req.params;

    const ad = await adService.getAd(organizationId, id);

    res.json({
      success: true,
      data: ad,
    });
  })
);

router.patch(
  '/:id/status',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const organizationId = req.user!.organizationId;
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['ACTIVE', 'PAUSED'].includes(status)) {
      throw new ValidationError('Valid status (ACTIVE or PAUSED) is required');
    }

    const ad = await adService.updateAdStatus(organizationId, id, status);

    res.json({
      success: true,
      data: ad,
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

    const analytics = await adService.getAdAnalytics(organizationId, id, startDate, endDate);

    res.json({
      success: true,
      data: analytics,
    });
  })
);

export default router;