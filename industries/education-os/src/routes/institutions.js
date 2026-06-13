/**
 * Education OS - Institutions Routes
 */

const express = require('express');
const router = express.Router();

let institutions = [
  { id: 'INST-001', name: 'Tech University', type: 'university', address: '123 Campus Dr', students: 5000, faculty: 450, accreditation: 'Accredited', status: 'active' },
  { id: 'INST-002', name: 'Code Academy', type: 'bootcamp', address: '456 Learning Ave', students: 200, faculty: 15, accreditation: 'Certified', status: 'active' }
];

router.get('/', (req, res) => {
  const { type, status } = req.query;
  let filtered = [...institutions];
  if (type) filtered = filtered.filter(i => i.type === type);
  if (status) filtered = filtered.filter(i => i.status === status);
  res.json({ institutions: filtered, count: filtered.length });
});

router.get('/:id', (req, res) => {
  const institution = institutions.find(i => i.id === req.params.id);
  if (!institution) return res.status(404).json({ error: 'Institution not found' });
  res.json(institution);
});

router.post('/', (req, res) => {
  const { name, type, address } = req.body;
  if (!name || !type) return res.status(400).json({ error: 'name and type required' });
  const newInstitution = { id: `INST-${Date.now()}`, name, type, address: address || null, students: 0, faculty: 0, accreditation: '', status: 'active' };
  institutions.push(newInstitution);
  res.status(201).json(newInstitution);
});

module.exports = router;
