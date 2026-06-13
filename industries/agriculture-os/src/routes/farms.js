/**
 * Agriculture OS - Farms Routes
 */

const express = require('express');
const router = express.Router();

let farms = [
  { id: 'FARM-001', name: 'Green Valley Farm', location: 'California', size: 500, crops: ['CRS-001', 'CRS-002'], status: 'active', irrigationType: 'drip' },
  { id: 'FARM-002', name: 'Sunrise Orchard', location: 'Washington', size: 200, crops: ['CRS-003'], status: 'active', irrigationType: 'sprinkler' }
];

router.get('/', (req, res) => {
  const { status, location } = req.query;
  let filtered = [...farms];
  if (status) filtered = filtered.filter(f => f.status === status);
  if (location) filtered = filtered.filter(f => f.location === location);
  res.json({ farms: filtered, count: filtered.length });
});

router.get('/:id', (req, res) => {
  const farm = farms.find(f => f.id === req.params.id);
  if (!farm) return res.status(404).json({ error: 'Farm not found' });
  res.json(farm);
});

router.post('/', (req, res) => {
  const { name, location, size, irrigationType } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const newFarm = { id: `FARM-${Date.now()}`, name, location: location || null, size: size || 0, crops: [], status: 'active', irrigationType: irrigationType || 'drip' };
  farms.push(newFarm);
  res.status(201).json(newFarm);
});

router.put('/:id', (req, res) => {
  const index = farms.findIndex(f => f.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Farm not found' });
  farms[index] = { ...farms[index], ...req.body };
  res.json(farms[index]);
});

module.exports = router;
