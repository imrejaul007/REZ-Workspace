/**
 * KDS Socket.IO Events
 *
 * Real-time events for Kitchen Display System
 * Used by both the KDS component and the merchant dashboard
 */

import { KDSOrder, KDSOrderUpdate, KDSItemUpdate, KDSOrderStatus, KDSEvent } from '@/lib/types';

// Event types
export const KDSEventType = {
  ORDER_CREATED: 'order.created',
  ORDER_UPDATED: 'order.updated',
  ITEM_UPDATED: 'item.updated',
  ORDER_READY: 'order.ready',
  ORDER_CANCELLED: 'order.cancelled',
} as const;

export type KDSEventType = typeof KDSEventType[keyof typeof KDSEventType];

// Client-to-Server Events
export interface KDSClientToServerEvents {
  /** Join a store's KDS room */
  'kds:join': (data: { storeId: string; storeSlug: string }) => void;
  /** Leave a store's KDS room */
  'kds:leave': (data: { storeId: string }) => void;
  /** Request current orders */
  'kds:get-orders': (data: { storeId: string }) => void;
  /** Update order status (from kitchen staff) */
  'kds:update-order': (data: {
    orderId: string;
    status: KDSOrderStatus;
    updatedBy?: string;
  }) => void;
  /** Update item status (from kitchen staff) */
  'kds:update-item': (data: {
    orderId: string;
    itemId: string;
    status: 'received' | 'preparing' | 'ready' | 'served';
    preparedBy?: string;
    notes?: string;
  }) => void;
}

// Server-to-Client Events
export interface KDSServerToClientEvents {
  /** New order created */
  'order.created': (event: KDSEvent) => void;
  /** Order status changed */
  'order.updated': (event: KDSEvent) => void;
  /** Individual item status changed */
  'item.updated': (event: KDSEvent) => void;
  /** All items in order are ready */
  'order.ready': (event: KDSEvent) => void;
  /** Order was cancelled */
  'order.cancelled': (event: KDSEvent) => void;
  /** Orders snapshot (for initial load) */
  'kds:orders': (data: { orders: KDSOrder[] }) => void;
  /** Error occurred */
  'kds:error': (data: { message: string }) => void;
}

// Socket.IO room naming
export const KDSRoom = {
  getStoreRoom: (storeId: string) => `kds:${storeId}`,
  getOrderRoom: (orderId: string) => `order:${orderId}`,
} as const;

// Helper functions
export function createKDSOrderCreatedEvent(order: KDSOrder): KDSEvent {
  return {
    type: KDSEventType.ORDER_CREATED,
    payload: order,
    timestamp: new Date().toISOString(),
  };
}

export function createKDSOrderUpdatedEvent(update: KDSOrderUpdate): KDSEvent {
  return {
    type: KDSEventType.ORDER_UPDATED,
    payload: update,
    timestamp: new Date().toISOString(),
  };
}

export function createKDSItemUpdatedEvent(update: KDSItemUpdate): KDSEvent {
  return {
    type: KDSEventType.ITEM_UPDATED,
    payload: update,
    timestamp: new Date().toISOString(),
  };
}

export function createKDSOrderReadyEvent(order: KDSOrder): KDSEvent {
  return {
    type: KDSEventType.ORDER_READY,
    payload: order,
    timestamp: new Date().toISOString(),
  };
}

export function createKDSOrderCancelledEvent(orderId: string): KDSEvent {
  return {
    type: KDSEventType.ORDER_CANCELLED,
    payload: { orderId } as unknown as KDSOrder,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Type guard to check if event payload is KDSOrder
 */
export function isKDSOrder(payload: unknown): payload is KDSOrder {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'orderNumber' in payload &&
    'items' in payload &&
    'status' in payload
  );
}

/**
 * Type guard to check if event payload is KDSOrderUpdate
 */
export function isKDSOrderUpdate(payload: unknown): payload is KDSOrderUpdate {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'orderId' in payload &&
    'status' in payload
  );
}

/**
 * Type guard to check if event payload is KDSItemUpdate
 */
export function isKDSItemUpdate(payload: unknown): payload is KDSItemUpdate {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'orderId' in payload &&
    'itemId' in payload &&
    'status' in payload
  );
}
