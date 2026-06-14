// ReZ Schedule - Notification Service
// Integrates with RABTUL Notifications (4011)
import axios from 'axios';
import { logger } from '../utils/logger';
import type { LocationType } from '../types';
import { dayjs } from '../utils/datetime';

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4011';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

interface NotificationPayload {
  type: string;
  channel: 'email' | 'sms' | 'push';
  recipient: string;
  template: string;
  data: Record<string, unknown>;
}

interface BookingNotificationData {
  bookingUid: string;
  hostEmail: string;
  hostName: string;
  attendeeEmail: string;
  attendeeName: string;
  eventTitle: string;
  startTime: Date;
  endTime: Date;
  timezone: string;
  locationType: LocationType;
  locationDetails?: Record<string, unknown>;
  reason?: string;
  oldStartTime?: Date;
  oldEndTime?: Date;
  newStartTime?: Date;
  newEndTime?: Date;
}

export class NotificationService {
  /**
   * Send booking created notification
   */
  async sendBookingCreated(data: BookingNotificationData): Promise<void> {
    const { bookingUid, hostEmail, hostName, attendeeEmail, attendeeName, eventTitle, startTime, endTime, timezone } = data;

    const formattedTime = dayjs(startTime).tz(timezone).format('dddd, MMMM D, YYYY [at] h:mm A');
    const guestDetails = `${attendeeName} (${attendeeEmail})`;

    // Notify host
    await this.sendEmail({
      to: hostEmail,
      subject: `New Booking: ${eventTitle}`,
      template: 'booking_created_host',
      data: {
        hostName,
        attendeeName,
        attendeeEmail,
        eventTitle,
        startTime: formattedTime,
        timezone,
        bookingUid,
      },
    });

    // Notify attendee
    await this.sendEmail({
      to: attendeeEmail,
      subject: `Booking Confirmed: ${eventTitle}`,
      template: 'booking_created_attendee',
      data: {
        attendeeName,
        hostName,
        eventTitle,
        startTime: formattedTime,
        timezone,
        bookingUid,
      },
    });

    logger.info(`[Notification] Sent booking created notifications for ${bookingUid}`);
  }

  /**
   * Send booking confirmed notification
   */
  async sendBookingConfirmed(data: BookingNotificationData): Promise<void> {
    const { bookingUid, attendeeEmail, attendeeName, eventTitle, startTime, endTime, timezone, hostName } = data;

    const formattedTime = dayjs(startTime).tz(timezone).format('dddd, MMMM D, YYYY [at] h:mm A');

    await this.sendEmail({
      to: attendeeEmail,
      subject: `Booking Confirmed: ${eventTitle}`,
      template: 'booking_confirmed',
      data: {
        attendeeName,
        hostName,
        eventTitle,
        startTime: formattedTime,
        timezone,
        bookingUid,
      },
    });

    logger.info(`[Notification] Sent booking confirmed notification for ${bookingUid}`);
  }

  /**
   * Send booking cancelled notification
   */
  async sendBookingCancelled(data: BookingNotificationData): Promise<void> {
    const { bookingUid, hostEmail, hostName, attendeeEmail, attendeeName, eventTitle, startTime, timezone, reason } = data;

    const formattedTime = dayjs(startTime).tz(timezone).format('dddd, MMMM D, YYYY [at] h:mm A');

    // Notify the other party
    const notifyEmail = attendeeEmail === hostEmail ? hostEmail : attendeeEmail;
    const notifyName = attendeeEmail === hostEmail ? hostName : attendeeName;

    await this.sendEmail({
      to: notifyEmail,
      subject: `Booking Cancelled: ${eventTitle}`,
      template: 'booking_cancelled',
      data: {
        notifyName,
        hostName,
        eventTitle,
        startTime: formattedTime,
        timezone,
        reason,
        bookingUid,
      },
    });

    logger.info(`[Notification] Sent booking cancelled notification for ${bookingUid}`);
  }

