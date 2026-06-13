/**
 * Agriculture OS - Crops Routes
 */

const express = require('express');
const router = express.Router();

let crops = [
  { id: 'CRS-001', name: 'Wheat', type: 'grain', plantedArea: 200, harvestDate: '2024-06-15', status: 'growing', yield: null },
  { id: 'CRS-002', name: 'Corn', type: 'grain', plantedArea: 150, harvestDate: '2024-07-01', status: 'growing', yield: null },
  { id: 'CRS-003', name: 'Apples', type: 'fruit', plantedArea: 100, harvestDate: '2024-09-01', status: 'growing', yield: null }
];

router.get('/', (req, res) => {
  const { type, status } = req.query;
  let filtered = [...crops];
  if (type) filtered = filtered.filter(c => c.type === type);
  if (status) filtered = filtered.filter(c => c.status === status);
  res.json({ crops: filtered, count: filtered.length });
});

router.get('/:id', (req, res) => {
  const crop = crops.find(c => c.id === req.params.id);
  if (!crop) return res.status(404).json({ error: 'Crop not found' });
  res.json(crop);
});

router.post('/', (req, res) => {
  const { name, type, plantedArea, harvestDate } = req.body;
  if (!name || !type) return res.status(400).json({ error: 'name and type required' });
  const newCrop = { id: `CRS-${Date.now()}`, name, type, plantedArea: plantedArea || 0, harvestDate: harvestDate || null, status: 'planted', yield: null };
  crops.push(newCrop);
  res.status(201).json(newCrop);
});

router.patch('/:id/status', (req, res) => {
  const crop = crops.find(c => c.id === req.params.id);
  if (!crop) return res.status(404).json({ error: 'Crop not found' });
  crop.status = req.body.status;
  res.json(crop);
});

module.exports = router;
