const express = require('express');
const router = express.Router();

let venues = [
  { id: '1', name: 'Madison Arena', type: 'arena', capacity: 20000, location: 'New York' },
  { id: '2', name: 'The Comedy Club', type: 'club', capacity: 500, location: 'Los Angeles' },
  { id: '3', name: 'Rock Stadium', type: 'stadium', capacity: 50000, location: 'Chicago' },
  { id: '4', name: 'Jazz Lounge', type: 'lounge', capacity: 200, location: 'New Orleans' }
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
    type: req.body.type,
    capacity: req.body.capacity,
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