const express = require('express');
const router = express.Router();

let accounts = [
  { id: '1', customerId: '1', type: 'savings', balance: 50000, status: 'active' },
  { id: '2', customerId: '1', type: 'checking', balance: 15000, status: 'active' },
  { id: '3', customerId: '2', type: 'savings', balance: 120000, status: 'active' },
  { id: '4', customerId: '3', type: 'current', balance: 25000, status: 'active' }
];

// GET all accounts
router.get('/', (req, res) => {
  res.json(accounts);
});

// GET single account
router.get('/:id', (req, res) => {
  const account = accounts.find(a => a.id === req.params.id);
  if (!account) return res.status(404).json({ error: 'Account not found' });
  res.json(account);
});

// POST new account
router.post('/', (req, res) => {
  const newAccount = {
    id: String(accounts.length + 1),
    customerId: req.body.customerId,
    type: req.body.type,
    balance: req.body.balance || 0,
    status: req.body.status || 'active'
  };
  accounts.push(newAccount);
  res.status(201).json(newAccount);
});

// PUT update account
router.put('/:id', (req, res) => {
  const index = accounts.findIndex(a => a.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Account not found' });
  accounts[index] = { ...accounts[index], ...req.body };
  res.json(accounts[index]);
});

// DELETE account
router.delete('/:id', (req, res) => {
  const index = accounts.findIndex(a => a.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Account not found' });
  accounts.splice(index, 1);
  res.json({ message: 'Account deleted successfully' });
});

module.exports = router;