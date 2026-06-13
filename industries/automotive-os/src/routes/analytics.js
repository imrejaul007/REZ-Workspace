/**
 * Automotive OS - Analytics Routes
 */

const express = require('express');
const router = express.Router();

router.get('/overview', (req, res) => {
  res.json({ totalSales: 50, revenue: 85000000, avgDealSize: 1700000, period: 'month' });
});

router.get('/inventory', (req, res) => {
  res.json({ totalParts: 150, lowStockItems: 12, reorderNeeded: 8, totalValue: 2500000 });
});

module.exports = router;