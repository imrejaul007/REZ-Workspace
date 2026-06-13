/**
 * BOA OS - Decisions Routes
 */

const express = require('express');
const router = express.Router();

let decisions = [
  { id: 'DEC-001', title: 'Approve Q1 Budget', executive: 'CFO', type: 'financial', status: 'approved', impact: 'high', date: '2024-01-15' }
];

router.get('/', (req, res) => {
  const { executive, status, type } = req.query;
  let filtered = [...decisions];
  if (executive) filtered = filtered.filter(d => d.executive === executive);
  if (status) filtered = filtered.filter(d => d.status === status);
  if (type) filtered = filtered.filter(d => d.type === type);
  res.json({ decisions: filtered, count: filtered.length });
});

router.post('/', (req, res) => {
  const { title, executive, type, impact } = req.body;
  if (!title || !executive) return res.status(400).json({ error: 'title and executive required' });
  const newDecision = { id: `DEC-${Date.now()}`, title, executive, type: type || 'general', status: 'pending', impact: impact || 'medium', date: new Date().toISOString() };
  decisions.push(newDecision);
  res.status(201).json(newDecision);
});

router.patch('/:id/approve', (req, res) => {
  const decision = decisions.find(d => d.id === req.params.id);
  if (!decision) return res.status(404).json({ error: 'Decision not found' });
  decision.status = 'approved';
  res.json(decision);
});

module.exports = router;