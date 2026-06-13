/**
 * Retail OS - Customers Routes
 */

const express = require('express');
const router = express.Router();

let customers = [
  { id: 'CUST-001', name: 'Rahul Sharma', email: 'rahul@email.com', phone: '9876543210', loyaltyPoints: 2500, tier: 'gold' },
  { id: 'CUST-002', name: 'Priya Patel', email: 'priya@email.com', phone: '9876543211', loyaltyPoints: 1200, tier: 'silver' }
];

// GET /api/customers
router.get('/', (req, res) => {
  const { tier } = req.query;
  let filtered = [...customers];
  if (tier) filtered = filtered.filter(c => c.tier === tier);
  res.json({ customers: filtered, count: filtered.length });
});

// GET /api/customers/:id
router.get('/:id', (req, res) => {
  const customer = customers.find(c => c.id === req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  res.json(customer);
});

// POST /api/customers
router.post('/', (req, res) => {
  const { name, email, phone } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });

  const newCustomer = { id: `CUST-${Date.now()}`, name, email: email || null, phone: phone || null, loyaltyPoints: 0, tier: 'bronze' };
  customers.push(newCustomer);
  res.status(201).json(newCustomer);
});

// PUT /api/customers/:id
router.put('/:id', (req, res) => {
  const index = customers.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Customer not found' });
  customers[index] = { ...customers[index], ...req.body };
  res.json(customers[index]);
});

// POST /api/customers/:id/points
router.post('/:id/points', (req, res) => {
  const customer = customers.find(c => c.id === req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  customer.loyaltyPoints += req.body.points || 0;
  res.json(customer);
});

module.exports = router;