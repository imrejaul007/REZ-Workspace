/**
 * Real Estate OS - Buyers Routes
 */

const express = require('express');
const router = express.Router();

let buyers = [
  { id: 'BUY-001', name: 'John Smith', email: 'john@email.com', phone: '9876543210', budget: 5000000, preferences: { type: 'apartment', bedrooms: 3 }, status: 'active' },
  { id: 'BUY-002', name: 'Jane Doe', email: 'jane@email.com', phone: '9876543211', budget: 10000000, preferences: { type: 'villa', bedrooms: 4 }, status: 'active' }
];

router.get('/', (req, res) => {
  const { status } = req.query;
  let filtered = [...buyers];
  if (status) filtered = filtered.filter(b => b.status === status);
  res.json({ buyers: filtered, count: filtered.length });
});

router.get('/:id', (req, res) => {
  const buyer = buyers.find(b => b.id === req.params.id);
  if (!buyer) return res.status(404).json({ error: 'Buyer not found' });
  res.json(buyer);
});

router.post('/', (req, res) => {
  const { name, email, phone, budget, preferences } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const newBuyer = { id: `BUY-${Date.now()}`, name, email: email || null, phone: phone || null, budget: budget || 0, preferences: preferences || {}, status: 'active' };
  buyers.push(newBuyer);
  res.status(201).json(newBuyer);
});

module.exports = router;