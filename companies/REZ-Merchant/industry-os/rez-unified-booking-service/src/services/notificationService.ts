import axios from 'axios';
import { UnifiedBookingDocument } from '../models';
import { WaitlistEntryDocument } from '../models/WaitlistEntry';
import { getConfig } from '../config';
import { createLogger } from '../utils/logger';
import { NotificationChannel, NotificationResult, UnifiedBooking, WaitlistEntry } from '../types';

const logger = createLogger('notification-service');

// Default notification channels
const DEFAULT_CHANNELS: NotificationChannel[] = ['email'];

// ============================================
// Send Booking Confirmation
// ============================================

export async function sendBookingConfirmation(
  booking: UnifiedBooking | UnifiedBookingDocument
): Promise<NotificationResult[]> {
  const config = getConfig();

  const bookingData = booking instanceof UnifiedBooking || booking.bookingId
    ? booking
    : booking.toObject() as UnifiedBooking;

  const channels = DEFAULT_CHANNELS;
  const results: NotificationResult[] = [];

  logger.info('Sending booking confirmation', {
    bookingId: bookingData.bookingId,
    userId: bookingData.userId,
    channels,
  });

  // Send via RABTUL if configured
  if (config.RABTUL_ENABLED && config.RABTUL_API_KEY) {
    try {
      const rabtulResult = await sendViaRabtul({
        type: 'booking_confirmation',
        userId: bookingData.userId,
        channels,
        data: {
          bookingId: bookingData.bookingId,
          merchantId: bookingData.merchantId,
          vertical: bookingData.vertical,
          type: bookingData.type,
          startDateTime: bookingData.startDateTime,
          endDateTime: bookingData.endDateTime,
          partySize: bookingData.partySize,
          status: bookingData.status,
        },
      });

      results.push(rabtulResult);
    } catch (error) {
      logger.error('Failed to send RABTUL notification', {
        bookingId: bookingData.bookingId,
        error: error instanceof Error ? error.message : 'Unknown',
      });
    }
  }

  return results;
}

// ============================================
// Send Booking Reminder
// ============================================

export async function sendBookingReminder(
  booking: UnifiedBooking | UnifiedBookingDocument,
  hoursUntilBooking: number = 24
): Promise<NotificationResult[]> {
  const config = getConfig();

  const bookingData = booking instanceof UnifiedBooking || booking.bookingId
    ? booking
    : booking.toObject() as UnifiedBooking;

  const channels = DEFAULT_CHANNELS;
  const results: NotificationResult[] = [];

  logger.info('Sending booking reminder', {
    bookingId: bookingData.bookingId,
    hoursUntilBooking,
    channels,
  });

  if (config.RABTUL_ENABLED && config.RABTUL_API_KEY) {
    try {
      const rabtulResult = await sendViaRabtul({
        type: 'booking_reminder',
        userId: bookingData.userId,
        channels,
        data: {
          bookingId: bookingData.bookingId,
          merchantId: bookingData.merchantId,
          vertical: bookingData.vertical,
          startDateTime: bookingData.startDateTime,
          hoursUntilBooking,
        },
      });

      results.push(rabtulResult);
    } catch (error) {
      logger.error('Failed to send reminder via RABTUL', {
        bookingId: bookingData.bookingId,
        error: error instanceof Error ? error.message : 'Unknown',
      });
    }
  }

  return results;
}

// ============================================
// Send Cancellation Confirmation
// ============================================

export async function sendCancellationConfirmation(
  booking: UnifiedBooking | UnifiedBookingDocument,
  refundAmount?: number
): Promise<NotificationResult[]> {
  const config = getConfig();

  const bookingData = booking instanceof UnifiedBooking || booking.bookingId
    ? booking
    : booking.toObject() as UnifiedBooking;

  const channels = DEFAULT_CHANNELS;
  const results: NotificationResult[] = [];

  logger.info('Sending cancellation confirmation', {
    bookingId: bookingData.bookingId,
    refundAmount,
    channels,
  });

  if (config.RABTUL_ENABLED && config.RABTUL_API_KEY) {
    try {
      const rabtulResult = await sendViaRabtul({
        type: 'booking_cancellation',
        userId: bookingData.userId,
        channels,
        data: {
          bookingId: bookingData.bookingId,
          merchantId: bookingData.merchantId,
          vertical: bookingData.vertical,
          cancellationReason: bookingData.cancellationReason,
          refundAmount: refundAmount || 0,
        },
      });

      results.push(rabtulResult);
    } catch (error) {
      logger.error('Failed to send cancellation via RABTUL', {
        bookingId: bookingData.bookingId,
        error: error instanceof Error ? error.message : 'Unknown',
      });
    }
  }

  return results;
}

