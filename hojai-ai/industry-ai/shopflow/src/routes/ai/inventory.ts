import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { inventoryAgent } from '../../services';
import { logger } from '../../utils/logger';
import { validate } from '../../middleware/validate';
import { aiLimiter } from '../../middleware/rateLimit';

const router = Router();

const checkStockSchema = z.object({
  threshold: z.number().int().positive().optional(),
});

const reorderSchema = z.object({
  productIds: z.array(z.string()).optional(),
  priority: z.enum(['all', 'high', 'medium']).default('all'),
});

// POST /api/ai/inventory/check - Check low stock
router.post('/check', aiLimiter, validate(checkStockSchema), async (req: Request, res: Response) => {
  try {
    const { threshold } = req.body;

    logger.info('AI inventory check requested', { threshold });

    const result = await inventoryAgent.checkLowStock(threshold);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('AI inventory check failed', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to check inventory',
      code: 'INVENTORY_CHECK_ERROR',
    });
  }
});

// POST /api/ai/inventory/reorder - Auto reorder
router.post('/reorder', aiLimiter, validate(reorderSchema), async (req: Request, res: Response) => {
  try {
    const { productIds, priority } = req.body;

    logger.info('AI auto reorder requested', { productIds, priority });

    // Filter recommendations based on priority if specified
    let reorderList = productIds;
    if (priority && priority !== 'all') {
      const checkResult = await inventoryAgent.checkLowStock();
      reorderList = checkResult.recommendations
        .filter((r) => r.priority === priority)
        .map((r) => r.productId);
    }

    const result = await inventoryAgent.autoReorder(reorderList);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('AI auto reorder failed', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to process reorder',
      code: 'REORDER_ERROR',
    });
  }
});

// GET /api/ai/inventory/health - Get inventory health score
router.get('/health', aiLimiter, async (req: Request, res: Response) => {
  try {
    const health = await inventoryAgent.getInventoryHealth();

    res.json({
      success: true,
      data: health,
    });
  } catch (error) {
    logger.error('AI inventory health check failed', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to check inventory health',
      code: 'INVENTORY_HEALTH_ERROR',
    });
  }
});

export default router;