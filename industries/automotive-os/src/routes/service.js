/**
 * Automotive OS - Service Routes
 */

const express = require('express');
const router = express.Router();

let serviceRecords = [
  { id: 'SRV-001', vehicleId: 'VEH-002', type: 'oil-change', date: '2024-01-05', mileage: 15000, cost: 3000, status: 'completed', notes: 'Regular service' },
  { id: 'SRV-002', vehicleId: 'VEH-001', type: 'inspection', date: '2024-01-12', mileage: 500, cost: 0, status: 'scheduled', notes: 'First inspection' }
];

router.get('/', (req, res) => {
  const { vehicleId, status, type } = req.query;
  let filtered = [...serviceRecords];
  if (vehicleId) filtered = filtered.filter(s => s.vehicleId === vehicleId);
  if (status) filtered = filtered.filter(s => s.status === status);
  if (type) filtered = filtered.filter(s => s.type === type);
  res.json({ records: filtered, count: filtered.length });
});

router.get('/:id', (req, res) => {
  const record = serviceRecords.find(s => s.id === req.params.id);
  if (!record) return res.status(404).json({ error: 'Service record not found' });
  res.json(record);
});

router.post('/', (req, res) => {
  const { vehicleId, type, date, mileage, notes } = req.body;
  if (!vehicleId || !type) return res.status(400).json({ error: 'vehicleId and type required' });
  const newRecord = { id: `SRV-${Date.now()}`, vehicleId, type, date: date || new Date().toISOString(), mileage: mileage || 0, cost: 0, status: 'scheduled', notes: notes || '' };
  serviceRecords.push(newRecord);
  res.status(201).json(newRecord);
});

router.patch('/:id/status', (req, res) => {
  const record = serviceRecords.find(s => s.id === req.params.id);
  if (!record) return res.status(404).json({ error: 'Service record not found' });
  record.status = req.body.status;
  if (req.body.cost) record.cost = req.body.cost;
  res.json(record);
});

module.exports = router;