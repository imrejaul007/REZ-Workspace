/**
 * Transport OS - Maintenance Routes
 */

const express = require('express');
const router = express.Router();

let records = [
  { id: 'MNT-001', vehicleId: 'VEH-001', type: 'oil-change', date: '2024-01-10', mileage: 15000, cost: 2000, status: 'completed', notes: 'Regular service' }
];

router.get('/', (req, res) => {
  const { vehicleId, status } = req.query;
  let filtered = [...records];
  if (vehicleId) filtered = filtered.filter(r => r.vehicleId === vehicleId);
  if (status) filtered = filtered.filter(r => r.status === status);
  res.json({ records: filtered, count: filtered.length });
});

router.post('/', (req, res) => {
  const { vehicleId, type, mileage } = req.body;
  if (!vehicleId || !type) return res.status(400).json({ error: 'vehicleId and type required' });
  const newRecord = { id: `MNT-${Date.now()}`, vehicleId, type, date: new Date().toISOString(), mileage: mileage || 0, cost: 0, status: 'scheduled', notes: '' };
  records.push(newRecord);
  res.status(201).json(newRecord);
});

module.exports = router;