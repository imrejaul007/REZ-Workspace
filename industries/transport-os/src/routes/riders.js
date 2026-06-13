/**
 * Transport OS - Riders Routes
 */

const express = require('express');
const router = express.Router();

let riders = [
  { id: 'RID-001', name: 'John Smith', phone: '9876543212', email: 'john@email.com', rating: 4.7, trips: 25, paymentMethod: 'card', status: 'active' }
];

router.get('/', (req, res) => res.json({ riders, count: riders.length }));

router.get('/:id', (req, res) => {
  const rider = riders.find(r => r.id === req.params.id);
  if (!rider) return res.status(404).json({ error: 'Rider not found' });
  res.json(rider);
});

router.post('/', (req, res) => {
  const { name, phone, email, paymentMethod } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const newRider = { id: `RID-${Date.now()}`, name, phone: phone || null, email: email || null, rating: 0, trips: 0, paymentMethod: paymentMethod || 'card', status: 'active' };
  riders.push(newRider);
  res.status(201).json(newRider);
});

module.exports = router;