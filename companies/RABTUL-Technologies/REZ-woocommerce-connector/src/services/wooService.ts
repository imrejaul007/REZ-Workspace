/**
 * WooCommerce Connector - WooService
 * Deep integration with WooCommerce REST API
 */

import { WooStore, ProductMapping, OrderMapping, InventorySync } from '../models';

// ─── Structured Logger ─────────────────────────────────────────────────────────
const SERVICE_NAME = 'REZ-woocommerce-connector';

function log(level: 'INFO' | 'WARN' | 'ERROR', message: string, meta?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    service: SERVICE_NAME,
    level,
    message,
    ...meta,
  };
  console.log(JSON.stringify(logEntry));
}

const logger = {
  warn: (message: string, meta?: Record<string, unknown>) => log('WARN', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log('ERROR', message, meta),
};

const WC_API_BASE = 'https://api.woocommerceservices.com/v2/';

// ─── SSRF Protection ──────────────────────────────────────────────────────────
const BLOCKED_IP_PATTERNS = [
  /^127\./,                    // Loopback
  /^10\./,                     // Private Class A
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Private Class B
  /^192\.168\./,               // Private Class C
  /^169\.254\./,               // Link-local (AWS metadata)
  /^0\./,                      // Current network
  /^224\./,                    // Multicast
  /^240\./,                    // Reserved
  /^localhost$/i,
  /^0\.0\.0\.0$/,
];

const BLOCKED_HOSTNAMES = [
  'localhost',
  'metadata.google.internal',
  'metadata.goog',
];

/**
 * Validate URL for SSRF protection
 * Blocks private IP ranges, localhost, and AWS metadata endpoints
 */
function validateSSRFUrl(urlString: string): void {
  try {
    const parsed = new URL(urlString);
    const hostname = parsed.hostname.toLowerCase();

    // Check blocked hostnames
    if (BLOCKED_HOSTNAMES.includes(hostname)) {
      throw new Error(`SSRF blocked: hostname '${hostname}' is not allowed`);
    }

    // Check if hostname is an IP address
    const ipPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
    if (ipPattern.test(hostname)) {
      // Check against blocked IP patterns
      for (const pattern of BLOCKED_IP_PATTERNS) {
        if (pattern.test(hostname)) {
          throw new Error(`SSRF blocked: private IP range '${hostname}' is not allowed`);
        }
      }
    }

    // Only allow HTTPS for external URLs
    if (parsed.protocol !== 'https:') {
      throw new Error(`SSRF blocked: only HTTPS URLs are allowed, got '${parsed.protocol}'`);
    }

    logger.warn('URL validated', { hostname, protocol: parsed.protocol });
  } catch (error) {
    logger.error('SSRF validation failed', { url: urlString, error: (error as Error).message });
    throw error;
  }
}

/**
 * WooCommerce product variation
 */
interface WooProductVariation {
  id: number;
  sku: string;
  price: string;
  regular_price: string;
  stock_quantity: number;
  attributes: Array<{ name: string; option: string }>;
}

/**
 * WooCommerce product interface
 */
interface WooProduct {
  id: number;
  name: string;
  sku: string;
  price: string;
  regular_price: string;
  stock_quantity: number;
  stock_status: string;
  categories: Array<{ id: number; name: string }>;
  images: Array<{ src: string }>;
  variations?: Array<WooProductVariation>;
}

/**
 * WooCommerce billing address
 */
interface WooBillingAddress {
  first_name: string;
  last_name: string;
  company: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  email: string;
  phone: string;
}

/**
 * WooCommerce shipping address
 */
interface WooShippingAddress {
  first_name: string;
  last_name: string;
  company: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

/**
 * WooCommerce line item
 */
interface WooLineItem {
  id: number;
  name: string;
  product_id: number;
  variation_id: number;
  quantity: number;
  tax_class: string;
  subtotal: string;
  subtotal_tax: string;
  total: string;
  total_tax: string;
  sku: string;
  price: number;
}

/**
 * WooCommerce order interface
 */
interface WooOrder {
  id: number;
  status: string;
  billing: WooBillingAddress;
  shipping: WooShippingAddress;
  line_items: Array<WooLineItem>;
  payment_method: string;
  total: string;
  currency: string;
  customer?: { id: number };
}

class WooService {
  /**
   * Connect a WooCommerce store
   */
  async connectStore(storeUrl: string, consumerKey: string, consumerSecret: string): Promise<{ storeId: string }> {
    // Verify credentials
    const response = await this.request(storeUrl, consumerKey, consumerSecret, 'GET', '/system_status');

    if (!response) {
      throw new Error('Invalid WooCommerce credentials');
    }

    const storeId = `woo_${Date.now()}`;

    await WooStore.create({
      storeId,
      consumerKey,
      consumerSecret,
      siteUrl: storeUrl,
      status: 'active',
    });

    // Sync initial data
    await this.syncAllProducts(storeId, storeUrl, consumerKey, consumerSecret);
    await this.syncAllOrders(storeId, storeUrl, consumerKey, consumerSecret);

    return { storeId };
  }

  /**
   * Sync all products from WooCommerce
   *
   * PERFORMANCE ISSUE: Sequential N+1 Pattern (Lines 69-71)
   * ------------------------------------------
   * Each product is synced individually with await in loop.
   *
   * Problem:
   *   - N products = N sequential syncProduct() calls
   *   - Each syncProduct() does 2 DB operations (ProductMapping + InventorySync)
   *   - Total: 1 API call + 2N DB operations, all sequential
   *
   * Batching Opportunities:
   *   1. Batch WooCommerce API calls using concurrent requests
   *      - Use Promise.all with chunking (e.g., 10 concurrent)
   *
   *   2. Batch MongoDB operations
   *      - Replace individual findOneAndUpdate with bulkWrite
   *      - Build array of operations, execute once
   *
   *   3. Pipeline approach for InventorySync
   *      - Collect all inventory updates
   *      - Single bulkWrite with upsert operations
   *
   * Fix Example:
   *   ```typescript
   *   const CHUNK_SIZE = 10;
   *   for (let i = 0; i < products.length; i += CHUNK_SIZE) {
   *     const chunk = products.slice(i, i + CHUNK_SIZE);
   *     await Promise.all(chunk.map(p => this.syncProduct(storeId, p, ...)));
   *   }
   *
   *   // Then bulk write inventory
   *   const inventoryOps = products.map(p => ({
   *     updateOne: { filter: {...}, update: {...}, upsert: true }
   *   }));
   *   await InventorySync.bulkWrite(inventoryOps);
   *   ```
   */
  async syncAllProducts(storeId: string, storeUrl: string, key: string, secret: string): Promise<number> {
    const products = await this.requestAll<WooProduct>(storeUrl, key, secret, '/products?per_page=100');

    // FIX: Use batch operations instead of N+1 queries
    const CHUNK_SIZE = 20; // Process 20 products at a time

    for (let i = 0; i < products.length; i += CHUNK_SIZE) {
      const chunk = products.slice(i, i + CHUNK_SIZE);

      // Batch sync product mappings
      const mappingOps = chunk.map(product => ({
        updateOne: {
          filter: { storeId, wooProductId: product.id },
          update: {
            $set: {
              localProductId: `woo_prod_${product.id}`,
              lastSync: new Date(),
              syncStatus: 'synced',
            },
            $setOnInsert: {
              createdAt: new Date(),
            },
          },
          upsert: true,
        },
      }));

      await ProductMapping.bulkWrite(mappingOps);

      // Batch sync inventory
      const inventoryOps = chunk.map(product => ({
        updateOne: {
          filter: { storeId, productId: `woo_prod_${product.id}` },
          update: {
            $set: {
              wooProductId: product.id,
              localStock: product.stock_quantity ?? 0,
              wooStock: product.stock_quantity ?? 0,
              syncedStock: product.stock_quantity ?? 0,
              syncStatus: 'synced',
              lastSync: new Date(),
            },
            $setOnInsert: {
              createdAt: new Date(),
            },
          },
          upsert: true,
        },
      }));

      await InventorySync.bulkWrite(inventoryOps);
    }

    // Update store
    await WooStore.updateOne({ storeId }, { lastSync: new Date() });

    return products.length;
  }

  /**
   * Sync single product
   */
  async syncProduct(storeId: string, wooProduct: WooProduct, storeUrl: string, key: string, secret: string): Promise<void> {
    // Create local product (would call catalog service)
    const localProductId = `woo_prod_${wooProduct.id}`;

    await ProductMapping.findOneAndUpdate(
      { storeId, wooProductId: wooProduct.id },
      { localProductId, lastSync: new Date(), syncStatus: 'synced' },
      { upsert: true }
    );

    // Sync inventory
    await this.syncInventory(storeId, localProductId, wooProduct);
  }

  /**
   * Sync inventory in real-time
   */
  async syncInventory(storeId: string, localProductId: string, wooProduct: WooProduct): Promise<void> {
    await InventorySync.findOneAndUpdate(
      { storeId, productId: localProductId },
      {
        wooProductId: wooProduct.id,
        localStock: wooProduct.stock_quantity,
        wooStock: wooProduct.stock_quantity,
        syncedStock: wooProduct.stock_quantity,
        lastWooSync: new Date(),
      },
      { upsert: true }
    );
  }

  /**
   * Sync orders from WooCommerce
   *
   * PERFORMANCE ISSUE: Sequential N+1 Pattern (Lines 172-180)
   * ------------------------------------------
   * Same pattern as syncAllProducts - sequential order syncing.
   *
   * Problem:
   *   - N orders = N sequential syncOrder() calls
   *   - Each syncOrder() does 1 DB operation (OrderMapping)
   *   - Optional: COD service call per COD order (line 226-228)
   *
   * Batching Opportunities:
   *   1. Batch MongoDB OrderMapping writes using bulkWrite
   *   2. Batch COD service calls (if endpoint supports batch)
   *   3. Parallel processing with controlled concurrency
   *
   * Fix Example:
   *   ```typescript
   *   async syncAllOrders(...) {
   *     const orders = await this.requestAll(...);
   *
   *     // Batch all OrderMapping writes
   *     const mappingOps = orders.map(order => ({
   *       updateOne: {
   *         filter: { storeId, wooOrderId: order.id },
   *         update: { localOrderId: ..., lastSync: new Date(), syncStatus: 'synced' },
   *         upsert: true
   *       }
   *     }));
   *     await OrderMapping.bulkWrite(mappingOps);
   *
   *     // Process COD orders in parallel
   *     const codOrders = orders.filter(o => o.payment_method === 'cod');
   *     await Promise.all(codOrders.map(o => this.handleCODOrder(...)));
   *
   *     return orders.length;
   *   }
   *   ```
   */
  async syncAllOrders(storeId: string, storeUrl: string, key: string, secret: string): Promise<number> {
    const orders = await this.requestAll<WooOrder>(storeUrl, key, secret, '/orders?per_page=100&status=processing,completed');

    // FIX: Use batch operations instead of N+1 queries
    const CHUNK_SIZE = 20;

    for (let i = 0; i < orders.length; i += CHUNK_SIZE) {
      const chunk = orders.slice(i, i + CHUNK_SIZE);

      // Batch sync order mappings
      const orderOps = chunk.map(order => ({
        updateOne: {
          filter: { storeId, wooOrderId: order.id },
          update: {
            $set: {
              localOrderId: `woo_ord_${order.id}`,
              lastSync: new Date(),
              syncStatus: 'synced',
            },
            $setOnInsert: {
              createdAt: new Date(),
            },
          },
          upsert: true,
        },
      }));

      await OrderMapping.bulkWrite(orderOps);

      // Batch process COD orders
      const codOrders = chunk.filter(order => order.payment_method === 'cod');
      if (codOrders.length > 0) {
        // Handle COD orders in batch (would call COD service here)
        await Promise.all(codOrders.map(order => this.handleCODOrder(storeId, order)));
      }
    }

    return orders.length;
  }

  /**
   * Sync single order
   */
  async syncOrder(storeId: string, wooOrder: WooOrder, storeUrl: string, key: string, secret: string): Promise<void> {
    // Transform to local order format
    const localOrder = {
      wooOrderId: wooOrder.id,
      storeId,
      orderNumber: `WOO-${wooOrder.id}`,
      status: this.mapOrderStatus(wooOrder.status),
      customer: {
        email: wooOrder.billing?.email,
        phone: wooOrder.billing?.phone,
        name: `${wooOrder.billing?.first_name} ${wooOrder.billing?.last_name}`,
      },
      shippingAddress: {
        address1: wooOrder.shipping?.address_1,
        address2: wooOrder.shipping?.address_2,
        city: wooOrder.shipping?.city,
        state: wooOrder.shipping?.state,
        pincode: wooOrder.shipping?.postcode,
      },
      items: wooOrder.line_items?.map(item => ({
        sku: item.sku,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      subtotal: wooOrder.total,
      total: wooOrder.total,
      paymentMethod: wooOrder.payment_method,
      isCOD: wooOrder.payment_method === 'cod',
    };

    // Create local order
    const localOrderId = `woo_ord_${wooOrder.id}`;

    await OrderMapping.findOneAndUpdate(
      { storeId, wooOrderId: wooOrder.id },
      { localOrderId, lastSync: new Date(), syncStatus: 'synced' },
      { upsert: true }
    );

    // Handle COD orders
    if (localOrder.isCOD) {
      await this.handleCODOrder(storeId, localOrderId, wooOrder);
    }
  }

  /**
   * Handle COD orders with RTO prediction
   */
  async handleCODOrder(storeId: string, localOrderId: string, wooOrder: WooOrder): Promise<void> {
    const COD_SERVICE_URL = process.env.COD_INTELLIGENCE_URL || 'http://localhost:4044';
    const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;

    // Log order to COD Intelligence
    try {
      await fetch(`${COD_SERVICE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': INTERNAL_TOKEN,
        },
        body: JSON.stringify({
          orderId: localOrderId,
          customerId: wooOrder.customer?.id?.toString(),
          customerPhone: wooOrder.billing?.phone,
          customerAddress: {
            pincode: wooOrder.shipping?.postcode,
            city: wooOrder.shipping?.city,
            state: wooOrder.shipping?.state,
          },
          amount: parseFloat(wooOrder.total),
          merchantId: storeId,
          paymentMethod: 'cod',
        }),
      });
    } catch (error) {
      logger.warn('COD logging failed', { storeId, localOrderId, error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Update WooCommerce stock from local
   */
  async updateStock(storeId: string, localProductId: string, newStock: number): Promise<void> {
    const mapping = await ProductMapping.findOne({ storeId, localProductId });
    if (!mapping) return;

    const store = await WooStore.findOne({ storeId });
    if (!store) return;

    await this.request(
      store.siteUrl,
      store.consumerKey,
      store.consumerSecret,
      'POST',
      `/products/${mapping.wooProductId}`,
      { stock_quantity: newStock }
    );
  }

  /**
   * Map WooCommerce order status to local
   */
  private mapOrderStatus(wooStatus: string): string {
    const statusMap: Record<string, string> = {
      'pending': 'pending',
      'processing': 'confirmed',
      'completed': 'delivered',
      'cancelled': 'cancelled',
      'refunded': 'refunded',
      'failed': 'failed',
    };
    return statusMap[wooStatus] || wooStatus;
  }

  /**
   * Make WooCommerce API request
   */
  private async request<T = unknown>(
    siteUrl: string,
    consumerKey: string,
    consumerSecret: string,
    method: string,
    endpoint: string,
    data?: unknown
  ): Promise<T | null> {
    const url = `${siteUrl}/wp-json/wc/v3${endpoint}`;

    // SSRF Protection: Validate URL before making request
    try {
      validateSSRFUrl(url);
    } catch (error) {
      logger.error('SSRF attack detected', { url, error: (error as Error).message });
      return null;
    }

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('WooCommerce API error', { status: response.status, statusText: response.statusText, endpoint, error: errorText });
        return null;
      }

      return response.json();
    } catch (error) {
      logger.error('WooCommerce request failed', { endpoint, error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }

  /**
   * Get all pages of results
   */
  private async requestAll<T>(
    siteUrl: string,
    consumerKey: string,
    consumerSecret: string,
    endpoint: string
  ): Promise<T[]> {
    const results: T[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await this.request<T[]>(
        siteUrl,
        consumerKey,
        consumerSecret,
        'GET',
        `${endpoint}&page=${page}`
      );

      if (!response || !Array.isArray(response)) break;

      results.push(...response);
      hasMore = response.length === 100;
      page++;
    }

    return results;
  }
}

export const wooService = new WooService();
