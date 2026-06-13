/**
 * Business Copilot OS - Digital Twins Routes
 */

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    twins: [
      { id: 'bc-business-twin', name: 'Business Twin', type: 'business', health: 98 },
      { id: 'bc-financial-twin', name: 'Financial Twin', type: 'financial', health: 99 },
      { id: 'bc-operational-twin', name: 'Operational Twin', type: 'operational', health: 97 },
      { id: 'bc-market-twin', name: 'Market Twin', type: 'market', health: 96 }
    ],
    total: 4
  });
});

router.get('/:id', (req, res) => {
  const twinMap = {
    'bc-business-twin': { name: 'Business Twin', type: 'business', state: { health: 92, growth: 25 } },
    'bc-financial-twin': { name: 'Financial Twin', type: 'financial', state: { revenue: 5000000, profit: 1500000 } },
    'bc-operational-twin': { name: 'Operational Twin', type: 'operational', state: { efficiency: 88, throughput: 5000 } },
    'bc-market-twin': { name: 'Market Twin', type: 'market', state: { share: 15, trend: 'growing' } }
  };
  const twin = twinMap[req.params.id];
  if (!twin) return res.status(404).json({ error: 'Twin not found' });
  res.json({ id: req.params.id, ...twin, status: 'active', lastSync: new Date().toISOString() });
});

router.post('/:id/sync', (req, res) => {
  res.json({ id: req.params.id, status: 'synced', lastSync: new Date().toISOString() });
});

module.exports = router;