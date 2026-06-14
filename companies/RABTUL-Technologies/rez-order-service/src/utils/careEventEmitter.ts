/**
 * REZ Care Service - Event Emitter for Order Service
 *
 * Emits events to REZ-care-service for support tracking.
 */

import axios from 'axios';

const REZ_CARE_URL = process.env.REZ_CARE_SERVICE_URL || 'http://localhost:4055';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'rez-internal-token';

export async function emitCareEvent(event: {
  eventType: string;
  timestamp: Date;
  customerId?: string;
  customerPhone?: string;
  merchantId?: string;
  orderId?: string;
  bookingId?: string;
  transactionId?: string;
  platform?: 'hotel' | 'restaurant' | 'retail' | 'delivery' | 'ecommerce';
  category?: string;
  description?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, unknown>;
}): Promise<boolean> {
  try {
    const response = await axios.post(`${REZ_CARE_URL}/api/events`, {
      eventType: event.eventType,
      data: event
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN
      },
      timeout: 5000
    });
    return response.data?.success === true;
  } catch (error) {
    console.warn('[CareEvent] Failed to emit:', event.eventType, error.message);
    return false;
  }
}

export async function emitOrderIssue(params: {
  customerId: string;
  customerPhone: string;
  orderId: string;
  merchantId: string;
  merchantName?: string;
  issueType: 'delivery_delay' | 'wrong_item' | 'missing_item' | 'quality_issue' | 'cancelled' | 'other';
  description: string;
  platform?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}) {
  return emitCareEvent({
    eventType: 'order_issue',
    timestamp: new Date(),
    customerId: params.customerId,
    customerPhone: params.customerPhone,
    merchantId: params.merchantId,
    orderId: params.orderId,
    platform: params.platform as unknown,
    category: params.issueType,
    severity: params.severity || 'medium',
    description: params.description,
    metadata: {
      merchantName: params.merchantName,
      issueType: params.issueType
    }
  });
}

export async function emitOrderDelivered(params: {
  customerId: string;
  customerPhone: string;
  orderId: string;
  merchantId: string;
  platform?: string;
  deliveryTime?: number;
}) {
  return emitCareEvent({
    eventType: 'order_delivered',
    timestamp: new Date(),
    customerId: params.customerId,
    customerPhone: params.customerPhone,
    merchantId: params.merchantId,
    orderId: params.orderId,
    platform: params.platform as unknown,
    severity: 'low',
    description: 'Order delivered successfully',
    metadata: {
      deliveryTime: params.deliveryTime
    }
  });
}

export async function emitOrderCancelled(params: {
  customerId: string;
  customerPhone: string;
  orderId: string;
  merchantId: string;
  reason: string;
  platform?: string;
  cancelledBy?: 'customer' | 'merchant' | 'system';
}) {
  return emitCareEvent({
    eventType: 'order_cancelled',
    timestamp: new Date(),
    customerId: params.customerId,
    customerPhone: params.customerPhone,
    merchantId: params.merchantId,
    orderId: params.orderId,
    platform: params.platform as unknown,
    category: 'cancellation',
    severity: 'medium',
    description: `Order cancelled: ${params.reason}`,
    metadata: {
      reason: params.reason,
      cancelledBy: params.cancelledBy || 'unknown'
    }
  });
}

export async function emitDeliveryDelay(params: {
  customerId: string;
  customerPhone: string;
  orderId: string;
  merchantId: string;
  expectedTime: number;
  actualTime: number;
  platform?: string;
}) {
  const delay = params.actualTime - params.expectedTime;

  return emitCareEvent({
    eventType: 'delivery_delay',
    timestamp: new Date(),
    customerId: params.customerId,
    customerPhone: params.customerPhone,
    merchantId: params.merchantId,
    orderId: params.orderId,
    platform: params.platform as unknown,
    category: 'delivery',
    severity: delay > 30 ? 'high' : 'medium',
    description: `Delivery delayed by ${delay} minutes`,
    metadata: {
      expectedTime: params.expectedTime,
      actualTime: params.actualTime,
      delayMinutes: delay
    }
  });
}
