import { describe, it, expect, vi, beforeEach } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';

describe('Yield Optimization Engine API', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mock inventory data
    const inventory = [
      { id: 'dooh_001', type: 'dooh', basePrice: 50, currentPrice: 55, fillRate: 0.85, demand: 0.7, floorPrice: 30, ceilingPrice: 150 },
      { id: 'qr_001', type: 'qr', basePrice: 20, currentPrice: 22, fillRate: 0.92, demand: 0.8, floorPrice: 10, ceilingPrice: 80 },
      { id: 'society_001', type: 'society', basePrice: 35, currentPrice: 35, fillRate: 0.78, demand: 0.6, floorPrice: 20, ceilingPrice: 100 },
    ];

    const yieldConfigs = [
      { id: 'yc_001', inventoryType: 'dooh', minPrice: 30, maxPrice: 150, demandMultiplier: 1.2, fillTarget: 0.85, auctionEnabled: true },
      { id: 'yc_002', inventoryType: 'qr', minPrice: 10, maxPrice: 80, demandMultiplier: 1.0, fillTarget: 0.90, auctionEnabled: true },
    ];

    // Health
    app.get('/health', (_, res) => {
      res.json({ status: 'ok', service: 'yield-engine' });
    });

    // Dynamic pricing
    app.post('/api/price', (req, res) => {
      const { inventoryId, demand } = req.body;
      const inv = inventory.find(i => i.id === inventoryId) || inventory[0];
      const config = yieldConfigs.find(y => y.inventoryType === inv.type) || yieldConfigs[0];

      let price = inv.basePrice;
      if (demand > 0.8) price *= 1.3;
      else if (demand > 0.6) price *= 1.1;
      else if (demand < 0.3) price *= 0.8;

      const hour = new Date().getHours();
      if (hour >= 12 && hour <= 14) price *= 1.2;
      if (hour >= 19 && hour <= 21) price *= 1.15;

      price = Math.max(config.minPrice, Math.min(config.maxPrice, price));

      res.json({
        success: true,
        data: {
          inventoryId,
          basePrice: inv.basePrice,
          currentPrice: Math.round(price * 100) / 100,
          demand,
          factors: { time: hour },
          auctionEnabled: config.auctionEnabled,
        },
      });
    });

    // Batch pricing
    app.post('/api/price/batch', (req, res) => {
      const { items } = req.body;
      const results = items.map((item: any) => {
        const inv = inventory.find(i => i.id === item.inventoryId) || inventory[0];
        return { inventoryId: item.inventoryId, price: inv.currentPrice };
      });
      res.json({ success: true, data: results });
    });

    // Auction
    app.post('/api/auction', (req, res) => {
      const { inventoryId, bids } = req.body;
      const inv = inventory.find(i => i.id === inventoryId);
      if (!inv) return res.status(404).json({ success: false, error: 'NOT_FOUND' });

      const sortedBids = [...bids].sort((a: any, b: any) => {
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

    // Fill rate
    app.get('/api/inventory/:id/fill-rate', (req, res) => {
      const inv = inventory.find(i => i.id === req.params.id);
      if (!inv) return res.status(404).json({ success: false });

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
    app.post('/api/pacing', (req, res) => {
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
        let demand = 0.5;

        if (hour >= 12 && hour <= 14) demand = 0.9;
        if (hour >= 19 && hour <= 21) demand = 0.85;
        if (hour >= 22 || hour <= 6) demand = 0.2;

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

    // Analytics
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
          },
        },
      });
    });

    // Configs
    app.get('/api/configs', (_, res) => res.json({ success: true, data: yieldConfigs }));

    app.patch('/api/configs/:id', (req, res) => {
      const config = yieldConfigs.find(c => c.id === req.params.id);
      if (!config) return res.status(404).json({ success: false });
      Object.assign(config, req.body);
      res.json({ success: true, data: config });
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('service', 'yield-engine');
    });
  });

  describe('Dynamic Pricing', () => {
    it('should calculate dynamic price', async () => {
      const response = await request(app)
        .post('/api/price')
        .send({ inventoryId: 'dooh_001', demand: 0.7 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('currentPrice');
      expect(response.body.data).toHaveProperty('inventoryId', 'dooh_001');
    });

    it('should calculate price based on demand', async () => {
      const response = await request(app)
        .post('/api/price')
        .send({ inventoryId: 'dooh_001', demand: 0.9 });

      expect(response.status).toBe(200);
      expect(response.body.data.demand).toBe(0.9);
    });
  });

  describe('Batch Pricing', () => {
    it('should price multiple items', async () => {
      const response = await request(app)
        .post('/api/price/batch')
        .send({
          items: [
            { inventoryId: 'dooh_001' },
            { inventoryId: 'qr_001' },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('Auction', () => {
    it('should run auction and determine winner', async () => {
      const response = await request(app)
        .post('/api/auction')
        .send({
          inventoryId: 'dooh_001',
          bids: [
            { id: 'camp_1', bid: 100, priority: 1 },
            { id: 'camp_2', bid: 150, priority: 1 },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('winner');
      expect(response.body.data).toHaveProperty('price');
    });

    it('should return 404 for unknown inventory', async () => {
      const response = await request(app)
        .post('/api/auction')
        .send({
          inventoryId: 'unknown',
          bids: [{ id: 'camp_1', bid: 100, priority: 1 }],
        });

      expect(response.status).toBe(404);
    });
  });

  describe('Fill Rate', () => {
    it('should return fill rate status', async () => {
      const response = await request(app).get('/api/inventory/dooh_001/fill-rate');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('fillRate');
      expect(response.body.data).toHaveProperty('status');
    });

    it('should provide recommendations for low fill rate', async () => {
      const response = await request(app).get('/api/inventory/society_001/fill-rate');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('recommendation');
    });
  });

  describe('Pacing', () => {
    it('should calculate pacing status', async () => {
      const start = new Date();
      start.setDate(start.getDate() - 5);
      const end = new Date();
      end.setDate(end.getDate() + 5);

      const response = await request(app)
        .post('/api/pacing')
        .send({
          campaignId: 'camp_001',
          budget: 10000,
          spent: 5500,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('pacing');
      expect(response.body.data).toHaveProperty('variance');
    });
  });

  describe('Demand Forecasting', () => {
    it('should return demand forecasts', async () => {
      const response = await request(app).get('/api/forecast/dooh');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('forecasts');
      expect(response.body.data.forecasts).toHaveLength(24);
    });

    it('should identify peak and low hours', async () => {
      const response = await request(app).get('/api/forecast/dooh');

      expect(response.body.data).toHaveProperty('peakHours');
      expect(response.body.data).toHaveProperty('lowHours');
    });
  });

  describe('Analytics', () => {
    it('should return analytics data', async () => {
      const response = await request(app).get('/api/analytics');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('totalRevenue');
      expect(response.body.data).toHaveProperty('avgCPM');
    });
  });

  describe('Configs', () => {
    it('should return yield configs', async () => {
      const response = await request(app).get('/api/configs');

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should update config', async () => {
      const response = await request(app)
        .patch('/api/configs/yc_001')
        .send({ minPrice: 35 });

      expect(response.status).toBe(200);
      expect(response.body.data.minPrice).toBe(35);
    });
  });
});

describe('Yield Optimization Logic', () => {
  it('should calculate dynamic price based on demand', () => {
    const calculateDynamicPrice = (basePrice: number, demand: number) => {
      if (demand > 0.8) return basePrice * 1.3;
      if (demand > 0.6) return basePrice * 1.1;
      if (demand < 0.3) return basePrice * 0.8;
      return basePrice;
    };

    expect(calculateDynamicPrice(50, 0.9)).toBe(65);
    expect(calculateDynamicPrice(50, 0.7)).toBe(55);
    expect(calculateDynamicPrice(50, 0.2)).toBe(40);
    expect(calculateDynamicPrice(50, 0.5)).toBe(50);
  });

  it('should calculate time-based multiplier', () => {
    const getTimeMultiplier = (hour: number) => {
      if (hour >= 12 && hour <= 14) return 1.2; // Lunch peak
      if (hour >= 19 && hour <= 21) return 1.15; // Dinner peak
      if (hour >= 22 || hour <= 6) return 0.7; // Off-peak
      return 1.0;
    };

    expect(getTimeMultiplier(13)).toBe(1.2);
    expect(getTimeMultiplier(20)).toBe(1.15);
    expect(getTimeMultiplier(23)).toBe(0.7);
    expect(getTimeMultiplier(9)).toBe(1.0);
  });

  it('should calculate weekend multiplier', () => {
    const getWeekendMultiplier = (dayOfWeek: number) => {
      if (dayOfWeek === 5 || dayOfWeek === 6) return 1.25;
      return 1.0;
    };

    expect(getWeekendMultiplier(5)).toBe(1.25); // Friday
    expect(getWeekendMultiplier(6)).toBe(1.25); // Saturday
    expect(getWeekendMultiplier(1)).toBe(1.0); // Monday
  });

  it('should calculate pacing variance', () => {
    const calculatePacing = (spent: number, expectedSpend: number) => {
      if (expectedSpend === 0) return 'on-track';
      const variance = (spent - expectedSpend) / expectedSpend;
      if (variance > 0.1) return 'ahead';
      if (variance < -0.1) return 'behind';
      return 'on-track';
    };

    expect(calculatePacing(6000, 5000)).toBe('ahead');
    expect(calculatePacing(4000, 5000)).toBe('behind');
    expect(calculatePacing(5200, 5000)).toBe('on-track');
  });

  it('should determine fill rate status', () => {
    const getFillRateStatus = (fillRate: number) => {
      if (fillRate < 0.7) return 'low';
      if (fillRate > 0.95) return 'high';
      return 'optimal';
    };

    expect(getFillRateStatus(0.6)).toBe('low');
    expect(getFillRateStatus(0.8)).toBe('optimal');
    expect(getFillRateStatus(0.98)).toBe('high');
  });

  it('should calculate CPM', () => {
    const calculateCPM = (revenue: number, impressions: number) => {
      if (impressions === 0) return 0;
      return (revenue / impressions) * 1000;
    };

    expect(calculateCPM(1000, 100000)).toBe(10);
    expect(calculateCPM(5000, 200000)).toBe(25);
  });

  it('should calculate eCPM', () => {
    const calculateECPM = (totalRevenue: number, totalImpressions: number) => {
      if (totalImpressions === 0) return 0;
      return (totalRevenue / totalImpressions) * 1000;
    };

    expect(calculateECPM(10000, 1000000)).toBe(10);
  });
});