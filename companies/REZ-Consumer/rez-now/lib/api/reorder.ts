/**
 * reorder.ts
 *
 * Fetches a previous order by orderNumber and pre-populates the cart so the
 * customer can reorder with a single tap.
 *
 * Usage:
 *   const ok = await prefillCartFromOrder(orderNumber, storeSlug);
 *   // returns true if at least one item was loaded, false otherwise
 */

import { publicClient } from './client';
import { useCartStore } from '@/lib/store/cartStore';
import { CartItem } from '@/lib/types';
import { logger } from '@/lib/utils/logger';

interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
  image?: string;
  customisation?: string;
}

interface OrderResponse {
  success: boolean;
  data?: {
    orderNumber: string;
    status: string;
    items: OrderItem[];
    total: number;
    storeName?: string;
  };
}

/**
 * Fetches order `orderNumber` from the backend and loads its items into the
 * Zustand cart store for `storeSlug`.
 *
 * Returns `true` when at least one item was added to the cart, `false` if the
 * fetch failed or the order had no items.
 */
export async function prefillCartFromOrder(
  orderNumber: string,
  storeSlug: string,
): Promise<boolean> {
  try {
    const { data } = await publicClient.get<OrderResponse>(
      `/api/web-ordering/order/${orderNumber}`,
    );

    if (!data.success || !data.data?.items?.length) {
      return false;
    }

    const { setStore, clearCart, addItem } = useCartStore.getState();

    // Switch store (clears cart if it was for a different slug)
    setStore(storeSlug);

    // Clear any existing items so only the reorder items appear
    clearCart();

    // Map backend OrderItem → CartItem and bulk-add
    for (const item of data.data.items) {
      const cartItem: Omit<CartItem, 'quantity'> = {
        itemId: item.menuItemId,
        name: item.name,
        // Backend stores price in paise already
        price: item.price,
        basePrice: item.price,
        customizations: {},
        customizationTotal: 0,
        isVeg: false, // unknown from order history — conservative default
      };

      // addItem increments by 1 each call; call it `quantity` times
      const qty = Math.max(1, item.quantity);
      for (let i = 0; i < qty; i++) {
        addItem(cartItem);
      }
    }

    return true;
  } catch (err) {
    // NW-MED-002: Log network failures so operators can diagnose issues.
    // Return false so callers can decide whether to surface an error toast.
    logger.error('[reorder] Failed to prefill cart', {
      orderNumber,
      storeSlug,
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}
