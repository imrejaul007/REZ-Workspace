/**
 * Inventory Event Emitter
 * Emits inventory.low events to the REZ Event Platform
 *
 * Usage:
 *   import { emitInventoryLow } from './events/inventory.events';
 *
 *   // In your inventory update logic:
 *   if (newStock <= threshold) {
 *     await emitInventoryLow({
 *       merchant_id: merchantId,
 *       store_id: storeId,
 *       item_id: productId,
 *       item_name: productName,
 *       current_stock: newStock,
 *       threshold: threshold,
 *       unit: 'units'
 *     });
 *   }
 */

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// Configuration
const EVENT_PLATFORM_URL = process.env.EVENT_PLATFORM_URL || 'http://localhost:4008';
const ENABLE_EVENT_EMISSION = process.env.ENABLE_EVENT_EMISSION === 'true';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

// Event payload interface
export interface InventoryLowEventData {
  merchant_id: string;
  store_id: string;
  item_id: string;
  item_name: string;
  current_stock: number;
  threshold: number;
  unit: string;
  supplier_id?: string;
}

// Full event structure
export interface InventoryEvent {
  event: 'inventory.low';
  version: 'v1';
  correlation_id: string;
  source: 'rez-merchant-service';
  timestamp: number;
  data: InventoryLowEventData;
}

/**
 * Emit an inventory.low event to the Event Platform
 */
export async function emitInventoryLow(data: InventoryLowEventData): Promise<InventoryEvent | null> {
  // Skip if emission is disabled
  if (!ENABLE_EVENT_EMISSION) {
    console.log('[InventoryEvents] Event emission disabled, skipping:', data.item_id);
    return null;
  }

  const event: InventoryEvent = {
    event: 'inventory.low',
    version: 'v1',
    correlation_id: uuidv4(),
    source: 'rez-merchant-service',
    timestamp: Date.now(),
    data
  };

  try {
    const response = await axios.post(`${EVENT_PLATFORM_URL}/events/inventory.low`, event, {
      headers: {
        'Content-Type': 'application/json',
        'x-internal-token': INTERNAL_SERVICE_TOKEN,
        'x-internal-service': 'rez-merchant-service'
      },
      timeout: 5000 // 5 second timeout
    });

    console.log(`[InventoryEvents] Event emitted successfully:`, {
      correlation_id: event.correlation_id,
      item_id: data.item_id,
      current_stock: data.current_stock,
      threshold: data.threshold
    });

    return event;
  } catch (error) {
    // Log but don't throw - event emission should not break existing flows
    console.error(`[InventoryEvents] Failed to emit event:`, {
      error: error.message,
      item_id: data.item_id
    });

    // Could emit to a local queue for retry here
    return null;
  }
}

/**
 * Check if stock level is low and emit event if needed
 */
export async function checkAndEmitInventoryLow(
  product: {
    _id: string;
    name: string;
    store: string;
    merchant: string;
    inventory: {
      stock: number;
      lowStockThreshold?: number;
      unlimited?: boolean;
    };
  },
  newStock: number
): Promise<InventoryEvent | null> {
  // Don't emit for unlimited stock products
  if (product.inventory?.unlimited) {
    return null;
  }

  const threshold = product.inventory?.lowStockThreshold ?? 5; // Default threshold

  // Emit if stock is at or below threshold
  if (newStock <= threshold) {
    return emitInventoryLow({
      merchant_id: product.merchant.toString(),
      store_id: product.store.toString(),
      item_id: product._id.toString(),
      item_name: product.name,
      current_stock: newStock,
      threshold: threshold,
      unit: 'units'
    });
  }

  return null;
}

/**
 * Create an inventory monitor that watches stock levels
 */
export function createInventoryMonitor() {
  return {
    /**
     * Monitor stock update and emit event if needed
     */
    async onStockUpdate(
      productId: string,
      productName: string,
      storeId: string,
      merchantId: string,
      oldStock: number,
      newStock: number,
      threshold: number = 5
    ): Promise<InventoryEvent | null> {
      // Only emit when crossing the threshold
      const crossedThreshold = oldStock > threshold && newStock <= threshold;
      const alreadyLow = oldStock <= threshold && newStock <= threshold;

      if (crossedThreshold) {
        // Stock just became low
        return emitInventoryLow({
          merchant_id: merchantId,
          store_id: storeId,
          item_id: productId,
          item_name: productName,
          current_stock: newStock,
          threshold: threshold,
          unit: 'units'
        });
      } else if (alreadyLow && newStock < oldStock) {
        // Stock dropped further while already low
        return emitInventoryLow({
          merchant_id: merchantId,
          store_id: storeId,
          item_id: productId,
          item_name: productName,
          current_stock: newStock,
          threshold: threshold,
          unit: 'units'
        });
      }

      return null;
    }
  };
}

// Export singleton instance
export const inventoryMonitor = createInventoryMonitor();
