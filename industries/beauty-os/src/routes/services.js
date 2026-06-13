/**
 * Beauty OS - Services Routes
 */

const express = require('express');
const router = express.Router();

let services = [
  { id: 'SVC-001', name: 'Haircut', category: 'hair', duration: 45, price: 1500, status: 'active' },
  { id: 'SVC-002', name: 'Full Spa Package', category: 'spa', duration: 120, price: 5000, status: 'active' },
  { id: 'SVC-003', name: 'Nail Art', category: 'nails', duration: 60, price: 2000, status: 'active' }
];

router.get('/', (req, res) => {
  const { category, status } = req.query;
  let filtered = [...services];
  if (category) filtered = filtered.filter(s => s.category === category);
  if (status) filtered = filtered.filter(s => s.status === status);
  res.json({ services: filtered, count: filtered.length });
});

router.get('/:id', (req, res) => {
  const service = services.find(s => s.id === req.params.id);
  if (!service) return res.status(404).json({ error: 'Service not found' });
  res.json(service);
});

router.post('/', (req, res) => {
  const { name, category, duration, price } = req.body;
  if (!name || !category) return res.status(400).json({ error: 'name and category required' });
  const newService = { id: `SVC-${Date.now()}`, name, category, duration: duration || 60, price: price || 0, status: 'active' };
  services.push(newService);
  res.status(201).json(newService);
});

module.exports = router;