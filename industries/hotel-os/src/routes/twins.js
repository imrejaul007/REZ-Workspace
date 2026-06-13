/**
 * Hotel OS - Digital Twins Routes
 */

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    twins: [
      { id: 'hotel-guest-twin', name: 'Guest Twin', type: 'guest', service: 'guest-twin-service', port: 8447, health: 98 },
      { id: 'hotel-room-twin', name: 'Room Twin', type: 'room', service: 'room-twin-service', port: 8444, health: 100 },
      { id: 'hotel-property-twin', name: 'Property Twin', type: 'property', service: 'property-twin-service', port: 8448, health: 99 }
    ],
    total: 3
  });
});

router.get('/:id', (req, res) => {
  const twinMap = {
    'hotel-guest-twin': { name: 'Guest Twin', type: 'guest', service: 'guest-twin-service', port: 8447, state: { total: 1250, active: 38 } },
    'hotel-room-twin': { name: 'Room Twin', type: 'room', service: 'room-twin-service', port: 8444, state: { total: 50, occupied: 38, available: 12 } },
    'hotel-property-twin': { name: 'Property Twin', type: 'property', service: 'property-twin-service', port: 8448, state: { total: 1, occupancy: 76 } }
  };
  const twin = twinMap[req.params.id];
  if (!twin) return res.status(404).json({ error: 'Twin not found' });
  res.json({ id: req.params.id, ...twin, status: 'active', lastSync: new Date().toISOString() });
});

router.post('/:id/sync', (req, res) => {
  res.json({ id: req.params.id, status: 'synced', lastSync: new Date().toISOString() });
});

module.exports = router;
