import express, { Request, Response } from 'express';
import logger from './utils/logger';
import { merchantHealthScorer } from '../services/merchantHealthScorer';
import { recommendationEngine } from '../services/recommendationEngine';
import { competitorAnalyzer } from '../services/competitorAnalyzer';
import { decisionEngine } from '../services/decisionEngine';
import { liveDataService, logMerchantEvent } from '../services/liveDataService';

const router = express.Router();

// Merchant Profile
router.get('/merchant/:merchantId/profile', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const { MerchantService } = require('../services/merchantService');

    const profile = await MerchantService.getMerchantProfile(merchantId);
    const metrics = await merchantHealthScorer.getMerchantMetrics(merchantId);
    const healthScore = await merchantHealthScorer.calculateHealthScore(merchantId);

    res.json({
      merchant_id: merchantId,
      profile,
      metrics: {
        ordersThisWeek: metrics.orders.thisWeek,
        revenueThisWeek: metrics.revenue.thisWeek,
        totalCustomers: metrics.customers.total,
        avgRating: metrics.reviews.avgRating,
      },
      insights: {
        health_score: healthScore.overall,
        growth_score: calculateGrowthScore(metrics),
        engagement_score: calculateEngagementScore(metrics),
      },
      checked_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to get merchant profile', error);
    res.status(500).json({ error: 'Failed to get merchant profile' });
  }
});

// Merchant Insights
router.get('/merchant/:merchantId/insights', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;

    // Try to fetch live data first
    let useLiveData = false;
    let liveOrders: unknown[] = [];
    let liveProducts: unknown[] = [];
    let liveAnalytics: unknown = null;
    let liveCompetitors: unknown = { competitors: [] };
    let liveTrends: unknown = { demandIncrease: [] };

    try {
      const [orders, products, analytics, competitors, trends] = await Promise.all([
        liveDataService.getMerchantOrders(merchantId),
        liveDataService.getMerchantProducts(merchantId),
        liveDataService.getOrderAnalytics(merchantId),
        liveDataService.getCompetitors(merchantId),
        liveDataService.getMarketTrends(merchantId),
      ]);

      liveOrders = orders;
      liveProducts = products;
      liveAnalytics = analytics;
      liveCompetitors = competitors;
      liveTrends = trends;
      useLiveData = orders.length > 0 || products.length > 0;
    } catch (liveError) {
      logger.info('Live data fetch failed, using fallback services');
    }

    // Use live data if available, otherwise fall back to service-based metrics
    let metrics;
    let insights: unknown[] = [];

    if (useLiveData) {
      // Generate insights from real live data
      const totalRevenue = liveOrders.reduce((sum: number, o) => sum + (o.total || 0), 0);
      const avgOrderValue = liveOrders.length ? totalRevenue / liveOrders.length : 0;

      // Order patterns from live data
      if (liveOrders.length > 0) {
        const recentOrders = liveOrders.slice(-7);
        const previousOrders = liveOrders.slice(-14, -7);

        if (recentOrders.length !== previousOrders.length) {
          const change = recentOrders.length - previousOrders.length;
          insights.push({
            type: 'pattern',
            title: change > 0 ? 'Order Growth Detected' : 'Order Decline Alert',
            description: change > 0
              ? `Orders are up ${Math.round((change / Math.max(1, previousOrders.length)) * 100)}% this week`
              : `Orders dropped ${Math.abs(Math.round((change / Math.max(1, previousOrders.length)) * 100))}% this week`,
            confidence: 0.95,
            source: 'live',
          });
        }
      }

      // Low stock insights from live products
      const lowStockProducts = liveProducts.filter((p) => p.stock < 10);
      if (lowStockProducts.length > 0) {
        insights.push({
          type: 'alert',
          title: 'Stock Optimization Needed',
          description: `${lowStockProducts.length} items are running low (stock < 10)`,
          confidence: 0.92,
          source: 'live',
          items: lowStockProducts.slice(0, 5).map((p) => p.name),
        });
      }

      // Top products insight
      const topProducts = [...liveProducts].sort((a, b) => (b.orderCount || 0) - (a.orderCount || 0)).slice(0, 3);
      if (topProducts.length > 0) {
        insights.push({
          type: 'opportunity',
          title: 'Top Performing Products',
          description: `${topProducts[0]?.name} is your top seller with ${topProducts[0]?.orderCount || 0} orders`,
          confidence: 0.88,
          source: 'live',
        });
      }

      // Analytics insights
      if (liveAnalytics) {
        insights.push({
          type: 'analytics',
          title: 'Revenue Insight',
          description: `Average order value: $${avgOrderValue.toFixed(2)}`,
          confidence: 0.90,
          source: 'live',
        });
      }

      // Log insight event
      await liveDataService.logInsight(merchantId, {
        type: 'insights_requested',
        insightsCount: insights.length,
        useLiveData: true
      });

      // Event logging for insights generated
      await logMerchantEvent('merchant.insight_generated', {
        merchantId,
        insights: insights.map(i => ({ type: i.type, title: i.title })),
        type: 'live_data_report'
      });

      res.json({
        merchant_id: merchantId,
        insights,
        analytics: liveAnalytics,
        data_source: 'live',
        demand_trend: liveTrends.demandIncrease.length > 0 ? 'increasing' : 'stable',
        checked_at: new Date().toISOString(),
      });
      return;
    }

    // Fallback to service-based metrics
    metrics = await merchantHealthScorer.getMerchantMetrics(merchantId);
    const competitors = await competitorAnalyzer.analyzeCompetitors(merchantId);
    const trends = await competitorAnalyzer.getMarketTrends(merchantId);

    // Order patterns
    if (metrics.orders.thisWeek !== metrics.orders.lastWeek) {
      const change = metrics.orders.thisWeek - metrics.orders.lastWeek;
      insights.push({
        type: 'pattern',
        title: change > 0 ? 'Order Growth Detected' : 'Order Decline Alert',
        description: change > 0
          ? `Orders are up ${Math.round((change / metrics.orders.lastWeek) * 100)}% this week`
          : `Orders dropped ${Math.abs(Math.round((change / metrics.orders.lastWeek) * 100))}% this week`,
        confidence: 0.92,
      });
    }

    // Inventory insights
    if (metrics.inventory.lowStockItems > 0) {
      insights.push({
        type: 'alert',
        title: 'Stock Optimization Needed',
        description: `${metrics.inventory.lowStockItems} items are running low`,
        confidence: 0.88,
      });
    }

    // Weekend patterns
    insights.push({
      type: 'trend',
      title: 'Weekend Demand Pattern',
      description: 'Weekend orders typically 15-25% higher',
      confidence: 0.85,
    });

    // Competitor insights
    if (competitors.competitors.length > 0) {
      insights.push({
        type: 'opportunity',
        title: 'Competitive Position',
        description: `You're priced ${competitors.priceGap > 0 ? 'higher' : 'lower'} than ${competitors.competitors.length} nearby competitors`,
        confidence: 0.78,
      });
    }

    // Market trends
    if (trends.demandIncrease.length > 0) {
      insights.push({
        type: 'trend',
        title: 'Trending Category',
        description: `${trends.demandIncrease[0]} demand is increasing in your area`,
        confidence: 0.80,
      });
    }

    // Event logging for insights generated (fallback)
    await logMerchantEvent('merchant.insight_generated', {
      merchantId,
      insights: insights.map(i => ({ type: i.type, title: i.title })),
      type: 'fallback_report'
    });

    res.json({
      merchant_id: merchantId,
      insights,
      demand_trend: trends.demandIncrease.length > 0 ? 'increasing' : 'stable',
      risk_signals: metrics.inventory.stockoutRate > 5
        ? ['High stockout rate']
        : [],
      data_source: 'fallback',
      checked_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to get insights', error);
    res.status(500).json({ error: 'Failed to get insights' });
  }
});

