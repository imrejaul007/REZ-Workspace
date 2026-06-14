/**
 * Offline Sync Routes
 * Handles offline order synchronization
 */

import { Router, Request, Response, NextFunction } from 'express';
import { offlineSyncService } from '../services/offlineSync';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @route POST /api/offline/orders
 * @desc Queue an order created offline
 */
router.post('/orders', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await offlineSyncService.queueOrder({
      ...req.body,
      merchantId: req.body.merchantId || (req as any).merchantId,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      data: {
        id: order._id,
        offlineId: order.offlineId,
        status: order.status,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/offline/orders/pending
 * @desc Get all pending orders for sync
 */
router.get('/orders/pending', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const merchantId = req.query.merchantId as string || (req as any).merchantId;
    const orders = await offlineSyncService.getPendingOrders(merchantId);

    res.json({
      success: true,
      data: orders,
      count: orders.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/offline/sync/:orderId
 * @desc Sync a single pending order
 */
router.post('/sync/:orderId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await offlineSyncService.syncOrder(req.params.orderId);

    if (result.success) {
      res.json({
        success: true,
        message: 'Order synced successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/offline/sync/all
 * @desc Sync all pending orders
 */
router.post('/sync/all', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const merchantId = req.body.merchantId || (req as any).merchantId;
    const result = await offlineSyncService.syncAllPending(merchantId);

    res.json({
      success: true,
      data: {
        total: result.total,
        synced: result.success,
        failed: result.failed,
        errors: result.errors,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/offline/status
 * @desc Get sync status for a merchant
 */
router.get('/status', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const merchantId = req.query.merchantId as string || (req as any).merchantId;
    const status = await offlineSyncService.getSyncStatus(merchantId);

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/offline/conflicts/:orderId/resolve
 * @desc Resolve a sync conflict
 */
router.post('/conflicts/:orderId/resolve', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { resolution, mergedData } = req.body;
    const order = await offlineSyncService.resolveConflict(
      req.params.orderId,
      resolution,
      mergedData
    );

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/offline/retry/failed
 * @desc Retry failed orders
 */
router.post('/retry/failed', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const merchantId = req.body.merchantId || (req as any).merchantId;
    const result = await offlineSyncService.retryFailed(merchantId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route DELETE /api/offline/cleanup
 * @desc Cleanup old synced orders
 */
router.delete('/cleanup', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const merchantId = req.body.merchantId || (req as any).merchantId;
    const daysOld = parseInt(req.query.days as string) || 30;
    const deletedCount = await offlineSyncService.cleanupSyncedOrders(merchantId, daysOld);

    res.json({
      success: true,
      data: { deletedCount },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
