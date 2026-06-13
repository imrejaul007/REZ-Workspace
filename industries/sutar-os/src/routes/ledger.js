/**
 * SUTAR OS - Ledger Routes
 */

const express = require('express');
const router = express.Router();

let entries = [
  { id: 'LED-001', date: '2024-01-15', account: 'revenue', description: 'Sales', debit: 0, credit: 50000, balance: 50000 },
  { id: 'LED-002', date: '2024-01-15', account: 'cash', description: 'Sales', debit: 50000, credit: 0, balance: 50000 }
];

router.get('/', (req, res) => {
  const { account, startDate, endDate } = req.query;
  let filtered = [...entries];
  if (account) filtered = filtered.filter(e => e.account === account);
  res.json({ entries: filtered, count: filtered.length });
});

router.post('/', (req, res) => {
  const { date, account, description, debit, credit } = req.body;
  if (!date || !account || !description) return res.status(400).json({ error: 'date, account, description required' });
  const newEntry = { id: `LED-${Date.now()}`, date, account, description, debit: debit || 0, credit: credit || 0, balance: 0 };
  entries.push(newEntry);
  res.status(201).json(newEntry);
});

module.exports = router;