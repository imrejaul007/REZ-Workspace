/**
 * Real Estate OS - Digital Twins Routes
 */

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    twins: [
      { id: 're-property-twin', name: 'Property Twin', type: 'property', health: 98 },
      { id: 're-buyer-twin', name: 'Buyer Twin', type: 'buyer', health: 97 },
      { id: 're-agent-twin', name: 'Agent Twin', type: 'agent', health: 96 },
      { id: 're-market-twin', name: 'Market Twin', type: 'market', health: 95 }
    ],
    total: 4
  });
});

router.get('/:id', (req, res) => {
  const twinMap = {
    're-property-twin': { name: 'Property Twin', type: 'property', state: { total: 50, available: 35 } },
    're-buyer-twin': { name: 'Buyer Twin', type: 'buyer', state: { total: 100, active: 45 } },
    're-agent-twin': { name: 'Agent Twin', type: 'agent', state: { total: 15, active: 12 } },
    're-market-twin': { name: 'Market Twin', type: 'market', state: { avgPrice: 6500000, trend: 'stable' } }
  };
  const twin = twinMap[req.params.id];
  if (!twin) return res.status(404).json({ error: 'Twin not found' });
  res.json({ id: req.params.id, ...twin, status: 'active', lastSync: new Date().toISOString() });
});

router.post('/:id/sync', (req, res) => {
  res.json({ id: req.params.id, status: 'synced', lastSync: new Date().toISOString() });
});

module.exports = router;