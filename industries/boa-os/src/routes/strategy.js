/**
 * BOA OS - Strategy Routes
 */

const express = require('express');
const router = express.Router();

let strategies = [
  { id: 'STR-001', title: 'Q1 Growth Strategy', executive: 'CEO', objectives: ['Market Expansion', 'Product Launch'], status: 'active', createdAt: '2024-01-01' }
];

router.get('/', (req, res) => {
  const { executive, status } = req.query;
  let filtered = [...strategies];
  if (executive) filtered = filtered.filter(s => s.executive === executive);
  if (status) filtered = filtered.filter(s => s.status === status);
  res.json({ strategies: filtered, count: filtered.length });
});

router.post('/', (req, res) => {
  const { title, executive, objectives } = req.body;
  if (!title || !executive) return res.status(400).json({ error: 'title and executive required' });
  const newStrategy = { id: `STR-${Date.now()}`, title, executive, objectives: objectives || [], status: 'draft', createdAt: new Date().toISOString() };
  strategies.push(newStrategy);
  res.status(201).json(newStrategy);
});

module.exports = router;