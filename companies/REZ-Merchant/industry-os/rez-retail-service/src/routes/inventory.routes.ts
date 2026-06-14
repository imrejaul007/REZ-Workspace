import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { inventoryService } from '../services/inventory.service';
import { logger } from '../utils/logger';
import { StockAdjustmentSchema } from '../types';

const router = Router();

// Validation schemas
const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  productId: z.string().optional(),
  sku: z.string().optional(),
  warehouseId: z.string().optional(),
  lowStock: z.coerce.boolean().optional(),
  outOfStock: z.coerce.boolean().optional(),
});

const stockAdjustmentSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int(),
  type: z.enum(['in', 'out', 'adjustment', 'return', 'transfer']),
  reason: z.string().optional(),
  reference: z.string().optional(),
  createdBy: z.string().optional(),
});

/**
 * GET /api/inventory
 * List inventory with filters
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const query = querySchema.parse(req.query);
    const filter = {
      productId: query.productId,
      sku: query.sku,
      warehouseId: query.warehouseId,
      lowStock: query.lowStock,
      outOfStock: query.outOfStock,
    };

    const result = await inventoryService.listInventory(filter, query.page, query.limit);

    res.json({
      success: true,
      data: result.inventory,
      pagination: {
        page: result.page,
        limit: query.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    logger.error('Error listing inventory:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

/**
 * GET /api/inventory/product/:productId
 * Get inventory by product ID
 */
router.get('/product/:productId', async (req: Request, res: Response) => {
  try {
    const inventory = await inventoryService.getInventoryByProductId(
      req.params.productId,
      req.query.warehouseId as string | undefined
    );

    if (!inventory) {
      res.status(404).json({ success: false, error: 'Inventory not found' });
      return;
    }

    res.json({ success: true, data: inventory });
  } catch (error) {
    logger.error('Error fetching inventory:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/inventory/sku/:sku
 * Get inventory by SKU
 */
router.get('/sku/:sku', async (req: Request, res: Response) => {
  try {
    const inventory = await inventoryService.getInventoryBySku(
      req.params.sku,
      req.query.warehouseId as string | undefined
    );

    if (!inventory) {
      res.status(404).json({ success: false, error: 'Inventory not found' });
      return;
    }

    res.json({ success: true, data: inventory });
  } catch (error) {
    logger.error('Error fetching inventory by SKU:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/inventory/low-stock
 * Get low stock items
 */
router.get('/reports/low-stock', async (req: Request, res: Response) => {
  try {
    const threshold = req.query.threshold
      ? parseInt(req.query.threshold as string, 10)
      : undefined;

    const items = await inventoryService.getLowStockItems(threshold);
    res.json({ success: true, data: items });
  } catch (error) {
    logger.error('Error fetching low stock items:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/inventory/out-of-stock
 * Get out of stock items
 */
router.get('/reports/out-of-stock', async (_req: Request, res: Response) => {
  try {
    const items = await inventoryService.getOutOfStockItems();
    res.json({ success: true, data: items });
  } catch (error) {
    logger.error('Error fetching out of stock items:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/inventory/value-report
 * Get stock value report
 */
router.get('/reports/value', async (_req: Request, res: Response) => {
  try {
    const report = await inventoryService.getStockValueReport();
    res.json({ success: true, data: report });
  } catch (error) {
    logger.error('Error generating value report:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/inventory/adjust
 * Adjust stock
 */
router.post('/adjust', async (req: Request, res: Response) => {
  try {
    const validated = stockAdjustmentSchema.parse(req.body);

    const inventory = await inventoryService.adjustStock({
      productId: validated.productId,
      quantity: validated.quantity,
      type: validated.type,
      reason: validated.reason,
      reference: validated.reference,
      createdBy: validated.createdBy,
    });

    res.json({ success: true, data: inventory });
  } catch (error) {
    logger.error('Error adjusting stock:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
    } else if (error instanceof Error) {
      res.status(400).json({ success: false, error: error.message });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

/**
 * POST /api/inventory/reserve
 * Reserve stock
 */
router.post('/reserve', async (req: Request, res: Response) => {
  try {
    const { productId, quantity } = z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive(),
    }).parse(req.body);

    const inventory = await inventoryService.reserveStock(productId, quantity);

    if (!inventory) {
      res.status(404).json({ success: false, error: 'Inventory not found' });
      return;
    }

    res.json({ success: true, data: inventory });
  } catch (error) {
    logger.error('Error reserving stock:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
    } else if (error instanceof Error) {
      res.status(400).json({ success: false, error: error.message });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

/**
 * POST /api/inventory/release
 * Release reserved stock
 */
router.post('/release', async (req: Request, res: Response) => {
  try {
    const { productId, quantity } = z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive(),
    }).parse(req.body);

    const inventory = await inventoryService.releaseStock(productId, quantity);

    if (!inventory) {
      res.status(404).json({ success: false, error: 'Inventory not found' });
      return;
    }

    res.json({ success: true, data: inventory });
  } catch (error) {
    logger.error('Error releasing stock:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

/**
 * GET /api/inventory/:productId/movements
 * Get inventory movements
 */
router.get('/:productId/movements', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const movements = await inventoryService.getMovements(req.params.productId, limit);
    res.json({ success: true, data: movements });
  } catch (error) {
    logger.error('Error fetching movements:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
