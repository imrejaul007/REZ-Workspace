/**
 * Hospitality OS - Digital Twins Routes
 */

const express = require('express');
const router = express.Router();

// GET /api/twins
router.get('/', (req, res) => {
  res.json({
    twins: [
      { id: 'hosp-guest-twin', name: 'Guest Twin', type: 'guest', health: 98 },
      { id: 'hosp-room-twin', name: 'Room Twin', type: 'room', health: 100 },
      { id: 'hosp-booking-twin', name: 'Booking Twin', type: 'booking', health: 97 },
      { id: 'hosp-revenue-twin', name: 'Revenue Twin', type: 'revenue', health: 99 },
      { id: 'hosp-service-twin', name: 'Service Twin', type: 'service', health: 96 }
    ],
    total: 5
  });
});

// GET /api/twins/:id
router.get('/:id', (req, res) => {
  const twinMap = {
    'hosp-guest-twin': { name: 'Guest Twin', type: 'guest', state: { total: 1250, active: 38 } },
    'hosp-room-twin': { name: 'Room Twin', type: 'room', state: { total: 50, occupied: 38, available: 12 } },
    'hosp-booking-twin': { name: 'Booking Twin', type: 'booking', state: { pending: 15, confirmed: 45 } },
    'hosp-revenue-twin': { name: 'Revenue Twin', type: 'revenue', state: { today: 85000, month: 1800000 } },
    'hosp-service-twin': { name: 'Service Twin', type: 'service', state: { active: 4, orders: 234 } }
  };

  const twin = twinMap[req.params.id];
  if (!twin) return res.status(404).json({ error: 'Twin not found' });
  res.json({ id: req.params.id, ...twin, status: 'active', lastSync: new Date().toISOString() });
});

// POST /api/twins/:id/sync
router.post('/:id/sync', (req, res) => {
  res.json({ id: req.params.id, status: 'synced', lastSync: new Date().toISOString() });
});

module.exports = router;