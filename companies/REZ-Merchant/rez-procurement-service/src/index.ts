/**
 * REZ Procurement Service
 * Supplier and purchase order management
 */
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import winston from 'winston';

const logger = winston.createLogger({ level: 'info', format: winston.format.json(), transports: [new winston.transports.Console()] });
const app = express();
app.use(helmet()); app.use(cors()); app.use(express.json());

const supplierSchema = new mongoose.Schema({
  merchantId: String, name: String, contactPerson: String, phone: String, email: String,
  address: { street: String, city: String, state: String, pincode: String },
  gstNumber: String, panNumber: String,
  items: [{ name: String, category: String, unit: String, price: Number }],
  creditLimit: Number, currentCredit: Number,
  rating: Number, paymentTerms: String,
  bankDetails: { accountNo: String, bank: String, ifsc: String },
  status: { type: String, enum: ['active', 'inactive', 'blocked'], default: 'active' },
  createdAt: Date, updatedAt: Date
});
const Supplier = mongoose.models.Supplier || mongoose.model('Supplier', supplierSchema);

const purchaseOrderSchema = new mongoose.Schema({
  merchantId: String, supplierId: mongoose.Schema.Types.ObjectId,
  poNumber: String, items: [{ itemId: String, name: String, qty: Number, unit: String, price: Number, amount: Number }],
  subtotal: Number, taxAmount: Number, totalAmount: Number,
  status: { type: String, enum: ['draft', 'pending', 'approved', 'ordered', 'partial', 'received', 'cancelled'], default: 'draft' },
  expectedDelivery: Date, actualDelivery: Date,
  notes: String, terms: String,
  createdBy: String, approvedBy: String,
  createdAt: Date, updatedAt: Date
});
const PurchaseOrder = mongoose.models.PurchaseOrder || mongoose.model('PurchaseOrder', purchaseOrderSchema);

app.get('/health', (req: Request, res: Response) => res.json({ status: 'ok', service: 'rez-procurement-service' }));

// Suppliers
app.post('/api/suppliers', async (req: Request, res: Response) => {
  const supplier = new Supplier({ ...req.body, createdAt: new Date() });
  await supplier.save();
  res.json({ success: true, data: supplier });
});

app.get('/api/suppliers/:merchantId', async (req: Request, res: Response) => {
  const suppliers = await Supplier.find({ merchantId: req.params.merchantId, status: 'active' });
  res.json({ success: true, data: suppliers });
});

app.get('/api/suppliers/detail/:id', async (req: Request, res: Response) => {
  const supplier = await Supplier.findById(req.params.id);
  res.json({ success: true, data: supplier });
});

app.put('/api/suppliers/:id', async (req: Request, res: Response) => {
  const supplier = await Supplier.findByIdAndUpdate(req.params.id, { ...req.body, updatedAt: new Date() }, { new: true });
  res.json({ success: true, data: supplier });
});

app.put('/api/suppliers/:id/block', async (req: Request, res: Response) => {
  const supplier = await Supplier.findByIdAndUpdate(req.params.id, { status: 'blocked' }, { new: true });
  res.json({ success: true, data: supplier });
});

// Purchase Orders
app.post('/api/purchase-orders', async (req: Request, res: Response) => {
  const po = new PurchaseOrder({ ...req.body, poNumber: `PO-${Date.now()}`, status: 'draft', createdAt: new Date() });
  await po.save();
  res.json({ success: true, data: po });
});

app.get('/api/purchase-orders/:merchantId', async (req: Request, res: Response) => {
  const { status } = req.query;
  const query: any = { merchantId: req.params.merchantId };
  if (status) query.status = status;
  const pos = await PurchaseOrder.find(query).populate('supplierId').sort({ createdAt: -1 });
  res.json({ success: true, data: pos });
});

app.get('/api/purchase-orders/detail/:id', async (req: Request, res: Response) => {
  const po = await PurchaseOrder.findById(req.params.id).populate('supplierId');
  res.json({ success: true, data: po });
});

app.put('/api/purchase-orders/:id', async (req: Request, res: Response) => {
  const po = await PurchaseOrder.findByIdAndUpdate(req.params.id, { ...req.body, updatedAt: new Date() }, { new: true });
  res.json({ success: true, data: po });
});

app.put('/api/purchase-orders/:id/status', async (req: Request, res: Response) => {
  const { status, approvedBy } = req.body;
  const po = await PurchaseOrder.findByIdAndUpdate(req.params.id, { status, approvedBy, updatedAt: new Date() }, { new: true });
  res.json({ success: true, data: po });
});

app.put('/api/purchase-orders/:id/approve', async (req: Request, res: Response) => {
  const { approvedBy } = req.body;
  const po = await PurchaseOrder.findByIdAndUpdate(req.params.id, { status: 'approved', approvedBy, updatedAt: new Date() }, { new: true });
  res.json({ success: true, data: po });
});

app.put('/api/purchase-orders/:id/order', async (req: Request, res: Response) => {
  const po = await PurchaseOrder.findByIdAndUpdate(req.params.id, { status: 'ordered', updatedAt: new Date() }, { new: true });
  res.json({ success: true, data: po });
});

app.put('/api/purchase-orders/:id/receive', async (req: Request, res: Response) => {
  const po = await PurchaseOrder.findByIdAndUpdate(req.params.id, { status: 'received', actualDelivery: new Date(), updatedAt: new Date() }, { new: true });
  res.json({ success: true, data: po });
});

app.delete('/api/purchase-orders/:id', async (req: Request, res: Response) => {
  await PurchaseOrder.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

const PORT = process.env.PORT || 4083;
app.listen(PORT, () => logger.info(`rez-procurement-service on port ${PORT}`));
export default app;
