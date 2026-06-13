/**
 * BOA OS - Digital Twins Routes
 */

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    twins: [
      { id: 'boa-strategy-twin', name: 'Strategy Twin', type: 'strategy', health: 98 },
      { id: 'boa-finance-twin', name: 'Finance Twin', type: 'finance', health: 99 },
      { id: 'boa-operations-twin', name: 'Operations Twin', type: 'operations', health: 97 },
      { id: 'boa-hr-twin', name: 'HR Twin', type: 'hr', health: 96 },
      { id: 'boa-marketing-twin', name: 'Marketing Twin', type: 'marketing', health: 95 },
      { id: 'boa-revenue-twin', name: 'Revenue Twin', type: 'revenue', health: 98 }
    ],
    total: 6
  });
});

router.get('/:id', (req, res) => {
  const twinMap = {
    'boa-strategy-twin': { name: 'Strategy Twin', type: 'strategy', state: { activeStrategies: 3, objectives: 12 } },
    'boa-finance-twin': { name: 'Finance Twin', type: 'finance', state: { revenue: 5000000, costs: 3500000 } },
    'boa-operations-twin': { name: 'Operations Twin', type: 'operations', state: { efficiency: 92, throughput: 5000 } },
    'boa-hr-twin': { name: 'HR Twin', type: 'hr', state: { employees: 150, retention: 95 } },
    'boa-marketing-twin': { name: 'Marketing Twin', type: 'marketing', state: { leads: 500, conversion: 15 } },
    'boa-revenue-twin': { name: 'Revenue Twin', type: 'revenue', state: { revenue: 5000000, growth: 25 } }
  };
  const twin = twinMap[req.params.id];
  if (!twin) return res.status(404).json({ error: 'Twin not found' });
  res.json({ id: req.params.id, ...twin, status: 'active', lastSync: new Date().toISOString() });
});

router.post('/:id/sync', (req, res) => {
  res.json({ id: req.params.id, status: 'synced', lastSync: new Date().toISOString() });
});

module.exports = router;