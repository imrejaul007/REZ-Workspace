import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { audienceService } from '../services/audience.service.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { ValidationError } from '../utils/errors.js';

const router = Router();

const createAudienceSchema = z.object({
  adAccountId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  source: z.enum(['CUSTOMER_LIST', 'WEB_PIXEL', 'APP_PIXEL', 'ENGAGEMENT']),
});

const updateAudienceSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

router.get(
  '/',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const organizationId = req.user!.organizationId;
    const adAccountId = req.query.adAccountId as string | undefined;

    const audiences = await audienceService.getAudiences(organizationId, adAccountId);

    res.json({
      success: true,
      data: audiences,
      total: audiences.length,
    });
  })
);

router.post(
  '/',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const organizationId = req.user!.organizationId;

    const validationResult = createAudienceSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new ValidationError(validationResult.error.message);
    }

    const audience = await audienceService.createAudience(organizationId, validationResult.data);

    res.status(201).json({
      success: true,
      data: audience,
    });
  })
);

router.get(
  '/:id',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const organizationId = req.user!.organizationId;
    const { id } = req.params;

    const audience = await audienceService.getAudience(organizationId, id);

    res.json({
      success: true,
      data: audience,
    });
  })
);

router.patch(
  '/:id',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const organizationId = req.user!.organizationId;
    const { id } = req.params;

    const validationResult = updateAudienceSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new ValidationError(validationResult.error.message);
    }

    const audience = await audienceService.updateAudience(
      organizationId,
      id,
      validationResult.data
    );

    res.json({
      success: true,
      data: audience,
    });
  })
);

router.delete(
  '/:id',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const organizationId = req.user!.organizationId;
    const { id } = req.params;

    await audienceService.deleteAudience(organizationId, id);

    res.json({
      success: true,
      message: 'Audience deleted successfully',
    });
  })
);

export default router;