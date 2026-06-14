/**
 * REZ Booking Services - Webhook Handlers
 *
 * Central webhook handler for all booking events.
 * Handles events from REZ-schedule-service and dispatches to relevant services.
 */

import crypto from 'crypto';

// Webhook event types
export type BookingEventType =
  | 'booking.created'
  | 'booking.confirmed'
  | 'booking.cancelled'
  | 'booking.rescheduled'
  | 'booking.completed'
  | 'booking.no_show';

// Webhook payload
export interface WebhookPayload {
  event: BookingEventType;
  timestamp: string;
  data: {
    uid: string;
    status: string;
    startTime: string;
    endTime: string;
    attendee?: {
      name: string;
      email: string;
      phone?: string;
    };
    eventType?: {
      title: string;
      duration: number;
    };
    user?: {
      name: string;
      email: string;
    };
    responses?: Record<string, unknown>;
  };
}

// Handler functions
type WebhookHandler = (payload: WebhookPayload) => Promise<void>;

// Registry of handlers
const handlers: Map<BookingEventType, WebhookHandler[]> = new Map();

// Register a handler for a specific event
export function on(event: BookingEventType, handler: WebhookHandler): void {
  const existing = handlers.get(event) || [];
  handlers.set(event, [...existing, handler]);
}

// Unregister a handler
export function off(event: BookingEventType, handler: WebhookHandler): void {
  const existing = handlers.get(event) || [];
  handlers.set(event, existing.filter(h => h !== handler));
}

