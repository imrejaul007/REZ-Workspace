import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { ValidationError } from '../utils/errors.js';

const router = Router();

const connectAdAccountSchema = z.object({
  snapchatAccountId: z.string().min(1),
  displayName: z.string().min(1),
  accessToken: z.string().min(1),
  refreshToken: z.string().optional(),
  timezone: z.string().optional(),
  currency: z.string().optional(),
});

router.post(
  '/oauth',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const organizationId = req.user!.organizationId;

    const oauthUrl = await authService.initiateOAuthFlow(organizationId);

    res.json({
      success: true,
      data: {
        oauthUrl,
        message: 'Redirect to this URL to authorize',
      },
    });
  })
);

router.get(
  '/callback',
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { code, state, error } = req.query;

    if (error) {
      res.status(400).json({
        success: false,
        error: `OAuth error: ${error}`,
      });
      return;
    }

    if (!code || typeof code !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Authorization code is required',
      });
      return;
    }

    const tokens = await authService.handleOAuthCallback(code, state as string || 'default');

    res.json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        message: 'OAuth flow completed successfully',
      },
    });
  })
);

router.post(
  '/connect',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const organizationId = req.user!.organizationId;

    const validationResult = connectAdAccountSchema.safeParse(req.body);
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

router.get(
  '/accounts',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const organizationId = req.user!.organizationId;

    const accounts = await authService.getConnectedAccounts(organizationId);

    res.json({
      success: true,
      data: accounts,
    });
  })
);

router.delete(
  '/accounts/:snapchatAccountId',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { organizationId } = req.user!;
    const { snapchatAccountId } = req.params;

    await authService.disconnectAdAccount(organizationId, snapchatAccountId);

    res.json({
      success: true,
      message: 'Ad account disconnected',
    });
  })
);

router.post(
  '/refresh/:snapchatAccountId',
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