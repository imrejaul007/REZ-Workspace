/**
 * RisaCare Health Wallet
 * Health savings, rewards, coins
 */
import express, { Express, Request, Response } from 'express';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import { RisaCareEcosystemClient } from '../../risa-care-shared/src/index';

const ecosystem = new RisaCareEcosystemClient();
const PORT = parseInt(process.env.PORT || '4781', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/risa_care_health_wallet';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), winston.format.simple()) })]
});

const app: Express = express();
app.use(express.json());

const WalletSchema = new mongoose.Schema({
  walletId: String, userId: String,
  balance: Number, coins: Number,
  rewards: Number, points: Number,
  transactions: [{
    id: String, type: String, amount: Number, description: String, date: Date, balance: Number
  }]
});

const RewardSchema = new mongoose.Schema({
  rewardId: String, userId: String, type: String,
  title: String, description: String, points: Number,
  expiryDate: Date, redeemed: Boolean, redeemedAt: Date
});

const VoucherSchema = new mongoose.Schema({
  voucherId: String, userId: String, code: String,
  type: String, value: Number, minOrder: Number,
  expiryDate: Date, redeemed: Boolean, redeemedAt: Date
});

const Wallet = mongoose.model('Wallet', WalletSchema);
const Reward = mongoose.model('Reward', RewardSchema);
const Voucher = mongoose.model('Voucher', VoucherSchema);

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'health-wallet' }));

// Wallet
app.get('/api/wallet/:userId', async (req, res) => {
  let wallet = await Wallet.findOne({ userId: req.params.userId });
  if (!wallet) wallet = await Wallet.create({ walletId: `wallet_${uuidv4()}`, userId: req.params.userId, balance: 0, coins: 0, rewards: 0, points: 0, transactions: [] });
  res.json({ success: true, wallet });
});

app.post('/api/wallet/:userId/add', async (req, res) => {
  const { amount, type, description } = req.body;
  let wallet = await Wallet.findOne({ userId: req.params.userId });
  if (!wallet) wallet = await Wallet.create({ walletId: `wallet_${uuidv4()}`, userId: req.params.userId, balance: 0, coins: 0, rewards: 0, points: 0, transactions: [] });

  const field = type === 'coins' ? 'coins' : type === 'rewards' ? 'rewards' : 'balance';
  wallet[field] = (wallet[field] || 0) + amount;
  wallet.transactions.push({ id: `txn_${uuidv4()}`, type: 'credit', amount, description, date: new Date(), balance: wallet[field] });
  await wallet.save();

  ecosystem.rabtul.sendPushNotification(req.params.userId, 'Balance Added', `₹${amount} added to your wallet`).catch(() => {});
  res.json({ success: true, wallet });
});

app.post('/api/wallet/:userId/deduct', async (req, res) => {
  const { amount, type, description } = req.body;
  let wallet = await Wallet.findOne({ userId: req.params.userId });
  if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

  const field = type === 'coins' ? 'coins' : type === 'rewards' ? 'rewards' : 'balance';
  if ((wallet[field] || 0) < amount) return res.status(400).json({ error: 'Insufficient balance' });

  wallet[field] = wallet[field] - amount;
  wallet.transactions.push({ id: `txn_${uuidv4()}`, type: 'debit', amount, description, date: new Date(), balance: wallet[field] });
  await wallet.save();
  res.json({ success: true, wallet });
});

app.get('/api/wallet/:userId/transactions', async (req, res) => {
  const wallet = await Wallet.findOne({ userId: req.params.userId });
  if (!wallet) return res.status(404).json({ error: 'Wallet not found' });
  res.json({ success: true, transactions: wallet.transactions.sort((a, b) => b.date.getTime() - a.date.getTime()) });
});

// Rewards
app.get('/api/rewards/:userId', async (req, res) => {
  const rewards = await Reward.find({ userId: req.params.userId, redeemed: false });
  res.json({ success: true, rewards });
});

app.post('/api/rewards/:userId/earn', async (req, res) => {
  const { type, title, description, points } = req.body;
  const reward = await Reward.create({ rewardId: `reward_${uuidv4()}`, userId: req.params.userId, type, title, description, points, expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), redeemed: false });
  res.status(201).json({ success: true, reward });
});

app.post('/api/rewards/:userId/redeem/:rewardId', async (req, res) => {
  const reward = await Reward.findOne({ rewardId: req.params.rewardId, redeemed: false });
  if (!reward) return res.status(404).json({ error: 'Reward not found' });
  reward.redeemed = true;
  reward.redeemedAt = new Date();
  await reward.save();
  res.json({ success: true, reward });
});

// Vouchers
app.get('/api/vouchers/:userId', async (req, res) => {
  const vouchers = await Voucher.find({ userId: req.params.userId, redeemed: false });
  res.json({ success: true, vouchers });
});

app.post('/api/vouchers/generate', async (req, res) => {
  const { userId, type, value, minOrder } = req.body;
  const voucher = await Voucher.create({
    voucherId: `voucher_${uuidv4()}`,
    userId, code: `REZ${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
    type, value, minOrder, expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), redeemed: false
  });
  res.status(201).json({ success: true, voucher });
});

async function start() {
  await mongoose.connect(MONGODB_URI);
  app.listen(PORT, () => logger.info(`Health Wallet started on port ${PORT}`));
}
start();
export default app;
