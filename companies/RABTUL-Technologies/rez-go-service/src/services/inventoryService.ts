/**
 * REZ Go Inventory Service
 *
 * Validates product availability before checkout:
 * - Stock check
 * - Price validation
 * - Real-time inventory updates
 */

import { GoProduct } from '../models/GoProduct.js';
import { GoStore } from '../models/GoStore.js';

export interface InventoryItem {
  productId: string;
  barcode: string;
  name: string;
  requestedQty: number;
  availableQty: number;
  price: number;
  inStock: boolean;
}

export interface InventoryValidationResult {
  valid: boolean;
  items: InventoryItem[];
  outOfStock: string[];
  priceChanged: Array<{ productId: string; oldPrice: number; newPrice: number }>;
  totalValue: number;
  errors: string[];
}

/**
 * Validate inventory for checkout
 */
export async function validateInventory(
  storeId: string,
  items: Array<{ productId: string; quantity: number; price?: number }>
): Promise<InventoryValidationResult> {
  const result: InventoryValidationResult = {
    valid: true,
    items: [],
    outOfStock: [],
    priceChanged: [],
    totalValue: 0,
    errors: [],
  };

  for (const item of items) {
    const product = await GoProduct.findOne({
      productId: item.productId,
      storeIds: storeId,
      isAvailable: true,
    });

    if (!product) {
      result.valid = false;
      result.errors.push(`Product ${item.productId} not found in store`);
      continue;
    }

    const inStock = product.stock >= item.quantity;
    const inventoryItem: InventoryItem = {
      productId: product.productId,
      barcode: product.barcode,
      name: product.name,
      requestedQty: item.quantity,
      availableQty: product.stock,
      price: product.price,
      inStock,
    };

    result.items.push(inventoryItem);

    if (!inStock) {
      result.valid = false;
      result.outOfStock.push(product.name);
    }

    // Check if price changed
    if (item.price && item.price !== product.price) {
      result.priceChanged.push({
        productId: product.productId,
        oldPrice: item.price,
        newPrice: product.price,
      });
    }

    result.totalValue += product.price * item.quantity;
  }

  return result;
}

/**
 * Reserve inventory for checkout
 */
export async function reserveInventory(
  storeId: string,
  items: Array<{ productId: string; quantity: number }>
): Promise<{ success: boolean; error?: string }> {
  try {
    for (const item of items) {
      const product = await GoProduct.findOneAndUpdate(
        {
          productId: item.productId,
          storeIds: storeId,
          stock: { $gte: item.quantity },
        },
        {
          $inc: { stock: -item.quantity },
        },
        { new: true }
      );

      if (!product) {
        // Rollback previous reservations
        await rollbackReservations(storeId, items.slice(0, items.indexOf(item)));
        return {
          success: false,
          error: `Insufficient stock for ${item.productId}`,
        };
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Reservation error:', error);
    return { success: false, error: 'Reservation failed' };
  }
}

/**
 * Rollback inventory reservations
 */
async function rollbackReservations(
  storeId: string,
  items: Array<{ productId: string; quantity: number }>
): Promise<void> {
  for (const item of items) {
    await GoProduct.updateOne(
      {
        productId: item.productId,
        storeIds: storeId,
      },
      {
        $inc: { stock: item.quantity },
      }
    );
  }
}

/**
 * Release inventory after failed checkout
 */
export async function releaseInventory(
  storeId: string,
  items: Array<{ productId: string; quantity: number }>
): Promise<void> {
  await rollbackReservations(storeId, items);
}

/**
 * Confirm inventory (after successful payment)
 */
export async function confirmInventory(
  storeId: string,
  items: Array<{ productId: string; quantity: number }>
): Promise<void> {
  // Inventory was already reserved, just update stock records
  // In production, this might update batch numbers, expiry tracking, etc.
  console.log(`Inventory confirmed for ${items.length} items in store ${storeId}`);
}

/**
 * Get low stock alerts for a store
 */
export async function getLowStockAlerts(
  storeId: string,
  threshold: number = 10
): Promise<Array<{ productId: string; name: string; stock: number }>> {
  const products = await GoProduct.find({
    storeIds: storeId,
    stock: { $lte: threshold },
    isAvailable: true,
  }).select('productId name stock');

  return products.map((p) => ({
    productId: p.productId,
    name: p.name,
    stock: p.stock,
  }));
}

export default {
  validateInventory,
  reserveInventory,
  releaseInventory,
  confirmInventory,
  getLowStockAlerts,
};
