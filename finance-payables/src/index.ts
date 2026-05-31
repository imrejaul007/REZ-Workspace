/**
 * AI Payables Manager - Bills, payments, vendor management
 */
import express from 'express';
import mongoose from 'mongoose';
const app = express();
app.use(express.json());

const Bill = mongoose.model('Bill', new mongoose.Schema({
  billId: String,
  tenantId: String,
  vendor: String,
  amount: Number,
  dueDate: Date,
  status: String
}));

const Vendor = mongoose.model('Vendor', new mongoose.Schema({
  vendorId: String,
  tenantId: String,
  name: String,
  gstin: String,
  paymentTerms: String
}));

// Payment schedule
app.get('/schedule/:tenantId', async (req, res) => {
  const bills = await Bill.find({ tenantId: req.params.tenantId, status: 'pending' });
  const total = bills.reduce((s, b) => s + b.amount, 0);
  res.json({ bills, total, dueCount: bills.length });
});

// Vendor management
app.post('/vendors', async (req, res) => {
  const vendor = new Vendor({ vendorId: `VND-${Date.now()}`, ...req.body });
  await vendor.save();
  res.json({ vendorId: vendor.vendorId });
});

mongoose.connect('mongodb://localhost:27017/finance-payables');
app.listen(4905, () => console.log('AI Payables: 4905'));
