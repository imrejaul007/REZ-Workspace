const express = require('express');
const router = express.Router();

let permits = [
  { id: '1', type: 'building', citizenId: '1', status: 'approved', issueDate: '2024-01-15', expiryDate: '2025-01-15' },
  { id: '2', type: 'business', citizenId: '2', status: 'pending', issueDate: null, expiryDate: null },
  { id: '3', type: 'environmental', citizenId: '3', status: 'approved', issueDate: '2024-02-01', expiryDate: '2026-02-01' }
];

// GET all permits
router.get('/', (req, res) => {
  res.json(permits);
});

// GET single permit
router.get('/:id', (req, res) => {
  const permit = permits.find(p => p.id === req.params.id);
  if (!permit) return res.status(404).json({ error: 'Permit not found' });
  res.json(permit);
});

// POST new permit
router.post('/', (req, res) => {
  const newPermit = {
    id: String(permits.length + 1),
    type: req.body.type,
    citizenId: req.body.citizenId,
    status: req.body.status || 'pending',
    issueDate: req.body.issueDate,
    expiryDate: req.body.expiryDate
  };
  permits.push(newPermit);
  res.status(201).json(newPermit);
});

// PUT update permit
router.put('/:id', (req, res) => {
  const index = permits.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Permit not found' });
  permits[index] = { ...permits[index], ...req.body };
  res.json(permits[index]);
});

// DELETE permit
router.delete('/:id', (req, res) => {
  const index = permits.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Permit not found' });
  permits.splice(index, 1);
  res.json({ message: 'Permit deleted successfully' });
});

module.exports = router;