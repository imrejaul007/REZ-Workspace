const express = require('express');
const router = express.Router();

let schedules = [
  { id: '1', eventId: '1', day: '2024-07-15', time: '18:00', duration: 4, activities: ['doors_open', 'opening_act', 'main_show', 'encore'] },
  { id: '2', eventId: '2', day: '2024-06-20', time: '20:00', duration: 2, activities: ['show_start', 'intermission', 'show_end'] },
  { id: '3', eventId: '3', day: '2024-08-01', time: '19:00', duration: 3, activities: ['gates_open', 'opening_band', 'main_act'] }
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
    eventId: req.body.eventId,
    day: req.body.day,
    time: req.body.time,
    duration: req.body.duration || 2,
    activities: req.body.activities || []
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