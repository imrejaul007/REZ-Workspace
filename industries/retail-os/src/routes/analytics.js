/**
 * Retail OS - Analytics Routes
 */

const express = require('express');
const router = express.Router();

// GET /api/analytics/overview
router.get('/overview', (req, res) => {
  res.json({
    todayRevenue: 125000,
    todayOrders: 45,
    todayCustomers: 38,
    avgOrderValue: 2778,
    conversionRate: 3.2,
    period: 'today'
  });
});

// GET /api/analytics/products
router.get('/products', (req, res) => {
  res.json({
    topProducts: [
      { name: 'Smartphone X', sales: 12, revenue: 300000 },
      { name: 'Laptop Pro', sales: 5, revenue: 325000 },
      { name: 'Running Shoes', sales: 8, revenue: 28000 }
    ],
    lowStock: [
      { name: 'Coffee Maker', stock: 15, minStock: 20 }
    ]
  });
});

// GET /api/analytics/customers
router.get('/customers', (req, res) => {
  res.json({
    totalCustomers: 1250,
    newCustomers: 45,
    activeCustomers: 890,
    avgLifetimeValue: 15000
  });
});

module.exports = router;