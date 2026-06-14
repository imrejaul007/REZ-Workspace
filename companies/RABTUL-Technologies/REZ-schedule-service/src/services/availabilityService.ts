// ReZ Schedule - Availability Engine
import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import {
  dayjs,
  getDateRange,
  getDayOfWeek,
  timeToMinutes,
  minutesToTime,
  isTimeInRange,
  addMinutes,
  isPast,
  doSlotsOverlap,
  getMinBookingTime,
} from '../utils/datetime';
import type { TimeSlot } from '../types';

interface ScheduleDay {
  dayOfWeek: number;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

interface EventTypeWithSchedule {
  id: string;
  duration: number;
  bufferTime: number;
  minNoticeMinutes: number;
  maxBookingsPerDay: number | null;
  slotInterval: number | null;
  schedules: {
    schedule: {
      availability: ScheduleDay[];
    };
  }[];
}

interface ExistingBooking {
  startTime: Date;
  endTime: Date;
}

interface SpecialDate {
  date: Date;
  type: 'BLOCKED' | 'AVAILABLE' | 'MODIFIED_HOURS';
  startTime: string | null;
  endTime: string | null;
}

export class AvailabilityService {
  /**
   * Get available time slots for an event type within a date range
   */
  async getAvailableSlots(
    eventTypeId: string,
    startDate: Date,
    endDate: Date,
    guestTimezone?: string
  ): Promise<TimeSlot[]> {
    const eventType = await this.getEventType(eventTypeId);
    if (!eventType) {
      throw new Error('Event type not found');
    }

    const timezone = guestTimezone || 'Asia/Kolkata';
    const dates = getDateRange(startDate, endDate);
    const slots: TimeSlot[] = [];

    for (const date of dates) {
      const daySlots = await this.getSlotsForDay(
        eventType,
        date,
        timezone
      );
      slots.push(...daySlots);
    }

    return slots;
  }

  /**
   * Get available slots for a single day
   */
  private async getSlotsForDay(
    eventType: EventTypeWithSchedule,
    date: Date,
    timezone: string
  ): Promise<TimeSlot[]> {
    const slots: TimeSlot[] = [];
    const dayOfWeek = getDayOfWeek(date);

    // Check if date is in the past
    if (isPast(date, timezone)) {
      return slots;
    }

    // Check special dates (holidays, exceptions)
    const specialDate = await this.getSpecialDate(eventType.id, date);
    if (specialDate?.type === 'BLOCKED') {
      return slots;
    }

    // Get schedule for this day
    const scheduleDay = this.getScheduleDay(eventType, dayOfWeek);
    if (!scheduleDay?.enabled) {
      return slots;
    }

    // Get duration and interval
    const duration = eventType.duration + eventType.bufferTime;
    const slotInterval = eventType.slotInterval || duration;

    // Get existing bookings for this day
    const existingBookings = await this.getExistingBookings(eventType.id, date, timezone);

    // Get count of bookings for this day
    const bookingsToday = existingBookings.length;
    if (eventType.maxBookingsPerDay && bookingsToday >= eventType.maxBookingsPerDay) {
      return slots;
    }

    // Calculate start and end times for this day
    const dayStart = dayjs(date).tz(timezone).startOf('day');
    const dayEnd = dayjs(date).tz(timezone).endOf('day');

    // Get working hours for this day
    let workStartMinutes = timeToMinutes(scheduleDay.startTime);
    let workEndMinutes = timeToMinutes(scheduleDay.endTime);

    // Override with special date hours if modified
    if (specialDate?.type === 'MODIFIED_HOURS' && specialDate.startTime && specialDate.endTime) {
      workStartMinutes = timeToMinutes(specialDate.startTime);
      workEndMinutes = timeToMinutes(specialDate.endTime);
    }

    // Get minimum booking time (now + notice period)
    const minBookingTime = getMinBookingTime(eventType.minNoticeMinutes, timezone);

    // Generate slots
    let currentMinutes = workStartMinutes;

    while (currentMinutes + duration <= workEndMinutes) {
      const slotStart = dayStart.add(currentMinutes, 'minute');
      const slotEnd = slotStart.add(duration, 'minute');

      // Check if slot is in the past
      if (slotStart.toDate() < minBookingTime) {
        currentMinutes += slotInterval;
        continue;
      }

      // Check if slot is within working hours
      const slotStartTime = minutesToTime(currentMinutes);
      const slotEndTime = minutesToTime(currentMinutes + duration);

      if (!isTimeInRange(slotStartTime, scheduleDay.startTime, scheduleDay.endTime)) {
        currentMinutes += slotInterval;
        continue;
      }

      // Check if slot overlaps with existing bookings
      const isAvailable = !existingBookings.some(booking =>
        doSlotsOverlap(slotStart.toDate(), slotEnd.toDate(), booking.startTime, booking.endTime)
      );

      slots.push({
        startTime: slotStart.toDate(),
        endTime: slotEnd.toDate(),
        available: isAvailable,
      });

      currentMinutes += slotInterval;
    }

    return slots;
  }

