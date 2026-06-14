/**
 * REZ Inventory Sync Service
 *
 * Unified real-time inventory synchronization across:
 * - POS Systems
 * - Catalog Service
 * - B2B Purchase Orders
 * - E-Commerce Connectors (Shopify, WooCommerce)
 * - Aggregators (Swiggy, Zomato)
 *
 * Features:
 * - Real-time sync via Redis pub/sub
 * - WebSocket updates
 * - Low stock alerts
 * - Multi-location support
 * - Reservation system
 * - Conflict resolution
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from 'dotenv';
import mongoose from 'mongoose';
import Redis from 'ioredis';
import cron from 'node-cron';
import axios from 'axios';
import { logger } from './services/logger.js';
import { inventoryRouter } from './services/routes.js';

config();

const app = express();
const PORT = process.env.PORT || 4010;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-inventory-sync';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Redis clients
const redis = new Redis(REDIS_URL);
const redisSub = new Redis(REDIS_URL);

// Services configuration
const SERVICES = {
  catalog: process.env.CATALOG_SERVICE_URL || 'https://rez-catalog-service.onrender.com',
  merchant: process.env.MERCHANT_SERVICE_URL || 'https://rez-merchant-service.onrender.com',
  order: process.env.ORDER_SERVICE_URL || 'https://rez-order-service.onrender.com',
  shopify: process.env.SHOPIFY_CONNECTOR_URL || 'https://rez-shopify-connector.onrender.com',
  woocommerce: process.env.WOOCOMMERCE_CONNECTOR_URL || 'https://rez-woocommerce-connector.onrender.com'
};

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-inventory-sync-service',
    version: '1.0.0',
    redis: redis.status === 'ready' ? 'connected' : 'disconnected',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Routes
app.use('/api/v1', inventoryRouter);

// Inventory sync routes
app.post('/api/v1/sync/trigger', async (req: Request, res: Response) => {
  try {
    const { merchantId, storeId } = req.body;
    await triggerSync(merchantId, storeId);
    res.json({ success: true, message: 'Sync triggered' });
  } catch (error) {
    logger.error('Sync trigger failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// WebSocket-style SSE for real-time updates
app.get('/api/v1/inventory/stream/:merchantId', (req: Request, res: Response) => {
  const { merchantId } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const channel = `inventory:${merchantId}`;

  // Send heartbeat
  res.write(`: heartbeat\n\n`);

  // Subscribe to Redis channel
  redisSub.subscribe(channel);
  redisSub.on('message', (ch, message) => {
    if (ch === channel) {
      res.write(`data: ${message}\n\n`);
    }
  });

  req.on('close', () => {
    redisSub.unsubscribe(channel);
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Inventory sync error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================
// CORE SYNC FUNCTIONS
// ============================================

/**
 * Trigger full inventory sync
 */
async function triggerSync(merchantId: string, storeId?: string): Promise<void> {
  logger.info('Triggering inventory sync', { merchantId, storeId });

  try {
    // Fetch all products from catalog
    const catalogProducts = await fetchCatalogProducts(merchantId, storeId);

    // Fetch POS inventory
    const posInventory = await fetchPOSInventory(merchantId, storeId);

    // Compare and resolve
    const syncPlan = createSyncPlan(catalogProducts, posInventory);

    // Apply sync plan
    await applySyncPlan(syncPlan, merchantId);

    // Notify subscribers
    await redis.publish(`inventory:${merchantId}`, JSON.stringify({
      type: 'sync_complete',
      timestamp: new Date().toISOString(),
      itemsUpdated: syncPlan.length
    }));

    logger.info('Inventory sync completed', {
      merchantId,
      itemsUpdated: syncPlan.length
    });
  } catch (error) {
    logger.error('Inventory sync failed', { merchantId, error });
    throw error;
  }
}

/**
 * Fetch products from catalog service
 */
async function fetchCatalogProducts(merchantId: string, storeId?: string): Promise<Map<string, unknown>> {
  try {
    const response = await axios.get(`${SERVICES.catalog}/api/v1/products`, {
      params: { merchantId, storeId },
      timeout: 10000
    });

    const products = new Map<string, unknown>();
    for (const product of response.data.products || []) {
      products.set(product.productId || product._id.toString(), {
        sku: product.sku,
        name: product.name,
        stock: product.inventory?.stock || 0,
        lowStockThreshold: product.inventory?.lowStockThreshold || 10,
        isAvailable: product.inventory?.isAvailable ?? true
      });
    }

    return products;
  } catch (error) {
    logger.error('Failed to fetch catalog products', { merchantId, error });
    throw error;
  }
}

/**
 * Fetch inventory from POS
 */
async function fetchPOSInventory(merchantId: string, storeId?: string): Promise<Map<string, unknown>> {
  try {
    const response = await axios.get(`${SERVICES.merchant}/api/v1/pos/inventory`, {
      params: { merchantId, storeId },
      timeout: 10000
    });

    const inventory = new Map<string, unknown>();
    for (const item of response.data.items || []) {
      inventory.set(item.sku || item.productId, {
        quantity: item.quantity,
        reserved: item.reserved || 0
      });
    }

    return inventory;
  } catch (error) {
    logger.error('Failed to fetch POS inventory', { merchantId, error });
    throw error;
  }
}

