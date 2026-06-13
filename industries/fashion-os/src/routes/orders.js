/**
 * Fashion OS - Orders Routes
 */

const express = require('express');
const router = express.Router();

let orders = [
  { id: 'ORD-001', customerId: 'CUST-001', items: [{ productId: 'PRD-001', size: 'M', color: 'Red', qty: 1, price: 4500 }], total: 4500, status: 'delivered', date: '2024-01-10' }
];

router.get('/', (req, res) => {
  const { status } = req.query;
  let filtered = [...orders];
  if (status) filtered = filtered.filter(o => o.status === status);
  res.json({ orders: filtered, count: filtered.length });
});

router.post('/', (req, res) => {
  const { customerId, items } = req.body;
  if (!customerId || !items) return res.status(400).json({ error: 'customerId and items required' });
  const total = items.reduce((sum, i) => sum + (i.price * i.qty), 0);
  const newOrder = { id: `ORD-${Date.now()}`, customerId, items, total, status: 'pending', date: new Date().toISOString() };
  orders.push(newOrder);
  res.status(201).json(newOrder);
});

module.exports = router;