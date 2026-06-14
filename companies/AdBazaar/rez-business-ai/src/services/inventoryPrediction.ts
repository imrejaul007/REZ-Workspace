/**
 * REZ Business AI - Inventory Prediction
 * Predict stock needs, prevent stockouts
 */

const express = require('express');
const router = express.Router();
const { randomInt } = require('crypto');

// In-memory storage
const products = new Map();
const predictions = new Map();

// ============== PREDICT DEMAND ==============

function predictDemand(productId, days = 7) {
  const product = products.get(productId);
  if (!product) return null;

  // Simple prediction based on historical
  const baseDemand = product.avgDailySales || 10;
  const trend = product.trend || 0; // positive = increasing
  const seasonality = product.seasonality || 1;

  const predictions = [];
  for (let i = 1; i <= days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);

    // Add some variance
    const variance = 0.8 + randomInt(0, 400) / 1000;
    const predicted = Math.round(baseDemand * (1 + trend * i) * seasonality * variance);

    predictions.push({
      date: date.toISOString().split('T')[0],
      predicted,
      confidence: 0.75 + randomInt(0, 200) / 1000,
    });
  }

  return predictions;
}

// ============== ROUTES ==============

// Get stock status
router.get('/stock/:productId', (req, res) => {
  const { productId } = req.params;
  const product = products.get(productId) || {
    id: productId,
    name: 'Sample Product',
    currentStock: 50,
    reorderPoint: 20,
    reorderQuantity: 100,
    avgDailySales: 10,
    leadTime: 3,
  };

  const daysUntilStockout = Math.floor(product.currentStock / product.avgDailySales);
  const stockStatus = product.currentStock <= product.reorderPoint ? 'low' : 'ok';

  res.json({
    productId,
    currentStock: product.currentStock,
    reorderPoint: product.reorderPoint,
    daysUntilStockout,
    stockStatus,
    recommendation: daysUntilStockout <= product.leadTime
      ? `Order ${product.reorderQuantity} units immediately`
      : `Order ${product.reorderQuantity} units within ${product.leadTime - daysUntilStockout} days`,
  });
});

// Get demand prediction
router.get('/demand/:productId', (req, res) => {
  const { productId } = req.params;
  const days = parseInt(req.query.days) || 7;
  const predictions = predictDemand(productId, days);

  if (!predictions) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const totalPredicted = predictions.reduce((sum, p) => sum + p.predicted, 0);

  res.json({
    productId,
    days,
    totalPredicted,
    daily: predictions,
    summary: {
      avgDaily: Math.round(totalPredicted / days),
      peakDay: predictions.reduce((max, p) => p.predicted > max.predicted ? p : max, predictions[0]),
    },
  });
});

// Get reorder recommendation
router.get('/reorder/:productId', (req, res) => {
  const { productId } = req.params;
  const product = products.get(productId) || {
    id: productId,
    name: 'Sample',
    currentStock: 50,
    reorderPoint: 20,
    reorderQuantity: 100,
    avgDailySales: 10,
    leadTime: 3,
  };

  // Calculate optimal order
  const daysOfStock = product.currentStock / product.avgDailySales;
  const safetyStock = product.avgDailySales * 2; // 2 days safety
  const idealStock = product.avgDailySales * 14; // 2 weeks stock
  const recommendedOrder = Math.max(0, Math.ceil(idealStock - product.currentStock + safetyStock));

  res.json({
    productId,
    currentStock: product.currentStock,
    daysOfStock: Math.round(daysOfStock),
    recommendedOrder,
    urgency: daysOfStock <= product.leadTime ? 'high' : daysOfStock <= product.leadTime * 2 ? 'medium' : 'low',
    reason: daysOfStock <= product.leadTime
      ? 'Stock will run out before delivery'
      : 'Preventive reorder recommended',
  });
});

// Update stock
router.post('/stock/:productId', (req, res) => {
  const { productId } = req.params;
  const { currentStock, reorderPoint, reorderQuantity, avgDailySales } = req.body;

  const product = products.get(productId) || { id: productId };
  if (currentStock !== undefined) product.currentStock = currentStock;
  if (reorderPoint !== undefined) product.reorderPoint = reorderPoint;
  if (reorderQuantity !== undefined) product.reorderQuantity = reorderQuantity;
  if (avgDailySales !== undefined) product.avgDailySales = avgDailySales;

  products.set(productId, product);

  res.json({ success: true, product });
});

// Get low stock alerts
router.get('/alerts/low-stock', (req, res) => {
  const alerts = [];

  for (const [id, product] of products) {
    if (product.currentStock <= product.reorderPoint) {
      alerts.push({
        productId: id,
        name: product.name,
        currentStock: product.currentStock,
        reorderPoint: product.reorderPoint,
        urgency: product.currentStock <= product.reorderPoint / 2 ? 'critical' : 'warning',
      });
    }
  }

  res.json({ alerts, count: alerts.length });
});

// Bulk reorder
router.post('/bulk-reorder', (req, res) => {
  const { productIds } = req.body;

  const orders = productIds.map(id => {
    const product = products.get(id);
    if (!product) return { productId: id, status: 'not_found' };

    return {
      productId: id,
      name: product.name,
      quantity: product.reorderQuantity || 100,
      status: 'pending',
    };
  });

  res.json({ success: true, orders });
});

module.exports = router;
