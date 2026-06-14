// ReZ Schedule - Seat Booking Service
// Handles capacity management for group bookings and classes
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

const SEAT_HOLD_TTL_MINUTES = 15;

export class SeatService {
  /**
   * Get available seats for an event type and time slot
   */
  async getAvailableSeats(
    eventTypeId: string,
    startTime: Date,
    endTime: Date
  ): Promise<{
    totalCapacity: number;
    booked: number;
    available: number;
    waitingListCount: number;
  }> {
    const eventType = await prisma.eventType.findUnique({
      where: { id: eventTypeId },
    });

    if (!eventType) {
      throw new Error('Event type not found');
    }

    // Count booked seats
    const bookedCount = await prisma.booking.count({
      where: {
        eventTypeId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        startTime,
        endTime,
      },
    });

    // Count waiting list
    const waitingListCount = await prisma.waitingList.count({
      where: {
        eventTypeId,
        requestedStart: startTime,
        requestedEnd: endTime,
        status: 'waiting',
      },
    });

    return {
      totalCapacity: eventType.capacity,
      booked: bookedCount,
      available: Math.max(0, eventType.capacity - bookedCount),
      waitingListCount,
    };
  }

  /**
   * Hold a seat temporarily (for checkout flow)
   */
  async holdSeat(
    eventTypeId: string,
    startTime: Date,
    endTime: Date,
    heldBy: string
  ): Promise<{ seatId: string; expiresAt: Date } | null> {
    const availability = await this.getAvailableSeats(eventTypeId, startTime, endTime);

    if (availability.available <= 0) {
      // Add to waiting list if waiting list is enabled
      const eventType = await prisma.eventType.findUnique({
        where: { id: eventTypeId },
      });

      if (eventType?.waitingListEnabled) {
        await prisma.waitingList.create({
          data: {
            eventTypeId,
            requestedStart: startTime,
            requestedEnd: endTime,
            email: heldBy, // Using heldBy as identifier
            name: heldBy,
            status: 'waiting',
          },
        });
      }

      return null;
    }

    // Create a temporary seat hold record
    const expiresAt = new Date(Date.now() + SEAT_HOLD_TTL_MINUTES * 60 * 1000);

    const seat = await prisma.seat.create({
      data: {
        eventTypeId,
        startTime,
        endTime,
        status: 'RESERVED',
        heldBy,
        holdExpiresAt: expiresAt,
      },
    });

    logger.info(`[Seat] Held seat ${seat.id} for ${heldBy} until ${expiresAt}`);

    // Schedule automatic release
    setTimeout(async () => {
      await this.releaseExpiredHolds(seat.id);
    }, SEAT_HOLD_TTL_MINUTES * 60 * 1000);

    return {
      seatId: seat.id,
      expiresAt,
    };
  }

  /**
   * Release expired seat holds
   */
  async releaseExpiredHolds(seatId?: string): Promise<number> {
    const now = new Date();

    const result = await prisma.seat.updateMany({
      where: {
        status: 'RESERVED',
        holdExpiresAt: { lt: now },
        ...(seatId ? { id: seatId } : {}),
      },
      data: {
        status: 'AVAILABLE',
        heldBy: null,
        holdExpiresAt: null,
      },
    });

    if (result.count > 0) {
      logger.info(`[Seat] Released ${result.count} expired seat holds`);
    }

    return result.count;
  }

  /**
   * Book a seat (convert hold to booking)
   */
  async bookSeat(
    seatId: string,
    bookingId: string
  ): Promise<boolean> {
    const seat = await prisma.seat.findUnique({
      where: { id: seatId },
    });

    if (!seat) {
      return false;
    }

    await prisma.seat.update({
      where: { id: seatId },
      data: {
        status: 'BOOKED',
        bookedBy: bookingId,
        heldBy: null,
        holdExpiresAt: null,
      },
    });

    logger.info(`[Seat] Booked seat ${seatId} for booking ${bookingId}`);

    return true;
  }

  /**
   * Release a seat (cancel booking)
   */
  async releaseSeat(
    eventTypeId: string,
    startTime: Date,
    endTime: Date,
    bookingId: string
  ): Promise<void> {
    // Find and release the seat
    await prisma.seat.updateMany({
      where: {
        eventTypeId,
        bookedBy: bookingId,
      },
      data: {
        status: 'AVAILABLE',
        bookedBy: null,
      },
    });

    logger.info(`[Seat] Released seat for booking ${bookingId}`);

    // Check waiting list and notify next person
    await this.notifyWaitingList(eventTypeId, startTime, endTime);
  }

