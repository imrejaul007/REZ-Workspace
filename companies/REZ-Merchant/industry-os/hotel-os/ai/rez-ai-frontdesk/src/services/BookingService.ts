/**
 * Booking Service - Business logic for bookings
 */

import { Booking, IBooking } from '../models/Booking';
import { logger } from '../config/logger';
import { BookingInput, BookingStatus } from '../types';

export class BookingService {
  /**
   * Create a new booking
   */
  async createBooking(input: BookingInput): Promise<IBooking> {
    try {
      const booking = new Booking({
        guestId: input.guestId,
        roomType: input.roomType || 'Standard',
        checkIn: new Date(input.checkIn),
        checkOut: new Date(input.checkOut),
        guests: input.guests || 1,
        totalAmount: input.totalAmount || 0,
        status: 'confirmed',
      });

      await booking.save();
      logger.info('Booking created', { bookingId: booking._id, checkIn: booking.checkIn });
      return booking;
    } catch (error) {
      logger.error('Failed to create booking', { error: (error as Error).message, input });
      throw error;
    }
  }

  /**
   * Get booking by ID
   */
  async getBookingById(id: string): Promise<IBooking | null> {
    try {
      const booking = await Booking.findById(id);
      return booking;
    } catch (error) {
      logger.error('Failed to get booking', { error: (error as Error).message, bookingId: id });
      throw error;
    }
  }

  /**
   * Get bookings for date
   */
  async getBookingsForDate(date: Date): Promise<IBooking[]> {
    try {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const bookings = await Booking.find({
        checkIn: { $lte: dayEnd },
        checkOut: { $gte: dayStart },
      }).lean();

      return bookings;
    } catch (error) {
      logger.error('Failed to get bookings for date', { error: (error as Error).message, date });
      throw error;
    }
  }

  /**
   * Update booking status
   */
  async updateStatus(id: string, status: BookingStatus): Promise<IBooking | null> {
    try {
      const booking = await Booking.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );

      if (booking) {
        logger.info('Booking status updated', { bookingId: id, status });
      }

      return booking;
    } catch (error) {
      logger.error('Failed to update booking status', { error: (error as Error).message, bookingId: id });
      throw error;
    }
  }

  /**
   * Get upcoming bookings
   */
  async getUpcomingBookings(limit = 10): Promise<IBooking[]> {
    try {
      const now = new Date();
      const bookings = await Booking.find({
        checkIn: { $gte: now },
        status: { $ne: 'cancelled' },
      })
        .sort({ checkIn: 1 })
        .limit(limit)
        .lean();

      return bookings;
    } catch (error) {
      logger.error('Failed to get upcoming bookings', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Get current bookings
   */
  async getCurrentBookings(): Promise<IBooking[]> {
    try {
      const now = new Date();
      const bookings = await Booking.find({
        checkIn: { $lte: now },
        checkOut: { $gte: now },
        status: { $in: ['confirmed', 'checked_in'] },
      }).lean();

      return bookings;
    } catch (error) {
      logger.error('Failed to get current bookings', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Cancel booking
   */
  async cancelBooking(id: string): Promise<IBooking | null> {
    try {
      const booking = await Booking.findByIdAndUpdate(
        id,
        { status: 'cancelled' },
        { new: true }
      );

      if (booking) {
        logger.info('Booking cancelled', { bookingId: id });
      }

      return booking;
    } catch (error) {
      logger.error('Failed to cancel booking', { error: (error as Error).message, bookingId: id });
      throw error;
    }
  }
}

export const bookingService = new BookingService();
export default bookingService;