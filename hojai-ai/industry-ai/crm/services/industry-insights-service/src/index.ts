/**
 * Industry Insights Service - Express Server
 * Provides performance analytics for each Industry AI product
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3003;
const SERVICE_NAME = 'industry-insights-service';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

// ============================================================================
// Types and Interfaces
// ============================================================================

export type IndustryType = 'waitron' | 'shopflow' | 'staybot' | 'carecode' | 'glamai' | 'fitmind' | 'teammind' | 'ledgerai' | 'fleetiq' | 'propflow' | 'neighborai' | 'learniq' | 'tripmind' | 'franchiseiq' | 'prodflow';

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

// ============================================================================
// Industry Data
// ============================================================================

const INDUSTRY_PRODUCTS: Record<IndustryType, { name: string; description: string }> = {
  waitron: { name: 'Waitron', description: 'Restaurant AI Assistant' },
  shopflow: { name: 'ShopFlow', description: 'Retail Management AI' },
  staybot: { name: 'StayBot', description: 'Hotel Management AI' },
  carecode: { name: 'CareCode', description: 'Healthcare AI Assistant' },
  glamai: { name: 'GlamAI', description: 'Beauty & Salon AI' },
  fitmind: { name: 'FitMind', description: 'Fitness & Wellness AI' },
  teammind: { name: 'TeamMind', description: 'Team Management AI' },
  ledgerai: { name: 'LedgerAI', description: 'Accounting AI' },
  fleetiq: { name: 'FleetIQ', description: 'Fleet Management AI' },
  propflow: { name: 'PropFlow', description: 'Property Management AI' },
  neighborai: { name: 'NeighborAI', description: 'Community Management AI' },
  learniq: { name: 'LearnIQ', description: 'Education & Learning AI' },
  tripmind: { name: 'TripMind', description: 'Travel & Tourism AI' },
  franchiseiq: { name: 'FranchiseIQ', description: 'Franchise Management AI' },
  prodflow: { name: 'ProdFlow', description: 'Production & Manufacturing AI' }
};

// ============================================================================
// Service Class
// ============================================================================

class IndustryInsightsService {
  private metricsCache: Map<IndustryType, IndustryMetrics> = new Map();
  private lastCacheUpdate: Date | null = null;

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData(): void {
    Object.keys(INDUSTRY_PRODUCTS).forEach(industry => {
      const metrics: IndustryMetrics = {
        totalCustomers: Math.floor(Math.random() * 500) + 100,
        newCustomersThisMonth: Math.floor(Math.random() * 50) + 10,
        totalLeads: Math.floor(Math.random() * 200) + 50,
        leadConversionRate: Math.random() * 0.3 + 0.05,
        activeCustomers: Math.floor(Math.random() * 400) + 80,
        churnRate: Math.random() * 0.15,
        averageOrderValue: Math.random() * 500 + 50,
        customerLifetimeValue: Math.random() * 5000 + 500,
        revenue: Math.random() * 200000 + 50000,
        revenueGrowth: (Math.random() - 0.3) * 0.4
      };
      this.metricsCache.set(industry as IndustryType, metrics);
    });
  }

  async getIndustryInsights(industry: IndustryType): Promise<IndustryInsight | null> {
    const product = INDUSTRY_PRODUCTS[industry];
    if (!product) return null;

    const metrics = await this.calculateIndustryMetrics(industry);
    const performance = this.evaluatePerformance(metrics, industry);
    const recommendations = this.generateRecommendations(industry, metrics);
    const trends = this.getIndustryTrends(industry);
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

  private async calculateIndustryMetrics(industry: IndustryType): Promise<IndustryMetrics> {
    let metrics = this.metricsCache.get(industry);

    if (!metrics || this.shouldRefreshCache()) {
      metrics = {
        totalCustomers: Math.floor(Math.random() * 500) + 100,
        newCustomersThisMonth: Math.floor(Math.random() * 50) + 10,
        totalLeads: Math.floor(Math.random() * 200) + 50,
        leadConversionRate: Math.random() * 0.3 + 0.05,
        activeCustomers: Math.floor(Math.random() * 400) + 80,
        churnRate: Math.random() * 0.15,
        averageOrderValue: Math.random() * 500 + 50,
        customerLifetimeValue: Math.random() * 5000 + 500,
        revenue: Math.random() * 200000 + 50000,
        revenueGrowth: (Math.random() - 0.3) * 0.4
      };
      this.metricsCache.set(industry, metrics);
    }

    return metrics;
  }

  private shouldRefreshCache(): boolean {
    if (!this.lastCacheUpdate) return true;
    return Date.now() - this.lastCacheUpdate.getTime() > 5 * 60 * 1000;
  }

  private evaluatePerformance(metrics: IndustryMetrics, industry: IndustryType): IndustryPerformance {
    let score = 0;
    const revenueTarget = 100000;

    score += Math.min(40, (metrics.revenue / revenueTarget) * 40);
    score += Math.min(30, metrics.totalCustomers * 0.3);
    score += Math.min(20, metrics.leadConversionRate * 100 * 0.2);
    score += Math.min(10, Math.max(0, metrics.revenueGrowth * 0.1));

    let overall: IndustryPerformance['overall'];
    if (score >= 80) overall = 'excellent';
    else if (score >= 60) overall = 'good';
    else if (score >= 40) overall = 'average';
    else overall = 'poor';

    const trend: IndustryPerformance['trend'] = metrics.revenueGrowth > 0 ? 'up' :
      metrics.revenueGrowth < 0 ? 'down' : 'stable';

    return {
      overall,
      score: Math.round(score),
      rank: 0,
      trend,
      comparedToAverage: ((metrics.revenue - 100000) / 100000) * 100
    };
  }

  private generateRecommendations(industry: IndustryType, metrics: IndustryMetrics): Recommendation[] {
    const recommendations: Recommendation[] = [];

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

    if (metrics.churnRate > 0.1) {
      recommendations.push({
        id: `${industry}-retention-2`,
        type: 'retention',
        priority: 'high',
        title: 'Reduce Churn Rate',
        description: 'Churn rate is above 10%. Implement proactive retention strategies.',
        impact: 'high',
        effort: 'high'
      });
    }

    return recommendations;
  }

  private getIndustryTrends(industry: IndustryType): IndustryTrend[] {
    const trends: IndustryTrend[] = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);

      trends.push({
        period: date.toISOString().slice(0, 7),
        customers: Math.floor(Math.random() * 50) + 50 + (11 - i) * 5,
        revenue: Math.random() * 20000 + 10000 + (11 - i) * 1000,
        leads: Math.floor(Math.random() * 30) + 20 + (11 - i) * 2,
        conversionRate: Math.random() * 0.15 + 0.05
      });
    }

    return trends;
  }

  private calculateBenchmark(metrics: IndustryMetrics): BenchmarkComparison {
    const industryAverage = 100000;
    const bestInClass = 200000;
    const worstInClass = 30000;

    return {
      industryAverage,
      yourPerformance: metrics.revenue,
      percentile: metrics.revenue >= industryAverage
        ? 50 + ((metrics.revenue - industryAverage) / (bestInClass - industryAverage)) * 50
        : ((metrics.revenue - worstInClass) / (industryAverage - worstInClass)) * 50,
      comparedToBest: ((metrics.revenue - bestInClass) / bestInClass) * 100,
      comparedToWorst: ((metrics.revenue - worstInClass) / worstInClass) * 100
    };
  }

  async getAllIndustryInsights(): Promise<IndustryInsight[]> {
    const insights: IndustryInsight[] = [];

    for (const industry of Object.keys(INDUSTRY_PRODUCTS) as IndustryType[]) {
      const insight = await this.getIndustryInsights(industry);
      if (insight) insights.push(insight);
    }

    insights.sort((a, b) => b.performance.score - a.performance.score);
    insights.forEach((insight, index) => {
      insight.performance.rank = index + 1;
    });

    return insights;
  }

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

    const totalRevenue = allInsights.reduce((sum, i) => sum + i.metrics.revenue, 0);
    const totalCustomers = allInsights.reduce((sum, i) => sum + i.metrics.totalCustomers, 0);
    const totalLeads = allInsights.reduce((sum, i) => sum + i.metrics.totalLeads, 0);

    return {
      totalRevenue,
      totalCustomers,
      totalLeads,
      overallConversionRate: totalLeads > 0
        ? allInsights.reduce((sum, i) => sum + i.metrics.leadConversionRate, 0) / allInsights.length
        : 0,
      topPerformers,
      underPerformers,
      urgentActions
    };
  }
}

const industryInsightsService = new IndustryInsightsService();

// ============================================================================
// API Routes
// ============================================================================

/**
 * Get insights for a specific industry
 */
