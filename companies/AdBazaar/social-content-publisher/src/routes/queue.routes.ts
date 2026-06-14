import { Router, Response } from 'express';
import { queueService } from '../services/queue.service';
import { asyncHandler, AuthenticatedRequest, internalServiceAuth } from '../middleware';
import { reorderQueueSchema } from '../middleware/validation.middleware';

const router = Router();

// Apply auth middleware to all routes
router.use(internalServiceAuth);

// Get queue items
router.get(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { companyId } = req.user!;
    const { status, platform, startDate, endDate, page = '1', limit = '50' } = req.query;

    const result = await queueService.findAll(
      {
        status: status as string,
        platform: platform as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      },
      parseInt(page as string, 10),
      parseInt(limit as string, 10)
    );

    res.json({
      success: true,
      ...result,
    });
  })
);

// Get pending queue items (for workers)
router.get(
  '/pending',
  asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const items = await queueService.getPendingItems(10);

    res.json({
      success: true,
      data: items,
    });
  })
);

// Reorder queue
router.post(
  '/reorder',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const validated = reorderQueueSchema.parse(req.body);

    await queueService.reorderItems(validated.items);

    res.json({
      success: true,
      message: 'Queue reordered successfully',
    });
  })
);

// Get queue statistics
router.get(
  '/stats',
  asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const stats = await queueService.getQueueStats();

    res.json({
      success: true,
      data: stats,
    });
  })
);

// Retry failed queue item
router.post(
  '/:id/retry',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const item = await queueService.retryFailed(req.params.id);

    res.json({
      success: true,
      data: item,
    });
  })
);

// Get queue item by ID
router.get(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const item = await queueService.findById(req.params.id);

    res.json({
      success: true,
      data: item,
    });
  })
);

export default router;