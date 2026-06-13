/**
 * Transport OS - Digital Twins Routes
 */

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    twins: [
      { id: 'trans-vehicle-twin', name: 'Vehicle Twin', type: 'vehicle', health: 98 },
      { id: 'trans-driver-twin', name: 'Driver Twin', type: 'driver', health: 97 },
      { id: 'trans-rider-twin', name: 'Rider Twin', type: 'rider', health: 96 },
      { id: 'trans-route-twin', name: 'Route Twin', type: 'route', health: 95 }
    ],
    total: 4
  });
});

router.get('/:id', (req, res) => {
  const twinMap = {
    'trans-vehicle-twin': { name: 'Vehicle Twin', type: 'vehicle', state: { total: 50, active: 45, maintenance: 5 } },
    'trans-driver-twin': { name: 'Driver Twin', type: 'driver', state: { total: 50, online: 35, offline: 15 } },
    'trans-rider-twin': { name: 'Rider Twin', type: 'rider', state: { total: 1000, active: 250 } },
    'trans-route-twin': { name: 'Route Twin', type: 'route', state: { total: 25, popular: ['Downtown Express'] } }
  };
  const twin = twinMap[req.params.id];
  if (!twin) return res.status(404).json({ error: 'Twin not found' });
  res.json({ id: req.params.id, ...twin, status: 'active', lastSync: new Date().toISOString() });
});

router.post('/:id/sync', (req, res) => {
  res.json({ id: req.params.id, status: 'synced', lastSync: new Date().toISOString() });
});

module.exports = router;