/**
 * Create sync plan between catalog and POS
 */
function createSyncPlan(
  catalogProducts: Map<string, unknown>,
  posInventory: Map<string, unknown>
): Array<{ sku: string; action: 'update_catalog' | 'update_pos' | 'conflict'; catalogStock?: number; posStock?: number }> {
  const plan: Array<{ sku: string; action: 'update_catalog' | 'update_pos' | 'conflict'; catalogStock?: number; posStock?: number }> = [];

  // Check catalog products against POS
  for (const [sku, catalogItem] of catalogProducts.entries()) {
    const posItem = posInventory.get(sku);

    if (!posItem) {
      // Product exists in catalog but not in POS - add to POS
      plan.push({
        sku,
        action: 'update_pos',
        catalogStock: catalogItem.stock
      });
    } else if (catalogItem.stock !== posItem.quantity) {
      // Stock mismatch - use latest or flag conflict
      if (catalogItem.stock !== posItem.quantity) {
        // Simple conflict - prefer POS as source of truth for physical inventory
        plan.push({
          sku,
          action: 'update_catalog',
          posStock: posItem.quantity,
          catalogStock: catalogItem.stock
        });
      }
    }
  }

  // Check POS products not in catalog
  for (const [sku, posItem] of posInventory.entries()) {
    if (!catalogProducts.has(sku)) {
      plan.push({
        sku,
        action: 'update_catalog',
        posStock: posItem.quantity
      });
    }
  }

  return plan;
}

/**
 * Apply sync plan
 */
async function applySyncPlan(
  plan: Array<{ sku: string; action: string; catalogStock?: number; posStock?: number }>,
  merchantId: string
): Promise<void> {
  for (const item of plan) {
    try {
      if (item.action === 'update_catalog' && item.posStock !== undefined) {
        await updateCatalogStock(merchantId, item.sku, item.posStock);
      } else if (item.action === 'update_pos' && item.catalogStock !== undefined) {
        await updatePOSStock(merchantId, item.sku, item.catalogStock);
      }
    } catch (error) {
      logger.error('Sync item failed', { sku: item.sku, error });
    }
  }
}

/**
 * Update catalog stock
 */
async function updateCatalogStock(merchantId: string, sku: string, stock: number): Promise<void> {
  await axios.patch(
    `${SERVICES.catalog}/api/v1/products/${sku}/inventory`,
    { stock, merchantId },
    { timeout: 5000 }
  );

  // Cache update
  await redis.set(`stock:${merchantId}:${sku}`, stock.toString(), 'EX', 300);

  logger.info('Catalog stock updated', { merchantId, sku, stock });
}

/**
 * Update POS stock
 */
async function updatePOSStock(merchantId: string, sku: string, stock: number): Promise<void> {
  await axios.patch(
    `${SERVICES.merchant}/api/v1/pos/inventory/${sku}`,
    { quantity: stock, merchantId },
    { timeout: 5000 }
  );

  logger.info('POS stock updated', { merchantId, sku, stock });
}

// ============================================
// LOW STOCK ALERTS
// ============================================

/**
 * Check low stock and send alerts
 */
async function checkLowStock(merchantId: string): Promise<void> {
  try {
    const response = await axios.get(`${SERVICES.catalog}/api/v1/products`, {
      params: { merchantId, lowStock: true },
      timeout: 10000
    });

    const lowStockItems = response.data.products || [];

    if (lowStockItems.length > 0) {
      // Send notification
      await redis.publish(`inventory:${merchantId}:alerts`, JSON.stringify({
        type: 'low_stock_alert',
        items: lowStockItems.map((p) => ({
          sku: p.sku,
          name: p.name,
          stock: p.inventory?.stock || 0,
          threshold: p.inventory?.lowStockThreshold || 10
        })),
        timestamp: new Date().toISOString()
      }));

      logger.warn('Low stock alert', { merchantId, count: lowStockItems.length });
    }
  } catch (error) {
    logger.error('Low stock check failed', { merchantId, error });
  }
}

// Scheduled low stock checks
cron.schedule('*/15 * * * *', async () => {
  try {
    // Get all active merchants from Redis
    const merchants = await redis.smembers('active_merchants');
    for (const merchantId of merchants) {
      await checkLowStock(merchantId);
    }
  } catch (error) {
    logger.error('Scheduled low stock check failed', { error });
  }
});

// ============================================
// CONNECTOR SYNC (Shopify, WooCommerce)
// ============================================

/**
 * Sync inventory to Shopify
 */
