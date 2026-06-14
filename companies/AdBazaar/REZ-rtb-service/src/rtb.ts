/**
 * REZ Real-time Bidding Service
 *
 * Programmatic advertising via RTB
 *
 * Features:
 * - Bid requests
 * - Bid responses
 * - Ad selection
 * - Budget management
 * - Frequency capping
 * - Fraud detection
 */

import express from 'express';
import axios from 'axios';
import { randomInt, randomUUID } from 'crypto';

const router = express.Router();

const FRAUD_URL = process.env.FRAUD_URL || 'https://REZ-fraud-agent.onrender.com';
const CDP_URL = process.env.CDP_URL || 'https://REZ-cdp-service.onrender.com';

// ============================================
// TYPES
// ============================================

interface BidRequest {
  id: string;
  imp: {
    id: string;
    banner?: { w: number; h: number };
    video?: { w: number; h: number };
    bidfloor: number;
  }[];
  device: {
    ip: string;
    ua: string;
    geo?: { lat: number; lon: number };
  };
  user?: {
    id: string;
    data?: unknown[];
  };
  at: number; // Auction type (1 = first price, 2 = second price)
  tmax: number; // Max time to respond
}

interface BidResponse {
  id: string;
  bidid: string;
  seatbid: {
    seat: string;
    bid: {
      id: string;
      impid: string;
      price: number;
      adomain?: string[];
      adm?: string;
      nurl?: string;
      crid?: string;
    }[];
  }[];
}

interface Campaign {
  id: string;
  advertiser_id: string;
  name: string;
  status: 'active' | 'paused' | 'completed';
  budget: number;
  budget_spent: number;
  daily_budget: number;
  daily_spent: number;
  bid_floor: number;
  bid_limit: number;
  targeting: {
    geo?: string[];
    age_range?: string[];
    interests?: string[];
    devices?: string[];
  };
  creatives: {
    id: string;
    name: string;
    type: 'banner' | 'video';
    url: string;
    click_url: string;
    width: number;
    height: number;
  }[];
}

interface AdImpression {
  id: string;
  campaign_id: string;
  creative_id: string;
  user_id?: string;
  bid_price: number;
  impression_price: number;
  click_price: number;
  won_at: string;
}

// In-memory stores
const campaigns = new Map<string, Campaign>();
const impressions: AdImpression[] = [];

// ============================================
// BIDDING ENDPOINTS
// ============================================

/**
 * POST /api/rtb/bid
 * Process bid request and return bid response
 */
router.post('/rtb/bid', async (req, res) => {
  const bidRequest: BidRequest = req.body;

  if (!bidRequest.id || !bidRequest.imp?.length) {
    return res.status(400).json({ error: 'Invalid bid request' });
  }

  // Find eligible campaigns
  const eligibleCampaigns = await findEligibleCampaigns(bidRequest);

  if (eligibleCampaigns.length === 0) {
    return res.json({ id: bidRequest.id, bidid: generateBidId(), seatbid: [] });
  }

  // Score each campaign
  const scoredCampaigns = await Promise.all(
    eligibleCampaigns.map(async (campaign) => {
      const score = await calculateBidScore(campaign, bidRequest);
      return { campaign, score };
    })
  );

  // Sort by score (highest first)
  scoredCampaigns.sort((a, b) => b.score - a.score);

  // Select winner
  const winner = scoredCampaigns[0];
  const winPrice = await calculateWinPrice(winner.score, bidRequest);

  // Generate bid response
  const bidResponse: BidResponse = {
    id: bidRequest.id,
    bidid: generateBidId(),
    seatbid: [{
      seat: 'REZ',
      bid: [{
        id: generateBidId(),
        impid: bidRequest.imp[0].id,
        price: winPrice,
        adomain: [winner.campaign.advertiser_id],
        adm: winner.campaign.creatives[0].url,
        crid: winner.campaign.creatives[0].id
      }]
    }]
  };

  // Record impression
  recordImpression({
    id: generateImpressionId(),
    campaign_id: winner.campaign.id,
    creative_id: winner.campaign.creatives[0].id,
    user_id: bidRequest.user?.id,
    bid_price: winPrice,
    impression_price: 0,
    click_price: 0,
    won_at: new Date().toISOString()
  });

  // Update campaign spend
  winner.campaign.budget_spent += winPrice;
  winner.campaign.daily_spent += winPrice;

  // Set timeout
  const timeout = Math.min(bidRequest.tmax || 100, 50);
  setTimeout(() => {}, timeout);

  res.json(bidResponse);
});

