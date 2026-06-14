/**
 * Restaurant Inventory Service - API Routes
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  createItem,
  getItem,
  getItemsByRestaurant,
  updateItem,
  deleteItem,
  adjustStock,
  getAdjustmentsByItem,
  getAdjustmentsByRestaurant,
  getLowStockItems,
  getExpiringItems,
  getOutOfStockItems,
  getItemsByCategory,
  getInventoryValue,
  getCategoriesByRestaurant,
  createSupplier,
  getSupplier,
  getSuppliersByRestaurant,
  updateSupplier,
  getAlertsByRestaurant,
  markAlertRead,
  markAllAlertsRead,
  deleteAlert,
  createPurchaseOrder,
  getPurchaseOrder,
  getPurchaseOrdersByRestaurant,
  updatePurchaseOrderStatus,
  getInventoryReport,
  ITEM_CATEGORIES,
  ITEM_UNITS,
} from '../services/inventory.service.js';

const router = Router();

// Validation schemas
const CreateItemSchema = z.object({
  merchantId: z.string().min(1),
  restaurantId: z.string().min(1),
  name: z.string().min(1),
  sku: z.string().min(1),
  category: z.string().min(1),
  quantity: z.number().int().min(0),
  unit: z.string().min(1),
  minStockLevel: z.number().int().min(0).optional(),
  maxStockLevel: z.number().int().min(0).optional(),
  costPrice: z.number().min(0),
  sellingPrice: z.number().min(0),
  supplier: z.string().optional(),
  expiryDate: z.string().optional(),
  isActive: z.boolean().optional(),
});

const UpdateItemSchema = z.object({
  name: z.string().min(1).optional(),
  sku: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  quantity: z.number().int().min(0).optional(),
  unit: z.string().min(1).optional(),
  minStockLevel: z.number().int().min(0).optional(),
  maxStockLevel: z.number().int().min(0).optional(),
  costPrice: z.number().min(0).optional(),
  sellingPrice: z.number().min(0).optional(),
  supplier: z.string().optional(),
  expiryDate: z.string().optional(),
  isActive: z.boolean().optional(),
});

const AdjustStockSchema = z.object({
  quantity: z.number(),
  type: z.enum(['add', 'remove', 'set']),
  reason: z.string().min(1),
  performedBy: z.string().min(1),
});

const CreateSupplierSchema = z.object({
  merchantId: z.string().min(1),
  restaurantId: z.string().min(1),
  name: z.string().min(1),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  items: z.array(z.string()).optional(),
});

const UpdateSupplierSchema = z.object({
  name: z.string().min(1).optional(),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  isActive: z.boolean().optional(),
});

const CreatePurchaseOrderSchema = z.object({
  restaurantId: z.string().min(1),
  supplierId: z.string().min(1),
  items: z.array(z.object({
    itemId: z.string().min(1),
    itemName: z.string().min(1),
    quantity: z.number().positive(),
    unit: z.string().min(1),
    unitPrice: z.number().min(0),
    total: z.number().min(0),
  })),
  totalAmount: z.number().min(0),
  status: z.enum(['draft', 'sent', 'confirmed', 'partial', 'received', 'cancelled']).optional(),
  notes: z.string().optional(),
  expectedDelivery: z.string().optional(),
});

// ============ Health & Info Routes ============

/**
 * GET /api/info - Get service info and constants
 */
router.get('/info', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      categories: ITEM_CATEGORIES,
      units: ITEM_UNITS,
    },
  });
});

// ============ Item Routes ============

/**
 * POST /api/items - Create inventory item
 */
router.post('/items', (req: Request, res: Response) => {
  try {
    const data = CreateItemSchema.parse(req.body);

    const item = createItem({
      ...data,
      minStockLevel: data.minStockLevel ?? 10,
      maxStockLevel: data.maxStockLevel ?? 100,
      isActive: data.isActive ?? true,
    });

    res.status(201).json({
      success: true,
      data: { item },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error.errors },
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to create item' },
    });
  }
});

/**
 * GET /api/items/:restaurantId - Get all items for a restaurant
 */
router.get('/items/:restaurantId', (req: Request, res: Response) => {
  const { restaurantId } = req.params;
  const { category } = req.query;

  let items;
  if (category) {
    items = getItemsByCategory(restaurantId, category as string);
  } else {
    items = getItemsByRestaurant(restaurantId);
  }

  res.json({
    success: true,
    data: { items, count: items.length },
  });
});

/**
 * GET /api/items/:restaurantId/:itemId - Get specific item
 */
