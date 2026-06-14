/**
 * Cart store selectors — 37 imports.
 */

import { useCartStore } from '../cartStore';

/** Only re-renders when item count changes */
export const useCartItemCount = () => useCartStore((s: ReturnType<typeof useCartStore.getState>) => s.state.items?.length ?? 0);

/** Only re-renders when cart items change */
export const useCartItems = () => useCartStore((s: ReturnType<typeof useCartStore.getState>) => s.state.items);

/** Only re-renders when cart total changes */
export const useCartTotal = () => useCartStore((s: ReturnType<typeof useCartStore.getState>) => s.state.totalPrice ?? 0);

/** Only re-renders when cart loading changes */
export const useCartLoading = () => useCartStore((s: ReturnType<typeof useCartStore.getState>) => s.state.isLoading);

/** Never re-renders — stable action references */
export const useCartActions = () => useCartStore((s: ReturnType<typeof useCartStore.getState>) => s.actions);

/** Full cart state (use sparingly) */
export const useCartState = () => useCartStore((s: ReturnType<typeof useCartStore.getState>) => s.state);

/** Stable function — never re-renders */
export const useRefreshCart = () => useCartStore((s: ReturnType<typeof useCartStore.getState>) => s.refreshCart);
