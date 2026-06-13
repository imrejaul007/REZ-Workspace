/**
 * SUTAR OS - Budget Routes
 */

const express = require('express');
const router = express.Router();

let budgets = [
  { id: 'BUD-001', category: 'marketing', allocated: 100000, spent: 45000, period: 'Q1-2024', status: 'active' }
];

router.get('/', (req, res) => res.json({ budgets, count: budgets.length }));

router.post('/', (req, res) => {
  const { category, allocated, period } = req.body;
  if (!category || !allocated) return res.status(400).json({ error: 'category and allocated required' });
  const newBudget = { id: `BUD-${Date.now()}`, category, allocated, spent: 0, period: period || 'monthly', status: 'active' };
  budgets.push(newBudget);
  res.status(201).json(newBudget);
});

module.exports = router;