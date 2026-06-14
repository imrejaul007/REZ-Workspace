const express = require('express');
const router = express.Router();

let customers = [
  { id: '1', name: 'Rajesh Gupta', email: 'rajesh@email.com', kycStatus: 'verified' },
  { id: '2', name: 'Priya Sharma', email: 'priya@email.com', kycStatus: 'verified' },
  { id: '3', name: 'Amit Patel', email: 'amit@email.com', kycStatus: 'pending' },
  { id: '4', name: 'Sneha Singh', email: 'sneha@email.com', kycStatus: 'verified' }
];

// GET all customers
router.get('/', (req, res) => {
  res.json(customers);
});

// GET single customer
router.get('/:id', (req, res) => {
  const customer = customers.find(c => c.id === req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  res.json(customer);
});

// POST new customer
router.post('/', (req, res) => {
  const newCustomer = {
    id: String(customers.length + 1),
    name: req.body.name,
    email: req.body.email,
    kycStatus: req.body.kycStatus || 'pending'
  };
  customers.push(newCustomer);
  res.status(201).json(newCustomer);
});

// PUT update customer
router.put('/:id', (req, res) => {
  const index = customers.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Customer not found' });
  customers[index] = { ...customers[index], ...req.body };
  res.json(customers[index]);
});

// DELETE customer
router.delete('/:id', (req, res) => {
  const index = customers.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Customer not found' });
  customers.splice(index, 1);
  res.json({ message: 'Customer deleted successfully' });
});

module.exports = router;