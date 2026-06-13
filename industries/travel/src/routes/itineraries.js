const express = require('express');
const router = express.Router();

let itineraries = [
  { id: '1', bookingId: '1', day1: { activity: 'Arrival and hotel check-in', location: 'Paris' }, day2: { activity: 'Eiffel Tower tour', location: 'Paris' }, day3: { activity: 'Louvre Museum', location: 'Paris' } },
  { id: '2', bookingId: '2', day1: { activity: 'Arrival and villa check-in', location: 'Bali' }, day2: { activity: 'Temple tour', location: 'Ubud' }, day3: { activity: 'Beach day', location: 'Seminyak' } },
  { id: '3', bookingId: '3', day1: { activity: 'Arrival and hotel', location: 'Tokyo' }, day2: { activity: 'Shibuya and Harajuku', location: 'Tokyo' }, day3: { activity: 'Mt Fuji day trip', location: 'Hakone' } }
];

// GET all itineraries
router.get('/', (req, res) => {
  res.json(itineraries);
});

// GET single itinerary
router.get('/:id', (req, res) => {
  const itinerary = itineraries.find(i => i.id === req.params.id);
  if (!itinerary) return res.status(404).json({ error: 'Itinerary not found' });
  res.json(itinerary);
});

// POST new itinerary
router.post('/', (req, res) => {
  const newItinerary = {
    id: String(itineraries.length + 1),
    bookingId: req.body.bookingId,
    ...req.body.days
  };
  itineraries.push(newItinerary);
  res.status(201).json(newItinerary);
});

// PUT update itinerary
router.put('/:id', (req, res) => {
  const index = itineraries.findIndex(i => i.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Itinerary not found' });
  itineraries[index] = { ...itineraries[index], ...req.body };
  res.json(itineraries[index]);
});

// DELETE itinerary
router.delete('/:id', (req, res) => {
  const index = itineraries.findIndex(i => i.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Itinerary not found' });
  itineraries.splice(index, 1);
  res.json({ message: 'Itinerary deleted successfully' });
});

module.exports = router;