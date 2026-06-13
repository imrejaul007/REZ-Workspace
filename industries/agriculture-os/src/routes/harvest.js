/**
 * Agriculture OS - Harvest Routes
 */

const express = require('express');
const router = express.Router();

let harvests = [
  { id: 'HAR-001', cropId: 'CRS-001', farmId: 'FARM-001', quantity: 500, unit: 'tons', date: '2024-06-15', quality: 'A', revenue: 50000 }
];

router.get('/', (req, res) => {
  const { cropId, farmId } = req.query;
  let filtered = [...harvests];
  if (cropId) filtered = filtered.filter(h => h.cropId === cropId);
  if (farmId) filtered = filtered.filter(h => h.farmId === farmId);
  res.json({ harvests: filtered, count: filtered.length });
});

router.post('/', (req, res) => {
  const { cropId, farmId, quantity, unit, quality } = req.body;
  if (!cropId || !quantity) return res.status(400).json({ error: 'cropId and quantity required' });
  const newHarvest = { id: `HAR-${Date.now()}`, cropId, farmId: farmId || null, quantity, unit: unit || 'kg', date: new Date().toISOString(), quality: quality || 'B', revenue: 0 };
  harvests.push(newHarvest);
  res.status(201).json(newHarvest);
});

module.exports = router;
