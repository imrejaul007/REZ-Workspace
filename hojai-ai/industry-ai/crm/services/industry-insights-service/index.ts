/**
 * Industry Insights Service
 * Provides performance analytics for each Industry AI product
 */

import { hojaiCore, IndustryType } from '../../connectors/hojai-core';
import { unifiedLeadService } from '../unified-lead-service';
import { customer360Service } from '../customer-360-service';
import { revenueConsolidationService } from '../revenue-consolidation-service';

export interface IndustryInsight {
  industry: IndustryType;
  productName: string;
  metrics: IndustryMetrics;
  performance: IndustryPerformance;
  recommendations: Recommendation[];
  trends: IndustryTrend[];
  benchmark: BenchmarkComparison;
}

export interface IndustryMetrics {
  totalCustomers: number;
  newCustomersThisMonth: number;
  totalLeads: number;
  leadConversionRate: number;
  activeCustomers: number;
  churnRate: number;
  averageOrderValue: number;
  customerLifetimeValue: number;
  revenue: number;
  revenueGrowth: number;
}

export interface IndustryPerformance {
  overall: 'excellent' | 'good' | 'average' | 'poor';
  score: number;
  rank: number;
  trend: 'up' | 'down' | 'stable';
  comparedToAverage: number;
}

export interface Recommendation {
  id: string;
  type: 'growth' | 'retention' | 'optimization' | 'cost-reduction';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
}

export interface IndustryTrend {
  period: string;
  customers: number;
  revenue: number;
  leads: number;
  conversionRate: number;
}

export interface BenchmarkComparison {
  industryAverage: number;
  yourPerformance: number;
  percentile: number;
  comparedToBest: number;
  comparedToWorst: number;
}

export interface CrossIndustryAnalysis {
  overallScore: number;
  bestPerforming: IndustryType;
  worstPerforming: IndustryType;
  fastestGrowing: IndustryType;
  mostProfitable: IndustryType;
  industryRankings: Array<{ industry: IndustryType; score: number; rank: number }>;
  opportunities: CrossIndustryOpportunity[];
}

export interface CrossIndustryOpportunity {
  from: IndustryType;
  to: IndustryType;
  potential: number;
  description: string;
}

class IndustryInsightsService {
  /**
   * Get insights for a specific industry
   */
  async getIndustryInsights(industry: IndustryType): Promise<IndustryInsight | null> {
    const product = hojaiCore.getProduct(industry);
    if (!product) return null;

    const metrics = await this.calculateIndustryMetrics(industry);
    const performance = this.evaluatePerformance(metrics, industry);
    const recommendations = await this.generateRecommendations(industry, metrics);
    const trends = await this.getIndustryTrends(industry);
    const benchmark = this.calculateBenchmark(metrics);

    return {
      industry,
      productName: product.name,
      metrics,
      performance,
      recommendations,
      trends,
      benchmark
    };
  }

  /**
   * Calculate metrics for an industry
   */
  private async calculateIndustryMetrics(industry: IndustryType): Promise<IndustryMetrics> {
    const customers = await customer360Service.getAllCustomers();
    const industryCustomers = customers.filter(c => c.industries.includes(industry));

    const leads = await unifiedLeadService.getLeads({ source: industry });
    const qualifiedLeads = leads.filter(l => l.status === 'qualified' || l.status === 'converted');
    const convertedLeads = leads.filter(l => l.status === 'converted');

    const revenue = await revenueConsolidationService.getIndustryRevenue(industry);

    // Calculate new customers this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const newCustomers = industryCustomers.filter(c => c.createdAt >= startOfMonth);

    // Calculate active customers (interacted in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeCustomers = industryCustomers.filter(c => c.lastInteraction >= thirtyDaysAgo);

    return {
      totalCustomers: industryCustomers.length,
      newCustomersThisMonth: newCustomers.length,
      totalLeads: leads.length,
      leadConversionRate: leads.length > 0 ? convertedLeads.length / leads.length : 0,
      activeCustomers: activeCustomers.length,
      churnRate: 0, // Would calculate from historical data
      averageOrderValue: revenue?.averageValue || 0,
      customerLifetimeValue: revenue && industryCustomers.length > 0
        ? revenue.totalRevenue / industryCustomers.length : 0,
      revenue: revenue?.totalRevenue || 0,
      revenueGrowth: revenue?.growth || 0
    };
  }

