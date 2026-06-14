/**
 * useCartTotal Hook
 * Cart total calculations and price utilities
 * Split from CartContext.tsx for better modularity
 */

import { useMemo } from 'react';
import { useCart } from './useCart';

interface CartTotals {
  totalItems: number;
  totalPrice: number;
  subtotal: number;
  discount: number;
  savings: number;
  itemCount: number;
  selectedItems: number;
  selectedPrice: number;
}

interface PriceBreakdown {
  originalPrice: number;
  discountedPrice: number;
  savings: number;
  savingsPercentage: number;
}

/**
 * Hook for cart total calculations
 */
export function useCartTotal(): CartTotals {
  const { state } = useCart();

  return useMemo(() => {
    const selectedItems = state.items.filter(item => item.selected);

    const totalItems = selectedItems.reduce((sum, item) => sum + item.quantity, 0);

    // Calculate subtotal (before any discounts)
    const subtotal = selectedItems.reduce((sum, item) => {
      const price = item.originalPrice || item.price || 0;
      return sum + (price * item.quantity);
    }, 0);

    // Calculate actual total (after discounts)
    const totalPrice = state.totalPrice;

    // Calculate total discount (lock fee discounts)
    const discount = selectedItems.reduce((sum, item) => sum + (item.discount || 0), 0);

    // Calculate savings
    const savings = Math.max(0, subtotal - totalPrice);

    return {
      totalItems,
      totalPrice,
      subtotal,
      discount,
      savings,
      itemCount: state.items.length,
      selectedItems: selectedItems.length,
      selectedPrice: totalPrice,
    };
  }, [state.items, state.totalPrice]);
}

/**
 * Hook for line item price breakdown
 */
export function useCartItemPrice(itemId: string): PriceBreakdown | null {
  const { state } = useCart();

  return useMemo(() => {
    const item = state.items.find(i => i.id === itemId);
    if (!item) return null;

    const originalPrice = (item.originalPrice || item.price || 0) * item.quantity;
    const discountedPrice = (item.discountedPrice || item.price || 0) * item.quantity;
    const savings = Math.max(0, originalPrice - discountedPrice);
    const savingsPercentage = originalPrice > 0 ? (savings / originalPrice) * 100 : 0;

    return {
      originalPrice,
      discountedPrice,
      savings,
      savingsPercentage,
    };
  }, [state.items, itemId]);
}

/**
 * Hook for cart savings summary
 */
export function useCartSavings() {
  const { state } = useCart();

  return useMemo(() => {
    const selectedItems = state.items.filter(item => item.selected);

    const lockFeeSavings = selectedItems.reduce((sum, item) => sum + (item.discount || 0), 0);

    const priceSavings = selectedItems.reduce((sum, item) => {
      const original = (item.originalPrice || 0) * item.quantity;
      const discounted = (item.discountedPrice || item.price || 0) * item.quantity;
      return sum + Math.max(0, original - discounted);
    }, 0);

    const totalSavings = priceSavings + lockFeeSavings;

    return {
      lockFeeSavings,
      priceSavings,
      totalSavings,
      hasSavings: totalSavings > 0,
    };
  }, [state.items]);
}
