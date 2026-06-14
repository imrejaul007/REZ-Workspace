/**
 * AdBazaar Personalization Engine
 * Real-time personalization across all touchpoints
 *
 * Port: 4971
 * Purpose: Dynamic Yield / Adobe Target competitor
 *
 * Features:
 * - Real-time content personalization
 * - A/B testing
 * - Recommendation engine
 * - Behavioral targeting
 * - Cross-channel personalization
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import winston from 'winston';
import rateLimit from 'rate-limit-express';

const app = express();
const PORT = process.env.PORT || 4971;

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

app.use(helmet()); app.use(cors()); app.use(express.json());
app.use(rateLimit({ windowMs: 60000, max: 1000 })(app.request, app.response, () => {}));

// MongoDB Schemas
const personalizationSchema = new mongoose.Schema({
  personalizationId: String,
  merchantId: String,
  name: String,
  type: String, // homepage, product, cart, email, notification
  trigger: String, // page_view, add_to_cart, checkout, time_on_site
  content: mongoose.Schema.Types.Mixed,
  rules: mongoose.Schema.Types.Mixed,
  priority: Number,
  status: String, // active, paused
  stats: { views: Number, clicks: Number, conversions: Number },
  createdAt: Date
});

const Experiment = mongoose.model('Experiment', personalizationSchema);

// Health
app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'personalization', port: PORT }));

// Create personalization
app.post('/api/personalizations', async (req, res) => {
  try {
    const { merchantId, name, type, trigger, content, rules, priority } = req.body;
    const personalizationId = `pers_${Date.now()}`;

    const p = new Experiment({
      personalizationId, merchantId, name, type, trigger, content, rules, priority,
      status: 'active', stats: { views: 0, clicks: 0, conversions: 0 }, createdAt: new Date()
    });
    await p.save();

    res.json({ success: true, id: personalizationId });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

// Get personalization
app.post('/api/personalize', async (req, res) => {
  try {
    const { merchantId, userId, context, type } = req.body;

    const p = await Experiment.findOne({ merchantId, type, status: 'active' });

    if (!p) {
      res.json({ success: true, content: null, reason: 'no_match' });
      return;
    }

    // Apply rules
    const content = applyRules(p.rules, context);

    res.json({ success: true, content, id: p.personalizationId });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

// A/B Test
app.post('/api/experiments', async (req, res) => {
  try {
    const { merchantId, name, variants, traffic } = req.body;
    const experimentId = `exp_${Date.now()}`;

    const exp = new Experiment({
      personalizationId: experimentId, merchantId, name, type: 'experiment',
      content: { variants }, rules: { trafficAllocation: traffic },
      status: 'active', stats: { views: 0, clicks: 0, conversions: 0 }, createdAt: new Date()
    });
    await exp.save();

    res.json({ success: true, id: experimentId });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

// Track event
app.post('/api/track', async (req, res) => {
  try {
    const { personalizationId, userId, event, value } = req.body;

    const update: any = {};
    if (event === 'view') update['stats.views'] = 1;
    if (event === 'click') update['stats.clicks'] = 1;
    if (event === 'conversion') update['stats.conversions'] = 1;

    await Experiment.findOneAndUpdate({ personalizationId }, { $inc: update });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

// Get stats
app.get('/api/stats/:personalizationId', async (req, res) => {
  try {
    const p = await Experiment.findOne({ personalizationId: req.params.personalizationId });
    if (!p) return res.status(404).json({ error: 'Not found' });

    const ctr = p.stats.views > 0 ? (p.stats.clicks / p.stats.views * 100).toFixed(2) : '0';
    const convRate = p.stats.clicks > 0 ? (p.stats.conversions / p.stats.clicks * 100).toFixed(2) : '0';

    res.json({ success: true, stats: { ...p.stats, ctr: ctr + '%', convRate: convRate + '%' } });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

function applyRules(rules: any, context: any) {
  if (!rules) return null;

  // Simple rule matching
  if (rules.location && context.location !== rules.location) return null;
  if (rules.device && context.device !== rules.device) return null;
  if (rules.timeRange) {
    const hour = new Date().getHours();
    if (hour < rules.timeRange.start || hour > rules.timeRange.end) return null;
  }

  return rules.content || {};
}

app.listen(PORT, () => {
  logger.info(`🚀 Personalization Engine started on port ${PORT}`);
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/personalization');
});

export default app;