import { v4 as uuidv4 } from 'uuid';

export interface PropertyMetrics {
  propertyId: string;
  propertyName: string;
  date: string;
  // Occupancy
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  occupancyRate: number;
  // Revenue
  totalRevenue: number;
  roomRevenue: number;
  fBRevenue: number; // Food & Beverage
  otherRevenue: number;
  revPAR: number; // Revenue Per Available Room
  adr: number; // Average Daily Rate
  // Guest Metrics
  checkIns: number;
  checkOuts: number;
  currentGuests: number;
  avgLengthOfStay: number;
  // Performance
  roomRateAchieved: number; // vs rack rate
  upsellRate: number;
  // Quality
  avgGuestRating: number;
  pendingComplaints: number;
}

export interface ChainPerformance {
  chainId: string;
  chainName: string;
  period: {
    start: Date;
    end: Date;
  };
  totalProperties: number;
  totalRooms: number;
  aggregateMetrics: {
    occupancyRate: number;
    revPAR: number;
    adr: number;
    totalRevenue: number;
    avgGuestRating: number;
  };
  propertyPerformance: {
    propertyId: string;
    propertyName: string;
    rank: number;
    occupancyRate: number;
    revPAR: number;
    revenue: number;
    rating: number;
    trend: 'up' | 'down' | 'stable';
    trendPercentage: number;
  }[];
  topPerformers: string[];
  underPerformers: string[];
  recommendations: {
    propertyId: string;
    type: 'revenue' | 'occupancy' | 'rating' | 'cost';
    title: string;
    description: string;
    potentialImpact: number;
  }[];
}

export interface BenchmarkData {
  segment: 'luxury' | 'upper_midscale' | 'midscale' | 'budget';
  region: string;
  metrics: {
    avgOccupancy: number;
    avgADR: number;
    avgRevPAR: number;
    avgGuestRating: number;
  };
}

export class ChainAnalyticsService {
  private benchmarks: BenchmarkData[] = [
    { segment: 'luxury', region: 'india', metrics: { avgOccupancy: 72, avgADR: 8500, avgRevPAR: 6120, avgGuestRating: 4.6 } },
    { segment: 'upper_midscale', region: 'india', metrics: { avgOccupancy: 68, avgADR: 4500, avgRevPAR: 3060, avgGuestRating: 4.3 } },
    { segment: 'midscale', region: 'india', metrics: { avgOccupancy: 65, avgADR: 2800, avgRevPAR: 1820, avgGuestRating: 4.1 } },
    { segment: 'budget', region: 'india', metrics: { avgOccupancy: 62, avgADR: 1500, avgRevPAR: 930, avgGuestRating: 3.8 } },
  ];

