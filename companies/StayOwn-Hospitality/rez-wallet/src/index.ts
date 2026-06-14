/**
 * REZ Wallet Service - RABTUL
 * Port: 4004
 *
 * REZ Coins wallet for hotel guests
 */

import express from 'express';
import cors from 'cors';
import winston from 'winston';

const app = express();
const PORT = process.env.PORT || 4004;

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

app.use(cors());
app.use(express.json());

// In-memory wallets
const wallets: Map<string, any> = new Map();

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'rez-wallet', port: PORT });
});

// Get balance
app.get('/wallets/:userId', (req, res) => {
  const { userId } = req.params;
  const wallet = wallets.get(userId) || { balance: 0, coins: 0, transactions: [] };
  res.json({ userId, ...wallet });
});

// Credit
app.post('/wallets/:userId/credit', (req, res) => {
  const { userId } = req.params;
  const { amount, description } = req.body;

  let wallet = wallets.get(userId) || { balance: 0, coins: 0, transactions: [] };
  wallet.balance += amount;
  wallet.coins += amount;
  wallet.transactions.push({ type: 'credit', amount, description, time: new Date() });

  wallets.set(userId, wallet);
  logger.info('Credited', { userId, amount });

  res.json({ success: true, balance: wallet.balance, coins: wallet.coins });
});

// Debit
app.post('/wallets/:userId/debit', (req, res) => {
  const { userId } = req.params;
  const { amount, description } = req.body;

  let wallet = wallets.get(userId) || { balance: 0, coins: 0, transactions: [] };
  if (wallet.balance < amount) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }

  wallet.balance -= amount;
  wallet.transactions.push({ type: 'debit', amount, description, time: new Date() });

  wallets.set(userId, wallet);
  logger.info('Debited', { userId, amount });

  res.json({ success: true, balance: wallet.balance, coins: wallet.coins });
});

app.listen(PORT, () => {
  logger.info(`REZ Wallet Service running on port ${PORT}`);
});

export { app };