/**
 * RABTUL SDK Integration for REZ Events Service
 *
 * This module provides integration with the RABTUL SDK for:
 * - WhatsApp notifications for RSVP confirmations
 * - Push notifications for guest reminders
 * - SMS for urgent event updates
 * - JWT validation via auth service
 * - Intent tracking for ticket sales
 *
 * SDK Documentation: /RABTUL-Technologies/REZ-connector-sdk/
 */

import { REZ } from '@rez/sdk';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from './utils/logger';

// RABTUL SDK Configuration
const RABTUL_CONFIG = {
  apiKey: process.env.RABTUL_SDK_API_KEY || 'dev-api-key',
  environment: (process.env.NODE_ENV as 'development' | 'production' | 'staging') || 'development',
  timeout: parseInt(process.env.RABTUL_SDK_TIMEOUT || '30000', 10),
  retries: parseInt(process.env.RABTUL_SDK_RETRIES || '3', 10),
};

// Service URLs
const SERVICE_URLS = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:4002',
  wallet: process.env.WALLET_SERVICE_URL || 'http://localhost:4003',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4004',
  intent: process.env.INTENT_SERVICE_URL || 'http://localhost:4006',
};

// Initialize RABTUL SDK Client
const rezClient = new REZ(RABTUL_CONFIG);

const JWT_SECRET = process.env.JWT_SECRET;

// ============================================
// Notification Connector
// ============================================

export interface RSVPConfirmationData {
  guestId: string;
  guestPhone: string;
  guestName: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  eventVenue?: string;
  status: 'confirmed' | 'declined' | 'tentative';
  merchantId: string;
}

export interface GuestReminderData {
  guestId: string;
  guestPhone: string;
  guestName: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  eventVenue?: string;
  hoursUntilEvent: number;
  merchantId: string;
}

export interface UrgentUpdateData {
  guestIds: string[];
  eventId: string;
  eventName: string;
  updateMessage: string;
  updateType: 'schedule_change' | 'venue_change' | 'cancellation' | 'weather' | 'general';
  merchantId: string;
}

/**
 * Send WhatsApp notification for RSVP confirmation
 */
