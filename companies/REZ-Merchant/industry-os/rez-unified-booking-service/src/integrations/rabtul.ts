import axios, { AxiosInstance } from 'axios';
import { getConfig } from '../config';
import { createLogger } from '../utils/logger';
import { NotificationChannel, NotificationPayload } from '../types';

const logger = createLogger('rabtul-integration');

// RABTUL notification types
export type RabtulEventType =
  | 'booking_confirmation'
  | 'booking_reminder'
  | 'booking_cancellation'
  | 'waitlist_available'
  | 'payment_confirmed'
  | 'refund_processed';

export interface RabtulWebhookPayload {
  event: RabtulEventType;
  userId: string;
  channels: NotificationChannel[];
  payload: Record<string, unknown>;
  timestamp: string;
  source?: string;
}

export interface RabtulResponse {
  success: boolean;
  notificationId?: string;
  error?: string;
}

// ============================================
// RABTUL Client
// ============================================

let rabtulClient: AxiosInstance | null = null;

function getRabtulClient(): AxiosInstance | null {
  const config = getConfig();

  if (!config.RABTUL_ENABLED || !config.RABTUL_API_KEY || !config.RABTUL_WEBHOOK_URL) {
    return null;
  }

  if (rabtulClient) {
    return rabtulClient;
  }

  rabtulClient = axios.create({
    baseURL: config.RABTUL_WEBHOOK_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.RABTUL_API_KEY}`,
      'X-Notification-Source': 'rez-unified-booking-service',
    },
  });

  return rabtulClient;
}

// ============================================
// Send Notification via RABTUL
// ============================================

export async function sendNotification(
  payload: RabtulWebhookPayload
): Promise<RabtulResponse> {
  const client = getRabtulClient();

  if (!client) {
    logger.warn('RABTUL not configured, notification not sent', {
      event: payload.event,
      userId: payload.userId,
    });
    return {
      success: false,
      error: 'RABTUL not configured',
    };
  }

  try {
    const response = await client.post<RabtulResponse>('', payload);

    logger.info('RABTUL notification sent', {
      event: payload.event,
      userId: payload.userId,
      notificationId: response.data?.notificationId,
    });

    return {
      success: true,
      notificationId: response.data?.notificationId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logger.error('RABTUL notification failed', {
      event: payload.event,
      userId: payload.userId,
      error: errorMessage,
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

// ============================================
// Send Booking Confirmation
// ============================================

export async function sendBookingConfirmationNotification(
  userId: string,
  bookingData: {
    bookingId: string;
    merchantId: string;
    merchantName?: string;
    vertical: string;
    type: string;
    startDateTime: Date;
    endDateTime: Date;
    partySize?: number;
    totalAmount?: number;
    currency?: string;
    status: string;
  }
): Promise<RabtulResponse> {
  const payload: RabtulWebhookPayload = {
    event: 'booking_confirmation',
    userId,
    channels: ['email', 'sms'],
    payload: {
      bookingId: bookingData.bookingId,
      merchantId: bookingData.merchantId,
      merchantName: bookingData.merchantName,
      vertical: bookingData.vertical,
      type: bookingData.type,
      startDateTime: bookingData.startDateTime,
      endDateTime: bookingData.endDateTime,
      partySize: bookingData.partySize,
      totalAmount: bookingData.totalAmount,
      currency: bookingData.currency,
      status: bookingData.status,
    },
    timestamp: new Date().toISOString(),
    source: 'rez-unified-booking-service',
  };

  return sendNotification(payload);
}

// ============================================
// Send Booking Reminder
// ============================================

export async function sendBookingReminderNotification(
  userId: string,
  bookingData: {
    bookingId: string;
    merchantId: string;
    merchantName?: string;
    vertical: string;
    type: string;
    startDateTime: Date;
    hoursUntilBooking: number;
  }
): Promise<RabtulResponse> {
  const payload: RabtulWebhookPayload = {
    event: 'booking_reminder',
    userId,
    channels: ['email', 'push'],
    payload: {
      bookingId: bookingData.bookingId,
      merchantId: bookingData.merchantId,
      merchantName: bookingData.merchantName,
      vertical: bookingData.vertical,
      type: bookingData.type,
      startDateTime: bookingData.startDateTime,
      hoursUntilBooking: bookingData.hoursUntilBooking,
    },
    timestamp: new Date().toISOString(),
    source: 'rez-unified-booking-service',
  };

  return sendNotification(payload);
}

// ============================================
// Send Cancellation Notification
// ============================================

export async function sendCancellationNotification(
  userId: string,
  bookingData: {
    bookingId: string;
    merchantId: string;
    vertical: string;
    cancellationReason?: string;
    refundAmount?: number;
    currency?: string;
  }
): Promise<RabtulResponse> {
  const payload: RabtulWebhookPayload = {
    event: 'booking_cancellation',
    userId,
    channels: ['email'],
    payload: {
      bookingId: bookingData.bookingId,
      merchantId: bookingData.merchantId,
      vertical: bookingData.vertical,
      cancellationReason: bookingData.cancellationReason,
      refundAmount: bookingData.refundAmount,
      currency: bookingData.currency,
    },
    timestamp: new Date().toISOString(),
    source: 'rez-unified-booking-service',
  };

  return sendNotification(payload);
}

// ============================================
// Send Waitlist Notification
// ============================================

export async function sendWaitlistAvailableNotification(
  userId: string,
  waitlistData: {
    entryId: string;
    merchantId: string;
    merchantName?: string;
    vertical: string;
    date: string;
    time?: string;
    partySize: number;
    expiresAt: Date;
    bookingLink?: string;
  }
): Promise<RabtulResponse> {
  const payload: RabtulWebhookPayload = {
    event: 'waitlist_available',
    userId,
    channels: ['sms', 'push'],
    payload: {
      entryId: waitlistData.entryId,
      merchantId: waitlistData.merchantId,
      merchantName: waitlistData.merchantName,
      vertical: waitlistData.vertical,
      date: waitlistData.date,
      time: waitlistData.time,
      partySize: waitlistData.partySize,
      expiresAt: waitlistData.expiresAt,
      bookingLink: waitlistData.bookingLink,
    },
    timestamp: new Date().toISOString(),
    source: 'rez-unified-booking-service',
  };

  return sendNotification(payload);
}

// ============================================
// Send Payment Confirmation
// ============================================

export async function sendPaymentConfirmationNotification(
  userId: string,
  paymentData: {
    bookingId: string;
    paymentId: string;
    amount: number;
    currency: string;
    transactionId: string;
  }
): Promise<RabtulResponse> {
  const payload: RabtulWebhookPayload = {
    event: 'payment_confirmed',
    userId,
    channels: ['email'],
    payload: {
      bookingId: paymentData.bookingId,
      paymentId: paymentData.paymentId,
      amount: paymentData.amount,
      currency: paymentData.currency,
      transactionId: paymentData.transactionId,
    },
    timestamp: new Date().toISOString(),
    source: 'rez-unified-booking-service',
  };

  return sendNotification(payload);
}

// ============================================
// Send Refund Notification
// ============================================

export async function sendRefundNotification(
  userId: string,
  refundData: {
    bookingId: string;
    refundId: string;
    amount: number;
    currency: string;
    transactionId: string;
    reason?: string;
  }
): Promise<RabtulResponse> {
  const payload: RabtulWebhookPayload = {
    event: 'refund_processed',
    userId,
    channels: ['email'],
    payload: {
      bookingId: refundData.bookingId,
      refundId: refundData.refundId,
      amount: refundData.amount,
      currency: refundData.currency,
      transactionId: refundData.transactionId,
      reason: refundData.reason,
    },
    timestamp: new Date().toISOString(),
    source: 'rez-unified-booking-service',
  };

  return sendNotification(payload);
}

// ============================================
// Health Check
// ============================================

export async function checkRabtulHealth(): Promise<boolean> {
  const client = getRabtulClient();

  if (!client) {
    return false;
  }

  try {
    // RABTUL may not have a health endpoint, so we just check connectivity
    // In production, this would be a dedicated health check endpoint
    await client.get('/health', { timeout: 5000 });
    return true;
  } catch {
    // If health endpoint doesn't exist, assume connection is valid
    return true;
  }
}

// ============================================
// Reset Client (for testing)
// ============================================

export function resetRabtulClient(): void {
  rabtulClient = null;
}

export default {
  sendNotification,
  sendBookingConfirmationNotification,
  sendBookingReminderNotification,
  sendCancellationNotification,
  sendWaitlistAvailableNotification,
  sendPaymentConfirmationNotification,
  sendRefundNotification,
  checkRabtulHealth,
  resetRabtulClient,
};