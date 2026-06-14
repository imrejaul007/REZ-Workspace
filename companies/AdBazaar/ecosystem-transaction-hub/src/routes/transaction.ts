import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { transactionService } from '../services';
import {
  authMiddleware,
  validateBody,
  asyncHandler,
  NotFoundError,
} from '../middleware';
import { logger } from 'utils/logger.js';

const router = Router();

// Validation schemas
const InitiateTransactionSchema = z.object({
  adId: z.string().min(1, 'Ad ID is required'),
  campaignId: z.string().optional(),
  advertiserId: z.string().min(1, 'Advertiser ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  businessId: z.string().optional(),
  type: z.enum(['booking_deposit', 'order', 'appointment', 'subscription', 'tip']),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().optional(),
  paymentMethod: z.enum(['wallet', 'upi', 'card', 'netbanking']).optional(),
  metadata: z.object({
    productIds: z.array(z.string()).optional(),
    bookingId: z.string().optional(),
    adClickId: z.string().optional(),
    intentSignalId: z.string().optional(),
  }).optional(),
});

const ConfirmTransactionSchema = z.object({
  paymentReference: z.string().min(1, 'Payment reference is required'),
  paymentMethod: z.enum(['wallet', 'upi', 'card', 'netbanking']).optional(),
});

const CancelTransactionSchema = z.object({
  reason: z.string().optional(),
});

const RefundTransactionSchema = z.object({
  reason: z.string().optional(),
  refundAmount: z.number().positive().optional(),
});

const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  status: z.enum(['initiated', 'pending_payment', 'completed', 'failed', 'cancelled', 'refunded']).optional(),
  type: z.enum(['booking_deposit', 'order', 'appointment', 'subscription', 'tip']).optional(),
});

// POST /api/transaction/initiate - Initiate transaction from ad
router.post(
  '/initiate',
  authMiddleware,
  validateBody(InitiateTransactionSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const transaction = await transactionService.initiateTransaction(req.body);

    logger.info('Transaction initiated via API', {
      transactionId: transaction.transactionId,
      userId: req.user?.userId,
    });

    res.status(201).json({
      success: true,
      data: transaction,
    });
  })
);

// GET /api/transaction/:id - Get transaction details
router.get(
  '/:id',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const transaction = await transactionService.getTransaction(id);

    if (!transaction) {
      throw new NotFoundError('Transaction not found');
    }

    res.json({
      success: true,
      data: transaction,
    });
  })
);

// POST /api/transaction/:id/confirm - Confirm payment
router.post(
  '/:id/confirm',
  authMiddleware,
  validateBody(ConfirmTransactionSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { paymentReference, paymentMethod } = req.body;

    const transaction = await transactionService.confirmTransaction(
      id,
      paymentReference,
      paymentMethod
    );

    logger.info('Transaction confirmed via API', {
      transactionId: id,
      userId: req.user?.userId,
    });

    res.json({
      success: true,
      data: transaction,
    });
  })
);

// POST /api/transaction/:id/cancel - Cancel transaction
router.post(
  '/:id/cancel',
  authMiddleware,
  validateBody(CancelTransactionSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;

    const transaction = await transactionService.cancelTransaction(id, reason);

    logger.info('Transaction cancelled via API', {
      transactionId: id,
      userId: req.user?.userId,
    });

    res.json({
      success: true,
      data: transaction,
    });
  })
);

// POST /api/transaction/:id/refund - Refund transaction
router.post(
  '/:id/refund',
  authMiddleware,
  validateBody(RefundTransactionSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason, refundAmount } = req.body;

    const transaction = await transactionService.refundTransaction(id, reason, refundAmount);

    logger.info('Transaction refunded via API', {
      transactionId: id,
      userId: req.user?.userId,
    });

    res.json({
      success: true,
      data: transaction,
    });
  })
);

// GET /api/transaction/user/:userId - Get user transactions
router.get(
  '/user/:userId',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const queryParams = PaginationSchema.parse(req.query);

    // Users can only view their own transactions unless they're admin
    if (req.user?.userId !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only view your own transactions.',
      });
    }

    const result = await transactionService.getUserTransactions(userId, {
      page: queryParams.page,
      limit: queryParams.limit,
      status: queryParams.status as any,
      type: queryParams.type as any,
    });

    res.json({
      success: true,
      data: result,
    });
  })
);

// GET /api/transaction/ad/:adId - Get ad transactions
router.get(
  '/ad/:adId',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { adId } = req.params;
    const queryParams = PaginationSchema.parse(req.query);

    // Advertisers can only view transactions for their ads
    if (req.user?.advertiserId && req.query.requiresAdvertiser !== 'false') {
      // This would ideally check if the ad belongs to the advertiser
      // For now, we'll add a flag to skip this check for internal use
    }

    const result = await transactionService.getAdTransactions(adId, {
      page: queryParams.page,
      limit: queryParams.limit,
      status: queryParams.status as any,
    });

    res.json({
      success: true,
      data: result,
    });
  })
);

// GET /api/transaction/analytics - Get transaction analytics
router.get(
  '/analytics/advertiser/:advertiserId',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { advertiserId } = req.params;
    const { startDate, endDate } = req.query;

    // Only advertisers can view their own analytics
    if (req.user?.advertiserId !== advertiserId && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only view your own analytics.',
      });
    }

    const analytics = await transactionService.getAnalytics(
      advertiserId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json({
      success: true,
      data: analytics,
    });
  })
);

export default router;