app.post('/api/v1/sync/shopify', async (req: Request, res: Response) => {
  try {
    const { merchantId, products } = req.body;

    await axios.post(`${SERVICES.shopify}/api/shopify/inventory/sync`, {
      merchantId,
      products
    });

    res.json({ success: true, message: 'Shopify sync initiated' });
  } catch (error) {
    logger.error('Shopify sync failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Sync inventory to WooCommerce
 */
app.post('/api/v1/sync/woocommerce', async (req: Request, res: Response) => {
  try {
    const { merchantId, products } = req.body;

    await axios.post(`${SERVICES.woocommerce}/api/woocommerce/inventory/sync`, {
      merchantId,
      products
    });

    res.json({ success: true, message: 'WooCommerce sync initiated' });
  } catch (error) {
    logger.error('WooCommerce sync failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// E-COMMERCE WEBHOOK HANDLERS
// ============================================

/**
 * Handle Shopify order webhook - decrement inventory
 */
app.post('/api/v1/webhooks/shopify/orders', async (req: Request, res: Response) => {
  try {
    const { merchantId, orderId, lineItems } = req.body;

    for (const item of lineItems) {
      await decrementStock(merchantId, item.sku, item.quantity);
    }

    // Publish event
    await redis.publish(`inventory:${merchantId}`, JSON.stringify({
      type: 'shopify_order_received',
      orderId,
      timestamp: new Date().toISOString()
    }));

    res.json({ success: true });
  } catch (error) {
    logger.error('Shopify webhook failed', { error: error.message });
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Handle WooCommerce order webhook - decrement inventory
 */
app.post('/api/v1/webhooks/woocommerce/orders', async (req: Request, res: Response) => {
  try {
    const { merchantId, orderId, items } = req.body;

    for (const item of items) {
      await decrementStock(merchantId, item.sku, item.quantity);
    }

    // Publish event
    await redis.publish(`inventory:${merchantId}`, JSON.stringify({
      type: 'woocommerce_order_received',
      orderId,
      timestamp: new Date().toISOString()
    }));

    res.json({ success: true });
  } catch (error) {
    logger.error('WooCommerce webhook failed', { error: error.message });
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Handle Swiggy/Zomato order webhook - decrement inventory
 */
app.post('/api/v1/webhooks/aggregator/orders', async (req: Request, res: Response) => {
  try {
    const { merchantId, orderId, aggregator, items } = req.body;

    for (const item of items) {
      await decrementStock(merchantId, item.sku, item.quantity);
    }

    // Publish event
    await redis.publish(`inventory:${merchantId}`, JSON.stringify({
      type: `${aggregator}_order_received`,
      orderId,
      timestamp: new Date().toISOString()
    }));

    res.json({ success: true });
  } catch (error) {
    logger.error('Aggregator webhook failed', { error: error.message });
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Decrement stock on order
 */
async function decrementStock(merchantId: string, sku: string, quantity: number): Promise<void> {
  try {
    // Get current stock
    const currentStock = await redis.get(`stock:${merchantId}:${sku}`);
    const newStock = Math.max(0, parseInt(currentStock || '0') - quantity);

    // Update Redis cache
    await redis.set(`stock:${merchantId}:${sku}`, newStock.toString(), 'EX', 300);

    // Update catalog
    await axios.patch(
      `${SERVICES.catalog}/api/v1/products/${sku}/inventory`,
      { stock: newStock, merchantId },
      { timeout: 5000 }
    );

    logger.info('Stock decremented', { merchantId, sku, quantity, newStock });
  } catch (error) {
    logger.error('Stock decrement failed', { merchantId, sku, error });
    throw error;
  }
}

/**
 * Handle order completion webhook - commit reserved inventory
 */
app.post('/api/v1/webhooks/order/completed', async (req: Request, res: Response) => {
  try {
    const { merchantId, orderId, items } = req.body;

    for (const item of items) {
      await commitReservedStock(merchantId, item.sku, item.reservedQuantity);
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Order completion webhook failed', { error: error.message });
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Commit reserved stock (order delivered)
 */
async function commitReservedStock(merchantId: string, sku: string, quantity: number): Promise<void> {
  try {
    // Call catalog to commit the reservation
    await axios.post(
      `${SERVICES.catalog}/api/v1/inventory/commit`,
      { merchantId, sku, quantity },
      { timeout: 5000 }
    );

    logger.info('Reserved stock committed', { merchantId, sku, quantity });
  } catch (error) {
    logger.error('Commit failed', { merchantId, sku, error });
    throw error;
  }
}

// ============================================
// STARTUP
// ============================================

async function start() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Connect to Redis
    if (redis.status !== 'ready') {
      await new Promise<void>((resolve) => {
        redis.on('ready', resolve);
      });
    }
    logger.info('Connected to Redis');

    // Start server
    app.listen(PORT, () => {
      logger.info(`REZ Inventory Sync Service started on port ${PORT}`);
      logger.info('E-commerce webhooks enabled: Shopify, WooCommerce, Aggregators');
    });
  } catch (error) {
    logger.error('Failed to start service', { error });
    process.exit(1);
  }
}

start();

export { app, triggerSync, checkLowStock, decrementStock };
