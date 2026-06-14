/**
 * CartSocketIntegration Component
 *
 * This component integrates Socket.IO real-time updates with the CartContext.
 * It listens for stock changes and automatically updates the cart when:
 * - A product goes out of stock (removes from cart)
 * - Stock quantity changes (adjusts cart quantity if needed)
 * - Price changes (notifies user)
 *
 * Usage: Place this component at the root level (already included in _layout.tsx via SocketProvider)
 * Or use it in specific screens where you want cart-socket integration
 */

import React, { useEffect } from 'react';
import { platformAlertSimple } from '@/utils/platformAlert';
import { useSocket } from '@/contexts/SocketContext';
import { formatPrice } from '@/utils/priceFormatter';
import { useCartState, useCartActions, useGetCurrencySymbol } from '@/stores/selectors';
import { CartItemWithQuantity } from '@/stores/cartStore';

export function CartSocketIntegration() {
  const cartState = useCartState();
  const cartActions = useCartActions();
  const { onStockUpdate, onOutOfStock, onPriceUpdate, onLowStock } = useSocket();
  const getCurrencySymbol = useGetCurrencySymbol();
  const currencySymbol = getCurrencySymbol();

  useEffect(() => {

    // Listen for stock updates
    const unsubscribeStock = onStockUpdate((payload) => {

      // Find cart item with this product ID
      const cartItem = cartState.items.find(
        (item: CartItemWithQuantity) => (item.productId || item.id) === payload.productId
      );
      if (!cartItem) return;

      // If cart quantity exceeds available stock, adjust it
      const safePayloadQuantity = typeof payload.quantity === 'number' ? payload.quantity : 0;
      const safeCartQuantity = typeof cartItem.quantity === 'number' ? cartItem.quantity : 0;

      if (safeCartQuantity > safePayloadQuantity) {

        if (safePayloadQuantity === 0) {
          // Remove item if no stock available
          cartActions.removeItem(cartItem.id);
          platformAlertSimple('Stock Update', `${cartItem.name || 'This product'} is now out of stock and has been removed from your cart.`);
        } else {
          // Update quantity to match available stock
          cartActions.updateQuantity(cartItem.id, safePayloadQuantity);
          platformAlertSimple('Stock Update', `${cartItem.name || 'This product'} stock is now ${safePayloadQuantity}. Your cart has been updated.`);
        }
      }

    });

    // Listen for low stock alerts
    const unsubscribeLowStock = onLowStock((payload) => {
      const cartItem = cartState.items.find(
        (item: CartItemWithQuantity) => (item.productId || item.id) === payload.productId
      );
      if (!cartItem) return;

      platformAlertSimple(
        'Low Stock Alert',
        `Only ${payload.quantity} left for ${payload.productName || cartItem.name || 'this product'}. Order soon before it runs out!`
      );
    });

    // Listen for out of stock notifications
    const unsubscribeOut = onOutOfStock((payload) => {

      const cartItem = cartState.items.find(
        (item: CartItemWithQuantity) => (item.productId || item.id) === payload.productId
      );
      if (!cartItem) return;

      // Remove item from cart
      cartActions.removeItem(cartItem.id);
      platformAlertSimple('Out of Stock', `${payload.productName || cartItem.name || 'This product'} is now out of stock and has been removed from your cart.`);
    });

    // Listen for price updates
    const unsubscribePrice = onPriceUpdate((payload) => {

      const cartItem = cartState.items.find(
        (item: CartItemWithQuantity) => (item.productId || item.id) === payload.productId
      );
      if (!cartItem) return;

      // Reload cart to get updated prices
      cartActions.loadCart();

      // Safely calculate price change
      const oldPrice = typeof payload.oldPrice === 'number' ? payload.oldPrice : 0;
      const newPrice = typeof payload.newPrice === 'number' ? payload.newPrice : 0;
      const priceChange = newPrice - oldPrice;

      if (priceChange === 0) return; // No change, don't notify

      const absChange = Math.abs(priceChange);
      const formattedChange = formatPrice(absChange, 'INR') || `${currencySymbol}${absChange.toFixed(2)}`;
      const priceChangeText = priceChange > 0
        ? `increased by ${formattedChange}`
        : `decreased by ${formattedChange}`;

      platformAlertSimple('Price Update', `The price of ${cartItem.name || 'this product'} has ${priceChangeText}. Your cart has been updated.`);
    });

    // Cleanup
    return () => {
      if (typeof unsubscribeStock === 'function') unsubscribeStock();
      if (typeof unsubscribeLowStock === 'function') unsubscribeLowStock();
      if (typeof unsubscribeOut === 'function') unsubscribeOut();
      if (typeof unsubscribePrice === 'function') unsubscribePrice();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartState.items, onStockUpdate, onOutOfStock, onPriceUpdate, onLowStock]);

  // This component doesn't render anything
  return null;
}

export default CartSocketIntegration;