export async function sendRSVPConfirmationWhatsApp(
  data: RSVPConfirmationData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    let statusEmoji: string;
    let statusText: string;

    switch (data.status) {
      case 'confirmed':
        statusEmoji = '✅';
        statusText = 'CONFIRMED';
        break;
      case 'declined':
        statusEmoji = '❌';
        statusText = 'DECLINED';
        break;
      case 'tentative':
        statusEmoji = '⏳';
        statusText = 'TENTATIVE';
        break;
      default:
        statusEmoji = '📋';
        statusText = data.status.toUpperCase();
    }

    const message = `${statusEmoji} *RSVP ${statusText}*\n\n` +
      `Dear ${data.guestName},\n\n` +
      `Your response for *${data.eventName}* has been received.\n\n` +
      `📅 Date: ${data.eventDate}\n` +
      `🕐 Time: ${data.eventTime}\n` +
      (data.eventVenue ? `📍 Venue: ${data.eventVenue}\n` : '') +
      `🎫 Booking ID: ${data.guestId}\n\n` +
      (data.status === 'confirmed' ? 'We look forward to seeing you there!' : 'We hope to see you at a future event.');

    const result = await rezClient.notifications.send({
      user_id: data.guestId,
      channel: 'whatsapp',
      title: `RSVP ${statusText} - ${data.eventName}`,
      body: message,
      data: {
        eventId: data.eventId,
        eventName: data.eventName,
        status: data.status,
        type: 'rsvp_confirmation',
      },
    });

    logger.info('RSVP confirmation WhatsApp sent via RABTUL SDK', {
      guestId: data.guestId,
      eventId: data.eventId,
      status: data.status,
    });

    return { success: true, messageId: result.data as string };
  } catch (error) {
    logger.error('Failed to send RSVP confirmation WhatsApp', {
      error,
      guestId: data.guestId,
      eventId: data.eventId,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send push notification for guest reminder
 */
export async function sendGuestReminderPush(
  data: GuestReminderData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    let reminderText: string;
    if (data.hoursUntilEvent <= 1) {
      reminderText = 'starting soon';
    } else if (data.hoursUntilEvent <= 4) {
      reminderText = `in ${data.hoursUntilEvent} hours`;
    } else if (data.hoursUntilEvent <= 24) {
      reminderText = 'tomorrow';
    } else {
      reminderText = `on ${data.eventDate}`;
    }

    const message = `Reminder: ${data.eventName} is ${reminderText}! ` +
      `${data.eventTime}${data.eventVenue ? ` at ${data.eventVenue}` : ''}. ` +
      'We look forward to seeing you!';

    const result = await rezClient.notifications.send({
      user_id: data.guestId,
      channel: 'push',
      title: `⏰ ${data.eventName} - ${data.hoursUntilEvent <= 24 ? 'Tomorrow' : 'Upcoming'}`,
      body: message,
      data: {
        eventId: data.eventId,
        eventName: data.eventName,
        eventDate: data.eventDate,
        eventTime: data.eventTime,
        eventVenue: data.eventVenue,
        type: 'event_reminder',
      },
    });

    logger.info('Guest reminder push notification sent via RABTUL SDK', {
      guestId: data.guestId,
      eventId: data.eventId,
      hoursUntilEvent: data.hoursUntilEvent,
    });

    return { success: true, messageId: result.data as string };
  } catch (error) {
    logger.error('Failed to send guest reminder push', {
      error,
      guestId: data.guestId,
      eventId: data.eventId,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send SMS for urgent event updates
 */
export async function sendUrgentUpdateSMS(
  data: UrgentUpdateData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    let alertType: string;
    switch (data.updateType) {
      case 'schedule_change':
        alertType = '⏰ SCHEDULE CHANGE';
        break;
      case 'venue_change':
        alertType = '📍 VENUE CHANGE';
        break;
      case 'cancellation':
        alertType = '⚠️ EVENT UPDATE';
        break;
      case 'weather':
        alertType = '🌤 WEATHER ALERT';
        break;
      default:
        alertType = '📢 EVENT UPDATE';
    }

    const message = `[REZ Events] ${alertType}\n` +
      `${data.eventName}\n\n` +
      data.updateMessage;

    const result = await rezClient.notifications.send({
      user_id: data.guestIds[0] || 'broadcast',
      channel: 'sms',
      title: `${alertType}: ${data.eventName}`,
      body: message,
      data: {
        eventId: data.eventId,
        eventName: data.eventName,
        updateType: data.updateType,
        type: 'urgent_update',
      },
    });

    logger.info('Urgent update SMS sent via RABTUL SDK', {
      eventId: data.eventId,
      guestCount: data.guestIds.length,
      updateType: data.updateType,
    });

    return { success: true, messageId: result.data as string };
  } catch (error) {
    logger.error('Failed to send urgent update SMS', {
      error,
      eventId: data.eventId,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// Auth Connector (JWT Validation)
// ============================================

export interface JWTPayload {
  sub: string;
  email?: string;
  phone?: string;
  role?: 'user' | 'admin' | 'coordinator' | 'staff' | 'service';
  merchantId?: string;
  iat?: number;
  exp?: number;
}

/**
 * Enhanced JWT validation using RABTUL Auth Service
 */
export async function validateJWT(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }

  // In development without JWT_SECRET, decode only
  if (!JWT_SECRET) {
    logger.warn('[Auth] JWT_SECRET not configured, using decode-only mode');
    try {
      const decoded = jwt.decode(token) as JWTPayload;
      if (decoded) {
        req.user = decoded;
        next();
        return;
      }
    } catch {
      // Fall through
    }
    res.status(401).json({ success: false, message: 'Invalid token' });
    return;
  }

  // Verify with JWT_SECRET
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      logger.error('[Auth] Token verification failed:', err.message);
      res.status(401).json({ success: false, message: 'Invalid or expired token' });
      return;
    }
    req.user = decoded as JWTPayload;
    next();
  });
}

// ============================================
// Intent Tracking
// ============================================

export interface TicketSaleEventData {
  customerId: string;
  merchantId: string;
  eventId: string;
  eventName: string;
  ticketId: string;
  ticketType: string;
  quantity: number;
  totalAmount: number;
  currency: string;
  guestName?: string;
  guestEmail?: string;
  action: 'purchased' | 'cancelled' | 'refunded';
  metadata?: Record<string, unknown>;
}

/**
 * Track ticket sale events for intent analysis
 */
export async function trackTicketSaleEvent(
  data: TicketSaleEventData
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  try {
    const eventPayload = {
      user_id: data.customerId,
      event_type: 'event_ticket_sale',
      action: data.action,
      properties: {
        event_id: data.eventId,
        event_name: data.eventName,
        ticket_id: data.ticketId,
        ticket_type: data.ticketType,
        quantity: data.quantity,
        total_amount: data.totalAmount,
        currency: data.currency,
        guest_name: data.guestName,
        guest_email: data.guestEmail,
        merchant_id: data.merchantId,
        ...data.metadata,
      },
      timestamp: new Date().toISOString(),
    };

    const result = await fetch(`${SERVICE_URLS.intent}/api/events/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RABTUL_SDK_API_KEY || 'dev-key'}`,
      },
      body: JSON.stringify(eventPayload),
    });

    if (!result.ok) {
      logger.warn('Intent tracking failed', {
        status: result.status,
        eventId: data.eventId,
      });
      return { success: false, error: 'Intent service returned error' };
    }

    const responseData = await result.json();
    logger.info('Ticket sale event tracked', {
      eventId: data.eventId,
      ticketId: data.ticketId,
      action: data.action,
      eventId_track: responseData.eventId,
    });

    return { success: true, eventId: responseData.eventId };
  } catch (error) {
    logger.error('Failed to track ticket sale event', {
      error,
      eventId: data.eventId,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// Service Export
// ============================================

export const rabtul = {
  notifications: {
    sendRSVPConfirmationWhatsApp,
    sendGuestReminderPush,
    sendUrgentUpdateSMS,
    client: rezClient.notifications,
  },
  auth: {
    validateJWT,
  },
  intent: {
    trackEvent: trackTicketSaleEvent,
  },
  config: RABTUL_CONFIG,
  urls: SERVICE_URLS,
};

export default rabtul;