const express = require('express');
const router = express.Router();

let invoices = [
  { id: '1', projectId: '1', amount: 15000, status: 'sent', dueDate: '2024-07-15' },
  { id: '2', projectId: '2', amount: 30000, status: 'paid', dueDate: '2024-05-30' },
  { id: '3', projectId: '3', amount: 20000, status: 'pending', dueDate: '2024-08-01' },
  { id: '4', projectId: '1', amount: 10000, status: 'sent', dueDate: '2024-06-30' }
];

// GET all invoices
router.get('/', (req, res) => {
  res.json(invoices);
});

// GET single invoice
router.get('/:id', (req, res) => {
  const invoice = invoices.find(i => i.id === req.params.id);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  res.json(invoice);
});

// POST new invoice
router.post('/', (req, res) => {
  const newInvoice = {
    id: String(invoices.length + 1),
    projectId: req.body.projectId,
    amount: req.body.amount,
    status: req.body.status || 'pending',
    dueDate: req.body.dueDate
  };
  invoices.push(newInvoice);
  res.status(201).json(newInvoice);
});

// PUT update invoice
router.put('/:id', (req, res) => {
  const index = invoices.findIndex(i => i.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Invoice not found' });
  invoices[index] = { ...invoices[index], ...req.body };
  res.json(invoices[index]);
});

// DELETE invoice
router.delete('/:id', (req, res) => {
  const index = invoices.findIndex(i => i.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Invoice not found' });
  invoices.splice(index, 1);
  res.json({ message: 'Invoice deleted successfully' });
});

module.exports = router;