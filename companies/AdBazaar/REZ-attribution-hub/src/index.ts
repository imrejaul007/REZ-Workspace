/**
 * REZ Attribution Hub
 * Multi-touch attribution and conversion tracking
 * Port: 4100
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import winston from 'winston';

const app = express();
const PORT = process.env.PORT || 4100;

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

const touchpointSchema = new mongoose.Schema({
  touchpointId: String,
  visitorId: String,
  merchantId: String,
  channel: String,
  campaign: String,
  adId: String,
  adGroup: String,
  keyword: String,
  creative: String,
  timestamp: Date
});

const conversionSchema = new mongoose.Schema({
  conversionId: String,
  visitorId: String,
  merchantId: String,
  orderId: String,
  value: Number,
  currency: String,
  touchpoints: [String],
  attribution: mongoose.Schema.Types.Mixed,
  timestamp: Date
});

const Touchpoint = mongoose.model('Touchpoint', touchpointSchema);
const Conversion = mongoose.model('Conversion', conversionSchema);

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'attribution-hub', port: PORT });
});

app.post('/api/touch', async (req, res) => {
  try {
    const { visitorId, merchantId, channel, campaign, adId, keyword, creative } = req.body;
    const touchpointId = 'tp_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

    const touch = new Touchpoint({
      touchpointId,
      visitorId,
      merchantId,
      channel,
      campaign,
      adId,
      keyword,
      creative,
      timestamp: new Date()
    });
    await touch.save();

    res.json({ success: true, touchpointId });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

app.post('/api/convert', async (req, res) => {
  try {
    const { visitorId, merchantId, orderId, value, currency, touchpoints } = req.body;
    const conversionId = 'conv_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

    const attribution = calculateAttribution(touchpoints || []);

    const conversion = new Conversion({
      conversionId,
      visitorId,
      merchantId,
      orderId,
      value,
      currency: currency || 'INR',
      touchpoints: touchpoints || [],
      attribution,
      timestamp: new Date()
    });
    await conversion.save();

    res.json({ success: true, conversionId, attribution });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

function calculateAttribution(touchpoints: any[]): any {
  if (!touchpoints.length) return { model: 'direct', channels: {} };

  const channels: any = {};
  const total = touchpoints.length;

  touchpoints.forEach((tp: any, idx: number) => {
    const channel = tp.channel || 'unknown';
    const weight = calculateWeight(idx, total, touchpoints.length);
    channels[channel] = (channels[channel] || 0) + weight;
  });

  const sorted = Object.entries(channels).sort((a: any, b: any) => b[1] - a[1]);
  const winner = sorted[0]?.[0] || 'direct';

  return {
    model: 'linear',
    winner,
    channels,
    touchpoints: total
  };
}

function calculateWeight(position: number, total: number, all: number): number {
  const decay = 1 / (position + 1);
  return decay;
}

app.get('/api/attribution/:merchantId', async (req, res) => {
  try {
    const { startDate, endDate, model = 'linear' } = req.query;
    const since = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const until = endDate ? new Date(endDate as string) : new Date();

    const conversions = await Conversion.find({
      merchantId: req.params.merchantId,
      timestamp: { $gte: since, $lte: until }
    });

    const stats = {
      totalConversions: conversions.length,
      totalValue: conversions.reduce((s, c) => s + (c.value || 0), 0),
      byChannel: {} as Record<string, any>,
      byModel: {} as Record<string, number>
    };

    conversions.forEach((c: any) => {
      const attr = c.attribution || {};
      const winner = attr.winner || 'direct';

      stats.byChannel[winner] = stats.byChannel[winner] || { conversions: 0, value: 0 };
      stats.byChannel[winner].conversions++;
      stats.byChannel[winner].value += c.value || 0;
    });

    res.json({ success: true, stats });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

app.get('/api/funnel/:merchantId', async (req, res) => {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const touchpoints = await Touchpoint.aggregate([
      { $match: { merchantId: req.params.merchantId, timestamp: { $gte: since } } },
      { $group: { _id: '$channel', count: { $sum: 1 } } }
    ]);

    const conversions = await Conversion.aggregate([
      { $match: { merchantId: req.params.merchantId, timestamp: { $gte: since } },
      { $group: { _id: null, total: { $sum: '$value' }, count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      funnel: {
        touchpoints: touchpoints.map(t => ({ channel: t._id, count: t.count })),
        conversions: conversions[0] || { total: 0, count: 0 }
      }
    });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

app.listen(PORT, () => {
  logger.info('Attribution Hub started on port ' + PORT);
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/attribution')
    .then(() => logger.info('MongoDB connected'))
    .catch((err) => logger.error('MongoDB error:', { error: err instanceof Error ? err.message : String(err) }));
});

export default app;