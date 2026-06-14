// ReZ Schedule - Reminder Service
// Cron job service for sending booking reminders
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { notificationService } from './notificationService';
import { dayjs } from '../utils/datetime';

export interface ReminderConfig {
  hoursBeforeBooking: number[];
  notify: 'host' | 'attendee' | 'both';
}

const DEFAULT_REMINDER_CONFIG: ReminderConfig = {
  hoursBeforeBooking: [24, 1],
  notify: 'both',
};

export class ReminderService {
  private reminderConfig: ReminderConfig = DEFAULT_REMINDER_CONFIG;

  configure(config: Partial<ReminderConfig>): void {
    this.reminderConfig = {
      ...this.reminderConfig,
      ...config,
    };
  }

  async processReminders(): Promise<{ processed: number; sent: number; errors: number }> {
    const result = { processed: 0, sent: 0, errors: 0 };

    try {
      const upcomingBookings = await this.getUpcomingBookings();

      for (const booking of upcomingBookings) {
        result.processed++;

        try {
          const remindersSent = await this.processBookingReminder(booking);
          if (remindersSent > 0) {
            result.sent += remindersSent;
          }
        } catch (error) {
          result.errors++;
          logger.error(`[Reminder] Error processing booking ${booking.uid}:`, error);
        }
      }

      logger.info(`[Reminder] Processed: ${result.processed}, Sent: ${result.sent}, Errors: ${result.errors}`);
    } catch (error) {
      logger.error('[Reminder] Process error:', error);
    }

    return result;
  }

  private async getUpcomingBookings() {
    const now = dayjs();
    const maxHours = Math.max(...this.reminderConfig.hoursBeforeBooking);
    const maxTime = now.add(maxHours + 1, 'hour').toDate();

    return prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        startTime: {
          gte: now.toDate(),
          lte: maxTime,
        },
      },
      include: {
        eventType: {
          select: { title: true, duration: true },
        },
        user: {
          select: { name: true, email: true, timeZone: true },
        },
        attendee: {
          select: { name: true, email: true },
        },
      },
    });
  }

  private async processBookingReminder(booking: {
    uid: string;
    startTime: Date;
    timezone: string;
    remindersSent: unknown;
    eventType: { title: string; duration: number };
    user: { name: string; email: string; timeZone: string };
    attendee: { name: string; email: string } | null;
  }): Promise<number> {
    let sent = 0;
    const remindersSent = (booking.remindersSent as Record<string, boolean>) || {};
    const now = dayjs();

    for (const hours of this.reminderConfig.hoursBeforeBooking) {
      const reminderKey = `reminder_${hours}h`;

      if (remindersSent[reminderKey]) {
        continue;
      }

      const reminderTime = dayjs(booking.startTime)
        .tz(booking.timezone)
        .subtract(hours, 'hour');

      if (now.isAfter(reminderTime) && now.isBefore(dayjs(booking.startTime))) {
        const sentSuccessfully = await this.sendReminder(booking, hours);

        if (sentSuccessfully) {
          await this.markReminderSent(booking.uid, reminderKey);
          sent++;
        }
      }
    }

    return sent;
  }

  private async sendReminder(
    booking: {
      uid: string;
      startTime: Date;
      timezone: string;
      eventType: { title: string };
      user: { name: string; email: string };
      attendee: { name: string; email: string } | null;
    },
    hoursBefore: number
  ): Promise<boolean> {
    const formattedTime = dayjs(booking.startTime)
      .tz(booking.timezone)
      .format('dddd, MMMM D, YYYY [at] h:mm A');

    const timeUntil = dayjs(booking.startTime).tz(booking.timezone).fromNow();

    try {
      if (this.reminderConfig.notify === 'host' || this.reminderConfig.notify === 'both') {
        await notificationService.sendEmail({
          to: booking.user.email,
          subject: `Reminder: ${booking.eventType.title} in ${timeUntil}`,
          template: 'booking_reminder_host',
          data: {
            hostName: booking.user.name,
            eventTitle: booking.eventType.title,
            startTime: formattedTime,
            timeUntil,
            bookingUid: booking.uid,
            attendeeName: booking.attendee?.name || 'Guest',
          },
        });
      }

      if ((this.reminderConfig.notify === 'attendee' || this.reminderConfig.notify === 'both') && booking.attendee) {
        await notificationService.sendEmail({
          to: booking.attendee.email,
          subject: `Reminder: ${booking.eventType.title} in ${timeUntil}`,
          template: 'booking_reminder_attendee',
          data: {
            attendeeName: booking.attendee.name,
            eventTitle: booking.eventType.title,
            startTime: formattedTime,
            timeUntil,
            bookingUid: booking.uid,
            hostName: booking.user.name,
          },
        });
      }

      logger.info(`[Reminder] Sent ${hoursBefore}h reminder for booking ${booking.uid}`);
      return true;
    } catch (error) {
      logger.error(`[Reminder] Failed to send reminder:`, error);
      return false;
    }
  }

  private async markReminderSent(bookingUid: string, reminderKey: string): Promise<void> {
    const booking = await prisma.booking.findUnique({
      where: { uid: bookingUid },
      select: { remindersSent: true },
    });

    const remindersSent = (booking?.remindersSent as Record<string, boolean>) || {};
    remindersSent[reminderKey] = true;

    await prisma.booking.update({
      where: { uid: bookingUid },
      data: {
        remindersSent: remindersSent as object,
      },
    });
  }

  async sendCustomReminder(
    bookingUid: string,
    message: string,
    recipient: 'host' | 'attendee' | 'both'
  ): Promise<boolean> {
    const booking = await prisma.booking.findUnique({
      where: { uid: bookingUid },
      include: { eventType: true, user: true, attendee: true },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    try {
      if (recipient === 'host' || recipient === 'both') {
        await notificationService.sendEmail({
          to: booking.user.email,
          subject: `Message about your booking`,
          template: 'custom_reminder',
          data: {
            recipientName: booking.user.name,
            eventTitle: booking.eventType.title,
            message,
            bookingUid: booking.uid,
          },
        });
      }

      if ((recipient === 'attendee' || recipient === 'both') && booking.attendee) {
        await notificationService.sendEmail({
          to: booking.attendee.email,
          subject: `Message about your booking`,
          template: 'custom_reminder',
          data: {
            recipientName: booking.attendee.name,
            eventTitle: booking.eventType.title,
            message,
            bookingUid: booking.uid,
          },
        });
      }

      return true;
    } catch (error) {
      logger.error(`[Reminder] Custom reminder failed:`, error);
      return false;
    }
  }

  async getReminderStats(startDate: Date, endDate: Date): Promise<{
    totalRemindersSent: number;
    byHours: Record<number, number>;
  }> {
    const bookings = await prisma.booking.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        remindersSent: { not: null },
      },
      select: { remindersSent: true },
    });

    const stats = {
      totalRemindersSent: 0,
      byHours: {} as Record<number, number>,
    };

    for (const booking of bookings) {
      const reminders = booking.remindersSent as Record<string, boolean> | null;
      if (reminders) {
        for (const [key, sent] of Object.entries(reminders)) {
          if (sent) {
            stats.totalRemindersSent++;
            const hours = parseInt(key.replace('reminder_', '').replace('h', ''));
            if (!isNaN(hours)) {
              stats.byHours[hours] = (stats.byHours[hours] || 0) + 1;
            }
          }
        }
      }
    }

    return stats;
  }
}

export const reminderService = new ReminderService();
export default reminderService;
