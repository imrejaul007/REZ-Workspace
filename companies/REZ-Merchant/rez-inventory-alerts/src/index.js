/**
 * REZ Inventory Alerts Service
 * Stock level monitoring and alert management
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// In-memory data stores
const alerts = new Map();
const thresholds = new Map();
const products = new Map();
const merchants = new Map();
const notificationHistory = new Map();

// Mock data seeding
const seedData = () => {
  // Sample merchants
  const sampleMerchants = [
    { id: 'MERCH001', name: 'ElectroWorld', location: 'Mumbai' },
    { id: 'MERCH002', name: 'HomeAppliances Plus', location: 'Delhi' },
    { id: 'MERCH003', name: 'TechStore', location: 'Bangalore' },
  ];

  sampleMerchants.forEach(m => merchants.set(m.id, m));

  // Sample products with thresholds
  const sampleProducts = [
    { id: 'PRD001', name: 'LED TV 40 inch', merchantId: 'MERCH001', currentStock: 5 },
    { id: 'PRD002', name: 'Refrigerator 200L', merchantId: 'MERCH001', currentStock: 3 },
    { id: 'PRD003', name: 'Washing Machine', merchantId: 'MERCH002', currentStock: 15 },
    { id: 'PRD004', name: 'Air Conditioner', merchantId: 'MERCH002', currentStock: 2 },
    { id: 'PRD005', name: 'Microwave Oven', merchantId: 'MERCH003', currentStock: 20 },
  ];

  sampleProducts.forEach(p => {
    products.set(p.id, p);
    // Set default thresholds
    const thresholdKey = `${p.merchantId}:${p.id}`;
    thresholds.set(thresholdKey, {
      merchantId: p.merchantId,
      productId: p.id,
      productName: p.name,
      lowStock: 10,
      criticalStock: 5,
      reorderPoint: 15,
      updatedAt: new Date()
    });
  });
};

seedData();

// ============================================================================
// Health Endpoint
// ============================================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-inventory-alerts',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    activeAlerts: Array.from(alerts.values()).filter(a => a.status === 'active').length,
    productsMonitored: products.size
  });
});

// ============================================================================
// Threshold Management
// ============================================================================

/**
 * Set alert threshold
 * POST /api/thresholds
 */
app.post('/api/thresholds', (req, res) => {
  try {
    const { merchantId, productId, lowStock, criticalStock, reorderPoint, productName } = req.body;

    if (!merchantId || !productId) {
      return res.status(400).json({ error: 'Missing required fields: merchantId, productId' });
    }

    const key = `${merchantId}:${productId}`;

    const threshold = {
      merchantId,
      productId,
      productName: productName || null,
      lowStock: lowStock || 10,
      criticalStock: criticalStock || 5,
      reorderPoint: reorderPoint || lowStock * 2 || 20,
      updatedAt: new Date()
    };

    thresholds.set(key, threshold);

    res.json({ success: true, threshold });
  } catch (error) {
    res.status(500).json({ error: 'Failed to set threshold' });
  }
});

/**
 * Get thresholds for merchant
 * GET /api/thresholds/:merchantId
 */
