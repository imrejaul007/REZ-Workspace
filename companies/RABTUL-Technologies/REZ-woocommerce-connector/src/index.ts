/**
 * REZ WooCommerce Connector
 * Deep integration with WooCommerce
 */

import express from 'express';
import logger from './utils/logger';
import { tracingMiddleware } from './middleware/tracing';
import mongoose from 'mongoose';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4051;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/woocommerce-connector';

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? (process.env.CORS_ORIGIN?.split(',').filter(Boolean) || [])
    : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'woocommerce-connector' });
});

app.post('/api/stores', async (req, res) => {
  const { siteUrl, consumerKey, consumerSecret } = req.body;
  // Verify and connect store
  res.json({ success: true, storeId: `woo_${Date.now()}` });
});

app.post('/api/sync/products', async (req, res) => {
  res.json({ synced: 0 });
});

app.post('/api/sync/orders', async (req, res) => {
  res.json({ synced: 0 });
});

app.listen(PORT, () => logger.info(`WooCommerce Connector on ${PORT}`));

try {
  await mongoose.connect(MONGODB_URI);
  logger.info('MongoDB connected');
} catch (error) {
  console.error('MongoDB connection failed:', error);
  process.exit(1); // Fail fast
}
