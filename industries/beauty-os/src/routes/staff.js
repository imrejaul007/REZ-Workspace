/**
 * Beauty OS - Staff Routes
 */

const express = require('express');
const router = express.Router();

let staff = [
  { id: 'STF-001', name: 'Lisa Chen', role: 'stylist', specialties: ['hair', 'color'], schedule: { mon: '9-5', tue: '9-5', wed: 'off' }, status: 'active' },
  { id: 'STF-002', name: 'Maria Garcia', role: 'therapist', specialties: ['spa', 'massage'], schedule: { mon: '10-6', tue: '10-6', wed: '10-6' }, status: 'active' }
];

router.get('/', (req, res) => {
  const { role, status } = req.query;
  let filtered = [...staff];
  if (role) filtered = filtered.filter(s => s.role === role);
  if (status) filtered = filtered.filter(s => s.status === status);
  res.json({ staff: filtered, count: filtered.length });
});

router.get('/:id', (req, res) => {
  const member = staff.find(s => s.id === req.params.id);
  if (!member) return res.status(404).json({ error: 'Staff not found' });
  res.json(member);
});

router.post('/', (req, res) => {
  const { name, role, specialties } = req.body;
  if (!name || !role) return res.status(400).json({ error: 'name and role required' });
  const newMember = { id: `STF-${Date.now()}`, name, role, specialties: specialties || [], schedule: {}, status: 'active' };
  staff.push(newMember);
  res.status(201).json(newMember);
});

module.exports = router;