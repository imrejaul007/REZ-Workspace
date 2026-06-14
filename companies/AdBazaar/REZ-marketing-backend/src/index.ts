/**
 * REZ Marketing Backend - Entry Point
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { rateLimit } from 'express-rate-limit';
import { logger } from 'utils/logger.js';

import { ABTestingService } from './services/abTestingService';
import { AbandonedCartService } from './services/abandonedCartService';
import { BirthdayService } from './services/birthdayService';
import { WhatsAppService } from './services/whatsappService';
import { WinbackService } from './services/winbackService';

const app = express();
const PORT = parseInt(process.env.PORT || '4026', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/marketing';

app.use(helmet());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: 'Too many requests' },
});
app.use('/api/', limiter);

// Health
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'REZ-marketing-backend' });
});

// Initialize services
const abTesting = new ABTestingService();
const abandonedCart = new AbandonedCartService();
const birthday = new BirthdayService();
const whatsapp = new WhatsAppService();
const winback = new WinbackService();

// ============================================================================
// A/B TESTING ROUTES
// ============================================================================

app.post('/api/tests', async (req, res) => {
  const test = await abTesting.createTest(req.body);
  res.status(201).json({ success: true, data: test });
});

app.get('/api/tests/:id', async (req, res) => {
  const test = await abTesting.getTest(req.params.id);
  res.json({ success: true, data: test });
});

app.get('/api/tests/:id/results', async (req, res) => {
  const results = await abTesting.getResults(req.params.id);
  res.json({ success: true, data: results });
});

// ============================================================================
// ABANDONED CART ROUTES
// ============================================================================

app.post('/api/carts/recover', async (req, res) => {
  const { userId, cartId } = req.body;
  const result = await abandonedCart.sendRecoverySequence(userId, cartId);
  res.json({ success: true, data: result });
});

// ============================================================================
// BIRTHDAY ROUTES
// ============================================================================

app.post('/api/birthday/trigger', async (req, res) => {
  const { userId, campaignId } = req.body;
  const result = await birthday.triggerBirthdayOffer(userId, campaignId);
  res.json({ success: true, data: result });
});

// ============================================================================
// WHATSAPP ROUTES
// ============================================================================

app.post('/api/whatsapp/send', async (req, res) => {
  const { userId, template, data } = req.body;
  const result = await whatsapp.sendMessage(userId, template, data);
  res.json({ success: true, data: result });
});

// ============================================================================
// WINBACK ROUTES
// ============================================================================

app.post('/api/winback/trigger', async (req, res) => {
  const { userId, campaignId } = req.body;
  const result = await winback.triggerWinback(userId, campaignId);
  res.json({ success: true, data: result });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Error:', { error: err instanceof Error ? err.message : String(err) });
  res.status(500).json({ success: false, error: 'Internal error' });
});

async function start(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info(`[${new Date().toISOString()}] Connected to MongoDB`);
  } catch (error) {
    logger.error('MongoDB connection failed:', { error: error instanceof Error ? error.message : String(error) });
  }

  app.listen(PORT, () => {
    logger.info(`[${new Date().toISOString()}] Marketing Backend running on port ${PORT}`);
  });
}

start();
