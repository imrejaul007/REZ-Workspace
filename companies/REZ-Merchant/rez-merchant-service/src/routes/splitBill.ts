/**
 * Split Bill Routes
 *
 * API endpoints for bill splitting operations.
 * Handles split creation, status retrieval, and payment marking.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { SplitBillService, SplitInput } from '../services/splitBillService';
import { Order } from '../models/Order';
import { authMiddleware as merchantAuth } from '../middleware/auth';
import { logger } from '../config/logger';

const router = Router();
const splitBillService = new SplitBillService();

// Extend Express Request to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    merchantId?: string;
    [key: string]: unknown;
  };
}

/**
 * Validation middleware for split input
 */
function validateSplitInput(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const { splits } = req.body;

  if (!splits || !Array.isArray(splits)) {
    res.status(400).json({
      success: false,
      error: 'Invalid input: splits must be an array',
    });
    return;
  }

  if (splits.length === 0) {
    res.status(400).json({
      success: false,
      error: 'At least one split is required',
    });
    return;
  }

  for (let i = 0; i < splits.length; i++) {
    const split = splits[i];

    if (typeof split.amount !== 'number' || split.amount <= 0) {
      res.status(400).json({
        success: false,
        error: `Split ${i + 1}: amount must be a positive number`,
      });
      return;
    }

    const validMethods = ['upi', 'card', 'wallet', 'cash'];
    if (!validMethods.includes(split.method)) {
      res.status(400).json({
        success: false,
        error: `Split ${i + 1}: method must be one of ${validMethods.join(', ')}`,
      });
      return;
    }
  }

  next();
}

/**
 * POST /:orderId/split
 * Create a new split for an order
 */
