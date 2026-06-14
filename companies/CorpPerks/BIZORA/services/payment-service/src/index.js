/**
 * BIZORA Payment Service
 */

const express = require('express');
const app = express();
app.use(express.json());

const PAYMENT_ENV = process.env.PAYMENT_ENV || 'demo';

// Storage
const payments = new Map();
const orders = new Map();
const invoices = new Map();
const escrows = new Map();
const customers = new Map();

// Helpers
function genId(prefix) { return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8); }
function toPaise(amt) { return Math.round(amt * 100); }
function fromPaise(p) { return p / 100; }

// Customers
app.post('/api/customers', (req, res) => {
  const { name, email, phone, gstin } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email required' });
  const id = genId('cust');
  const customer = { id, name, email, phone, gstin, createdAt: new Date().toISOString() };
  customers.set(id, customer);
  res.status(201).json({ success: true, customer });
});

app.get('/api/customers/:id', (req, res) => {
  const c = customers.get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true, customer: c });
});

// Orders
app.post('/api/orders', (req, res) => {
  const { amount, customerId, customerEmail, description } = req.body;
  if (!amount || !customerId) return res.status(400).json({ error: 'Amount and customerId required' });
  const id = genId('order');
  const order = {
    id,
    amount: toPaise(amount),
    status: 'created',
    customerId,
    customerEmail,
    description,
    receipt: 'RCP' + Date.now(),
    payments: [],
    createdAt: new Date().toISOString()
  };
  orders.set(id, order);
  res.json({
    success: true,
    order: { ...order, amount: fromPaise(order.amount) },
    razorpayOrderId: 'demo_' + id
  });
});

app.get('/api/orders/:id', (req, res) => {
  const o = orders.get(req.params.id);
  if (!o) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true, order: { ...o, amount: fromPaise(o.amount) } });
});

// Payment Links
app.post('/api/payment-links', (req, res) => {
  const { amount, customerEmail, description } = req.body;
  if (!amount || !customerEmail) return res.status(400).json({ error: 'Amount and email required' });
  const id = genId('plink');
  const link = {
    id,
    url: 'https://rzp.io/i/' + id,
    amount: toPaise(amount),
    currency: 'INR',
    status: 'created',
    customerEmail,
    description,
    createdAt: new Date().toISOString()
  };
  res.json({
    success: true,
    paymentLink: { ...link, amount: fromPaise(link.amount) }
  });
});

// Invoices
app.post('/api/invoices', (req, res) => {
  const { customerId, customerName, customerEmail, lineItems, taxRate = 18, dueDate } = req.body;
  if (!customerId || !customerName || !customerEmail || !lineItems?.length) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const id = genId('inv');
  const subtotal = lineItems.reduce((s, i) => s + (i.amount * i.quantity), 0);
  const tax = Math.round(subtotal * taxRate / 100);
  const invoice = {
    id,
    customerId,
    customerName,
    customerEmail,
    lineItems,
    subtotal,
    tax,
    taxRate,
    total: subtotal + tax,
    status: 'draft',
    dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString()
  };
  invoices.set(id, invoice);
  res.status(201).json({ success: true, invoice });
});

app.get('/api/invoices/:id', (req, res) => {
  const inv = invoices.get(req.params.id);
  if (!inv) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true, invoice: inv });
});

app.get('/api/invoices', (req, res) => {
  res.json({ success: true, invoices: Array.from(invoices.values()) });
});

// ESCROW - Key Feature
app.post('/api/escrow/hold', (req, res) => {
  const { orderId, amount, customerId, vendorId } = req.body;
  if (!orderId || !amount || !customerId || !vendorId) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const id = genId('escrow');
  const escrow = {
    id,
    orderId,
    amount: toPaise(amount),
    currency: 'INR',
    status: 'held',
    customerId,
    vendorId,
    releaseConditions: ['delivery_confirmed', 'customer_approval'],
    createdAt: new Date().toISOString()
  };
  escrows.set(id, escrow);
  res.status(201).json({
    success: true,
    escrow: { ...escrow, amount: fromPaise(escrow.amount) },
    message: 'Funds held in escrow'
  });
});

app.post('/api/escrow/:id/release', (req, res) => {
  const e = escrows.get(req.params.id);
  if (!e) return res.status(404).json({ error: 'Not found' });
  if (e.status !== 'held') return res.status(400).json({ error: 'Already released' });
  e.status = 'released';
  e.releasedAt = new Date().toISOString();
  e.releasedTo = e.vendorId;
  escrows.set(e.id, e);
  res.json({
    success: true,
    escrow: { ...e, amount: fromPaise(e.amount) },
    message: 'Funds released to vendor'
  });
});

app.get('/api/escrow/:id', (req, res) => {
  const e = escrows.get(req.params.id);
  if (!e) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true, escrow: { ...e, amount: fromPaise(e.amount) } });
});

// Dashboard
app.get('/api/dashboard/summary', (req, res) => {
  const allOrders = Array.from(orders.values());
  const allEscrows = Array.from(escrows.values());
  res.json({
    success: true,
    summary: {
      orders: { total: allOrders.length, paid: allOrders.filter(o => o.status === 'paid').length },
      escrow: {
        held: allEscrows.filter(e => e.status === 'held').length,
        released: allEscrows.filter(e => e.status === 'released').length,
        heldAmount: allEscrows.filter(e => e.status === 'held').reduce((s, e) => s + fromPaise(e.amount), 0)
      }
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'payment-service',
    env: PAYMENT_ENV,
    stats: {
      customers: customers.size,
      orders: orders.size,
      invoices: invoices.size,
      escrows: escrows.size
    }
  });
});

const PORT = process.env.PORT || 4101;
app.listen(PORT, () => {
  console.log('💰 Payment Service running on port ' + PORT);
  console.log('   Features: Customers, Orders, Payment Links, Invoices, ESCROW');
});
