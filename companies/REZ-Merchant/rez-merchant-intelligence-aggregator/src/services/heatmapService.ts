/**
 * Heatmap Service
 * Generates locality heatmaps and demand visualization
 */

import { AggregatedMetrics } from '../models/AggregatedData';
import { logger } from '../config/logger';
import { getRedis } from '../config/redis';

export interface HeatmapPoint {
  locality: string;
  pincode: string;
  lat?: number;          // Geocoded latitude
  lng?: number;           // Geocoded longitude
  intensity: number;      // 0-100 scale
  merchantCount: number;
  avgOrderValue: number;
  ordersPerDay: number;
  demandScore: number;   // Calculated demand score
  growthRate: number;    // % growth
  industry: string;
}

export interface DemandHeatmap {
  city: string;
  industry: string;
  period: 'daily' | 'weekly' | 'monthly';
  points: HeatmapPoint[];
  maxIntensity: number;
  insights: string[];
}

export interface NeighborhoodAnalysis {
  locality: string;
  totalMerchants: number;
  topCategories: { category: string; percentage: number }[];
  avgOrderValue: number;
  demandScore: number;
  saturationLevel: 'low' | 'medium' | 'high' | 'saturated';
  opportunityScore: number;   // 0-100
  recommendations: string[];
}

export class HeatmapService {
  private redis = getRedis();

