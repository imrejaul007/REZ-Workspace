/**
 * useCartItems Hook
 * Item-specific cart operations
 * Split from CartContext.tsx for better modularity
 */

import { useCallback, useMemo } from 'react';
import { useCart } from './useCart';

/**
 * Hook for cart item operations
 */
export function useCartItems() {
  const { state, actions } = useCart();

  /**
   * Get selected items only
   */
  const selectedItems = useMemo(() => {
    return state.items.filter(item => item.selected);
  }, [state.items]);

  /**
   * Get total count of selected items
   */
  const selectedCount = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [selectedItems]);

  /**
   * Get total price of selected items
   */
  const selectedPrice = useMemo(() => {
    return selectedItems.reduce((sum, item) => {
      const price = item.discountedPrice || item.originalPrice || 0;
      const lineSubtotal = price * item.quantity;
      const lockFeeDiscount = item.discount || 0;
      return sum + Math.max(0, lineSubtotal - lockFeeDiscount);
    }, 0);
  }, [selectedItems]);

  /**
   * Check if an item is in the cart
   */
  const isInCart = useCallback((itemId: string): boolean => {
    return state.items.some(item => item.id === itemId);
  }, [state.items]);

  /**
   * Get quantity of an item in cart
   */
  const getQuantity = useCallback((itemId: string): number => {
    const item = state.items.find(item => item.id === itemId);
    return item ? item.quantity : 0;
  }, [state.items]);

  /**
   * Get an item by ID
   */
  const getItem = useCallback((itemId: string) => {
    return state.items.find(item => item.id === itemId);
  }, [state.items]);

  /**
   * Check if all items are selected
   */
  const allSelected = useMemo(() => {
    return state.items.length > 0 && state.items.every(item => item.selected);
  }, [state.items]);

  /**
   * Check if any items are selected
   */
  const anySelected = useMemo(() => {
    return state.items.some(item => item.selected);
  }, [state.items]);

  /**
   * Get items by type
   */
  const itemsByType = useMemo(() => {
    const grouped: Record<string, typeof state.items> = {};
    state.items.forEach(item => {
      const type = item.itemType || 'product';
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(item);
    });
    return grouped;
  }, [state.items]);

  return {
    items: state.items,
    selectedItems,
    selectedCount,
    selectedPrice,
    isInCart,
    getQuantity,
    getItem,
    allSelected,
    anySelected,
    itemsByType,
    actions,
  };
}