router.get('/items/:restaurantId/:itemId', (req: Request, res: Response) => {
  const { itemId } = req.params;
  const item = getItem(itemId);

  if (!item) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Item not found' },
    });
    return;
  }

  res.json({
    success: true,
    data: { item },
  });
});

/**
 * PUT /api/items/:itemId - Update item
 */
router.put('/items/:itemId', (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;
    const updates = UpdateItemSchema.parse(req.body);

    const item = updateItem(itemId, updates);
    if (!item) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Item not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: { item },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error.errors },
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to update item' },
    });
  }
});

/**
 * DELETE /api/items/:itemId - Soft delete item
 */
router.delete('/items/:itemId', (req: Request, res: Response) => {
  const { itemId } = req.params;
  const deleted = deleteItem(itemId);

  if (!deleted) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Item not found' },
    });
    return;
  }

  res.json({
    success: true,
    message: 'Item deleted',
  });
});

// ============ Stock Routes ============

/**
 * POST /api/stock/:itemId/adjust - Adjust stock
 */
router.post('/stock/:itemId/adjust', (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;
    const data = AdjustStockSchema.parse(req.body);

    const item = adjustStock(
      itemId,
      data.quantity,
      data.type,
      data.reason,
      data.performedBy
    );

    if (!item) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Item not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: { item, adjustmentType: data.type, quantity: data.quantity },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error.errors },
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to adjust stock' },
    });
  }
});

/**
 * GET /api/stock/:itemId/history - Get stock adjustment history
 */
router.get('/stock/:itemId/history', (req: Request, res: Response) => {
  const { itemId } = req.params;
  const adjustments = getAdjustmentsByItem(itemId);

  res.json({
    success: true,
    data: { adjustments, count: adjustments.length },
  });
});

/**
 * GET /api/stock/:restaurantId/history - Get all stock adjustments for restaurant
 */
router.get('/stock/:restaurantId/history', (req: Request, res: Response) => {
  const { restaurantId } = req.params;
  const { limit } = req.query;
  const adjustments = getAdjustmentsByRestaurant(restaurantId, limit ? parseInt(limit as string, 10) : 100);

  res.json({
    success: true,
    data: { adjustments, count: adjustments.length },
  });
});

// ============ Query Routes ============

/**
 * GET /api/stock/:restaurantId/low-stock - Get low stock items
 */
router.get('/stock/:restaurantId/low-stock', (req: Request, res: Response) => {
  const { restaurantId } = req.params;
  const items = getLowStockItems(restaurantId);

  res.json({
    success: true,
    data: { items, count: items.length },
  });
});

/**
 * GET /api/stock/:restaurantId/expiring - Get expiring items
 */
router.get('/stock/:restaurantId/expiring', (req: Request, res: Response) => {
  const { restaurantId } = req.params;
  const { days } = req.query;
  const daysAhead = days ? parseInt(days as string, 10) : 7;
  const items = getExpiringItems(restaurantId, daysAhead);

  res.json({
    success: true,
    data: { items, count: items.length, daysAhead },
  });
});

/**
 * GET /api/stock/:restaurantId/out-of-stock - Get out of stock items
 */
router.get('/stock/:restaurantId/out-of-stock', (req: Request, res: Response) => {
  const { restaurantId } = req.params;
  const items = getOutOfStockItems(restaurantId);

  res.json({
    success: true,
    data: { items, count: items.length },
  });
});

/**
 * GET /api/stock/:restaurantId/value - Get inventory value
 */
router.get('/stock/:restaurantId/value', (req: Request, res: Response) => {
  const { restaurantId } = req.params;
  const value = getInventoryValue(restaurantId);

  res.json({
    success: true,
    data: {
      restaurantId,
      totalValue: value,
      currency: 'INR',
    },
  });
});

/**
 * GET /api/stock/:restaurantId/categories - Get all categories
 */
router.get('/stock/:restaurantId/categories', (req: Request, res: Response) => {
  const { restaurantId } = req.params;
  const categories = getCategoriesByRestaurant(restaurantId);

  res.json({
    success: true,
    data: { categories },
  });
});

// ============ Supplier Routes ============

/**
 * POST /api/suppliers - Create supplier
 */
router.post('/suppliers', (req: Request, res: Response) => {
  try {
    const data = CreateSupplierSchema.parse(req.body);

    const supplier = createSupplier({
      ...data,
      items: data.items || [],
      isActive: true,
    });

    res.status(201).json({
      success: true,
      data: { supplier },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error.errors },
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to create supplier' },
    });
  }
});

/**
 * GET /api/suppliers/:restaurantId - Get suppliers for restaurant
 */
router.get('/suppliers/:restaurantId', (req: Request, res: Response) => {
  const { restaurantId } = req.params;
  const suppliers = getSuppliersByRestaurant(restaurantId);

  res.json({
    success: true,
    data: { suppliers, count: suppliers.length },
  });
});