  async getChainPerformance(
    chainId: string,
    properties: { propertyId: string; name: string; totalRooms: number; segment: string }[],
    startDate: Date,
    endDate: Date
  ): Promise<ChainPerformance> {
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    // Generate mock performance data for each property
    const propertyPerformance = properties.map((p, idx) => {
      const occupancyRate = 55 + Math.random() * 30;
      const adr = 2000 + Math.random() * 6000;
      const revPAR = (adr * occupancyRate) / 100;
      const rating = 3.5 + Math.random() * 1.5;
      const revenue = revPAR * p.totalRooms * days;
      const trendValue = Math.random();
      const trend = trendValue > 0.6 ? 'up' : trendValue < 0.3 ? 'down' : 'stable';
      const trendPercentage = trend === 'up' ? Math.random() * 10 : trend === 'down' ? -Math.random() * 10 : 0;

      return {
        propertyId: p.propertyId,
        propertyName: p.name,
        rank: 0,
        occupancyRate: Math.round(occupancyRate * 100) / 100,
        revPAR: Math.round(revPAR * 100) / 100,
        revenue: Math.round(revenue * 100) / 100,
        rating: Math.round(rating * 10) / 10,
        trend,
        trendPercentage: Math.round(trendPercentage * 10) / 10,
      };
    });

    // Sort by revenue and assign ranks
    propertyPerformance.sort((a, b) => b.revenue - a.revenue);
    propertyPerformance.forEach((p, idx) => p.rank = idx + 1);

    // Calculate aggregates
    const totalRooms = properties.reduce((sum, p) => sum + p.totalRooms, 0);
    const avgOccupancy = propertyPerformance.reduce((sum, p) => sum + p.occupancyRate, 0) / properties.length;
    const avgRevPAR = propertyPerformance.reduce((sum, p) => sum + p.revPAR, 0) / properties.length;
    const avgADR = propertyPerformance.reduce((sum, p) => sum + p.revPAR * 100 / p.occupancyRate, 0) / properties.length;
    const totalRevenue = propertyPerformance.reduce((sum, p) => sum + p.revenue, 0);
    const avgRating = propertyPerformance.reduce((sum, p) => sum + p.rating, 0) / properties.length;

    // Identify top/under performers (top 20% / bottom 20%)
    const topCount = Math.ceil(properties.length * 0.2);
    const topPerformers = propertyPerformance.slice(0, topCount).map(p => p.propertyId);
    const underPerformers = propertyPerformance.slice(-topCount).map(p => p.propertyId);

    // Generate recommendations
    const recommendations = [];

    underPerformers.forEach(propertyId => {
      const property = propertyPerformance.find(p => p.propertyId === propertyId);
      if (property) {
        if (property.occupancyRate < avgOccupancy) {
          recommendations.push({
            propertyId,
            type: 'occupancy' as const,
            title: 'Boost Occupancy',
            description: `Occupancy is ${avgOccupancy - property.occupancyRate}% below chain average. Consider promotional rates.`,
            potentialImpact: Math.round((avgOccupancy - property.occupancyRate) * totalRooms * avgADR / 100),
          });
        }
        if (property.rating < avgRating) {
          recommendations.push({
            propertyId,
            type: 'rating' as const,
            title: 'Improve Guest Experience',
            description: `Rating is ${(avgRating - property.rating).toFixed(1)} below chain average. Focus on service quality.`,
            potentialImpact: Math.round((avgRating - property.rating) * 50000),
          });
        }
      }
    });

    // Sort recommendations by potential impact
    recommendations.sort((a, b) => b.potentialImpact - a.potentialImpact);

    return {
      chainId,
      chainName: 'Hotel Chain',
      period: { start: startDate, end: endDate },
      totalProperties: properties.length,
      totalRooms,
      aggregateMetrics: {
        occupancyRate: Math.round(avgOccupancy * 100) / 100,
        revPAR: Math.round(avgRevPAR * 100) / 100,
        adr: Math.round(avgADR * 100) / 100,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        avgGuestRating: Math.round(avgRating * 10) / 10,
      },
      propertyPerformance,
      topPerformers,
      underPerformers,
      recommendations: recommendations.slice(0, 10),
    };
  }

