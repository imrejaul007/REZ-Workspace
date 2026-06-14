/**
 * Society Media Network Service
 *
 * Hyperlocal apartment complex advertising infrastructure.
 * Connects advertisers to residential societies for targeted campaigns.
 *
 * Port: 4580
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';

// ============================================================================
// TYPES
// ============================================================================

interface Society {
  id: string;
  name: string;
  address: string;
  zone: string;
  city: string;
  pincode: string;
  apartments: number;
  residents: number;
  avgIncome: 'low' | 'medium' | 'high';
  vehicleOwnership: {
    cars: number;
    twoWheelers: number;
  };
  screens: Screen[];
  amenities: string[];
  createdAt: Date;
}

interface Screen {
  id: string;
  location: 'lobby' | 'elevator' | 'clubhouse' | 'entrance';
  size: 'small' | 'medium' | 'large';
  resolution: string;
  active: boolean;
}

interface SocietyCampaign {
  id: string;
  advertiserId: string;
  name: string;
  targetCriteria: TargetCriteria;
  adFormat: 'lobby' | 'elevator' | 'qr' | 'all';
  creatives: Creative[];
  budget: number;
  startDate: Date;
  endDate: Date;
  status: 'draft' | 'active' | 'paused' | 'completed';
  stats: CampaignStats;
}

interface TargetCriteria {
  cities?: string[];
  zones?: string[];
  societies?: string[];
  incomeBrackets?: ('low' | 'medium' | 'high')[];
  apartmentRange?: { min: number; max: number };
  amenities?: string[];
  vehicleOwnership?: 'any' | 'cars' | 'two-wheelers' | 'none';
}

interface Creative {
  id: string;
  type: 'image' | 'video' | 'qr';
  url: string;
  cta?: string;
  duration?: number;
}

interface CampaignStats {
  impressions: number;
  scans: number;
  visits: number;
  conversions: number;
  spend: number;
  ctr: number;
  scanRate: number;
  conversionRate: number;
}

interface QRPlacement {
  id: string;
  societyId: string;
  location: string;
  type: 'lobby' | 'notice-board' | 'elevator' | 'clubhouse';
  active: boolean;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const societies: Society[] = [
  {
    id: 'soc_001',
    name: 'Sunshine Apartments',
    address: '42 MG Road, Koramangala',
    zone: 'Koramangala',
    city: 'Bangalore',
    pincode: '560034',
    apartments: 120,
    residents: 480,
    avgIncome: 'high',
    vehicleOwnership: { cars: 85, twoWheelers: 60 },
    screens: [
      { id: 'scr_001', location: 'lobby', size: 'large', resolution: '4K', active: true },
      { id: 'scr_002', location: 'elevator', size: 'small', resolution: '1080p', active: true },
    ],
    amenities: ['pool', 'gym', 'clubhouse', 'garden'],
    createdAt: new Date('2024-01-15'),
  },
  {
    id: 'soc_002',
    name: 'Green Valley Residency',
    address: '15 HS Road, Whitefield',
    zone: 'Whitefield',
    city: 'Bangalore',
    pincode: '560066',
    apartments: 80,
    residents: 320,
    avgIncome: 'medium',
    vehicleOwnership: { cars: 40, twoWheelers: 55 },
    screens: [
      { id: 'scr_003', location: 'lobby', size: 'medium', resolution: '1080p', active: true },
    ],
    amenities: ['garden', 'playground', 'clubhouse'],
    createdAt: new Date('2024-03-20'),
  },
  {
    id: 'soc_003',
    name: 'Metro Heights',
    address: '88 NH7, HSR Layout',
    zone: 'HSR',
    city: 'Bangalore',
    pincode: '560102',
    apartments: 200,
    residents: 800,
    avgIncome: 'medium',
    vehicleOwnership: { cars: 120, twoWheelers: 100 },
    screens: [
      { id: 'scr_004', location: 'lobby', size: 'large', resolution: '4K', active: true },
      { id: 'scr_005', location: 'elevator', size: 'medium', resolution: '1080p', active: true },
      { id: 'scr_006', location: 'clubhouse', size: 'large', resolution: '4K', active: true },
    ],
    amenities: ['pool', 'gym', 'tennis', 'squash', 'clubhouse', 'garden'],
    createdAt: new Date('2023-08-10'),
  },
  {
    id: 'soc_004',
    name: 'Lakeside Towers',
    address: '5 UB City, Indiranagar',
    zone: 'Indiranagar',
    city: 'Bangalore',
    pincode: '560038',
    apartments: 150,
    residents: 600,
    avgIncome: 'high',
    vehicleOwnership: { cars: 140, twoWheelers: 30 },
    screens: [
      { id: 'scr_007', location: 'lobby', size: 'large', resolution: '4K', active: true },
      { id: 'scr_008', location: 'entrance', size: 'medium', resolution: '1080p', active: true },
    ],
    amenities: ['pool', 'gym', 'spa', 'clubhouse'],
    createdAt: new Date('2024-02-01'),
  },
  {
    id: 'soc_005',
    name: 'Urban Nest',
    address: '22 MG Road, Andheri',
    zone: 'Andheri',
    city: 'Mumbai',
    pincode: '400069',
    apartments: 90,
    residents: 360,
    avgIncome: 'medium',
    vehicleOwnership: { cars: 55, twoWheelers: 45 },
    screens: [
      { id: 'scr_009', location: 'lobby', size: 'medium', resolution: '1080p', active: true },
    ],
    amenities: ['gym', 'garden', 'clubhouse'],
    createdAt: new Date('2024-04-15'),
  },
];

const campaigns: SocietyCampaign[] = [
  {
    id: 'cmp_001',
    advertiserId: 'adv_001',
    name: 'Pizza Delivery Launch',
    targetCriteria: {
      cities: ['Bangalore'],
      incomeBrackets: ['medium', 'high'],
      apartmentRange: { min: 50, max: 300 },
    },
    adFormat: 'all',
    creatives: [
      { id: 'cr_001', type: 'image', url: 'https://cdn.example.com/pizza-ad.jpg', cta: 'Order Now' },
      { id: 'cr_002', type: 'qr', url: 'https://cdn.example.com/pizza-qr.png' },
    ],
    budget: 50000,
    startDate: new Date('2026-05-20'),
    endDate: new Date('2026-06-20'),
    status: 'active',
    stats: {
      impressions: 45000,
      scans: 1250,
      visits: 380,
      conversions: 95,
      spend: 18500,
      ctr: 2.78,
      scanRate: 2.78,
      conversionRate: 25,
    },
  },
];

const qrPlacements: QRPlacement[] = [
  { id: 'qr_001', societyId: 'soc_001', location: 'Lobby near reception', type: 'lobby', active: true },
  { id: 'qr_002', societyId: 'soc_001', location: 'Notice board near elevator', type: 'notice-board', active: true },
  { id: 'qr_003', societyId: 'soc_002', location: 'Clubhouse entrance', type: 'clubhouse', active: true },
  { id: 'qr_004', societyId: 'soc_003', location: 'Elevator doors', type: 'elevator', active: true },
  { id: 'qr_005', societyId: 'soc_003', location: 'Lobby display', type: 'lobby', active: true },
];

// ============================================================================
// EXPRESS APP
// ============================================================================

const app = express();
const PORT = parseInt(process.env.PORT || '4580', 10);

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
    service: 'society-media-service',
    version: '1.0.0',
    networks: societies.length,
    activeCampaigns: campaigns.filter(c => c.status === 'active').length,
  });
});

// ============================================================================
// SOCIETY ENDPOINTS
// ============================================================================

// List societies with filters
app.get('/api/societies', (req: Request, res: Response) => {
  const { city, zone, income, minApartments, maxApartments } = req.query;

  let filtered = [...societies];

  if (city) filtered = filtered.filter(s => s.city === city);
  if (zone) filtered = filtered.filter(s => s.zone === zone);
  if (income) filtered = filtered.filter(s => s.avgIncome === income);
  if (minApartments) filtered = filtered.filter(s => s.apartments >= Number(minApartments));
  if (maxApartments) filtered = filtered.filter(s => s.apartments <= Number(maxApartments));

  res.json({
    success: true,
    data: {
      societies: filtered.map(s => ({
        id: s.id,
        name: s.name,
        city: s.city,
        zone: s.zone,
        apartments: s.apartments,
        residents: s.residents,
        avgIncome: s.avgIncome,
        screenCount: s.screens.filter(sc => sc.active).length,
      })),
      total: filtered.length,
      totalReach: filtered.reduce((sum, s) => sum + s.residents, 0),
    },
  });
});

// Get society details
app.get('/api/societies/:id', (req: Request, res: Response) => {
  const society = societies.find(s => s.id === req.params.id);

  if (!society) {
    return res.status(404).json({ success: false, error: 'Society not found' });
  }

  res.json({ success: true, data: society });
});

// Get available inventory for society
app.get('/api/societies/:id/inventory', (req: Request, res: Response) => {
  const society = societies.find(s => s.id === req.params.id);

  if (!society) {
    return res.status(404).json({ success: false, error: 'Society not found' });
  }

  const inventory = {
    screens: society.screens.filter(s => s.active).map(s => ({
      id: s.id,
      location: s.location,
      size: s.size,
      resolution: s.resolution,
      rates: {
        daily: s.size === 'large' ? 2500 : s.size === 'medium' ? 1500 : 800,
        weekly: s.size === 'large' ? 14000 : s.size === 'medium' ? 8000 : 4000,
        monthly: s.size === 'large' ? 45000 : s.size === 'medium' ? 25000 : 12000,
      },
    })),
    qrPlacements: qrPlacements.filter(q => q.societyId === society.id && q.active),
  };

  res.json({ success: true, data: inventory });
});

// ============================================================================
// CAMPAIGN ENDPOINTS
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
      campaigns: filtered,
      total: filtered.length,
      activeBudget: filtered.filter(c => c.status === 'active').reduce((sum, c) => sum + c.budget, 0),
    },
  });
});

// Create campaign
app.post('/api/campaigns', (req: Request, res: Response) => {
  const { name, advertiserId, targetCriteria, adFormat, creatives, budget, startDate, endDate } = req.body;

  if (!name || !advertiserId || !budget) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const campaign: SocietyCampaign = {
    id: `cmp_${Date.now()}`,
    advertiserId,
    name,
    targetCriteria: targetCriteria || {},
    adFormat: adFormat || 'all',
    creatives: creatives || [],
    budget,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    status: 'draft',
    stats: {
      impressions: 0,
      scans: 0,
      visits: 0,
      conversions: 0,
      spend: 0,
      ctr: 0,
      scanRate: 0,
      conversionRate: 0,
    },
  };

  campaigns.push(campaign);

  res.json({ success: true, data: campaign });
});

// Get campaign
app.get('/api/campaigns/:id', (req: Request, res: Response) => {
  const campaign = campaigns.find(c => c.id === req.params.id);

  if (!campaign) {
    return res.status(404).json({ success: false, error: 'Campaign not found' });
  }

  res.json({ success: true, data: campaign });
});

// Update campaign status
app.patch('/api/campaigns/:id/status', (req: Request, res: Response) => {
  const campaign = campaigns.find(c => c.id === req.params.id);

  if (!campaign) {
    return res.status(404).json({ success: false, error: 'Campaign not found' });
  }

  const { status } = req.body;

  if (!['draft', 'active', 'paused', 'completed'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status' });
  }

  campaign.status = status;

  res.json({ success: true, data: campaign });
});

// ============================================================================
// TARGETING ENDPOINTS
// ============================================================================

// Get targetable societies
app.post('/api/targeting/societies', (req: Request, res: Response) => {
  const { cities, zones, incomeBrackets, apartmentRange, amenities, vehicleOwnership } = req.body;

  let targetable = societies.filter(s => s.screens.some(sc => sc.active));

  if (cities?.length) targetable = targetable.filter(s => cities.includes(s.city));
  if (zones?.length) targetable = targetable.filter(s => zones.includes(s.zone));
  if (incomeBrackets?.length) targetable = targetable.filter(s => incomeBrackets.includes(s.avgIncome));
  if (apartmentRange) {
    targetable = targetable.filter(s => s.apartments >= apartmentRange.min && s.apartments <= apartmentRange.max);
  }
  if (amenities?.length) {
    targetable = targetable.filter(s => amenities.every(a => s.amenities.includes(a)));
  }
  if (vehicleOwnership && vehicleOwnership !== 'any') {
    if (vehicleOwnership === 'cars') targetable = targetable.filter(s => s.vehicleOwnership.cars > 0);
    if (vehicleOwnership === 'two-wheelers') targetable = targetable.filter(s => s.vehicleOwnership.twoWheelers > 0);
    if (vehicleOwnership === 'none') targetable = targetable.filter(s => s.vehicleOwnership.cars === 0 && s.vehicleOwnership.twoWheelers === 0);
  }

  // Estimate reach
  const totalReach = targetable.reduce((sum, s) => sum + s.residents, 0);
  const totalScreens = targetable.reduce((sum, s) => sum + s.screens.filter(sc => sc.active).length, 0);

  res.json({
    success: true,
    data: {
      societies: targetable.map(s => ({
        id: s.id,
        name: s.name,
        city: s.city,
        zone: s.zone,
        residents: s.residents,
        screens: s.screens.filter(sc => sc.active).length,
      })),
      stats: {
        count: targetable.length,
        totalReach,
        totalScreens,
        avgApartments: targetable.length ? Math.round(targetable.reduce((sum, s) => sum + s.apartments, 0) / targetable.length) : 0,
      },
    },
  });
});

// Estimate campaign reach
app.post('/api/targeting/estimate', (req: Request, res: Response) => {
  const { targetCriteria, adFormat, budget } = req.body;

  // Get matching societies
  let matching = societies.filter(s => s.screens.some(sc => sc.active));

  if (targetCriteria.cities?.length) matching = matching.filter(s => targetCriteria.cities.includes(s.city));
  if (targetCriteria.zones?.length) matching = matching.filter(s => targetCriteria.zones.includes(s.zone));
  if (targetCriteria.incomeBrackets?.length) matching = matching.filter(s => targetCriteria.incomeBrackets.includes(s.avgIncome));

  const reach = matching.reduce((sum, s) => sum + s.residents, 0);
  const screens = matching.reduce((sum, s) => sum + s.screens.filter(sc => sc.active).length, 0);

  // Estimate impressions (avg 3 views/day × 30 days × reach)
  const impressions = reach * 3 * 30;
  const cpm = 25; // ₹25 per 1000 impressions
  const estimatedCost = Math.round((impressions / 1000) * cpm);

  res.json({
    success: true,
    data: {
      reach,
      matchingSocieties: matching.length,
      screens,
      estimatedImpressions: impressions,
      estimatedCost,
      cpm,
      budgetEfficiency: budget ? Math.round((impressions / budget) * 100) / 100 : null,
    },
  });
});

// ============================================================================
// QR PLACEMENT ENDPOINTS
// ============================================================================

// Get QR placements
app.get('/api/qr', (req: Request, res: Response) => {
  const { societyId, active } = req.query;

  let filtered = [...qrPlacements];

  if (societyId) filtered = filtered.filter(q => q.societyId === societyId);
  if (active !== undefined) filtered = filtered.filter(q => q.active === (active === 'true'));

  res.json({ success: true, data: filtered });
});

// Record QR scan
app.post('/api/qr/:id/scan', (req: Request, res: Response) => {
  const { userId, timestamp } = req.body;

  const qr = qrPlacements.find(q => q.id === req.params.id);

  if (!qr) {
    return res.status(404).json({ success: false, error: 'QR placement not found' });
  }

  res.json({
    success: true,
    data: {
      scanId: `scan_${Date.now()}`,
      qrId: qr.id,
      userId,
      timestamp: timestamp || Date.now(),
      societyId: qr.societyId,
    },
  });
});

// ============================================================================
// ANALYTICS ENDPOINTS
// ============================================================================

// Get campaign analytics
app.get('/api/analytics/campaigns/:id', (req: Request, res: Response) => {
  const campaign = campaigns.find(c => c.id === req.params.id);

  if (!campaign) {
    return res.status(404).json({ success: false, error: 'Campaign not found' });
  }

  // Simulate real-time stats
  const currentStats = {
    ...campaign.stats,
    impressions: campaign.stats.impressions + Math.floor(Math.random() * 100),
    scans: campaign.stats.scans + Math.floor(Math.random() * 10),
  };

  res.json({
    success: true,
    data: {
      campaignId: campaign.id,
      stats: currentStats,
      metrics: {
        cpm: Math.round((currentStats.spend / currentStats.impressions) * 1000) || 0,
        cpc: Math.round((currentStats.spend / currentStats.clicks) * 100) / 100 || 0,
        cps: Math.round((currentStats.spend / currentStats.scans) * 100) / 100 || 0,
        cpa: Math.round((currentStats.spend / currentStats.conversions) * 100) / 100 || 0,
      },
      trends: {
        impressionsGrowth: '+12%',
        scanRateChange: '+0.3%',
        conversionRateChange: '+2.1%',
      },
    },
  });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  logger.info(`
╔══════════════════════════════════════════════════════════════╗
║           SOCIETY MEDIA NETWORK SERVICE v1.0.0             ║
╠══════════════════════════════════════════════════════════════╣
║  Port:     ${PORT}                                             ║
║  Cities:   Bangalore, Mumbai                               ║
║  Societies: ${societies.length}                                          ║
║  Active:   ${campaigns.filter(c => c.status === 'active').length} campaigns                                        ║
╠══════════════════════════════════════════════════════════════╣
║  FEATURES:                                                  ║
║  ✓ Society Targeting   ✓ Screen Inventory                   ║
║  ✓ QR Placements       ✓ Campaign Analytics                 ║
║  ✓ Hyperlocal Reach    ✓ Income-based Targeting             ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

export default app;
