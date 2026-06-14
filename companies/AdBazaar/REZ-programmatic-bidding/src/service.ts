/**
 * REZ Programmatic Bidding Service
 * Real-time bidding for ad inventory
 */

import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import axios from 'axios';
import type { IAdvertiser, IBid, ICampaign } from './types.js';

const app = express();
app.use(express.json());

// Connections
const WALLET_API = process.env.WALLET_API || 'https://rez-wallet.onrender.com';
const AD_SERVICE = process.env.AD_API || 'https://rez-ads.onrender.com';

// Model interfaces
interface IBidRequestDoc extends mongoose.Document {
  request_id: string;
  impression_id: string;
  inventory_type: string;
  placement: string;
  user_id: string;
  device: { os: string; browser: string; device_type: string };
  location: { lat: number; lng: number };
  demographics: { age_range: string; gender: string; interests: string[] };
  floor_price: number;
  timestamp: Date;
}

interface IBidResponseDoc extends mongoose.Document {
  response_id: string;
  request_id: string;
  advertiser_id: string;
  campaign_id: string;
  bid_amount: number;
  creative_url: string;
  creative_id: string;
  won: boolean;
  timestamp: Date;
}

interface IAdvertiserDoc extends mongoose.Document {
  advertiser_id: string;
  name: string;
  budget: number;
  spent: number;
  bidding_strategy: 'fixed' | 'dynamic' | 'target_roas' | 'target_cpa';
  max_cpc: number;
  target_roas: number;
  status: 'active' | 'paused';
}

interface IBidLogDoc extends mongoose.Document {
  request_id: string;
  bids_received: number;
  winning_bid: number;
  winner_id: string;
  timestamp: Date;
}

// Models
const BidRequest = mongoose.model<IBidRequestDoc>('BidRequest', new mongoose.Schema({
  request_id: String,
  impression_id: String,
  inventory_type: String,
  placement: String,
  user_id: String,
  device: { os: String, browser: String, device_type: String },
  location: { lat: Number, lng: Number },
  demographics: { age_range: String, gender: String, interests: [String] },
  floor_price: Number,
  timestamp: { type: Date, default: Date.now }
}));

const BidResponse = mongoose.model<IBidResponseDoc>('BidResponse', new mongoose.Schema({
  response_id: String,
  request_id: String,
  advertiser_id: String,
  campaign_id: String,
  bid_amount: Number,
  creative_url: String,
  creative_id: String,
  won: Boolean,
  timestamp: { type: Date, default: Date.now }
}));

const Advertiser = mongoose.model<IAdvertiserDoc>('Advertiser', new mongoose.Schema({
  advertiser_id: String,
  name: String,
  budget: Number,
  spent: { type: Number, default: 0 },
  bidding_strategy: String,
  max_cpc: Number,
  target_roas: Number,
  status: { type: String, enum: ['active', 'paused'], default: 'active' }
}));

const BidLog = mongoose.model<IBidLogDoc>('BidLog', new mongoose.Schema({
  request_id: String,
  bids_received: Number,
  winning_bid: Number,
  winner_id: String,
  timestamp: { type: Date, default: Date.now }
}));

// Routes

// Get all advertisers
app.get('/api/advertisers', async (_req: Request, res: Response) => {
  const advertisers = await Advertiser.find();
  res.json({ advertisers });
});

// Create advertiser
app.post('/api/advertisers', async (req: Request, res: Response) => {
  const advertiser = new Advertiser(req.body);
  await advertiser.save();
  res.json({ advertiser });
});

// Bid request endpoint
app.post('/api/bid', async (req: Request, res: Response) => {
  const { request_id, advertiser_ids, floor_price } = req.body;

  // Find eligible advertisers
  const advertisers = await Advertiser.find({
    advertiser_id: { $in: advertiser_ids },
    status: 'active'
  });

  // Calculate bids
  const bids: IBid[] = [];

  for (const advertiser of advertisers) {
    const bid = calculateBid(advertiser, floor_price);

    if (bid > 0 && bid >= floor_price) {
      bids.push({
        advertiser_id: advertiser.advertiser_id,
        campaign_id: advertiser._id?.toString() || '',
        bid_amount: bid
      });
    }
  }

  // Sort by bid amount (highest first)
  bids.sort((a, b) => b.bid_amount - a.bid_amount);

  // Record bid responses
  const winner = bids[0];

  if (winner) {
    const response = new BidResponse({
      response_id: `BID-${Date.now()}`,
      request_id,
      advertiser_id: winner.advertiser_id,
      campaign_id: winner.campaign_id,
      bid_amount: winner.bid_amount,
      won: true
    });
    await response.save();

    // Update advertiser spend
    await Advertiser.findByIdAndUpdate(winner.campaign_id, {
      $inc: { spent: winner.bid_amount } as Record<string, number>
    });
  }

  // Log bid request
  const log = new BidLog({
    request_id,
    bids_received: bids.length,
    winning_bid: winner?.bid_amount || 0,
    winner_id: winner?.advertiser_id || ''
  });
  await log.save();

  res.json({
    request_id,
    winner: winner || null,
    all_bids: bids
  });
});

// Calculate bid based on strategy
function calculateBid(advertiser: IAdvertiserDoc, floorPrice: number): number {
  const baseBid = advertiser.max_cpc || 5;

  switch (advertiser.bidding_strategy) {
    case 'fixed':
      return baseBid;

    case 'dynamic': {
      // Increase bid for matching demographics
      let multiplier = 1.0;
      // Dynamic logic would go here
      return Math.min(baseBid * multiplier, advertiser.budget - advertiser.spent);
    }

    case 'target_roas': {
      // Adjust based on ROAS target
      const roasMultiplier = 1 + (advertiser.target_roas / 100 - 1) * 0.5;
      return Math.min(baseBid * roasMultiplier, advertiser.budget - advertiser.spent);
    }

    default:
      return baseBid;
  }
}

// Get bid logs
app.get('/api/logs', async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 100;
  const logs = await BidLog.find().sort({ timestamp: -1 }).limit(limit);
  res.json({ logs });
});

// Get bid stats
app.get('/api/stats', async (_req: Request, res: Response) => {
  const stats = await BidLog.aggregate([
    {
      $group: {
        _id: null,
        total_bids: { $sum: '$bids_received' },
        avg_winning_bid: { $avg: '$winning_bid' },
        total_spend: { $sum: '$winning_bid' }
      }
    }
  ]);

  res.json({ stats: stats[0] || { total_bids: 0, avg_winning_bid: 0, total_spend: 0 } });
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'rez-programmatic-bidding' });
});

export default app;
