/**
 * SUTAR OS - Expense Routes
 */

const express = require('express');
const router = express.Router();

let expenses = [
  { id: 'EXP-001', category: 'utilities', amount: 5000, description: 'Electricity bill', date: '2024-01-10', status: 'approved' }
];

router.get('/', (req, res) => {
  const { category } = req.query;
  let filtered = [...expenses];
  if (category) filtered = filtered.filter(e => e.category === category);
  res.json({ expenses: filtered, count: filtered.length });
});

router.post('/', (req, res) => {
  const { category, amount, description } = req.body;
  if (!category || !amount) return res.status(400).json({ error: 'category and amount required' });
  const newExpense = { id: `EXP-${Date.now()}`, category, amount, description: description || '', date: new Date().toISOString(), status: 'pending' };
  expenses.push(newExpense);
  res.status(201).json(newExpense);
});

module.exports = router;