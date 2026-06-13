const express = require('express');
const router = express.Router();

let trainers = [
  { id: '1', name: 'John Smith', specialty: 'yoga', certifications: ['RYT-500', 'Prenatal Yoga'], schedule: 'Mon-Fri 8AM-4PM' },
  { id: '2', name: 'Sarah Johnson', specialty: 'hiit', certifications: ['NASM-CPT', 'CrossFit L2'], schedule: 'Mon-Fri 2PM-10PM' },
  { id: '3', name: 'Mike Davis', specialty: 'cycling', certifications: ['Spinning Certified', 'AFAA'], schedule: 'Daily 6AM-2PM' }
];

// GET all trainers
router.get('/', (req, res) => {
  res.json(trainers);
});

// GET single trainer
router.get('/:id', (req, res) => {
  const trainer = trainers.find(t => t.id === req.params.id);
  if (!trainer) return res.status(404).json({ error: 'Trainer not found' });
  res.json(trainer);
});

// POST new trainer
router.post('/', (req, res) => {
  const newTrainer = {
    id: String(trainers.length + 1),
    name: req.body.name,
    specialty: req.body.specialty,
    certifications: req.body.certifications || [],
    schedule: req.body.schedule
  };
  trainers.push(newTrainer);
  res.status(201).json(newTrainer);
});

// PUT update trainer
router.put('/:id', (req, res) => {
  const index = trainers.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Trainer not found' });
  trainers[index] = { ...trainers[index], ...req.body };
  res.json(trainers[index]);
});

// DELETE trainer
router.delete('/:id', (req, res) => {
  const index = trainers.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Trainer not found' });
  trainers.splice(index, 1);
  res.json({ message: 'Trainer deleted successfully' });
});

module.exports = router;
