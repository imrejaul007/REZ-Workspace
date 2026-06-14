// @ts-nocheck
/**
 * useCart Hook
 * Main cart hook combining context + Zustand store fallback
 * Split from CartContext.tsx for better modularity
 */

import { useContext } from 'react';
import { CartContext } from '@/contexts/CartContext';
import { useCartStore, type CartStoreState } from '@/stores/cartStore';
import { CartItem as CartItemType } from '@/types/cart';

// Types for cart state
export interface CartState {
  items: import('@/contexts/CartContext').CartItemWithQuantity[];
  totalItems: number;
  totalPrice: number;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
  isOnline: boolean;
  pendingSync: boolean;
  appliedCardOffer?: import('@/contexts/CartContext').CartCardOffer;
  dineInContext?: import('@/contexts/CartContext').DineInContext;
}

export interface CartActions {
  loadCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  addItem: (item: CartItemType) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  toggleItemSelection: (itemId: string) => void;
  selectAllItems: (selected: boolean) => void;
  clearCart: () => Promise<void>;
  clearError: () => void;
  getSelectedItems: () => import('@/contexts/CartContext').CartItemWithQuantity[];
  isItemInCart: (itemId: string) => boolean;
  getItemQuantity: (itemId: string) => number;
  applyCoupon: (couponCode: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
  setCardOffer: (offer: import('@/contexts/CartContext').CartCardOffer) => Promise<void>;
  removeCardOffer: () => void;
  setDineInContext: (ctx: import('@/contexts/CartContext').DineInContext | undefined) => void;
  syncWithServer: () => Promise<void>;
}

export interface UseCartContext {
  state: CartState;
  actions: CartActions;
}

/**
 * Main useCart hook
 * Falls back to Zustand store if used outside CartProvider
 */
export function useCart(): UseCartContext {
  const context = useContext(CartContext);
  const storeState = useCartStore((s: CartStoreState) => s.state);
  const storeActions = useCartStore((s: CartStoreState) => s.actions);

  if (context !== undefined) {
    return context as unknown as UseCartContext;
  }

  // Fallback to Zustand store
  return {
    state: storeState as unknown as CartState,
    actions: storeActions as unknown as CartActions,
  };
}

/**
 * Shorthand to get cart items
 */
export function useCartItems(): import('@/contexts/CartContext').CartItemWithQuantity[] {
  const { state } = useCart();
  return state.items;
}

/**
 * Shorthand to get cart total
 */
export function useCartTotal(): { totalItems: number; totalPrice: number } {
  const { state } = useCart();
  return { totalItems: state.totalItems, totalPrice: state.totalPrice };
}

/**
 * Shorthand to check if cart is loading
 */
export function useCartLoading(): boolean {
  const { state } = useCart();
  return state.isLoading;
}

/**
 * Shorthand to get cart error
 */
export function useCartError(): string | null {
  const { state } = useCart();
  return state.error;
}

/**
 * Shorthand to check if cart has pending sync
 */
export function useCartPendingSync(): boolean {
  const { state } = useCart();
  return state.pendingSync;
}

/**
 * Shorthand to check online status
 */
export function useCartOnlineStatus(): boolean {
  const { state } = useCart();
  return state.isOnline;
}
