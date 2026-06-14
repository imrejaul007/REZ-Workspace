import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { ValidationError } from '../utils/errors.js';

const router = Router();

const connectSchema = z.object({
  snapchatAccountId: z.string().min(1),
  displayName: z.string().min(1),
  timezone: z.string().optional(),
  currency: z.string().optional(),
  accessToken: z.string().min(1),
  refreshToken: z.string().optional(),
});

router.get(
  '/',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const organizationId = req.user!.organizationId;

    const accounts = await authService.getConnectedAccounts(organizationId);

    res.json({
      success: true,
      data: accounts,
      total: accounts.length,
    });
  })
);

router.post(
  '/connect',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const organizationId = req.user!.organizationId;

    const validationResult = connectSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new ValidationError(validationResult.error.message);
    }

    const adAccount = await authService.connectAdAccount({
      organizationId,
      ...validationResult.data,
    });

    res.status(201).json({
      success: true,
      data: adAccount,
    });
  })
);

router.delete(
  '/:snapchatAccountId',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { organizationId } = req.user!;
    const { snapchatAccountId } = req.params;

    await authService.disconnectAdAccount(organizationId, snapchatAccountId);

    res.json({
      success: true,
      message: 'Ad account disconnected successfully',
    });
  })
);

router.post(
  '/:snapchatAccountId/refresh',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { organizationId } = req.user!;
    const { snapchatAccountId } = req.params;

    await authService.refreshToken(organizationId, snapchatAccountId);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
    });
  })
);

export default router;