/**
 * Hospitality OS - Services Routes
 */

const express = require('express');
const router = express.Router();

let services = [
  { id: 'SVC-001', name: 'Room Service', type: 'food', price: 500, status: 'active' },
  { id: 'SVC-002', name: 'Spa Treatment', type: 'wellness', price: 2500, status: 'active' },
  { id: 'SVC-003', name: 'Airport Transfer', type: 'transport', price: 1500, status: 'active' },
  { id: 'SVC-004', name: 'Laundry', type: 'housekeeping', price: 300, status: 'active' }
];

// GET /api/services
router.get('/', (req, res) => {
  const { type } = req.query;
  let filtered = [...services];
  if (type) filtered = filtered.filter(s => s.type === type);
  res.json({ services: filtered, count: filtered.length });
});

// GET /api/services/:id
router.get('/:id', (req, res) => {
  const service = services.find(s => s.id === req.params.id);
  if (!service) return res.status(404).json({ error: 'Service not found' });
  res.json(service);
});

// POST /api/services
router.post('/', (req, res) => {
  const { name, type, price } = req.body;
  if (!name || !type) return res.status(400).json({ error: 'name and type required' });

  const newService = { id: `SVC-${Date.now()}`, name, type, price: price || 0, status: 'active' };
  services.push(newService);
  res.status(201).json(newService);
});

module.exports = router;