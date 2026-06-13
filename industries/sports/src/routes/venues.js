const express = require('express');
const router = express.Router();

let venues = [
  { id: '1', name: 'Wankhede Stadium', capacity: 33000, location: 'Mumbai' },
  { id: '2', name: 'Arun Jaitley Stadium', capacity: 25000, location: 'Delhi' },
  { id: '3', name: 'M. Chinnaswamy Stadium', capacity: 38000, location: 'Bangalore' },
  { id: '4', name: 'MA Chidambaram Stadium', capacity: 38000, location: 'Chennai' }
];

// GET all venues
router.get('/', (req, res) => {
  res.json(venues);
});

// GET single venue
router.get('/:id', (req, res) => {
  const venue = venues.find(v => v.id === req.params.id);
  if (!venue) return res.status(404).json({ error: 'Venue not found' });
  res.json(venue);
});

// POST new venue
router.post('/', (req, res) => {
  const newVenue = {
    id: String(venues.length + 1),
    name: req.body.name,
    capacity: req.body.capacity || 0,
    location: req.body.location
  };
  venues.push(newVenue);
  res.status(201).json(newVenue);
});

// PUT update venue
router.put('/:id', (req, res) => {
  const index = venues.findIndex(v => v.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Venue not found' });
  venues[index] = { ...venues[index], ...req.body };
  res.json(venues[index]);
});

// DELETE venue
router.delete('/:id', (req, res) => {
  const index = venues.findIndex(v => v.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Venue not found' });
  venues.splice(index, 1);
  res.json({ message: 'Venue deleted successfully' });
});

module.exports = router;