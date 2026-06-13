/**
 * Retail OS - Orders Routes
 */

const express = require('express');
const router = express.Router();

let orders = [
  { id: 'ORD-001', customerId: 'CUST-001', items: [{ productId: 'PROD-001', qty: 1, price: 25000 }], total: 25000, status: 'delivered', createdAt: '2024-01-15T10:00:00Z' }
];

// GET /api/orders
router.get('/', (req, res) => {
  const { customerId, status } = req.query;
  let filtered = [...orders];
  if (customerId) filtered = filtered.filter(o => o.customerId === customerId);
  if (status) filtered = filtered.filter(o => o.status === status);
  res.json({ orders: filtered, count: filtered.length });
});

// GET /api/orders/:id
router.get('/:id', (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

// POST /api/orders
router.post('/', (req, res) => {
  const { customerId, items } = req.body;
  if (!customerId || !items) return res.status(400).json({ error: 'customerId and items required' });

  const total = items.reduce((sum, i) => sum + (i.price * i.qty), 0);
  const newOrder = { id: `ORD-${Date.now()}`, customerId, items, total, status: 'pending', createdAt: new Date().toISOString() };
  orders.push(newOrder);
  res.status(201).json(newOrder);
});

// PUT /api/orders/:id
router.put('/:id', (req, res) => {
  const index = orders.findIndex(o => o.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Order not found' });
  orders[index] = { ...orders[index], ...req.body };
  res.json(orders[index]);
});

// PATCH /api/orders/:id/status
router.patch('/:id/status', (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  order.status = req.body.status;
  res.json(order);
});

module.exports = router;