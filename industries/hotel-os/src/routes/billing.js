/**
 * Hotel OS - Billing Routes
 */

const express = require('express');
const router = express.Router();

let invoices = [
  { id: 'INV-001', guestId: 'GUEST-001', reservationId: 'RES-001', items: [{ description: 'Room (3 nights)', amount: 15000 }], total: 15000, status: 'pending', createdAt: '2024-01-15' },
  { id: 'INV-002', guestId: 'GUEST-002', reservationId: 'RES-002', items: [{ description: 'Room (6 nights)', amount: 51000 }, { description: 'Spa', amount: 2500 }], total: 53500, status: 'paid', createdAt: '2024-01-14' }
];

router.get('/', (req, res) => {
  const { guestId, status } = req.query;
  let filtered = [...invoices];
  if (guestId) filtered = filtered.filter(i => i.guestId === guestId);
  if (status) filtered = filtered.filter(i => i.status === status);
  res.json({ invoices: filtered, count: filtered.length });
});

router.get('/:id', (req, res) => {
  const invoice = invoices.find(i => i.id === req.params.id);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  res.json(invoice);
});

router.post('/', (req, res) => {
  const { guestId, reservationId, items } = req.body;
  if (!guestId || !items) return res.status(400).json({ error: 'guestId and items required' });
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  const newInvoice = { id: `INV-${Date.now()}`, guestId, reservationId: reservationId || null, items, total, status: 'pending', createdAt: new Date().toISOString() };
  invoices.push(newInvoice);
  res.status(201).json(newInvoice);
});

router.patch('/:id/status', (req, res) => {
  const invoice = invoices.find(i => i.id === req.params.id);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  invoice.status = req.body.status;
  res.json(invoice);
});

router.get('/analytics', (req, res) => {
  const totalRevenue = invoices.reduce((sum, i) => sum + i.total, 0);
  const paidRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0);
  const pendingRevenue = invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.total, 0);
  res.json({ totalRevenue, paidRevenue, pendingRevenue, invoiceCount: invoices.length });
});

module.exports = router;
