import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { pixelService } from '../services/pixel.service.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { ValidationError } from '../utils/errors.js';

const router = Router();

const createPixelSchema = z.object({
  adAccountId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
});

const trackEventSchema = z.object({
  event_type: z.string().min(1),
  timestamp: z.number(),
  user_id: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  event_data: z.record(z.unknown()).optional(),
});

router.post(
  '/',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const organizationId = req.user!.organizationId;

    const validationResult = createPixelSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new ValidationError(validationResult.error.message);
    }

    const pixel = await pixelService.createPixel(organizationId, validationResult.data);

    res.status(201).json({
      success: true,
      data: pixel,
    });
  })
);

router.get(
  '/',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const organizationId = req.user!.organizationId;
    const adAccountId = req.query.adAccountId as string | undefined;

    const pixels = await pixelService.getPixels(organizationId, adAccountId);

    res.json({
      success: true,
      data: pixels,
      total: pixels.length,
    });
  })
);

router.get(
  '/:id',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const organizationId = req.user!.organizationId;
    const { id } = req.params;

    const pixel = await pixelService.getPixel(organizationId, id);

    res.json({
      success: true,
      data: pixel,
    });
  })
);

router.post(
  '/:id/events',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const organizationId = req.user!.organizationId;
    const { id } = req.params;

    const validationResult = trackEventSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new ValidationError(validationResult.error.message);
    }

    await pixelService.trackEvent(organizationId, id, validationResult.data);

    res.status(201).json({
      success: true,
      message: 'Event tracked successfully',
    });
  })
);

router.get(
  '/:id/events',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const organizationId = req.user!.organizationId;
    const { id } = req.params;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const events = await pixelService.getEvents(organizationId, id, start, end);

    res.json({
      success: true,
      data: events,
      total: events.length,
    });
  })
);

export default router;