  /**
   * Evaluate industry performance
   */
  private evaluatePerformance(metrics: IndustryMetrics, industry: IndustryType): IndustryPerformance {
    // Calculate overall score (0-100)
    let score = 0;

    // Revenue contribution (40%)
    const revenueTarget = 100000; // Example target
    score += Math.min(40, (metrics.revenue / revenueTarget) * 40);

    // Customer metrics (30%)
    const customerScore = Math.min(30, metrics.totalCustomers * 0.3);
    score += customerScore;

    // Conversion rate (20%)
    score += Math.min(20, metrics.leadConversionRate * 100 * 0.2);

    // Growth (10%)
    score += Math.min(10, Math.max(0, metrics.revenueGrowth * 0.1));

    // Determine overall rating
    let overall: IndustryPerformance['overall'];
    if (score >= 80) overall = 'excellent';
    else if (score >= 60) overall = 'good';
    else if (score >= 40) overall = 'average';
    else overall = 'poor';

    // Determine trend (would use historical data in production)
    const trend: IndustryPerformance['trend'] = metrics.revenueGrowth > 0 ? 'up' :
      metrics.revenueGrowth < 0 ? 'down' : 'stable';

    return {
      overall,
      score: Math.round(score),
      rank: 0, // Calculated in cross-industry analysis
      trend,
      comparedToAverage: 0
    };
  }

  /**
   * Generate recommendations for an industry
   */
  private async generateRecommendations(
    industry: IndustryType,
    metrics: IndustryMetrics
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Growth opportunities
    if (metrics.leadConversionRate < 0.1) {
      recommendations.push({
        id: `${industry}-growth-1`,
        type: 'growth',
        priority: 'high',
        title: 'Improve Lead Conversion',
        description: 'Your lead conversion rate is below 10%. Consider lead nurturing campaigns and better follow-up processes.',
        impact: 'high',
        effort: 'medium'
      });
    }

    if (metrics.activeCustomers < metrics.totalCustomers * 0.5) {
      recommendations.push({
        id: `${industry}-retention-1`,
        type: 'retention',
        priority: 'high',
        title: 'Increase Customer Engagement',
        description: 'Less than 50% of customers are active. Implement re-engagement campaigns.',
        impact: 'high',
        effort: 'medium'
      });
    }

    if (metrics.averageOrderValue < 100) {
      recommendations.push({
        id: `${industry}-optimization-1`,
        type: 'optimization',
        priority: 'medium',
        title: 'Increase Average Order Value',
        description: 'Consider bundling products or upselling strategies to increase transaction value.',
        impact: 'medium',
        effort: 'low'
      });
    }

    // Cross-sell recommendations
    const crossSellOpportunities = await this.getCrossSellRecommendations(industry);
    if (crossSellOpportunities.length > 0) {
      recommendations.push({
        id: `${industry}-crosssell-1`,
        type: 'growth',
        priority: 'medium',
        title: 'Cross-Sell to Other Industries',
        description: `Found ${crossSellOpportunities.length} potential cross-sell opportunities.`,
        impact: 'medium',
        effort: 'low'
      });
    }

    return recommendations;
  }

  /**
   * Get cross-sell recommendations for an industry
   */
  private async getCrossSellRecommendations(industry: IndustryType): Promise<CrossIndustryOpportunity[]> {
    const opportunities: CrossIndustryOpportunity[] = [];
    const products = hojaiCore.getAllProducts();

    for (const [targetIndustry, product] of Object.entries(products)) {
      if (targetIndustry === industry) continue;

      // Simulated opportunity scoring
      const potential = Math.random() * 100;
      if (potential > 50) {
        opportunities.push({
          from: industry,
          to: targetIndustry as IndustryType,
          potential,
          description: `Customers in ${product.name} may be interested in cross-selling to ${hojaiCore.getProduct(industry)?.name}`
        });
      }
    }

    return opportunities.slice(0, 3);
  }

  /**
   * Get trends for an industry
   */
  private async getIndustryTrends(industry: IndustryType): Promise<IndustryTrend[]> {
    // Simulated trend data - would query historical data in production
    const trends: IndustryTrend[] = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);

