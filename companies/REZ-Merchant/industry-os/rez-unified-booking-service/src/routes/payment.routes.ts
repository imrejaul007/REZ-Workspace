import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { processPayment, processRefund, calculateRefund } from '../services/paymentService';
import { getBookingById } from '../services/bookingService';
import { createLogger } from '../utils/logger';

const logger = createLogger('payment-routes');
const router = Router();

// ============================================
// Validation Schemas
// ============================================

const paymentSchema = z.object({
  paymentMethod: z.string().min(1, 'Payment method is required'),
  paymentDetails: z.record(z.unknown()).optional(),
});

const refundSchema = z.object({
  amount: z.number().positive().optional(),
  reason: z.string().max(500).optional(),
});

// ============================================
// Route Handlers
// ============================================

/**
 * POST /api/v1/bookings/:bookingId/pay
 * Process payment for a booking
 */
router.post(
  '/:bookingId/pay',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const requestId = req.requestId || uuidv4();
    const startTime = Date.now();
    const { bookingId } = req.params;

    try {
      const validationResult = paymentSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: validationResult.error.errors,
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId,
          },
        });
        return;
      }

      const { paymentMethod, paymentDetails } = validationResult.data;

      // First, verify the booking exists
      const booking = await getBookingById(bookingId);

      if (!booking) {
        res.status(404).json({
          success: false,
          error: {
            code: 'BOOKING_NOT_FOUND',
            message: `Booking with ID ${bookingId} not found`,
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId,
          },
        });
        return;
      }

      logger.info('Processing payment', {
        requestId,
        bookingId,
        paymentMethod,
        amount: booking.totalAmount - booking.amountPaid,
        currency: booking.currency,
      });

      const result = await processPayment(bookingId, paymentMethod, paymentDetails);

      const duration = Date.now() - startTime;

      logger.info('Payment processed', {
        requestId,
        bookingId,
        paymentId: result.paymentId,
        status: result.status,
        durationMs: duration,
      });

      if (result.status === 'failed') {
        res.status(402).json({
          success: false,
          error: {
            code: 'PAYMENT_FAILED',
            message: result.errorMessage || 'Payment processing failed',
          },
          data: {
            paymentId: result.paymentId,
            status: result.status,
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId,
          },
        });
        return;
      }

      res.json({
        success: true,
        data: {
          paymentId: result.paymentId,
          status: result.status,
          amount: result.amount,
          currency: result.currency,
          transactionId: result.transactionId,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
          durationMs: duration,
        },
      });
    } catch (error) {
      logger.error('Payment processing failed', {
        requestId,
        bookingId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(error);
    }
  }
);

/**
 * POST /api/v1/bookings/:bookingId/refund
 * Process refund for a booking
 */
router.post(
  '/:bookingId/refund',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const requestId = req.requestId || uuidv4();
    const startTime = Date.now();
    const { bookingId } = req.params;

    try {
      const validationResult = refundSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: validationResult.error.errors,
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId,
          },
        });
        return;
      }

      const { amount, reason } = validationResult.data;

      // First, verify the booking exists
      const booking = await getBookingById(bookingId);

      if (!booking) {
        res.status(404).json({
          success: false,
          error: {
            code: 'BOOKING_NOT_FOUND',
            message: `Booking with ID ${bookingId} not found`,
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId,
          },
        });
        return;
      }

      logger.info('Processing refund', {
        requestId,
        bookingId,
        requestedAmount: amount,
        reason,
        currentAmountPaid: booking.amountPaid,
      });

      const result = await processRefund(bookingId, amount, reason);

      const duration = Date.now() - startTime;

      logger.info('Refund processed', {
        requestId,
        bookingId,
        refundId: result.refundId,
        status: result.status,
        amount: result.amount,
        durationMs: duration,
      });

      if (result.status === 'failed') {
        res.status(402).json({
          success: false,
          error: {
            code: 'REFUND_FAILED',
            message: result.errorMessage || 'Refund processing failed',
          },
          data: {
            refundId: result.refundId,
            status: result.status,
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId,
          },
        });
        return;
      }

      res.json({
        success: true,
        data: {
          refundId: result.refundId,
          status: result.status,
          amount: result.amount,
          currency: result.currency,
          transactionId: result.transactionId,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
          durationMs: duration,
        },
      });
    } catch (error) {
      logger.error('Refund processing failed', {
        requestId,
        bookingId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(error);
    }
  }
);

/**
 * GET /api/v1/bookings/:bookingId/refund/calculate
 * Calculate refund amount for a booking
 */
router.get(
  '/:bookingId/refund/calculate',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const requestId = req.requestId || uuidv4();
    const { bookingId } = req.params;

    try {
      const booking = await getBookingById(bookingId);

      if (!booking) {
        res.status(404).json({
          success: false,
          error: {
            code: 'BOOKING_NOT_FOUND',
            message: `Booking with ID ${bookingId} not found`,
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId,
          },
        });
        return;
      }

      logger.info('Calculating refund', { requestId, bookingId });

      const refundInfo = await calculateRefund(bookingId);

      res.json({
        success: true,
        data: refundInfo,
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
        },
      });
    } catch (error) {
      logger.error('Refund calculation failed', {
        requestId,
        bookingId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(error);
    }
  }
);

export default router;