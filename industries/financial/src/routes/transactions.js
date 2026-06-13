const express = require('express');
const router = express.Router();

let transactions = [
  { id: '1', accountId: '1', type: 'credit', amount: 5000, date: '2024-06-01', status: 'completed' },
  { id: '2', accountId: '1', type: 'debit', amount: 2000, date: '2024-06-05', status: 'completed' },
  { id: '3', accountId: '2', type: 'transfer', amount: 10000, date: '2024-06-10', status: 'completed' },
  { id: '4', accountId: '3', type: 'credit', amount: 25000, date: '2024-06-12', status: 'pending' }
];

// GET all transactions
router.get('/', (req, res) => {
  res.json(transactions);
});

// GET single transaction
router.get('/:id', (req, res) => {
  const transaction = transactions.find(t => t.id === req.params.id);
  if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
  res.json(transaction);
});

// POST new transaction
router.post('/', (req, res) => {
  const newTransaction = {
    id: String(transactions.length + 1),
    accountId: req.body.accountId,
    type: req.body.type,
    amount: req.body.amount,
    date: new Date().toISOString().split('T')[0],
    status: req.body.status || 'pending'
  };
  transactions.push(newTransaction);
  res.status(201).json(newTransaction);
});

// PUT update transaction
router.put('/:id', (req, res) => {
  const index = transactions.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Transaction not found' });
  transactions[index] = { ...transactions[index], ...req.body };
  res.json(transactions[index]);
});

// DELETE transaction
router.delete('/:id', (req, res) => {
  const index = transactions.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Transaction not found' });
  transactions.splice(index, 1);
  res.json({ message: 'Transaction deleted successfully' });
});

module.exports = router;