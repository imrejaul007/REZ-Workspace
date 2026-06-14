import { logger } from '../../shared/logger';
/**
 * Airzy Travel Finance Service
 * Port: 4515
 * Travel BNPL, forex, insurance marketplace
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';

const app = express();
const PORT = process.env.PORT || 4515;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/', routes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    service: 'airzy-travel-finance',
    version: '1.0.0',
    description: 'Travel BNPL, forex, insurance marketplace',
    endpoints: {
      health: '/health',
      bnplEligibility: '/bnpl/eligibility/:userId',
      bnplApply: '/bnpl/apply (POST)',
      bnplApplications: '/bnpl/applications/:userId',
      forexRates: '/forex/rates',
      forexConvert: '/forex/convert (POST)',
      forexOrder: '/forex/order (POST)',
      forexCards: '/forex/cards/:userId',
      forexCardApply: '/forex/cards (POST)',
      insurancePlans: '/insurance/plans',
      insuranceQuote: '/insurance/quote (POST)',
      insurancePurchase: '/insurance/purchase (POST)',
      insurancePurchases: '/insurance/purchases/:userId',
    }
  });
});

// Start server


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'airzy-travel-finance',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe
app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready' });
});
app.listen(PORT, () => {
  logger.info(`
╔═══════════════════════════════════════════════════════════╗
║         Airzy Travel Finance Service Started           ║
╠═══════════════════════════════════════════════════════════╣
║  Port: ${PORT}                                             ║
║  URL:  http://localhost:${PORT}                             ║
╠═══════════════════════════════════════════════════════════╣
║  Features:                                          ║
║  • Travel BNPL                                       ║
║  • Forex conversion & cards                          ║
║  • Travel insurance marketplace                       ║
║  • 14 currencies supported                          ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;
