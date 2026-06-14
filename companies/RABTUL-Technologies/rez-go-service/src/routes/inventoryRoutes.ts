/**
 * REZ Go Inventory Routes
 */

import { Router, Request, Response } from 'express';
import {
  validateInventory,
  reserveInventory,
  releaseInventory,
  getLowStockAlerts,
} from '../services/inventoryService.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/inventory/validate
 * Validate inventory for checkout
 */
router.post('/validate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { storeId, items } = req.body;

    if (!storeId || !items) {
      return res.status(400).json({ error: 'storeId and items are required' });
    }

    const result = await validateInventory(storeId, items);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Inventory validation error:', error);
    res.status(500).json({ error: 'Failed to validate inventory' });
  }
});

/**
 * POST /api/inventory/reserve
 * Reserve inventory for checkout
 */
router.post('/reserve', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { storeId, items } = req.body;

    if (!storeId || !items) {
      return res.status(400).json({ error: 'storeId and items are required' });
    }

    const result = await reserveInventory(storeId, items);

    res.json({
      success: result.success,
      error: result.error,
    });
  } catch (error) {
    console.error('Inventory reservation error:', error);
    res.status(500).json({ error: 'Failed to reserve inventory' });
  }
});

/**
 * POST /api/inventory/release
 * Release reserved inventory
 */
router.post('/release', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { storeId, items } = req.body;

    if (!storeId || !items) {
      return res.status(400).json({ error: 'storeId and items are required' });
    }

    await releaseInventory(storeId, items);

    res.json({ success: true });
  } catch (error) {
    console.error('Inventory release error:', error);
    res.status(500).json({ error: 'Failed to release inventory' });
  }
});

/**
 * GET /api/inventory/alerts/:storeId
 * Get low stock alerts for store
 */
router.get('/alerts/:storeId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const { threshold } = req.query;

    const alerts = await getLowStockAlerts(storeId, threshold ? parseInt(threshold as string) : 10);

    res.json({
      success: true,
      alerts,
    });
  } catch (error) {
    console.error('Low stock alerts error:', error);
    res.status(500).json({ error: 'Failed to get alerts' });
  }
});

export default router;
