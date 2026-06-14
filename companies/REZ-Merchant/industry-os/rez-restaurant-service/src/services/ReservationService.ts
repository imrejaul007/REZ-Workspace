/**
 * Reservation Service
 *
 * Business logic for reservation management
 */

import { Reservation, IReservation, ReservationStatus } from '../models/Reservation';
import { Table } from '../models/Table';
import { logger } from '../config/logger';

const log = (msg: string, meta?) => logger.info(`[reservation] ${msg}`, meta);

export interface CreateReservationInput {
  restaurantId: string;
  branchId: string;
  userId: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  guestCount: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  duration?: number;
  specialOccasion?: string;
  specialRequests?: string;
  dietaryRestrictions?: string[];
  source?: 'app' | 'website' | 'phone' | 'walkin' | 'partner';
}

export interface UpdateReservationInput {
  guestName?: string;
  guestPhone?: string;
  guestEmail?: string;
  guestCount?: number;
  date?: string;
  time?: string;
  duration?: number;
  specialOccasion?: string;
  specialRequests?: string;
  dietaryRestrictions?: string[];
}

export interface TimeSlotQuery {
  branchId: string;
  date: string;
  guestCount: number;
}

export interface TimeSlot {
  time: string;
  availableTables: number;
  isAvailable: boolean;
}

/**
 * FIX (security): Generate secure ID using crypto
 */