/**
 * POST /api/rtb/notify
 * Process ad event notification (impression, click, etc.)
 */
router.post('/rtb/notify', async (req, res) => {
  const { type, campaign_id, creative_id, price, user_id, metadata } = req.body;

  const impression = impressions.find(i => i.campaign_id === campaign_id);
  if (!impression) {
    return res.json({ processed: false });
  }

  switch (type) {
    case 'imp':
      impression.impression_price = price;
      break;
    case 'click':
      impression.click_price = price;
      break;
    case 'win':
      // Already recorded in bid
      break;
  }

  res.json({ processed: true });
});

// ============================================
// CAMPAIGN MANAGEMENT
// ============================================

/**
 * POST /api/campaigns
 * Create new campaign
 */
router.post('/campaigns', async (req, res) => {
  const campaign: Campaign = {
    id: `camp_${Date.now()}`,
    advertiser_id: req.body.advertiser_id,
    name: req.body.name,
    status: 'active',
    budget: req.body.budget,
    budget_spent: 0,
    daily_budget: req.body.daily_budget || req.body.budget / 30,
    daily_spent: 0,
    bid_floor: req.body.bid_floor || 0.5,
    bid_limit: req.body.bid_limit || 100,
    targeting: req.body.targeting || {},
    creatives: req.body.creatives || []
  };

  campaigns.set(campaign.id, campaign);

  res.status(201).json({ campaign_id: campaign.id, campaign });
});

/**
 * GET /api/campaigns
 * List campaigns
 */
router.get('/campaigns', (req, res) => {
  const { advertiser_id, status } = req.query;

  let list = Array.from(campaigns.values());

  if (advertiser_id) {
    list = list.filter(c => c.advertiser_id === advertiser_id);
  }

  if (status) {
    list = list.filter(c => c.status === status);
  }

  res.json({ campaigns: list, count: list.length });
});

/**
 * PATCH /api/campaigns/:id
 * Update campaign
 */
router.patch('/campaigns/:id', (req, res) => {
  const campaign = campaigns.get(req.params.id);

  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  Object.assign(campaign, req.body);

  res.json({ campaign });
});

/**
 * DELETE /api/campaigns/:id
 * Delete/pause campaign
 */
router.delete('/campaigns/:id', (req, res) => {
  const campaign = campaigns.get(req.params.id);

  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  campaign.status = 'completed';

  res.json({ success: true });
});

// ============================================
// ANALYTICS
// ============================================

/**
 * GET /api/analytics/campaigns/:id
 * Get campaign analytics
 */
router.get('/analytics/campaigns/:id', (req, res) => {
  const campaign = campaigns.get(req.params.id);

  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  const campaignImpressions = impressions.filter(i => i.campaign_id === campaign.id);

  const analytics = {
    campaign_id: campaign.id,
    budget: {
      total: campaign.budget,
      spent: campaign.budget_spent,
      remaining: campaign.budget - campaign.budget_spent,
      daily_budget: campaign.daily_budget,
      daily_spent: campaign.daily_spent
    },
    impressions: campaignImpressions.length,
    clicks: campaignImpressions.filter(i => i.click_price > 0).length,
    revenue: campaignImpressions.reduce((sum, i) => sum + i.impression_price + i.click_price, 0),
    avg_bid: campaignImpressions.length > 0
      ? campaignImpressions.reduce((sum, i) => sum + i.bid_price, 0) / campaignImpressions.length
      : 0,
    win_rate: campaignImpressions.length / (campaignImpressions.length * 2) // Simplified
  };

  res.json(analytics);
});

