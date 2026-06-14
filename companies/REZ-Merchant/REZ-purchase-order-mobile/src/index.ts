/**
 * REZ Purchase Order Mobile Service
 * Mobile backend for purchase orders
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
const poSchema = new mongoose.Schema({
  merchantId: String,
  supplierId: String,
  supplierName: String,
  items: [{
    itemId: String,
    name: String,
    qty: Number,
    unit: String,
    price: Number,
    amount: Number
  }],
  subtotal: Number,
  taxAmount: Number,
  totalAmount: Number,
  status: { type: String, enum: ['draft', 'pending', 'approved', 'ordered', 'partial', 'received', 'cancelled'], default: 'draft' },
  expectedDelivery: Date,
  notes: String,
  createdBy: String,
  approvedBy: String,
  createdAt: Date,
  updatedAt: Date
});
const PurchaseOrder = mongoose.models.PurchaseOrder || mongoose.model('PurchaseOrder', poSchema);

// Routes
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'REZ-purchase-order-mobile' }));

app.post('/api/purchase-orders', async (req, res) => {
  const po = new PurchaseOrder({ ...req.body, createdAt: new Date() });
  await po.save();
  res.json({ success: true, data: po });
});

app.get('/api/purchase-orders/:merchantId', async (req, res) => {
  const { status } = req.query;
  const query: any = { merchantId: req.params.merchantId };
  if (status) query.status = status;
  const pos = await PurchaseOrder.find(query).sort({ createdAt: -1 });
  res.json({ success: true, data: pos });
});

app.get('/api/purchase-orders/detail/:id', async (req, res) => {
  const po = await PurchaseOrder.findById(req.params.id);
  res.json({ success: true, data: po });
});

app.put('/api/purchase-orders/:id', async (req, res) => {
  const po = await PurchaseOrder.findByIdAndUpdate(req.params.id, { ...req.body, updatedAt: new Date() }, { new: true });
  res.json({ success: true, data: po });
});

app.put('/api/purchase-orders/:id/approve', async (req, res) => {
  const { approvedBy } = req.body;
  const po = await PurchaseOrder.findByIdAndUpdate(req.params.id, { status: 'approved', approvedBy, updatedAt: new Date() }, { new: true });
  res.json({ success: true, data: po });
});

app.put('/api/purchase-orders/:id/reject', async (req, res) => {
  const { reason } = req.body;
  const po = await PurchaseOrder.findByIdAndUpdate(req.params.id, { status: 'cancelled', notes: reason, updatedAt: new Date() }, { new: true });
  res.json({ success: true, data: po });
});

app.put('/api/purchase-orders/:id/order', async (req, res) => {
  const po = await PurchaseOrder.findByIdAndUpdate(req.params.id, { status: 'ordered', updatedAt: new Date() }, { new: true });
  res.json({ success: true, data: po });
});

app.put('/api/purchase-orders/:id/receive', async (req, res) => {
  const po = await PurchaseOrder.findByIdAndUpdate(req.params.id, { status: 'received', updatedAt: new Date() }, { new: true });
  res.json({ success: true, data: po });
});

app.delete('/api/purchase-orders/:id', async (req, res) => {
  await PurchaseOrder.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

const PORT = process.env.PORT || 4002;
app.listen(PORT, () => logger.info(`REZ-purchase-order-mobile running on port ${PORT}`));

export default app;
