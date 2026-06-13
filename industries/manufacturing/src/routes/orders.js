const express = require('express');
const router = express.Router();

let orders = [
  { id: '1', productId: '1', quantity: 100, status: 'in_production', deadline: '2024-07-15' },
  { id: '2', productId: '2', quantity: 500, status: 'completed', deadline: '2024-06-30' },
  { id: '3', productId: '3', quantity: 50, status: 'pending', deadline: '2024-08-01' },
  { id: '4', productId: '4', quantity: 25, status: 'in_production', deadline: '2024-07-20' }
];

// GET all orders
router.get('/', (req, res) => {
  res.json(orders);
});

// GET single order
router.get('/:id', (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

// POST new order
router.post('/', (req, res) => {
  const newOrder = {
    id: String(orders.length + 1),
    productId: req.body.productId,
    quantity: req.body.quantity,
    status: req.body.status || 'pending',
    deadline: req.body.deadline
  };
  orders.push(newOrder);
  res.status(201).json(newOrder);
});

// PUT update order
router.put('/:id', (req, res) => {
  const index = orders.findIndex(o => o.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Order not found' });
  orders[index] = { ...orders[index], ...req.body };
  res.json(orders[index]);
});

// DELETE order
router.delete('/:id', (req, res) => {
  const index = orders.findIndex(o => o.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Order not found' });
  orders.splice(index, 1);
  res.json({ message: 'Order deleted successfully' });
});

module.exports = router;