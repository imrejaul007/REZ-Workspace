const express = require('express');
const router = express.Router();

let destinations = [
  { id: '1', name: 'Paris', country: 'France', type: 'city', rating: 4.7, priceRange: '$$$' },
  { id: '2', name: 'Bali', country: 'Indonesia', type: 'beach', rating: 4.8, priceRange: '$$' },
  { id: '3', name: 'Tokyo', country: 'Japan', type: 'city', rating: 4.9, priceRange: '$$$' },
  { id: '4', name: 'Maldives', country: 'Maldives', type: 'island', rating: 4.9, priceRange: '$$$$' },
  { id: '5', name: 'Swiss Alps', country: 'Switzerland', type: 'mountain', rating: 4.8, priceRange: '$$$$' }
];

// GET all destinations
router.get('/', (req, res) => {
  res.json(destinations);
});

// GET single destination
router.get('/:id', (req, res) => {
  const destination = destinations.find(d => d.id === req.params.id);
  if (!destination) return res.status(404).json({ error: 'Destination not found' });
  res.json(destination);
});

// POST new destination
router.post('/', (req, res) => {
  const newDestination = {
    id: String(destinations.length + 1),
    name: req.body.name,
    country: req.body.country,
    type: req.body.type,
    rating: req.body.rating || 0,
    priceRange: req.body.priceRange || '$'
  };
  destinations.push(newDestination);
  res.status(201).json(newDestination);
});

// PUT update destination
router.put('/:id', (req, res) => {
  const index = destinations.findIndex(d => d.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Destination not found' });
  destinations[index] = { ...destinations[index], ...req.body };
  res.json(destinations[index]);
});

// DELETE destination
router.delete('/:id', (req, res) => {
  const index = destinations.findIndex(d => d.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Destination not found' });
  destinations.splice(index, 1);
  res.json({ message: 'Destination deleted successfully' });
});

module.exports = router;