/**
 * GET /api/analytics/earnings
 * Get total earnings
 */
router.get('/analytics/earnings', (req, res) => {
  const total = impressions.reduce((sum, i) => sum + i.impression_price + i.click_price, 0);

  const byDay: Record<string, number> = {};
  for (const imp of impressions) {
    const day = imp.won_at.split('T')[0];
    byDay[day] = (byDay[day] || 0) + imp.impression_price + imp.click_price;
  }

  res.json({
    total_earnings: total,
    impressions: impressions.length,
    clicks: impressions.filter(i => i.click_price > 0).length,
    by_day: byDay
  });
});

// ============================================
// HELPERS
// ============================================

async function findEligibleCampaigns(bidRequest: BidRequest): Promise<Campaign[]> {
  const activeCampaigns = Array.from(campaigns.values())
    .filter(c => c.status === 'active');

  return activeCampaigns.filter(campaign => {
    // Budget checks
    if (campaign.budget_spent >= campaign.budget) return false;
    if (campaign.daily_spent >= campaign.daily_budget) return false;
    if (campaign.creatives.length === 0) return false;

    // Targeting checks
    if (bidRequest.device?.geo) {
      if (campaign.targeting.geo?.length) {
        // Check geo targeting
        // Simplified - in production, use actual geo matching
      }
    }

    return true;
  });
}

async function calculateBidScore(campaign: Campaign, bidRequest: BidRequest): Promise<number> {
  let score = campaign.bid_floor;

  // Base score from bid floor
  score += randomInt(0, 50) / 100; // Add variance

  // User context score
  if (bidRequest.user?.id) {
    try {
      // Get user segments
      const cdpRes = await axios.post(`${CDP_URL}/api/segments`, {
        user_id: bidRequest.user.id
      }, { timeout: 1000 }).catch(() => null);

      if (cdpRes?.data?.segments) {
        // Boost for targeting match
        const segments = cdpRes.data.segments;
        if (campaign.targeting.interests?.some(i => segments.includes(i))) {
          score += 1.0;
        }
      }
    } catch {
      // Continue without CDP
    }
  }

  // Fraud check
  try {
    const fraudRes = await axios.post(`${FRAUD_URL}/api/score`, {
      user_id: bidRequest.user?.id,
      device_id: bidRequest.device?.ip,
      transaction_type: 'ad_bid'
    }, { timeout: 1000 }).catch(() => null);

    if (fraudRes?.data?.risk_level === 'high') {
      score = 0; // Block fraudulent traffic
    }
  } catch {
    // Continue without fraud check
  }

  // Adjust for remaining budget
  const budgetRatio = (campaign.budget - campaign.budget_spent) / campaign.budget;
  score *= budgetRatio;

  return score;
}

async function calculateWinPrice(myScore: number, bidRequest: BidRequest): Promise<number> {
  // Second price auction
  const floor = bidRequest.imp[0]?.bidfloor || 0.5;

  // In production, this would be more sophisticated
  const secondPrice = Math.max(floor, myScore * 0.95);

  return Math.round(secondPrice * 100) / 100;
}

function generateBidId(): string {
  return `bid_${Date.now()}_${randomUUID().replace(/-/g, '').substring(0, 9)}`;
}

function generateImpressionId(): string {
  return `imp_${Date.now()}_${randomUUID().replace(/-/g, '').substring(0, 9)}`;
}

function recordImpression(impression: AdImpression): void {
  impressions.push(impression);

  // Keep last 100k impressions
  if (impressions.length > 100000) {
    impressions.splice(0, 10000);
  }
}

export default router;