  /**
   * Get event type with its schedule
   */
  private async getEventType(eventTypeId: string): Promise<EventTypeWithSchedule | null> {
    return prisma.eventType.findUnique({
      where: { id: eventTypeId },
      include: {
        schedules: {
          include: {
            schedule: {
              include: {
                availability: true,
              },
            },
          },
        },
      },
    }) as Promise<EventTypeWithSchedule | null>;
  }

  /**
   * Get event type by username and slug (public)
   */
  async getEventTypeByUsernameAndSlug(
    username: string,
    slug: string
  ): Promise<EventTypeWithSchedule | null> {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return null;
    }

    return prisma.eventType.findUnique({
      where: {
        userId_slug: {
          userId: user.id,
          slug,
        },
      },
      include: {
        schedules: {
          include: {
            schedule: {
              include: {
                availability: true,
              },
            },
          },
        },
      },
    }) as Promise<EventTypeWithSchedule | null>;
  }

  /**
   * Get schedule day for a specific day of week
   */
  private getScheduleDay(eventType: EventTypeWithSchedule, dayOfWeek: number): ScheduleDay | null {
    // Try to find a schedule linked to this event type
    for (const eventSchedule of eventType.schedules) {
      const day = eventSchedule.schedule.availability.find(d => d.dayOfWeek === dayOfWeek);
      if (day) {
        return day;
      }
    }

    // Fallback to default schedule (first schedule with availability)
    if (eventType.schedules.length > 0) {
      const defaultSchedule = eventType.schedules[0].schedule.availability.find(d => d.dayOfWeek === dayOfWeek);
      return defaultSchedule || null;
    }

    return null;
  }

  /**
   * Get existing bookings for a day
   */
  private async getExistingBookings(
    eventTypeId: string,
    date: Date,
    timezone: string
  ): Promise<ExistingBooking[]> {
    const dayStart = dayjs(date).tz(timezone).startOf('day').toDate();
    const dayEnd = dayjs(date).tz(timezone).endOf('day').toDate();

    const bookings = await prisma.booking.findMany({
      where: {
        eventTypeId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        startTime: { gte: dayStart },
        endTime: { lte: dayEnd },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    return bookings;
  }

  /**
   * Get special date (holiday, exception) for a date
   */
  private async getSpecialDate(
    eventTypeId: string,
    date: Date
  ): Promise<SpecialDate | null> {
    const eventType = await prisma.eventType.findUnique({
      where: { id: eventTypeId },
      select: { userId: true },
    });

    if (!eventType) {
      return null;
    }

    const specialDate = await prisma.specialDate.findFirst({
      where: {
        userId: eventType.userId,
        date: dayjs(date).startOf('day').toDate(),
      },
    });

    return specialDate as SpecialDate | null;
  }

  /**
   * Check if a specific slot is available
   */
  async isSlotAvailable(
    eventTypeId: string,
    startTime: Date,
    endTime: Date,
    timezone: string
  ): Promise<boolean> {
    const eventType = await this.getEventType(eventTypeId);
    if (!eventType) {
      return false;
    }

    // Check if start time is in the past
    const minBookingTime = getMinBookingTime(eventType.minNoticeMinutes, timezone);
    if (startTime < minBookingTime) {
      return false;
    }

    // Check max bookings per day
    const bookingsToday = await prisma.booking.count({
      where: {
        eventTypeId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        startTime: {
          gte: dayjs(startTime).tz(timezone).startOf('day').toDate(),
          lte: dayjs(startTime).tz(timezone).endOf('day').toDate(),
        },
      },
    });

    if (eventType.maxBookingsPerDay && bookingsToday >= eventType.maxBookingsPerDay) {
      return false;
    }

    // Check for overlapping bookings
    const overlappingBooking = await prisma.booking.findFirst({
      where: {
        eventTypeId,
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
   * Get default availability schedule for a user
   */
  async getDefaultSchedule(userId: string): Promise<ScheduleDay[]> {
    const schedule = await prisma.schedule.findFirst({
      where: { userId, isDefault: true },
      include: { availability: true },
    });

    if (!schedule) {
      // Return default working hours (Mon-Fri, 9am-5pm)
      return [
        { dayOfWeek: 0, enabled: false, startTime: '09:00', endTime: '17:00' }, // Sun
        { dayOfWeek: 1, enabled: true, startTime: '09:00', endTime: '17:00' },  // Mon
        { dayOfWeek: 2, enabled: true, startTime: '09:00', endTime: '17:00' },  // Tue
        { dayOfWeek: 3, enabled: true, startTime: '09:00', endTime: '17:00' },  // Wed
        { dayOfWeek: 4, enabled: true, startTime: '09:00', endTime: '17:00' },  // Thu
        { dayOfWeek: 5, enabled: true, startTime: '09:00', endTime: '17:00' },  // Fri
        { dayOfWeek: 6, enabled: false, startTime: '09:00', endTime: '17:00' }, // Sat
      ];
    }

    return schedule.availability;
  }
}

export const availabilityService = new AvailabilityService();
export default availabilityService;
