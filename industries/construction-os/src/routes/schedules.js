const express = require('express');
const router = express.Router();

let schedules = [
  { id: '1', projectId: '1', phase: 'foundation', plannedEnd: '2024-03-31', actualEnd: '2024-04-15', status: 'delayed' },
  { id: '2', projectId: '1', phase: 'structural', plannedEnd: '2024-06-30', actualEnd: null, status: 'in_progress' },
  { id: '3', projectId: '4', phase: 'interior', plannedEnd: '2024-08-31', actualEnd: null, status: 'pending' }
];

// GET all schedules
router.get('/', (req, res) => {
  res.json(schedules);
});

// GET single schedule
router.get('/:id', (req, res) => {
  const schedule = schedules.find(s => s.id === req.params.id);
  if (!schedule) return res.status(404).json({ error: 'Schedule not found' });
  res.json(schedule);
});

// POST new schedule
router.post('/', (req, res) => {
  const newSchedule = {
    id: String(schedules.length + 1),
    projectId: req.body.projectId,
    phase: req.body.phase,
    plannedEnd: req.body.plannedEnd,
    actualEnd: req.body.actualEnd || null,
    status: req.body.status || 'pending'
  };
  schedules.push(newSchedule);
  res.status(201).json(newSchedule);
});

// PUT update schedule
router.put('/:id', (req, res) => {
  const index = schedules.findIndex(s => s.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Schedule not found' });
  schedules[index] = { ...schedules[index], ...req.body };
  res.json(schedules[index]);
});

// DELETE schedule
router.delete('/:id', (req, res) => {
  const index = schedules.findIndex(s => s.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Schedule not found' });
  schedules.splice(index, 1);
  res.json({ message: 'Schedule deleted successfully' });
});

module.exports = router;