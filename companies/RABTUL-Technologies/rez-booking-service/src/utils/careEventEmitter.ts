/**
 * REZ Care Universal Event Emitter
 *
 * Can be added to ANY service to emit events to REZ-care-service.
 * Works for: Hotels, Restaurants, Retail, Delivery, E-commerce, etc.
 */

import axios from 'axios';

const REZ_CARE_URL = process.env.REZ_CARE_SERVICE_URL || process.env.REZ_CARE_URL || 'http://localhost:4055';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'rez-internal-token';

export type EventType =
  | 'payment_failed'
  | 'payment_success'
  | 'qr_scan_failed'
  | 'qr_scan_success'
  | 'app_error'
  | 'app_crash'
  | 'order_placed'
  | 'order_delivered'
  | 'order_cancelled'
  | 'order_issue'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'booking_issue'
  | 'refund_initiated'
  | 'refund_completed'
  | 'complaint_received'
  | 'ticket_resolved'
  | 'ticket_created'
  | 'merchant_issue'
  | 'delivery_delay'
  | 'wallet_sync_error'
  | 'support_request';

export type Platform = 'hotel' | 'restaurant' | 'retail' | 'delivery' | 'ecommerce' | 'cafeteria' | 'qsr' | 'fnb' | 'other';

export interface CareEvent {
  eventType: EventType;
  timestamp: Date;
  customerId?: string;
  customerPhone?: string;
  merchantId?: string;
  orderId?: string;
  bookingId?: string;
  transactionId?: string;
  platform: Platform;
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
    console.warn('[CareEvent] Failed to emit:', event.eventType, error.message);
    return false;
  }
}

// ============================================
// CONVENIENCE FUNCTIONS (All Industries)
// ============================================

/**
 * Emit payment failed - Hotels, Restaurants, Retail, etc.
 */
export async function emitPaymentFailed(params: {
  customerId: string;
  customerPhone: string;
  merchantId?: string;
  orderId?: string;
  transactionId?: string;
  errorCode?: string;
  errorMessage?: string;
  amount?: number;
  platform: Platform;
}) {
  return emitCareEvent({
    eventType: 'payment_failed',
    timestamp: new Date(),
    customerId: params.customerId,
    customerPhone: params.customerPhone,
    merchantId: params.merchantId,
    orderId: params.orderId,
    transactionId: params.transactionId,
    platform: params.platform,
    severity: params.amount && params.amount > 1000 ? 'high' : 'medium',
    description: params.errorMessage || `Payment failed: ${params.errorCode}`,
    metadata: { errorCode: params.errorCode, amount: params.amount }
  });
}

/**
 * Emit order issue - Restaurants, Delivery, Retail, etc.
 */
export async function emitOrderIssue(params: {
  customerId: string;
  customerPhone: string;
  orderId: string;
  merchantId: string;
  issueType: 'delivery_delay' | 'wrong_item' | 'missing_item' | 'quality_issue' | 'cancelled' | 'other';
  description: string;
  platform: Platform;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}) {
  return emitCareEvent({
    eventType: 'order_issue',
    timestamp: new Date(),
    customerId: params.customerId,
    customerPhone: params.customerPhone,
    merchantId: params.merchantId,
    orderId: params.orderId,
    platform: params.platform,
    category: params.issueType,
    severity: params.severity || 'medium',
    description: params.description,
    metadata: { issueType: params.issueType }
  });
}

/**
 * Emit booking issue - Hotels, Resorts, Cafes, etc.
 */
export async function emitBookingIssue(params: {
  customerId: string;
  customerPhone: string;
  bookingId: string;
  merchantId: string;
  issueType: 'room_issue' | 'service_issue' | 'billing' | 'cancellation' | 'checkin_issue' | 'checkout_issue' | 'other';
  description: string;
  platform?: Platform;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}) {
  return emitCareEvent({
    eventType: 'booking_issue',
    timestamp: new Date(),
    customerId: params.customerId,
    customerPhone: params.customerPhone,
    merchantId: params.merchantId,
    bookingId: params.bookingId,
    platform: params.platform || 'hotel',
    category: params.issueType,
    severity: params.severity || 'high',
    description: params.description,
    metadata: { issueType: params.issueType }
  });
}

/**
 * Emit delivery delay - Restaurants, QSR, Delivery, etc.
 */
export async function emitDeliveryDelay(params: {
  customerId: string;
  customerPhone: string;
  orderId: string;
  merchantId: string;
  expectedTime: number;
  actualTime: number;
  platform: Platform;
}) {
  const delay = params.actualTime - params.expectedTime;
  return emitCareEvent({
    eventType: 'delivery_delay',
    timestamp: new Date(),
    customerId: params.customerId,
    customerPhone: params.customerPhone,
    merchantId: params.merchantId,
    orderId: params.orderId,
    platform: params.platform,
    category: 'delivery',
    severity: delay > 30 ? 'high' : 'medium',
    description: `Delivery delayed by ${delay} minutes`,
    metadata: { expectedTime: params.expectedTime, actualTime: params.actualTime, delayMinutes: delay }
  });
}

/**
 * Emit QR scan failed - All merchants with QR payments
 */
