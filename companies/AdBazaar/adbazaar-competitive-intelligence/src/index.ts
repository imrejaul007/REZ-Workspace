/**
 * AdBazaar Competitive Intelligence
 * Market intelligence and competitor tracking
 *
 * Port: 4973
 * Purpose: Track competitor ads, pricing, offers, social growth
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import winston from 'winston';

const app = express();
const PORT = process.env.PORT || 4973;

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

app.use(helmet()); app.use(cors()); app.use(express.json());

// MongoDB
const competitorSchema = new mongoose.Schema({
  competitorId: String, merchantId: String, name: String, industry: String,
  socialStats: mongoose.Schema.Types.Mixed, adActivity: [mongoose.Schema.Types.Mixed],
  pricing: mongoose.Schema.Types.Mixed, lastUpdated: Date, createdAt: Date
});

const Competitor = mongoose.model('Competitor', competitorSchema);

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'competitive-intelligence', port: PORT }));

// Add competitor
app.post('/api/competitors', async (req, res) => {
  try {
    const { merchantId, name, industry } = req.body;
    const competitorId = `comp_${Date.now()}`;

    const competitor = new Competitor({
      competitorId, merchantId, name, industry,
      socialStats: { followers: 0, engagement: 0 }, adActivity: [], pricing: {},
      lastUpdated: new Date(), createdAt: new Date()
    });
    await competitor.save();

    res.json({ success: true, id: competitorId });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

// Get competitors
app.get('/api/competitors/:merchantId', async (req, res) => {
  try {
    const competitors = await Competitor.find({ merchantId: req.params.merchantId });
    res.json({ success: true, competitors });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

// Update social stats
app.post('/api/competitors/:competitorId/social', async (req, res) => {
  try {
    const { followers, posts, engagement } = req.body;

    const competitor = await Competitor.findOneAndUpdate(
      { competitorId: req.params.competitorId },
      { socialStats: { followers, posts, engagement }, lastUpdated: new Date() },
      { new: true }
    );

    res.json({ success: true, stats: competitor?.socialStats });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

// Track ad activity
app.post('/api/competitors/:competitorId/ads', async (req, res) => {
  try {
    const { platform, adContent, startDate, budget } = req.body;

    await Competitor.findOneAndUpdate(
      { competitorId: req.params.competitorId },
      {
        $push: { adActivity: { platform, adContent, startDate, budget, addedAt: new Date() } },
        lastUpdated: new Date()
      }
    );

    res.json({ success: true });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

// Get ad intelligence
app.get('/api/intel/:merchantId/ads', async (req, res) => {
  try {
    const competitors = await Competitor.find({ merchantId: req.params.merchantId });
    const allAds = competitors.flatMap(c => c.adActivity.map(a => ({ ...a, competitor: c.name })));

    res.json({ success: true, ads: allAds.slice(-50), count: allAds.length });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

// Pricing intelligence
app.post('/api/competitors/:competitorId/pricing', async (req, res) => {
  try {
    const { products } = req.body;

    await Competitor.findOneAndUpdate(
      { competitorId: req.params.competitorId },
      { pricing: products, lastUpdated: new Date() }
    );

    res.json({ success: true });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

// Comparison report
app.get('/api/compare/:merchantId', async (req, res) => {
  try {
    const competitors = await Competitor.find({ merchantId: req.params.merchantId });

    const comparison = competitors.map(c => ({
      name: c.name,
      followers: c.socialStats?.followers || 0,
      engagement: c.socialStats?.engagement || 0,
      activeAds: c.adActivity?.length || 0,
      lastUpdated: c.lastUpdated
    }));

    res.json({ success: true, comparison });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

// Alerts
app.post('/api/alerts', async (req, res) => {
  try {
    const { merchantId, competitorId, type, message } = req.body;

    res.json({ success: true, alertId: `alert_${Date.now()}`, type, message });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

app.listen(PORT, () => {
  logger.info(`🚀 Competitive Intelligence started on port ${PORT}`);
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/competitive_intel');
});

export default app;