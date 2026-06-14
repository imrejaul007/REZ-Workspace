/**
 * REZ Care Service - Event Emitter
 *
 * Emits events to REZ-care-service for support tracking.
 * Added to Payment Service for proactive issue detection.
 */

import axios from 'axios';
import { logger } from '../config/logger';

const REZ_CARE_URL = process.env.REZ_CARE_SERVICE_URL || 'http://localhost:4055';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'rez-internal-token';

export interface CareEvent {
  eventType: string;
  timestamp: Date;
  customerId?: string;
  customerPhone?: string;
  merchantId?: string;
  orderId?: string;
  transactionId?: string;
  platform?: 'hotel' | 'restaurant' | 'retail' | 'delivery' | 'ecommerce';
  category?: string;
  description?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, unknown>;
}

export async function emitCareEvent(event: CareEvent): Promise<boolean> {
  try {
    const response = await axios.post(`${REZ_CARE_URL}/api/events`, {
      eventType: event.eventType,
      data: {
        ...event,
        timestamp: event.timestamp || new Date()
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN
      },
      timeout: 5000
    });
    return response.data?.success === true;
  } catch (error) {
    logger.warn('[CareEvent] Failed to emit', { eventType: event.eventType, error: error.message });
    return false;
  }
}

export async function emitPaymentFailed(params: {
  customerId: string;
  customerPhone: string;
  merchantId?: string;
  orderId?: string;
  transactionId?: string;
  errorCode?: string;
  errorMessage?: string;
  amount?: number;
  platform?: string;
}) {
  return emitCareEvent({
    eventType: 'payment_failed',
    timestamp: new Date(),
    customerId: params.customerId,
    customerPhone: params.customerPhone,
    merchantId: params.merchantId,
    orderId: params.orderId,
    transactionId: params.transactionId,
    platform: params.platform as unknown,
    severity: params.amount && params.amount > 1000 ? 'high' : 'medium',
    description: params.errorMessage || `Payment failed: ${params.errorCode}`,
    metadata: {
      errorCode: params.errorCode,
      amount: params.amount
    }
  });
}

export async function emitRefundInitiated(params: {
  customerId: string;
  customerPhone: string;
  orderId?: string;
  transactionId: string;
  amount: number;
  reason: string;
  platform?: string;
}) {
  return emitCareEvent({
    eventType: 'refund_initiated',
    timestamp: new Date(),
    customerId: params.customerId,
    customerPhone: params.customerPhone,
    orderId: params.orderId,
    transactionId: params.transactionId,
    platform: params.platform as unknown,
    category: 'refund',
    severity: params.amount > 5000 ? 'high' : 'medium',
    description: `Refund initiated: ₹${params.amount} - ${params.reason}`,
    metadata: {
      amount: params.amount,
      reason: params.reason
    }
  });
}

export async function emitRefundCompleted(params: {
  customerId: string;
  customerPhone: string;
  orderId?: string;
  transactionId: string;
  amount: number;
  platform?: string;
}) {
  return emitCareEvent({
    eventType: 'refund_completed',
    timestamp: new Date(),
    customerId: params.customerId,
    customerPhone: params.customerPhone,
    orderId: params.orderId,
    transactionId: params.transactionId,
    platform: params.platform as unknown,
    category: 'refund',
    severity: 'low',
    description: `Refund completed: ₹${params.amount}`,
    metadata: { amount: params.amount }
  });
}
