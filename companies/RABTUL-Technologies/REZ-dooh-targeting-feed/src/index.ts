/**
 * REZ DOOH Targeting Feed - Entry Point
 * Port: 4064
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { DOOHTargetingFeed } from './doohTargetingFeed.js';

const app = express();
const PORT = process.env.PORT || 4064;

app.use(helmet());
app.use(cors());
app.use(express.json());

const feed = new DOOHTargetingFeed();

// Health
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'dooh-targeting-feed', timestamp: new Date().toISOString() });
});

// Get targeting context
app.post('/targeting/context', async (req, res) => {
  try {
    const context = await feed.getTargetingContext(req.body);
    res.json(context);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get context' });
  }
});

// Get targeted ads
app.post('/targeting/ads', async (req, res) => {
  try {
    const ads = await feed.getTargetedAds(req.body);
    res.json(ads);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get ads' });
  }
});

// Send ad to screen
app.post('/targeting/send', async (req, res) => {
  try {
    const result = await feed.sendAd(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send ad' });
  }
});

// Get active campaigns
app.get('/campaigns/active', async (req, res) => {
  try {
    const campaigns = await feed.getActiveCampaigns();
    res.json({ success: true, campaigns });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get campaigns' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 DOOH Targeting Feed running on port ${PORT}`);
});

export default app;