router.post(
  '/:orderId/split',
  merchantAuth,
  validateSplitInput,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { orderId } = req.params;
      const { splits } = req.body as { splits: SplitInput[] };

      // Verify order belongs to merchant
      const order = await Order.findById(orderId);
      if (!order) {
        res.status(404).json({
          success: false,
          error: 'Order not found',
        });
        return;
      }

      // Create split
      const splitBill = await splitBillService.createSplit(orderId, splits);

      logger.info('[SplitBill API] Split created', {
        orderId,
        merchantId: req.user?.merchantId,
        splitId: splitBill._id,
      });

      res.status(201).json({
        success: true,
        data: {
          id: splitBill._id,
          orderId: splitBill.orderId,
          totalAmount: splitBill.totalAmount,
          splits: splitBill.splits.map((s, index) => ({
            index,
            userId: s.userId,
            amount: s.amount,
            method: s.method,
            status: s.status,
            paidAt: s.paidAt,
          })),
          status: splitBill.status,
          createdAt: splitBill.createdAt,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error('[SplitBill API] Create split failed', {
        orderId: req.params.orderId,
        error: errorMessage,
      });

      if (errorMessage.includes('not found')) {
        res.status(404).json({
          success: false,
          error: errorMessage,
        });
        return;
      }

      if (errorMessage.includes('already split')) {
        res.status(409).json({
          success: false,
          error: errorMessage,
        });
        return;
      }

      res.status(400).json({
        success: false,
        error: errorMessage,
      });
    }
  }
);

/**
 * GET /:orderId/split
 * Get split status for an order
 */
router.get(
  '/:orderId/split',
  merchantAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { orderId } = req.params;

      const splitBill = await splitBillService.getSplitStatus(orderId);

      if (!splitBill) {
        res.status(404).json({
          success: false,
          error: 'No split found for this order',
        });
        return;
      }

      // Get statistics
      const stats = await splitBillService.getSplitStatistics(orderId);

      res.json({
        success: true,
        data: {
          id: splitBill._id,
          orderId: splitBill.orderId,
          totalAmount: splitBill.totalAmount,
          splits: splitBill.splits.map((s, index) => ({
            index,
            userId: s.userId,
            amount: s.amount,
            method: s.method,
            status: s.status,
            paidAt: s.paidAt,
          })),
          status: splitBill.status,
          createdAt: splitBill.createdAt,
          updatedAt: splitBill.updatedAt,
          statistics: stats,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error('[SplitBill API] Get split failed', {
        orderId: req.params.orderId,
        error: errorMessage,
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve split status',
      });
    }
  }
);

/**
 * POST /:orderId/split/pay
 * Mark a split as paid (by userId in body)
 */
router.post(
  '/:orderId/split/pay',
  merchantAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { orderId } = req.params;
      const { userId, splitIndex } = req.body;

      // Get split bill
      const splitBill = await splitBillService.getSplitStatus(orderId);

      if (!splitBill) {
        res.status(404).json({
          success: false,
          error: 'No split found for this order',
        });
        return;
      }

      // Mark as paid by userId or index
      let updatedSplitBill;
      if (splitIndex !== undefined && typeof splitIndex === 'number') {
        updatedSplitBill = await splitBillService.markPaidByIndex(
          splitBill._id.toString(),
          splitIndex
        );
      } else if (userId) {
        updatedSplitBill = await splitBillService.markPaid(splitBill._id.toString(), userId);
      } else {
        res.status(400).json({
          success: false,
          error: 'Either userId or splitIndex is required',
        });
        return;
      }

      logger.info('[SplitBill API] Payment marked', {
        orderId,
        merchantId: req.user?.merchantId,
        userId: userId || `index:${splitIndex}`,
      });

      res.json({
        success: true,
        data: {
          id: updatedSplitBill._id,
          orderId: updatedSplitBill.orderId,
          status: updatedSplitBill.status,
          splits: updatedSplitBill.splits.map((s, index) => ({
            index,
            userId: s.userId,
            amount: s.amount,
            method: s.method,
            status: s.status,
            paidAt: s.paidAt,
          })),
        },
        message: 'Payment marked successfully',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error('[SplitBill API] Mark paid failed', {
        orderId: req.params.orderId,
        error: errorMessage,
      });

      if (errorMessage.includes('not found')) {
        res.status(404).json({
          success: false,
          error: errorMessage,
        });
        return;
      }

      if (errorMessage.includes('already paid')) {
        res.status(409).json({
          success: false,
          error: errorMessage,
        });
        return;
      }

      res.status(400).json({
        success: false,
        error: errorMessage,
      });
    }
  }
);

/**
 * GET /:orderId/split/calculate
 * Calculate fair split without saving
 */
router.get(
  '/:orderId/split/calculate',
  merchantAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { orderId } = req.params;
      const { people, method } = req.query;

      const peopleCount = parseInt(people as string, 10) || 2;
      const paymentMethod = (method as string) || 'upi';

      const validMethods = ['upi', 'card', 'wallet', 'cash'];
      if (!validMethods.includes(paymentMethod)) {
        res.status(400).json({
          success: false,
          error: `Invalid method. Must be one of: ${validMethods.join(', ')}`,
        });
        return;
      }

      // Get order total
      const order = await Order.findById(orderId);
      if (!order) {
        res.status(404).json({
          success: false,
          error: 'Order not found',
        });
        return;
      }

      const fairSplit = splitBillService.calculateFairSplit(
        order.totals.total,
        peopleCount,
        paymentMethod as 'upi' | 'card' | 'wallet' | 'cash'
      );

      res.json({
        success: true,
        data: {
          orderId,
          totalAmount: order.totals.total,
          peopleCount,
          perPerson: fairSplit.perPerson,
          remainder: fairSplit.remainder,
          splits: fairSplit.splits.map((s, index) => ({
            index,
            amount: s.amount,
            method: s.method,
          })),
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error('[SplitBill API] Calculate split failed', {
        orderId: req.params.orderId,
        error: errorMessage,
      });

      res.status(400).json({
        success: false,
        error: errorMessage,
      });
    }
  }
);

/**
 * DELETE /:orderId/split
 * Cancel/delete a split bill
 */
router.delete(
  '/:orderId/split',
  merchantAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { orderId } = req.params;

      await splitBillService.cancelSplit(orderId);

      logger.info('[SplitBill API] Split cancelled', {
        orderId,
        merchantId: req.user?.merchantId,
      });

      res.json({
        success: true,
        message: 'Split cancelled successfully',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error('[SplitBill API] Cancel split failed', {
        orderId: req.params.orderId,
        error: errorMessage,
      });

      if (errorMessage.includes('not found')) {
        res.status(404).json({
          success: false,
          error: errorMessage,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Failed to cancel split',
      });
    }
  }
);

/**
 * PATCH /:orderId/split/:userId
 * Update a specific user's split entry
 */
router.patch(
  '/:orderId/split/:userId',
  merchantAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { orderId, userId } = req.params;
      const updates = req.body as Partial<SplitInput>;

      const updatedSplitBill = await splitBillService.updateSplitEntry(
        orderId,
        userId,
        updates
      );

      logger.info('[SplitBill API] Split entry updated', {
        orderId,
        userId,
        merchantId: req.user?.merchantId,
      });

      res.json({
        success: true,
        data: {
          id: updatedSplitBill._id,
          orderId: updatedSplitBill.orderId,
          status: updatedSplitBill.status,
          splits: updatedSplitBill.splits.map((s, index) => ({
            index,
            userId: s.userId,
            amount: s.amount,
            method: s.method,
            status: s.status,
            paidAt: s.paidAt,
          })),
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error('[SplitBill API] Update split failed', {
        orderId: req.params.orderId,
        userId: req.params.userId,
        error: errorMessage,
      });

      res.status(400).json({
        success: false,
        error: errorMessage,
      });
    }
  }
);

export default router;
