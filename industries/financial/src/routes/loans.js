const express = require('express');
const router = express.Router();

let loans = [
  { id: '1', customerId: '1', type: 'home', amount: 5000000, status: 'active', emi: 45000 },
  { id: '2', customerId: '2', type: 'car', amount: 800000, status: 'active', emi: 15000 },
  { id: '3', customerId: '3', type: 'personal', amount: 200000, status: 'pending', emi: 5000 },
  { id: '4', customerId: '4', type: 'education', amount: 1000000, status: 'active', emi: 12000 }
];

// GET all loans
router.get('/', (req, res) => {
  res.json(loans);
});

// GET single loan
router.get('/:id', (req, res) => {
  const loan = loans.find(l => l.id === req.params.id);
  if (!loan) return res.status(404).json({ error: 'Loan not found' });
  res.json(loan);
});

// POST new loan
router.post('/', (req, res) => {
  const newLoan = {
    id: String(loans.length + 1),
    customerId: req.body.customerId,
    type: req.body.type,
    amount: req.body.amount,
    status: req.body.status || 'pending',
    emi: req.body.emi || 0
  };
  loans.push(newLoan);
  res.status(201).json(newLoan);
});

// PUT update loan
router.put('/:id', (req, res) => {
  const index = loans.findIndex(l => l.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Loan not found' });
  loans[index] = { ...loans[index], ...req.body };
  res.json(loans[index]);
});

// DELETE loan
router.delete('/:id', (req, res) => {
  const index = loans.findIndex(l => l.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Loan not found' });
  loans.splice(index, 1);
  res.json({ message: 'Loan deleted successfully' });
});

module.exports = router;