app.get('/api/insights/:industry', async (req: Request, res: Response) => {
  const { industry } = req.params;

  if (!INDUSTRY_PRODUCTS[industry as IndustryType]) {
    res.status(404).json({ error: 'Industry not found', validIndustries: Object.keys(INDUSTRY_PRODUCTS) });
    return;
  }

  const insight = await industryInsightsService.getIndustryInsights(industry as IndustryType);
  res.json(insight);
});

/**
 * Get all industry insights
 */
app.get('/api/insights', async (req: Request, res: Response) => {
  const insights = await industryInsightsService.getAllIndustryInsights();
  res.json(insights);
});

/**
 * Get cross-industry analysis
 */
app.get('/api/analysis/cross-industry', async (req: Request, res: Response) => {
  const analysis = await industryInsightsService.getCrossIndustryAnalysis();
  res.json(analysis);
});

/**
 * Get executive summary
 */
app.get('/api/analysis/executive', async (req: Request, res: Response) => {
  const summary = await industryInsightsService.getExecutiveSummary();
  res.json(summary);
});

/**
 * Get benchmark comparison
 */
app.get('/api/benchmark/:industry', async (req: Request, res: Response) => {
  const { industry } = req.params;

  if (!INDUSTRY_PRODUCTS[industry as IndustryType]) {
    res.status(404).json({ error: 'Industry not found' });
    return;
  }

  const insight = await industryInsightsService.getIndustryInsights(industry as IndustryType);
  res.json(insight?.benchmark);
});

