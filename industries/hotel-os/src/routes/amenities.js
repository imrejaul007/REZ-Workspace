/**
 * Hotel OS - Amenities Routes
 */

const express = require('express');
const router = express.Router();

let amenities = [
  { id: 'AMEN-001', name: 'Swimming Pool', category: 'recreation', price: 0, status: 'available' },
  { id: 'AMEN-002', name: 'Spa & Wellness', category: 'wellness', price: 2500, status: 'available' },
  { id: 'AMEN-003', name: 'Gym', category: 'fitness', price: 0, status: 'available' },
  { id: 'AMEN-004', name: 'Restaurant', category: 'dining', price: 0, status: 'available' },
  { id: 'AMEN-005', name: 'Room Service', category: 'dining', price: 500, status: 'available' },
  { id: 'AMEN-006', name: 'Airport Transfer', category: 'transport', price: 1500, status: 'available' },
  { id: 'AMEN-007', name: 'Laundry', category: 'housekeeping', price: 300, status: 'available' }
];

router.get('/', (req, res) => {
  const { category, status } = req.query;
  let filtered = [...amenities];
  if (category) filtered = filtered.filter(a => a.category === category);
  if (status) filtered = filtered.filter(a => a.status === status);
  res.json({ amenities: filtered, count: filtered.length });
});

router.get('/:id', (req, res) => {
  const amenity = amenities.find(a => a.id === req.params.id);
  if (!amenity) return res.status(404).json({ error: 'Amenity not found' });
  res.json(amenity);
});

router.post('/', (req, res) => {
  const { name, category, price, status } = req.body;
  if (!name || !category) return res.status(400).json({ error: 'name and category required' });
  const newAmenity = { id: `AMEN-${Date.now()}`, name, category, price: price || 0, status: status || 'available' };
  amenities.push(newAmenity);
  res.status(201).json(newAmenity);
});

router.patch('/:id/status', (req, res) => {
  const amenity = amenities.find(a => a.id === req.params.id);
  if (!amenity) return res.status(404).json({ error: 'Amenity not found' });
  amenity.status = req.body.status;
  res.json(amenity);
});

module.exports = router;