// ============================================
// Send Waitlist Notification
// ============================================

export async function sendWaitlistNotification(
  entry: WaitlistEntry | WaitlistEntryDocument,
  slotInfo: Record<string, unknown>
): Promise<NotificationResult[]> {
  const config = getConfig();

  const entryData = entry instanceof WaitlistEntry || entry.entryId
    ? entry
    : entry.toObject() as WaitlistEntry;

  const channels = DEFAULT_CHANNELS;
  const results: NotificationResult[] = [];

  logger.info('Sending waitlist notification', {
    entryId: entryData.entryId,
    userId: entryData.userId,
    merchantId: entryData.merchantId,
    channels,
  });

  if (config.RABTUL_ENABLED && config.RABTUL_API_KEY) {
    try {
      const rabtulResult = await sendViaRabtul({
        type: 'waitlist_available',
        userId: entryData.userId,
        channels,
        data: {
          entryId: entryData.entryId,
          merchantId: entryData.merchantId,
          vertical: entryData.vertical,
          date: entryData.date,
          time: entryData.time,
          partySize: entryData.partySize,
          expiresAt: entryData.expiresAt,
          ...slotInfo,
        },
      });

      results.push(rabtulResult);
    } catch (error) {
      logger.error('Failed to send waitlist notification via RABTUL', {
        entryId: entryData.entryId,
        error: error instanceof Error ? error.message : 'Unknown',
      });
    }
  }

  return results;
}

// ============================================
// RABTUL Integration
// ============================================

interface RabtulNotification {
  type: string;
  userId: string;
  channels: NotificationChannel[];
  data: Record<string, unknown>;
}

async function sendViaRabtul(notification: RabtulNotification): Promise<NotificationResult> {
  const config = getConfig();

  if (!config.RABTUL_API_KEY || !config.RABTUL_WEBHOOK_URL) {
    logger.warn('RABTUL not configured, skipping notification');
    return {
      notificationId: `NOTIF-${Date.now()}`,
      channel: 'email',
      status: 'queued',
    };
  }

  try {
    const response = await axios.post(
      config.RABTUL_WEBHOOK_URL,
      {
        event: notification.type,
        userId: notification.userId,
        channels: notification.channels,
        payload: notification.data,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Authorization': `Bearer ${config.RABTUL_API_KEY}`,
          'Content-Type': 'application/json',
          'X-Notification-Source': 'rez-unified-booking-service',
        },
        timeout: 10000,
      }
    );

    logger.info('RABTUL notification sent', {
      type: notification.type,
      userId: notification.userId,
      responseStatus: response.status,
    });

    return {
      notificationId: response.data?.notificationId || `RABTUL-${Date.now()}`,
      channel: notification.channels[0] || 'email',
      status: 'sent',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to send RABTUL notification';

    logger.error('RABTUL notification failed', {
      type: notification.type,
      userId: notification.userId,
      error: errorMessage,
    });

    return {
      notificationId: `RABTUL-FAILED-${Date.now()}`,
      channel: notification.channels[0] || 'email',
      status: 'failed',
      errorMessage,
    };
  }
}

// ============================================
// Schedule Reminders
// ============================================

// This would typically integrate with a job scheduler
// For now, this is a placeholder for reminder scheduling

export async function scheduleReminders(booking: UnifiedBooking): Promise<void> {
  const bookingData = booking instanceof UnifiedBooking || booking.bookingId
    ? booking
    : booking.toObject() as UnifiedBooking;

  const bookingTime = new Date(bookingData.startDateTime).getTime();
  const now = Date.now();
  const hoursUntilBooking = (bookingTime - now) / (1000 * 60 * 60);

  logger.info('Scheduling reminders', {
    bookingId: bookingData.bookingId,
    hoursUntilBooking,
  });

  // In production, this would:
  // 1. Schedule a 24-hour reminder if booking is > 24 hours away
  // 2. Schedule a 2-hour reminder if booking is > 2 hours away
  // 3. Store scheduled reminders in a job queue (Redis, etc.)
}

export default {
  sendBookingConfirmation,
  sendBookingReminder,
  sendCancellationConfirmation,
  sendWaitlistNotification,
  scheduleReminders,
};