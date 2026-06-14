import { Router, Request, Response, NextFunction } from 'express';
import { stockService } from '../services/stockService';
import { Types } from 'mongoose';

const router = Router();

// Middleware to handle async errors
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * @route   POST /api/stock/add
 * @desc    Add stock to a SKU
 * @access  Public
 */
router.post(
  '/add',
  asyncHandler(async (req: Request, res: Response) => {
    const { skuId, storeId, quantity, batchInfo } = req.body;

    if (!skuId || !storeId || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'skuId, storeId, and quantity are required',
      });
    }

    if (!Types.ObjectId.isValid(skuId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid skuId format',
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be greater than 0',
      });
    }

    const result = await stockService.addStock(skuId, storeId, quantity, batchInfo);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    res.json({
      success: true,
      message: result.message,
      data: {
        previousQuantity: result.previousQuantity,
        newQuantity: result.newQuantity,
        stock: result.stock,
      },
    });
  })
);

/**
 * @route   POST /api/stock/deduct
 * @desc    Deduct stock from a SKU
 * @access  Public
 */
router.post(
  '/deduct',
  asyncHandler(async (req: Request, res: Response) => {
    const { skuId, storeId, quantity, reason } = req.body;

    if (!skuId || !storeId || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'skuId, storeId, and quantity are required',
      });
    }

    if (!Types.ObjectId.isValid(skuId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid skuId format',
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be greater than 0',
      });
    }

    const result = await stockService.deductStock(skuId, storeId, quantity, reason);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    res.json({
      success: true,
      message: result.message,
      data: {
        previousQuantity: result.previousQuantity,
        newQuantity: result.newQuantity,
        stock: result.stock,
      },
    });
  })
);

/**
 * @route   POST /api/stock/reserve
 * @desc    Reserve stock for an order
 * @access  Public
 */
router.post(
  '/reserve',
  asyncHandler(async (req: Request, res: Response) => {
    const { skuId, storeId, quantity } = req.body;

    if (!skuId || !storeId || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'skuId, storeId, and quantity are required',
      });
    }

    const result = await stockService.reserveStock(skuId, storeId, quantity);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    res.json({
      success: true,
      message: result.message,
      data: {
        previousReserved: result.previousQuantity,
        newReserved: result.newQuantity,
        stock: result.stock,
      },
    });
  })
);

/**
 * @route   POST /api/stock/release
 * @desc    Release reserved stock
 * @access  Public
 */
router.post(
  '/release',
  asyncHandler(async (req: Request, res: Response) => {
    const { skuId, storeId, quantity } = req.body;

    if (!skuId || !storeId || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'skuId, storeId, and quantity are required',
      });
    }

    const result = await stockService.releaseStock(skuId, storeId, quantity);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    res.json({
      success: true,
      message: result.message,
      data: {
        previousReserved: result.previousQuantity,
        newReserved: result.newQuantity,
        stock: result.stock,
      },
    });
  })
);

/**
 * @route   GET /api/stock/:skuId
 * @desc    Get stock level for a SKU
 * @access  Public
 */
router.get(
  '/:skuId',
  asyncHandler(async (req: Request, res: Response) => {
    const { skuId } = req.params;
    const { storeId } = req.query;

    if (!Types.ObjectId.isValid(skuId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid skuId format',
      });
    }

    const stock = await stockService.getStockLevel(skuId, storeId as string);

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: 'Stock record not found',
      });
    }

    res.json({
      success: true,
      data: stock,
    });
  })
);

/**
 * @route   GET /api/stock/:skuId/batches
 * @desc    Get stock with batch information
 * @access  Public
 */
router.get(
  '/:skuId/batches',
  asyncHandler(async (req: Request, res: Response) => {
    const { skuId } = req.params;
    const { storeId } = req.query;

    if (!Types.ObjectId.isValid(skuId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid skuId format',
      });
    }

    const result = await stockService.getStockWithBatches(skuId, storeId as string);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Stock record not found',
      });
    }

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * @route   GET /api/stock/store/:storeId/levels
 * @desc    Get all stock levels in a store
 * @access  Public
 */
router.get(
  '/store/:storeId/levels',
  asyncHandler(async (req: Request, res: Response) => {
    const stocks = await stockService.getStoreStockLevels(req.params.storeId);

    res.json({
      success: true,
      data: stocks,
      count: stocks.length,
    });
  })
);

/**
 * @route   POST /api/stock/transfer
 * @desc    Transfer stock between stores
 * @access  Public
 */
router.post(
  '/transfer',
  asyncHandler(async (req: Request, res: Response) => {
    const { fromStoreId, toStoreId, skuId, quantity, reason } = req.body;

    if (!fromStoreId || !toStoreId || !skuId || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'fromStoreId, toStoreId, skuId, and quantity are required',
      });
    }

    if (fromStoreId === toStoreId) {
      return res.status(400).json({
        success: false,
        message: 'Source and destination stores must be different',
      });
    }

    if (!Types.ObjectId.isValid(skuId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid skuId format',
      });
    }

    const result = await stockService.transferStock({
      fromStoreId,
      toStoreId,
      skuId,
      quantity,
      reason,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    res.json({
      success: true,
      message: result.message,
      data: {
        fromStock: result.fromStock,
        toStock: result.toStock,
      },
    });
  })
);

/**
 * @route   GET /api/stock/low-stock
 * @desc    Get low stock items
 * @access  Public
 */
router.get(
  '/alerts/low-stock',
  asyncHandler(async (req: Request, res: Response) => {
    const { storeId } = req.query;
    const items = await stockService.getLowStockItems(storeId as string);

    res.json({
      success: true,
      data: items,
      count: items.length,
    });
  })
);

/**
 * @route   POST /api/stock/adjust
 * @desc    Adjust stock (inventory count correction)
 * @access  Public
 */
router.post(
  '/adjust',
  asyncHandler(async (req: Request, res: Response) => {
    const { skuId, storeId, newQuantity, reason } = req.body;

    if (!skuId || !storeId || newQuantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'skuId, storeId, and newQuantity are required',
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Reason is required for stock adjustment',
      });
    }

    if (!Types.ObjectId.isValid(skuId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid skuId format',
      });
    }

    const result = await stockService.adjustStock(skuId, storeId, newQuantity, reason);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    res.json({
      success: true,
      message: result.message,
      data: {
        previousQuantity: result.previousQuantity,
        newQuantity: result.newQuantity,
        stock: result.stock,
      },
    });
  })
);

export default router;
