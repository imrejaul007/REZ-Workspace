import { Router, Request, Response } from 'express';
import { SparePart } from '../models';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validation';
import { createSparePartSchema, updateSparePartSchema, sparePartSearchSchema, paginationSchema } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { PartCategory } from '../types';
import logger from '../utils/logger';

const router = Router();

router.use(authenticate);

/**
 * GET /api/v1/spare-parts
 * List all spare parts with pagination
 */
router.get(
  '/',
  validate(sparePartSearchSchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 20, sortBy = 'name', sortOrder = 'asc' } = req.query as any;
    const { merchantId, category, lowStock, search } = req.query as any;

    const query: Record<string, unknown> = {};
    if (merchantId) query.merchantId = merchantId;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { partNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    let partsQuery = SparePart.find(query).sort(sort).skip(skip).limit(Number(limit));
    const total = await SparePart.countDocuments(query);

    if (lowStock === 'true') {
      const lowStockParts = await SparePart.getLowStockAlerts(merchantId);
      res.json({
        success: true,
        data: lowStockParts,
        count: lowStockParts.length,
        type: 'low_stock_alerts',
      });
      return;
    }

    const parts = await partsQuery;

    res.json({
      success: true,
      data: parts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  })
);

/**
 * GET /api/v1/spare-parts/low-stock
 * Get low stock alerts
 */
router.get(
  '/low-stock',
  asyncHandler(async (req: Request, res: Response) => {
    const { merchantId } = req.query as any;
    const alerts = await SparePart.getLowStockAlerts(merchantId);

    res.json({
      success: true,
      data: alerts,
      count: alerts.length,
    });
  })
);

/**
 * GET /api/v1/spare-parts/out-of-stock
 * Get out of stock parts
 */
router.get(
  '/out-of-stock',
  asyncHandler(async (req: Request, res: Response) => {
    const { merchantId } = req.query as any;
    const parts = await SparePart.getOutOfStock(merchantId);

    res.json({
      success: true,
      data: parts,
      count: parts.length,
    });
  })
);

/**
 * GET /api/v1/spare-parts/category/:category
 * Get parts by category
 */
router.get(
  '/category/:category',
  asyncHandler(async (req: Request, res: Response) => {
    const { category } = req.params;
    const { merchantId, page = 1, limit = 20 } = req.query as any;

    if (!['engine', 'brake', 'suspension', 'electrical', 'body', 'interior'].includes(category)) {
      res.status(400).json({
        success: false,
        error: 'Invalid category',
      });
      return;
    }

    const parts = await SparePart.getByCategory(category as PartCategory, merchantId);
    const skip = (Number(page) - 1) * Number(limit);
    const paginatedParts = parts.slice(skip, skip + Number(limit));

    res.json({
      success: true,
      data: paginatedParts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: parts.length,
        totalPages: Math.ceil(parts.length / Number(limit)),
      },
    });
  })
);

/**
 * GET /api/v1/spare-parts/inventory-value
 * Get inventory value summary
 */
router.get(
  '/inventory-value',
  asyncHandler(async (req: Request, res: Response) => {
    const { merchantId } = req.query as any;

    if (!merchantId) {
      res.status(400).json({
        success: false,
        error: 'Merchant ID required',
      });
      return;
    }

    const inventoryValue = await SparePart.getInventoryValue(merchantId);

    res.json({
      success: true,
      data: inventoryValue,
    });
  })
);

/**
 * GET /api/v1/spare-parts/:partId
 * Get spare part by ID
 */
router.get(
  '/:partId',
  asyncHandler(async (req: Request, res: Response) => {
    const { partId } = req.params;
    const part = await SparePart.findOne({ partId });

    if (!part) {
      res.status(404).json({
        success: false,
        error: 'Spare part not found',
      });
      return;
    }

    res.json({
      success: true,
      data: part,
    });
  })
);

/**
 * GET /api/v1/spare-parts/part-number/:partNumber
 * Get spare part by part number
 */
router.get(
  '/part-number/:partNumber',
  asyncHandler(async (req: Request, res: Response) => {
    const { partNumber } = req.params;
    const { merchantId } = req.query as any;

    const query: Record<string, unknown> = { partNumber: partNumber.toUpperCase() };
    if (merchantId) query.merchantId = merchantId;

    const part = await SparePart.findOne(query);

    if (!part) {
      res.status(404).json({
        success: false,
        error: 'Spare part not found',
      });
      return;
    }

    res.json({
      success: true,
      data: part,
    });
  })
);

/**
 * POST /api/v1/spare-parts
 * Add new spare part
 */
router.post(
  '/',
  validate(createSparePartSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const part = new SparePart(req.body);
    await part.save();

    logger.info('Spare part added', {
      partId: part.partId,
      merchantId: part.merchantId,
      name: part.name,
    });

    res.status(201).json({
      success: true,
      data: part,
      message: 'Spare part added successfully',
    });
  })
);

/**
 * PUT /api/v1/spare-parts/:partId
 * Update spare part
 */
router.put(
  '/:partId',
  validate(updateSparePartSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { partId } = req.params;
    const part = await SparePart.findOneAndUpdate(
      { partId },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!part) {
      res.status(404).json({
        success: false,
        error: 'Spare part not found',
      });
      return;
    }

    logger.info('Spare part updated', { partId });

    res.json({
      success: true,
      data: part,
      message: 'Spare part updated successfully',
    });
  })
);

/**
 * PATCH /api/v1/spare-parts/:partId/stock
 * Update stock quantity
 */
router.patch(
  '/:partId/stock',
  asyncHandler(async (req: Request, res: Response) => {
    const { partId } = req.params;
    const { adjustment, operation } = req.body;

    const part = await SparePart.findOne({ partId });
    if (!part) {
      res.status(404).json({
        success: false,
        error: 'Spare part not found',
      });
      return;
    }

    if (operation === 'reserve') {
      const success = await part.reserveStock(adjustment);
      if (!success) {
        res.status(400).json({
          success: false,
          error: 'Insufficient stock',
        });
        return;
      }
    } else if (operation === 'release') {
      await part.releaseStock(adjustment);
    } else {
      part.stock += adjustment;
      if (part.stock < 0) {
        res.status(400).json({
          success: false,
          error: 'Stock cannot be negative',
        });
        return;
      }
      await part.save();
    }

    res.json({
      success: true,
      data: part,
      message: `Stock ${operation || 'updated'} successfully`,
    });
  })
);

/**
 * DELETE /api/v1/spare-parts/:partId
 * Delete spare part
 */
router.delete(
  '/:partId',
  asyncHandler(async (req: Request, res: Response) => {
    const { partId } = req.params;
    const result = await SparePart.deleteOne({ partId });

    if (result.deletedCount === 0) {
      res.status(404).json({
        success: false,
        error: 'Spare part not found',
      });
      return;
    }

    logger.info('Spare part deleted', { partId });

    res.json({
      success: true,
      message: 'Spare part deleted successfully',
    });
  })
);

export default router;