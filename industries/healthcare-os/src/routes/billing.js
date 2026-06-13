/**
 * Billing Routes
 */

import { Router } from 'express';

export const billingRoutes = Router();

const bills = new Map();

billingRoutes.get('/', (req, res) => {
  res.json({ bills: Array.from(bills.values()), total: bills.size });
});

billingRoutes.get('/:id', (req, res) => {
  res.json(bills.get(req.params.id) || { error: 'Bill not found' });
});

billingRoutes.post('/', (req, res) => {
  const id = `BILL-${Date.now()}`;
  bills.set(id, { id, ...req.body, status: 'pending' });
  res.status(201).json(bills.get(id));
});

billingRoutes.patch('/:id/pay', (req, res) => {
  const bill = bills.get(req.params.id);
  if (!bill) return res.status(404).json({ error: 'Bill not found' });
  bill.status = 'paid';
  bill.paidAt = new Date().toISOString();
  res.json(bill);
});