      trends.push({
        period: date.toISOString().slice(0, 7),
        customers: Math.floor(Math.random() * 100),
        revenue: Math.random() * 50000,
        leads: Math.floor(Math.random() * 50),
        conversionRate: Math.random() * 0.3
      });
    }

    return trends;
  }

  /**
   * Calculate benchmark comparison
   */
  private calculateBenchmark(metrics: IndustryMetrics): BenchmarkComparison {
    // Simulated industry benchmarks
    const industryAverage = 50000;
    const bestInClass = 150000;
    const worstInClass = 10000;

    return {
      industryAverage,
      yourPerformance: metrics.revenue,
      percentile: metrics.revenue >= industryAverage ? 50 + ((metrics.revenue - industryAverage) / (bestInClass - industryAverage)) * 50 : ((metrics.revenue - worstInClass) / (industryAverage - worstInClass)) * 50,
      comparedToBest: ((metrics.revenue - bestInClass) / bestInClass) * 100,
      comparedToWorst: ((metrics.revenue - worstInClass) / worstInClass) * 100
    };
  }

  /**
   * Get insights for all industries
   */
  async getAllIndustryInsights(): Promise<IndustryInsight[]> {
    const insights: IndustryInsight[] = [];

    for (const industry of Object.keys(hojaiCore.getAllProducts()).map(k => k as IndustryType)) {
      const insight = await this.getIndustryInsights(industry);
      if (insight) insights.push(insight);
    }

    // Calculate ranks
    insights.sort((a, b) => b.performance.score - a.performance.score);
    insights.forEach((insight, index) => {
      insight.performance.rank = index + 1;
    });

    return insights;
  }

  /**
   * Get cross-industry analysis
   */
  async getCrossIndustryAnalysis(): Promise<CrossIndustryAnalysis> {
    const insights = await this.getAllIndustryInsights();

    if (insights.length === 0) {
      return {
        overallScore: 0,
        bestPerforming: 'waitron',
        worstPerforming: 'waitron',
        fastestGrowing: 'waitron',
        mostProfitable: 'waitron',
        industryRankings: [],
        opportunities: []
      };
    }

    const sorted = [...insights].sort((a, b) => b.performance.score - a.performance.score);
    const bestPerforming = sorted[0]?.industry || 'waitron';
    const worstPerforming = sorted[sorted.length - 1]?.industry || 'waitron';

    const sortedByGrowth = [...insights].sort((a, b) => b.metrics.revenueGrowth - a.metrics.revenueGrowth);
    const fastestGrowing = sortedByGrowth[0]?.industry || 'waitron';

    const sortedByRevenue = [...insights].sort((a, b) => b.metrics.revenue - a.metrics.revenue);
    const mostProfitable = sortedByRevenue[0]?.industry || 'waitron';

    const overallScore = insights.reduce((sum, i) => sum + i.performance.score, 0) / insights.length;

    // Generate cross-industry opportunities
    const opportunities: CrossIndustryOpportunity[] = [];
    for (const insight of insights) {
      for (const other of insights) {
        if (other.industry === insight.industry) continue;
        opportunities.push({
          from: insight.industry,
          to: other.industry,
          potential: Math.random() * 100,
          description: `Cross-sell opportunity from ${insight.productName} to ${other.productName}`
        });
      }
    }

    return {
      overallScore: Math.round(overallScore),
      bestPerforming,
      worstPerforming,
      fastestGrowing,
      mostProfitable,
      industryRankings: insights.map(i => ({
        industry: i.industry,
        score: i.performance.score,
        rank: i.performance.rank
      })),
      opportunities: opportunities.sort((a, b) => b.potential - a.potential).slice(0, 10)
    };
  }

  /**
   * Get executive dashboard summary
   */
  async getExecutiveSummary(): Promise<{
    totalRevenue: number;
    totalCustomers: number;
    totalLeads: number;
    overallConversionRate: number;
    topPerformers: IndustryType[];
    underPerformers: IndustryType[];
    urgentActions: Recommendation[];
  }> {
    const analysis = await this.getCrossIndustryAnalysis();
    const allInsights = await this.getAllIndustryInsights();

    const topPerformers = analysis.industryRankings.slice(0, 3).map(r => r.industry);
    const underPerformers = analysis.industryRankings.slice(-3).map(r => r.industry);

    const urgentActions = allInsights
      .flatMap(i => i.recommendations.filter(r => r.priority === 'high'))
      .slice(0, 5);

    const customers = await customer360Service.getAllCustomers();
    const leads = await unifiedLeadService.getLeads();
    const totalRevenue = await revenueConsolidationService.getTotalRevenue();

    return {
      totalRevenue,
      totalCustomers: customers.length,
      totalLeads: leads.length,
      overallConversionRate: leads.length > 0 ? leads.filter(l => l.status === 'converted').length / leads.length : 0,
      topPerformers,
      underPerformers,
      urgentActions
    };
  }
}

export const industryInsightsService = new IndustryInsightsService();