/**
 * GET /api/suppliers/:restaurantId/:supplierId - Get specific supplier
 */
router.get('/suppliers/:restaurantId/:supplierId', (req: Request, res: Response) => {
  const { supplierId } = req.params;
  const supplier = getSupplier(supplierId);

  if (!supplier) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Supplier not found' },
    });
    return;
  }

  res.json({
    success: true,
    data: { supplier },
  });
});

/**
 * PUT /api/suppliers/:supplierId - Update supplier
 */
router.put('/suppliers/:supplierId', (req: Request, res: Response) => {
  try {
    const { supplierId } = req.params;
    const updates = UpdateSupplierSchema.parse(req.body);

    const supplier = updateSupplier(supplierId, updates);
    if (!supplier) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Supplier not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: { supplier },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error.errors },
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to update supplier' },
    });
  }
});

// ============ Alert Routes ============

/**
 * GET /api/alerts/:restaurantId - Get alerts for restaurant
 */
router.get('/alerts/:restaurantId', (req: Request, res: Response) => {
  const { restaurantId } = req.params;
  const { unreadOnly } = req.query;
  const alerts = getAlertsByRestaurant(restaurantId, unreadOnly === 'true');

  res.json({
    success: true,
    data: { alerts, count: alerts.length },
  });
});

/**
 * PUT /api/alerts/:alertId/read - Mark alert as read
 */
router.put('/alerts/:alertId/read', (req: Request, res: Response) => {
  const { alertId } = req.params;
  const alert = markAlertRead(alertId);

  if (!alert) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Alert not found' },
    });
    return;
  }

  res.json({
    success: true,
    data: { alert },
  });
});

/**
 * PUT /api/alerts/:restaurantId/read-all - Mark all alerts as read
 */
router.put('/alerts/:restaurantId/read-all', (req: Request, res: Response) => {
  const { restaurantId } = req.params;
  const count = markAllAlertsRead(restaurantId);

  res.json({
    success: true,
    data: { markedRead: count },
  });
});

/**
 * DELETE /api/alerts/:alertId - Delete alert
 */
router.delete('/alerts/:alertId', (req: Request, res: Response) => {
  const { alertId } = req.params;
  const deleted = deleteAlert(alertId);

  if (!deleted) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Alert not found' },
    });
    return;
  }

  res.json({
    success: true,
    message: 'Alert deleted',
  });
});

// ============ Purchase Order Routes ============

/**
 * POST /api/purchase-orders - Create purchase order
 */
router.post('/purchase-orders', (req: Request, res: Response) => {
  try {
    const data = CreatePurchaseOrderSchema.parse(req.body);

    const order = createPurchaseOrder({
      ...data,
      status: data.status || 'draft',
      expectedDelivery: data.expectedDelivery ? new Date(data.expectedDelivery) : undefined,
    });

    res.status(201).json({
      success: true,
      data: { order },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error.errors },
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to create purchase order' },
    });
  }
});

/**
 * GET /api/purchase-orders/:restaurantId - Get purchase orders
 */
router.get('/purchase-orders/:restaurantId', (req: Request, res: Response) => {
  const { restaurantId } = req.params;
  const orders = getPurchaseOrdersByRestaurant(restaurantId);

  res.json({
    success: true,
    data: { orders, count: orders.length },
  });
});

/**
 * GET /api/purchase-orders/:restaurantId/:orderId - Get specific order
 */
router.get('/purchase-orders/:restaurantId/:orderId', (req: Request, res: Response) => {
  const { orderId } = req.params;
  const order = getPurchaseOrder(orderId);

  if (!order) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Purchase order not found' },
    });
    return;
  }

  res.json({
    success: true,
    data: { order },
  });
});

/**
 * PUT /api/purchase-orders/:orderId/status - Update order status
 */
router.put('/purchase-orders/:orderId/status', (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { status } = req.body;

  if (!['draft', 'sent', 'confirmed', 'partial', 'received', 'cancelled'].includes(status)) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid status value' },
    });
    return;
  }

  const order = updatePurchaseOrderStatus(orderId, status);
  if (!order) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Purchase order not found' },
    });
    return;
  }

  res.json({
    success: true,
    data: { order },
  });
});

// ============ Report Routes ============

/**
 * GET /api/reports/:restaurantId - Get inventory report
 */
router.get('/reports/:restaurantId', (req: Request, res: Response) => {
  const { restaurantId } = req.params;
  const report = getInventoryReport(restaurantId);

  res.json({
    success: true,
    data: { report },
  });
});

export default router;
