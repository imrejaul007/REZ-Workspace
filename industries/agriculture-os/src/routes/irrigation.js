/**
 * Agriculture OS - Irrigation Routes
 */

const express = require('express');
const router = express.Router();

let schedules = [
  { id: 'IRR-001', farmId: 'FARM-001', zone: 'Zone A', duration: 60, frequency: 'daily', status: 'active', lastRun: '2024-01-15T06:00:00Z' },
  { id: 'IRR-002', farmId: 'FARM-001', zone: 'Zone B', duration: 45, frequency: 'alternate', status: 'active', lastRun: '2024-01-14T06:00:00Z' }
];

router.get('/', (req, res) => {
  const { farmId, status } = req.query;
  let filtered = [...schedules];
  if (farmId) filtered = filtered.filter(s => s.farmId === farmId);
  if (status) filtered = filtered.filter(s => s.status === status);
  res.json({ schedules: filtered, count: filtered.length });
});

router.post('/', (req, res) => {
  const { farmId, zone, duration, frequency } = req.body;
  if (!farmId || !zone) return res.status(400).json({ error: 'farmId and zone required' });
  const newSchedule = { id: `IRR-${Date.now()}`, farmId, zone, duration: duration || 30, frequency: frequency || 'daily', status: 'active', lastRun: null };
  schedules.push(newSchedule);
  res.status(201).json(newSchedule);
});

module.exports = router;
