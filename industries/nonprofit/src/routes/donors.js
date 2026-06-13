const express = require('express');
const router = express.Router();

let donors = [
  { id: '1', name: 'John Foundation', email: 'contact@johnfoundation.org', type: 'corporate', totalDonated: 500000 },
  { id: '2', name: 'Sarah Johnson', email: 'sarah.j@email.com', type: 'individual', totalDonated: 25000 },
  { id: '3', name: 'Tech Corp Ltd', email: 'csr@techcorp.com', type: 'corporate', totalDonated: 100000 },
  { id: '4', name: 'Michael Chen', email: 'mchen@email.com', type: 'individual', totalDonated: 15000 }
];

// GET all donors
router.get('/', (req, res) => {
  res.json(donors);
});

// GET single donor
router.get('/:id', (req, res) => {
  const donor = donors.find(d => d.id === req.params.id);
  if (!donor) return res.status(404).json({ error: 'Donor not found' });
  res.json(donor);
});

// POST new donor
router.post('/', (req, res) => {
  const newDonor = {
    id: String(donors.length + 1),
    name: req.body.name,
    email: req.body.email,
    type: req.body.type || 'individual',
    totalDonated: req.body.totalDonated || 0
  };
  donors.push(newDonor);
  res.status(201).json(newDonor);
});

// PUT update donor
router.put('/:id', (req, res) => {
  const index = donors.findIndex(d => d.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Donor not found' });
  donors[index] = { ...donors[index], ...req.body };
  res.json(donors[index]);
});

// DELETE donor
router.delete('/:id', (req, res) => {
  const index = donors.findIndex(d => d.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Donor not found' });
  donors.splice(index, 1);
  res.json({ message: 'Donor deleted successfully' });
});

module.exports = router;