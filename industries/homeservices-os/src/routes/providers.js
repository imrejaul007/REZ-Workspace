const express = require('express');
const router = express.Router();

let providers = [
  { id: '1', name: 'Ramesh Plumber', skills: ['plumbing', 'pipe fitting'], rating: 4.8, availability: 'Mon-Sat 9AM-6PM', location: 'Delhi NCR' },
  { id: '2', name: 'Electrician Singh', skills: ['electrical', 'wiring'], rating: 4.5, availability: 'Mon-Fri 8AM-5PM', location: 'Mumbai' },
  { id: '3', name: 'Clean Pro Services', skills: ['house cleaning', 'deep cleaning'], rating: 4.7, availability: 'Daily 8AM-8PM', location: 'Bangalore' },
  { id: '4', name: 'Cool Fix AC', skills: ['ac repair', 'gas refilling'], rating: 4.6, availability: 'Mon-Sun 9AM-9PM', location: 'Delhi NCR' }
];

// GET all providers
router.get('/', (req, res) => {
  res.json(providers);
});

// GET single provider
router.get('/:id', (req, res) => {
  const provider = providers.find(p => p.id === req.params.id);
  if (!provider) return res.status(404).json({ error: 'Provider not found' });
  res.json(provider);
});

// POST new provider
router.post('/', (req, res) => {
  const newProvider = {
    id: String(providers.length + 1),
    name: req.body.name,
    skills: req.body.skills || [],
    rating: req.body.rating || 0,
    availability: req.body.availability,
    location: req.body.location
  };
  providers.push(newProvider);
  res.status(201).json(newProvider);
});

// PUT update provider
router.put('/:id', (req, res) => {
  const index = providers.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Provider not found' });
  providers[index] = { ...providers[index], ...req.body };
  res.json(providers[index]);
});

// DELETE provider
router.delete('/:id', (req, res) => {
  const index = providers.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Provider not found' });
  providers.splice(index, 1);
  res.json({ message: 'Provider deleted successfully' });
});

module.exports = router;