// Merchant Recommendations
router.get('/merchant/:merchantId/recommendations', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;

    // Try to use live data first
    let useLiveData = false;
    let trendingProducts: unknown[] = [];
    let liveAnalytics: unknown = null;

    try {
      const [trending, analytics] = await Promise.all([
        liveDataService.getTrendingProducts(merchantId),
        liveDataService.getOrderAnalytics(merchantId),
      ]);

      trendingProducts = trending;
      liveAnalytics = analytics;
      useLiveData = trending.length > 0;
    } catch (liveError) {
      logger.info('Live data for recommendations failed, using fallback');
    }

    if (useLiveData && trendingProducts.length > 0) {
      // Generate recommendations from live trending data
      const recommendations = generateRecommendationsFromLiveData(trendingProducts, liveAnalytics);

      // Event logging for recommendations shown (live data)
      await logMerchantEvent('merchant.recommendation_shown', {
        merchantId,
        recommendations: recommendations.map(r => ({ id: r.id, type: r.type, title: r.title })),
        category: 'live_data'
      });

      res.json({
        merchant_id: merchantId,
        recommendations: recommendations.map(rec => ({
          id: rec.id,
          type: rec.type,
          title: rec.title,
          description: rec.description,
          priority: rec.priority,
          action: rec.action,
          expected_impact: rec.expected_impact,
        })),
        data_source: 'live',
        trending_products: trendingProducts.slice(0, 5).map((p) => ({
          id: p.id,
          name: p.name,
          orderCount: p.orderCount,
        })),
        generated_at: new Date().toISOString(),
      });
      return;
    }

    // Fallback to service-based recommendations
    const metrics = await merchantHealthScorer.getMerchantMetrics(merchantId);
    const healthScore = await merchantHealthScorer.calculateHealthScore(merchantId);
    const recommendations = await recommendationEngine.generateRecommendations(
      merchantId,
      metrics,
      healthScore.overall
    );

    // Event logging for recommendations shown (fallback)
    await logMerchantEvent('merchant.recommendation_shown', {
      merchantId,
      recommendations: recommendations.map(r => ({ id: r.id, type: r.type, title: r.title })),
      category: 'service_fallback'
    });

    res.json({
      merchant_id: merchantId,
      recommendations: recommendations.map(rec => ({
        id: rec.id,
        type: rec.type,
        title: rec.title,
        description: rec.description,
        priority: rec.priority,
        action: rec.actions[0]?.type,
        expected_impact: rec.expectedImpact,
      })),
      data_source: 'fallback',
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to get recommendations', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// Helper function to generate recommendations from live data
function generateRecommendationsFromLiveData(trendingProducts: unknown[], analytics): unknown[] {
  const recommendations: unknown[] = [];

  // Top trending product recommendation
  if (trendingProducts.length > 0) {
    const topProduct = trendingProducts[0];
    recommendations.push({
      id: `live_rec_${topProduct.id}_1`,
      type: 'marketing',
      title: `Promote ${topProduct.name}`,
      description: `This is your top-selling product with ${topProduct.orderCount} orders. Consider running a promotion to boost sales further.`,
      priority: topProduct.orderCount > 50 ? 'high' : 'medium',
      action: 'run_promotion',
      expected_impact: '+15-25% sales',
    });
  }

  // Low stock warning for trending items
  const lowStockTrending = trendingProducts.filter((p) => p.stock < 20);
  if (lowStockTrending.length > 0) {
    recommendations.push({
      id: 'live_rec_stock_1',
      type: 'inventory',
      title: 'Restock Trending Items',
      description: `${lowStockTrending.length} trending products have low stock. Reorder soon to avoid stockouts.`,
      priority: 'high',
      action: 'reorder_inventory',
      expected_impact: 'Prevent stockouts',
    });
  }

  // Average order value recommendation
  if (analytics && analytics.avgOrderValue < 20) {
    recommendations.push({
      id: 'live_rec_aov_1',
      type: 'pricing',
      title: 'Increase Average Order Value',
      description: `Your average order value is $${analytics.avgOrderValue.toFixed(2)}. Consider bundle deals or upselling.`,
      priority: 'medium',
      action: 'bundle_deals',
      expected_impact: '+$5-10 per order',
    });
  }

  // Category expansion based on trending
  if (trendingProducts.length >= 3) {
    const categories = [...new Set(trendingProducts.map((p) => p.category))];
    if (categories.length > 1) {
      recommendations.push({
        id: 'live_rec_category_1',
        type: 'operations',
        title: 'Diversify Product Categories',
        description: `Your top products span ${categories.length} categories. Cross-category promotions could increase basket size.`,
        priority: 'low',
        action: 'cross_promote',
        expected_impact: '+10% revenue',
      });
    }
  }

  return recommendations;
}

// Health Score
router.get('/merchant/:merchantId/health-score', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const healthScore = await merchantHealthScorer.calculateHealthScore(merchantId);
    const metrics = await merchantHealthScorer.getMerchantMetrics(merchantId);

    // Event logging for health score
    await logMerchantEvent('merchant.health_score_changed', {
      merchantId,
      newScore: healthScore.overall,
      riskLevel: healthScore.riskLevel,
      breakdown: healthScore.breakdown
    });

    res.json({
      merchant_id: merchantId,
      health_score: {
        overall: healthScore.overall,
        metrics: {
          revenue: {
            score: healthScore.breakdown.revenueHealth,
            trend: getTrendDirection(metrics.revenue.thisWeek, metrics.revenue.lastWeek),
            change: calculateChange(metrics.revenue.thisWeek, metrics.revenue.lastWeek),
          },
          orders: {
            score: healthScore.breakdown.orderHealth,
            trend: getTrendDirection(metrics.orders.thisWeek, metrics.orders.lastWeek),
            change: calculateChange(metrics.orders.thisWeek, metrics.orders.lastWeek),
          },
          retention: {
            score: healthScore.breakdown.customerHealth,
            trend: 'stable',
            change: '0%',
          },
          stockouts: {
            score: healthScore.breakdown.inventoryHealth,
            trend: metrics.inventory.stockoutRate > 5 ? 'down' : 'stable',
            change: `${metrics.inventory.stockoutRate}%`,
          },
        },
        risk_level: healthScore.riskLevel,
        alerts: healthScore.alerts,
      },
      checked_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to get health score', error);
    res.status(500).json({ error: 'Failed to get health score' });
  }
});

// Submit Feedback
router.post('/merchant/:merchantId/feedback', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const { decision_id, outcome, suggested_quantity, actual_quantity, reason } = req.body;

    await decisionEngine.recordFeedback(decision_id, {
      outcome,
      actualValue: actual_quantity,
      reason,
    });

    res.json({
      success: true,
      merchant_id: merchantId,
      feedback: {
        decision_id,
        outcome,
        suggested_quantity,
        actual_quantity,
        reason,
        received_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to record feedback', error);
    res.status(500).json({ error: 'Failed to record feedback' });
  }
});

// Merchant Decisions
router.get('/merchant/:merchantId/decisions', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const { limit = 20 } = req.query;

    const decisions = await decisionEngine.generateDecisions(merchantId);

    res.json({
      merchant_id: merchantId,
      decisions: decisions.slice(0, Number(limit)).map(dec => ({
        decision_id: dec.decisionId,
        item_id: dec.itemId,
        item_name: dec.itemName,
        suggested_quantity: extractQuantity(dec.suggestion),
        action_level: dec.actionLevel,
        confidence: dec.confidence,
        timestamp: dec.timestamp.toISOString(),
      })),
      total: decisions.length,
    });
  } catch (error) {
    console.error('Failed to get decisions', error);
    res.status(500).json({ error: 'Failed to get decisions' });
  }
});

// Competitors
router.get('/merchant/:merchantId/competitors', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const analysis = await competitorAnalyzer.analyzeCompetitors(merchantId);

    res.json({
      merchant_id: merchantId,
      competitors: analysis.competitors.map(comp => ({
        merchant_id: comp.id,
        name: comp.name,
        similarity: comp.similarity,
        distance_km: comp.distanceKm,
        avg_rating: comp.rating,
        price_level: comp.priceLevel,
      })),
      price_gap: analysis.priceGap,
      market_share: analysis.marketShare,
      insights: analysis.insights,
    });
  } catch (error) {
    console.error('Failed to get competitors', error);
    res.status(500).json({ error: 'Failed to get competitors' });
  }
});

