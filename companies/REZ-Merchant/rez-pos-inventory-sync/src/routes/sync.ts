import { Router, Response } from 'express';
import { syncService } from '../services/syncService';
import { serviceAuth, adminOnly, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Apply admin/service authentication to all sync routes
router.use(serviceAuth);
router.use(adminOnly);

/**
 * POST /sync/full
 * Trigger a full inventory sync between POS and Inventory Engine
 */
router.post('/full', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { storeId, threshold } = req.body;

    console.log(`[SyncRoute] Full sync requested${storeId ? ` for store ${storeId}` : ''}`);

    // Start the full sync
    const result = await syncService.performFullSync(storeId);

    res.status(200).json({
      success: true,
      message: 'Full sync completed',
      synced: result.synced,
      failed: result.failed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[SyncRoute] Full sync failed: ${errorMsg}`);

    res.status(500).json({
      success: false,
      error: errorMsg,
    });
  }
});

/**
 * POST /sync/product/:sku
 * Sync a single product to POS
 */
router.post('/product/:sku', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { sku } = req.params;
    const { storeId } = req.body;

    if (!storeId) {
      res.status(400).json({
        success: false,
        error: 'storeId is required in request body',
      });
      return;
    }

    console.log(`[SyncRoute] Single product sync requested for SKU ${sku}`);

    const success = await syncService.syncSingleProduct(sku, storeId);

    if (success) {
      res.status(200).json({
        success: true,
        message: `Product ${sku} synced successfully`,
        sku,
        storeId,
      });
    } else {
      res.status(500).json({
        success: false,
        error: `Failed to sync product ${sku}`,
        sku,
        storeId,
      });
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[SyncRoute] Product sync failed: ${errorMsg}`);

    res.status(500).json({
      success: false,
      error: errorMsg,
    });
  }
});

/**
 * GET /sync/status
 * Get current sync status
 */
router.get('/status', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const status = syncService.getStatus();

    res.status(200).json({
      success: true,
      status: {
        ...status,
        // Convert Date objects to ISO strings for JSON serialization
        lastFullSync: status.lastFullSync?.toISOString() || null,
        lastPartialSync: status.lastPartialSync?.toISOString() || null,
        errors: status.errors.map((e) => ({
          ...e,
          timestamp: e.timestamp.toISOString(),
        })),
      },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[SyncRoute] Status check failed: ${errorMsg}`);

    res.status(500).json({
      success: false,
      error: errorMsg,
    });
  }
});

/**
 * POST /sync/low-stock-check
 * Check and notify about low stock items
 */
router.post('/low-stock-check', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { storeId, threshold } = req.body;

    if (!storeId) {
      res.status(400).json({
        success: false,
        error: 'storeId is required',
      });
      return;
    }

    console.log(`[SyncRoute] Low stock check requested for store ${storeId}`);

    await syncService.checkLowStockAndNotify(storeId, threshold || 10);

    res.status(200).json({
      success: true,
      message: 'Low stock check completed',
      storeId,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[SyncRoute] Low stock check failed: ${errorMsg}`);

    res.status(500).json({
      success: false,
      error: errorMsg,
    });
  }
});

/**
 * GET /sync/health
 * Health check for sync endpoint
 */
router.get('/health', (req: AuthenticatedRequest, res: Response): void => {
  res.status(200).json({
    success: true,
    service: 'sync',
    timestamp: new Date().toISOString(),
  });
});

export default router;
