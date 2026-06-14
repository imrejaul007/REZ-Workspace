/**
 * Merchant Events for Staff Service
 * Listens to merchant events from the event bus
 */

import { EventEmitter } from 'events';
import { staffService } from '../services/staffService';
import { getMerchantClient } from '../clients/merchantClient';

// Configuration
const EVENT_BUS_ENABLED = process.env.EVENT_BUS_ENABLED !== 'false';

// Event types
export interface MerchantStaffAddedEvent {
  staffId: string;
  merchantId: string;
  storeId?: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  permissions?: string[];
  timestamp: string;
}

export interface MerchantStaffUpdatedEvent {
  staffId: string;
  merchantId: string;
  storeId?: string;
  userId: string;
  changes: Record<string, unknown>;
  timestamp: string;
}

export interface MerchantStaffRemovedEvent {
  staffId: string;
  merchantId: string;
  storeId?: string;
  userId: string;
  reason?: string;
  timestamp: string;
}

export interface MerchantStoreCreatedEvent {
  storeId: string;
  merchantId: string;
  name: string;
  address?: string;
  timestamp: string;
}

export interface MerchantStoreUpdatedEvent {
  storeId: string;
  merchantId: string;
  changes: Record<string, unknown>;
  timestamp: string;
}

// Event emitter for internal use
const merchantEventEmitter = new EventEmitter();

/**
 * Handle merchant.staff.added event
 */
async function handleStaffAdded(event: MerchantStaffAddedEvent): Promise<void> {
  console.log('[Staff:MerchantEvents] Processing merchant.staff.added', {
    staffId: event.staffId,
    merchantId: event.merchantId,
    userId: event.userId,
  });

  try {
    // Sync staff from merchant
    await staffService.syncFromMerchant({
      merchantId: event.merchantId,
      storeId: event.storeId,
      userId: event.userId,
      firstName: event.firstName,
      lastName: event.lastName,
      email: event.email,
      role: event.role,
      permissions: event.permissions,
    });

    merchantEventEmitter.emit('merchant:staff_added', event);
  } catch (error) {
    console.error('[Staff:MerchantEvents] Error processing merchant.staff.added', {
      staffId: event.staffId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Handle merchant.staff.updated event
 */
async function handleStaffUpdated(event: MerchantStaffUpdatedEvent): Promise<void> {
  console.log('[Staff:MerchantEvents] Processing merchant.staff.updated', {
    staffId: event.staffId,
    merchantId: event.merchantId,
  });

  try {
    // Sync staff updates
    await staffService.syncFromMerchant({
      merchantId: event.merchantId,
      storeId: event.storeId,
      userId: event.userId,
      ...event.changes,
    });

    merchantEventEmitter.emit('merchant:staff_updated', event);
  } catch (error) {
    console.error('[Staff:MerchantEvents] Error processing merchant.staff.updated', {
      staffId: event.staffId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Handle merchant.staff.removed event
 */
async function handleStaffRemoved(event: MerchantStaffRemovedEvent): Promise<void> {
  console.log('[Staff:MerchantEvents] Processing merchant.staff.removed', {
    staffId: event.staffId,
    merchantId: event.merchantId,
  });

  try {
    // Remove or deactivate staff
    await staffService.deactivateFromMerchant(event.userId, event.merchantId);

    merchantEventEmitter.emit('merchant:staff_removed', event);
  } catch (error) {
    console.error('[Staff:MerchantEvents] Error processing merchant.staff.removed', {
      staffId: event.staffId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Handle merchant.store.created event
 */
async function handleStoreCreated(event: MerchantStoreCreatedEvent): Promise<void> {
  console.log('[Staff:MerchantEvents] Processing merchant.store.created', {
    storeId: event.storeId,
    merchantId: event.merchantId,
  });

  try {
    merchantEventEmitter.emit('merchant:store_created', event);
  } catch (error) {
    console.error('[Staff:MerchantEvents] Error processing merchant.store.created', {
      storeId: event.storeId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Handle merchant.store.updated event
 */
async function handleStoreUpdated(event: MerchantStoreUpdatedEvent): Promise<void> {
  console.log('[Staff:MerchantEvents] Processing merchant.store.updated', {
    storeId: event.storeId,
    merchantId: event.merchantId,
  });

  try {
    merchantEventEmitter.emit('merchant:store_updated', event);
  } catch (error) {
    console.error('[Staff:MerchantEvents] Error processing merchant.store.updated', {
      storeId: event.storeId,
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
  { eventType: 'merchant.staff.added', handler: handleStaffAdded as EventHandler },
  { eventType: 'merchant.staff.updated', handler: handleStaffUpdated as EventHandler },
  { eventType: 'merchant.staff.removed', handler: handleStaffRemoved as EventHandler },
  { eventType: 'merchant.store.created', handler: handleStoreCreated as EventHandler },
  { eventType: 'merchant.store.updated', handler: handleStoreUpdated as EventHandler },
];

/**
 * Subscribe to an event type with a handler
 */
export function subscribe(eventType: string, handler: EventHandler): void {
  subscriptions.push({ eventType, handler });
  console.log(`[Staff:MerchantEvents] Subscription registered for ${eventType}`);
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
export function getMerchantEventEmitter(): EventEmitter {
  return merchantEventEmitter;
}

/**
 * Initialize event listeners (called from index.ts)
 */
export function initializeMerchantEventListeners(): void {
  console.log('[Staff:MerchantEvents] Initializing merchant event listeners', {
    eventBusEnabled: EVENT_BUS_ENABLED,
    subscriptions: subscriptions.length,
  });

  if (!EVENT_BUS_ENABLED) {
    console.log('[Staff:MerchantEvents] Event bus disabled, skipping listener setup');
  }
}

export default {
  subscribe,
  getSubscriptions,
  getMerchantEventEmitter,
  initializeMerchantEventListeners,
};
