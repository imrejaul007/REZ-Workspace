const express = require('express');
const router = express.Router();

let complaints = [
  { id: '1', citizenId: '1', type: 'service_delay', description: 'Passport processing delayed by 3 months', status: 'open', createdAt: '2024-05-01' },
  { id: '2', citizenId: '2', type: 'corruption', description: 'Bribe demanded for birth certificate', status: 'investigating', createdAt: '2024-05-10' },
  { id: '3', citizenId: '3', type: 'facility', description: 'Potholes on main road', status: 'resolved', createdAt: '2024-04-15' }
];

// GET all complaints
router.get('/', (req, res) => {
  res.json(complaints);
});

// GET single complaint
router.get('/:id', (req, res) => {
  const complaint = complaints.find(c => c.id === req.params.id);
  if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
  res.json(complaint);
});

// POST new complaint
router.post('/', (req, res) => {
  const newComplaint = {
    id: String(complaints.length + 1),
    citizenId: req.body.citizenId,
    type: req.body.type,
    description: req.body.description,
    status: req.body.status || 'open',
    createdAt: new Date().toISOString().split('T')[0]
  };
  complaints.push(newComplaint);
  res.status(201).json(newComplaint);
});

// PUT update complaint
router.put('/:id', (req, res) => {
  const index = complaints.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Complaint not found' });
  complaints[index] = { ...complaints[index], ...req.body };
  res.json(complaints[index]);
});

// DELETE complaint
router.delete('/:id', (req, res) => {
  const index = complaints.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Complaint not found' });
  complaints.splice(index, 1);
  res.json({ message: 'Complaint deleted successfully' });
});

module.exports = router;