import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import {
  createBooking,
  getBookingById,
  updateBooking,
  cancelBooking,
  getRescheduleOptions,
  listUserBookings,
} from '../services/bookingService';
import { UnifiedBooking } from '../models';
import { createLogger } from '../utils/logger';

const logger = createLogger('bookings-routes');
const router = Router();

// ============================================
// Validation Schemas
// ============================================

const createBookingSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  merchantId: z.string().min(1, 'Merchant ID is required'),
  vertical: z.string().min(1, 'Vertical is required'),
  type: z.string().min(1, 'Booking type is required'),
  startDateTime: z.string().datetime({ message: 'Invalid datetime format' }),
  duration: z.number().int().min(1).optional(),
  partySize: z.number().int().min(1).optional(),
  bookingData: z.record(z.unknown()).optional(),
  paymentRequired: z.boolean().optional(),
  notes: z.string().max(1000).optional(),
});

const updateBookingSchema = z.object({
  startDateTime: z.string().datetime().optional(),
  duration: z.number().int().min(1).optional(),
  notes: z.string().max(1000).optional(),
  partySize: z.number().int().min(1).optional(),
});

const cancelBookingSchema = z.object({
  reason: z.string().max(500).optional(),
  cancelledBy: z.string().optional(),
});

const listBookingsQuerySchema = z.object({
  userId: z.string().optional(),
  vertical: z.string().optional(),
  status: z.enum(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']).optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ============================================
// Route Handlers
// ============================================

/**
 * POST /api/v1/bookings
 * Create a new booking
 */
router.post(
  '/',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const requestId = req.requestId || uuidv4();
    const startTime = Date.now();

    try {
      const validationResult = createBookingSchema.safeParse(req.body);

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

      const bookingData = validationResult.data;

      logger.info('Creating booking', {
        requestId,
        userId: bookingData.userId,
        merchantId: bookingData.merchantId,
        vertical: bookingData.vertical,
        type: bookingData.type,
      });

      const result = await createBooking({
        userId: bookingData.userId,
        merchantId: bookingData.merchantId,
        vertical: bookingData.vertical,
        type: bookingData.type,
        startDateTime: new Date(bookingData.startDateTime),
        duration: bookingData.duration,
        partySize: bookingData.partySize,
        bookingData: bookingData.bookingData,
        paymentRequired: bookingData.paymentRequired,
      });

      const duration = Date.now() - startTime;

      logger.info('Booking created successfully', {
        requestId,
        bookingId: result.booking.bookingId,
        paymentRequired: result.paymentRequired,
        durationMs: duration,
      });

      res.status(201).json({
        success: true,
        data: {
          booking: result.booking,
          paymentRequired: result.paymentRequired,
          paymentDetails: result.paymentDetails,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
          durationMs: duration,
        },
      });
    } catch (error) {
      logger.error('Booking creation failed', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(error);
    }
  }
);

/**
 * GET /api/v1/bookings
 * List user bookings with filtering
 */
router.get(
  '/',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const requestId = req.requestId || uuidv4();
    const startTime = Date.now();

    try {
      const validationResult = listBookingsQuerySchema.safeParse(req.query);

      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: validationResult.error.errors,
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId,
          },
        });
        return;
      }

      const { userId, vertical, status, fromDate, toDate, page, limit } = validationResult.data;

      // If no userId, require authentication
      if (!userId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'userId is required',
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId,
          },
        });
        return;
      }

      logger.info('Listing bookings', {
        requestId,
        userId,
        vertical,
        status,
        fromDate,
        toDate,
        page,
        limit,
      });

      const result = await listUserBookings({
        userId,
        vertical,
        status,
        fromDate: fromDate ? new Date(fromDate) : undefined,
        toDate: toDate ? new Date(toDate) : undefined,
        page,
        limit,
      });

      const duration = Date.now() - startTime;

      res.json({
        success: true,
        data: {
          bookings: result.bookings,
          pagination: result.pagination,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
          durationMs: duration,
        },
      });
    } catch (error) {
      logger.error('Listing bookings failed', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(error);
    }
  }
);

/**
 * GET /api/v1/bookings/:bookingId
 * Get booking by ID
 */
router.get(
  '/:bookingId',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const requestId = req.requestId || uuidv4();
    const { bookingId } = req.params;

    try {
      logger.info('Getting booking', { requestId, bookingId });

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

      res.json({
        success: true,
        data: { booking },
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
        },
      });
    } catch (error) {
      logger.error('Getting booking failed', {
        requestId,
        bookingId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(error);
    }
  }
);

/**
 * PUT /api/v1/bookings/:bookingId
 * Update a booking
 */
router.put(
  '/:bookingId',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const requestId = req.requestId || uuidv4();
    const { bookingId } = req.params;

    try {
      const validationResult = updateBookingSchema.safeParse(req.body);

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

      const updates = validationResult.data;

      logger.info('Updating booking', {
        requestId,
        bookingId,
        updates,
      });

      const booking = await updateBooking(bookingId, {
        startDateTime: updates.startDateTime ? new Date(updates.startDateTime) : undefined,
        duration: updates.duration,
        notes: updates.notes,
        partySize: updates.partySize,
      });

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

      res.json({
        success: true,
        data: { booking },
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
        },
      });
    } catch (error) {
      logger.error('Updating booking failed', {
        requestId,
        bookingId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(error);
    }
  }
);

/**
 * POST /api/v1/bookings/:bookingId/cancel
 * Cancel a booking
 */
router.post(
  '/:bookingId/cancel',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const requestId = req.requestId || uuidv4();
    const { bookingId } = req.params;

    try {
      const validationResult = cancelBookingSchema.safeParse(req.body);

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

      const { reason, cancelledBy } = validationResult.data;

      logger.info('Cancelling booking', {
        requestId,
        bookingId,
        reason,
        cancelledBy,
      });

      const result = await cancelBooking(bookingId, reason, cancelledBy);

      if (!result) {
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

      res.json({
        success: true,
        data: {
          booking: result.booking,
          refundRequired: result.refundRequired,
          refundAmount: result.refundAmount,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
        },
      });
    } catch (error) {
      logger.error('Cancelling booking failed', {
        requestId,
        bookingId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(error);
    }
  }
);

/**
 * GET /api/v1/bookings/:bookingId/reschedule
 * Get reschedule options for a booking
 */
router.get(
  '/:bookingId/reschedule',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const requestId = req.requestId || uuidv4();
    const { bookingId } = req.params;

    try {
      logger.info('Getting reschedule options', { requestId, bookingId });

      const result = await getRescheduleOptions(bookingId);

      if (!result) {
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

      res.json({
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
        },
      });
    } catch (error) {
      logger.error('Getting reschedule options failed', {
        requestId,
        bookingId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(error);
    }
  }
);

export default router;