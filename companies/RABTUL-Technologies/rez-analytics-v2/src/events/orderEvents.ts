/**
 * Order Events for Analytics V2
 * Listens to order events from the event bus
 */

import { EventEmitter } from 'eventemitter3';
import { revenueService } from '../services/revenueService';
import { customerService } from '../services/customerService';

// Configuration
const EVENT_STREAM_NAME = process.env.EVENT_STREAM_NAME || 'rez:events';
const EVENT_BUS_ENABLED = process.env.EVENT_BUS_ENABLED !== 'false';

// Event types
export interface OrderCreatedEvent {
  orderId: string;
  merchantId: string;
  storeId: string;
  customerId: string;
  items: Array<{ category: string; price: number; cost?: number }>;
  total: number;
  paymentMethod: string;
  timestamp: string;
}

export interface OrderUpdatedEvent {
  orderId: string;
  merchantId: string;
  storeId: string;
  changes: Record<string, unknown>;
  timestamp: string;
}

export interface OrderCancelledEvent {
  orderId: string;
  customerId: string;
  merchantId: string;
  storeId: string;
  reason?: string;
  timestamp: string;
}

export interface OrderCompletedEvent {
  orderId: string;
  merchantId: string;
  storeId: string;
  total: number;
  timestamp: string;
}

// Event emitter for internal use
const orderEventEmitter = new EventEmitter();

/**
 * Handle order.created event
 */
async function handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
  console.log('[Analytics:OrderEvents] Processing order.created', {
    orderId: event.orderId,
    merchantId: event.merchantId,
  });

  try {
    // Update customer analytics
    await customerService.recordOrder(event.customerId, event.orderId, event.total);

    // Emit internal event
    orderEventEmitter.emit('order:created', event);
  } catch (error) {
    console.error('[Analytics:OrderEvents] Error processing order.created', {
      orderId: event.orderId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Handle order.updated event
 */
async function handleOrderUpdated(event: OrderUpdatedEvent): Promise<void> {
  console.log('[Analytics:OrderEvents] Processing order.updated', {
    orderId: event.orderId,
    merchantId: event.merchantId,
  });

  try {
    orderEventEmitter.emit('order:updated', event);
  } catch (error) {
    console.error('[Analytics:OrderEvents] Error processing order.updated', {
      orderId: event.orderId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Handle order.cancelled event
 */
async function handleOrderCancelled(event: OrderCancelledEvent): Promise<void> {
  console.log('[Analytics:OrderEvents] Processing order.cancelled', {
    orderId: event.orderId,
    merchantId: event.merchantId,
  });

  try {
    // Update customer analytics - cancelled orders
    await customerService.recordCancelledOrder(event.customerId, event.orderId);

    orderEventEmitter.emit('order:cancelled', event);
  } catch (error) {
    console.error('[Analytics:OrderEvents] Error processing order.cancelled', {
      orderId: event.orderId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Handle order.completed event
 */
async function handleOrderCompleted(event: OrderCompletedEvent): Promise<void> {
  console.log('[Analytics:OrderEvents] Processing order.completed', {
    orderId: event.orderId,
    merchantId: event.merchantId,
  });

  try {
    // Revenue is already recorded when order is created
    // This event can be used for additional analytics like delivery time
    orderEventEmitter.emit('order:completed', event);
  } catch (error) {
    console.error('[Analytics:OrderEvents] Error processing order.completed', {
      orderId: event.orderId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Handle order.status_changed event
 */
async function handleOrderStatusChanged(event: {
  orderId: string;
  merchantId: string;
  storeId: string;
  status: string;
  previousStatus?: string;
  timestamp: string;
}): Promise<void> {
  console.log('[Analytics:OrderEvents] Processing order.status_changed', {
    orderId: event.orderId,
    status: event.status,
  });

  try {
    orderEventEmitter.emit('order:status_changed', event);
  } catch (error) {
    console.error('[Analytics:OrderEvents] Error processing order.status_changed', {
      orderId: event.orderId,
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
  { eventType: 'order.created', handler: handleOrderCreated as EventHandler },
  { eventType: 'order.updated', handler: handleOrderUpdated as EventHandler },
  { eventType: 'order.cancelled', handler: handleOrderCancelled as EventHandler },
  { eventType: 'order.completed', handler: handleOrderCompleted as EventHandler },
  { eventType: 'order.status_changed', handler: handleOrderStatusChanged as EventHandler },
];

/**
 * Subscribe to an event type with a handler
 */
export function subscribe(eventType: string, handler: EventHandler): void {
  subscriptions.push({ eventType, handler });
  console.log(`[Analytics:OrderEvents] Subscription registered for ${eventType}`);
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
export function getOrderEventEmitter(): EventEmitter {
  return orderEventEmitter;
}

/**
 * Initialize event listeners (called from index.ts)
 */
export function initializeOrderEventListeners(): void {
  console.log('[Analytics:OrderEvents] Initializing order event listeners', {
    eventBusEnabled: EVENT_BUS_ENABLED,
    subscriptions: subscriptions.length,
  });

  // Note: In production, this would connect to the event bus (Redis Streams, Kafka, etc.)
  // For now, we export the handlers for external event bus integration

  if (!EVENT_BUS_ENABLED) {
    console.log('[Analytics:OrderEvents] Event bus disabled, skipping listener setup');
  }
}

export default {
  subscribe,
  getSubscriptions,
  getOrderEventEmitter,
  initializeOrderEventListeners,
};
