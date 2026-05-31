/**
 * HOJAI Accounting AI
 * AI-powered accounting automation
 * Invoice extraction, ledger, reconciliation, Tally export
 */

import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import { v4 as uuid } from 'uuid';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Invoice Schema
const Invoice = mongoose.model('Invoice', new mongoose.Schema({
  invoiceId: String,
  tenantId: String,
  type: { type: String, enum: ['invoice', 'bill', 'receipt', 'expense'] },
  amount: Number,
  gst: Number,
  party: String,
  date: Date,
  items: [{
    description: String,
    quantity: Number,
    rate: Number,
    amount: Number
  }],
  ledger: String,
  status: String,
  tallyExported: Boolean,
  createdAt: Date
}));

// Ledger Entry Schema
const LedgerEntry = mongoose.Schema({
  entryId: String,
  tenantId: String,
  date: Date,
  voucherNo: String,
  ledger: String,
  debit: Number,
  credit: Number,
  narration: String,
  type: String,
  invoiceId: String,
  createdAt: Date
});

// Bank Transaction Schema
const BankTransaction = mongoose.Schema({
  transactionId: String,
  tenantId: String,
  date: Date,
  description: String,
  amount: Number,
  type: { type: String, enum: ['credit', 'debit'] },
  category: String,
  matched: Boolean,
  ledgerId: String,
  createdAt: Date
});

// Party Schema (Creditors/Debtors)
const Party = mongoose.model('Party', new mongoose.Schema({
  partyId: String,
  tenantId: String,
  name: String,
  type: { type: String, enum: ['customer', 'vendor', 'expense'] },
  gstin: String,
  phone: String,
  email: String,
  balance: Number,
  ledger: String,
  createdAt: Date
}));

app.post('/upload/invoice', async (req, res) => {
  const { tenantId, file, type } = req.body;
  const invoiceId = `INV-${uuid().slice(0, 8)}`;

  // Extract data from invoice (mock)
  const extracted = {
    invoiceId,
    tenantId,
    type: type || 'invoice',
    amount: req.body.amount || 0,
    gst: req.body.gst || 0,
    party: req.body.party || 'Unknown',
    date: new Date(),
    items: req.body.items || []
  };

  const invoice = new Invoice(extracted);
  await invoice.save();

  res.json({ success: true, invoiceId });
});

app.get('/invoices', async (req, res) => {
  const { tenantId, status } = req.query;
  const filter: any = { tenantId };
  if (status) filter.status = status;

  const invoices = await Invoice.find(filter).sort({ date: -1 });
  res.json({ success: true, data: invoices });
});

app.post('/ledger/entry', async (req, res) => {
  const { tenantId, ledger, debit, credit, narration, type } = req.body;
  const entryId = `LED-${uuid().slice(0, 8)}`;

  const entry = new LedgerEntry({
    entryId,
    tenantId,
    ledger,
    debit,
    credit,
    narration,
    type,
    date: new Date()
  });

  await entry.save();
  res.json({ success: true, entryId });
});

app.get('/ledger/:ledger', async (req, res) => {
  const { tenantId } = req.query;
  const ledger = req.params.ledger;

  const entries = await LedgerEntry.find({ tenantId, ledger }).sort({ date: -1 });
  const total = entries.reduce((sum, e) => sum + e.credit - e.debit, 0);

  res.json({ success: true, ledger, entries, balance: total });
});

app.post('/bank/upload', async (req, res) => {
  const { tenantId, transactions } = req.body;

  for (const tx of transactions) {
    await new BankTransaction({
      transactionId: uuid(),
      tenantId,
      ...tx,
      matched: false
    }).save();
  }

  res.json({ success: true, imported: transactions.length });
});

app.get('/reconcile', async (req, res) => {
  const { tenantId, date } = req.query;

  const [bankTxns, ledgerEntries] = await Promise.all([
    BankTransaction.find({ tenantId, date: new Date(date), matched: false }),
    LedgerEntry.find({ tenantId, date: new Date(date) })
  ]);

  // Auto-match
  const matches = [];
  for (const bank of bankTxns) {
    for (const ledger of ledgerEntries) {
      if (Math.abs(bank.amount - (ledger.credit || ledger.debit)) < 100) {
        matches.push({ bank, ledger });
        bank.matched = true;
        await bank.save();
      }
    }
  }

  res.json({ success: true, matched: matches.length, unmatched: bankTxns.length - matches.length });
});

app.get('/tally/export', async (req, res) => {
  const { tenantId, from, to } = req.query;

  const entries = await LedgerEntry.find({
    tenantId,
    date: { $gte: new Date(from), $lte: new Date(to) }
  });

  // Generate Tally format
  const tallyXml = entries.map(e => `
    <LEDGER NAME="${e.ledger}">
      <AMOUNT>${e.debit > 0 ? -e.debit : e.credit}</AMOUNT>
    </LEDGER>
  `.join('\n');

  res.json({ success: true, tallyXml });
});

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/accounting');
app.listen(4950, () => console.log('Accounting AI on 4950'));
