/**
 * REZ Merchant Launch Service - Entry Point
 * Port: 4064
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { MerchantLaunchService } from './merchantLaunch.js';

const app = express();
const PORT = process.env.PORT || 4064;

app.use(helmet());
app.use(cors());
app.use(express.json());

const launch = new MerchantLaunchService();

// Health
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'merchant-launch', timestamp: new Date().toISOString() });
});

// Launch merchant
app.post('/launch', async (req, res) => {
  try {
    const result = await launch.launchMerchant(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Launch failed' });
  }
});

// Get launch status
app.get('/status/:merchantId', async (req, res) => {
  try {
    const result = await launch.getLaunchStatus(req.params.merchantId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get status' });
  }
});

// Setup merchant
app.post('/setup/:merchantId', async (req, res) => {
  try {
    const result = await launch.setupMerchant(req.params.merchantId, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Setup failed' });
  }
});

// Get onboarding progress
app.get('/progress/:merchantId', async (req, res) => {
  try {
    const result = await launch.getOnboardingProgress(req.params.merchantId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get progress' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Merchant Launch running on port ${PORT}`);
});

export default app;