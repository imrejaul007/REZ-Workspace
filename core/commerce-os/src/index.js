/**
 * RTMN Commerce OS
 *
 * Unified commerce across all industries.
 * Handles transactions, orders, payments, and fulfillment across 24 industries.
 *
 * Port: 3022
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

import transactionsRoutes from './routes/transactions.js';
import ordersRoutes from './routes/orders.js';
import paymentsRoutes from './routes/payments.js';
import fulfillmentRoutes from './routes/fulfillment.js';

const app = express();
const PORT = process.env.PORT || 3022;

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
});

// Transaction Types
export const TRANSACTION_TYPES = {
  SALE: 'sale',
  PURCHASE: 'purchase',
  REFUND: 'refund',
  TRANSFER: 'transfer',
  SUBSCRIPTION: 'subscription'
};

// Order Status
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
};

// Payment Methods
export const PAYMENT_METHODS = {
  CARD: 'card',
  BANK: 'bank',
  WALLET: 'wallet',
  CRYPTO: 'crypto',
  INVOICE: 'invoice'
};

// Industry Coverage
export const INDUSTRIES = [
  'fitness', 'gaming', 'government', 'homeServices', 'manufacturing',
  'nonprofit', 'professional', 'sports', 'travel', 'construction',
  'entertainment', 'financial', 'healthcare', 'education', 'retail',
  'technology', 'food', 'automotive', 'realestate', 'media',
  'legal', 'agriculture', 'energy', 'logistics'
];

// Order Registry
export const orderRegistry = new Map();

// Transaction Registry
export const transactionRegistry = new Map();

export { logger };

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info({
      method: req.method,
      path: req.path,
      duration: Date.now() - start,
      status: res.statusCode
    });
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'commerce-os',
    version: '1.0.0',
    port: PORT,
    orders: orderRegistry.size,
    transactions: transactionRegistry.size,
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'RTMN Commerce OS',
    version: '1.0.0',
    description: 'Unified commerce across all industries',
    port: PORT,
    capabilities: [
      'Multi-industry transactions',
      'Order management',
      'Payment processing',
      'Fulfillment orchestration'
    ],
    endpoints: [
      'GET /api/transactions',
      'POST /api/transactions',
      'GET /api/orders',
      'POST /api/orders',
      'POST /api/payments',
      'GET /api/fulfillment'
    ]
  });
});

// Routes
app.use('/api/transactions', transactionsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/fulfillment', fulfillmentRoutes);

// Error handler
app.use((err, req, res, next) => {
  logger.error('Error:', err);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  logger.info(`Commerce OS running on port ${PORT}`);
  logger.info(`Industry coverage: ${INDUSTRIES.length} industries`);
});

export { app };
