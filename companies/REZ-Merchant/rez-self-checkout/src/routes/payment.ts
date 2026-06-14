import { Router, Request, Response, NextFunction } from 'express';
import { paymentService, PaymentMethod } from '../services/paymentService';
import { sessionService } from '../services/sessionService';

const router = Router();

// Error handling wrapper
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * POST /api/payment/initiate
 * Initiate a payment for a checkout session
 */
router.post(
  '/initiate',
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId, method, customerId } = req.body;

    if (!sessionId || !method) {
      res.status(400).json({
        success: false,
        error: 'sessionId and method are required',
      });
      return;
    }

    // Validate session exists and has items
    const session = await sessionService.getActiveSession(sessionId);

    if (session.items.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Cannot initiate payment for empty session',
      });
      return;
    }

    // Calculate fees
    const { fees, total } = paymentService.calculateFees(session.total, method as PaymentMethod);

    const paymentResponse = await paymentService.initiatePayment({
      sessionId,
      amount: session.total,
      currency: 'INR',
      method: method as PaymentMethod,
      customerId,
      metadata: {
        subtotal: session.subtotal,
        tax: session.tax,
        fees,
        totalWithFees: total,
        itemCount: session.items.length,
      },
    });

    if (paymentResponse.success) {
      res.json({
        success: true,
        data: {
          transactionId: paymentResponse.transactionId,
          status: paymentResponse.status,
          message: paymentResponse.message,
          gatewayReference: paymentResponse.gatewayReference,
          amount: session.total,
          fees,
          total,
          currency: 'INR',
        },
      });
    } else {
      res.status(400).json({
        success: false,
        error: paymentResponse.message,
      });
    }
  })
);

/**
 * POST /api/payment/confirm
 * Confirm a payment after processing
 */
router.post(
  '/confirm',
  asyncHandler(async (req: Request, res: Response) => {
    const { transactionId } = req.body;

    if (!transactionId) {
      res.status(400).json({
        success: false,
        error: 'transactionId is required',
      });
      return;
    }

    try {
      const confirmation = await paymentService.confirmPayment(transactionId);

      if (confirmation.status === 'completed') {
        res.json({
          success: true,
          data: {
            transactionId: confirmation.transactionId,
            status: confirmation.status,
            message: 'Payment confirmed successfully',
            confirmedAt: confirmation.confirmedAt,
          },
        });
      } else {
        res.status(400).json({
          success: false,
          error: `Payment status: ${confirmation.status}`,
        });
      }
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Payment confirmation failed',
      });
    }
  })
);

/**
 * POST /api/payment/fail
 * Handle payment failure
 */
router.post(
  '/fail',
  asyncHandler(async (req: Request, res: Response) => {
    const { transactionId, reason } = req.body;

    if (!transactionId) {
      res.status(400).json({
        success: false,
        error: 'transactionId is required',
      });
      return;
    }

    const result = await paymentService.handleFailure(
      transactionId,
      reason || 'Unknown error'
    );

    res.json({
      success: result.recorded,
      data: {
        message: result.message,
      },
    });
  })
);

/**
 * POST /api/payment/refund
 * Process a refund
 */
router.post(
  '/refund',
  asyncHandler(async (req: Request, res: Response) => {
    const { transactionId, amount } = req.body;

    if (!transactionId) {
      res.status(400).json({
        success: false,
        error: 'transactionId is required',
      });
      return;
    }

    const result = await paymentService.processRefund(transactionId, amount);

    if (result.success) {
      res.json({
        success: true,
        data: {
          refundId: result.refundId,
          message: result.message,
        },
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message,
      });
    }
  })
);

/**
 * GET /api/payment/status/:transactionId
 * Get payment status
 */
router.get(
  '/status/:transactionId',
  asyncHandler(async (req: Request, res: Response) => {
    const { transactionId } = req.params;

    if (!transactionId) {
      res.status(400).json({
        success: false,
        error: 'transactionId is required',
      });
      return;
    }

    try {
      const status = await paymentService.getPaymentStatus(transactionId);

      res.json({
        success: true,
        data: {
          transactionId,
          status,
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get payment status',
      });
    }
  })
);

/**
 * POST /api/payment/fees
 * Calculate payment fees
 */
router.post(
  '/fees',
  asyncHandler(async (req: Request, res: Response) => {
    const { amount, method } = req.body;

    if (!amount || !method) {
      res.status(400).json({
        success: false,
        error: 'amount and method are required',
      });
      return;
    }

    const { fees, total } = paymentService.calculateFees(amount, method as PaymentMethod);

    res.json({
      success: true,
      data: {
        amount,
        method,
        fees,
        total,
        currency: 'INR',
      },
    });
  })
);

export default router;
