/**
 * Booking Service - Event Connector
 *
 * Hook into booking/reservation service to emit events
 */

import { eventConnector } from './eventConnectors';

export interface BookingConnector {
  /**
   * Hook: Booking created
   */
  onBookingCreated(booking: {
    bookingId: string;
    userId: string;
    merchantId: string;
    bookingType: 'restaurant' | 'hotel' | 'salon' | 'doctor' | 'cab' | 'event';
    dateTime: string;
    guests?: number;
    status: string;
  }): void;

  /**
   * Hook: Booking confirmed
   */
  onBookingConfirmed(booking: {
    bookingId: string;
    userId: string;
    merchantId: string;
    confirmationNumber: string;
    confirmedAt: string;
  }): void;

  /**
   * Hook: Booking cancelled
   */
  onBookingCancelled(booking: {
    bookingId: string;
    userId: string;
    merchantId: string;
    reason: string;
    cancelledBy: 'user' | 'merchant' | 'system';
    cancelledAt: string;
  }): void;

  /**
   * Hook: Booking completed
   */
  onBookingCompleted(booking: {
    bookingId: string;
    userId: string;
    merchantId: string;
    completedAt: string;
  }): void;

  /**
   * Hook: No-show
   */
  onBookingNoShow(booking: {
    bookingId: string;
    userId: string;
    merchantId: string;
    noShowAt: string;
  }): void;

  /**
   * Hook: Booking modified
   */
  onBookingModified(booking: {
    bookingId: string;
    userId: string;
    merchantId: string;
    changes: Record<string, unknown>;
    modifiedAt: string;
  }): void;

  /**
   * Hook: Reservation created (stay/hotel)
   */
  onReservationCreated(reservation: {
    reservationId: string;
    userId: string;
    merchantId: string;
    checkIn: string;
    checkOut: string;
    roomType: string;
  }): void;

  /**
   * Hook: Check-in
   */
  onCheckIn(reservation: {
    reservationId: string;
    userId: string;
    merchantId: string;
    checkedInAt: string;
  }): void;

  /**
   * Hook: Check-out
   */
  onCheckOut(reservation: {
    reservationId: string;
    userId: string;
    merchantId: string;
    checkedOutAt: string;
  }): void;
}

export function createBookingConnector(): BookingConnector {
  return {
    onBookingCreated: (booking) => {
      eventConnector.emit('booking.created', {
        bookingId: booking.bookingId,
        bookingType: booking.bookingType,
        dateTime: booking.dateTime,
        guests: booking.guests,
        status: booking.status,
        createdAt: new Date().toISOString()
      }, {
        userId: booking.userId,
        merchantId: booking.merchantId,
        correlationId: booking.bookingId
      });
    },

    onBookingConfirmed: (booking) => {
      eventConnector.emit('booking.confirmed', {
        bookingId: booking.bookingId,
        confirmationNumber: booking.confirmationNumber,
        confirmedAt: booking.confirmedAt
      }, {
        userId: booking.userId,
        merchantId: booking.merchantId,
        correlationId: booking.bookingId
      });
    },

    onBookingCancelled: (booking) => {
      eventConnector.emit('booking.cancelled', {
        bookingId: booking.bookingId,
        reason: booking.reason,
        cancelledBy: booking.cancelledBy,
        cancelledAt: booking.cancelledAt
      }, {
        userId: booking.userId,
        merchantId: booking.merchantId,
        correlationId: booking.bookingId
      });
    },

    onBookingCompleted: (booking) => {
      eventConnector.emit('booking.completed', {
        bookingId: booking.bookingId,
        completedAt: booking.completedAt
      }, {
        userId: booking.userId,
        merchantId: booking.merchantId,
        correlationId: booking.bookingId
      });
    },

    onBookingNoShow: (booking) => {
      eventConnector.emit('booking.no_show', {
        bookingId: booking.bookingId,
        noShowAt: booking.noShowAt
      }, {
        userId: booking.userId,
        merchantId: booking.merchantId,
        correlationId: booking.bookingId
      });
    },

    onBookingModified: (booking) => {
      eventConnector.emit('booking.modified', {
        bookingId: booking.bookingId,
        changes: booking.changes,
        modifiedAt: booking.modifiedAt
      }, {
        userId: booking.userId,
        merchantId: booking.merchantId,
        correlationId: booking.bookingId
      });
    },

    onReservationCreated: (reservation) => {
      eventConnector.emit('booking.reservation.created', {
        reservationId: reservation.reservationId,
        checkIn: reservation.checkIn,
        checkOut: reservation.checkOut,
        roomType: reservation.roomType,
        createdAt: new Date().toISOString()
      }, {
        userId: reservation.userId,
        merchantId: reservation.merchantId,
        correlationId: reservation.reservationId
      });
    },

    onCheckIn: (reservation) => {
      eventConnector.emit('booking.check_in', {
        reservationId: reservation.reservationId,
        checkedInAt: reservation.checkedInAt
      }, {
        userId: reservation.userId,
        merchantId: reservation.merchantId,
        correlationId: reservation.reservationId
      });
    },

    onCheckOut: (reservation) => {
      eventConnector.emit('booking.check_out', {
        reservationId: reservation.reservationId,
        checkedOutAt: reservation.checkedOutAt
      }, {
        userId: reservation.userId,
        merchantId: reservation.merchantId,
        correlationId: reservation.reservationId
      });
    }
  };
}

export const bookingConnector = createBookingConnector();
export default bookingConnector;
