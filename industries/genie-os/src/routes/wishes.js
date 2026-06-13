/**
 * Genie OS - Wishes Routes
 */

const express = require('express');
const router = express.Router();

let wishes = [
  { id: 'WISH-001', userId: 'user-001', text: 'Show me my sales report', status: 'fulfilled', fulfillment: 'WISH-001', createdAt: '2024-01-15' }
];

router.get('/', (req, res) => {
  const { userId, status } = req.query;
  let filtered = [...wishes];
  if (userId) filtered = filtered.filter(w => w.userId === userId);
  if (status) filtered = filtered.filter(w => w.status === status);
  res.json({ wishes: filtered, count: filtered.length });
});

router.post('/', (req, res) => {
  const { userId, text } = req.body;
  if (!userId || !text) return res.status(400).json({ error: 'userId and text required' });
  const newWish = { id: `WISH-${Date.now()}`, userId, text, status: 'pending', fulfillment: null, createdAt: new Date().toISOString() };
  wishes.push(newWish);
  res.status(201).json(newWish);
});

router.get('/:id', (req, res) => {
  const wish = wishes.find(w => w.id === req.params.id);
  if (!wish) return res.status(404).json({ error: 'Wish not found' });
  res.json(wish);
});

module.exports = router;