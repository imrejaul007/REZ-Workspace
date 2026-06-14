/**
 * Payment Events for Analytics V2
 * Listens to payment events from the event bus
 */

import { EventEmitter } from 'eventemitter3';

// Configuration
const EVENT_BUS_ENABLED = process.env.EVENT_BUS_ENABLED !== 'false';

// Event types
export interface PaymentCreatedEvent {
  paymentId: string;
  orderId: string;
  merchantId: string;
  storeId: string;
  customerId: string;
  amount: number;
  method: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  timestamp: string;
}

export interface PaymentCompletedEvent {
  paymentId: string;
  orderId: string;
  merchantId: string;
  storeId: string;
  customerId: string;
  amount: number;
  method: string;
  provider?: string;
  providerReference?: string;
  timestamp: string;
}

export interface PaymentFailedEvent {
  paymentId: string;
  orderId: string;
  merchantId: string;
  storeId: string;
  customerId: string;
  amount: number;
  method: string;
  error: string;
  timestamp: string;
}

export interface RefundInitiatedEvent {
  refundId: string;
  paymentId: string;
  orderId: string;
  merchantId: string;
  storeId: string;
  amount: number;
  reason?: string;
  timestamp: string;
}

export interface RefundCompletedEvent {
  refundId: string;
  paymentId: string;
  orderId: string;
  merchantId: string;
  storeId: string;
  amount: number;
  timestamp: string;
}

// Event emitter for internal use
const paymentEventEmitter = new EventEmitter();

/**
 * Handle payment.created event
 */
async function handlePaymentCreated(event: PaymentCreatedEvent): Promise<void> {
  console.log('[Analytics:PaymentEvents] Processing payment.created', {
    paymentId: event.paymentId,
    orderId: event.orderId,
  });

  try {
    paymentEventEmitter.emit('payment:created', event);
  } catch (error) {
    console.error('[Analytics:PaymentEvents] Error processing payment.created', {
      paymentId: event.paymentId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Handle payment.completed event
 */
async function handlePaymentCompleted(event: PaymentCompletedEvent): Promise<void> {
  console.log('[Analytics:PaymentEvents] Processing payment.completed', {
    paymentId: event.paymentId,
    orderId: event.orderId,
    amount: event.amount,
  });

  try {
    paymentEventEmitter.emit('payment:completed', event);
  } catch (error) {
    console.error('[Analytics:PaymentEvents] Error processing payment.completed', {
      paymentId: event.paymentId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Handle payment.failed event
 */
async function handlePaymentFailed(event: PaymentFailedEvent): Promise<void> {
  console.log('[Analytics:PaymentEvents] Processing payment.failed', {
    paymentId: event.paymentId,
    orderId: event.orderId,
    error: event.error,
  });

  try {
    paymentEventEmitter.emit('payment:failed', event);
  } catch (error) {
    console.error('[Analytics:PaymentEvents] Error processing payment.failed', {
      paymentId: event.paymentId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Handle refund.initiated event
 */
async function handleRefundInitiated(event: RefundInitiatedEvent): Promise<void> {
  console.log('[Analytics:PaymentEvents] Processing refund.initiated', {
    refundId: event.refundId,
    paymentId: event.paymentId,
  });

  try {
    paymentEventEmitter.emit('refund:initiated', event);
  } catch (error) {
    console.error('[Analytics:PaymentEvents] Error processing refund.initiated', {
      refundId: event.refundId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Handle refund.completed event
 */
async function handleRefundCompleted(event: RefundCompletedEvent): Promise<void> {
  console.log('[Analytics:PaymentEvents] Processing refund.completed', {
    refundId: event.refundId,
    paymentId: event.paymentId,
  });

  try {
    paymentEventEmitter.emit('refund:completed', event);
  } catch (error) {
    console.error('[Analytics:PaymentEvents] Error processing refund.completed', {
      refundId: event.refundId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Event subscription registry
type EventHandler = (event: unknown) => Promise<void>;

interface Subscription {
  eventType: string;
  handler: EventHandler;
}

const subscriptions: Subscription[] = [
  { eventType: 'payment.created', handler: handlePaymentCreated as EventHandler },
  { eventType: 'payment.completed', handler: handlePaymentCompleted as EventHandler },
  { eventType: 'payment.failed', handler: handlePaymentFailed as EventHandler },
  { eventType: 'refund.initiated', handler: handleRefundInitiated as EventHandler },
  { eventType: 'refund.completed', handler: handleRefundCompleted as EventHandler },
];

/**
 * Subscribe to an event type with a handler
 */
export function subscribe(eventType: string, handler: EventHandler): void {
  subscriptions.push({ eventType, handler });
  console.log(`[Analytics:PaymentEvents] Subscription registered for ${eventType}`);
}

/**
 * Get all subscriptions
 */
export function getSubscriptions(): Subscription[] {
  return [...subscriptions];
}

/**
 * Get the internal event emitter for internal event handling
 */
export function getPaymentEventEmitter(): EventEmitter {
  return paymentEventEmitter;
}

/**
 * Initialize event listeners (called from index.ts)
 */
export function initializePaymentEventListeners(): void {
  console.log('[Analytics:PaymentEvents] Initializing payment event listeners', {
    eventBusEnabled: EVENT_BUS_ENABLED,
    subscriptions: subscriptions.length,
  });

  if (!EVENT_BUS_ENABLED) {
    console.log('[Analytics:PaymentEvents] Event bus disabled, skipping listener setup');
  }
}

export default {
  subscribe,
  getSubscriptions,
  getPaymentEventEmitter,
  initializePaymentEventListeners,
};
