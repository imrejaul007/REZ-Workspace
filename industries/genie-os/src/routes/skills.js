/**
 * Genie OS - Skills Routes
 */

const express = require('express');
const router = express.Router();

let skills = [
  { id: 'SKL-001', name: 'Report Generation', type: 'skill', capabilities: ['sales', 'financial', 'operational'], status: 'active' },
  { id: 'SKL-002', name: 'Data Analysis', type: 'skill', capabilities: ['trends', 'predictions', 'comparisons'], status: 'active' }
];

router.get('/', (req, res) => {
  const { type, status } = req.query;
  let filtered = [...skills];
  if (type) filtered = filtered.filter(s => s.type === type);
  if (status) filtered = filtered.filter(s => s.status === status);
  res.json({ skills: filtered, count: filtered.length });
});

router.post('/', (req, res) => {
  const { name, capabilities } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const newSkill = { id: `SKL-${Date.now()}`, name, type: 'skill', capabilities: capabilities || [], status: 'active' };
  skills.push(newSkill);
  res.status(201).json(newSkill);
});

module.exports = router;