  async getPropertyMetrics(propertyId: string, propertyName: string, date: Date): Promise<PropertyMetrics> {
    // Generate mock daily metrics
    const totalRooms = 50 + Math.floor(Math.random() * 100);
    const occupiedRooms = Math.floor(totalRooms * (0.5 + Math.random() * 0.4));
    const occupancyRate = (occupiedRooms / totalRooms) * 100;
    const adr = 2000 + Math.random() * 5000;
    const roomRevenue = occupiedRooms * adr;
    const fbRevenue = roomRevenue * 0.25;
    const otherRevenue = roomRevenue * 0.1;
    const totalRevenue = roomRevenue + fbRevenue + otherRevenue;
    const revPAR = (roomRevenue / totalRooms);

    return {
      propertyId,
      propertyName,
      date: date.toISOString().split('T')[0],
      totalRooms,
      occupiedRooms,
      availableRooms: totalRooms - occupiedRooms,
      occupancyRate: Math.round(occupancyRate * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      roomRevenue: Math.round(roomRevenue * 100) / 100,
      fBRevenue: Math.round(fbRevenue * 100) / 100,
      otherRevenue: Math.round(otherRevenue * 100) / 100,
      revPAR: Math.round(revPAR * 100) / 100,
      adr: Math.round(adr * 100) / 100,
      checkIns: Math.floor(occupiedRooms * 0.4),
      checkOuts: Math.floor(occupiedRooms * 0.35),
      currentGuests: Math.floor(occupiedRooms * 1.8),
      avgLengthOfStay: 1.5 + Math.random() * 2,
      roomRateAchieved: 85 + Math.random() * 15,
      upsellRate: 10 + Math.random() * 20,
      avgGuestRating: 3.5 + Math.random() * 1.5,
      pendingComplaints: Math.floor(Math.random() * 5),
    };
  }

  async compareProperties(
    propertyIds: string[],
    properties: Map<string, { name: string; totalRooms: number; segment: string }>,
    metric: 'occupancyRate' | 'adr' | 'revPAR' | 'rating',
    period: { start: Date; end: Date }
  ): Promise<any[]> {
    const results = [];

    for (const propertyId of propertyIds) {
      const property = properties.get(propertyId);
      if (!property) continue;

      const days = Math.ceil((period.end.getTime() - period.start.getTime()) / (1000 * 60 * 60 * 24));
      let value: number;

      switch (metric) {
        case 'occupancyRate':
          value = 55 + Math.random() * 30;
          break;
        case 'adr':
          value = 2000 + Math.random() * 6000;
          break;
        case 'revPAR':
          value = (2000 + Math.random() * 6000) * (0.55 + Math.random() * 0.3) / 100;
          break;
        case 'rating':
          value = 3.5 + Math.random() * 1.5;
          break;
      }

      results.push({
        propertyId,
        propertyName: property.name,
        value: Math.round(value * 100) / 100,
        rank: 0,
        vsChainAvg: 0,
        vsBenchmark: 0,
      });
    }

    // Sort and rank
    results.sort((a, b) => b.value - a.value);
    results.forEach((r, idx) => r.rank = idx + 1);

    const avg = results.reduce((sum, r) => sum + r.value, 0) / results.length;
    results.forEach(r => {
      r.vsChainAvg = Math.round((r.value - avg) / avg * 100 * 100) / 100;
    });

    // Get benchmark for segment
    const benchmark = this.benchmarks.find(b => b.segment === 'upper_midscale');
    if (benchmark) {
      const benchmarkValue = benchmark.metrics[`avg${metric.charAt(0).toUpperCase() + metric.slice(1)}` as keyof typeof benchmark.metrics] || avg;
      results.forEach(r => {
        r.vsBenchmark = Math.round((r.value - benchmarkValue) / benchmarkValue * 100 * 100) / 100;
      });
    }

    return results;
  }

  async getRevenueForecast(
    propertyId: string,
    days: number = 30
  ): Promise<{ date: string; predictedOccupancy: number; predictedADR: number; predictedRevPAR: number; confidence: number }[]> {
    const forecast = [];
    const baseOccupancy = 60 + Math.random() * 20;
    const baseADR = 3000 + Math.random() * 3000;

    for (let i = 1; i <= days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);

      // Add some seasonality and randomness
      const dayOfWeek = date.getDay();
      const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.15 : 1;
      const randomFactor = 0.9 + Math.random() * 0.2;

      const predictedOccupancy = Math.min(100, baseOccupancy * weekendFactor * randomFactor);
      const predictedADR = baseADR * (1 + (predictedOccupancy - 60) / 200);
      const predictedRevPAR = (predictedOccupancy * predictedADR) / 100;
      const confidence = Math.max(50, 95 - i * 1.5); // Confidence decreases over time

      forecast.push({
        date: date.toISOString().split('T')[0],
        predictedOccupancy: Math.round(predictedOccupancy * 100) / 100,
        predictedADR: Math.round(predictedADR * 100) / 100,
        predictedRevPAR: Math.round(predictedRevPAR * 100) / 100,
        confidence: Math.round(confidence * 10) / 10,
      });
    }

    return forecast;
  }
}
