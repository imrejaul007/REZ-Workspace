/**
 * SUTAR OS - Payment Routes
 */

const express = require('express');
const router = express.Router();

let payments = [
  { id: 'PAY-001', amount: 50000, method: 'upi', status: 'completed', reference: 'TXN-123', date: '2024-01-15' }
];

router.get('/', (req, res) => {
  const { status } = req.query;
  let filtered = [...payments];
  if (status) filtered = filtered.filter(p => p.status === status);
  res.json({ payments: filtered, count: filtered.length });
});

router.post('/', (req, res) => {
  const { amount, method, reference } = req.body;
  if (!amount || !method) return res.status(400).json({ error: 'amount and method required' });
  const newPayment = { id: `PAY-${Date.now()}`, amount, method, status: 'pending', reference: reference || null, date: new Date().toISOString() };
  payments.push(newPayment);
  res.status(201).json(newPayment);
});

module.exports = router;