// Trends
router.get('/merchant/:merchantId/trends', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const metrics = await merchantHealthScorer.getMerchantMetrics(merchantId);
    const trends = await competitorAnalyzer.getMarketTrends(merchantId);

    res.json({
      merchant_id: merchantId,
      trends: {
        orders: {
          direction: getTrendDirection(metrics.orders.thisWeek, metrics.orders.lastWeek),
          change: calculateChange(metrics.orders.thisWeek, metrics.orders.lastWeek),
          period: '7d',
        },
        revenue: {
          direction: getTrendDirection(metrics.revenue.thisWeek, metrics.revenue.lastWeek),
          change: calculateChange(metrics.revenue.thisWeek, metrics.revenue.lastWeek),
          period: '7d',
        },
        avg_order_value: {
          direction: 'up',
          change: '+3%',
          period: '7d',
        },
        new_customers: {
          direction: 'up',
          change: '+22%',
          period: '30d',
        },
      },
      local_trends: trends,
      checked_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to get trends', error);
    res.status(500).json({ error: 'Failed to get trends' });
  }
});

// Helper functions
function calculateGrowthScore(metrics): number {
  if (metrics.revenue.lastMonth === 0) return 50;
  const growth = ((metrics.revenue.thisMonth - metrics.revenue.lastMonth) / metrics.revenue.lastMonth) * 100;
  return Math.min(100, Math.max(0, 50 + growth));
}

function calculateEngagementScore(metrics): number {
  const { total, returning } = metrics.customers;
  if (total === 0) return 50;
  return Math.min(100, (returning / total) * 100 + 20);
}

function getTrendDirection(current: number, previous: number): 'up' | 'down' | 'stable' {
  if (previous === 0) return current > 0 ? 'up' : 'stable';
  const change = (current - previous) / previous;
  if (change > 0.05) return 'up';
  if (change < -0.05) return 'down';
  return 'stable';
}

function calculateChange(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? '+100%' : '0%';
  const change = ((current - previous) / previous) * 100;
  const sign = change >= 0 ? '+' : '';
  return `${sign}${Math.round(change)}%`;
}

function extractQuantity(suggestion: string): number {
  const match = suggestion.match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

export default router;
