/**
 * REZ Logistics Aggregator
 * Multi-carrier shipping, tracking, labels
 */

import express from 'express';
import logger from './utils/logger';
import { tracingMiddleware } from './middleware/tracing';
import mongoose from 'mongoose';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4052;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/logistics-aggregator';

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'logistics-aggregator' });
});

app.get('/api/rates', async (req, res) => {
  const { pickup, delivery, weight } = req.query;
  // Return mock rates
  res.json({
    quotes: [
      { carrier: 'Delhivery', rate: 45, eta: '2-3 days', cod: true },
      { carrier: 'DTDC', rate: 40, eta: '3-5 days', cod: true },
      { carrier: 'Xpressbees', rate: 50, eta: '2-4 days', cod: false },
    ]
  });
});

app.post('/api/book', async (req, res) => {
  res.json({
    shipmentId: `shp_${Date.now()}`,
    trackingId: `TRK${Date.now()}`,
    labelUrl: '/api/labels/mock.pdf'
  });
});

app.get('/api/track/:id', async (req, res) => {
  res.json({
    status: 'in_transit',
    history: [
      { status: 'picked_up', timestamp: new Date(), location: 'Mumbai' },
      { status: 'in_transit', timestamp: new Date(), location: 'Pune' }
    ]
  });
});

app.listen(PORT, () => logger.info(`Logistics Aggregator on ${PORT}`));

mongoose.connect(MONGODB_URI).then(() => logger.info('MongoDB connected'));
