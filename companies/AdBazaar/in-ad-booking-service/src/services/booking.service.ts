/**
 * Booking service for in-ad-booking-service
 * Handles all booking operations
 */

import { v4 as uuidv4 } from 'uuid';
import { AdBookingModel, AdBookingDocument } from '../models';
import { CreateBookingInput, AdBooking, BookingResponse, UserBookingStats } from '../types';
import logger from '../utils/logger';

export class BookingService {
  /**
   * Create a new booking from an ad
   */
  async createBooking(input: CreateBookingInput): Promise<BookingResponse> {
    try {
      const bookingId = `bk-${uuidv4().slice(0, 12)}`;

      const booking = new AdBookingModel({
        bookingId,
        adId: input.adId,
        advertiserId: input.advertiserId,
        userId: input.userId,
        businessId: input.businessId,
        type: input.type,
        details: {
          date: input.details.date,
          time: input.details.time,
          guests: input.details.guests,
          service: input.details.service,
          notes: input.details.notes,
        },
        status: 'pending',
        payment: input.paymentRequired ? {
          required: true,
          amount: input.paymentAmount,
          status: 'pending',
        } : undefined,
      });

      await booking.save();
      logger.info('Booking created', { bookingId, adId: input.adId, userId: input.userId });

      return { success: true, data: this.toAdBooking(booking) };
    } catch (error) {
      logger.error('Create booking error', { error: error instanceof Error ? error.message : 'Unknown' });
      return { success: false, error: 'Failed to create booking' };
    }
  }