  /**
   * Notify waiting list when seat becomes available
   */
  private async notifyWaitingList(
    eventTypeId: string,
    startTime: Date,
    endTime: Date
  ): Promise<void> {
    const waitingEntry = await prisma.waitingList.findFirst({
      where: {
        eventTypeId,
        requestedStart: startTime,
        requestedEnd: endTime,
        status: 'waiting',
      },
      orderBy: { position: 'asc' },
    });

    if (waitingEntry) {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await prisma.waitingList.update({
        where: { id: waitingEntry.id },
        data: {
          status: 'notified',
          notifiedAt: new Date(),
          expiresAt,
        },
      });

      // In production, send email/SMS notification
      logger.info(`[Seat] Notified ${waitingEntry.email} about available seat`);

      // Schedule expiration check
      setTimeout(async () => {
        const entry = await prisma.waitingList.findUnique({
          where: { id: waitingEntry.id },
        });

        if (entry?.status === 'notified') {
          await prisma.waitingList.update({
            where: { id: waitingEntry.id },
            data: { status: 'expired' },
          });

          // Notify next in line
          await this.notifyWaitingList(eventTypeId, startTime, endTime);
        }
      }, 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Get all seats for a time slot
   */
  async getSeats(
    eventTypeId: string,
    startTime: Date,
    endTime: Date
  ): Promise<{
    seats: {
      id: string;
      status: string;
      bookedBy: string | null;
      heldBy: string | null;
    }[];
    summary: {
      total: number;
      available: number;
      reserved: number;
      booked: number;
    };
  }> {
    const seats = await prisma.seat.findMany({
      where: {
        eventTypeId,
        startTime,
        endTime,
      },
    });

    const summary = {
      total: seats.length,
      available: seats.filter(s => s.status === 'AVAILABLE').length,
      reserved: seats.filter(s => s.status === 'RESERVED').length,
      booked: seats.filter(s => s.status === 'BOOKED').length,
    };

    return {
      seats: seats.map(s => ({
        id: s.id,
        status: s.status,
        bookedBy: s.bookedBy,
        heldBy: s.heldBy,
      })),
      summary,
    };
  }

  /**
   * Cancel a booking and release seats
   */
  async handleBookingCancellation(
    bookingId: string,
    eventTypeId: string,
    startTime: Date,
    endTime: Date
  ): Promise<void> {
    // Release the seat
    await this.releaseSeat(eventTypeId, startTime, endTime, bookingId);
  }

  /**
   * Get attendee list for a class/event
   */
  async getAttendeeList(
    eventTypeId: string,
    startTime: Date,
    endTime: Date
  ): Promise<{
    total: number;
    attendees: {
      id: string;
      name: string;
      email: string;
      phone: string | null;
      bookingUid: string;
      status: string;
    }[];
  }> {
    const bookings = await prisma.booking.findMany({
      where: {
        eventTypeId,
        startTime,
        endTime,
        status: { in: ['CONFIRMED', 'COMPLETED'] },
      },
      include: {
        attendee: true,
      },
    });

    return {
      total: bookings.length,
      attendees: bookings.map(b => ({
        id: b.attendeeId || '',
        name: b.attendee?.name || 'Unknown',
        email: b.attendee?.email || '',
        phone: b.attendee?.phone || null,
        bookingUid: b.uid,
        status: b.status,
      })),
    };
  }

  /**
   * Check if a booking can be modified
   */
  async canModifyBooking(bookingId: string): Promise<{
    canModify: boolean;
    reason?: string;
  }> {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return { canModify: false, reason: 'Booking not found' };
    }

    if (booking.status === 'CANCELLED') {
      return { canModify: false, reason: 'Booking is cancelled' };
    }

    if (booking.status === 'COMPLETED') {
      return { canModify: false, reason: 'Booking has already been completed' };
    }

    // Check if within cancellation window
    const hoursUntilStart = (booking.startTime.getTime() - Date.now()) / (1000 * 60 * 60);

    if (hoursUntilStart < 0) {
      return { canModify: false, reason: 'Booking has already started' };
    }

    return { canModify: true };
  }
}

export const seatService = new SeatService();
export default seatService;
