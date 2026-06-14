/**
 * REZ NexTabizz Service
 * QR-based ordering platform for restaurants
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// Schemas
const sessionSchema = new mongoose.Schema({
  merchantId: String, tableId: String, sessionId: String,
  customerId: String, customerName: String,
  status: { type: String, enum: ['active', 'ordering', 'paid', 'closed'], default: 'active' },
  createdAt: Date, expiresAt: Date
});
const Session = mongoose.models.Session || mongoose.model('Session', sessionSchema);

const orderSchema = new mongoose.Schema({
  sessionId: String, merchantId: String, tableId: String,
  items: [{ itemId: String, name: String, qty: Number, price: Number, notes: String }],
  subtotal: Number, tax: Number, total: Number,
  status: { type: String, enum: ['cart', 'confirmed', 'preparing', 'ready', 'served', 'paid'], default: 'cart' },
  paymentMethod: String,
  createdAt: Date, updatedAt: Date
});
const Order = mongoose.models.NexTabizzOrder || mongoose.model('NexTabizzOrder', orderSchema);

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'REZ-nexTabizz' }));

// Sessions
app.post('/api/sessions', async (req, res) => {
  const session = new Session({ ...req.body, createdAt: new Date(), expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) });
  await session.save();
  res.json({ success: true, data: session });
});

app.get('/api/sessions/:merchantId', async (req, res) => {
  const sessions = await Session.find({ merchantId: req.params.merchantId, status: 'active' });
  res.json({ success: true, data: sessions });
});

app.get('/api/sessions/scan/:tableId', async (req, res) => {
  const session = await Session.findOne({ tableId: req.params.tableId, status: 'active' });
  res.json({ success: true, data: session || { notFound: true } });
});

app.put('/api/sessions/:id/status', async (req, res) => {
  const session = await Session.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, data: session });
});

// Orders
app.post('/api/orders', async (req, res) => {
  const order = new Order({ ...req.body, createdAt: new Date(), updatedAt: new Date() });
  await order.save();
  res.json({ success: true, data: order });
});

app.get('/api/orders/:sessionId', async (req, res) => {
  const orders = await Order.find({ sessionId: req.params.sessionId });
  res.json({ success: true, data: orders });
});

app.put('/api/orders/:id/items', async (req, res) => {
  const { items } = req.body;
  const subtotal = items.reduce((sum: number, i: any) => sum + i.price * i.qty, 0);
  const order = await Order.findByIdAndUpdate(req.params.id, { items, subtotal, tax: subtotal * 0.18, total: subtotal * 1.18, updatedAt: new Date() }, { new: true });
  res.json({ success: true, data: order });
});

app.put('/api/orders/:id/confirm', async (req, res) => {
  const order = await Order.findByIdAndUpdate(req.params.id, { status: 'confirmed', updatedAt: new Date() }, { new: true });
  res.json({ success: true, data: order });
});

app.put('/api/orders/:id/pay', async (req, res) => {
  const { paymentMethod } = req.body;
  const order = await Order.findByIdAndUpdate(req.params.id, { status: 'paid', paymentMethod, updatedAt: new Date() }, { new: true });
  if (order) {
    await Session.findByIdAndUpdate(order.sessionId, { status: 'paid' });
  }
  res.json({ success: true, data: order });
});

app.put('/api/orders/:id/status', async (req, res) => {
  const order = await Order.findByIdAndUpdate(req.params.id, { ...req.body, updatedAt: new Date() }, { new: true });
  res.json({ success: true, data: order });
});

// Menu
app.get('/api/menu/:merchantId', async (req, res) => {
  res.json({ success: true, data: { categories: [], items: [] } });
});

app.post('/api/menu/:merchantId/items', async (req, res) => {
  res.json({ success: true, data: req.body });
});

const PORT = process.env.PORT || 4058;
app.listen(PORT, () => logger.info(`REZ-nexTabizz running on port ${PORT}`));

export default app;
