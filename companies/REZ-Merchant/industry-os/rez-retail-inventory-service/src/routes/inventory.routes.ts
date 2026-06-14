import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { inventoryService } from '../services/inventory.service';
import { PurchaseOrderStatus } from '../types';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const createOrderSchema = z.object({
  supplierId: z.string().uuid(),
  supplierName: z.string().min(1),
  items: z.array(z.object({
    productId: z.string().uuid(),
    sku: z.string(),
    productName: z.string(),
    quantity: z.number().int().positive(),
    unitCost: z.number().positive(),
  })),
  expectedDeliveryDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  warehouseId: z.string().uuid().optional(),
});

const receiveSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
  })),
});

/**
 * GET /api/inventory/purchase-orders
 * List purchase orders
 */
router.get('/purchase-orders', async (req: Request, res: Response) => {
  try {
    const { supplierId, status, page, limit } = req.query;
    const result = await inventoryService.listPurchaseOrders(
      {
        supplierId: supplierId as string,
        status: status as PurchaseOrderStatus,
      },
      parseInt(page as string) || 1,
      parseInt(limit as string) || 20
    );

    res.json({ success: true, data: result.orders, total: result.total });
  } catch (error) {
    logger.error('Error listing orders:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/inventory/purchase-orders/pending
 * Get pending orders
 */
router.get('/purchase-orders/pending', async (_req: Request, res: Response) => {
  try {
    const orders = await inventoryService.getPendingOrders();
    res.json({ success: true, data: orders });
  } catch (error) {
    logger.error('Error fetching pending orders:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/inventory/purchase-orders/stats
 * Get order statistics
 */
router.get('/purchase-orders/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await inventoryService.getOrderStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/inventory/purchase-orders/:id
 * Get purchase order by ID
 */
router.get('/purchase-orders/:id', async (req: Request, res: Response) => {
  try {
    const order = await inventoryService.getPurchaseOrder(req.params.id);

    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }

    res.json({ success: true, data: order });
  } catch (error) {
    logger.error('Error fetching order:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/inventory/purchase-orders
 * Create purchase order
 */
router.post('/purchase-orders', async (req: Request, res: Response) => {
  try {
    const validated = createOrderSchema.parse(req.body);
    const order = await inventoryService.createPurchaseOrder({
      ...validated,
      expectedDeliveryDate: validated.expectedDeliveryDate ? new Date(validated.expectedDeliveryDate) : undefined,
      createdBy: req.headers['x-user-id'] as string || 'system',
    });

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    logger.error('Error creating order:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

/**
 * PUT /api/inventory/purchase-orders/:id/status
 * Update order status
 */
router.put('/purchase-orders/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = z.object({
      status: z.nativeEnum(PurchaseOrderStatus),
    }).parse(req.body);

    const order = await inventoryService.updateOrderStatus(
      req.params.id,
      status,
      req.headers['x-user-id'] as string
    );

    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }

    res.json({ success: true, data: order });
  } catch (error) {
    logger.error('Error updating status:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

/**
 * POST /api/inventory/purchase-orders/:id/receive
 * Receive inventory
 */
router.post('/purchase-orders/:id/receive', async (req: Request, res: Response) => {
  try {
    const validated = receiveSchema.parse(req.body);
    const order = await inventoryService.receiveInventory(
      req.params.id,
      validated.items,
      req.headers['x-user-id'] as string || 'system'
    );

    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }

    res.json({ success: true, data: order });
  } catch (error) {
    logger.error('Error receiving inventory:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

/**
 * POST /api/inventory/purchase-orders/:id/cancel
 * Cancel order
 */
router.post('/purchase-orders/:id/cancel', async (req: Request, res: Response) => {
  try {
    const order = await inventoryService.cancelOrder(req.params.id);

    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }

    res.json({ success: true, data: order });
  } catch (error) {
    logger.error('Error cancelling order:', error);
    if (error instanceof Error) {
      res.status(400).json({ success: false, error: error.message });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

/**
 * POST /api/inventory/stock-check
 * Check stock levels and create alerts
 */
router.post('/stock-check', async (req: Request, res: Response) => {
  try {
    const { inventory } = z.object({
      inventory: z.array(z.object({
        productId: z.string().uuid(),
        sku: z.string(),
        productName: z.string(),
        quantity: z.number().int().min(0),
        reorderPoint: z.number().int().min(0),
        reorderQuantity: z.number().int().positive(),
      })),
    }).parse(req.body);

    for (const item of inventory) {
      await inventoryService.checkStockLevels(item);
    }

    res.json({ success: true, message: 'Stock levels checked' });
  } catch (error) {
    logger.error('Error checking stock:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

export default router;
