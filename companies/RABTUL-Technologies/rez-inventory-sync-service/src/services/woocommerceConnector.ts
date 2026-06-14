/**
 * WooCommerce Connector for Inventory Sync
 *
 * Syncs inventory between REZ catalog and WooCommerce store
 */

import axios from 'axios';
import crypto from 'crypto';

interface WooCommerceConfig {
  url: string;
  consumerKey: string;
  consumerSecret: string;
  version?: string;
}

interface WooProduct {
  id: number;
  name: string;
  sku: string;
  stock_quantity: number;
  manage_stock: boolean;
  stock_status: string;
}

interface SyncResult {
  success: boolean;
  synced: number;
  errors: string[];
}

export class WooCommerceConnector {
  private config: WooCommerceConfig;
  private baseUrl: string;
  private auth: string;

  constructor(config: WooCommerceConfig) {
    this.config = config;
    this.baseUrl = `${config.url}/wp-json/wc/v3`;
    this.auth = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64');
  }

  /**
   * Get all products from WooCommerce
   */
  async getProducts(page = 1, perPage = 100): Promise<WooProduct[]> {
    const response = await this.request('GET', '/products', {
      params: { page, per_page: perPage }
    });
    return response.data || [];
  }

  /**
   * Get all products (paginated)
   */
  async getAllProducts(): Promise<WooProduct[]> {
    const products: WooProduct[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await this.request('GET', '/products', {
        params: { page, per_page: 100 }
      });

      const data = response.data || [];
      products.push(...data);

      // Check if there are more pages
      const totalPages = parseInt(response.headers?.['x-wp-totalpages'] || '1');
      hasMore = page < totalPages && data.length > 0;
      page++;
    }

    return products;
  }

  /**
   * Get product by SKU
   */
  async getProductBySku(sku: string): Promise<WooProduct | null> {
    try {
      const response = await this.request('GET', '/products', {
        params: { sku, per_page: 1 }
      });

      const products = response.data || [];
      return products.length > 0 ? products[0] : null;
    } catch (error) {
      console.error('Error fetching product by SKU:', error);
      return null;
    }
  }

  /**
   * Update product stock
   */
  async updateStock(productId: number, quantity: number): Promise<boolean> {
    try {
      await this.request('PUT', `/products/${productId}`, {
        data: {
          stock_quantity: quantity,
          stock_status: quantity > 0 ? 'instock' : 'outofstock'
        }
      });
      return true;
    } catch (error) {
      console.error('Error updating WooCommerce stock:', error);
      return false;
    }
  }

  /**
   * Bulk update stock
   */
  async bulkUpdateStock(
    items: Array<{ sku: string; quantity: number }>
  ): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      synced: 0,
      errors: []
    };

    for (const item of items) {
      try {
        const product = await this.getProductBySku(item.sku);
        if (product) {
          const success = await this.updateStock(product.id, item.quantity);
          if (success) {
            result.synced++;
          } else {
            result.errors.push(`Failed to update ${item.sku}`);
          }
        } else {
          result.errors.push(`SKU not found: ${item.sku}`);
        }
      } catch (error) {
        result.errors.push(`${item.sku}: ${error.message}`);
      }
    }

    result.success = result.errors.length === 0;
    return result;
  }

  /**
   * Batch update products
   */
  async batchUpdate(updates: Array<{ id: number; stock_quantity: number }>): Promise<boolean> {
    try {
      await this.request('POST', '/products/batch', {
        data: {
          update: updates.map(u => ({
            id: u.id,
            stock_quantity: u.stock_quantity,
            stock_status: u.stock_quantity > 0 ? 'instock' : 'outofstock'
          }))
        }
      });
      return true;
    } catch (error) {
      console.error('Error in batch update:', error);
      return false;
    }
  }

  /**
   * Get webhook deliveries for sync monitoring
   */
  async getWebhooks(): Promise<unknown[]> {
    const response = await this.request('GET', '/webhooks', {
      params: { topic: 'product.updated' }
    });
    return response.data || [];
  }

  /**
   * Create webhook for stock updates
   */
  async createWebhook(webhookUrl: string): Promise<number | null> {
    try {
      const response = await this.request('POST', '/webhooks', {
        data: {
          name: 'REZ Inventory Sync',
          topic: 'product.updated',
          delivery_url: webhookUrl,
          secret: crypto.randomBytes(32).toString('hex')
        }
      });
      return response.data?.id || null;
    } catch (error) {
      console.error('Error creating webhook:', error);
      return null;
    }
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.request('GET', '/system_status');
      return true;
    } catch (error) {
      console.error('WooCommerce connection test failed:', error);
      return false;
    }
  }

  /**
   * Make authenticated request to WooCommerce
   */
  private async request(
    method: string,
    endpoint: string,
    options: unknown = {}
  ): Promise<unknown> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await axios({
      method,
      url,
      ...options,
      params: {
        consumer_key: this.config.consumerKey,
        consumer_secret: this.config.consumerSecret,
        ...options.params
      },
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    return response;
  }
}

// Factory function
export function createWooCommerceConnector(config: WooCommerceConfig): WooCommerceConnector {
  return new WooCommerceConnector(config);
}
