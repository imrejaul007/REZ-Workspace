/**
 * Business Copilot OS - Twin Routes
 */

const express = require('express');
const router = express.Router();

let twins = [
  { id: 'TWIN-001', name: 'Business Health Twin', type: 'business', metrics: { revenue: 85, growth: 90, efficiency: 88 }, status: 'active' },
  { id: 'TWIN-002', name: 'Customer Twin', type: 'customer', metrics: { satisfaction: 92, retention: 88, nps: 45 }, status: 'active' }
];

router.get('/', (req, res) => {
  const { type } = req.query;
  let filtered = [...twins];
  if (type) filtered = filtered.filter(t => t.type === type);
  res.json({ twins: filtered, count: filtered.length });
});

router.get('/:id', (req, res) => {
  const twin = twins.find(t => t.id === req.params.id);
  if (!twin) return res.status(404).json({ error: 'Twin not found' });
  res.json(twin);
});

router.post('/:id/query', (req, res) => {
  const twin = twins.find(t => t.id === req.params.id);
  if (!twin) return res.status(404).json({ error: 'Twin not found' });
  res.json({ twinId: twin.id, response: `Insights from ${twin.name}`, metrics: twin.metrics });
});

module.exports = router;