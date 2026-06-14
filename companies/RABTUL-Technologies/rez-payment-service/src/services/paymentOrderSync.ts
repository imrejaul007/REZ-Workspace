/**
 * Payment Order Synchronization Service
 *
 * This service handles the dual-state synchronization between:
 * - Payment.status (rez-payment-service)
 * - Order.payment.status (rez-order-service)
 *
 * It uses an event-driven approach to ensure consistency.
 */

import { emitCareEvent } from '../utils/careEventEmitter';
import { logger } from '../config/logger';

export enum PaymentOrderEventType {
  PAYMENT_COMPLETED = 'PAYMENT_COMPLETED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_REFUNDED = 'PAYMENT_REFUNDED',
  PAYMENT_PARTIALLY_REFUNDED = 'PAYMENT_PARTIALLY_REFUNDED',
  PAYMENT_CANCELLED = 'PAYMENT_CANCELLED',
}

export interface PaymentOrderEvent {
  eventType: PaymentOrderEventType;
  paymentId: string;
  orderId?: string;
  razorpayOrderId?: string;
  amount: number;
  userId: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface PaymentOrderMapping {
  paymentId: string;
  orderId: string;
  userId: string;
  razorpayOrderId?: string;
}

/**
 * Map Payment status to Order.payment.status
 */
const STATUS_MAPPING: Record<string, string> = {
  completed: 'paid',
  refund_initiated: 'refunded',
  refund_processing: 'refunded',
  refunded: 'refunded',
  partially_refunded: 'partially_refunded',
  failed: 'failed',
  cancelled: 'failed',
  pending: 'pending',
  processing: 'processing',
};

/**
 * Emit a payment status change event for order synchronization
 */
export async function emitPaymentOrderEvent(
  paymentId: string,
  paymentStatus: string,
  params: {
    orderId?: string;
    razorpayOrderId?: string;
    userId: string;
    amount: number;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  const eventType = getEventTypeForStatus(paymentStatus);

  if (!eventType) {
    logger.debug('[PaymentOrderSync] No event for status', { paymentStatus });
    return;
  }

  const event: PaymentOrderEvent = {
    eventType,
    paymentId,
    orderId: params.orderId,
    razorpayOrderId: params.razorpayOrderId,
    amount: params.amount,
    userId: params.userId,
    timestamp: new Date(),
    metadata: {
      ...params.metadata,
      originalPaymentStatus: paymentStatus,
      mappedOrderStatus: STATUS_MAPPING[paymentStatus] || paymentStatus,
    },
  };

  // Emit via care event system
  try {
    await emitCareEvent({
      eventType: `payment_order_sync:${eventType}`,
      entityType: 'payment',
      entityId: paymentId,
      userId: params.userId,
      timestamp: new Date(),
      payload: event,
      severity: 'info',
    });
    logger.info('[PaymentOrderSync] Emitted event', { eventType, paymentId });
  } catch (error) {
    logger.error('[PaymentOrderSync] Failed to emit event', { error: error instanceof Error ? error.message : String(error) });
    // Don't throw - event emission is non-critical
  }
}

/**
 * Get event type for payment status
 */
function getEventTypeForStatus(status: string): PaymentOrderEventType | null {
  switch (status) {
    case 'completed':
      return PaymentOrderEventType.PAYMENT_COMPLETED;
    case 'failed':
    case 'cancelled':
      return PaymentOrderEventType.PAYMENT_FAILED;
    case 'refunded':
      return PaymentOrderEventType.PAYMENT_REFUNDED;
    case 'partially_refunded':
      return PaymentOrderEventType.PAYMENT_PARTIALLY_REFUNDED;
    default:
      return null;
  }
}

/**
 * Get the mapped Order.payment.status for a Payment status
 */
export function getMappedOrderStatus(paymentStatus: string): string {
  return STATUS_MAPPING[paymentStatus] || paymentStatus;
}

/**
 * Verify payment and order statuses are consistent
 */
export async function verifyPaymentOrderConsistency(
  paymentStatus: string,
  orderPaymentStatus: string | undefined
): Promise<{ isConsistent: boolean; expectedOrderStatus: string }> {
  const expectedOrderStatus = getMappedOrderStatus(paymentStatus);

  // If order status is undefined, they're not linked yet
  if (!orderPaymentStatus) {
    return { isConsistent: true, expectedOrderStatus };
  }

  // Allow for pending/processing states where they're temporarily different
  const isConsistent =
    orderPaymentStatus === expectedOrderStatus ||
    (paymentStatus === 'pending' && orderPaymentStatus === 'pending') ||
    (paymentStatus === 'processing' && ['pending', 'processing', 'authorized'].includes(orderPaymentStatus));

  return { isConsistent, expectedOrderStatus };
}

/**
 * Reconciliation check - find payments and orders that are out of sync
 */
export async function findInconsistentPayments(
  PaymentModel,
  OrderModel,
  limit: number = 100
): Promise<Array<{
  paymentId: string;
  orderId?: string;
  paymentStatus: string;
  orderPaymentStatus?: string;
  discrepancy: string;
}>> {
  const inconsistencies: unknown[] = [];

  // Find completed payments without linked orders
  const orphanPayments = await PaymentModel.find({
    status: 'completed',
    orderId: { $exists: false },
  })
    .select('paymentId status orderId')
    .limit(limit)
    .lean();

  for (const payment of orphanPayments) {
    inconsistencies.push({
      paymentId: payment.paymentId,
      orderId: payment.orderId,
      paymentStatus: payment.status,
      orderPaymentStatus: undefined,
      discrepancy: 'Completed payment without order',
    });
  }

  // Find payments and check order status
  const completedPayments = await PaymentModel.find({
    status: 'completed',
    orderId: { $exists: true },
  })
    .select('paymentId status orderId')
    .limit(limit)
    .lean();

  for (const payment of completedPayments) {
    const order = await OrderModel.findById(payment.orderId)
      .select('payment.status')
      .lean();

    if (order && order.payment?.status !== 'paid') {
      const verification = await verifyPaymentOrderConsistency(payment.status, order.payment?.status);
      if (!verification.isConsistent) {
        inconsistencies.push({
          paymentId: payment.paymentId,
          orderId: payment.orderId,
          paymentStatus: payment.status,
          orderPaymentStatus: order.payment?.status,
          discrepancy: `Expected: ${verification.expectedOrderStatus}`,
        });
      }
    }
  }

  return inconsistencies;
}
