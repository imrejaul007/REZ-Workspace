/**
 * Inventory Sync Routes
 */

import { Router, Request, Response } from 'express';
import axios from 'axios';
import { logger } from './logger.js';

export const inventoryRouter = Router();

const SERVICES = {
  catalog: process.env.CATALOG_SERVICE_URL || 'https://rez-catalog-service.onrender.com',
  merchant: process.env.MERCHANT_SERVICE_URL || 'https://rez-merchant-service.onrender.com',
  shopify: process.env.SHOPIFY_CONNECTOR_URL || 'https://rez-shopify-connector.onrender.com',
  woocommerce: process.env.WOOCOMMERCE_CONNECTOR_URL || 'https://rez-woocommerce-connector.onrender.com'
};

/**
 * GET /api/v1/inventory
 * Get inventory across all sources
 */
inventoryRouter.get('/inventory', async (req: Request, res: Response) => {
  try {
    const { merchantId, storeId } = req.query;

    // Fetch from catalog
    const [catalogRes, posRes] = await Promise.all([
      axios.get(`${SERVICES.catalog}/api/v1/products`, {
        params: { merchantId, storeId },
        timeout: 5000
      }).catch(() => ({ data: { products: [] } })),
      axios.get(`${SERVICES.merchant}/api/v1/pos/inventory`, {
        params: { merchantId, storeId },
        timeout: 5000
      }).catch(() => ({ data: { items: [] } }))
    ]);

    res.json({
      success: true,
      data: {
        catalog: catalogRes.data.products || [],
        pos: posRes.data.items || []
      }
    });
  } catch (error) {
    logger.error('Inventory fetch failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/v1/inventory/low-stock
 * Get low stock items
 */
inventoryRouter.get('/inventory/low-stock', async (req: Request, res: Response) => {
  try {
    const { merchantId, storeId } = req.query;

    const response = await axios.get(`${SERVICES.catalog}/api/v1/products`, {
      params: { merchantId, storeId, lowStock: true },
      timeout: 5000
    });

    const lowStock = (response.data.products || []).filter((p) =>
      (p.inventory?.stock || 0) <= (p.inventory?.lowStockThreshold || 10)
    );

    res.json({
      success: true,
      data: {
        items: lowStock,
        count: lowStock.length
      }
    });
  } catch (error) {
    logger.error('Low stock fetch failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/v1/inventory/:sku
 * Update inventory item
 */
inventoryRouter.patch('/inventory/:sku', async (req: Request, res: Response) => {
  try {
    const { sku } = req.params;
    const { merchantId, stock, isAvailable } = req.body;

    // Update catalog
    const catalogRes = await axios.patch(
      `${SERVICES.catalog}/api/v1/products/${sku}/inventory`,
      { merchantId, stock, isAvailable },
      { timeout: 5000 }
    );

    // Update POS
    await axios.patch(
      `${SERVICES.merchant}/api/v1/pos/inventory/${sku}`,
      { merchantId, quantity: stock },
      { timeout: 5000 }
    );

    res.json({ success: true, data: catalogRes.data });
  } catch (error) {
    logger.error('Inventory update failed', { sku: req.params.sku, error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/v1/reserve
 * Reserve inventory
 */
inventoryRouter.post('/reserve', async (req: Request, res: Response) => {
  try {
    const { merchantId, sku, quantity, orderId } = req.body;

    // Check and reserve
    const response = await axios.post(`${SERVICES.catalog}/api/v1/inventory/reserve`, {
      merchantId,
      sku,
      quantity,
      orderId
    }, { timeout: 5000 });

    res.json({ success: true, data: response.data });
  } catch (error) {
    logger.error('Reservation failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/v1/release
 * Release reserved inventory
 */
inventoryRouter.post('/release', async (req: Request, res: Response) => {
  try {
    const { merchantId, sku, quantity, orderId } = req.body;

    const response = await axios.post(`${SERVICES.catalog}/api/v1/inventory/release`, {
      merchantId,
      sku,
      quantity,
      orderId
    }, { timeout: 5000 });

    res.json({ success: true, data: response.data });
  } catch (error) {
    logger.error('Release failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/v1/commit
 * Commit reserved inventory (on order completion)
 */
inventoryRouter.post('/commit', async (req: Request, res: Response) => {
  try {
    const { merchantId, orderId } = req.body;

    const response = await axios.post(`${SERVICES.catalog}/api/v1/inventory/commit`, {
      merchantId,
      orderId
    }, { timeout: 5000 });

    res.json({ success: true, data: response.data });
  } catch (error) {
    logger.error('Commit failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/v1/sync/status
 * Get sync status
 */
inventoryRouter.get('/sync/status', async (req: Request, res: Response) => {
  try {
    const { merchantId, storeId } = req.query;

    // Return sync status
    res.json({
      success: true,
      data: {
        lastSync: new Date().toISOString(),
        status: 'synced',
        sources: ['catalog', 'pos', 'shopify', 'woocommerce']
      }
    });
  } catch (error) {
    logger.error('Sync status failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});
