/**
 * Developer Portal - Service Catalog & Docs
 */

import express from 'express';
import logger from './utils/logger';
import { tracingMiddleware } from './middleware/tracing';

const app = express();
const PORT = process.env.PORT || 4037;

app.use(express.json());

const services = [
  { name: 'Auth', port: 4002, description: 'JWT, OTP, OAuth' },
  { name: 'Payment', port: 4001, description: 'Razorpay, UPI' },
  { name: 'Wallet', port: 4004, description: 'Coins, Balance' },
  { name: 'Order', port: 4006, description: 'Order lifecycle' },
  { name: 'Notifications', port: 4011, description: 'Push, SMS, Email' },
  { name: 'COD Intelligence', port: 4044, description: 'RTO prediction' },
  { name: 'Workflow Builder', port: 4045, description: 'Visual journeys' },
  { name: 'AI Agent', port: 4046, description: 'Chatbots' },
  { name: 'Checkout', port: 4050, description: '1-click checkout' },
  { name: 'Logistics', port: 4052, description: 'Multi-carrier shipping' },
];

app.get('/api/services', (_req, res) => {
  res.json({ services });
});

app.get('/api/services/:name', (req, res) => {
  const service = services.find(s => s.name.toLowerCase() === req.params.name.toLowerCase());
  res.json(service || { error: 'Not found' });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'developer-portal' });
});

app.listen(PORT, () => {
  logger.info(`Developer Portal on ${PORT}`);
});
