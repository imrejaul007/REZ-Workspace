/**
 * AdBazaar Revenue Intelligence
 * Track which campaigns create actual revenue and profit
 *
 * Port: 4969
 * Purpose: Answer "Which campaign created profit?"
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import winston from 'winston';
import rateLimit from 'rate-limit-express';

const app = express();
const PORT = process.env.PORT || 4969;

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console(), new winston.transports.File({ filename: 'logs/revenue-intelligence.log' })]
});

app.use(helmet()); app.use(cors()); app.use(express.json()); app.use(rateLimit({ windowMs: 60000, max: 100 })(app.request, app.response, () => {}));

// MongoDB
const attributionSchema = new mongoose.Schema({
  campaignId: String,
  merchantId: String,
  channel: String,
  touchpoints: [{ channel: String, timestamp: Date, cost: Number }],
  revenue: Number,
  cost: Number,
  conversions: Number,
  profit: Number,
  ltv: Number,
  timestamp: Date
});

const Attribution = mongoose.model('Attribution', attributionSchema);

// Health
app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'revenue-intelligence', port: PORT }));

// Track revenue
app.post('/api/track', async (req, res) => {
  try {
    const { campaignId, merchantId, channel, touchpoints, revenue, conversions } = req.body;
    const cost = touchpoints?.reduce((sum, t) => sum + (t.cost || 0), 0) || 0;
    const profit = revenue - cost;

    const record = new Attribution({ campaignId, merchantId, channel, touchpoints, revenue, cost, conversions, profit, ltv: profit * 3, timestamp: new Date() });
    await record.save();

    res.json({ success: true, profit, roi: profit > 0 ? ((profit / cost) * 100).toFixed(2) + '%' : 'N/A' });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Get campaign revenue
app.get('/api/campaign/:campaignId', async (req, res) => {
  try {
    const records = await Attribution.find({ campaignId: req.params.campaignId });
    const total = records.reduce((acc, r) => ({ revenue: acc.revenue + r.revenue, cost: acc.cost + r.cost, conversions: acc.conversions + r.conversions }), { revenue: 0, cost: 0, conversions: 0 });
    const profit = total.revenue - total.cost;

    res.json({ success: true, metrics: { ...total, profit, roi: profit > 0 ? ((profit / total.cost) * 100).toFixed(2) + '%' : 'N/A', cpa: total.conversions > 0 ? (total.cost / total.conversions).toFixed(2) : 'N/A' } });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Get merchant insights
app.get('/api/merchant/:merchantId', async (req, res) => {
  try {
    const records = await Attribution.find({ merchantId: req.params.merchantId });
    const byChannel = {};

    for (const r of records) {
      if (!byChannel[r.channel]) byChannel[r.channel] = { revenue: 0, cost: 0, conversions: 0 };
      byChannel[r.channel].revenue += r.revenue;
      byChannel[r.channel].cost += r.cost;
      byChannel[r.channel].conversions += r.conversions;
    }

    const total = records.reduce((acc, r) => ({ revenue: acc.revenue + r.revenue, cost: acc.cost + r.cost, conversions: acc.conversions + r.conversions }), { revenue: 0, cost: 0, conversions: 0 });

    res.json({ success: true, summary: { ...total, profit: total.revenue - total.cost }, byChannel });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Get top campaigns by profit
app.get('/api/top-campaigns/:merchantId', async (req, res) => {
  try {
    const records = await Attribution.find({ merchantId: req.params.merchantId });
    const grouped = {};

    for (const r of records) {
      if (!grouped[r.campaignId]) grouped[r.campaignId] = { campaignId: r.campaignId, channel: r.channel, revenue: 0, cost: 0, conversions: 0 };
      grouped[r.campaignId].revenue += r.revenue;
      grouped[r.campaignId].cost += r.cost;
      grouped[r.campaignId].conversions += r.conversions;
    }

    const ranked = Object.values(grouped).map(c => ({ ...c, profit: c.revenue - c.cost })).sort((a, b) => b.profit - a.profit);

    res.json({ success: true, campaigns: ranked.slice(0, 20) });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

app.listen(PORT, () => {
  logger.info(`🚀 Revenue Intelligence started on port ${PORT}`);
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/revenue_intelligence').then(() => logger.info('MongoDB connected'));
});

export default app;