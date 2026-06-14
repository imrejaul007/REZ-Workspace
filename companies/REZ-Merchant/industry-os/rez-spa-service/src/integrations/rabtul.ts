/**
 * RABTUL SDK Integration for REZ Spa Service
 *
 * This module provides integration with the RABTUL SDK for:
 * - WhatsApp notifications for booking confirmations
 * - SMS reminders
 * - JWT validation via auth service
 * - Intent tracking for spa bookings
 *
 * SDK Documentation: /RABTUL-Technologies/REZ-connector-sdk/
 */

import { REZ } from '@rez/sdk';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

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

// Logger setup
const createLogger = (serviceName: string) => {
  const { createLogger: winstonLogger, format, transports } = require('winston');
  return winstonLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: format.combine(format.timestamp(), format.json()),
    transports: [new transports.Console()],
    defaultMeta: { service: serviceName },
  });
};

const logger = createLogger('rez-spa-service-rabtul');

// ============================================
// Notification Connector
// ============================================

export interface BookingConfirmationData {
  customerId: string;
  customerName: string;
  customerPhone: string;
  bookingId: string;
  serviceName: string;
  date: string;
  time: string;
  therapistName?: string;
  price: number;
  currency: string;
}

export interface ReminderData {
  customerId: string;
  customerPhone: string;
  customerName: string;
  bookingId: string;
  serviceName: string;
  date: string;
  time: string;
}

/**
 * Send WhatsApp notification for booking confirmation
 */
export async function sendBookingConfirmationWhatsApp(
  data: BookingConfirmationData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const message = `Hi ${data.customerName}! Your spa appointment is confirmed.\n\n` +
      `Service: ${data.serviceName}\n` +
      `Date: ${data.date}\n` +
      `Time: ${data.time}\n` +
      `Booking ID: ${data.bookingId}\n` +
      (data.therapistName ? `Therapist: ${data.therapistName}\n` : '') +
      `Price: ${data.currency} ${data.price}\n\n` +
      `Thank you for choosing our spa!`;

    const result = await rezClient.notifications.send({
      user_id: data.customerId,
      channel: 'whatsapp',
      title: 'Spa Booking Confirmed',
      body: message,
      data: {
        bookingId: data.bookingId,
        serviceName: data.serviceName,
        date: data.date,
        time: data.time,
        type: 'booking_confirmation',
      },
    });

    logger.info('WhatsApp booking confirmation sent', {
      bookingId: data.bookingId,
      customerId: data.customerId,
      success: result.success,
    });

    return { success: true, messageId: result.data as string };
  } catch (error) {
    logger.error('Failed to send WhatsApp booking confirmation', {
      error,
      bookingId: data.bookingId,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send SMS reminder for upcoming booking
 */
export async function sendBookingReminderSMS(
  data: ReminderData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const message = `Reminder: Your spa appointment (${data.serviceName}) is scheduled for ` +
      `${data.date} at ${data.time}. Booking ID: ${data.bookingId}. Reply CANCEL to cancel.`;

    const result = await rezClient.notifications.send({
      user_id: data.customerId,
      channel: 'sms',
      title: 'Spa Appointment Reminder',
      body: message,
      data: {
        bookingId: data.bookingId,
        type: 'booking_reminder',
      },
    });

    logger.info('SMS booking reminder sent', {
      bookingId: data.bookingId,
      customerId: data.customerId,
    });

    return { success: true, messageId: result.data as string };
  } catch (error) {
    logger.error('Failed to send SMS booking reminder', {
      error,
      bookingId: data.bookingId,
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
  role?: string;
  merchantId?: string;
  permissions?: string[];
  iat?: number;
  exp?: number;
}

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret';

/**
 * Validate JWT token from Authorization header
 * Enhanced version using RABTUL Auth Service
 */
export async function validateJWT(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : authHeader;

  if (!token) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
    return;
  }

  try {
    // First try local validation with JWT_SECRET
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    (req as any).user = decoded;
    next();
  } catch (localError) {
    // If local validation fails, try RABTUL Auth Service
    try {
      const response = await fetch(`${SERVICE_URLS.auth}/api/auth/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || '',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        res.status(401).json({
          success: false,
          error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' },
        });
        return;
      }

      const authData = await response.json();
      (req as any).user = authData.user || authData;
      next();
    } catch (serviceError) {
      logger.error('Auth service validation failed', { error: serviceError });
      res.status(500).json({
        success: false,
        error: { code: 'AUTH_SERVICE_ERROR', message: 'Authentication service unavailable' },
      });
    }
  }
}

/**
 * Create enhanced authentication middleware using RABTUL
 */
export function createAuthMiddleware() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const internalToken = req.headers['x-internal-token'];

    // Allow internal service calls
    if (internalToken === process.env.INTERNAL_SERVICE_TOKEN) {
      (req as any).isInternal = true;
      next();
      return;
    }

    // Validate JWT
    await validateJWT(req, res, next);
  };
}

// ============================================
// Intent Tracking
// ============================================

export interface BookingEventData {
  customerId: string;
  merchantId: string;
  bookingId: string;
  serviceId: string;
  serviceName: string;
  therapistId?: string;
  therapistName?: string;
  date: string;
  time: string;
  price: number;
  currency: string;
  action: 'created' | 'confirmed' | 'completed' | 'cancelled';
  metadata?: Record<string, unknown>;
}

/**
 * Track spa booking events for intent analysis
 */
export async function trackBookingEvent(
  data: BookingEventData
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  try {
    const eventPayload = {
      user_id: data.customerId,
      event_type: 'spa_booking',
      action: data.action,
      properties: {
        booking_id: data.bookingId,
        service_id: data.serviceId,
        service_name: data.serviceName,
        merchant_id: data.merchantId,
        therapist_id: data.therapistId,
        therapist_name: data.therapistName,
        date: data.date,
        time: data.time,
        price: data.price,
        currency: data.currency,
        ...data.metadata,
      },
      timestamp: new Date().toISOString(),
    };

    // Track event via intent service
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
        bookingId: data.bookingId,
      });
      return { success: false, error: 'Intent service returned error' };
    }

    const responseData = await result.json();
    logger.info('Booking event tracked', {
      bookingId: data.bookingId,
      action: data.action,
      eventId: responseData.eventId,
    });

    return { success: true, eventId: responseData.eventId };
  } catch (error) {
    logger.error('Failed to track booking event', {
      error,
      bookingId: data.bookingId,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get customer intent/preferences from RABTUL Intent Graph
 */
export async function getCustomerIntent(
  customerId: string,
  context?: { merchantId?: string; category?: string }
): Promise<{
  success: boolean;
  intent?: {
    preferences: string[];
    interests: string[];
    budget: string;
    preferredTimes: string[];
  };
  error?: string;
}> {
  try {
    const result = await fetch(`${SERVICE_URLS.intent}/api/intent/${customerId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.RABTUL_SDK_API_KEY || 'dev-key'}`,
      },
      params: context,
    });

    if (!result.ok) {
      return { success: false, error: 'Intent service unavailable' };
    }

    const data = await result.json();
    return { success: true, intent: data };
  } catch (error) {
    logger.error('Failed to get customer intent', { error, customerId });
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
    sendWhatsApp: sendBookingConfirmationWhatsApp,
    sendSMS: sendBookingReminderSMS,
    client: rezClient.notifications,
  },
  auth: {
    validateJWT,
    createMiddleware: createAuthMiddleware,
  },
  intent: {
    trackEvent: trackBookingEvent,
    getIntent: getCustomerIntent,
  },
  config: RABTUL_CONFIG,
  urls: SERVICE_URLS,
};

export default rabtul;
