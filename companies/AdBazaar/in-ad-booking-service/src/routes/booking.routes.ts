/**
 * Booking routes for in-ad-booking-service
 */

import { Router, Request, Response } from 'express';
import { bookingService } from '../services';
import { authenticate, optionalAuth } from '../middleware';
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import {
  createBookingSchema,
  getBookingSchema,
  cancelBookingSchema,
  confirmBookingSchema,
  getUserBookingsSchema,
  getAdBookingsSchema,
  paymentSchema,
} from '../middleware/validation';
import { bookingCreatedTotal, bookingStatusTotal } from '../middleware/metrics';
import logger from '../utils/logger';

const router = Router();

/**
 * POST /api/booking/create
 * Create a new booking from an ad
 */
router.post(
  '/create',
  optionalAuth,
  validateBody(createBookingSchema),
  async (req: Request, res: Response) => {
    try {
      const { adId, advertiserId, userId, businessId, type, details, paymentRequired, paymentAmount } = req.body;

      const result = await bookingService.createBooking({
        adId,
        advertiserId,
        userId,
        businessId,
        type,
        details: {
          date: details.date ? new Date(details.date) : undefined,
          time: details.time,
          guests: details.guests,
          service: details.service,
          notes: details.notes,
        },
        paymentRequired,
        paymentAmount,
      });

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      // Track metrics
      bookingCreatedTotal.inc({ type, status: result.data?.status });

      res.status(201).json(result);
    } catch (error) {
      logger.error('Create booking route error', { error: error instanceof Error ? error.message : 'Unknown' });
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

/**
 * GET /api/booking/:id
 * Get booking details
 */
router.get(
  '/:id',
  optionalAuth,
  validateParams(getBookingSchema),
  async (req: Request, res: Response) => {
    try {
      const result = await bookingService.getBooking(req.params.id);

      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      logger.error('Get booking route error', { error: error instanceof Error ? error.message : 'Unknown' });
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

/**
 * PUT /api/booking/:id/cancel
 * Cancel a booking
 */
router.put(
  '/:id/cancel',
  optionalAuth,
  validateParams(cancelBookingSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId || req.body.userId;
      if (!userId) {
        res.status(400).json({ success: false, error: 'User ID required' });
        return;
      }

      const result = await bookingService.cancelBooking(req.params.id, userId);

      if (!result.success) {
        const statusCode = result.error?.includes('not found') ? 404 : 400;
        res.status(statusCode).json(result);
        return;
      }

      // Track metrics
      bookingStatusTotal.inc({ status: 'cancelled' });

      res.json(result);
    } catch (error) {
      logger.error('Cancel booking route error', { error: error instanceof Error ? error.message : 'Unknown' });
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

/**
 * POST /api/booking/:id/confirm
 * Confirm a booking
 */
router.post(
  '/:id/confirm',
  optionalAuth,
  validateParams(confirmBookingSchema),
  async (req: Request, res: Response) => {
    try {
      const advertiserId = req.user?.userId || req.body.advertiserId;
      if (!advertiserId) {
        res.status(400).json({ success: false, error: 'Advertiser ID required' });
        return;
      }

      const result = await bookingService.confirmBooking(req.params.id, advertiserId);

      if (!result.success) {
        const statusCode = result.error?.includes('not found') ? 404 : 400;
        res.status(statusCode).json(result);
        return;
      }

      // Track metrics
      bookingStatusTotal.inc({ status: 'confirmed' });

      res.json(result);
    } catch (error) {
      logger.error('Confirm booking route error', { error: error instanceof Error ? error.message : 'Unknown' });
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

/**
 * GET /api/booking/user/:userId
 * Get user's bookings
 */
router.get(
  '/user/:userId',
  optionalAuth,
  validateQuery(getUserBookingsSchema),
  async (req: Request, res: Response) => {
    try {
      const { page, limit } = req.query as unknown as { page: number; limit: number };
      const result = await bookingService.getUserBookings(req.params.userId, page, limit);

      res.json(result);
    } catch (error) {
      logger.error('Get user bookings route error', { error: error instanceof Error ? error.message : 'Unknown' });
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

/**
 * GET /api/booking/ad/:adId
 * Get bookings from an ad
 */
router.get(
  '/ad/:adId',
  optionalAuth,
  validateQuery(getAdBookingsSchema),
  async (req: Request, res: Response) => {
    try {
      const { page, limit } = req.query as unknown as { page: number; limit: number };
      const result = await bookingService.getAdBookings(req.params.adId, page, limit);

      res.json(result);
    } catch (error) {
      logger.error('Get ad bookings route error', { error: error instanceof Error ? error.message : 'Unknown' });
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

/**
 * GET /api/booking/user/:userId/stats
 * Get user booking statistics
 */
router.get(
  '/user/:userId/stats',
  optionalAuth,
  async (req: Request, res: Response) => {
    try {
      const result = await bookingService.getUserBookingStats(req.params.userId);

      res.json(result);
    } catch (error) {
      logger.error('Get user stats route error', { error: error instanceof Error ? error.message : 'Unknown' });
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

/**
 * POST /api/booking/:id/pay
 * Process payment for a booking
 */
router.post(
  '/:id/pay',
  optionalAuth,
  validateBody(paymentSchema),
  async (req: Request, res: Response) => {
    try {
      const { rabtulPaymentService } = await import('../services');
      const result = await bookingService.getBooking(req.params.id);

      if (!result.success || !result.data) {
        res.status(404).json({ success: false, error: 'Booking not found' });
        return;
      }

      const booking = result.data;

      if (!booking.payment?.required) {
        res.status(400).json({ success: false, error: 'Payment not required for this booking' });
        return;
      }

      if (booking.payment.status === 'paid') {
        res.status(400).json({ success: false, error: 'Payment already completed' });
        return;
      }

      // Process payment via RABTUL
      const paymentResult = await rabtulPaymentService.processPayment({
        userId: booking.userId,
        amount: booking.payment.amount || 0,
        description: `Booking payment for ${booking.type}`,
        metadata: {
          bookingId: booking.bookingId,
          adId: booking.adId,
        },
      });

      if (!paymentResult.success || !paymentResult.transactionId) {
        res.status(400).json({ success: false, error: paymentResult.error || 'Payment failed' });
        return;
      }

      // Update booking payment status
      await bookingService.updatePaymentStatus(
        booking.bookingId,
        'paid',
        paymentResult.transactionId
      );

      res.json({
        success: true,
        data: {
          transactionId: paymentResult.transactionId,
          status: 'paid',
        },
      });
    } catch (error) {
      logger.error('Pay booking route error', { error: error instanceof Error ? error.message : 'Unknown' });
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

export default router;