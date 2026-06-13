const express = require('express');
const router = express.Router();

let volunteers = [
  { id: '1', name: 'Alice Williams', email: 'alice@email.com', skills: ['teaching', 'event planning'], hoursLogged: 120, availability: 'weekends' },
  { id: '2', name: 'Bob Martinez', email: 'bob@email.com', skills: ['medical', 'first aid'], hoursLogged: 80, availability: 'flexible' },
  { id: '3', name: 'Carol Smith', email: 'carol@email.com', skills: ['fundraising', 'marketing'], hoursLogged: 150, availability: 'evenings' },
  { id: '4', name: 'David Lee', email: 'david@email.com', skills: ['IT', 'database'], hoursLogged: 60, availability: 'weekdays' }
];

// GET all volunteers
router.get('/', (req, res) => {
  res.json(volunteers);
});

// GET single volunteer
router.get('/:id', (req, res) => {
  const volunteer = volunteers.find(v => v.id === req.params.id);
  if (!volunteer) return res.status(404).json({ error: 'Volunteer not found' });
  res.json(volunteer);
});

// POST new volunteer
router.post('/', (req, res) => {
  const newVolunteer = {
    id: String(volunteers.length + 1),
    name: req.body.name,
    email: req.body.email,
    skills: req.body.skills || [],
    hoursLogged: req.body.hoursLogged || 0,
    availability: req.body.availability || 'flexible'
  };
  volunteers.push(newVolunteer);
  res.status(201).json(newVolunteer);
});

// PUT update volunteer
router.put('/:id', (req, res) => {
  const index = volunteers.findIndex(v => v.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Volunteer not found' });
  volunteers[index] = { ...volunteers[index], ...req.body };
  res.json(volunteers[index]);
});

// DELETE volunteer
router.delete('/:id', (req, res) => {
  const index = volunteers.findIndex(v => v.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Volunteer not found' });
  volunteers.splice(index, 1);
  res.json({ message: 'Volunteer deleted successfully' });
});

module.exports = router;