// Process incoming webhook
export async function processWebhook(
  payload: WebhookPayload,
  signature: string,
  secret: string
): Promise<{ success: boolean; processed: number; errors: string[] }> {
  // Verify signature
  if (!verifySignature(JSON.stringify(payload), signature, secret)) {
    throw new Error('Invalid webhook signature');
  }

  const eventHandlers = handlers.get(payload.event) || [];
  const errors: string[] = [];
  let processed = 0;

  for (const handler of eventHandlers) {
    try {
      await handler(payload);
      processed++;
    } catch (error) {
      errors.push(`${payload.event}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return { success: errors.length === 0, processed, errors };
}

// Verify webhook signature
export function verifySignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  if (signature.length !== expectedSignature.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < signature.length; i++) {
    result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }

  return result === 0;
}

// ─── Built-in Handlers ────────────────────────────────────────────────────────────

// RABTUL Notifications handler
export function createNotificationsHandler() {
  return async (payload: WebhookPayload) => {
    const { event, data } = payload;

    // Map event to notification type
    const notificationMap: Record<BookingEventType, string> = {
      'booking.created': 'BOOKING_CONFIRMED',
      'booking.confirmed': 'BOOKING_CONFIRMED',
      'booking.cancelled': 'BOOKING_CANCELLED',
      'booking.rescheduled': 'BOOKING_RESCHEDULED',
      'booking.completed': 'BOOKING_COMPLETED',
      'booking.no_show': 'NO_SHOW',
    };

    // In real implementation, call RABTUL Notifications service
    console.log(`[Notifications] Sending ${notificationMap[event]} for booking ${data.uid}`);

    // Example: Call notifications service
    // await fetch(`${NOTIFICATIONS_URL}/api/notify`, {
    //   method: 'POST',
    //   body: JSON.stringify({
    //     type: notificationMap[event],
    //     recipient: data.attendee?.email,
    //     template: `booking_${event.replace('.', '_')}`,
    //     data,
    //   }),
    // });
  };
}

// RABTUL Wallet handler (for loyalty points)
export function createWalletHandler() {
  return async (payload: WebhookPayload) => {
    const { event, data } = payload;

    // Award points for completed bookings
    if (event === 'booking.completed') {
      console.log(`[Wallet] Awarding loyalty points for booking ${data.uid}`);

      // Example: Call wallet service
      // await fetch(`${WALLET_URL}/api/points/award`, {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     userId: data.attendee?.email,
      //     points: 10,
      //     reason: 'booking_completed',
      //     reference: data.uid,
      //   }),
      // });
    }

    // Deduct points for cancellations (if policy requires)
    if (event === 'booking.cancelled') {
      console.log(`[Wallet] Handling cancellation for booking ${data.uid}`);
    }
  };
}

// REZ Intelligence handler
export function createIntelligenceHandler() {
  return async (payload: WebhookPayload) => {
    const { event, data } = payload;

    // Send booking data to ML pipeline
    console.log(`[Intelligence] Processing booking event ${event} for ${data.uid}`);

    // Example: Update ML models
    // await fetch(`${INTELLIGENCE_URL}/api/signals/booking`, {
    //   method: 'POST',
    //   body: JSON.stringify({
    //     event,
    //     bookingUid: data.uid,
    //     timestamp: payload.timestamp,
    //     attendeeEmail: data.attendee?.email,
    //     eventType: data.eventType?.title,
    //     duration: data.eventType?.duration,
    //     responses: data.responses,
    //   }),
    // });
  };
}

// Analytics handler
export function createAnalyticsHandler() {
  return async (payload: WebhookPayload) => {
    const { event, data } = payload;

    // Track booking metrics
    console.log(`[Analytics] Tracking ${event} for ${data.uid}`);

    // Example: Update analytics
    // await fetch(`${ANALYTICS_URL}/api/events/track`, {
    //   method: 'POST',
    //   body: JSON.stringify({
    //     event: `booking_${event.replace('.', '_')}`,
    //     properties: {
    //       bookingUid: data.uid,
    //       eventType: data.eventType?.title,
    //       timestamp: payload.timestamp,
    //     },
    //   }),
    // });
  };
}

// Email handler
export function createEmailHandler() {
  return async (payload: WebhookPayload) => {
    const { event, data } = payload;

    // Send transactional emails
    const emailMap: Record<BookingEventType, string> = {
      'booking.created': 'booking_confirmation',
      'booking.confirmed': 'booking_confirmed',
      'booking.cancelled': 'booking_cancelled',
      'booking.rescheduled': 'booking_rescheduled',
      'booking.completed': 'booking_completed',
      'booking.no_show': 'no_show_notification',
    };

    console.log(`[Email] Sending ${emailMap[event]} to ${data.attendee?.email}`);
  };
}

// SMS handler
export function createSMSHandler() {
  return async (payload: WebhookPayload) => {
    const { event, data } = payload;

    if (data.attendee?.phone) {
      const messageMap: Record<BookingEventType, string> = {
        'booking.created': `Your booking is confirmed! ID: ${data.uid}`,
        'booking.confirmed': `Your booking ${data.uid} is confirmed.`,
        'booking.cancelled': `Your booking ${data.uid} has been cancelled.`,
        'booking.rescheduled': `Your booking has been rescheduled to ${data.startTime}`,
        'booking.completed': `Thank you for your booking ${data.uid}!`,
        'booking.no_show': `You missed your booking ${data.uid}`,
      };

      console.log(`[SMS] Sending to ${data.attendee.phone}: ${messageMap[event]}`);
    }
  };
}

// ─── Express Route Handler ──────────────────────────────────────────────────────

export function createWebhookRouteHandler(secret: string) {
  return async (req: express.Request, res: express.Response) => {
    try {
      const signature = req.headers['x-rez-signature'] as string;
      const payload = req.body as WebhookPayload;

      const result = await processWebhook(payload, signature, secret);

      res.json({
        received: true,
        processed: result.processed,
        errors: result.errors,
      });
    } catch (error) {
      console.error('[Webhook] Error processing webhook:', error);
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Invalid webhook',
      });
    }
  };
}

// ─── Setup all handlers ──────────────────────────────────────────────────────────

export function setupWebhookHandlers(): void {
  // Notifications
  on('booking.created', createNotificationsHandler());
  on('booking.confirmed', createNotificationsHandler());
  on('booking.cancelled', createNotificationsHandler());
  on('booking.rescheduled', createNotificationsHandler());

  // Wallet/Loyalty
  on('booking.completed', createWalletHandler());
  on('booking.cancelled', createWalletHandler());

  // REZ Intelligence
  on('booking.created', createIntelligenceHandler());
  on('booking.completed', createIntelligenceHandler());
  on('booking.no_show', createIntelligenceHandler());

  // Analytics
  on('booking.created', createAnalyticsHandler());
  on('booking.cancelled', createAnalyticsHandler());

  // Email
  on('booking.created', createEmailHandler());
  on('booking.cancelled', createEmailHandler());

  // SMS
  on('booking.created', createSMSHandler());
  on('booking.cancelled', createSMSHandler());

  console.log('[Webhook] All handlers registered');
}

import express from 'express';
