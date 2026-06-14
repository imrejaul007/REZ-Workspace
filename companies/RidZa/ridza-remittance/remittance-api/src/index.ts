/**
 * Remittance API
 *
 * P2P Transfers, Cross-border Payments for GCC expats.
 * Port: 4540
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { transferRoutes } from './routes/transfer.js';
import { ratesRoutes } from './routes/rates.js';
import { recipientsRoutes } from './routes/recipients.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '4540', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/remittance';

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));

// Request ID middleware
app.use((req, res, next) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  res.setHeader('X-Request-ID', requestId);
  next();
});

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'remittance',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

app.get('/health/ready', async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({ status: 'not ready', reason: 'MongoDB disconnected' });
    return;
  }
  res.json({ status: 'ready' });
});

app.use('/api/transfer', transferRoutes);
app.use('/api/rates', ratesRoutes);
app.use('/api/recipients', recipientsRoutes);

app.use(errorHandler);

// Graceful shutdown
async function gracefulShutdown(signal: string) {
  console.log(`\n${signal} received. Shutting down...`);
  await mongoose.connection.close();
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
async function start() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected');

    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════╗
║           REMITTANCE API                            ║
║     P2P Transfers & Cross-border Payments          ║
╠═══════════════════════════════════════════════════════╣
║  Port: ${PORT.toString().padEnd(47)}║
║  Features:                                             ║
║  - /api/transfer   → Send money                      ║
║  - /api/rates      → Exchange rates                  ║
║  - /api/recipients → Manage recipients              ║
╚═══════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start:', error);
    process.exit(1);
  }
}

start();

export default app;