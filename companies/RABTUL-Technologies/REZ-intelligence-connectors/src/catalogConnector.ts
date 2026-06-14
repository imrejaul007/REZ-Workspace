/**
 * Catalog Service - Event Connector
 *
 * Hook into catalog service to emit events
 */

import { eventConnector } from './eventConnectors';

export interface CatalogConnector {
  /**
   * Hook: Product viewed
   */
  onProductViewed(product: {
    productId: string;
    userId?: string;
    merchantId: string;
    category: string;
    price: number;
    viewedAt: string;
  }): void;

  /**
   * Hook: Product added
   */
  onProductAdded(product: {
    productId: string;
    merchantId: string;
    name: string;
    category: string;
    price: number;
    addedAt: string;
  }): void;

  /**
   * Hook: Product updated
   */
  onProductUpdated(product: {
    productId: string;
    merchantId: string;
    changes: Record<string, unknown>;
    updatedAt: string;
  }): void;

  /**
   * Hook: Product removed
   */
  onProductRemoved(product: {
    productId: string;
    merchantId: string;
    reason: string;
    removedAt: string;
  }): void;

  /**
   * Hook: Out of stock
   */
  onProductOutOfStock(product: {
    productId: string;
    merchantId: string;
    currentStock: number;
    outOfStockAt: string;
  }): void;

  /**
   * Hook: Back in stock
   */
  onProductBackInStock(product: {
    productId: string;
    merchantId: string;
    currentStock: number;
    backInStockAt: string;
  }): void;

  /**
   * Hook: Low inventory
   */
  onLowInventory(product: {
    productId: string;
    merchantId: string;
    currentStock: number;
    threshold: number;
    inventoryAt: string;
  }): void;

  /**
   * Hook: Price changed
   */
  onPriceChanged(product: {
    productId: string;
    merchantId: string;
    oldPrice: number;
    newPrice: number;
    changedAt: string;
  }): void;
}

export function createCatalogConnector(): CatalogConnector {
  return {
    onProductViewed: (product) => {
      eventConnector.emit('catalog.product.viewed', {
        productId: product.productId,
        merchantId: product.merchantId,
        category: product.category,
        price: product.price,
        viewedAt: product.viewedAt
      }, {
        userId: product.userId,
        correlationId: product.productId
      });
    },

    onProductAdded: (product) => {
      eventConnector.emit('catalog.product.added', {
        productId: product.productId,
        merchantId: product.merchantId,
        name: product.name,
        category: product.category,
        price: product.price,
        addedAt: product.addedAt
      }, {
        correlationId: product.productId
      });
    },

    onProductUpdated: (product) => {
      eventConnector.emit('catalog.product.updated', {
        productId: product.productId,
        merchantId: product.merchantId,
        changes: product.changes,
        updatedAt: product.updatedAt
      }, {
        correlationId: product.productId
      });
    },

    onProductRemoved: (product) => {
      eventConnector.emit('catalog.product.removed', {
        productId: product.productId,
        merchantId: product.merchantId,
        reason: product.reason,
        removedAt: product.removedAt
      }, {
        correlationId: product.productId
      });
    },

    onProductOutOfStock: (product) => {
      eventConnector.emit('catalog.product.out_of_stock', {
        productId: product.productId,
        merchantId: product.merchantId,
        currentStock: product.currentStock,
        outOfStockAt: product.outOfStockAt
      }, {
        correlationId: product.productId
      });
    },

    onProductBackInStock: (product) => {
      eventConnector.emit('catalog.product.back_in_stock', {
        productId: product.productId,
        merchantId: product.merchantId,
        currentStock: product.currentStock,
        backInStockAt: product.backInStockAt
      }, {
        correlationId: product.productId
      });
    },

    onLowInventory: (product) => {
      eventConnector.emit('catalog.inventory.low', {
        productId: product.productId,
        merchantId: product.merchantId,
        currentStock: product.currentStock,
        threshold: product.threshold,
        inventoryAt: product.inventoryAt
      }, {
        correlationId: product.productId
      });
    },

    onPriceChanged: (product) => {
      eventConnector.emit('catalog.price.changed', {
        productId: product.productId,
        merchantId: product.merchantId,
        oldPrice: product.oldPrice,
        newPrice: product.newPrice,
        changePercent: ((product.newPrice - product.oldPrice) / product.oldPrice * 100).toFixed(2),
        changedAt: product.changedAt
      }, {
        correlationId: product.productId
      });
    }
  };
}

export const catalogConnector = createCatalogConnector();
export default catalogConnector;
