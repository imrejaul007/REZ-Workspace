const express = require('express');
const router = express.Router();

let events = [
  { id: '1', name: 'Summer Music Festival', venueId: '1', date: '2024-07-15', artistId: '1', price: 150, status: 'upcoming' },
  { id: '2', name: 'Comedy Night', venueId: '2', date: '2024-06-20', artistId: '2', price: 50, status: 'upcoming' },
  { id: '3', name: 'Rock Concert', venueId: '3', date: '2024-08-01', artistId: '3', price: 100, status: 'upcoming' },
  { id: '4', name: 'Jazz Evening', venueId: '4', date: '2024-06-25', artistId: '4', price: 75, status: 'sold_out' }
];

// GET all events
router.get('/', (req, res) => {
  res.json(events);
});

// GET single event
router.get('/:id', (req, res) => {
  const event = events.find(e => e.id === req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  res.json(event);
});

// POST new event
router.post('/', (req, res) => {
  const newEvent = {
    id: String(events.length + 1),
    name: req.body.name,
    venueId: req.body.venueId,
    date: req.body.date,
    artistId: req.body.artistId,
    price: req.body.price,
    status: req.body.status || 'upcoming'
  };
  events.push(newEvent);
  res.status(201).json(newEvent);
});

// PUT update event
router.put('/:id', (req, res) => {
  const index = events.findIndex(e => e.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Event not found' });
  events[index] = { ...events[index], ...req.body };
  res.json(events[index]);
});

// DELETE event
router.delete('/:id', (req, res) => {
  const index = events.findIndex(e => e.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Event not found' });
  events.splice(index, 1);
  res.json({ message: 'Event deleted successfully' });
});

module.exports = router;