import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { InventoryItem, InventoryItemZodSchema, calculateStockLevel, IInventoryItem } from '../models/index.js';

const router = Router();

// Validation schemas
const createInventorySchema = InventoryItemZodSchema.omit({ stockLevel: true });

const updateInventorySchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  price: z.number().positive().optional(),
  mrp: z.number().positive().optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  expiryDate: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
  batchNumber: z.string().optional(),
});

const updateStockSchema = z.object({
  quantity: z.number().int().min(0, 'Quantity must be a non-negative integer'),
});

const adjustStockSchema = z.object({
  adjustment: z.number().int('Adjustment must be an integer'),
  reason: z.string().optional(),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  storeId: z.string().optional(),
  category: z.string().optional(),
  stockLevel: z.enum(['in_stock', 'low_stock', 'out_of_stock']).optional(),
});

// Error handler wrapper
function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Response helpers
function successResponse<T>(res: Response, data: T, message = 'Success') {
  return res.status(200).json({
    success: true,
    message,
    data,
  });
}

function createdResponse<T>(res: Response, data: T, message = 'Created') {
  return res.status(201).json({
    success: true,
    message,
    data,
  });
}

// POST / - Add inventory item
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const validatedData = createInventorySchema.parse(req.body);

    // Check if item already exists
    const existingItem = await InventoryItem.findOne({ itemId: validatedData.itemId });
    if (existingItem) {
      return res.status(409).json({
        success: false,
        message: 'Item with this ID already exists',
        error: 'DUPLICATE_ITEM',
      });
    }

    // Calculate initial stock level
    const stockLevel = calculateStockLevel(validatedData.quantity, validatedData.lowStockThreshold);

    const item = new InventoryItem({
      ...validatedData,
      stockLevel,
    });

    await item.save();

    return createdResponse(res, item, 'Inventory item created successfully');
  })
);

// GET / - List all items with pagination and filters
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, storeId, category, stockLevel } = paginationSchema.parse(req.query);

    const filter: Record<string, unknown> = {};
    if (storeId) filter.storeId = storeId;
    if (category) filter.category = category;
    if (stockLevel) filter.stockLevel = stockLevel;

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      InventoryItem.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      InventoryItem.countDocuments(filter),
    ]);

    return successResponse(res, {
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    }, 'Inventory items retrieved successfully');
  })
);

// GET /:id - Get item by ID
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const item = await InventoryItem.findOne({ itemId: id }).lean();

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
        error: 'ITEM_NOT_FOUND',
      });
    }

    return successResponse(res, item, 'Inventory item retrieved successfully');
  })
);

// GET /store/:storeId - Get items by store
router.get(
  '/store/:storeId',
  asyncHandler(async (req: Request, res: Response) => {
    const { storeId } = req.params;
    const { page, limit, category, stockLevel } = paginationSchema.parse(req.query);

    const filter: Record<string, unknown> = { storeId };
    if (category) filter.category = category;
    if (stockLevel) filter.stockLevel = stockLevel;

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      InventoryItem.find(filter)
        .sort({ category: 1, name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      InventoryItem.countDocuments(filter),
    ]);

    return successResponse(res, {
      items,
      storeId,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    }, 'Store inventory items retrieved successfully');
  })
);

// GET /store/:storeId/low-stock - Get low stock items for a store
router.get(
  '/store/:storeId/low-stock',
  asyncHandler(async (req: Request, res: Response) => {
    const { storeId } = req.params;

    const items = await InventoryItem.findLowStockByStore(storeId);

    return successResponse(res, {
      items,
      storeId,
      count: items.length,
    }, 'Low stock items retrieved successfully');
  })
);

// PATCH /:id - Update item
router.patch(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const validatedData = updateInventorySchema.parse(req.body);

    const item = await InventoryItem.findOne({ itemId: id });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
        error: 'ITEM_NOT_FOUND',
      });
    }

    // Update fields
    Object.keys(validatedData).forEach((key) => {
      const k = key as keyof typeof validatedData;
      if (validatedData[k] !== undefined) {
        (item as Record<string, unknown>)[k] = validatedData[k];
      }
    });

    // Recalculate stock level if threshold changed
    if (validatedData.lowStockThreshold !== undefined) {
      item.stockLevel = calculateStockLevel(item.quantity, item.lowStockThreshold);
    }

    await item.save();

    return successResponse(res, item, 'Inventory item updated successfully');
  })
);

// PATCH /:id/stock - Update stock quantity
router.patch(
  '/:id/stock',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { quantity } = updateStockSchema.parse(req.body);

    const item = await InventoryItem.findOne({ itemId: id });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
        error: 'ITEM_NOT_FOUND',
      });
    }

    item.updateStock(quantity);
    await item.save();

    return successResponse(res, item, 'Stock quantity updated successfully');
  })
);

// PATCH /:id/adjust - Adjust stock (add/remove)
router.patch(
  '/:id/adjust',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { adjustment, reason } = adjustStockSchema.parse(req.body);

    const item = await InventoryItem.findOne({ itemId: id });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
        error: 'ITEM_NOT_FOUND',
      });
    }

    try {
      item.adjustStock(adjustment);
      await item.save();

      return successResponse(res, {
        item,
        adjustment,
        previousQuantity: item.quantity - adjustment,
        newQuantity: item.quantity,
        reason,
      }, 'Stock adjusted successfully');
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to adjust stock',
        error: 'STOCK_ADJUSTMENT_FAILED',
      });
    }
  })
);

// DELETE /:id - Delete item
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const item = await InventoryItem.findOneAndDelete({ itemId: id });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
        error: 'ITEM_NOT_FOUND',
      });
    }

    return successResponse(res, { deletedItemId: id }, 'Inventory item deleted successfully');
  })
);

// GET /alerts/low-stock - Get all low stock alerts
router.get(
  '/alerts/low-stock',
  asyncHandler(async (req: Request, res: Response) => {
    const { storeId, page, limit } = {
      ...paginationSchema.parse(req.query),
      ...req.query,
    };

    const filter: Record<string, unknown> = {
      stockLevel: { $in: ['low_stock', 'out_of_stock'] },
    };
    if (storeId) filter.storeId = storeId;

    const skip = ((page as number) - 1) * (limit as number);

    const [items, total] = await Promise.all([
      InventoryItem.find(filter)
        .sort({ quantity: 1, storeId: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      InventoryItem.countDocuments(filter),
    ]);

    // Group by store
    const byStore = items.reduce((acc, item) => {
      if (!acc[item.storeId]) {
        acc[item.storeId] = [];
      }
      acc[item.storeId].push(item);
      return acc;
    }, {} as Record<string, IInventoryItem[]>);

    return successResponse(res, {
      items,
      byStore,
      summary: {
        totalAlerts: total,
        outOfStock: items.filter(i => i.stockLevel === 'out_of_stock').length,
        lowStock: items.filter(i => i.stockLevel === 'low_stock').length,
        storesAffected: Object.keys(byStore).length,
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }, 'Low stock alerts retrieved successfully');
  })
);

export default router;
