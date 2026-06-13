/**
 * Genie OS - Digital Twins Routes
 */

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    twins: [
      { id: 'genie-wish-twin', name: 'Wish Twin', type: 'wish', health: 98 },
      { id: 'genie-fulfillment-twin', name: 'Fulfillment Twin', type: 'fulfillment', health: 99 },
      { id: 'genie-user-twin', name: 'User Twin', type: 'user', health: 97 }
    ],
    total: 3
  });
});

router.get('/:id', (req, res) => {
  const twinMap = {
    'genie-wish-twin': { name: 'Wish Twin', type: 'wish', state: { total: 500, fulfilled: 485 } },
    'genie-fulfillment-twin': { name: 'Fulfillment Twin', type: 'fulfillment', state: { successRate: 97, avgTime: 2.5 } },
    'genie-user-twin': { name: 'User Twin', type: 'user', state: { total: 150, active: 120 } }
  };
  const twin = twinMap[req.params.id];
  if (!twin) return res.status(404).json({ error: 'Twin not found' });
  res.json({ id: req.params.id, ...twin, status: 'active', lastSync: new Date().toISOString() });
});

router.post('/:id/sync', (req, res) => {
  res.json({ id: req.params.id, status: 'synced', lastSync: new Date().toISOString() });
});

module.exports = router;