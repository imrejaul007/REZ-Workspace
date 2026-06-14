import { Router, Response } from 'express';
import { platformService } from '../services/platform.service';
import { asyncHandler, AuthenticatedRequest, internalServiceAuth } from '../middleware';
import { connectPlatformSchema } from '../middleware/validation.middleware';

const router = Router();

// Apply auth middleware to all routes
router.use(internalServiceAuth);

// Get connected platforms
router.get(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { companyId } = req.user!;
    const { platform, status } = req.query;

    const platforms = await platformService.findAll({
      companyId,
      platform: platform as any,
      status: status as any,
    });

    res.json({
      success: true,
      data: platforms,
    });
  })
);

// Get active platforms
router.get(
  '/active',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { companyId } = req.user!;

    const platforms = await platformService.getActivePlatforms(companyId);

    res.json({
      success: true,
      data: platforms,
    });
  })
);

// Get platform statistics
router.get(
  '/stats',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { companyId } = req.user!;

    const stats = await platformService.getPlatformStats(companyId);

    res.json({
      success: true,
      data: stats,
    });
  })
);

// Connect new platform
router.post(
  '/connect',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId, companyId } = req.user!;
    const validated = connectPlatformSchema.parse(req.body);

    const platform = await platformService.connect(userId, companyId, validated);

    res.status(201).json({
      success: true,
      data: platform,
    });
  })
);

// Disconnect platform
router.delete(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId, companyId } = req.user!;

    await platformService.disconnect(userId, companyId, req.params.id);

    res.json({
      success: true,
      message: 'Platform disconnected successfully',
    });
  })
);

// Sync platform
router.post(
  '/:id/sync',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await platformService.syncPlatform(req.params.id);

    res.json({
      success: true,
      message: 'Platform synced successfully',
    });
  })
);

// Bulk sync platforms
router.post(
  '/sync-all',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { companyId } = req.user!;

    const result = await platformService.bulkSync(companyId);

    res.json({
      success: true,
      data: result,
    });
  })
);

// Enable/disable platform
router.patch(
  '/:id/status',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { enabled } = req.query;

    await platformService.setEnabled(req.params.id, enabled === 'true');

    res.json({
      success: true,
      message: `Platform ${enabled === 'true' ? 'enabled' : 'disabled'}`,
    });
  })
);

// Get platform by ID
router.get(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const platform = await platformService.findById(req.params.id);

    res.json({
      success: true,
      data: platform,
    });
  })
);

export default router;