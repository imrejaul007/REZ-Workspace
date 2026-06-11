/**
 * GroceryIQ - Grocery Connector
 *
 * Connects GroceryIQ AI to REZ-Merchant grocery services.
 * Bridges the AI layer to the business operations layer.
 */

import { createLogger } from '../src/utils/logger';

const logger = createLogger('grocery-connector');

interface REZMerchantConfig {
  baseUrl: string;
  internalToken: string;
}

interface ProductSync {
  sku: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  syncedAt: Date;
}

interface OrderSync {
  orderId: string;
  items: Array<{
    sku: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: string;
  syncedAt: Date;
}

class GroceryConnector {
  private rezMerchantConfig: REZMerchantConfig;
  private groceryiqUrl: string;

  constructor() {
    this.rezMerchantConfig = {
      baseUrl: process.env.REZ_MERCHANT_URL || 'http://localhost:4100',
      internalToken: process.env.INTERNAL_SERVICE_TOKEN || ''
    };
    this.groceryiqUrl = process.env.GROCERYIQ_URL || 'http://localhost:4131';
  }

  /**
   * Sync products from REZ-Merchant to GroceryIQ
   */
  async syncProducts(): Promise<ProductSync[]> {
    logger.info('Syncing products from REZ-Merchant to GroceryIQ...');

    try {
      // Fetch products from REZ-Merchant
      const response = await fetch(`${this.rezMerchantConfig.baseUrl}/api/products`, {
        headers: {
          'X-Internal-Token': this.rezMerchantConfig.internalToken
        }
      });

      if (!response.ok) {
        throw new Error(`REZ-Merchant returned ${response.status}`);
      }

      const data = await response.json();
      const syncedProducts: ProductSync[] = [];

      // Sync each product to GroceryIQ
      for (const product of data.products || []) {
        const syncResult = await this.syncProductToGroceryIQ(product);
        if (syncResult) {
          syncedProducts.push(syncResult);
        }
      }

      logger.info(`Synced ${syncedProducts.length} products to GroceryIQ`);
      return syncedProducts;
    } catch (error) {
      logger.error('Failed to sync products', { error });
      return [];
    }
  }

  /**
   * Sync a single product to GroceryIQ
   */
  private async syncProductToGroceryIQ(product: any): Promise<ProductSync | null> {
    try {
      const response = await fetch(`${this.groceryiqUrl}/api/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: product.sku,
          name: product.name,
          category: product.category,
          quantity: product.stock || 0,
          price: product.price,
          cost: product.costPrice,
          reorderPoint: product.reorderLevel || 10,
          reorderQuantity: product.reorderQuantity || 100
        })
      });

      const data = await response.json();

      if (data.success) {
        return {
          sku: product.sku,
          name: product.name,
          category: product.category,
          quantity: product.stock || 0,
          price: product.price,
          syncedAt: new Date()
        };
      }

      return null;
    } catch (error) {
      logger.error('Failed to sync product', { error, sku: product.sku });
      return null;
    }
  }

  /**
   * Sync orders from REZ-Merchant to GroceryIQ for demand forecasting
   */
  async syncOrders(): Promise<OrderSync[]> {
    logger.info('Syncing orders from REZ-Merchant to GroceryIQ...');

    try {
      // Fetch recent orders from REZ-Merchant
      const response = await fetch(`${this.rezMerchantConfig.baseUrl}/api/orders?status=completed&limit=100`, {
        headers: {
          'X-Internal-Token': this.rezMerchantConfig.internalToken
        }
      });

      if (!response.ok) {
        throw new Error(`REZ-Merchant returned ${response.status}`);
      }

      const data = await response.json();
      const syncedOrders: OrderSync[] = [];

      // Process each order for demand analysis
      for (const order of data.orders || []) {
        const syncResult = await this.processOrderForDemand(order);
        if (syncResult) {
          syncedOrders.push(syncResult);
        }
      }

      logger.info(`Synced ${syncedOrders.length} orders for demand analysis`);
      return syncedOrders;
    } catch (error) {
      logger.error('Failed to sync orders', { error });
      return [];
    }
  }

  /**
   * Process order for demand forecasting
   */
  private async processOrderForDemand(order: any): Promise<OrderSync | null> {
    try {
      // Record each item as a sale for demand analysis
      for (const item of order.items || []) {
        await fetch(`${this.groceryiqUrl}/api/inventory/adjust`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sku: item.sku,
            adjustment: -item.quantity, // Sale reduces inventory
            reason: `Order ${order.orderId}`,
            type: 'sale'
          })
        });
      }

      return {
        orderId: order.orderId,
        items: order.items,
        total: order.total,
        status: order.status,
        syncedAt: new Date()
      };
    } catch (error) {
      logger.error('Failed to process order', { error, orderId: order.orderId });
      return null;
    }
  }

  /**
   * Get inventory alerts from GroceryIQ and sync to REZ-Merchant
   */
  async syncInventoryAlerts(): Promise<any[]> {
    logger.info('Syncing inventory alerts to REZ-Merchant...');

    try {
      // Get low stock alerts from GroceryIQ
      const response = await fetch(`${this.groceryiqUrl}/api/inventory/low-stock`);
      const data = await response.json();

      const alerts: any[] = [];

      // Sync each alert to REZ-Merchant
      for (const item of data.data || []) {
        // Create purchase order in REZ-Merchant
        const poResponse = await fetch(`${this.rezMerchantConfig.baseUrl}/api/purchase-orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Token': this.rezMerchantConfig.internalToken
          },
          body: JSON.stringify({
            sku: item.sku,
            name: item.name,
            quantity: item.reorderQuantity || 100,
            priority: item.quantity === 0 ? 'urgent' : 'normal'
          })
        });

