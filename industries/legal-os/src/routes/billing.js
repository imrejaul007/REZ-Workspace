/**
 * Legal OS - Billing Management Routes
 */

const express = require('express');
const router = express.Router();

// In-memory billing storage
let invoices = [
  {
    id: 'inv-001',
    invoiceNumber: 'INV-2024-001',
    clientId: 'client-001',
    caseId: 'case-001',
    items: [
      { description: 'Legal consultation', hours: 2, rate: 350, amount: 700 },
      { description: 'Document preparation', hours: 3, rate: 350, amount: 1050 }
    ],
    totalAmount: 1750,
    status: 'sent',
    dueDate: '2024-02-15',
    paidDate: null,
    createdAt: new Date().toISOString()
  }
];

// GET /api/billing - List all invoices
router.get('/', (req, res) => {
  const { clientId, status } = req.query;
  let filtered = [...invoices];

  if (clientId) filtered = filtered.filter(i => i.clientId === clientId);
  if (status) filtered = filtered.filter(i => i.status === status);

  res.json({ invoices: filtered, count: filtered.length });
});

// GET /api/billing/:id - Get invoice by ID
router.get('/:id', (req, res) => {
  const invoice = invoices.find(i => i.id === req.params.id);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  res.json(invoice);
});

// POST /api/billing - Create new invoice
router.post('/', (req, res) => {
  const { clientId, caseId, items } = req.body;

  if (!clientId || !items || !Array.isArray(items)) {
    return res.status(400).json({ error: 'clientId and items array are required' });
  }

  const totalAmount = items.reduce((sum, item) => sum + (item.amount || item.hours * item.rate), 0);

  const newInvoice = {
    id: `inv-${Date.now()}`,
    invoiceNumber: `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`,
    clientId,
    caseId: caseId || null,
    items,
    totalAmount,
    status: 'draft',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    paidDate: null,
    createdAt: new Date().toISOString()
  };

  invoices.push(newInvoice);
  res.status(201).json(newInvoice);
});

// PUT /api/billing/:id - Update invoice
router.put('/:id', (req, res) => {
  const index = invoices.findIndex(i => i.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Invoice not found' });

  invoices[index] = { ...invoices[index], ...req.body, updatedAt: new Date().toISOString() };
  res.json(invoices[index]);
});

// POST /api/billing/:id/mark-paid - Mark invoice as paid
router.post('/:id/mark-paid', (req, res) => {
  const invoice = invoices.find(i => i.id === req.params.id);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

  invoice.status = 'paid';
  invoice.paidDate = new Date().toISOString();
  res.json(invoice);
});

// GET /api/billing/analytics - Billing analytics
router.get('/analytics', (req, res) => {
  const totalBilled = invoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.totalAmount, 0);
  const outstanding = invoices.filter(i => i.status !== 'paid').reduce((sum, i) => sum + i.totalAmount, 0);

  res.json({
    totalInvoices: invoices.length,
    totalBilled,
    totalPaid,
    outstanding,
    collectionRate: totalBilled > 0 ? ((totalPaid / totalBilled) * 100).toFixed(2) + '%' : '0%'
  });
});

module.exports = router;