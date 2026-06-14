/**
 * Booking Controller
 * Handles booking creation and retrieval
 */

import { Request, Response } from 'express';
import { createBookingSchema } from '../validators/makcorps.validators';
import { bookingService } from '../services/booking.service';
import { logger } from '../../../config/logger';

export class BookingController {
  /**
   * Create a new booking
   * POST /api/hotels/bookings
   */
  async createBooking(req: Request, res: Response): Promise<void> {
    try {
      const result = createBookingSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ success: false, message: result.error.errors[0].message });
        return;
      }

      const { propertyId, roomId, checkIn, checkOut, guests, guestDetails, specialRequests } = result.data;
      const companyId = req.headers['x-company-id'] as string;

      const booking = await bookingService.createBooking({
        propertyId,
        roomId,
        checkIn,
        checkOut,
        guests,
        guestDetails,
        specialRequests,
      }, companyId);

      logger.info('[Makcorps] Booking created', {
        bookingId: booking.bookingId,
        confirmationNumber: booking.confirmationNumber,
        property: booking.property.name,
        room: booking.room.name,
        totalAmount: booking.pricing.totalAmount,
        companyId,
      });

      res.status(201).json({ success: true, data: booking });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error('[Makcorps] Create booking failed', { error: error.message });

      if (error.message.includes('not found')) {
        res.status(404).json({ success: false, message: error.message });
        return;
      }
      if (error.message.includes('not available')) {
        res.status(400).json({ success: false, message: error.message });
        return;
      }

      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Get all bookings
   * GET /api/hotels/bookings
   */
  async getBookings(req: Request, res: Response): Promise<void> {
    try {
      const companyId = req.headers['x-company-id'] as string;
      const { status, page = '1', limit = '20' } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      const { bookings, total } = bookingService.getBookings({
        status: status as string | undefined,
        page: pageNum,
        limit: limitNum,
      });

      logger.info('[Makcorps] Get bookings', { companyId, count: bookings.length });

      res.json({
        success: true,
        data: bookings,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error('[Makcorps] Get bookings failed', { error: error.message });
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Get a single booking
   * GET /api/hotels/bookings/:bookingId
   */
  async getBooking(req: Request, res: Response): Promise<void> {
    try {
      const { bookingId } = req.params;
      const booking = bookingService.getBooking(bookingId);

      if (!booking) {
        res.status(404).json({ success: false, message: 'Booking not found' });
        return;
      }

      res.json({ success: true, data: booking });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error('[Makcorps] Get booking failed', { error: error.message });
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const bookingController = new BookingController();
