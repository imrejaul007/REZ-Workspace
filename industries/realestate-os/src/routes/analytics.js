/**
 * Real Estate OS - Analytics Routes
 */

const express = require('express');
const router = express.Router();

router.get('/overview', (req, res) => {
  res.json({ totalProperties: 50, totalSales: 25, avgPrice: 6500000, totalCommission: 4875000, period: 'month' });
});

router.get('/market', (req, res) => {
  res.json({ avgPrice: 6500000, priceTrend: '+5%', totalListings: 35, daysOnMarket: 45 });
});

module.exports = router;