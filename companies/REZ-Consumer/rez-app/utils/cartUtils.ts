/**
 * Cart utility functions — production-safe helpers for locked product calculations.
 *
 * BUG-076 FIX: These utilities were previously exported from utils/mockCartData.ts
 * alongside test fixtures, making it misleading (mock = dev/test only).
 * Moved here so cart.tsx imports from a clearly production-appropriate module.
 * mockCartData.ts re-exports these for backward compatibility with existing tests.
 */

import { CartItem, LockedProduct, LOCK_CONFIG, getLockStatus } from '@/types/cart';
import { logger } from '@/utils/logger';

/**
 * DEPRECATED: cashback calculation must happen server-side. This returns 0 until removed.
 *
 * Previously summed cart item prices on the frontend. Cart totals (subtotal, tax, discount,
 * cashback, total) must come from the backend cart API response (cart.totals.*).
 * Use the totals already returned by the API instead of calling this function.
 */
export const calculateTotal = (items: CartItem[]): number => {
  return 0;
};

/** Return the count of cart items. */
export const getItemCount = (items: CartItem[]): number => {
  return items.length;
};

/**
 * DEPRECATED: cashback calculation must happen server-side. This returns 0 until removed.
 *
 * Previously summed locked product prices on the frontend. Locked item totals must come
 * from the backend API response rather than being computed client-side.
 */
export const calculateLockedTotal = (items: LockedProduct[]): number => {
  return 0;
};

/** Return the count of currently locked items. */
export const getLockedItemCount = (items: LockedProduct[]): number => {
  return items.length;
};

/**
 * Recalculate remaining times for all locked products and remove expired ones.
 * Call this on every timer tick to keep the UI in sync.
 */
export const updateLockedProductTimers = (items: LockedProduct[]): LockedProduct[] => {
  const now = new Date();
  return items
    .map((item) => {
      // Type guard: validate expiresAt is a valid Date before calling getTime()
      if (!item.expiresAt || !(item.expiresAt instanceof Date)) {
        logger.warn(`Invalid expiresAt for item ${item.id}:`, { itemId: item.id, expiresAt: item.expiresAt });
        return { ...item, remainingTime: 0, status: 'expired' as const };
      }
      const remainingTime = Math.max(0, item.expiresAt.getTime() - now.getTime());
      return {
        ...item,
        remainingTime,
        status: getLockStatus(remainingTime),
      };
    })
    .filter((item) => item.remainingTime > 0); // Remove expired items
};

/** Format a remaining-time value (ms) as "M:SS". */
export const formatRemainingTime = (remainingTime: number): string => {
  if (remainingTime <= 0) return 'Expired';
  const minutes = Math.floor(remainingTime / (60 * 1000));
  const seconds = Math.floor((remainingTime % (60 * 1000)) / 1000);
  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  return `0:${seconds.toString().padStart(2, '0')}`;
};

/** Create a LockedProduct from a CartItem. */
export const createLockedProductFromCartItem = (
  item: CartItem,
  productId?: string,
): LockedProduct => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + LOCK_CONFIG.DEFAULT_DURATION);
  return {
    id: `locked_${item.id}_${Date.now()}`,
    productId: productId || item.id,
    name: item.name,
    price: item.price,
    image: item.image,
    cashback: item.cashback,
    category: item.category,
    lockedAt: now,
    expiresAt,
    remainingTime: LOCK_CONFIG.DEFAULT_DURATION,
    lockDuration: LOCK_CONFIG.DEFAULT_DURATION,
    status: 'active',
  };
};
