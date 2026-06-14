/**
 * RABTUL SDK Integration for REZ Education Service
 *
 * This module provides integration with the RABTUL SDK for:
 * - SMS notifications for attendance alerts to parents
 * - WhatsApp notifications for fee reminders
 * - JWT validation via auth service
 * - Intent tracking for enrollments
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

export interface AttendanceAlertData {
  parentId: string;
  parentPhone: string;
  studentName: string;
  batchName: string;
  merchantName: string;
  date: string;
  status: 'absent' | 'late' | 'present';
  merchantId: string;
}

export interface FeeReminderData {
  parentId: string;
  parentPhone: string;
  parentName: string;
  studentName: string;
  batchName: string;
  merchantName: string;
  amountDue: number;
  dueDate: string;
  merchantId: string;
}

/**
 * Send SMS notification for attendance alert
 */
export async function sendAttendanceAlertSMS(
  data: AttendanceAlertData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    let statusMessage: string;
    switch (data.status) {
      case 'absent':
        statusMessage = `ABSENT today (${data.date})`;
        break;
      case 'late':
        statusMessage = `marked LATE on ${data.date}`;
        break;
      default:
        statusMessage = `marked PRESENT on ${data.date}`;
    }

    const message = `[${data.merchantName}] ${data.studentName} was ${statusMessage} ` +
      `in ${data.batchName}. Please contact us if you have any concerns.`;

    const result = await rezClient.notifications.send({
      user_id: data.parentId,
      channel: 'sms',
      title: `${data.studentName} Attendance Alert`,
      body: message,
      data: {
        studentName: data.studentName,
        batchName: data.batchName,
        date: data.date,
        status: data.status,
        type: 'attendance_alert',
      },
    });

    logger.info('Attendance alert SMS sent via RABTUL SDK', {
      studentName: data.studentName,
      merchantId: data.merchantId,
      status: data.status,
    });

    return { success: true, messageId: result.data as string };
  } catch (error) {
    logger.error('Failed to send attendance alert SMS', {
      error,
      studentName: data.studentName,
      merchantId: data.merchantId,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send WhatsApp notification for fee reminder
 */
export async function sendFeeReminderWhatsApp(
  data: FeeReminderData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const message = `📚 *Fee Payment Reminder*\n\n` +
      `Dear ${data.parentName},\n\n` +
      `This is a reminder for pending fee payment for ${data.studentName} ` +
      `(Batch: ${data.batchName}).\n\n` +
      `Amount Due: ₹${data.amountDue.toLocaleString('en-IN')}\n` +
      `Due Date: ${data.dueDate}\n\n` +
      `Please clear the payment at the earliest. ` +
      `Contact ${data.merchantName} for any queries.`;

    const result = await rezClient.notifications.send({
      user_id: data.parentId,
      channel: 'whatsapp',
      title: 'Fee Payment Reminder',
      body: message,
      data: {
        studentName: data.studentName,
        batchName: data.batchName,
        amountDue: data.amountDue,
        dueDate: data.dueDate,
        type: 'fee_reminder',
      },
    });

    logger.info('Fee reminder WhatsApp sent via RABTUL SDK', {
      studentName: data.studentName,
      merchantId: data.merchantId,
      amountDue: data.amountDue,
    });

    return { success: true, messageId: result.data as string };
  } catch (error) {
    logger.error('Failed to send fee reminder WhatsApp', {
      error,
      studentName: data.studentName,
      merchantId: data.merchantId,
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
  role?: 'user' | 'admin' | 'teacher' | 'staff' | 'service';
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

export interface EnrollmentEventData {
  customerId: string;
  merchantId: string;
  studentId: string;
  studentName: string;
  batchId: string;
  batchName: string;
  courseId: string;
  courseName: string;
  fees: number;
  currency: string;
  action: 'enrolled' | 'completed' | 'dropped' | 'upgraded';
  metadata?: Record<string, unknown>;
}

/**
 * Track enrollment events for intent analysis
 */
export async function trackEnrollmentEvent(
  data: EnrollmentEventData
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  try {
    const eventPayload = {
      user_id: data.customerId,
      event_type: 'education_enrollment',
      action: data.action,
      properties: {
        student_id: data.studentId,
        student_name: data.studentName,
        batch_id: data.batchId,
        batch_name: data.batchName,
        course_id: data.courseId,
        course_name: data.courseName,
        merchant_id: data.merchantId,
        fees: data.fees,
        currency: data.currency,
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
        studentId: data.studentId,
      });
      return { success: false, error: 'Intent service returned error' };
    }

    const responseData = await result.json();
    logger.info('Enrollment event tracked', {
      studentId: data.studentId,
      action: data.action,
      eventId: responseData.eventId,
    });

    return { success: true, eventId: responseData.eventId };
  } catch (error) {
    logger.error('Failed to track enrollment event', {
      error,
      studentId: data.studentId,
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
    sendAttendanceAlertSMS,
    sendFeeReminderWhatsApp,
    client: rezClient.notifications,
  },
  auth: {
    validateJWT,
  },
  intent: {
    trackEvent: trackEnrollmentEvent,
  },
  config: RABTUL_CONFIG,
  urls: SERVICE_URLS,
};

export default rabtul;