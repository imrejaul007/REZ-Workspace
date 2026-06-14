// ReZ Schedule - Booking Service
import { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { availabilityService } from './availabilityService';
import { notificationService } from './notificationService';
import type { BookingStatus, LocationType, PaymentStatus, CreateBookingInput, CancelBookingInput, RescheduleBookingInput } from '../types';

interface BookingWithRelations {
  id: string;
  uid: string;
  status: BookingStatus;
  eventTypeId: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  timezone: string;
  attendeeId: string | null;
  locationType: LocationType;
  locationDetails: Prisma.JsonValue | null;
  price: number | null;
  currency: string | null;
  paymentId: string | null;
  paymentStatus: PaymentStatus;
  rescheduledFrom: string | null;
  rescheduledTo: string | null;
  cancellationReason: string | null;
  metadata: Prisma.JsonValue | null;
  responses: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
  eventType: {
    id: string;
    title: string;
    description: string | null;
    duration: number;
    bufferTime: number;
    locationType: LocationType;
    locationAddress: string | null;
    meetingUrl: string | null;
    phoneNumber: string | null;
    user: {
      id: string;
      name: string;
      email: string;
      username: string;
    };
  };
  attendee: {
    id: string;
    email: string;
    name: string;
    phone: string | null;
  } | null;
}

export class BookingService {
  /**
   * Create a new booking
   */
  async createBooking(input: CreateBookingInput, hostUserId: string): Promise<BookingWithRelations> {
    const {
      eventTypeId,
      startTime,
      endTime,
      idempotencyKey,
      timezone,
      guestTimezone,
      attendeeName,
      attendeeEmail,
      attendeePhone,
      responses,
    } = input;

    // Check idempotency
    if (idempotencyKey) {
      const existing = await prisma.booking.findUnique({
        where: { idempotencyKey },
      });
      if (existing) {
        logger.info(`[Booking] Returning existing booking for idempotency key: ${idempotencyKey}`);
        return this.getBookingByUid(existing.uid);
      }
    }

    // Validate event type exists and is active
    const eventType = await prisma.eventType.findUnique({
      where: { id: eventTypeId },
      include: { user: true },
    });

    if (!eventType) {
      throw new Error('Event type not found');
    }

    if (!eventType.active) {
      throw new Error('Event type is not active');
    }

    // Check slot availability
    const isAvailable = await availabilityService.isSlotAvailable(
      eventTypeId,
      new Date(startTime),
      new Date(endTime),
      timezone
    );

    if (!isAvailable) {
      throw new Error('Selected time slot is not available');
    }

    // Create or find attendee
    const attendee = await this.findOrCreateAttendee({
      email: attendeeEmail,
      name: attendeeName,
      phone: attendeePhone,
    });

    // Determine initial status
    const initialStatus = eventType.requiresConfirmation
      ? BookingStatus.PENDING
      : BookingStatus.CONFIRMED;

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        uid: uuidv4(),
        idempotencyKey,
        status: initialStatus,
        eventTypeId,
        userId: eventType.userId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        timezone,
        guestTimezone,
        attendeeId: attendee.id,
        locationType: eventType.locationType,
        locationDetails: this.getLocationDetails(eventType),
        price: eventType.price,
        currency: eventType.currency,
        paymentStatus: eventType.paidBooking ? PaymentStatus.PENDING : PaymentStatus.PAID,
        responses: responses || undefined,
        confirmedAt: initialStatus === BookingStatus.CONFIRMED ? new Date() : null,
      },
      include: {
        eventType: {
          include: {
            user: {
              select: { id: true, name: true, email: true, username: true },
            },
          },
        },
        attendee: true,
      },
    });

    logger.info(`[Booking] Created booking ${booking.uid} for event ${eventType.title}`);

    // Send notification
    if (eventType.userId !== hostUserId) {
      // This is a guest booking - notify host
      await notificationService.sendBookingCreated({
        bookingUid: booking.uid,
        hostEmail: eventType.user.email,
        hostName: eventType.user.name,
        attendeeEmail: attendeeEmail,
        attendeeName: attendeeName,
        eventTitle: eventType.title,
        startTime: booking.startTime,
        endTime: booking.endTime,
        timezone: booking.timezone,
        locationType: booking.locationType,
      });
    }

    return booking as BookingWithRelations;
  }

  /**
   * Get booking by UID
   */
  async getBookingByUid(uid: string): Promise<BookingWithRelations | null> {
    const booking = await prisma.booking.findUnique({
      where: { uid },
      include: {
        eventType: {
          include: {
            user: {
              select: { id: true, name: true, email: true, username: true },
            },
          },
        },
        attendee: true,
      },
    });

    return booking as BookingWithRelations | null;
  }

  /**
   * Get booking by ID
   */
  async getBookingById(id: string): Promise<BookingWithRelations | null> {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        eventType: {
          include: {
            user: {
              select: { id: true, name: true, email: true, username: true },
            },
          },
        },
        attendee: true,
      },
    });

    return booking as BookingWithRelations | null;
  }

  /**
   * List bookings for a host
   */
  async listBookings(
    hostUserId: string,
    options: {
      status?: BookingStatus;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ bookings: BookingWithRelations[]; total: number }> {
    const { status, startDate, endDate, page = 1, limit = 20 } = options;

    const where: Prisma.BookingWhereInput = { userId: hostUserId };

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = startDate;
      if (endDate) where.startTime.lte = endDate;
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          eventType: {
            include: {
              user: {
                select: { id: true, name: true, email: true, username: true },
              },
            },
          },
          attendee: true,
        },
        orderBy: { startTime: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);

    return { bookings: bookings as BookingWithRelations[], total };
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(
    uid: string,
    input: CancelBookingInput,
    cancelledBy: 'host' | 'guest'
  ): Promise<BookingWithRelations> {
    const { reason, notifyHost, notifyGuest } = input;

    const booking = await prisma.booking.findUnique({
      where: { uid },
      include: {
        eventType: {
          include: {
            user: true,
          },
        },
        attendee: true,
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new Error('Booking is already cancelled');
    }

    if (booking.status === BookingStatus.COMPLETED) {
      throw new Error('Cannot cancel a completed booking');
    }

    // Update booking
    const updatedBooking = await prisma.booking.update({
      where: { uid },
      data: {
        status: BookingStatus.CANCELLED,
        cancellationReason: reason,
        cancelledAt: new Date(),
      },
      include: {
        eventType: {
          include: {
            user: {
              select: { id: true, name: true, email: true, username: true },
            },
          },
        },
        attendee: true,
      },
    });

    logger.info(`[Booking] Cancelled booking ${uid} by ${cancelledBy}`);

    // Send notifications
    if (notifyHost && cancelledBy === 'guest') {
      await notificationService.sendBookingCancelled({
        bookingUid: uid,
        hostEmail: booking.eventType.user.email,
        hostName: booking.eventType.user.name,
        attendeeEmail: booking.attendee?.email || '',
        attendeeName: booking.attendee?.name || '',
        eventTitle: booking.eventType.title,
        startTime: booking.startTime,
        endTime: booking.endTime,
        timezone: booking.timezone,
        locationType: booking.locationType,
        reason,
      });
    }

    if (notifyGuest && cancelledBy === 'host') {
      await notificationService.sendBookingCancelled({
        bookingUid: uid,
        hostEmail: booking.eventType.user.email,
        hostName: booking.eventType.user.name,
        attendeeEmail: booking.attendee?.email || '',
        attendeeName: booking.attendee?.name || '',
        eventTitle: booking.eventType.title,
        startTime: booking.startTime,
        endTime: booking.endTime,
        timezone: booking.timezone,
        locationType: booking.locationType,
        reason,
      });
    }

    return updatedBooking as BookingWithRelations;
  }

  /**
   * Reschedule a booking
   */
  async rescheduleBooking(
    uid: string,
    input: RescheduleBookingInput,
    rescheduledBy: 'host' | 'guest'
  ): Promise<BookingWithRelations> {
    const { newStartTime, newEndTime, notifyHost, notifyGuest } = input;

    const booking = await prisma.booking.findUnique({
      where: { uid },
      include: {
        eventType: {
          include: {
            user: true,
          },
        },
        attendee: true,
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new Error('Cannot reschedule a cancelled booking');
    }

    if (booking.status === BookingStatus.COMPLETED) {
      throw new Error('Cannot reschedule a completed booking');
    }

    // Check new slot availability (excluding current booking)
    const isAvailable = await this.isSlotAvailableForReschedule(
      booking.eventTypeId,
      new Date(newStartTime),
      new Date(newEndTime),
      uid
    );

    if (!isAvailable) {
      throw new Error('Selected time slot is not available');
    }

    // Update booking
    const updatedBooking = await prisma.booking.update({
      where: { uid },
      data: {
        startTime: new Date(newStartTime),
        endTime: new Date(newEndTime),
        status: booking.eventType.requiresConfirmation
          ? BookingStatus.PENDING
          : BookingStatus.CONFIRMED,
        confirmedAt: !booking.eventType.requiresConfirmation ? new Date() : null,
      },
      include: {
        eventType: {
          include: {
            user: {
              select: { id: true, name: true, email: true, username: true },
            },
          },
        },
        attendee: true,
      },
    });

    // Mark original booking as rescheduled
    await prisma.booking.update({
      where: { uid },
      data: {
        rescheduledTo: updatedBooking.uid,
      },
    });

    await prisma.booking.update({
      where: { uid: updatedBooking.uid },
      data: {
        rescheduledFrom: uid,
      },
    });

    logger.info(`[Booking] Rescheduled booking ${uid} to ${newStartTime}`);

    // Send notifications
    await notificationService.sendBookingRescheduled({
      bookingUid: updatedBooking.uid,
      hostEmail: booking.eventType.user.email,
      hostName: booking.eventType.user.name,
      attendeeEmail: booking.attendee?.email || '',
      attendeeName: booking.attendee?.name || '',
      eventTitle: booking.eventType.title,
      oldStartTime: booking.startTime,
      oldEndTime: booking.endTime,
      newStartTime: updatedBooking.startTime,
      newEndTime: updatedBooking.endTime,
      timezone: updatedBooking.timezone,
      locationType: updatedBooking.locationType,
    });

    return updatedBooking as BookingWithRelations;
  }

  /**
   * Confirm a booking (host approves)
   */
  async confirmBooking(uid: string): Promise<BookingWithRelations> {
    const booking = await prisma.booking.findUnique({
      where: { uid },
      include: {
        eventType: {
          include: {
            user: true,
          },
        },
        attendee: true,
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new Error('Only pending bookings can be confirmed');
    }

    const updatedBooking = await prisma.booking.update({
      where: { uid },
      data: {
        status: BookingStatus.CONFIRMED,
        confirmedAt: new Date(),
      },
      include: {
        eventType: {
          include: {
            user: {
              select: { id: true, name: true, email: true, username: true },
            },
          },
        },
        attendee: true,
      },
    });

    logger.info(`[Booking] Confirmed booking ${uid}`);

    // Send confirmation to attendee
    await notificationService.sendBookingConfirmed({
      bookingUid: uid,
      hostEmail: booking.eventType.user.email,
      hostName: booking.eventType.user.name,
      attendeeEmail: booking.attendee?.email || '',
      attendeeName: booking.attendee?.name || '',
      eventTitle: booking.eventType.title,
      startTime: booking.startTime,
      endTime: booking.endTime,
      timezone: booking.timezone,
      locationType: booking.locationType,
    });

    return updatedBooking as BookingWithRelations;
  }

  /**
   * Complete a booking (mark as done)
   */
  async completeBooking(uid: string): Promise<BookingWithRelations> {
    const booking = await prisma.booking.findUnique({
      where: { uid },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new Error('Only confirmed bookings can be completed');
    }

    const updatedBooking = await prisma.booking.update({
      where: { uid },
      data: { status: BookingStatus.COMPLETED },
      include: {
        eventType: {
          include: {
            user: {
              select: { id: true, name: true, email: true, username: true },
            },
          },
        },
        attendee: true,
      },
    });

    logger.info(`[Booking] Completed booking ${uid}`);

    return updatedBooking as BookingWithRelations;
  }

  /**
   * Mark booking as no-show
   */
  async markNoShow(uid: string): Promise<BookingWithRelations> {
    const booking = await prisma.booking.findUnique({
      where: { uid },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    const updatedBooking = await prisma.booking.update({
      where: { uid },
      data: { status: BookingStatus.NO_SHOW },
      include: {
        eventType: {
          include: {
            user: {
              select: { id: true, name: true, email: true, username: true },
            },
          },
        },
        attendee: true,
      },
    });

    logger.info(`[Booking] Marked booking ${uid} as no-show`);

    return updatedBooking as BookingWithRelations;
  }

  /**
   * Check slot availability for reschedule (excluding current booking)
   */
  private async isSlotAvailableForReschedule(
    eventTypeId: string,
    startTime: Date,
    endTime: Date,
    excludeBookingUid: string
  ): Promise<boolean> {
    const overlappingBooking = await prisma.booking.findFirst({
      where: {
        eventTypeId,
        uid: { not: excludeBookingUid },
        status: { in: ['PENDING', 'CONFIRMED'] },
        OR: [
          {
            startTime: { lt: endTime },
            endTime: { gt: startTime },
          },
        ],
      },
    });

    return !overlappingBooking;
  }

  /**
   * Find or create attendee
   */
  private async findOrCreateAttendee(data: {
    email: string;
    name: string;
    phone?: string;
  }): Promise<{ id: string; email: string; name: string; phone: string | null }> {
    let attendee = await prisma.attendee.findUnique({
      where: { email: data.email },
    });

    if (!attendee) {
      attendee = await prisma.attendee.create({
        data: {
          email: data.email,
          name: data.name,
          phone: data.phone,
        },
      });
    } else if (data.phone && !attendee.phone) {
      // Update phone if not set
      attendee = await prisma.attendee.update({
        where: { email: data.email },
        data: { phone: data.phone },
      });
    }

    return attendee;
  }

  /**
   * Get location details based on event type
   */
  private getLocationDetails(eventType: {
    locationType: LocationType;
    locationAddress?: string | null;
    meetingUrl?: string | null;
    phoneNumber?: string | null;
  }): Prisma.JsonObject {
    switch (eventType.locationType) {
      case LocationType.IN_PERSON:
        return { address: eventType.locationAddress };
      case LocationType.VIDEO_CALL:
        return { meetingUrl: eventType.meetingUrl };
      case LocationType.PHONE_CALL:
        return { phoneNumber: eventType.phoneNumber };
      case LocationType.CUSTOM_LINK:
        return { link: eventType.meetingUrl };
      default:
        return {};
    }
  }
}

export const bookingService = new BookingService();
export default bookingService;