  /**
   * Send booking rescheduled notification
   */
  async sendBookingRescheduled(data: BookingNotificationData): Promise<void> {
    const {
      bookingUid,
      hostEmail,
      hostName,
      attendeeEmail,
      attendeeName,
      eventTitle,
      oldStartTime,
      oldEndTime,
      newStartTime,
      newEndTime,
      timezone,
    } = data;

    const oldTime = dayjs(oldStartTime).tz(timezone).format('dddd, MMMM D, YYYY [at] h:mm A');
    const newTime = dayjs(newStartTime).tz(timezone).format('dddd, MMMM D, YYYY [at] h:mm A');

    // Notify both host and attendee
    const recipients = [
      { email: hostEmail, name: hostName },
      { email: attendeeEmail, name: attendeeName },
    ];

    for (const recipient of recipients) {
      await this.sendEmail({
        to: recipient.email,
        subject: `Booking Rescheduled: ${eventTitle}`,
        template: 'booking_rescheduled',
        data: {
          recipientName: recipient.name,
          hostName,
          eventTitle,
          oldStartTime: oldTime,
          newStartTime: newTime,
          timezone,
          bookingUid,
        },
      });
    }

    logger.info(`[Notification] Sent booking rescheduled notifications for ${bookingUid}`);
  }

  /**
   * Send booking reminder
   */
  async sendBookingReminder(data: BookingNotificationData): Promise<void> {
    const { bookingUid, hostEmail, hostName, attendeeEmail, attendeeName, eventTitle, startTime, timezone } = data;

    const formattedTime = dayjs(startTime).tz(timezone).format('dddd, MMMM D, YYYY [at] h:mm A');
    const timeUntil = dayjs(startTime).tz(timezone).fromNow();

    // Notify both parties
    const recipients = [
      { email: hostEmail, name: hostName, role: 'host' },
      { email: attendeeEmail, name: attendeeName, role: 'attendee' },
    ];

    for (const recipient of recipients) {
      await this.sendEmail({
        to: recipient.email,
        subject: `Reminder: ${eventTitle} in ${timeUntil}`,
        template: 'booking_reminder',
        data: {
          recipientName: recipient.name,
          eventTitle,
          startTime: formattedTime,
          timeUntil,
          timezone,
          bookingUid,
        },
      });
    }

    logger.info(`[Notification] Sent booking reminder for ${bookingUid}`);
  }

  /**
   * Send SMS notification
   */
  async sendSMS(to: string, message: string): Promise<void> {
    try {
      await axios.post(
        `${NOTIFICATION_SERVICE_URL}/api/sms/send`,
        { to, message },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
          },
        }
      );
      logger.info(`[Notification] Sent SMS to ${to}`);
    } catch (error) {
      logger.error(`[Notification] Failed to send SMS to ${to}:`, error);
    }
  }

  /**
   * Send push notification
   */
  async sendPushNotification(userId: string, title: string, body: string, data?: Record<string, unknown>): Promise<void> {
    try {
      await axios.post(
        `${NOTIFICATION_SERVICE_URL}/api/push/send`,
        { userId, title, body, data },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
          },
        }
      );
      logger.info(`[Notification] Sent push notification to user ${userId}`);
    } catch (error) {
      logger.error(`[Notification] Failed to send push notification to ${userId}:`, error);
    }
  }

  /**
   * Internal method to send email
   */
  private async sendEmail(payload: {
    to: string;
    subject: string;
    template: string;
    data: Record<string, unknown>;
  }): Promise<void> {
    try {
      await axios.post(
        `${NOTIFICATION_SERVICE_URL}/api/email/send`,
        {
          to: payload.to,
          subject: payload.subject,
          template: payload.template,
          data: payload.data,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
          },
        }
      );
      logger.info(`[Notification] Sent email to ${payload.to} with template ${payload.template}`);
    } catch (error) {
      logger.error(`[Notification] Failed to send email to ${payload.to}:`, error);
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;
