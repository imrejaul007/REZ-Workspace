const express = require('express');
const router = express.Router();

let customers = [
  { id: '1', name: 'Amit Sharma', address: '123 Green Park, Delhi', phone: '9876543210' },
  { id: '2', name: 'Priya Patel', address: '456 MG Road, Mumbai', phone: '9876543211' },
  { id: '3', name: 'Vikram Singh', address: '789 Brigade Rd, Bangalore', phone: '9876543212' },
  { id: '4', name: 'Neha Gupta', address: '321 Park Street, Kolkata', phone: '9876543213' }
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
    address: req.body.address,
    phone: req.body.phone
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