/**
 * Automotive OS - Customers Routes
 */

const express = require('express');
const router = express.Router();

let customers = [
  { id: 'CUST-001', name: 'John Smith', email: 'john@email.com', phone: '9876543210', vehicleId: 'VEH-001', purchaseDate: '2024-01-10', status: 'active' },
  { id: 'CUST-002', name: 'Jane Doe', email: 'jane@email.com', phone: '9876543211', vehicleId: 'VEH-002', purchaseDate: '2023-06-15', status: 'active' }
];

router.get('/', (req, res) => {
  const { status } = req.query;
  let filtered = [...customers];
  if (status) filtered = filtered.filter(c => c.status === status);
  res.json({ customers: filtered, count: filtered.length });
});

router.get('/:id', (req, res) => {
  const customer = customers.find(c => c.id === req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  res.json(customer);
});

router.post('/', (req, res) => {
  const { name, email, phone } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const newCustomer = { id: `CUST-${Date.now()}`, name, email: email || null, phone: phone || null, vehicleId: null, purchaseDate: null, status: 'active' };
  customers.push(newCustomer);
  res.status(201).json(newCustomer);
});

module.exports = router;