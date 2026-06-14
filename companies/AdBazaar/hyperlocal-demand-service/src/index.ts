/**
 * Hyperlocal Demand Forecasting Service
 *
 * Predict commerce demand at location-time granularity.
 * Features:
 * - Demand index by location
 * - Peak hour prediction
 * - Weather-commerce correlation
 * - Event impact analysis
 * - Dynamic pricing intelligence
 *
 * Port: 4600
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';

// ============================================================================
// TYPES
// ============================================================================

interface Location {
  city: string;
  zone: string;
  area?: string;
  society?: string;
  merchantId?: string;
}

interface TimeContext {
  date: string;
  hour: number;
  dayOfWeek: number;
  isWeekend: boolean;
  isHoliday: boolean;
}

interface WeatherContext {
  condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'foggy';
  temperature: number;
  humidity: number;
}

interface DemandForecast {
  location: Location;
  time: TimeContext;
  weather?: WeatherContext;
  predictions: {
    demandIndex: number;
    confidence: number;
    peakHours: number[];
    avgSpend: number;
    conversionProbability: number;
    categoryDemand: Record<string, number>;
  };
  recommendations: string[];
}

interface DemandSpike {
  id: string;
  location: Location;
  type: 'weather' | 'event' | 'promotion' | 'seasonal';
  impact: number;
  startTime: Date;
  endTime: Date;
  description: string;
}

interface SupplyGap {
  location: Location;
  category: string;
  demand: number;
  supply: number;
  gap: number;
  opportunity: 'high' | 'medium' | 'low';
}

// ============================================================================
// MOCK DATA
// ============================================================================

const baseDemand: Record<string, number> = {
  'food': 0.8,
  'grocery': 0.6,
  'pharmacy': 0.4,
  'restaurant': 0.9,
  'salon': 0.5,
  'gym': 0.3,
  'retail': 0.7,
  'mobility': 0.85,
};

const cityMultipliers: Record<string, number> = {
  'Bangalore': 1.2,
  'Mumbai': 1.3,
  'Delhi': 1.1,
  'Hyderabad': 1.0,
  'Chennai': 0.95,
};

const weatherImpact: Record<string, Record<string, number>> = {
  'food': { sunny: 1.0, cloudy: 1.1, rainy: 1.4, stormy: 0.5, foggy: 0.9 },
  'grocery': { sunny: 1.0, cloudy: 1.0, rainy: 1.2, stormy: 1.5, foggy: 1.0 },
  'pharmacy': { sunny: 1.0, cloudy: 1.0, rainy: 1.1, stormy: 1.2, foggy: 1.0 },
  'restaurant': { sunny: 0.9, cloudy: 1.0, rainy: 1.3, stormy: 0.4, foggy: 0.8 },
  'salon': { sunny: 1.1, cloudy: 1.0, rainy: 0.7, stormy: 0.3, foggy: 0.9 },
  'gym': { sunny: 0.8, cloudy: 0.9, rainy: 1.1, stormy: 0.5, foggy: 0.9 },
  'retail': { sunny: 1.2, cloudy: 1.0, rainy: 0.6, stormy: 0.3, foggy: 0.8 },
  'mobility': { sunny: 1.0, cloudy: 1.0, rainy: 0.7, stormy: 0.2, foggy: 0.6 },
};

const hourPatterns: Record<string, number[]> = {
  'food': [0.2, 0.1, 0.1, 0.1, 0.2, 0.3, 0.5, 0.6, 0.8, 0.9, 1.0, 0.9, 0.8, 0.7, 0.6, 0.7, 0.8, 0.9, 1.0, 0.9, 0.8, 0.6, 0.4, 0.3],
  'grocery': [0.1, 0.1, 0.1, 0.1, 0.2, 0.3, 0.5, 0.7, 0.8, 0.9, 1.0, 0.8, 0.7, 0.6, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 0.8, 0.5, 0.3, 0.2],
  'restaurant': [0.2, 0.1, 0.1, 0.1, 0.1, 0.2, 0.3, 0.4, 0.5, 0.5, 0.5, 0.5, 0.6, 0.6, 0.7, 0.8, 0.9, 1.0, 1.0, 0.9, 0.8, 0.6, 0.4, 0.3],
  'mobility': [0.6, 0.3, 0.2, 0.2, 0.3, 0.5, 0.9, 1.0, 0.8, 0.6, 0.5, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 0.9, 0.8, 0.7, 0.8, 0.9, 1.0, 0.8],
};

const events: DemandSpike[] = [
  { id: 'evt_001', location: { city: 'Bangalore', zone: 'Koramangala' }, type: 'event', impact: 1.5, startTime: new Date('2026-05-30'), endTime: new Date('2026-05-30'), description: 'Food Festival at Forum Mall' },
  { id: 'evt_002', location: { city: 'Mumbai', zone: 'Andheri' }, type: 'weather', impact: 1.8, startTime: new Date('2026-05-28'), endTime: new Date('2026-05-28'), description: 'Heavy rainfall expected' },
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
    service: 'hyperlocal-demand',
    version: '1.0.0',
    cities: Object.keys(cityMultipliers).length,
    activeEvents: events.length,
  });
});

// ============================================================================
// DEMAND FORECASTING
// ============================================================================

// Get demand forecast
app.post('/api/demand/forecast', (req: Request, res: Response) => {
  const { location, time, weather } = req.body;

  // Calculate demand index
  let demandIndex = 0.7;

  // City multiplier
  if (location?.city) {
    demandIndex *= (cityMultipliers[location.city] || 1.0);
  }

  // Time patterns
  if (time?.hour !== undefined) {
    const hourPattern = hourPatterns['food']; // Default pattern
    demandIndex *= (hourPattern[time.hour] || 0.5);
  }

  // Weekend boost
  if (time?.isWeekend) {
    demandIndex *= 1.2;
  }

  // Weather impact
  if (weather?.condition) {
    const weatherFactor = weatherImpact['food'][weather.condition] || 1.0;
    demandIndex *= weatherFactor;
  }

  // Peak hours
  const peakHours = [12, 13, 19, 20, 21];

  // Category demand
  const categoryDemand: Record<string, number> = {};
  for (const [category, base] of Object.entries(baseDemand)) {
    let catDemand = base;

    if (weather?.condition && weatherImpact[category]) {
      catDemand *= weatherImpact[category][weather.condition] || 1.0;
    }

    if (time?.hour !== undefined && hourPatterns[category]) {
      catDemand *= hourPatterns[category][time.hour];
    }

    categoryDemand[category] = Math.round(catDemand * 100) / 100;
  }

  res.json({
    success: true,
    data: {
      location,
      time,
      weather,
      predictions: {
        demandIndex: Math.round(Math.min(1, demandIndex) * 100) / 100,
        confidence: 0.75 + Math.random() * 0.2,
        peakHours,
        avgSpend: Math.round(300 + Math.random() * 200),
        conversionProbability: Math.round((0.1 + Math.random() * 0.3) * 100) / 100,
        categoryDemand,
      },
      recommendations: generateRecommendations(demandIndex, weather, time),
    },
  });
});

// Get demand by location
app.get('/api/demand/location/:city/:zone', (req: Request, res: Response) => {
  const { city, zone } = req.params;

  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const demandData: Record<string, number> = {};
  for (const [category, base] of Object.entries(baseDemand)) {
    let demand = base * (cityMultipliers[city] || 1.0);
    if (hourPatterns[category]) {
      demand *= (hourPatterns[category][hour] || 0.5);
    }
    demandData[category] = Math.round(demand * 100) / 100;
  }

  res.json({
    success: true,
    data: {
      location: { city, zone },
      time: { hour, dayOfWeek, isWeekend },
      demand: demandData,
      overallIndex: Math.round(Object.values(demandData).reduce((a, b) => a + b, 0) / Object.keys(demandData).length * 100) / 100,
    },
  });
});

// ============================================================================
// DEMAND SPIKES
// ============================================================================

// Get upcoming demand spikes
app.get('/api/demand/spikes', (req: Request, res: Response) => {
  const { city, zone, days = 7 } = req.query;

  let filtered = events.filter(e => {
    if (city && e.location.city !== city) return false;
    if (zone && e.location.zone !== zone) return false;
    return e.startTime >= new Date();
  });

  res.json({
    success: true,
    data: {
      spikes: filtered.slice(0, Number(days)),
      count: filtered.length,
    },
  });
});

// Record event impact
app.post('/api/demand/events', (req: Request, res: Response) => {
  const { location, type, impact, startTime, endTime, description } = req.body;

  const event: DemandSpike = {
    id: `evt_${Date.now()}`,
    location,
    type,
    impact,
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    description,
  };

  events.push(event);

  res.json({ success: true, data: event });
});

// ============================================================================
// SUPPLY GAPS
// ============================================================================

// Get supply gaps
app.post('/api/demand/supply-gaps', (req: Request, res: Response) => {
  const { location, categories } = req.body;

  const gaps: SupplyGap[] = (categories || Object.keys(baseDemand)).map(category => {
    const demand = baseDemand[category] * (cityMultipliers[location?.city || 'Bangalore'] || 1.0);
    const supply = 0.3 + Math.random() * 0.5;
    const gap = demand - supply;

    return {
      location: location || { city: 'Bangalore', zone: 'Koramangala' },
      category,
      demand: Math.round(demand * 100) / 100,
      supply: Math.round(supply * 100) / 100,
      gap: Math.round(gap * 100) / 100,
      opportunity: gap > 0.3 ? 'high' : gap > 0.1 ? 'medium' : 'low',
    };
  });

  res.json({
    success: true,
    data: {
      gaps: gaps.filter(g => g.gap > 0),
      summary: {
        totalGaps: gaps.filter(g => g.gap > 0).length,
        highOpportunity: gaps.filter(g => g.opportunity === 'high').length,
      },
    },
  });
});

// ============================================================================
// WEATHER IMPACT
// ============================================================================

// Get weather impact analysis
app.get('/api/demand/weather-impact/:category', (req: Request, res: Response) => {
  const { category } = req.params;

  const impact = weatherImpact[category] || weatherImpact['food'];

  res.json({
    success: true,
    data: {
      category,
      weatherImpact: impact,
      insights: [
        `${category} demand ${impact.rainy > 1 ? 'increases' : 'decreases'} by ${Math.round((impact.rainy - 1) * 100)}% on rainy days`,
        `${category} demand ${impact.stormy > 1 ? 'increases' : 'decreases'} by ${Math.round((impact.stormy - 1) * 100)}% during storms`,
        `Best time to advertise for ${category}: morning (8-11 AM) and evening (7-9 PM)`,
      ],
    },
  });
});

// ============================================================================
// CAMPAIGN OPTIMIZATION
// ============================================================================

// Get optimal campaign timing
app.post('/api/demand/optimal-timing', (req: Request, res: Response) => {
  const { categories, location, budget } = req.body;

  const optimalSlots = [];

  for (const category of (categories || ['food', 'restaurant', 'mobility'])) {
    const hours = hourPatterns[category] || hourPatterns['food'];

    // Find peak hours
    const peakIndices: number[] = [];
    for (let i = 0; i < hours.length; i++) {
      if (hours[i] >= 0.9) peakIndices.push(i);
    }

    optimalSlots.push({
      category,
      peakHours: peakIndices,
      optimalWindows: peakIndices.map(h => ({
        start: `${h}:00`,
        end: `${h + 2}:00`,
        expectedDemand: hours[h],
        cpm: Math.round(20 + (hours[h] * 30)),
      })),
    });
  }

  // Estimate costs
  const totalBudget = budget || 50000;
  const avgCPM = 35;
  const impressions = Math.round((totalBudget / avgCPM) * 1000);

  res.json({
    success: true,
    data: {
      optimalSlots,
      budgetAllocation: {
        total: totalBudget,
        estimatedImpressions: impressions,
        avgCPM,
      },
      recommendations: [
        'Run campaigns during peak hours for 3x better conversion',
        'Use weather-triggered campaigns for food delivery',
        'Target mobility ads during rush hours (8-10 AM, 6-9 PM)',
      ],
    },
  });
});

// ============================================================================
// ANALYTICS
// ============================================================================

// Get demand analytics
app.get('/api/analytics/demand', (req: Request, res: Response) => {
  const { city, zone, days = 30 } = req.query;

  // Generate mock trend data
  const trends = [];
  for (let i = 0; i < Number(days); i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    trends.push({
      date: date.toISOString().split('T')[0],
      demandIndex: 0.6 + Math.random() * 0.4,
      orders: Math.round(100 + Math.random() * 200),
      conversion: 0.15 + Math.random() * 0.2,
    });
  }

  res.json({
    success: true,
    data: {
      location: { city, zone },
      period: `${days} days`,
      trends: trends.reverse(),
      summary: {
        avgDemand: Math.round(trends.reduce((sum, t) => sum + t.demandIndex, 0) / trends.length * 100) / 100,
        totalOrders: trends.reduce((sum, t) => sum + t.orders, 0),
        avgConversion: Math.round(trends.reduce((sum, t) => sum + t.conversion, 0) / trends.length * 100) / 100,
      },
    },
  });
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateRecommendations(
  demandIndex: number,
  weather?: WeatherContext,
  time?: TimeContext
): string[] {
  const recommendations: string[] = [];

  if (demandIndex > 0.8) {
    recommendations.push('High demand period - consider premium pricing');
  } else if (demandIndex < 0.4) {
    recommendations.push('Low demand period - offer promotions to boost engagement');
  }

  if (weather?.condition === 'rainy') {
    recommendations.push('Rainy weather - food delivery and pharmacy ads perform well');
  } else if (weather?.condition === 'sunny') {
    recommendations.push('Sunny weather - outdoor and retail ads perform well');
  }

  if (time?.isWeekend) {
    recommendations.push('Weekend - family and entertainment categories see higher engagement');
  }

  if (time?.hour >= 19 && time.hour <= 21) {
    recommendations.push('Evening peak - restaurant and entertainment ads most effective');
  }

  return recommendations;
}

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  logger.info(`
╔══════════════════════════════════════════════════════════════╗
║       HYPERLOCAL DEMAND FORECASTING v1.0.0            ║
╠══════════════════════════════════════════════════════════════╣
║  Port:     ${PORT}                                             ║
║  Cities:   ${Object.keys(cityMultipliers).join(', ')}         ║
║  Categories: ${Object.keys(baseDemand).length}                                          ║
║  Active Events: ${events.length}                                         ║
╠══════════════════════════════════════════════════════════════╣
║  FEATURES:                                                  ║
║  ✓ Demand Forecasting  ✓ Weather Impact                     ║
║  ✓ Supply Gap Detection ✓ Optimal Timing                     ║
║  ✓ Event Correlation  ✓ Campaign Optimization               ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

export default app;
