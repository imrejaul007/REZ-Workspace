/**
 * SUTAR OS - Reporting Routes
 */

const express = require('express');
const router = express.Router();

router.get('/financial-summary', (req, res) => {
  res.json({ revenue: 5000000, expenses: 3500000, profit: 1500000, period: 'Q1-2024' });
});

router.get('/cash-flow', (req, res) => {
  res.json({ inflow: 5000000, outflow: 3500000, net: 1500000, period: 'Q1-2024' });
});

router.get('/balance-sheet', (req, res) => {
  res.json({ assets: 10000000, liabilities: 4000000, equity: 6000000 });
});

module.exports = router;