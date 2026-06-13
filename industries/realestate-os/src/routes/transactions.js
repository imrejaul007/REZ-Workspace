/**
 * Real Estate OS - Transactions Routes
 */

const express = require('express');
const router = express.Router();

let transactions = [
  { id: 'TXN-001', propertyId: 'PROP-001', buyerId: 'BUY-001', sellerId: 'SEL-001', amount: 4800000, status: 'completed', date: '2024-01-15', commission: 144000 }
];

router.get('/', (req, res) => {
  const { status } = req.query;
  let filtered = [...transactions];
  if (status) filtered = filtered.filter(t => t.status === status);
  res.json({ transactions: filtered, count: filtered.length });
});

router.post('/', (req, res) => {
  const { propertyId, buyerId, sellerId, amount } = req.body;
  if (!propertyId || !buyerId || !sellerId || !amount) return res.status(400).json({ error: 'propertyId, buyerId, sellerId, amount required' });
  const newTransaction = { id: `TXN-${Date.now()}`, propertyId, buyerId, sellerId, amount, status: 'pending', date: new Date().toISOString(), commission: amount * 0.03 };
  transactions.push(newTransaction);
  res.status(201).json(newTransaction);
});

module.exports = router;