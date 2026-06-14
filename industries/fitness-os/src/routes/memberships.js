const express = require('express');
const router = express.Router();

let memberships = [
  { id: '1', memberId: 'M001', type: 'premium', startDate: '2024-01-01', endDate: '2025-01-01', status: 'active', price: 99.99 },
  { id: '2', memberId: 'M002', type: 'vip', startDate: '2024-02-01', endDate: '2025-02-01', status: 'active', price: 149.99 },
  { id: '3', memberId: 'M003', type: 'basic', startDate: '2024-03-01', endDate: '2025-03-01', status: 'active', price: 49.99 }
];

// GET all memberships
router.get('/', (req, res) => {
  res.json(memberships);
});

// GET single membership
router.get('/:id', (req, res) => {
  const membership = memberships.find(m => m.id === req.params.id);
  if (!membership) return res.status(404).json({ error: 'Membership not found' });
  res.json(membership);
});

// POST new membership
router.post('/', (req, res) => {
  const newMembership = {
    id: String(memberships.length + 1),
    memberId: req.body.memberId,
    type: req.body.type || 'basic',
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    status: req.body.status || 'active',
    price: req.body.price || 49.99
  };
  memberships.push(newMembership);
  res.status(201).json(newMembership);
});

// PUT update membership
router.put('/:id', (req, res) => {
  const index = memberships.findIndex(m => m.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Membership not found' });
  memberships[index] = { ...memberships[index], ...req.body };
  res.json(memberships[index]);
});

// DELETE membership
router.delete('/:id', (req, res) => {
  const index = memberships.findIndex(m => m.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Membership not found' });
  memberships.splice(index, 1);
  res.json({ message: 'Membership deleted successfully' });
});

module.exports = router;
