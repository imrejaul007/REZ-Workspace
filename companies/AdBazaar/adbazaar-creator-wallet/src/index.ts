/**
 * AdBazaar Creator Wallet
 * Creator banking powered by RABTUL
 *
 * Port: 4970
 * Purpose: Earnings wallet, instant payout, tax reports, campaign escrow
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'cors';
import mongoose from 'mongoose';
import winston from 'winston';

const app = express();
const PORT = process.env.PORT || 4970;

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

app.use(helmet()); app.use(cors()); app.use(express.json());

// MongoDB
const creatorSchema = new mongoose.Schema({
  creatorId: String, walletBalance: Number, totalEarned: Number, totalPaid: Number,
  bankDetails: { account: String, ifsc: String, upi: String }, status: String, createdAt: Date
});

const transactionSchema = new mongoose.Schema({
  txId: String, creatorId: String, type: String, // earning, payout, escrow, fee
  amount: Number, campaignId: String, status: String, timestamp: Date
});

const escrowSchema = new mongoose.Schema({
  escrowId: String, campaignId: String, creatorId: String, brandId: String,
  amount: Number, released: Boolean, createdAt: Date, releasedAt: Date
});

const Creator = mongoose.model('Creator', creatorSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);
const Escrow = mongoose.model('Escrow', escrowSchema);

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'creator-wallet', port: PORT }));

// Register creator
app.post('/api/creators', async (req, res) => {
  try {
    const { creatorId, bankDetails } = req.body;
    const creator = new Creator({ creatorId, walletBalance: 0, totalEarned: 0, totalPaid: 0, bankDetails, status: 'active', createdAt: new Date() });
    await creator.save();
    res.json({ success: true, creatorId });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

// Get wallet
app.get('/api/wallet/:creatorId', async (req, res) => {
  try {
    const creator = await Creator.findOne({ creatorId: req.params.creatorId });
    if (!creator) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, balance: creator.walletBalance, totalEarned: creator.totalEarned, totalPaid: creator.totalPaid });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

// Add earning
app.post('/api/earnings', async (req, res) => {
  try {
    const { creatorId, campaignId, amount } = req.body;
    const txId = `tx_${Date.now()}`;

    await Transaction.create({ txId, creatorId, type: 'earning', amount, campaignId, status: 'completed', timestamp: new Date() });
    await Creator.findOneAndUpdate({ creatorId }, { $inc: { walletBalance: amount, totalEarned: amount } });

    res.json({ success: true, txId, newBalance: (await Creator.findOne({ creatorId }))?.walletBalance });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

// Payout
app.post('/api/payout', async (req, res) => {
  try {
    const { creatorId, amount, method } = req.body;
    const creator = await Creator.findOne({ creatorId });
    if (!creator || creator.walletBalance < amount) return res.status(400).json({ success: false, error: 'Insufficient balance' });

    const txId = `tx_${Date.now()}`;
    await Transaction.create({ txId, creatorId, type: 'payout', amount: -amount, status: 'processing', timestamp: new Date() });
    await Creator.findOneAndUpdate({ creatorId }, { $inc: { walletBalance: -amount, totalPaid: amount } });

    res.json({ success: true, txId, message: 'Payout initiated' });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

// Create escrow
app.post('/api/escrow', async (req, res) => {
  try {
    const { campaignId, creatorId, brandId, amount } = req.body;
    const escrowId = `esc_${Date.now()}`;
    await Escrow.create({ escrowId, campaignId, creatorId, brandId, amount, released: false, createdAt: new Date() });
    res.json({ success: true, escrowId });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

// Release escrow
app.post('/api/escrow/:escrowId/release', async (req, res) => {
  try {
    const escrow = await Escrow.findOne({ escrowId: req.params.escrowId });
    if (!escrow || escrow.released) return res.status(400).json({ success: false, error: 'Invalid escrow' });

    escrow.released = true; escrow.releasedAt = new Date(); await escrow.save();
    await Transaction.create({ txId: `tx_${Date.now()}`, creatorId: escrow.creatorId, type: 'earning', amount: escrow.amount, campaignId: escrow.campaignId, status: 'completed', timestamp: new Date() });
    await Creator.findOneAndUpdate({ creatorId: escrow.creatorId }, { $inc: { walletBalance: escrow.amount, totalEarned: escrow.amount } });

    res.json({ success: true });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

// Tax report
app.get('/api/tax-report/:creatorId', async (req, res) => {
  try {
    const { year } = req.query;
    const startDate = new Date(`${year || 2026}-01-01`);
    const endDate = new Date(`${year || 2026}-12-31`);

    const earnings = await Transaction.find({ creatorId: req.params.creatorId, type: 'earning', timestamp: { $gte: startDate, $lte: endDate } });
    const total = earnings.reduce((sum, e) => sum + e.amount, 0);
    const tds = total * 0.1;

    res.json({ success: true, year: year || 2026, totalEarnings: total, tdsDeducted: tds, netEarnings: total - tds, transactions: earnings.length });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

app.listen(PORT, () => {
  logger.info(`🚀 Creator Wallet started on port ${PORT}`);
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/creator_wallet').then(() => logger.info('MongoDB connected'));
});

export default app;