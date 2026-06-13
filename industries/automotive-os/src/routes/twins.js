/**
 * Automotive OS - Digital Twins Routes
 */

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    twins: [
      { id: 'auto-vehicle-twin', name: 'Vehicle Twin', type: 'vehicle', health: 98 },
      { id: 'auto-engine-twin', name: 'Engine Twin', type: 'engine', health: 99 },
      { id: 'auto-customer-twin', name: 'Customer Twin', type: 'customer', health: 97 },
      { id: 'auto-service-twin', name: 'Service Twin', type: 'service', health: 96 }
    ],
    total: 4
  });
});

router.get('/:id', (req, res) => {
  const twinMap = {
    'auto-vehicle-twin': { name: 'Vehicle Twin', type: 'vehicle', state: { total: 50, sold: 45 } },
    'auto-engine-twin': { name: 'Engine Twin', type: 'engine', state: { health: 98, alerts: 2 } },
    'auto-customer-twin': { name: 'Customer Twin', type: 'customer', state: { total: 100, active: 85 } },
    'auto-service-twin': { name: 'Service Twin', type: 'service', state: { scheduled: 15, completed: 234 } }
  };
  const twin = twinMap[req.params.id];
  if (!twin) return res.status(404).json({ error: 'Twin not found' });
  res.json({ id: req.params.id, ...twin, status: 'active', lastSync: new Date().toISOString() });
});

router.post('/:id/sync', (req, res) => {
  res.json({ id: req.params.id, status: 'synced', lastSync: new Date().toISOString() });
});

module.exports = router;