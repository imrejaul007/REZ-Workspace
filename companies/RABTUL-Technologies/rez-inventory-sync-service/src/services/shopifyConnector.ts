/**
 * Shopify Connector for Inventory Sync
 *
 * Syncs inventory between REZ catalog and Shopify store
 */

import axios from 'axios';
import crypto from 'crypto';

interface ShopifyConfig {
  shop: string;
  accessToken: string;
  apiVersion?: string;
}

interface ShopifyProduct {
  id: string;
  title: string;
  variants: Array<{
    id: string;
    sku: string;
    inventory_quantity: number;
  }>;
}

interface SyncResult {
  success: boolean;
  synced: number;
  errors: string[];
}

export class ShopifyConnector {
  private config: ShopifyConfig;
  private baseUrl: string;

  constructor(config: ShopifyConfig) {
    this.config = config;
    this.baseUrl = `https://${config.shop}/admin/api/${config.apiVersion || '2024-01'}`;
  }

  /**
   * Get all products from Shopify
   */
  async getProducts(): Promise<ShopifyProduct[]> {
    const products: ShopifyProduct[] = [];
    let pageInfo: string | null = null;

    do {
      const params = pageInfo ? `?page_info=${pageInfo}&limit=250` : '?limit=250';
      const response = await this.request('GET', `/products.json${params}`);

      products.push(...response.products);

      // Extract next page info from Link header
      const linkHeader = response.headers?.link || '';
      const nextMatch = linkHeader.match(/<[^>]*[?&]page_info=([^&>]+)[^>]*>;\s*rel="next"/);
      pageInfo = nextMatch ? nextMatch[1] : null;

    } while (pageInfo);

    return products;
  }

  /**
   * Get product by SKU
   */
  async getProductBySku(sku: string): Promise<ShopifyProduct | null> {
    try {
      const response = await this.request('GET', '/products.json', {
        params: { limit: 1 }
      });

      // Filter client-side (Shopify doesn't support SKU search directly)
      const products = response.products as ShopifyProduct[];
      return products.find(p =>
        p.variants.some(v => v.sku === sku)
      ) || null;
    } catch (error) {
      console.error('Error fetching product by SKU:', error);
      return null;
    }
  }

  /**
   * Update inventory for a product variant
   */
  async updateInventory(
    variantId: string,
    quantity: number,
    locationId?: string
  ): Promise<boolean> {
    try {
      const payload: unknown = {
        location_id: locationId,
        inventory_item_id: variantId,
        available: quantity
      };

      await this.request('POST', '/inventory_levels/set.json', payload);
      return true;
    } catch (error) {
      console.error('Error updating Shopify inventory:', error);
      return false;
    }
  }

  /**
   * Bulk update inventory
   */
  async bulkUpdateInventory(
    items: Array<{ variantId: string; quantity: number }>,
    locationId?: string
  ): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      synced: 0,
      errors: []
    };

    for (const item of items) {
      try {
        const success = await this.updateInventory(item.variantId, item.quantity, locationId);
        if (success) {
          result.synced++;
        } else {
          result.errors.push(`Failed to update variant ${item.variantId}`);
        }
      } catch (error) {
        result.errors.push(`${item.variantId}: ${error.message}`);
      }
    }

    result.success = result.errors.length === 0;
    return result;
  }

  /**
   * Get inventory levels for a location
   */
  async getInventoryLevels(locationId: string): Promise<unknown[]> {
    const response = await this.request('GET', '/inventory_levels.json', {
      params: { location_id: locationId, limit: 250 }
    });
    return response.inventory_levels || [];
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.request('GET', '/shop.json');
      return true;
    } catch (error) {
      console.error('Shopify connection test failed:', error);
      return false;
    }
  }

  /**
   * Make authenticated request to Shopify
   */
  private async request(
    method: string,
    endpoint: string,
    data?: unknown
  ): Promise<unknown> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await axios({
      method,
      url,
      data,
      headers: {
        'X-Shopify-Access-Token': this.config.accessToken,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  }
}

// Factory function
export function createShopifyConnector(config: ShopifyConfig): ShopifyConnector {
  return new ShopifyConnector(config);
}