  /**
   * Get booking by ID
   */
  async getBooking(bookingId: string): Promise<BookingResponse> {
    try {
      const booking = await AdBookingModel.findOne({ bookingId });
      if (!booking) {
        return { success: false, error: 'Booking not found' };
      }
      return { success: true, data: this.toAdBooking(booking) };
    } catch (error) {
      logger.error('Get booking error', { error: error instanceof Error ? error.message : 'Unknown' });
      return { success: false, error: 'Failed to get booking' };
    }
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(bookingId: string, userId: string): Promise<BookingResponse> {
    try {
      const booking = await AdBookingModel.findOne({ bookingId });
      if (!booking) {
        return { success: false, error: 'Booking not found' };
      }

      // Check ownership
      if (booking.userId !== userId && booking.advertiserId !== userId) {
        return { success: false, error: 'Not authorized to cancel this booking' };
      }

      // Check if already cancelled
      if (booking.status === 'cancelled') {
        return { success: false, error: 'Booking is already cancelled' };
      }

      // Check if can be cancelled
      if (booking.status === 'completed') {
        return { success: false, error: 'Cannot cancel a completed booking' };
      }

      // Refund payment if applicable
      if (booking.payment?.required && booking.payment.status === 'paid') {
        booking.payment.status = 'refunded';
      }

      booking.status = 'cancelled';
      await booking.save();
      logger.info('Booking cancelled', { bookingId, cancelledBy: userId });

      return { success: true, data: this.toAdBooking(booking) };
    } catch (error) {
      logger.error('Cancel booking error', { error: error instanceof Error ? error.message : 'Unknown' });
      return { success: false, error: 'Failed to cancel booking' };
    }
  }

  /**
   * Confirm a booking
   */
  async confirmBooking(bookingId: string, advertiserId: string): Promise<BookingResponse> {
    try {
      const booking = await AdBookingModel.findOne({ bookingId });
      if (!booking) {
        return { success: false, error: 'Booking not found' };
      }

      // Check ownership
      if (booking.advertiserId !== advertiserId) {
        return { success: false, error: 'Not authorized to confirm this booking' };
      }

      // Check status
      if (booking.status !== 'pending') {
        return { success: false, error: 'Only pending bookings can be confirmed' };
      }

      booking.status = 'confirmed';
      await booking.save();
      logger.info('Booking confirmed', { bookingId, advertiserId });

      return { success: true, data: this.toAdBooking(booking) };
    } catch (error) {
      logger.error('Confirm booking error', { error: error instanceof Error ? error.message : 'Unknown' });
      return { success: false, error: 'Failed to confirm booking' };
    }
  }

  /**
   * Get bookings for a user
   */
  async getUserBookings(userId: string, page = 1, limit = 20): Promise<BookingResponse> {
    try {
      const skip = (page - 1) * limit;
      const query = { userId };

      const [bookings, total] = await Promise.all([
        AdBookingModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
        AdBookingModel.countDocuments(query),
      ]);

      return {
        success: true,
        data: bookings.map((b) => this.toAdBooking(b)) as unknown as AdBooking,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Get user bookings error', { error: error instanceof Error ? error.message : 'Unknown' });
      return { success: false, error: 'Failed to get user bookings' };
    }
  }

  /**
   * Get bookings for an ad
   */
  async getAdBookings(adId: string, page = 1, limit = 20): Promise<BookingResponse> {
    try {
      const skip = (page - 1) * limit;
      const query = { adId };

      const [bookings, total] = await Promise.all([
        AdBookingModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
        AdBookingModel.countDocuments(query),
      ]);

      return {
        success: true,
        data: bookings.map((b) => this.toAdBooking(b)) as unknown as AdBooking,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Get ad bookings error', { error: error instanceof Error ? error.message : 'Unknown' });
      return { success: false, error: 'Failed to get ad bookings' };
    }
  }

  /**
   * Get booking statistics for a user
   */
  async getUserBookingStats(userId: string): Promise<{ success: boolean; data?: UserBookingStats; error?: string }> {
    try {
      const stats = await AdBookingModel.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]);

      const result: UserBookingStats = {
        total: 0,
        pending: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
      };

      stats.forEach((s) => {
        result[s._id as keyof UserBookingStats] = s.count;
        result.total += s.count;
      });

      return { success: true, data: result };
    } catch (error) {
      logger.error('Get user stats error', { error: error instanceof Error ? error.message : 'Unknown' });
      return { success: false, error: 'Failed to get user stats' };
    }
  }

  /**
   * Update booking payment status
   */
  async updatePaymentStatus(bookingId: string, status: 'pending' | 'paid' | 'refunded', transactionId?: string): Promise<BookingResponse> {
    try {
      const update: Record<string, unknown> = { 'payment.status': status };
      if (transactionId) {
        update['payment.transactionId'] = transactionId;
      }

      const booking = await AdBookingModel.findOneAndUpdate(
        { bookingId },
        { $set: update },
        { new: true }
      );

      if (!booking) {
        return { success: false, error: 'Booking not found' };
      }

      return { success: true, data: this.toAdBooking(booking) };
    } catch (error) {
      logger.error('Update payment status error', { error: error instanceof Error ? error.message : 'Unknown' });
      return { success: false, error: 'Failed to update payment status' };
    }
  }

  /**
   * Mark booking as completed
   */
  async completeBooking(bookingId: string): Promise<BookingResponse> {
    try {
      const booking = await AdBookingModel.findOneAndUpdate(
        { bookingId, status: 'confirmed' },
        { $set: { status: 'completed' } },
        { new: true }
      );

      if (!booking) {
        return { success: false, error: 'Booking not found or not in confirmed status' };
      }

      return { success: true, data: this.toAdBooking(booking) };
    } catch (error) {
      logger.error('Complete booking error', { error: error instanceof Error ? error.message : 'Unknown' });
      return { success: false, error: 'Failed to complete booking' };
    }
  }

  /**
   * Convert Mongoose document to plain object
   */
  private toAdBooking(doc: AdBookingDocument): AdBooking {
    return {
      bookingId: doc.bookingId,
      adId: doc.adId,
      advertiserId: doc.advertiserId,
      userId: doc.userId,
      businessId: doc.businessId,
      type: doc.type,
      details: {
        date: doc.details?.date,
        time: doc.details?.time,
        guests: doc.details?.guests,
        service: doc.details?.service,
        notes: doc.details?.notes,
      },
      status: doc.status,
      payment: doc.payment ? {
        required: doc.payment.required,
        amount: doc.payment.amount,
        status: doc.payment.status,
        transactionId: doc.payment.transactionId,
      } : undefined,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}

export const bookingService = new BookingService();
export default bookingService;