export async function emitQRScanFailed(params: {
  customerId: string;
  customerPhone: string;
  merchantId: string;
  reason?: string;
  orderId?: string;
  platform: Platform;
}) {
  return emitCareEvent({
    eventType: 'qr_scan_failed',
    timestamp: new Date(),
    customerId: params.customerId,
    customerPhone: params.customerPhone,
    merchantId: params.merchantId,
    orderId: params.orderId,
    platform: params.platform,
    severity: 'medium',
    description: `QR scan failed: ${params.reason || 'Unknown reason'}`,
    metadata: { reason: params.reason }
  });
}

/**
 * Emit complaint - Any industry
 */
export async function emitComplaint(params: {
  customerId: string;
  customerPhone: string;
  description: string;
  platform: Platform;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}) {
  return emitCareEvent({
    eventType: 'complaint_received',
    timestamp: new Date(),
    customerId: params.customerId,
    customerPhone: params.customerPhone,
    platform: params.platform,
    category: 'complaint',
    severity: params.severity || 'high',
    description: params.description
  });
}

/**
 * Emit refund - Any industry
 */
export async function emitRefund(params: {
  customerId: string;
  customerPhone: string;
  orderId?: string;
  transactionId: string;
  amount: number;
  reason: string;
  platform: Platform;
  status: 'initiated' | 'completed';
}) {
  return emitCareEvent({
    eventType: params.status === 'completed' ? 'refund_completed' : 'refund_initiated',
    timestamp: new Date(),
    customerId: params.customerId,
    customerPhone: params.customerPhone,
    orderId: params.orderId,
    transactionId: params.transactionId,
    platform: params.platform,
    category: 'refund',
    severity: params.amount > 5000 ? 'high' : 'medium',
    description: `Refund ${params.status}: ₹${params.amount} - ${params.reason}`,
    metadata: { amount: params.amount, reason: params.reason }
  });
}

/**
 * Emit app error - Any industry with mobile/web app
 */
export async function emitAppError(params: {
  customerId?: string;
  customerPhone?: string;
  errorType: string;
  errorMessage: string;
  platform: Platform;
  appVersion?: string;
  orderId?: string;
}) {
  return emitCareEvent({
    eventType: 'app_error',
    timestamp: new Date(),
    customerId: params.customerId,
    customerPhone: params.customerPhone,
    orderId: params.orderId,
    platform: params.platform,
    category: 'technical',
    severity: 'medium',
    description: `${params.errorType}: ${params.errorMessage}`,
    metadata: { appVersion: params.appVersion, errorType: params.errorType }
  });
}

/**
 * Emit merchant issue - When merchant has a problem (system down, out of stock, etc.)
 */
export async function emitMerchantIssue(params: {
  merchantId: string;
  issueType: 'system_down' | 'out_of_stock' | 'staff_shortage' | 'quality_alert' | 'other';
  description: string;
  platform: Platform;
  affectedOrders?: number;
}) {
  return emitCareEvent({
    eventType: 'merchant_issue',
    timestamp: new Date(),
    merchantId: params.merchantId,
    platform: params.platform,
    category: params.issueType,
    severity: params.affectedOrders && params.affectedOrders > 10 ? 'high' : 'medium',
    description: params.description,
    metadata: { issueType: params.issueType, affectedOrders: params.affectedOrders }
  });
}

/**
 * Emit generic support request
 */
export async function emitSupportRequest(params: {
  customerId: string;
  customerPhone: string;
  description: string;
  platform: Platform;
  source: 'chat' | 'call' | 'email' | 'inapp' | 'social';
  severity?: 'low' | 'medium' | 'high' | 'critical';
}) {
  return emitCareEvent({
    eventType: 'support_request',
    timestamp: new Date(),
    customerId: params.customerId,
    customerPhone: params.customerPhone,
    platform: params.platform,
    severity: params.severity || 'medium',
    description: params.description,
    metadata: { source: params.source }
  });
}

// ============================================
// EXPRESS MIDDLEWARE
// ============================================

/**
 * Auto-emit events on certain HTTP responses
 */
export function careEventMiddleware(platform: Platform) {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function(body) {
      // Payment failed (4xx/5xx on payment routes)
      if (req.path.includes('/pay') && res.statusCode >= 400) {
        emitPaymentFailed({
          customerId: req.userId || 'unknown',
          customerPhone: req.body?.phone || '',
          orderId: req.body?.orderId,
          errorCode: body?.code || 'UNKNOWN',
          errorMessage: body?.error || 'Payment failed',
          amount: req.body?.amount,
          platform
        }).catch(() => {});
      }

      // Order issue (4xx/5xx on order routes)
      if (req.path.includes('/order') && res.statusCode >= 400) {
        emitOrderIssue({
          customerId: req.userId || 'unknown',
          customerPhone: req.body?.phone || '',
          orderId: req.params?.orderId || req.body?.orderId,
          merchantId: req.body?.merchantId || '',
          issueType: 'other',
          description: body?.error || 'Order operation failed',
          platform
        }).catch(() => {});
      }

      return originalJson(body);
    };

    next();
  };
}
