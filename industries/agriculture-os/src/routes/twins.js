/**
 * Agriculture OS - Digital Twins Routes
 */

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    twins: [
      { id: 'agri-farm-twin', name: 'Farm Twin', type: 'farm', health: 98 },
      { id: 'agri-crop-twin', name: 'Crop Twin', type: 'crop', health: 99 },
      { id: 'agri-livestock-twin', name: 'Livestock Twin', type: 'livestock', health: 97 },
      { id: 'agri-weather-twin', name: 'Weather Twin', type: 'weather', health: 96 },
      { id: 'agri-soil-twin', name: 'Soil Twin', type: 'soil', health: 95 }
    ],
    total: 5
  });
});

router.get('/:id', (req, res) => {
  const twinMap = {
    'agri-farm-twin': { name: 'Farm Twin', type: 'farm', state: { total: 2, totalArea: 700 } },
    'agri-crop-twin': { name: 'Crop Twin', type: 'crop', state: { total: 3, growing: 3 } },
    'agri-livestock-twin': { name: 'Livestock Twin', type: 'livestock', state: { total: 550, healthy: 548 } },
    'agri-weather-twin': { name: 'Weather Twin', type: 'weather', state: { temp: 25, humidity: 60 } },
    'agri-soil-twin': { name: 'Soil Twin', type: 'soil', state: { moisture: 45, ph: 6.5 } }
  };
  const twin = twinMap[req.params.id];
  if (!twin) return res.status(404).json({ error: 'Twin not found' });
  res.json({ id: req.params.id, ...twin, status: 'active', lastSync: new Date().toISOString() });
});

router.post('/:id/sync', (req, res) => {
  res.json({ id: req.params.id, status: 'synced', lastSync: new Date().toISOString() });
});

module.exports = router;
