const express = require('express');
const router = express.Router();

let classes = [
  { id: '1', name: 'Yoga Flow', type: 'yoga', trainerId: 'T001', schedule: 'Mon/Wed/Fri 9AM', capacity: 20, enrolled: 15 },
  { id: '2', name: 'HIIT Blast', type: 'hiit', trainerId: 'T002', schedule: 'Tue/Thu 6PM', capacity: 15, enrolled: 12 },
  { id: '3', name: 'Spin Class', type: 'cycling', trainerId: 'T003', schedule: 'Daily 7AM', capacity: 25, enrolled: 20 }
];

// GET all classes
router.get('/', (req, res) => {
  res.json(classes);
});

// GET single class
router.get('/:id', (req, res) => {
  const cls = classes.find(c => c.id === req.params.id);
  if (!cls) return res.status(404).json({ error: 'Class not found' });
  res.json(cls);
});

// POST new class
router.post('/', (req, res) => {
  const newClass = {
    id: String(classes.length + 1),
    name: req.body.name,
    type: req.body.type,
    trainerId: req.body.trainerId,
    schedule: req.body.schedule,
    capacity: req.body.capacity || 20,
    enrolled: req.body.enrolled || 0
  };
  classes.push(newClass);
  res.status(201).json(newClass);
});

// PUT update class
router.put('/:id', (req, res) => {
  const index = classes.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Class not found' });
  classes[index] = { ...classes[index], ...req.body };
  res.json(classes[index]);
});

// DELETE class
router.delete('/:id', (req, res) => {
  const index = classes.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Class not found' });
  classes.splice(index, 1);
  res.json({ message: 'Class deleted successfully' });
});

module.exports = router;
