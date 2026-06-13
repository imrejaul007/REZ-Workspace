/**
 * Customer Routes
 */

import { Router } from 'express';

export const customerRoutes = Router();

const customers = new Map([
  ['CUST-001', {
    id: 'CUST-001',
    name: 'Rahul Sharma',
    phone: '9876543210',
    email: 'rahul@example.com',
    visits: 25,
    totalSpent: 45000,
    loyaltyPoints: 2500,
    dietary: ['non-veg'],
    preferences: ['Spicy food', 'Window seat'],
    lastVisit: new Date().toISOString()
  }]
]);

customerRoutes.get('/', (req, res) => {
  res.json({ customers: Array.from(customers.values()), total: customers.size });
});

customerRoutes.get('/:id', (req, res) => {
  const customer = customers.get(req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  res.json(customer);
});

customerRoutes.post('/', (req, res) => {
  const id = `CUST-${String(customers.size + 1).padStart(3, '0')}`;
  const customer = { id, ...req.body, loyaltyPoints: 0, visits: 0 };
  customers.set(id, customer);
  res.status(201).json(customer);
});

customerRoutes.patch('/:id/points', (req, res) => {
  const customer = customers.get(req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  customer.loyaltyPoints += req.body.points || 0;
  res.json(customer);
});
