/**
 * SUTAR OS - Tax Routes
 */

const express = require('express');
const router = express.Router();

router.get('/calculate', (req, res) => {
  const { revenue, expenses } = req.query;
  const taxableIncome = (parseInt(revenue) || 0) - (parseInt(expenses) || 0);
  const tax = taxableIncome * 0.25;
  res.json({ revenue: parseInt(revenue) || 0, expenses: parseInt(expenses) || 0, taxableIncome, tax, rate: '25%' });
});

router.get('/filings', (req, res) => {
  res.json({ filings: [{ id: 'TAX-001', type: 'GST', period: 'Jan-2024', status: 'filed', amount: 12500 }] });
});

module.exports = router;