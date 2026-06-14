/**
 * RTMN Marketplace Network
 *
 * Unifies fragmented marketplaces across all 24 industries.
 * Connects buyers, sellers, and providers in a unified marketplace.
 *
 * Port: 3031
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

import listingRoutes from './routes/listings.js';
import ordersRoutes from './routes/orders.js';
import providersRoutes from './routes/providers.js';
import searchRoutes from './routes/search.js';

const app = express();
const PORT = process.env.PORT || 3031;

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
});

// Listing Types
export const LISTING_TYPES = {
  PRODUCT: 'product',
  SERVICE: 'service',
  SUBSCRIPTION: 'subscription',
  CONSULTING: 'consulting'
};

// Listing Status
export const LISTING_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SOLD: 'sold',
  EXPIRED: 'expired'
};

// All 24 Industries
export const INDUSTRIES = [
  'fitness', 'gaming', 'government', 'homeServices', 'manufacturing',
  'nonprofit', 'professional', 'sports', 'travel', 'construction',
  'entertainment', 'financial', 'healthcare', 'education', 'retail',
  'technology', 'food', 'automotive', 'realestate', 'media',
  'legal', 'agriculture', 'energy', 'logistics'
];

// Listing Registry
export const listingRegistry = new Map();

// Provider Registry
export const providerRegistry = new Map();

// Order Registry
export const orderRegistry = new Map();

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
    service: 'marketplace-network',
    version: '1.0.0',
    port: PORT,
    listings: listingRegistry.size,
    providers: providerRegistry.size,
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'RTMN Marketplace Network',
    version: '1.0.0',
    description: 'Unified marketplace across all 24 industries',
    port: PORT,
    capabilities: [
      'Multi-industry listings',
      'Provider management',
      'Unified search',
      'Order management'
    ],
    endpoints: [
      'GET /api/listings',
      'POST /api/listings',
      'GET /api/providers',
      'GET /api/search',
      'POST /api/orders'
    ]
  });
});

// Routes
app.use('/api/listings', listingRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/providers', providersRoutes);
app.use('/api/search', searchRoutes);

// Error handler
app.use((err, req, res, next) => {
  logger.error('Error:', err);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  logger.info(`Marketplace Network running on port ${PORT}`);
  logger.info(`Industry coverage: ${INDUSTRIES.length}`);
});

export { app };