function generateSecureId(prefix: string, length: number = 4): string {
  try {
    const { randomUUID } = require('crypto');
    const uuid = randomUUID().replace(/-/g, '').substring(0, length).toUpperCase();
    return `${prefix}${Date.now().toString(36)}${uuid}`;
  } catch {
    return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).substr(2, length).toUpperCase()}`;
  }
}

function generateReservationId(): string {
  return generateSecureId('RES', 4);
}

function generateConfirmationNumber(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  // FIX (security): Use crypto for secure random generation
  if (
    typeof globalThis !== 'undefined' &&
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.getRandomValues === 'function'
  ) {
    const array = new Uint8Array(6);
    globalThis.crypto.getRandomValues(array);
    return Array.from(array, b => chars[b % chars.length]).join('');
  }
  // Node.js fallback
  try {
    const { randomBytes } = require('crypto');
    const bytes = randomBytes(6);
    return Array.from(bytes, b => chars[b % chars.length]).join('');
  } catch {
    // Legacy fallback
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

const DEFAULT_TIME_SLOTS = [
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00',
];

class ReservationService {
  /**
   * Create a new reservation
   */
  async createReservation(input: CreateReservationInput): Promise<IReservation> {
    // Check for existing reservations at same time
    const existingReservation = await Reservation.findOne({
      branchId: input.branchId,
      date: input.date,
      time: input.time,
      status: { $in: ['pending', 'confirmed'] },
    });

    if (existingReservation) {
      throw new Error('Time slot not available');
    }

    // Find available table
    const availableTable = await Table.findOne({
      branchId: input.branchId,
      isActive: true,
      status: 'available',
      'capacity.min': { $lte: input.guestCount },
      'capacity.max': { $gte: input.guestCount },
    });

    const reservationId = generateReservationId();
    const confirmationNumber = generateConfirmationNumber();

    const reservation = new Reservation({
      reservationId,
      confirmationNumber,
      ...input,
      status: 'pending',
      tableId: availableTable?._id?.toString(),
      tableNumbers: availableTable ? [availableTable.tableNumber] : undefined,
      depositRequired: false,
      depositPaid: false,
      reminderSent: false,
      source: input.source || 'app',
      orderedAt: new Date(),
    });

    await reservation.save();
    log('Reservation created', { reservationId, confirmationNumber, branchId: input.branchId });

    // If table was assigned, mark it as reserved
    if (availableTable) {
      await Table.findOneAndUpdate(
        { tableId: availableTable.tableId },
        { $set: { status: 'reserved', currentReservationId: reservationId } }
      );
    }

    return reservation;
  }

  /**
   * Get reservation by ID
   */
  async getReservation(reservationId: string): Promise<IReservation | null> {
    return Reservation.findOne({ reservationId });
  }

  /**
   * Get reservation by confirmation number
   */
  async getReservationByConfirmation(confirmationNumber: string): Promise<IReservation | null> {
    return Reservation.findOne({ confirmationNumber });
  }

  /**
   * Get reservations with filters
   */
  async getReservations(filters: {
    branchId?: string;
    userId?: string;
    date?: string;
    status?: ReservationStatus[];
  }, limit = 50, offset = 0): Promise<IReservation[]> {
    const query: unknown = {};

    if (filters.branchId) query.branchId = filters.branchId;
    if (filters.userId) query.userId = filters.userId;
    if (filters.date) query.date = filters.date;
    if (filters.status && filters.status.length > 0) {
      query.status = { $in: filters.status };
    }

    return Reservation.find(query)
      .sort({ date: 1, time: 1 })
      .skip(offset)
      .limit(limit);
  }

  /**
   * Update reservation
   */
  async updateReservation(
    reservationId: string,
    input: UpdateReservationInput
  ): Promise<IReservation | null> {
    const reservation = await Reservation.findOneAndUpdate(
      { reservationId },
      { $set: input },
      { new: true }
    );

    if (reservation) {
      log('Reservation updated', { reservationId });
    }

    return reservation;
  }

  /**
   * Update reservation status
   */
  async updateStatus(
    reservationId: string,
    status: ReservationStatus
  ): Promise<IReservation | null> {
    const reservation = await Reservation.findOne({ reservationId });
    if (!reservation) return null;

    const updateData: unknown = { status };

    switch (status) {
      case 'confirmed':
        updateData.confirmedAt = new Date();
        break;
      case 'seated':
        updateData.seatedAt = new Date();
        break;
      case 'completed':
        updateData.completedAt = new Date();
        break;
      case 'cancelled':
        updateData.cancelledAt = new Date();
        break;
      case 'no_show':
        updateData.cancelledAt = new Date();
        break;
    }

    const updated = await Reservation.findOneAndUpdate(
      { reservationId },
      { $set: updateData },
      { new: true }
    );

    if (updated) {
      log('Reservation status updated', { reservationId, status });

      // Release table if cancelled or no_show
      if (['cancelled', 'no_show'].includes(status) && reservation.tableId) {
        await Table.findOneAndUpdate(
          { tableId: reservation.tableId },
          { $set: { status: 'available', currentReservationId: null } }
        );
      }
    }

    return updated;
  }

  /**
   * Confirm reservation
   */
  async confirmReservation(reservationId: string): Promise<IReservation | null> {
    return this.updateStatus(reservationId, 'confirmed');
  }

  /**
   * Cancel reservation
   */
  async cancelReservation(
    reservationId: string,
    reason?: string
  ): Promise<IReservation | null> {
    const reservation = await Reservation.findOne({ reservationId });
    if (!reservation) return null;

    // If deposit was paid, mark for refund
    if (reservation.depositPaid) {
      await Reservation.findOneAndUpdate(
        { reservationId },
        {
          $set: {
            status: 'cancelled',
            cancelledAt: new Date(),
            cancellationReason: reason || 'User cancelled',
            refundStatus: 'pending',
          },
        }
      );
    } else {
      await Reservation.findOneAndUpdate(
        { reservationId },
        {
          $set: {
            status: 'cancelled',
            cancelledAt: new Date(),
            cancellationReason: reason,
          },
        }
      );
    }

    // Release table
    if (reservation.tableId) {
      await Table.findOneAndUpdate(
        { tableId: reservation.tableId },
        { $set: { status: 'available', currentReservationId: null } }
      );
    }

    log('Reservation cancelled', { reservationId, reason });
    return Reservation.findOne({ reservationId });
  }

  /**
   * Mark guest as seated
   */
  async seatGuest(reservationId: string): Promise<IReservation | null> {
    const reservation = await Reservation.findOne({ reservationId });
    if (!reservation) return null;

    // Update table to occupied
    if (reservation.tableId) {
      await Table.findOneAndUpdate(
        { tableId: reservation.tableId },
        { $set: { status: 'occupied' } }
      );
    }

    return this.updateStatus(reservationId, 'seated');
  }

  /**
   * Complete reservation (guest leaves)
   */
  async completeReservation(reservationId: string): Promise<IReservation | null> {
    const reservation = await Reservation.findOne({ reservationId });
    if (!reservation) return null;

    // Release table
    if (reservation.tableId) {
      await Table.findOneAndUpdate(
        { tableId: reservation.tableId },
        { $set: { status: 'available', currentReservationId: null } }
      );
    }

    return this.updateStatus(reservationId, 'completed');
  }

  /**
   * Get available time slots for a date
   */
  async getTimeSlots(query: TimeSlotQuery): Promise<TimeSlot[]> {
    const { branchId, date, guestCount } = query;

    // Get all reservations for the date
    const reservations = await Reservation.find({
      branchId,
      date,
      status: { $in: ['pending', 'confirmed', 'seated'] },
    });

    const reservedSlots = new Set(reservations.map(r => r.time));

    // Get available tables count per slot
    const tables = await Table.find({
      branchId,
      isActive: true,
      'capacity.min': { $lte: guestCount },
      'capacity.max': { $gte: guestCount },
    });

    return DEFAULT_TIME_SLOTS.map(time => {
      const isReserved = reservedSlots.has(time);
      const availableTables = isReserved ? 0 : tables.length;

      return {
        time,
        availableTables,
        isAvailable: availableTables > 0,
      };
    });
  }

  /**
   * Get reservations for a specific date
   */
  async getReservationsByDate(
    branchId: string,
    date: string
  ): Promise<IReservation[]> {
    return Reservation.find({
      branchId,
      date,
      status: { $nin: ['cancelled'] },
    }).sort({ time: 1 });
  }

  /**
   * Get user's upcoming reservations
   */
  async getUpcomingReservations(userId: string): Promise<IReservation[]> {
    const today = new Date().toISOString().split('T')[0];

    return Reservation.find({
      userId,
      date: { $gte: today },
      status: { $in: ['pending', 'confirmed'] },
    }).sort({ date: 1, time: 1 });
  }

  /**
   * Get reservation statistics
   */
  async getReservationStats(
    branchId: string,
    date: string
  ): Promise<{
    total: number;
    confirmed: number;
    seated: number;
    completed: number;
    cancelled: number;
    noShow: number;
    totalGuests: number;
  }> {
    const reservations = await Reservation.find({ branchId, date });

    return {
      total: reservations.length,
      confirmed: reservations.filter((r: IReservation) => r.status === 'confirmed').length,
      seated: reservations.filter((r: IReservation) => r.status === 'seated').length,
      completed: reservations.filter((r: IReservation) => r.status === 'completed').length,
      cancelled: reservations.filter((r: IReservation) => r.status === 'cancelled').length,
      noShow: reservations.filter((r: IReservation) => r.status === 'no_show').length,
      totalGuests: reservations.reduce((sum, r: IReservation) => sum + r.guestCount, 0),
    };
  }
}

export const reservationService = new ReservationService();