  /**
   * Generate demand heatmap for a city
   */
  async getDemandHeatmap(
    city: string,
    industry: string,
    period: 'daily' | 'weekly' | 'monthly' = 'monthly'
  ): Promise<DemandHeatmap> {
    const cacheKey = `heatmap:${city}:${industry}:${period}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    // Get all localities in the city
    const localities = await AggregatedMetrics.aggregate([
      {
        $match: {
          city,
          industry,
          merchantCount: { $gte: 3 }
        }
      },
      {
        $group: {
          _id: '$locality',
          pincode: { $first: '$pincode' },
          merchantCount: { $sum: '$merchantCount' },
          avgOrderValue: { $avg: '$avgOrderValue' },
          totalOrders: { $sum: '$totalOrders30d' },
          revenueGrowth: { $avg: '$revenueGrowth30d' },
          category: { $push: '$category' }
        }
      }
    ]);

    // Calculate max values for normalization
    const maxOrders = Math.max(...localities.map(l => l.totalOrders));
    const maxGrowth = Math.max(...localities.map(l => l.revenueGrowth || 0), 1);

    // Generate heatmap points
    const points: HeatmapPoint[] = localities.map(locality => {
      const demandScore = this.calculateDemandScore(
        locality.totalOrders,
        locality.revenueGrowth || 0,
        locality.merchantCount
      );

      return {
        locality: locality._id,
        pincode: locality.pincode,
        intensity: Math.round((locality.totalOrders / maxOrders) * 100),
        merchantCount: locality.merchantCount,
        avgOrderValue: Math.round(locality.avgOrderValue),
        ordersPerDay: Math.round(locality.totalOrders / 30),
        demandScore,
        growthRate: Math.round((locality.revenueGrowth || 0) * 10) / 10,
        industry
      };
    });

    const result: DemandHeatmap = {
      city,
      industry,
      period,
      points: points.sort((a, b) => b.demandScore - a.demandScore),
      maxIntensity: 100,
      insights: this.generateInsights(points)
    };

    // Cache for 1 hour
    await this.redis.setex(cacheKey, 3600, JSON.stringify(result));

    return result;
  }

  /**
   * Analyze a specific neighborhood
   */
  async analyzeNeighborhood(
    locality: string,
    industry: string
  ): Promise<NeighborhoodAnalysis> {
    const industryFilter = industry as unknown;
    const metrics = await AggregatedMetrics.find({
      locality,
      industry: industryFilter
    } as unknown);

    if (metrics.length === 0) {
      return {
        locality,
        totalMerchants: 0,
        topCategories: [],
        avgOrderValue: 0,
        demandScore: 0,
        saturationLevel: 'low',
        opportunityScore: 50,
        recommendations: ['Not enough data for this area']
      };
    }

    const totalMerchants = metrics.reduce((sum, m) => sum + m.merchantCount, 0);
    const avgOrderValue = metrics.reduce((sum, m) => sum + m.avgOrderValue, 0) / metrics.length;
    const avgGrowth = metrics.reduce((sum, m) => sum + (m.revenueGrowth30d || 0), 0) / metrics.length;

    // Aggregate categories
    const categoryMap: Record<string, number> = {};
    for (const metric of metrics) {
      for (const cat of metric.topCategories || []) {
        categoryMap[cat.category] = (categoryMap[cat.category] || 0) + cat.percentage;
      }
    }
    const topCategories = Object.entries(categoryMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, percentage]) => ({
        category,
        percentage: Math.round(percentage / metrics.length)
      }));

    // Calculate saturation
    const saturationLevel = this.calculateSaturation(totalMerchants, avgGrowth);

    // Calculate opportunity score
    const opportunityScore = this.calculateOpportunityScore(
      totalMerchants,
      avgOrderValue,
      avgGrowth,
      saturationLevel
    );

    return {
      locality,
      totalMerchants,
      topCategories,
      avgOrderValue: Math.round(avgOrderValue),
      demandScore: Math.round(avgGrowth + 50),
      saturationLevel,
      opportunityScore,
      recommendations: this.generateRecommendations(
        totalMerchants,
        avgOrderValue,
        saturationLevel,
        opportunityScore
      )
    };
  }

  /**
   * Get trending localities
   */
  async getTrendingLocalities(
    city: string,
    industry: string,
    limit: number = 10
  ): Promise<HeatmapPoint[]> {
    const industryFilter = industry as unknown;
    const trending = await AggregatedMetrics.find({
      city,
      industry: industryFilter,
      revenueGrowth30d: { $gt: 0 },
      merchantCount: { $gte: 3 }
    } as unknown)
      .sort({ revenueGrowth30d: -1 } as unknown)
      .limit(limit)
      .select('-_id -__v');

    return trending.map(m => ({
      locality: m.locality,
      pincode: m.pincode,
      intensity: Math.round(m.revenueGrowth30d),
      merchantCount: m.merchantCount,
      avgOrderValue: m.avgOrderValue,
      ordersPerDay: m.avgOrdersPerDay,
      demandScore: m.revenueGrowth30d + 50,
      growthRate: m.revenueGrowth30d,
      industry: m.industry
    }));
  }

  /**
   * Get underserved localities (opportunities)
   */
  async getOpportunityAreas(
    city: string,
    industry: string,
    limit: number = 10
  ): Promise<HeatmapPoint[]> {
    // Find localities with low competition but decent demand
    const opportunities = await AggregatedMetrics.aggregate([
      {
        $match: {
          city,
          industry,
          category: 'all',
          merchantCount: { $gte: 3, $lte: 20 },
          revenueGrowth30d: { $gt: 0 }
        }
      },
      {
        $addFields: {
          opportunityScore: {
            $multiply: [
              { $subtract: [100, { $min: ['$merchantCount', 100] }] },
              { $add: ['$revenueGrowth30d', 10] }
            ]
          }
        }
      },
      { $sort: { opportunityScore: -1 } },
      { $limit: limit }
    ]);

    return opportunities.map(o => ({
      locality: o.locality,
      pincode: o.pincode,
      intensity: Math.round(o.merchantCount / 2),
      merchantCount: o.merchantCount,
      avgOrderValue: o.avgOrderValue,
      ordersPerDay: o.avgOrdersPerDay,
      demandScore: o.opportunityScore,
      growthRate: o.revenueGrowth30d,
      industry: o.industry
    }));
  }

  private calculateDemandScore(orders: number, growth: number, merchants: number): number {
    // Weighted score: 50% orders, 30% growth, 20% low competition bonus
    const orderScore = Math.min(orders / 1000, 1) * 50;
    const growthScore = Math.min(Math.max(growth, -50) + 50, 100) * 0.3;
    const competitionBonus = merchants < 10 ? 20 : merchants < 20 ? 10 : 0;

    return Math.round(orderScore + growthScore + competitionBonus);
  }

  private calculateSaturation(merchants: number, growth: number): 'low' | 'medium' | 'high' | 'saturated' {
    if (merchants > 50 && growth < 5) return 'saturated';
    if (merchants > 30) return 'high';
    if (merchants > 15) return 'medium';
    return 'low';
  }

  private calculateOpportunityScore(
    merchants: number,
    avgOrderValue: number,
    growth: number,
    saturation: string
  ): number {
    let score = 50;

    // More opportunity in less saturated areas
    if (saturation === 'low') score += 30;
    else if (saturation === 'medium') score += 15;
    else if (saturation === 'saturated') score -= 20;

    // Higher order values = better opportunity
    if (avgOrderValue > 500) score += 10;
    else if (avgOrderValue > 300) score += 5;

    // Positive growth = opportunity
    if (growth > 20) score += 10;
    else if (growth > 0) score += 5;
    else score -= 10;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private generateInsights(points: HeatmapPoint[]): string[] {
    const insights: string[] = [];

    if (points.length === 0) {
      insights.push('No data available for this city yet');
      return insights;
    }

    // Top performing area
    const top = points[0];
    if (top) {
      insights.push(`${top.locality} has the highest demand score (${top.demandScore})`);
    }

    // Fastest growing
    const fastestGrowing = points.sort((a, b) => b.growthRate - a.growthRate)[0];
    if (fastestGrowing && fastestGrowing.growthRate > 10) {
      insights.push(`${fastestGrowing.locality} is growing fastest at ${fastestGrowing.growthRate}%`);
    }

    // Underserved areas
    const underserved = points.filter(p => p.merchantCount < 10 && p.demandScore > 40);
    if (underserved.length > 0) {
      insights.push(`${underserved.length} localities show demand but have low competition`);
    }

    return insights;
  }

  private generateRecommendations(
    merchants: number,
    avgOrderValue: number,
    saturation: string,
    opportunity: number
  ): string[] {
    const recs: string[] = [];

    if (saturation === 'saturated') {
      recs.push('Market is saturated - focus on differentiation and customer retention');
    } else if (saturation === 'low' && merchants < 10) {
      recs.push('Low competition - good time to enter this market');
    }

    if (avgOrderValue > 500) {
      recs.push('Premium market - focus on quality and service');
    } else if (avgOrderValue < 200) {
      recs.push('Volume market - optimize for efficiency and speed');
    }

    if (opportunity > 70) {
      recs.push('High opportunity area - consider expansion here');
    }

    return recs;
  }
}