/**
 * Get industry trends
 */
app.get('/api/trends/:industry', async (req: Request, res: Response) => {
  const { industry } = req.params;

  if (!INDUSTRY_PRODUCTS[industry as IndustryType]) {
    res.status(404).json({ error: 'Industry not found' });
    return;
  }

  const insight = await industryInsightsService.getIndustryInsights(industry as IndustryType);
  res.json(insight?.trends);
});

/**
 * Get recommendations for industry
 */
app.get('/api/recommendations/:industry', async (req: Request, res: Response) => {
  const { industry } = req.params;

  if (!INDUSTRY_PRODUCTS[industry as IndustryType]) {
    res.status(404).json({ error: 'Industry not found' });
    return;
  }

  const insight = await industryInsightsService.getIndustryInsights(industry as IndustryType);
  res.json(insight?.recommendations);
});

/**
 * Get all industries
 */
app.get('/api/industries', (req: Request, res: Response) => {
  const industries = Object.entries(INDUSTRY_PRODUCTS).map(([key, value]) => ({
    id: key,
    ...value
  }));
  res.json(industries);
});

// ============================================================================
// Health Check
// ============================================================================

app.get('/health', async (req: Request, res: Response) => {
  const insights = await industryInsightsService.getAllIndustryInsights();
  const summary = await industryInsightsService.getExecutiveSummary();

  res.json({
    service: SERVICE_NAME,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    stats: {
      totalIndustries: insights.length,
      totalRevenue: summary.totalRevenue,
      totalCustomers: summary.totalCustomers,
      topPerformer: summary.topPerformers[0]
    }
  });
});

// ============================================================================
// Error Handler
// ============================================================================

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================================================
// Server Start
// ============================================================================

app.listen(PORT, () => {
  logger.info(`${SERVICE_NAME} running on port ${PORT}`);
  console.log(`${SERVICE_NAME} running on port ${PORT}`);
});

export default app;