app.get('/api/thresholds/:merchantId', (req, res) => {
  try {
    const { merchantId } = req.params;
    const list = [];

    thresholds.forEach((t, key) => {
      if (key.startsWith(`${merchantId}:`)) {
        list.push(t);
      }
    });

    res.json({ thresholds: list, total: list.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch thresholds' });
  }
});

/**
 * Get specific threshold
 * GET /api/thresholds/:merchantId/:productId
 */
app.get('/api/thresholds/:merchantId/:productId', (req, res) => {
  try {
    const { merchantId, productId } = req.params;
    const key = `${merchantId}:${productId}`;
    const threshold = thresholds.get(key);

    if (!threshold) {
      return res.status(404).json({ error: 'Threshold not found' });
    }

    res.json(threshold);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch threshold' });
  }
});

/**
 * Update threshold
 * PUT /api/thresholds/:merchantId/:productId
 */
app.put('/api/thresholds/:merchantId/:productId', (req, res) => {
  try {
    const { merchantId, productId } = req.params;
    const key = `${merchantId}:${productId}`;
    const threshold = thresholds.get(key);

    if (!threshold) {
      return res.status(404).json({ error: 'Threshold not found' });
    }

    const { lowStock, criticalStock, reorderPoint } = req.body;

    if (lowStock !== undefined) threshold.lowStock = lowStock;
    if (criticalStock !== undefined) threshold.criticalStock = criticalStock;
    if (reorderPoint !== undefined) threshold.reorderPoint = reorderPoint;
    threshold.updatedAt = new Date();

    thresholds.set(key, threshold);

    res.json({ success: true, threshold });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update threshold' });
  }
});

/**
 * Delete threshold
 * DELETE /api/thresholds/:merchantId/:productId
 */
app.delete('/api/thresholds/:merchantId/:productId', (req, res) => {
  try {
    const { merchantId, productId } = req.params;
    const key = `${merchantId}:${productId}`;

    if (!thresholds.has(key)) {
      return res.status(404).json({ error: 'Threshold not found' });
    }

    thresholds.delete(key);

    res.json({ success: true, message: 'Threshold deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete threshold' });
  }
});

// ============================================================================
// Stock Checking & Alerts
// ============================================================================

/**
 * Check stock levels and generate alerts
 * POST /api/check-stock
 */
app.post('/api/check-stock', (req, res) => {
  try {
    const { merchantId, productId, currentStock, productName } = req.body;

    if (!merchantId || !productId || currentStock === undefined) {
      return res.status(400).json({ error: 'Missing required fields: merchantId, productId, currentStock' });
    }

    const key = `${merchantId}:${productId}`;
    let threshold = thresholds.get(key);

    // Create default threshold if not exists
    if (!threshold) {
      threshold = {
        merchantId,
        productId,
        productName: productName || 'Unknown Product',
        lowStock: 10,
        criticalStock: 5,
        reorderPoint: 20,
        updatedAt: new Date()
      };
      thresholds.set(key, threshold);
    }

    // Determine alert level
    let alertLevel = 'none';
    let message = 'Stock levels normal';

    if (currentStock <= threshold.criticalStock) {
      alertLevel = 'critical';
      message = `Critical stock! Only ${currentStock} units remaining. Immediate reorder required.`;
    } else if (currentStock <= threshold.lowStock) {
      alertLevel = 'low';
      message = `Low stock alert: ${currentStock} units remaining. Consider reordering.`;
    } else if (currentStock <= threshold.reorderPoint) {
      alertLevel = 'reorder';
      message = `Reorder point reached: ${currentStock} units remaining.`;
    }

    // Generate alert if needed
    if (alertLevel !== 'none') {
      const alertId = `ALT-${uuidv4().slice(0, 8).toUpperCase()}`;

      const alert = {
        id: alertId,
        merchantId,
        productId,
        productName: threshold.productName || productName,
        alertLevel,
        message,
        currentStock,
        threshold: {
          lowStock: threshold.lowStock,
          criticalStock: threshold.criticalStock,
          reorderPoint: threshold.reorderPoint
        },
        recommendedOrderQty: threshold.reorderPoint * 2 - currentStock,
        status: 'active',
        createdAt: new Date(),
        resolvedAt: null
      };

      alerts.set(alertId, alert);
    }

    res.json({
      alert: alertLevel,
      message,
      productId,
      merchantId,
      currentStock,
      recommendedOrder: alertLevel !== 'none' ? threshold.reorderPoint * 2 - currentStock : 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check stock' });
  }
});

/**
 * Bulk check stock levels
 * POST /api/check-stock/bulk
 */
app.post('/api/check-stock/bulk', (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'items array is required' });
    }

    const results = items.map(item => {
      const key = `${item.merchantId}:${item.productId}`;
      const threshold = thresholds.get(key);

      if (!threshold) {
        return { ...item, alert: 'unmonitored' };
      }

      let alertLevel = 'none';
      if (item.currentStock <= threshold.criticalStock) {
        alertLevel = 'critical';
      } else if (item.currentStock <= threshold.lowStock) {
        alertLevel = 'low';
      } else if (item.currentStock <= threshold.reorderPoint) {
        alertLevel = 'reorder';
      }

      return {
        ...item,
        alert: alertLevel,
        lowStock: threshold.lowStock,
        criticalStock: threshold.criticalStock
      };
    });

    const alerts = results.filter(r => r.alert !== 'none' && r.alert !== 'unmonitored');

    res.json({
      results,
      totalChecked: results.length,
      alertsFound: alerts.length,
      criticalCount: alerts.filter(a => a.alert === 'critical').length,
      lowCount: alerts.filter(a => a.alert === 'low').length,
      reorderCount: alerts.filter(a => a.alert === 'reorder').length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check stock' });
  }
});

// ============================================================================
// Alert Management
// ============================================================================

/**
 * Get active alerts
 * GET /api/alerts/:merchantId
 */
app.get('/api/alerts/:merchantId', (req, res) => {
  try {
    const { merchantId } = req.params;
    const { status, alertLevel } = req.query;
    const list = [];

    alerts.forEach((a) => {
      if (a.merchantId !== merchantId) return;
      if (status && a.status !== status) return;
      if (alertLevel && a.alertLevel !== alertLevel) return;
      list.push(a);
    });

    res.json({ alerts: list, total: list.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

/**
 * Get all alerts
 * GET /api/alerts
 */
app.get('/api/alerts', (req, res) => {
  try {
    const { status, alertLevel, merchantId } = req.query;
    let list = Array.from(alerts.values());

    if (status) {
      list = list.filter(a => a.status === status);
    }
    if (alertLevel) {
      list = list.filter(a => a.alertLevel === alertLevel);
    }
    if (merchantId) {
      list = list.filter(a => a.merchantId === merchantId);
    }

    res.json({ alerts: list, total: list.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

/**
 * Get alert by ID
 * GET /api/alerts/detail/:alertId
 */
app.get('/api/alerts/detail/:alertId', (req, res) => {
  try {
    const { alertId } = req.params;
    const alert = alerts.get(alertId);

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json(alert);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch alert' });
  }
});

/**
 * Resolve alert
 * PUT /api/alerts/:alertId/resolve
 */
app.put('/api/alerts/:alertId/resolve', (req, res) => {
  try {
    const { alertId } = req.params;
    const { resolution, restockedQuantity } = req.body;
    const alert = alerts.get(alertId);

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    alert.status = 'resolved';
    alert.resolvedAt = new Date();
    alert.resolution = resolution || 'Alert resolved';
    if (restockedQuantity !== undefined) {
      alert.restockedQuantity = restockedQuantity;
    }

    alerts.set(alertId, alert);

    res.json({ success: true, alert });
  } catch (error) {
    res.status(500).json({ error: 'Failed to resolve alert' });
  }
});

/**
 * Snooze alert
 * PUT /api/alerts/:alertId/snooze
 */
app.put('/api/alerts/:alertId/snooze', (req, res) => {
  try {
    const { alertId } = req.params;
    const { snoozeUntil } = req.body;
    const alert = alerts.get(alertId);

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    alert.status = 'snoozed';
    alert.snoozedUntil = snoozeUntil ? new Date(snoozeUntil) : new Date(Date.now() + 24 * 60 * 60 * 1000);
    alert.updatedAt = new Date();

    alerts.set(alertId, alert);

    res.json({ success: true, alert });
  } catch (error) {
    res.status(500).json({ error: 'Failed to snooze alert' });
  }
});

/**
 * Delete/Archive alert
 * DELETE /api/alerts/:alertId
 */
app.delete('/api/alerts/:alertId', (req, res) => {
  try {
    const { alertId } = req.params;

    if (!alerts.has(alertId)) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    alerts.delete(alertId);

    res.json({ success: true, message: 'Alert deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete alert' });
  }
});

/**
 * Bulk resolve alerts
 * POST /api/alerts/bulk/resolve
 */
app.post('/api/alerts/bulk/resolve', (req, res) => {
  try {
    const { alertIds, resolution } = req.body;

    if (!alertIds || !Array.isArray(alertIds)) {
      return res.status(400).json({ error: 'alertIds array is required' });
    }

    const results = { resolved: 0, failed: 0, failedIds: [] };

    alertIds.forEach(alertId => {
      const alert = alerts.get(alertId);
      if (alert) {
        alert.status = 'resolved';
        alert.resolvedAt = new Date();
        alert.resolution = resolution || 'Bulk resolved';
        alerts.set(alertId, alert);
        results.resolved++;
      } else {
        results.failed++;
        results.failedIds.push(alertId);
      }
    });

    res.json({ success: true, ...results });
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk resolve alerts' });
  }
});

// ============================================================================
// Product Management
// ============================================================================

/**
 * Register product for monitoring
 * POST /api/products
 */
app.post('/api/products', (req, res) => {
  try {
    const { id, name, merchantId, currentStock, sku } = req.body;

    if (!id || !name || !merchantId) {
      return res.status(400).json({ error: 'Missing required fields: id, name, merchantId' });
    }

    const product = {
      id,
      name,
      merchantId,
      currentStock: currentStock || 0,
      sku: sku || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    products.set(id, product);

    res.status(201).json({ success: true, product });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register product' });
  }
});

/**
 * Get products for merchant
 * GET /api/products/:merchantId
 */
app.get('/api/products/:merchantId', (req, res) => {
  try {
    const { merchantId } = req.params;
    const productList = Array.from(products.values()).filter(p => p.merchantId === merchantId);

    res.json({ products: productList, total: productList.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

/**
 * Update product stock
 * PUT /api/products/:productId/stock
 */
app.put('/api/products/:productId/stock', (req, res) => {
  try {
    const { productId } = req.params;
    const { currentStock, adjustment, reason } = req.body;
    const product = products.get(productId);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (currentStock !== undefined) {
      product.currentStock = currentStock;
    } else if (adjustment !== undefined) {
      product.currentStock += adjustment;
    }

    product.lastAdjustment = {
      previousStock: product.currentStock - (adjustment || 0) + (currentStock || 0),
      newStock: product.currentStock,
      reason: reason || 'Manual adjustment',
      adjustedAt: new Date()
    };
    product.updatedAt = new Date();

    products.set(productId, product);

    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

// ============================================================================
// Reports & Analytics
// ============================================================================

/**
 * Get alert statistics
 * GET /api/reports/stats
 */
app.get('/api/reports/stats', (req, res) => {
  try {
    const { merchantId } = req.query;
    let alertList = Array.from(alerts.values());

    if (merchantId) {
      alertList = alertList.filter(a => a.merchantId === merchantId);
    }

    const active = alertList.filter(a => a.status === 'active').length;
    const resolved = alertList.filter(a => a.status === 'resolved').length;
    const snoozed = alertList.filter(a => a.status === 'snoozed').length;

    const critical = alertList.filter(a => a.alertLevel === 'critical').length;
    const low = alertList.filter(a => a.alertLevel === 'low').length;
    const reorder = alertList.filter(a => a.alertLevel === 'reorder').length;

    res.json({
      alerts: {
        total: alertList.length,
        active,
        resolved,
        snoozed
      },
      byLevel: {
        critical,
        low,
        reorder
      },
      productsMonitored: products.size,
      merchantsMonitored: merchants.size,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

/**
 * Get low stock report
 * GET /api/reports/low-stock
 */
app.get('/api/reports/low-stock', (req, res) => {
  try {
    const { merchantId, limit } = req.query;
    const lowStockProducts = [];

    products.forEach(product => {
      if (merchantId && product.merchantId !== merchantId) return;

      const key = `${product.merchantId}:${product.id}`;
      const threshold = thresholds.get(key);

      if (!threshold) return;

      if (product.currentStock <= threshold.lowStock) {
        lowStockProducts.push({
          ...product,
          threshold: threshold.lowStock,
          status: product.currentStock <= threshold.criticalStock ? 'critical' : 'low'
        });
      }
    });

    lowStockProducts.sort((a, b) => a.currentStock - b.currentStock);

    res.json({
      products: limit ? lowStockProducts.slice(0, limit) : lowStockProducts,
      total: lowStockProducts.length,
      criticalCount: lowStockProducts.filter(p => p.status === 'critical').length,
      lowCount: lowStockProducts.filter(p => p.status === 'low').length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// ============================================================================
// Start Server
// ============================================================================

const PORT = process.env.PORT || 4625;

const server = app.listen(PORT, () => {
  console.log(`REZ Inventory Alerts Service running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

export default app;
export { server };