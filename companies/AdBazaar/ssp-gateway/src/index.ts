/**
 * SSP Gateway - Supply Side Platform
 * Publishers sell ad inventory, DSPs bid to buy
 * Port: 4520
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import Redis from 'ioredis';
import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 4520;

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Schemas
const publisherSchema = new mongoose.Schema({
  publisherId: String,
  name: String,
  website: String,
  category: String,
  inventory: [{
    adUnitId: String,
    name: String,
    type: String, // banner, video, native
    sizes: [String],
    floorPrice: Number,
    status: String
  }],
  dspAccess: [String],
  status: String,
  createdAt: Date
});

const adRequestSchema = new mongoose.Schema({
  requestId: String,
  publisherId: String,
  adUnitId: String,
  impressionId: String,
  size: String,
  floorPrice: Number,
  targeting: mongoose.Schema.Types.Mixed,
  bids: [{
    dspId: String,
    bidPrice: Number,
    creativeId: String,
    timestamp: Date
  }],
  winningBid: mongoose.Schema.Types.Mixed,
  won: Boolean,
  timestamp: Date
});

const Publisher = mongoose.model('Publisher', publisherSchema);
const AdRequest = mongoose.model('AdRequest', adRequestSchema);

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'ssp-gateway', port: PORT });
});

// ============================================
// PUBLISHER MANAGEMENT
// ============================================

app.post('/api/publishers', async (req, res) => {
  try {
    const { name, website, category } = req.body;
    const publisherId = 'pub_' + uuidv4().substring(0, 12);

    const publisher = new Publisher({
      publisherId,
      name,
      website,
      category,
      inventory: [],
      dspAccess: [],
      status: 'active',
      createdAt: new Date()
    });
    await publisher.save();

    res.json({ success: true, publisherId });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

app.get('/api/publishers/:publisherId', async (req, res) => {
  try {
    const publisher = await Publisher.findOne({ publisherId: req.params.publisherId });
    if (!publisher) return res.status(404).json({ error: 'Publisher not found' });
    res.json({ success: true, publisher });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

// ============================================
// INVENTORY MANAGEMENT
// ============================================

app.post('/api/publishers/:publisherId/inventory', async (req, res) => {
  try {
    const { name, type, sizes, floorPrice } = req.body;
    const adUnitId = 'unit_' + uuidv4().substring(0, 12);

    const publisher = await Publisher.findOne({ publisherId: req.params.publisherId });
    if (!publisher) return res.status(404).json({ error: 'Publisher not found' });

    publisher.inventory.push({
      adUnitId,
      name,
      type,
      sizes,
      floorPrice,
      status: 'active'
    });
    await publisher.save();

    res.json({ success: true, adUnitId });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

app.get('/api/inventory', async (req, res) => {
  try {
    const { category, type, size } = req.query;

    const publishers = await Publisher.find({ status: 'active' });
    const inventory = [];

    for (const pub of publishers) {
      for (const unit of pub.inventory) {
        if (unit.status !== 'active') continue;
        if (category && pub.category !== category) continue;
        if (type && unit.type !== type) continue;

        inventory.push({
          publisherId: pub.publisherId,
          publisherName: pub.name,
          adUnitId: unit.adUnitId,
          name: unit.name,
          type: unit.type,
          sizes: unit.sizes,
          floorPrice: unit.floorPrice
        });
      }
    }

    res.json({ success: true, inventory });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

// ============================================
// OPENRTB BIDDING
// ============================================

app.post('/api/v1/bid-request', async (req, res) => {
  try {
    const { publisherId, adUnitId, size, floorPrice, targeting } = req.body;
    const requestId = 'req_' + uuidv4().substring(0, 16);
    const impressionId = 'imp_' + uuidv4().substring(0, 12);

    // Store request
    const adRequest = new AdRequest({
      requestId,
      publisherId,
      adUnitId,
      impressionId,
      size,
      floorPrice: floorPrice || 0,
      targeting: targeting || {},
      bids: [],
      won: false,
      timestamp: new Date()
    });
    await adRequest.save();

    // Cache in Redis for fast access
    await redis.set('request:' + requestId, JSON.stringify({
      impressionId,
      floorPrice,
      publisherId,
      adUnitId,
      timestamp: Date.now()
    }), 'EX', 300);

    // Get available DSPs
    const publishers = await Publisher.find({ publisherId });
    const dspAccess = publishers[0]?.dspAccess || [];

    // In production, this would forward to connected DSPs
    res.json({
      id: requestId,
      imp: [{
        id: impressionId,
        banner: { w: parseInt(size?.split('x')[0]) || 300, h: parseInt(size?.split('x')[1]) || 250 },
        bidfloor: floorPrice || 0
      }],
      publisher: { domain: publishers[0]?.website || '' },
      availableDspCount: dspAccess.length || 5
    });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

app.post('/api/v1/bid-response', async (req, res) => {
  try {
    const { requestId, dspId, bidPrice, creativeId, adMarkup } = req.body;

    const adRequest = await AdRequest.findOne({ requestId });
    if (!adRequest) return res.status(404).json({ error: 'Request not found' });

    // Check floor price
    if (bidPrice < adRequest.floorPrice) {
      return res.status(400).json({ error: 'Bid below floor price' });
    }

    // Add bid
    adRequest.bids.push({
      dspId,
      bidPrice,
      creativeId,
      timestamp: new Date()
    });
    await adRequest.save();

    res.json({ success: true, status: 'bid_received' });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

// ============================================
// WIN NOTICE
// ============================================

app.post('/api/v1/win-notice', async (req, res) => {
  try {
    const { requestId, winningDspId, winningPrice } = req.body;

    await AdRequest.findOneAndUpdate(
      { requestId },
      {
        won: true,
        winningBid: { dspId: winningDspId, price: winningPrice }
      }
    );

    res.json({ success: true });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

// ============================================
// ANALYTICS
// ============================================

app.get('/api/publishers/:publisherId/analytics', async (req, res) => {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const requests = await AdRequest.find({
      publisherId: req.params.publisherId,
      timestamp: { $gte: since }
    });

    const totalImpressions = requests.length;
    const bidsReceived = requests.reduce((sum, r) => sum + r.bids.length, 0);
    const wins = requests.filter(r => r.won).length;
    const revenue = requests
      .filter(r => r.winningBid)
      .reduce((sum, r) => sum + (r.winningBid?.price || 0), 0);

    res.json({
      success: true,
      analytics: {
        period: '7d',
        impressions: totalImpressions,
        bidsReceived,
        wins,
        winRate: totalImpressions > 0 ? ((wins / totalImpressions) * 100).toFixed(2) + '%' : '0%',
        revenue: revenue.toFixed(2),
        averageBid: bidsReceived > 0 ? (revenue / bidsReceived).toFixed(2) : '0'
      }
    });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

app.get('/api/inventory/:adUnitId/stats', async (req, res) => {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const requests = await AdRequest.find({
      adUnitId: req.params.adUnitId,
      timestamp: { $gte: since }
    });

    res.json({
      success: true,
      stats: {
        impressions: requests.length,
        bids: requests.reduce((sum, r) => sum + r.bids.length, 0),
        wins: requests.filter(r => r.won).length,
        revenue: requests.filter(r => r.winningBid).reduce((sum, r) => sum + (r.winningBid?.price || 0), 0)
      }
    });
  } catch (error) { res.status(500).json({ success: false, error: String(error) }); }
});

app.listen(PORT, () => {
  logger.info('SSP Gateway started on port ' + PORT);
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ssp_gateway')
    .then(() => logger.info('MongoDB connected'))
    .catch((err) => logger.error('MongoDB error:', { error: err instanceof Error ? err.message : String(err) }));
});

export default app;