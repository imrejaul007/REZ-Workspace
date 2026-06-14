import { Router, Request, Response, NextFunction } from 'express';
import { transferService } from '../services/transferService';
import { Types } from 'mongoose';

const router = Router();

// Middleware to handle async errors
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * @route   POST /api/transfers
 * @desc    Create a new transfer request
 * @access  Public
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { fromStoreId, toStoreId, items, requestedBy, notes } = req.body;

    if (!fromStoreId || !toStoreId || !items || !requestedBy) {
      return res.status(400).json({
        success: false,
        message: 'fromStoreId, toStoreId, items, and requestedBy are required',
      });
    }

    if (fromStoreId === toStoreId) {
      return res.status(400).json({
        success: false,
        message: 'Source and destination stores must be different',
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one item is required',
      });
    }

    // Validate each item
    for (const item of items) {
      if (!item.skuId || !item.sku || !item.requestedQuantity) {
        return res.status(400).json({
          success: false,
          message: 'Each item must have skuId, sku, and requestedQuantity',
        });
      }

      if (!Types.ObjectId.isValid(item.skuId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid SKU ID format: ${item.skuId}`,
        });
      }

      if (item.requestedQuantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Requested quantity must be greater than 0',
        });
      }
    }

    const transfer = await transferService.requestTransfer({
      fromStoreId,
      toStoreId,
      items,
      requestedBy,
      notes,
    });

    res.status(201).json({
      success: true,
      message: 'Transfer request created successfully',
      data: transfer,
    });
  })
);

/**
 * @route   GET /api/transfers
 * @desc    Get transfers with optional filters
 * @access  Public
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { storeId, status, fromStoreId, toStoreId } = req.query;

    const transfers = await transferService.getTransfers({
      storeId: storeId as string,
      status: status as string,
      fromStoreId: fromStoreId as string,
      toStoreId: toStoreId as string,
    });

    res.json({
      success: true,
      data: transfers,
      count: transfers.length,
    });
  })
);

/**
 * @route   GET /api/transfers/pending
 * @desc    Get pending transfers for a store
 * @access  Public
 */
router.get(
  '/pending',
  asyncHandler(async (req: Request, res: Response) => {
    const { storeId } = req.query;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'storeId query parameter is required',
      });
    }

    const transfers = await transferService.getPending(storeId as string);

    res.json({
      success: true,
      data: transfers,
      count: transfers.length,
    });
  })
);

/**
 * @route   GET /api/transfers/:id
 * @desc    Get transfer by ID
 * @access  Public
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transfer ID format',
      });
    }

    const transfer = await transferService.getById(id);

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Transfer not found',
      });
    }

    res.json({
      success: true,
      data: transfer,
    });
  })
);

/**
 * @route   PUT /api/transfers/:id/approve
 * @desc    Approve a transfer request
 * @access  Public
 */
router.put(
  '/:id/approve',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { approvedBy } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transfer ID format',
      });
    }

    if (!approvedBy) {
      return res.status(400).json({
        success: false,
        message: 'approvedBy is required',
      });
    }

    const transfer = await transferService.approve(id, approvedBy);

    res.json({
      success: true,
      message: 'Transfer approved successfully',
      data: transfer,
    });
  })
);

/**
 * @route   PUT /api/transfers/:id/dispatch
 * @desc    Dispatch a transfer (deduct from source store)
 * @access  Public
 */
router.put(
  '/:id/dispatch',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transfer ID format',
      });
    }

    const transfer = await transferService.dispatch(id);

    res.json({
      success: true,
      message: 'Transfer dispatched successfully',
      data: transfer,
    });
  })
);

/**
 * @route   PUT /api/transfers/:id/receive
 * @desc    Receive a transfer (add to destination store)
 * @access  Public
 */
router.put(
  '/:id/receive',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transfer ID format',
      });
    }

    const transfer = await transferService.receive(id);

    res.json({
      success: true,
      message: 'Transfer received successfully',
      data: transfer,
    });
  })
);

/**
 * @route   PUT /api/transfers/:id/cancel
 * @desc    Cancel a transfer
 * @access  Public
 */
router.put(
  '/:id/cancel',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason, cancelledBy } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transfer ID format',
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Cancellation reason is required',
      });
    }

    const transfer = await transferService.cancel(id, reason, cancelledBy);

    res.json({
      success: true,
      message: 'Transfer cancelled successfully',
      data: transfer,
    });
  })
);

/**
 * @route   PUT /api/transfers/:id/items
 * @desc    Update transfer items (only for pending transfers)
 * @access  Public
 */
router.put(
  '/:id/items',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { items } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transfer ID format',
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one item is required',
      });
    }

    // Validate each item
    for (const item of items) {
      if (!item.skuId || !item.sku || !item.requestedQuantity) {
        return res.status(400).json({
          success: false,
          message: 'Each item must have skuId, sku, and requestedQuantity',
        });
      }

      if (!Types.ObjectId.isValid(item.skuId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid SKU ID format: ${item.skuId}`,
        });
      }

      if (item.requestedQuantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Requested quantity must be greater than 0',
        });
      }
    }

    const transfer = await transferService.updateItems(id, items);

    res.json({
      success: true,
      message: 'Transfer items updated successfully',
      data: transfer,
    });
  })
);

export default router;
