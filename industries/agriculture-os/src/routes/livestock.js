/**
 * Agriculture OS - Livestock Routes
 */

const express = require('express');
const router = express.Router();

let livestock = [
  { id: 'LIV-001', type: 'cattle', breed: 'Angus', count: 50, farmId: 'FARM-001', health: 'good', lastCheckup: '2024-01-10' },
  { id: 'LIV-002', type: 'poultry', breed: 'Leghorn', count: 500, farmId: 'FARM-001', health: 'good', lastCheckup: '2024-01-12' }
];

router.get('/', (req, res) => {
  const { type, farmId } = req.query;
  let filtered = [...livestock];
  if (type) filtered = filtered.filter(l => l.type === type);
  if (farmId) filtered = filtered.filter(l => l.farmId === farmId);
  res.json({ livestock: filtered, count: filtered.length });
});

router.get('/:id', (req, res) => {
  const animal = livestock.find(l => l.id === req.params.id);
  if (!animal) return res.status(404).json({ error: 'Livestock not found' });
  res.json(animal);
});

router.post('/', (req, res) => {
  const { type, breed, count, farmId } = req.body;
  if (!type || !count) return res.status(400).json({ error: 'type and count required' });
  const newAnimal = { id: `LIV-${Date.now()}`, type, breed: breed || null, count, farmId: farmId || null, health: 'good', lastCheckup: new Date().toISOString() };
  livestock.push(newAnimal);
  res.status(201).json(newAnimal);
});

module.exports = router;
