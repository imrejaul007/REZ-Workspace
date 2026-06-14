/**
 * Wishlist store selectors — 15 imports.
 */

import { useWishlistStore } from '../wishlistStore';

/** Only re-renders when wishlist count changes */
export const useWishlistCount = () => useWishlistStore((s: ReturnType<typeof useWishlistStore.getState>) => s.wishlistItems?.length ?? 0);

/** Stable function — never re-renders */
export const useIsInWishlist = () => useWishlistStore((s: ReturnType<typeof useWishlistStore.getState>) => s.isInWishlist);
