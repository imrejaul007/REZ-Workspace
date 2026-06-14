/**
 * Yield Optimization Engine - Maximize ad revenue
 *
 * Features:
 * - Dynamic pricing
 * - Fill rate optimization
 * - Auction management
 * - Demand forecasting
 * - Pacing algorithms
 *
 * Port: 4860
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';

interface Inventory {
  id: string;
  type: 'dooh' | 'qr' | 'society' | 'community';
  basePrice: number;
  currentPrice: number;
  fillRate: number;
  demand: number;
  floorPrice: number;
  ceilingPrice: number;
}

interface Campaign {
  id: string;
  bid: number;
  budget: number;
  spent: number;
  priority: number;
  pacing: 'even' | 'accelerated' | 'frontload';
}

interface YieldConfig {
  id: string;
  inventoryType: string;
  minPrice: number;
  maxPrice: number;
  demandMultiplier: number;
  fillTarget: number;
  auctionEnabled: boolean;
}

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
const PORT = parseInt(process.env.PORT || '4860', 10);

const inventory: Inventory[] = [
  { id: 'dooh_001', type: 'dooh', basePrice: 50, currentPrice: 50, fillRate: 0.85, demand: 0.7, floorPrice: 30, ceilingPrice: 150 },
  { id: 'qr_001', type: 'qr', basePrice: 20, currentPrice: 20, fillRate: 0.92, demand: 0.8, floorPrice: 10, ceilingPrice: 80 },
  { id: 'society_001', type: 'society', basePrice: 35, currentPrice: 35, fillRate: 0.78, demand: 0.6, floorPrice: 20, ceilingPrice: 100 },
  { id: 'community_001', type: 'community', basePrice: 25, currentPrice: 25, fillRate: 0.88, demand: 0.65, floorPrice: 15, ceilingPrice: 90 },
];

const yieldConfigs: YieldConfig[] = [
  { id: 'yc_001', inventoryType: 'dooh', minPrice: 30, maxPrice: 150, demandMultiplier: 1.2, fillTarget: 0.85, auctionEnabled: true },
  { id: 'yc_002', inventoryType: 'qr', minPrice: 10, maxPrice: 80, demandMultiplier: 1.0, fillTarget: 0.90, auctionEnabled: true },
  { id: 'yc_003', inventoryType: 'society', minPrice: 20, maxPrice: 100, demandMultiplier: 1.1, fillTarget: 0.80, auctionEnabled: true },
  { id: 'yc_004', inventoryType: 'community', minPrice: 15, maxPrice: 90, demandMultiplier: 1.0, fillTarget: 0.85, auctionEnabled: true },
];

// Health
app.get('/health', (_, res) => res.json({ status: 'ok', service: 'yield-engine' }));

// Dynamic pricing
app.post('/api/price', (req: Request, res: Response) => {
  const { inventoryId, demand, context } = req.body;
  const inv = inventory.find(i => i.id === inventoryId) || inventory[0];
  const config = yieldConfigs.find(y => y.inventoryType === inv.type) || yieldConfigs[0];

  // Calculate dynamic price
  let price = inv.basePrice;
  if (demand > 0.8) price *= 1.3; // High demand
  else if (demand > 0.6) price *= 1.1; // Medium demand
  else if (demand < 0.3) price *= 0.8; // Low demand

  // Apply time multiplier
  const hour = new Date().getHours();
  if (hour >= 12 && hour <= 14) price *= 1.2; // Lunch peak
  if (hour >= 19 && hour <= 21) price *= 1.15; // Dinner peak
  if (hour >= 22 || hour <= 6) price *= 0.7; // Off-peak

  // Apply day multiplier
  const day = new Date().getDay();
  if (day === 5 || day === 6) price *= 1.25; // Weekend

  // Clamp to bounds
  price = Math.max(config.minPrice, Math.min(config.maxPrice, price));

  inv.currentPrice = Math.round(price * 100) / 100;

  res.json({
    success: true,
    data: {
      inventoryId,
      basePrice: inv.basePrice,
      currentPrice: inv.currentPrice,
      demand,
      factors: { time: hour, day, context },
      auctionEnabled: config.auctionEnabled,
    },
  });
});

// Batch pricing
app.post('/api/price/batch', (req: Request, res: Response) => {
  const { items } = req.body;
  const results = items.map((item: any) => {
    const inv = inventory.find(i => i.id === item.inventoryId) || inventory[0];
    return { inventoryId: item.inventoryId, price: inv.currentPrice };
  });
  res.json({ success: true, data: results });
});

// Auction
app.post('/api/auction', (req: Request, res: Response) => {
  const { inventoryId, bids } = req.body;
  const inv = inventory.find(i => i.id === inventoryId);
  if (!inv) return res.status(404).json({ success: false, error: 'NOT_FOUND' });

  // Sort bids by priority and bid amount
  const sortedBids = [...bids].sort((a: Campaign, b: Campaign) => {
    const scoreA = a.bid * a.priority;
    const scoreB = b.bid * b.priority;
    return scoreB - scoreA;
  });

  const winner = sortedBids[0];

  res.json({
    success: true,
    data: {
      winner: winner ? { campaignId: winner.id, bid: winner.bid } : null,
      price: inv.currentPrice,
      bidders: bids.length,
      timestamp: Date.now(),
    },
  });
});

// Fill rate optimization
app.get('/api/inventory/:id/fill-rate', (req, res) => {
  const inv = inventory.find(i => i.id === req.params.id);
  if (!inv) return res.status(404).json({ success: false });

  // Analyze fill rate
  let status = 'optimal';
  let recommendation = '';

  if (inv.fillRate < 0.7) {
    status = 'low';
    recommendation = 'Consider lowering floor price to improve fill rate';
  } else if (inv.fillRate > 0.95) {
    status = 'high';
    recommendation = 'Floor price could be higher for better revenue';
  }

  res.json({
    success: true,
    data: {
      inventoryId: inv.id,
      fillRate: inv.fillRate,
      targetFillRate: 0.85,
      status,
      recommendation,
    },
  });
});

// Pacing
app.post('/api/pacing', (req: Request, res: Response) => {
  const { campaignId, budget, spent, startDate, endDate } = req.body;

  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = Date.now();
  const totalDuration = end - start;
  const elapsed = now - start;
  const expectedSpend = (elapsed / totalDuration) * budget;

  const variance = (spent - expectedSpend) / expectedSpend;
  let pacing = variance > 0.1 ? 'ahead' : variance < -0.1 ? 'behind' : 'on-track';

  let recommendation = '';
  if (variance > 0.2) recommendation = 'Slow down spending';
  else if (variance < -0.2) recommendation = 'Increase pacing';

  res.json({
    success: true,
    data: {
      campaignId,
      budget,
      spent,
      expectedSpend: Math.round(expectedSpend),
      variance: Math.round(variance * 100),
      pacing,
      recommendation,
    },
  });
});

// Demand forecasting
app.get('/api/forecast/:inventoryType', (req, res) => {
  const { inventoryType } = req.params;
  const forecasts = [];
  const now = Date.now();

  for (let i = 0; i < 24; i++) {
    const hour = (now + i * 3600000) / 3600000 % 24;
    let demand = 0.5; // Base demand

    // Time patterns
    if (hour >= 12 && hour <= 14) demand = 0.9; // Lunch
    if (hour >= 19 && hour <= 21) demand = 0.85; // Dinner
    if (hour >= 22 || hour <= 6) demand = 0.2; // Night

    forecasts.push({ hour: Math.round(hour), demand: Math.round(demand * 100) / 100 });
  }

  res.json({
    success: true,
    data: {
      inventoryType,
      forecasts,
      peakHours: forecasts.filter(f => f.demand > 0.8).map(f => f.hour),
      lowHours: forecasts.filter(f => f.demand < 0.3).map(f => f.hour),
    },
  });
});

// Yield analytics
app.get('/api/analytics', (_, res) => {
  res.json({
    success: true,
    data: {
      totalRevenue: 2345678,
      avgCPM: 52,
      fillRate: 0.87,
      byType: {
        dooh: { revenue: 1200000, cpm: 65, fillRate: 0.85 },
        qr: { revenue: 450000, cpm: 28, fillRate: 0.92 },
        society: { revenue: 380000, cpm: 42, fillRate: 0.78 },
        community: { revenue: 316678, cpm: 35, fillRate: 0.88 },
      },
      optimization: {
        priceIncrease: 0.12,
        fillRateImprovement: 0.08,
        revenueImpact: 185000,
      },
    },
  });
});

// Yield configs
app.get('/api/configs', (_, res) => res.json({ success: true, data: yieldConfigs }));

app.patch('/api/configs/:id', (req, res) => {
  const config = yieldConfigs.find(c => c.id === req.params.id);
  if (!config) return res.status(404).json({ success: false });
  Object.assign(config, req.body);
  res.json({ success: true, data: config });
});

app.listen(PORT, () => logger.info(`[Yield Engine] Running on port ${PORT}`));
export default app;
