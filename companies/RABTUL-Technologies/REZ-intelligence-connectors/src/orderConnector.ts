/**
 * Order Service - Event Connector
 *
 * Hook into order service to emit events
 */

import { eventConnector, commerceEvents, engagementEvents } from './eventConnectors';

export interface OrderConnector {
  /**
   * Hook: Order created
   */
  onOrderCreated(order: {
    orderId: string;
    userId: string;
    merchantId: string;
    items: unknown[];
    total: number;
    paymentMethod: string;
  }): void;

  /**
   * Hook: Order completed
   */
  onOrderCompleted(order: {
    orderId: string;
    userId: string;
    merchantId: string;
    total: number;
    items: unknown[];
    completedAt: string;
  }): void;

  /**
   * Hook: Order cancelled
   */
  onOrderCancelled(order: {
    orderId: string;
    userId: string;
    merchantId: string;
    reason: string;
  }): void;

  /**
   * Hook: Order refunded
   */
  onOrderRefunded(order: {
    orderId: string;
    userId: string;
    merchantId: string;
    refundAmount: number;
  }): void;

  /**
   * Hook: Cart updated
   */
  onCartUpdated(cart: {
    userId: string;
    cartId: string;
    items: unknown[];
    total: number;
  }): void;

  /**
   * Hook: Cart abandoned
   */
  onCartAbandoned(cart: {
    userId: string;
    cartId: string;
    items: unknown[];
    total: number;
    ageMinutes: number;
  }): void;

  /**
   * Hook: Product viewed
   */
  onProductViewed(view: {
    userId: string;
    productId: string;
    merchantId: string;
    category: string;
    price: number;
  }): void;

  /**
   * Hook: Product added to cart
   */
  onProductAddedToCart(event: {
    userId: string;
    productId: string;
    cartId: string;
    quantity: number;
    price: number;
  }): void;
}

export function createOrderConnector(): OrderConnector {
  return {
    onOrderCreated: (order) => {
      // Emit commerce event
      commerceEvents.orderCreated({
        orderId: order.orderId,
        merchantId: order.merchantId,
        items: order.items,
        total: order.total,
        paymentMethod: order.paymentMethod
      }, {
        userId: order.userId,
        correlationId: order.orderId
      });

      // Emit intent signal
      engagementEvents.productAddedToCart({
        productId: order.items[0]?.productId,
        cartId: order.orderId,
        quantity: order.items.reduce((sum, i) => sum + (i.quantity || 1), 0),
        price: order.total
      }, { userId: order.userId });
    },

    onOrderCompleted: (order) => {
      commerceEvents.orderCompleted({
        orderId: order.orderId,
        merchantId: order.merchantId,
        items: order.items,
        total: order.total,
        completedAt: order.completedAt
      }, {
        userId: order.userId,
        correlationId: order.orderId
      });
    },

    onOrderCancelled: (order) => {
      commerceEvents.orderCancelled({
        orderId: order.orderId,
        merchantId: order.merchantId,
        reason: order.reason
      }, {
        userId: order.userId,
        correlationId: order.orderId
      });
    },

    onOrderRefunded: (order) => {
      commerceEvents.orderRefunded({
        orderId: order.orderId,
        merchantId: order.merchantId,
        refundAmount: order.refundAmount
      }, {
        userId: order.userId,
        correlationId: order.orderId
      });
    },

    onCartUpdated: (cart) => {
      commerceEvents.cartUpdated({
        cartId: cart.cartId,
        items: cart.items,
        total: cart.total
      }, {
        userId: cart.userId,
        correlationId: cart.cartId
      });
    },

    onCartAbandoned: (cart) => {
      commerceEvents.cartAbandoned({
        cartId: cart.cartId,
        items: cart.items,
        total: cart.total,
        ageMinutes: cart.ageMinutes
      }, {
        userId: cart.userId,
        correlationId: cart.cartId
      });
    },

    onProductViewed: (view) => {
      engagementEvents.productViewed({
        productId: view.productId,
        merchantId: view.merchantId,
        category: view.category,
        price: view.price
      }, {
        userId: view.userId
      });
    },

    onProductAddedToCart: (event) => {
      engagementEvents.productAddedToCart({
        productId: event.productId,
        cartId: event.cartId,
        quantity: event.quantity,
        price: event.price
      }, {
        userId: event.userId
      });
    }
  };
}

export const orderConnector = createOrderConnector();
export default orderConnector;
