/**
 * REZ Real-Time Bidding (RTB) Service
 *
 * Real-time bidding for programmatic advertising.
 * Handles bid requests, auction management, and ad selection.
 *
 * Port: 4600
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';

// ============================================================================
// TYPES
// ============================================================================

interface BidRequest {
  id: string;
  timestamp: number;
  impressions: Impression[];
  device: Device;
  user: User;
  context: Context;
}

interface Impression {
  id: string;
  banner: Banner;
  video?: Video;
  types: string[];
  floorPrice: number;
  allowedFormats: string[];
}

interface Banner {
  width: number;
  height: number;
  sizes: Array<{ width: number; height: number }>;
}

interface Video {
  duration: number;
  skip: boolean;
  linearity: number;
}

interface Device {
  type: 'mobile' | 'desktop' | 'tablet';
  os: 'iOS' | 'Android' | 'Windows' | 'macOS' | 'Linux';
  browser: string;
  ip: string;
  geo: Geo;
}

interface Geo {
  country: string;
  region: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
}

interface User {
  id: string;
  age: number;
  gender?: string;
  interests: string[];
  segments: string[];
  history: number[];
}

interface Context {
  site: Site;
  app?: App;
  keywords: string[];
  category: string[];
}

interface Site {
  id: string;
  name: string;
  domain: string;
  category: string[];
  pageUrl: string;
  referrer?: string;
}

interface App {
  id: string;
  name: string;
  bundle: string;
  category: string[];
}

interface BidResponse {
  id: string;
  bidRequestId: string;
  currency: 'INR' | 'USD';
  seat: string;
  ads: Ad[];
}

interface Ad {
  id: string;
  impressionId: string;
  creative: Creative;
  bidPrice: number;
  dealId?: string;
}

interface Creative {
  id: string;
  type: 'banner' | 'video' | 'native';
  content: string;
  width: number;
  height: number;
  clickUrl: string;
  trackingUrls: string[];
  macroValues: Record<string, string>;
}

interface Campaign {
  id: string;
  advertiserId: string;
  name: string;
  budget: number;
  spent: number;
  bid: number;
  targeting: Targeting;
  status: 'active' | 'paused' | 'completed';
}

interface Targeting {
  age?: { min: number; max: number };
  gender?: string[];
  geo?: string[];
  interests?: string[];
  segments?: string[];
  siteWhitelist?: string[];
  siteBlacklist?: string[];
}

interface Auction {
  id: string;
  bidRequestId: string;
  impressions: string[];
  bids: Bid[];
  winner?: Bid;
  startTime: Date;
  endTime?: Date;
  status: 'open' | 'closed';
}

interface Bid {
  campaignId: string;
  advertiserId: string;
  amount: number;
  adId: string;
  impressionId: string;
  creative: string;
  timestamp: Date;
}

interface FloorRule {
  id: string;
  inventoryType: string;
  minPrice: number;
  maxPrice: number;
  conditions: Record<string, any>;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const campaigns: Campaign[] = [
  {
    id: 'camp_rtb_001',
    advertiserId: 'adv_001',
    name: 'Tech Products Summer Sale',
    budget: 500000,
    spent: 125000,
    bid: 25,
    targeting: {
      age: { min: 25, max: 45 },
      gender: ['male', 'female'],
      geo: ['IN-KA', 'IN-MH', 'IN-DL'],
      interests: ['technology', 'gadgets', 'shopping'],
    },
    status: 'active',
  },
  {
    id: 'camp_rtb_002',
    advertiserId: 'adv_002',
    name: 'Restaurant Week Campaign',
    budget: 100000,
    spent: 45000,
    bid: 15,
    targeting: {
      geo: ['IN-KA'],
      interests: ['food', 'dining', 'entertainment'],
    },
    status: 'active',
  },
];

const auctions: Auction[] = [];
const bidResponses: BidResponse[] = [];

const floorRules: FloorRule[] = [
  { id: 'fr_001', inventoryType: 'banner', minPrice: 5, maxPrice: 100, conditions: {} },
  { id: 'fr_002', inventoryType: 'video', minPrice: 15, maxPrice: 250, conditions: {} },
  { id: 'fr_003', inventoryType: 'native', minPrice: 10, maxPrice: 150, conditions: {} },
];

// ============================================================================
// EXPRESS APP
// ============================================================================

const app = express();
const PORT = parseInt(process.env.PORT || '4600', 10);

app.use(helmet());
app.use(cors());
app.use(express.json());

// ============================================================================
// ROUTES
// ============================================================================

// Health
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'rez-rtb-service',
    version: '1.0.0',
    activeCampaigns: campaigns.filter(c => c.status === 'active').length,
    openAuctions: auctions.filter(a => a.status === 'open').length,
  });
});

// ============================================================================
// BID REQUEST HANDLING
// ============================================================================

// Receive bid request (from SSP/DSP)
app.post('/bid', (req: Request, res: Response) => {
  const bidRequest: BidRequest = req.body;

  // Validate bid request
  if (!bidRequest.id || !bidRequest.impressions?.length) {
    return res.status(400).json({ error: 'INVALID_REQUEST' });
  }

  // Create auction
  const auction: Auction = {
    id: `auct_${Date.now()}`,
    bidRequestId: bidRequest.id,
    impressions: bidRequest.impressions.map(i => i.id),
    bids: [],
    startTime: new Date(),
    status: 'open',
  };

  // Find matching campaigns
  const matchingCampaigns = campaigns.filter(c => {
    if (c.status !== 'active') return false;
    if (c.budget - c.spent < c.bid) return false;

    // Check targeting
    const { targeting } = c;
    if (targeting.age) {
      if (bidRequest.user.age < targeting.age.min || bidRequest.user.age > targeting.age.max) {
        return false;
      }
    }
    if (targeting.gender?.length && bidRequest.user.gender && !targeting.gender.includes(bidRequest.user.gender)) {
      return false;
    }
    if (targeting.geo?.length && !targeting.geo.includes(bidRequest.device.geo.region)) {
      return false;
    }
    if (targeting.interests?.length) {
      const hasMatch = bidRequest.user.interests.some(i => targeting.interests!.includes(i));
      if (!hasMatch) return false;
    }

    return true;
  });

  // Create bids for each impression
  const ads: Ad[] = [];
  for (const impression of bidRequest.impressions) {
    const eligibleCampaigns = matchingCampaigns.filter(c => {
      const floor = floorRules.find(f => f.inventoryType === getInventoryType(impression)) || floorRules[0];
      return c.bid >= floor.minPrice;
    });

    if (eligibleCampaigns.length === 0) continue;

    // Sort by bid amount and select winner
    eligibleCampaigns.sort((a, b) => b.bid - a.bid);
    const winner = eligibleCampaigns[0];

    const ad: Ad = {
      id: `ad_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      impressionId: impression.id,
      creative: {
        id: `cre_${winner.id}`,
        type: impression.types.includes('video') ? 'video' : 'banner',
        content: generateCreativeContent(winner),
        width: impression.banner?.width || 300,
        height: impression.banner?.height || 250,
        clickUrl: `https://rez.co/click/${winner.id}/${impression.id}`,
        trackingUrls: [
          'https://rez.co/track/impression',
          'https://rez.co/track/click',
        ],
        macroValues: {
          '{CLICK_URL}': `https://rez.co/click/${winner.id}`,
          '{PRICE}': winner.bid.toString(),
        },
      },
      bidPrice: winner.bid,
    };

    ads.push(ad);

    // Record bid
    auction.bids.push({
      campaignId: winner.id,
      advertiserId: winner.advertiserId,
      amount: winner.bid,
      adId: ad.id,
      impressionId: impression.id,
      creative: ad.creative.id,
      timestamp: new Date(),
    });
  }

  // Close auction
  auction.winner = auction.bids[0];
  auction.endTime = new Date();
  auction.status = 'closed';

  auctions.push(auction);

  // Build response
  const bidResponse: BidResponse = {
    id: `br_${Date.now()}`,
    bidRequestId: bidRequest.id,
    currency: 'INR',
    seat: 'rez-seat',
    ads,
  };

  bidResponses.push(bidResponse);

  res.json(bidResponse);
});

// Batch bid requests
app.post('/bid/batch', (req: Request, res: Response) => {
  const { requests } = req.body as { requests: BidRequest[] };

  const responses = requests.map((bidRequest) => {
    // Simplified batch processing
    const matchingCampaigns = campaigns.filter(c => c.status === 'active');

    const ads: Ad[] = bidRequest.impressions.slice(0, 2).map(imp => ({
      id: `ad_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      impressionId: imp.id,
      creative: {
        id: `cre_${matchingCampaigns[0]?.id || 'default'}`,
        type: 'banner' as const,
        content: 'Sample Ad Content',
        width: imp.banner?.width || 300,
        height: imp.banner?.height || 250,
        clickUrl: 'https://rez.co/click',
        trackingUrls: [],
        macroValues: {},
      },
      bidPrice: matchingCampaigns[0]?.bid || 15,
    }));

    return {
      id: `br_${Date.now()}`,
      bidRequestId: bidRequest.id,
      currency: 'INR',
      seat: 'rez-seat',
      ads,
    };
  });

  res.json({ success: true, data: responses });
});

// ============================================================================
// CAMPAIGN MANAGEMENT
// ============================================================================

// List campaigns
app.get('/api/campaigns', (req: Request, res: Response) => {
  const { status, advertiserId } = req.query;

  let filtered = [...campaigns];

  if (status) filtered = filtered.filter(c => c.status === status);
  if (advertiserId) filtered = filtered.filter(c => c.advertiserId === advertiserId);

  res.json({
    success: true,
    data: {
      campaigns: filtered.map(c => ({
        ...c,
        remaining: c.budget - c.spent,
        avgBid: c.spent / (campaigns.indexOf(c) + 1),
      })),
      total: filtered.length,
    },
  });
});

// Get campaign
app.get('/api/campaigns/:id', (req: Request, res: Response) => {
  const campaign = campaigns.find(c => c.id === req.params.id);

  if (!campaign) {
    return res.status(404).json({ success: false, error: 'Campaign not found' });
  }

  res.json({ success: true, data: campaign });
});

// Create campaign
app.post('/api/campaigns', (req: Request, res: Response) => {
  const { advertiserId, name, budget, bid, targeting } = req.body;

  if (!advertiserId || !name || !budget || !bid) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const campaign: Campaign = {
    id: `camp_rtb_${Date.now()}`,
    advertiserId,
    name,
    budget,
    spent: 0,
    bid,
    targeting: targeting || {},
    status: 'active',
  };

  campaigns.push(campaign);

  res.json({ success: true, data: campaign });
});

// Update campaign
app.patch('/api/campaigns/:id', (req: Request, res: Response) => {
  const campaign = campaigns.find(c => c.id === req.params.id);

  if (!campaign) {
    return res.status(404).json({ success: false, error: 'Campaign not found' });
  }

  Object.assign(campaign, req.body);

  res.json({ success: true, data: campaign });
});

// Pause/resume campaign
app.patch('/api/campaigns/:id/status', (req: Request, res: Response) => {
  const campaign = campaigns.find(c => c.id === req.params.id);

  if (!campaign) {
    return res.status(404).json({ success: false, error: 'Campaign not found' });
  }

  campaign.status = req.body.status;

  res.json({ success: true, data: campaign });
});

// ============================================================================
// ANALYTICS
// ============================================================================

// Get RTB analytics
app.get('/api/analytics', (req: Request, res: Response) => {
  const { campaignId, startDate, endDate } = req.query;

  const filteredCampaigns = campaignId
    ? campaigns.filter(c => c.id === campaignId)
    : campaigns;

  res.json({
    success: true,
    data: {
      summary: {
        totalImpressions: 1250000,
        totalClicks: 45000,
        totalSpend: campaigns.reduce((sum, c) => sum + c.spent, 0),
        avgCPM: 22.5,
        avgCPC: 3.2,
        winRate: 0.68,
      },
      byCampaign: filteredCampaigns.map(c => ({
        id: c.id,
        name: c.name,
        budget: c.budget,
        spent: c.spent,
        impressions: Math.round(c.spent / c.bid * 1000),
        clicks: Math.round(c.spent / c.bid * 40),
        cpm: c.bid * 0.9,
      })),
      byInventoryType: {
        banner: { impressions: 800000, cpm: 18 },
        video: { impressions: 300000, cpm: 35 },
        native: { impressions: 150000, cpm: 25 },
      },
      byGeo: {
        'IN-KA': { impressions: 500000, cpm: 20 },
        'IN-MH': { impressions: 400000, cpm: 22 },
        'IN-DL': { impressions: 350000, cpm: 25 },
      },
      auctionMetrics: {
        totalAuctions: auctions.length,
        avgBidsPerAuction: auctions.length > 0 ? auctions.reduce((sum, a) => sum + a.bids.length, 0) / auctions.length : 0,
        competition: 0.72,
      },
    },
  });
});

// Get auction history
app.get('/api/auctions', (req: Request, res: Response) => {
  const { limit } = req.query;

  const recent = auctions.slice(-(Number(limit) || 100));

  res.json({
    success: true,
    data: {
      auctions: recent,
      total: auctions.length,
    },
  });
});

// ============================================================================
// FLOOR RULES
// ============================================================================

// Get floor rules
app.get('/api/floors', (req: Request, res: Response) => {
  res.json({ success: true, data: floorRules });
});

// Update floor rule
app.patch('/api/floors/:id', (req: Request, res: Response) => {
  const rule = floorRules.find(r => r.id === req.params.id);

  if (!rule) {
    return res.status(404).json({ success: false, error: 'Floor rule not found' });
  }

  Object.assign(rule, req.body);

  res.json({ success: true, data: rule });
});

// ============================================================================
// SEAT MANAGEMENT
// ============================================================================

// Get bidder seats
app.get('/api/seats', (req: Request, res: Response) => {
  const seats = [
    { id: 'rez-seat', name: 'REZ Media', type: 'publisher', status: 'active' },
    { id: 'adv-seat-001', name: 'Advertiser 1', type: 'advertiser', status: 'active' },
    { id: 'adv-seat-002', name: 'Advertiser 2', type: 'advertiser', status: 'active' },
  ];

  res.json({ success: true, data: seats });
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getInventoryType(impression: Impression): string {
  if (impression.video) return 'video';
  if (impression.types.includes('native')) return 'native';
  return 'banner';
}

function generateCreativeContent(campaign: Campaign): string {
  return `
    <div style="width:100%;height:100%;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);display:flex;align-items:center;justify-content:center;color:white;text-align:center;font-family:Arial,sans-serif;">
      <div>
        <h2 style="margin:0;font-size:24px;">${campaign.name}</h2>
        <p style="margin:10px 0 0;font-size:14px;">Shop Now & Save Big!</p>
      </div>
    </div>
  `;
}

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  logger.info(`
╔══════════════════════════════════════════════════════════════╗
║         REZ REAL-TIME BIDDING SERVICE v1.0.0      ║
╠══════════════════════════════════════════════════════════════╣
║  Port:     ${PORT}                                             ║
║  Active Campaigns: ${campaigns.filter(c => c.status === 'active').length}                                      ║
║  Floor Rules:     ${floorRules.length}                                           ║
╠══════════════════════════════════════════════════════════════╣
║  ENDPOINTS:                                             ║
║  POST /bid         - Receive bid requests                ║
║  POST /bid/batch   - Batch bid processing                ║
║  GET  /api/campaigns - Campaign management               ║
║  GET  /api/analytics - RTB analytics                     ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

export default app;