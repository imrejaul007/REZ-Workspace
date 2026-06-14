import logger from './utils/logger';

/**
 * Order Events for Delivery Service
 * Listens to order events from the event bus
 */

import { EventEmitter } from 'events';
import { getOrderClient } from '../clients/orderClient';
import { getKDSClient } from '../clients/kdsClient';

// Configuration
const EVENT_BUS_ENABLED = process.env.EVENT_BUS_ENABLED !== 'false';

// Event types
export interface OrderCreatedEvent {
  orderId: string;
  merchantId: string;
  storeId: string;
  customerId: string;
  items: Array<{ productId: string; name: string; quantity: number }>;
  total: number;
  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: { lat: number; lng: number };
  };
  timestamp: string;
}

export interface OrderReadyEvent {
  orderId: string;
  merchantId: string;
  storeId: string;
  customerId: string;
  estimatedPrepTime?: number;
  timestamp: string;
}

export interface OrderStatusChangedEvent {
  orderId: string;
  merchantId: string;
  storeId: string;
  previousStatus: string;
  newStatus: string;
  timestamp: string;
}

// Event emitter for internal use
const orderEventEmitter = new EventEmitter();

/**
 * Handle order.created event
 */
async function handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
  console.log('[Delivery:OrderEvents] Processing order.created', {
    orderId: event.orderId,
    storeId: event.storeId,
  });

  try {
    // Get full order details
    const orderClient = getOrderClient();
    const order = await orderClient.getOrder(event.orderId);

    // Send to KDS for preparation
    if (order.items.length > 0) {
      const kdsClient = getKDSClient();
      await kdsClient.sendOrderToKDS({
        orderId: event.orderId,
        storeId: event.storeId,
        items: order.items.map((item) => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          notes: item.notes,
        })),
        priority: 'normal',
      });
    }

    orderEventEmitter.emit('order:created', event);
  } catch (error) {
    logger.error('[Delivery:OrderEvents] Error processing order.created', {
      orderId: event.orderId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Handle order.ready event
 */
async function handleOrderReady(event: OrderReadyEvent): Promise<void> {
  console.log('[Delivery:OrderEvents] Processing order.ready', {
    orderId: event.orderId,
    storeId: event.storeId,
  });

  try {
    // Find available driver and assign delivery
    // This would trigger the delivery assignment logic
    orderEventEmitter.emit('order:ready', event);
  } catch (error) {
    logger.error('[Delivery:OrderEvents] Error processing order.ready', {
      orderId: event.orderId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Handle order.status_changed event
 */
async function handleOrderStatusChanged(event: OrderStatusChangedEvent): Promise<void> {
  console.log('[Delivery:OrderEvents] Processing order.status_changed', {
    orderId: event.orderId,
    previousStatus: event.previousStatus,
    newStatus: event.newStatus,
  });

  try {
    // Handle specific status transitions
    if (event.newStatus === 'cancelled') {
      // Cancel delivery assignment
      orderEventEmitter.emit('order:cancelled', event);
    }

    orderEventEmitter.emit('order:status_changed', event);
  } catch (error) {
    logger.error('[Delivery:OrderEvents] Error processing order.status_changed', {
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
  { eventType: 'order.ready', handler: handleOrderReady as EventHandler },
  { eventType: 'order.status_changed', handler: handleOrderStatusChanged as EventHandler },
];

/**
 * Subscribe to an event type with a handler
 */
export function subscribe(eventType: string, handler: EventHandler): void {
  subscriptions.push({ eventType, handler });
  logger.info(`[Delivery:OrderEvents] Subscription registered for ${eventType}`);
}

/**
 * Get all subscriptions
 */
export function getSubscriptions(): Subscription[] {
  return [...subscriptions];
}

/**
 * Get the internal event emitter
 */
export function getOrderEventEmitter(): EventEmitter {
  return orderEventEmitter;
}

/**
 * Initialize event listeners (called from index.ts)
 */
export function initializeOrderEventListeners(): void {
  console.log('[Delivery:OrderEvents] Initializing order event listeners', {
    eventBusEnabled: EVENT_BUS_ENABLED,
    subscriptions: subscriptions.length,
  });

  if (!EVENT_BUS_ENABLED) {
    logger.info('[Delivery:OrderEvents] Event bus disabled, skipping listener setup');
  }
}

export default {
  subscribe,
  getSubscriptions,
  getOrderEventEmitter,
  initializeOrderEventListeners,
};
