const express = require('express');
const router = express.Router();

let consultants = [
  { id: '1', name: 'Dr. Robert Chen', expertise: ['strategy', 'finance'], hourlyRate: 250, availability: 20 },
  { id: '2', name: 'Sarah Williams', expertise: ['marketing', 'digital'], hourlyRate: 200, availability: 30 },
  { id: '3', name: 'James Anderson', expertise: ['IT', 'security'], hourlyRate: 225, availability: 15 },
  { id: '4', name: 'Emily Brown', expertise: ['HR', 'organizational'], hourlyRate: 180, availability: 25 }
];

// GET all consultants
router.get('/', (req, res) => {
  res.json(consultants);
});

// GET single consultant
router.get('/:id', (req, res) => {
  const consultant = consultants.find(c => c.id === req.params.id);
  if (!consultant) return res.status(404).json({ error: 'Consultant not found' });
  res.json(consultant);
});

// POST new consultant
router.post('/', (req, res) => {
  const newConsultant = {
    id: String(consultants.length + 1),
    name: req.body.name,
    expertise: req.body.expertise || [],
    hourlyRate: req.body.hourlyRate || 100,
    availability: req.body.availability || 0
  };
  consultants.push(newConsultant);
  res.status(201).json(newConsultant);
});

// PUT update consultant
router.put('/:id', (req, res) => {
  const index = consultants.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Consultant not found' });
  consultants[index] = { ...consultants[index], ...req.body };
  res.json(consultants[index]);
});

// DELETE consultant
router.delete('/:id', (req, res) => {
  const index = consultants.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Consultant not found' });
  consultants.splice(index, 1);
  res.json({ message: 'Consultant deleted successfully' });
});

module.exports = router;