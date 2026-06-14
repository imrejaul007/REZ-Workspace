/**
 * RTMN Revenue Network
 *
 * Revenue stream orchestration across all 24 industries.
 * Connects, tracks, and optimizes revenue flows.
 *
 * Port: 3032
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

import streamsRoutes from './routes/streams.js';
import allocationRoutes from './routes/allocation.js';
import analyticsRoutes from './routes/analytics.js';

const app = express();
const PORT = process.env.PORT || 3032;

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
});

// Revenue Types
export const REVENUE_TYPES = {
  SUBSCRIPTION: 'subscription',
  TRANSACTION: 'transaction',
  LICENSE: 'license',
  ADVERTISING: 'advertising',
  REFERRAL: 'referral',
  DATA: 'data'
};

// Revenue Status
export const REVENUE_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired'
};

// Stream Registry
export const streamRegistry = new Map();

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
    service: 'revenue-network',
    version: '1.0.0',
    port: PORT,
    streams: streamRegistry.size,
    transactions: transactionRegistry.size,
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'RTMN Revenue Network',
    version: '1.0.0',
    description: 'Revenue stream orchestration across 24 industries',
    port: PORT,
    capabilities: [
      'Revenue stream management',
      'Allocation and distribution',
      'Revenue analytics'
    ],
    endpoints: [
      'GET /api/streams',
      'POST /api/streams',
      'GET /api/allocation',
      'GET /api/analytics'
    ]
  });
});

// Routes
app.use('/api/streams', streamsRoutes);
app.use('/api/allocation', allocationRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use((err, req, res, next) => {
  logger.error('Error:', err);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  logger.info(`Revenue Network running on port ${PORT}`);
});

export { app };
