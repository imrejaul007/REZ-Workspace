/**
 * Real Estate OS - Properties Routes
 */

const express = require('express');
const router = express.Router();

let properties = [
  { id: 'PROP-001', address: '123 Main St', type: 'apartment', bedrooms: 3, bathrooms: 2, area: 1500, price: 5000000, status: 'available', agentId: 'AGT-001' },
  { id: 'PROP-002', address: '456 Oak Ave', type: 'villa', bedrooms: 4, bathrooms: 3, area: 2500, price: 8500000, status: 'available', agentId: 'AGT-002' }
];

router.get('/', (req, res) => {
  const { type, status, minPrice, maxPrice } = req.query;
  let filtered = [...properties];
  if (type) filtered = filtered.filter(p => p.type === type);
  if (status) filtered = filtered.filter(p => p.status === status);
  if (minPrice) filtered = filtered.filter(p => p.price >= parseInt(minPrice));
  if (maxPrice) filtered = filtered.filter(p => p.price <= parseInt(maxPrice));
  res.json({ properties: filtered, count: filtered.length });
});

router.get('/:id', (req, res) => {
  const property = properties.find(p => p.id === req.params.id);
  if (!property) return res.status(404).json({ error: 'Property not found' });
  res.json(property);
});

router.post('/', (req, res) => {
  const { address, type, bedrooms, bathrooms, area, price, agentId } = req.body;
  if (!address || !type || !price) return res.status(400).json({ error: 'address, type, price required' });
  const newProperty = { id: `PROP-${Date.now()}`, address, type, bedrooms: bedrooms || 0, bathrooms: bathrooms || 0, area: area || 0, price, status: 'available', agentId: agentId || null };
  properties.push(newProperty);
  res.status(201).json(newProperty);
});

router.patch('/:id/status', (req, res) => {
  const property = properties.find(p => p.id === req.params.id);
  if (!property) return res.status(404).json({ error: 'Property not found' });
  property.status = req.body.status;
  res.json(property);
});

module.exports = router;