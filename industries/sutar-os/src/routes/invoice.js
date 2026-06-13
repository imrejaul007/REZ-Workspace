/**
 * SUTAR OS - Invoice Routes
 */

const express = require('express');
const router = express.Router();

let invoices = [
  { id: 'INV-001', number: 'INV-2024-001', customer: 'Customer A', amount: 50000, status: 'sent', dueDate: '2024-02-15' }
];

router.get('/', (req, res) => {
  const { status } = req.query;
  let filtered = [...invoices];
  if (status) filtered = filtered.filter(i => i.status === status);
  res.json({ invoices: filtered, count: filtered.length });
});

router.post('/', (req, res) => {
  const { customer, amount, dueDate } = req.body;
  if (!customer || !amount) return res.status(400).json({ error: 'customer and amount required' });
  const newInvoice = { id: `INV-${Date.now()}`, number: `INV-${Date.now()}`, customer, amount, status: 'draft', dueDate: dueDate || null };
  invoices.push(newInvoice);
  res.status(201).json(newInvoice);
});

module.exports = router;