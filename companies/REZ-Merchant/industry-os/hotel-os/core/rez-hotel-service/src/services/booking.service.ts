/**
 * Booking Service
 *
 * Business logic for booking management
 */

import { Booking } from '../models/Booking';
import { Room } from '../models/Room';
import { Guest } from '../models/Guest';
import { logger } from '../config/logger';
import {
  CreateBookingInput,
  UpdateBookingInput,
  BookingSearchFilters,
  BookingStatus,
} from '../types';
import axios from 'axios';

const log = (msg: string, meta?) => logger.info(`[booking-service] ${msg}`, meta);

const REZ_MIND_URL = process.env.REZ_MIND_URL || 'http://localhost:4005';
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:4001';

function generateBookingId(): string {
  try {
    const { randomUUID } = require('crypto');
    const uuid = randomUUID().replace(/-/g, '').substring(0, 6).toUpperCase();
    return `BK${Date.now().toString(36)}${uuid}`;
  } catch {
    return 'BK' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6).toUpperCase();
  }
}

function calculateNights(checkIn: Date, checkOut: Date): number {
  const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

class BookingService {
  /**
   * Create a new booking
   */
  async createBooking(hotelId: string, input: CreateBookingInput): Promise<typeof Booking.prototype | null> {
    // Validate guest exists
    const guest = await Guest.findOne({ guestId: input.guestId, hotelId });
    if (!guest) {
      log('Guest not found for booking', { guestId: input.guestId, hotelId });
      return null;
    }

    // Validate room exists and is available
    const room = await Room.findOne({ roomId: input.roomId, hotelId, isActive: true });
    if (!room) {
      log('Room not found for booking', { roomId: input.roomId, hotelId });
      return null;
    }

    // Check room availability
    const checkIn = new Date(input.checkIn);
    const checkOut = new Date(input.checkOut);

    const existingBooking = await Booking.findOne({
      roomId: input.roomId,
      status: { $in: ['confirmed', 'checked_in'] },
      $or: [
        { checkIn: { $lt: checkOut }, checkOut: { $gt: checkIn } },
      ],
    });

    if (existingBooking) {
      log('Room not available for dates', { roomId: input.roomId, checkIn: input.checkIn, checkOut: input.checkOut });
      return null;
    }

    // Calculate total amount
    const nights = calculateNights(checkIn, checkOut);
    const totalAmount = nights * room.price;

    const bookingId = generateBookingId();

    const booking = new Booking({
      bookingId,
      hotelId,
      guestId: input.guestId,
      roomId: input.roomId,
      roomNumber: room.roomNumber,
      checkIn,
      checkOut,
      status: 'pending',
      totalAmount,
      paidAmount: 0,
      currency: room.currency,
      source: input.source,
      paymentStatus: 'pending',
      numGuests: input.numGuests,
      specialRequests: input.specialRequests,
    });

    await booking.save();
    log('Booking created', { bookingId, hotelId, roomId: input.roomId, totalAmount });

    return booking;
  }

  /**
   * Get booking by ID
   */
  async getBooking(bookingId: string): Promise<typeof Booking.prototype | null> {
    return Booking.findOne({ bookingId });
  }

  /**
   * Get booking with full details
   */
  async getBookingWithDetails(bookingId: string): Promise<{
    booking: typeof Booking.prototype;
    guest: typeof Guest.prototype | null;
    room: typeof Room.prototype | null;
  } | null> {
    const booking = await Booking.findOne({ bookingId });
    if (!booking) return null;

    const [guest, room] = await Promise.all([
      Guest.findOne({ guestId: booking.guestId }),
      Room.findOne({ roomId: booking.roomId }),
    ]);

    return { booking, guest, room };
  }

  /**
   * Get bookings by hotel
   */
  async getBookingsByHotel(hotelId: string, filters?: BookingSearchFilters): Promise<typeof Booking[]> {
    const query: Record<string, unknown> = { hotelId };

    if (filters?.status) query.status = filters.status;
    if (filters?.guestId) query.guestId = filters.guestId;
    if (filters?.roomId) query.roomId = filters.roomId;
    if (filters?.source) query.source = filters.source;
    if (filters?.paymentStatus) query.paymentStatus = filters.paymentStatus;

    if (filters?.checkInFrom || filters?.checkInTo) {
      query.checkIn = {};
      if (filters.checkInFrom) (query.checkIn as Record<string, Date>).$gte = new Date(filters.checkInFrom);
      if (filters.checkInTo) (query.checkIn as Record<string, Date>).$lte = new Date(filters.checkInTo);
    }

    if (filters?.checkOutFrom || filters?.checkOutTo) {
      query.checkOut = {};
      if (filters.checkOutFrom) (query.checkOut as Record<string, Date>).$gte = new Date(filters.checkOutFrom);
      if (filters.checkOutTo) (query.checkOut as Record<string, Date>).$lte = new Date(filters.checkOutTo);
    }

    return Booking.find(query).sort({ checkIn: -1 });
  }

  /**
   * Get bookings by guest
   */
  async getBookingsByGuest(guestId: string): Promise<typeof Booking[]> {
    return Booking.find({ guestId }).sort({ checkIn: -1 });
  }

  /**
   * Update booking
   */
  async updateBooking(bookingId: string, input: UpdateBookingInput): Promise<typeof Booking.prototype | null> {
    const booking = await Booking.findOne({ bookingId });
    if (!booking) return null;

    const updates: Record<string, unknown> = {};

    if (input.roomId) {
      const room = await Room.findOne({ roomId: input.roomId, isActive: true });
      if (!room) return null;
      updates.roomId = input.roomId;
      updates.roomNumber = room.roomNumber;
    }

    if (input.checkIn) updates.checkIn = new Date(input.checkIn);
    if (input.checkOut) updates.checkOut = new Date(input.checkOut);
    if (input.status) updates.status = input.status;
    if (input.paymentStatus) updates.paymentStatus = input.paymentStatus;
    if (input.paidAmount !== undefined) updates.paidAmount = input.paidAmount;
    if (input.numGuests) updates.numGuests = input.numGuests;
    if (input.specialRequests !== undefined) updates.specialRequests = input.specialRequests;

    // Recalculate total if dates changed
    if (input.checkIn || input.checkOut) {
      const checkIn = input.checkIn ? new Date(input.checkIn) : booking.checkIn;
      const checkOut = input.checkOut ? new Date(input.checkOut) : booking.checkOut;
      const room = await Room.findOne({ roomId: (updates.roomId || booking.roomId) as string });
      if (room) {
        const nights = calculateNights(checkIn, checkOut);
        updates.totalAmount = nights * room.price;
      }
    }

    const updated = await Booking.findOneAndUpdate(
      { bookingId },
      { $set: updates },
      { new: true }
    );

    if (updated) {
      log('Booking updated', { bookingId });
    }

    return updated;
  }

  /**
   * Check in guest
   */
  async checkIn(bookingId: string): Promise<typeof Booking.prototype | null> {
    const booking = await Booking.findOne({ bookingId });
    if (!booking) return null;

    if (booking.status !== 'confirmed' && booking.status !== 'pending') {
      log('Cannot check in - invalid status', { bookingId, status: booking.status });
      return null;
    }

    // Update booking status
    const updatedBooking = await Booking.findOneAndUpdate(
      { bookingId },
      { $set: { status: 'checked_in' } },
      { new: true }
    );

    // Update room status
    await Room.findOneAndUpdate(
      { roomId: booking.roomId },
      { $set: { status: 'occupied' } }
    );

    if (updatedBooking) {
      log('Guest checked in', { bookingId, roomNumber: booking.roomNumber });

      // Update guest stats
      await Guest.findOneAndUpdate(
        { guestId: booking.guestId },
        {
          $inc: { totalStays: 1 },
          $set: { lastStay: new Date() },
        }
      );
    }

    return updatedBooking;
  }

  /**
   * Check out guest
   */
  async checkOut(bookingId: string): Promise<typeof Booking.prototype | null> {
    const booking = await Booking.findOne({ bookingId });
    if (!booking) return null;

    if (booking.status !== 'checked_in') {
      log('Cannot check out - not checked in', { bookingId, status: booking.status });
      return null;
    }

    // Update booking status
    const updatedBooking = await Booking.findOneAndUpdate(
      { bookingId },
      { $set: { status: 'checked_out' } },
      { new: true }
    );

    // Update room status to cleaning
    await Room.findOneAndUpdate(
      { roomId: booking.roomId },
      { $set: { status: 'cleaning' } }
    );

    // Update guest total spent
    await Guest.findOneAndUpdate(
      { guestId: booking.guestId },
      {
        $inc: { totalSpent: booking.totalAmount },
        $set: { lastStay: new Date() },
      }
    );

    // Add loyalty points
    const pointsEarned = Math.floor(booking.totalAmount / 100);
    await Guest.findOneAndUpdate(
      { guestId: booking.guestId },
      { $inc: { loyaltyPoints: pointsEarned } }
    );

    if (updatedBooking) {
      log('Guest checked out', { bookingId, roomNumber: booking.roomNumber, totalAmount: booking.totalAmount });
    }

    return updatedBooking;
  }

  /**
   * Cancel booking
   */
  async cancelBooking(bookingId: string, reason?: string): Promise<typeof Booking.prototype | null> {
    const booking = await Booking.findOne({ bookingId });
    if (!booking) return null;

    if (booking.status === 'checked_out') {
      log('Cannot cancel - already checked out', { bookingId });
      return null;
    }

    const updatedBooking = await Booking.findOneAndUpdate(
      { bookingId },
      {
        $set: {
          status: 'cancelled',
          ...(reason ? { specialRequests: `${booking.specialRequests || ''}\nCancellation reason: ${reason}` } : {}),
        },
      },
      { new: true }
    );

    // Release room if it was confirmed
    if (booking.status === 'confirmed') {
      await Room.findOneAndUpdate(
        { roomId: booking.roomId },
        { $set: { status: 'available' } }
      );
    }

    // Process refund if payment was made
    if (booking.paidAmount > 0) {
      try {
        await axios.post(`${PAYMENT_SERVICE_URL}/api/payments/refund`, {
          bookingId,
          amount: booking.paidAmount,
          reason: 'Booking cancellation',
        }, { timeout: 5000 });
        log('Refund processed', { bookingId, amount: booking.paidAmount });
      } catch (error) {
        log('Refund failed', { bookingId, error });
      }
    }

    if (updatedBooking) {
      log('Booking cancelled', { bookingId, reason });
    }

    return updatedBooking;
  }

  /**
   * Search bookings
   */
  async searchBookings(filters: BookingSearchFilters): Promise<typeof Booking[]> {
    const query: Record<string, unknown> = {};

    if (filters.hotelId) query.hotelId = filters.hotelId;
    if (filters.guestId) query.guestId = filters.guestId;
    if (filters.roomId) query.roomId = filters.roomId;
    if (filters.status) query.status = filters.status;
    if (filters.paymentStatus) query.paymentStatus = filters.paymentStatus;
    if (filters.source) query.source = filters.source;

    return Booking.find(query).sort({ createdAt: -1 });
  }

  /**
   * Get today's arrivals
   */
  async getTodayArrivals(hotelId: string): Promise<typeof Booking[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return Booking.find({
      hotelId,
      checkIn: { $gte: today, $lt: tomorrow },
      status: { $in: ['confirmed', 'pending'] },
    }).sort({ checkIn: 1 });
  }

  /**
   * Get today's departures
   */
  async getTodayDepartures(hotelId: string): Promise<typeof Booking[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return Booking.find({
      hotelId,
      checkOut: { $gte: today, $lt: tomorrow },
      status: 'checked_in',
    }).sort({ checkOut: 1 });
  }

  /**
   * Get booking statistics
   */
  async getBookingStats(hotelId: string, startDate: Date, endDate: Date): Promise<{
    totalBookings: number;
    confirmed: number;
    cancelled: number;
    checkedIn: number;
    checkedOut: number;
    totalRevenue: number;
    pendingRevenue: number;
    averageBookingValue: number;
    bySource: Record<string, number>;
    occupancyRate: number;
  }> {
    const bookings = await Booking.find({
      hotelId,
      createdAt: { $gte: startDate, $lte: endDate },
    });

    const stats = {
      totalBookings: bookings.length,
      confirmed: 0,
      cancelled: 0,
      checkedIn: 0,
      checkedOut: 0,
      totalRevenue: 0,
      pendingRevenue: 0,
      averageBookingValue: 0,
      bySource: {} as Record<string, number>,
      occupancyRate: 0,
    };

    for (const booking of bookings) {
      switch (booking.status) {
        case 'confirmed':
        case 'checked_in':
          stats.confirmed++;
          break;
        case 'cancelled':
          stats.cancelled++;
          break;
        case 'checked_in':
          stats.checkedIn++;
          break;
        case 'checked_out':
          stats.checkedOut++;
          break;
      }

      stats.totalRevenue += booking.totalAmount;
      if (booking.paymentStatus === 'pending') {
        stats.pendingRevenue += booking.totalAmount - booking.paidAmount;
      }

      if (!stats.bySource[booking.source]) {
        stats.bySource[booking.source] = 0;
      }
      stats.bySource[booking.source]++;
    }

    stats.averageBookingValue = stats.totalBookings > 0
      ? stats.totalRevenue / stats.totalBookings
      : 0;

    return stats;
  }
}

export const bookingService = new BookingService();