        if (poResponse.ok) {
          alerts.push({
            sku: item.sku,
            name: item.name,
            currentStock: item.quantity,
            reorderPoint: item.reorderPoint,
            purchaseOrderCreated: true
          });
        }
      }

      logger.info(`Synced ${alerts.length} inventory alerts`);
      return alerts;
    } catch (error) {
      logger.error('Failed to sync inventory alerts', { error });
      return [];
    }
  }

  /**
   * Get pricing recommendations from GroceryIQ and sync to REZ-Merchant
   */
  async syncPricingRecommendations(): Promise<any[]> {
    logger.info('Syncing pricing recommendations to REZ-Merchant...');

    try {
      // Get pricing recommendations from GroceryIQ
      const response = await fetch(`${this.groceryiqUrl}/api/pricing/recommend?sku=all`);
      const data = await response.json();

      const recommendations: any[] = [];

      // Sync each recommendation to REZ-Merchant
      for (const rec of data.data || []) {
        const updateResponse = await fetch(
          `${this.rezMerchantConfig.baseUrl}/api/products/${rec.sku}/pricing`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'X-Internal-Token': this.rezMerchantConfig.internalToken
            },
            body: JSON.stringify({
              price: rec.recommendedPrice,
              strategy: rec.strategy,
              margin: rec.margin
            })
          }
        );

        if (updateResponse.ok) {
          recommendations.push({
            sku: rec.sku,
            currentPrice: rec.currentPrice,
            recommendedPrice: rec.recommendedPrice,
            synced: true
          });
        }
      }

      logger.info(`Synced ${recommendations.length} pricing recommendations`);
      return recommendations;
    } catch (error) {
      logger.error('Failed to sync pricing recommendations', { error });
      return [];
    }
  }

  /**
   * Full sync - sync all data between GroceryIQ and REZ-Merchant
   */
  async fullSync(): Promise<{
    products: number;
    orders: number;
    alerts: number;
    pricing: number;
  }> {
    logger.info('Starting full sync between GroceryIQ and REZ-Merchant...');

    const [products, orders, alerts, pricing] = await Promise.all([
      this.syncProducts(),
      this.syncOrders(),
      this.syncInventoryAlerts(),
      this.syncPricingRecommendations()
    ]);

    const result = {
      products: products.length,
      orders: orders.length,
      alerts: alerts.length,
      pricing: pricing.length
    };

    logger.info('Full sync completed', result);
    return result;
  }

  /**
   * Get connection status
   */
  async getConnectionStatus(): Promise<{
    groceryiq: boolean;
    rezMerchant: boolean;
    lastSync: Date | null;
  }> {
    try {
      // Check GroceryIQ
      const groceryiqResponse = await fetch(`${this.groceryiqUrl}/health`);
      const groceryiqOk = groceryiqResponse.ok;

      // Check REZ-Merchant
      const rezMerchantResponse = await fetch(`${this.rezMerchantConfig.baseUrl}/health`, {
        headers: {
          'X-Internal-Token': this.rezMerchantConfig.internalToken
        }
      });
      const rezMerchantOk = rezMerchantResponse.ok;

      return {
        groceryiq: groceryiqOk,
        rezMerchant: rezMerchantOk,
        lastSync: new Date()
      };
    } catch (error) {
      logger.error('Failed to get connection status', { error });
      return {
        groceryiq: false,
        rezMerchant: false,
        lastSync: null
      };
    }
  }
}

export const groceryConnector = new GroceryConnector();
export { GroceryConnector };
