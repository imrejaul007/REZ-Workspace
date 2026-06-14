const express = require('express');
const router = express.Router();

let facilities = [
  { id: '1', name: 'Main Gym Floor', type: 'gym', capacity: 100, equipment: ['treadmills', 'weights', 'cables'] },
  { id: '2', name: 'Spin Studio', type: 'studio', capacity: 25, equipment: ['spin bikes', 'sound system'] },
  { id: '3', name: 'Yoga Room', type: 'studio', capacity: 30, equipment: ['mats', 'blocks', 'straps'] },
  { id: '4', name: 'Pool', type: 'aquatic', capacity: 20, equipment: ['lanes', 'equipment'] }
];

// GET all facilities
router.get('/', (req, res) => {
  res.json(facilities);
});

// GET single facility
router.get('/:id', (req, res) => {
  const facility = facilities.find(f => f.id === req.params.id);
  if (!facility) return res.status(404).json({ error: 'Facility not found' });
  res.json(facility);
});

// POST new facility
router.post('/', (req, res) => {
  const newFacility = {
    id: String(facilities.length + 1),
    name: req.body.name,
    type: req.body.type,
    capacity: req.body.capacity || 50,
    equipment: req.body.equipment || []
  };
  facilities.push(newFacility);
  res.status(201).json(newFacility);
});

// PUT update facility
router.put('/:id', (req, res) => {
  const index = facilities.findIndex(f => f.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Facility not found' });
  facilities[index] = { ...facilities[index], ...req.body };
  res.json(facilities[index]);
});

// DELETE facility
router.delete('/:id', (req, res) => {
  const index = facilities.findIndex(f => f.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Facility not found' });
  facilities.splice(index, 1);
  res.json({ message: 'Facility deleted successfully' });
});

module.exports = router;
