const express = require('express');
const router = express.Router();

let travelers = [
  { id: '1', name: 'John Smith', passport: 'AB123456', preferences: { seat: 'window', meal: 'vegetarian', room: 'ocean view' } },
  { id: '2', name: 'Jane Doe', passport: 'CD789012', preferences: { seat: 'aisle', meal: 'vegan', room: 'pool access' } },
  { id: '3', name: 'Bob Wilson', passport: 'EF345678', preferences: { seat: 'window', meal: 'non-veg', room: 'standard' } }
];

// GET all travelers
router.get('/', (req, res) => {
  res.json(travelers);
});

// GET single traveler
router.get('/:id', (req, res) => {
  const traveler = travelers.find(t => t.id === req.params.id);
  if (!traveler) return res.status(404).json({ error: 'Traveler not found' });
  res.json(traveler);
});

// POST new traveler
router.post('/', (req, res) => {
  const newTraveler = {
    id: String(travelers.length + 1),
    name: req.body.name,
    passport: req.body.passport,
    preferences: req.body.preferences || {}
  };
  travelers.push(newTraveler);
  res.status(201).json(newTraveler);
});

// PUT update traveler
router.put('/:id', (req, res) => {
  const index = travelers.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Traveler not found' });
  travelers[index] = { ...travelers[index], ...req.body };
  res.json(travelers[index]);
});

// DELETE traveler
router.delete('/:id', (req, res) => {
  const index = travelers.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Traveler not found' });
  travelers.splice(index, 1);
  res.json({ message: 'Traveler deleted successfully' });
});

module.exports = router;