/**
 * Beauty OS - Digital Twins Routes
 */

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    twins: [
      { id: 'beauty-client-twin', name: 'Client Twin', type: 'client', health: 98 },
      { id: 'beauty-service-twin', name: 'Service Twin', type: 'service', health: 99 },
      { id: 'beauty-staff-twin', name: 'Staff Twin', type: 'staff', health: 97 },
      { id: 'beauty-inventory-twin', name: 'Inventory Twin', type: 'inventory', health: 96 }
    ],
    total: 4
  });
});

router.get('/:id', (req, res) => {
  const twinMap = {
    'beauty-client-twin': { name: 'Client Twin', type: 'client', state: { total: 500, active: 350 } },
    'beauty-service-twin': { name: 'Service Twin', type: 'service', state: { total: 25, popular: ['haircut', 'spa'] } },
    'beauty-staff-twin': { name: 'Staff Twin', type: 'staff', state: { total: 12, available: 10 } },
    'beauty-inventory-twin': { name: 'Inventory Twin', type: 'inventory', state: { total: 150, lowStock: 8 } }
  };
  const twin = twinMap[req.params.id];
  if (!twin) return res.status(404).json({ error: 'Twin not found' });
  res.json({ id: req.params.id, ...twin, status: 'active', lastSync: new Date().toISOString() });
});

router.post('/:id/sync', (req, res) => {
  res.json({ id: req.params.id, status: 'synced', lastSync: new Date().toISOString() });
});

module.exports = router;