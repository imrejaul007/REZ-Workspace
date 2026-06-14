/**
 * REZ Revenue AI - Cross-Merchant Intelligence Service
 * Ecosystem-wide trend analysis and competitive insights
 */

import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import { z } from 'zod';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), winston.format.simple()) })],
});

// ================== TYPES ==================

interface CategoryTrend {
  category: string;
  vertical: string;
  demandChange: number;
  avgPriceChange: number;
  orderVolumeChange: number;
  topPerformers: { merchantId: string; merchantName: string; revenueUplift: number }[];
  emergingPlayers: { merchantId: string; merchantName: string; growthRate: number }[];
  recommendations: string[];
}

interface UpcomingDemandEvent {
  id: string;
  name: string;
  type: 'festival' | 'sports' | 'concert' | 'holiday' | 'weather' | 'cultural';
  date: string;
  expectedFootfall: number;
  affectedCategories: string[];
  affectedVerticals: string[];
  recommendedActions: string[];
  daysUntil: number;
}

interface CompetitiveLandscape {
  category: string;
  merchantId: string;
  marketAvgPrice: number;
  yourPrice: number;
  pricePosition: 'below' | 'at' | 'above';
  priceDifference: number;
  opportunityScore: number;
  recommendations: string[];
}

interface MarketInsight {
  id: string;
  category: string;
  type: 'trend' | 'opportunity' | 'warning';
  title: string;
  description: string;
  impact: number;
  affectedMerchants: string[];
  generatedAt: string;
}

// ================== VALIDATION SCHEMAS ==================

const CrossMerchantInsightsRequestSchema = z.object({
  merchantId: z.string().optional(),
  vertical: z.enum(['restaurant', 'hotel', 'clinic', 'salon', 'gym', 'events', 'retail', 'home_services', 'corp_perks']).optional(),
  category: z.string().optional(),
  location: z.object({
    city: z.string().optional(),
    tier: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  }).optional(),
  period: z.enum(['week', 'month', 'quarter']),
});

// ================== CROSS-MERCHANT INTELLIGENCE CLASS ==================

class CrossMerchantIntelligence {
  private mockMerchants = [
    { id: 'merchant_001', name: 'Pizza Palace', vertical: 'restaurant', category: 'pizza', city: 'Bangalore', tier: 1 },
    { id: 'merchant_002', name: 'Burger Barn', vertical: 'restaurant', category: 'burger', city: 'Bangalore', tier: 1 },
    { id: 'merchant_003', name: 'Salon Elegance', vertical: 'salon', category: 'unisex', city: 'Bangalore', tier: 1 },
    { id: 'merchant_004', name: 'Hotel Grand', vertical: 'hotel', category: 'luxury', city: 'Bangalore', tier: 1 },
    { id: 'merchant_005', name: 'FitZone Gym', vertical: 'gym', category: 'fitness', city: 'Bangalore', tier: 1 },
    { id: 'merchant_006', name: 'TechClinic', vertical: 'clinic', category: 'dental', city: 'Bangalore', tier: 1 },
    { id: 'merchant_007', name: 'Spa Retreat', vertical: 'salon', category: 'spa', city: 'Mumbai', tier: 1 },
    { id: 'merchant_008', name: 'Biryani House', vertical: 'restaurant', category: 'biryani', city: 'Hyderabad', tier: 1 },
  ];

  /**
   * Generate cross-merchant insights
   */
  getInsights(request: z.infer<typeof CrossMerchantInsightsRequestSchema>): {
    categoryTrends: CategoryTrend[];
    upcomingEvents: UpcomingDemandEvent[];
    competitiveLandscape: CompetitiveLandscape[];
    marketInsights: MarketInsight[];
    generatedAt: string;
  } {
    const { merchantId, vertical, category, period } = request;

    // Generate category trends
    const categoryTrends = this.generateCategoryTrends(vertical, category);

    // Generate upcoming events
    const upcomingEvents = this.generateUpcomingEvents();

    // Generate competitive landscape
    const competitiveLandscape = this.generateCompetitiveLandscape(merchantId, category);

    // Generate market insights
    const marketInsights = this.generateMarketInsights(merchantId, vertical);

    logger.info('Cross-merchant insights generated', {
      merchantId,
      vertical,
      period,
      trendsCount: categoryTrends.length,
      eventsCount: upcomingEvents.length,
    });

    return {
      categoryTrends,
      upcomingEvents,
      competitiveLandscape,
      marketInsights,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Generate category trends
   */
  private generateCategoryTrends(vertical?: string, category?: string): CategoryTrend[] {
    const trends: CategoryTrend[] = [];

    const categoryData = [
      { category: 'pizza', vertical: 'restaurant', demandChange: 28, avgPriceChange: 5 },
      { category: 'burger', vertical: 'restaurant', demandChange: 15, avgPriceChange: 3 },
      { category: 'biryani', vertical: 'restaurant', demandChange: 35, avgPriceChange: 8 },
      { category: 'salad', vertical: 'restaurant', demandChange: 42, avgPriceChange: 2 },
      { category: 'protein_foods', vertical: 'restaurant', demandChange: 45, avgPriceChange: 12 },
      { category: 'haircut', vertical: 'salon', demandChange: 12, avgPriceChange: 5 },
      { category: 'spa', vertical: 'salon', demandChange: 25, avgPriceChange: 8 },
      { category: 'fitness', vertical: 'gym', demandChange: 30, avgPriceChange: 10 },
      { category: 'yoga', vertical: 'gym', demandChange: 55, avgPriceChange: 15 },
      { category: 'dental', vertical: 'clinic', demandChange: 18, avgPriceChange: 6 },
      { category: 'luxury_rooms', vertical: 'hotel', demandChange: 22, avgPriceChange: 15 },
      { category: 'budget_rooms', vertical: 'hotel', demandChange: 8, avgPriceChange: 3 },
    ];

    const filtered = categoryData.filter(c =>
      (!vertical || c.vertical === vertical) &&
      (!category || c.category === category)
    );

    for (const c of filtered) {
      const trend: CategoryTrend = {
        category: c.category,
        vertical: c.vertical,
        demandChange: c.demandChange + (Math.random() * 10 - 5),
        avgPriceChange: c.avgPriceChange + (Math.random() * 4 - 2),
        orderVolumeChange: c.demandChange * 0.8 + (Math.random() * 10 - 5),
        topPerformers: [
          { merchantId: 'merchant_001', merchantName: 'Pizza Palace', revenueUplift: 35 },
          { merchantId: 'merchant_002', merchantName: 'Burger Barn', revenueUplift: 28 },
        ],
        emergingPlayers: [
          { merchantId: 'merchant_009', merchantName: 'Healthy Bites', growthRate: 85 },
          { merchantId: 'merchant_010', merchantName: 'Fresh Salads', growthRate: 72 },
        ],
        recommendations: this.generateCategoryRecommendations(c),
      };
      trends.push(trend);
    }

    return trends;
  }

  /**
   * Generate category-specific recommendations
   */
  private generateCategoryRecommendations(category: { category: string; vertical: string; demandChange: number }): string[] {
    const recommendations: string[] = [];

    if (category.demandChange > 30) {
      recommendations.push('High demand trend detected - consider increasing inventory');
      recommendations.push('Consider adding premium variants to capture higher spend');
    }

    if (category.category.includes('protein') || category.category === 'biryani') {
      recommendations.push('Protein foods trending - add high-protein menu items');
      recommendations.push('Partner with fitness centers for cross-promotions');
    }

    if (category.category === 'salad' || category.category === 'healthy') {
      recommendations.push('Health-conscious consumers growing - highlight nutrition benefits');
      recommendations.push('Partner with gyms for wellness bundles');
    }

    if (category.vertical === 'salon') {
      recommendations.push('Pre-wedding season approaching - launch bridal packages');
      recommendations.push('Monsoon care packages trending - add hair treatment bundles');
    }

    if (category.vertical === 'gym') {
      recommendations.push('New year resolution season ahead - prepare membership drives');
      recommendations.push('Online fitness content trending - consider hybrid classes');
    }

    return recommendations;
  }

  /**
   * Generate upcoming events
   */
  private generateUpcomingEvents(): UpcomingDemandEvent[] {
    const now = new Date();
    const events: UpcomingDemandEvent[] = [];

    // Generate upcoming events for next 90 days
    const eventTemplates = [
      { name: 'Independence Day', type: 'holiday' as const, daysUntil: 75, footfall: 50000, categories: ['restaurant', 'hotel', 'retail'] },
      { name: 'Ganesh Chaturthi', type: 'festival' as const, daysUntil: 45, footfall: 80000, categories: ['restaurant', 'retail'] },
      { name: 'Durga Puja', type: 'festival' as const, daysUntil: 52, footfall: 75000, categories: ['restaurant', 'hotel', 'retail'] },
      { name: 'Diwali', type: 'festival' as const, daysUntil: 60, footfall: 100000, categories: ['restaurant', 'hotel', 'salon', 'retail'] },
      { name: 'IPL Finals', type: 'sports' as const, daysUntil: 30, footfall: 60000, categories: ['restaurant', 'hotel'] },
      { name: 'Weekend Sale', type: 'cultural' as const, daysUntil: 5, footfall: 30000, categories: ['retail'] },
      { name: 'Monsoon Season', type: 'weather' as const, daysUntil: 10, footfall: -20000, categories: ['restaurant', 'salon'] },
      { name: 'Friendship Day', type: 'cultural' as const, daysUntil: 20, footfall: 40000, categories: ['restaurant', 'salon', 'gym'] },
      { name: 'Teachers Day', type: 'cultural' as const, daysUntil: 15, footfall: 25000, categories: ['restaurant', 'gifts'] },
      { name: 'Bakri Eid', type: 'festival' as const, daysUntil: 40, footfall: 65000, categories: ['restaurant', 'hotel', 'retail'] },
    ];

    for (const template of eventTemplates) {
      const eventDate = new Date(now);
      eventDate.setDate(eventDate.getDate() + template.daysUntil);

      events.push({
        id: `event_${template.daysUntil}`,
        name: template.name,
        type: template.type,
        date: eventDate.toISOString().split('T')[0],
        expectedFootfall: template.footfall,
        affectedCategories: template.categories,
        affectedVerticals: template.categories,
        recommendedActions: this.generateEventRecommendations(template),
        daysUntil: template.daysUntil,
      });
    }

    return events.sort((a, b) => a.daysUntil - b.daysUntil);
  }

  /**
   * Generate event-specific recommendations
   */
  private generateEventRecommendations(event: { name: string; type: string; daysUntil: number }): string[] {
    const recommendations: string[] = [];

    if (event.daysUntil <= 14) {
      recommendations.push('Last-minute preparations needed');
    }

    if (event.type === 'festival') {
      recommendations.push('Pre-booking campaigns - launch 2 weeks before');
      recommendations.push('Festive offers and combos - prepare menu');
      recommendations.push('Extended hours planning - staff scheduling');
    }

    if (event.type === 'sports') {
      recommendations.push('Live screening arrangements');
      recommendations.push('Game-day combos and drinks packages');
      recommendations.push('Bookings for group celebrations');
    }

    if (event.type === 'holiday') {
      recommendations.push('Family packages - offer group discounts');
      recommendations.push('Staycation promotions for hotels');
      recommendations.push('Holiday-themed menu items');
    }

    if (event.type === 'weather' && event.name.includes('Monsoon')) {
      recommendations.push('Rainy day special offers');
      recommendations.push('Indoor activity packages');
      recommendations.push('Delivery surge preparation');
    }

    return recommendations;
  }

  /**
   * Generate competitive landscape
   */
  private generateCompetitiveLandscape(merchantId?: string, category?: string): CompetitiveLandscape[] {
    const landscape: CompetitiveLandscape[] = [];

    if (!merchantId) return landscape;

    const categories = category ? [category] : ['pizza', 'burger', 'haircut', 'room'];

    for (const cat of categories) {
      const marketAvgPrice = cat === 'pizza' ? 450 : cat === 'burger' ? 250 : cat === 'haircut' ? 500 : cat === 'room' ? 3000 : 500;
      const yourPrice = marketAvgPrice * (0.9 + Math.random() * 0.2);

      let position: 'below' | 'at' | 'above';
      let difference = ((yourPrice - marketAvgPrice) / marketAvgPrice) * 100;

      if (difference < -10) position = 'below';
      else if (difference > 10) position = 'above';
      else position = 'at';

      landscape.push({
        category: cat,
        merchantId: merchantId,
        marketAvgPrice,
        yourPrice: Math.round(yourPrice),
        pricePosition: position,
        priceDifference: Math.round(difference * 10) / 10,
        opportunityScore: position === 'below' ? 75 : position === 'above' ? 45 : 60,
        recommendations: this.generatePositionRecommendations(position, cat),
      });
    }

    return landscape;
  }

  /**
   * Generate recommendations based on price position
   */
  private generatePositionRecommendations(position: string, category: string): string[] {
    const recommendations: string[] = [];

    if (position === 'below') {
      recommendations.push('You are priced below market - consider modest increase');
      recommendations.push('Highlight value proposition to justify higher prices');
      recommendations.push('Bundle with add-ons to increase order value');
    }

    if (position === 'above') {
      recommendations.push('You are priced above market - review pricing strategy');
      recommendations.push('Emphasize unique selling points to justify premium');
      recommendations.push('Consider introducing budget-friendly options');
    }

    if (position === 'at') {
      recommendations.push('Competitive pricing - focus on differentiation');
      recommendations.push('Invest in customer experience over price wars');
      recommendations.push('Loyalty programs to retain price-sensitive customers');
    }

    return recommendations;
  }

  /**
   * Generate market insights
   */
  private generateMarketInsights(merchantId?: string, vertical?: string): MarketInsight[] {
    const insights: MarketInsight[] = [];

    // Trending insights
    insights.push({
      id: 'insight_001',
      category: 'food',
      type: 'trend',
      title: 'Protein Foods Surge',
      description: 'High-protein food demand up 45% across cities. Gym-goers and health-conscious consumers driving growth.',
      impact: 85,
      affectedMerchants: ['restaurant', 'retail'],
      generatedAt: new Date().toISOString(),
    });

    insights.push({
      id: 'insight_002',
      category: 'wellness',
      type: 'opportunity',
      title: 'Wellness Bundles Underutilized',
      description: 'Only 23% of salons offer wellness bundles. High-margin opportunity with 65% margin potential.',
      impact: 72,
      affectedMerchants: ['salon'],
      generatedAt: new Date().toISOString(),
    });

    insights.push({
      id: 'insight_003',
      category: 'dining',
      type: 'trend',
      title: 'Weekend Dining Premium',
      description: 'Weekend dinner orders up 35% compared to weekdays. Peak hours shifting to 7-9 PM.',
      impact: 78,
      affectedMerchants: ['restaurant'],
      generatedAt: new Date().toISOString(),
    });

    insights.push({
      id: 'insight_004',
      category: 'hospitality',
      type: 'warning',
      title: 'Hotel Booking Lead Time Decreasing',
      description: 'Average booking window reduced from 14 to 7 days. Last-minute pricing strategies needed.',
      impact: 68,
      affectedMerchants: ['hotel'],
      generatedAt: new Date().toISOString(),
    });

    insights.push({
      id: 'insight_005',
      category: 'fitness',
      type: 'opportunity',
      title: 'Online Fitness Hybrid Model',
      description: 'Hybrid fitness (online + offline) growing 55%. Consider launching digital membership tier.',
      impact: 82,
      affectedMerchants: ['gym'],
      generatedAt: new Date().toISOString(),
    });

    insights.push({
      id: 'insight_006',
      category: 'food',
      type: 'trend',
      title: 'Biryani Dominance',
      description: 'Biryani accounts for 28% of all food orders. Top-selling category in Tier 1 and Tier 2 cities.',
      impact: 90,
      affectedMerchants: ['restaurant'],
      generatedAt: new Date().toISOString(),
    });

    // Filter by vertical if specified
    if (vertical) {
      const verticalMap: Record<string, string[]> = {
        restaurant: ['food', 'dining'],
        salon: ['wellness'],
        hotel: ['hospitality'],
        gym: ['fitness'],
      };
      const relevantCategories = verticalMap[vertical] || [];
      return insights.filter(i => relevantCategories.includes(i.category));
    }

    return insights;
  }

  /**
   * Get merchant comparison
   */
  getMerchantComparison(merchantId: string): {
    merchant: { id: string; name: string; vertical: string; category: string };
    comparison: {
      avgOrderValue: number;
      ordersPerDay: number;
      customerRetention: number;
      pricingPosition: 'below' | 'at' | 'above';
      vsCityAverage: number;
      vsVerticalAverage: number;
    };
    percentile: number;
    recommendations: string[];
  } {
    const merchant = this.mockMerchants.find(m => m.id === merchantId) || this.mockMerchants[0];

    return {
      merchant: {
        id: merchant.id,
        name: merchant.name,
        vertical: merchant.vertical,
        category: merchant.category,
      },
      comparison: {
        avgOrderValue: 350 + Math.random() * 200,
        ordersPerDay: 45 + Math.random() * 30,
        customerRetention: 65 + Math.random() * 25,
        pricingPosition: 'at',
        vsCityAverage: 5 + Math.random() * 15,
        vsVerticalAverage: -5 + Math.random() * 20,
      },
      percentile: 65 + Math.random() * 25,
      recommendations: [
        'Your pricing is competitive - focus on customer experience',
        'Consider loyalty program to boost retention',
        'Cross-sell opportunities identified in your category',
      ],
    };
  }

  /**
   * Get city-level insights
   */
  getCityInsights(city: string): {
    city: string;
    verticals: { vertical: string; totalMerchants: number; avgOrderValue: number; demandIndex: number }[];
    topCategories: { category: string; growthRate: number }[];
    upcomingEvents: { name: string; daysUntil: number }[];
    recommendations: string[];
  } {
    return {
      city,
      verticals: [
        { vertical: 'restaurant', totalMerchants: 1500, avgOrderValue: 420, demandIndex: 85 },
        { vertical: 'salon', totalMerchants: 800, avgOrderValue: 550, demandIndex: 78 },
        { vertical: 'hotel', totalMerchants: 200, avgOrderValue: 3500, demandIndex: 72 },
        { vertical: 'gym', totalMerchants: 400, avgOrderValue: 800, demandIndex: 82 },
      ],
      topCategories: [
        { category: 'biryani', growthRate: 35 },
        { category: 'protein_foods', growthRate: 28 },
        { category: 'wellness', growthRate: 25 },
        { category: 'fitness', growthRate: 22 },
      ],
      upcomingEvents: [
        { name: 'Local Festival', daysUntil: 15 },
        { name: 'City Marathon', daysUntil: 30 },
        { name: 'Tech Conference', daysUntil: 45 },
      ],
      recommendations: [
        'City sees high weekend demand - prepare accordingly',
        'Protein foods trending in this city - consider menu additions',
        'Competition increasing - focus on unique offerings',
      ],
    };
  }
}

// ================== EXPRESS APP ==================

const app = express();
const intelligence = new CrossMerchantIntelligence();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '1mb' }));

app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = uuidv4();
  req.headers['x-request-id'] = requestId;
  next();
});

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-revenue-ai-cross-merchant',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/v1/insights
 * Get cross-merchant insights
 */
app.get('/api/v1/insights', async (req: Request, res: Response) => {
  try {
    const requestId = req.headers['x-request-id'] as string;

    const validationResult = CrossMerchantInsightsRequestSchema.safeParse({
      merchantId: req.query.merchantId,
      vertical: req.query.vertical,
      category: req.query.category,
      location: req.query.city ? { city: req.query.city } : undefined,
      period: req.query.period || 'month',
    });

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: validationResult.error.issues,
        },
      });
    }

    const insights = intelligence.getInsights(validationResult.data);

    res.json({
      success: true,
      data: insights,
      metadata: { requestId, timestamp: new Date() },
    });
  } catch (error) {
    logger.error('Insights error', { error });
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to get insights' },
    });
  }
});

/**
 * GET /api/v1/merchant/:merchantId/comparison
 * Get merchant comparison data
 */
app.get('/api/v1/merchant/:merchantId/comparison', (req: Request, res: Response) => {
  const { merchantId } = req.params;
  const comparison = intelligence.getMerchantComparison(merchantId);

  res.json({
    success: true,
    data: comparison,
  });
});

/**
 * GET /api/v1/city/:city/insights
 * Get city-level insights
 */
app.get('/api/v1/city/:city/insights', (req: Request, res: Response) => {
  const { city } = req.params;
  const insights = intelligence.getCityInsights(city);

  res.json({
    success: true,
    data: insights,
  });
});

/**
 * GET /api/v1/trends
 * Get category trends
 */
app.get('/api/v1/trends', (req: Request, res: Response) => {
  const { vertical, category } = req.query;
  const insights = intelligence.getInsights({
    vertical: vertical as string,
    category: category as string,
    period: 'month',
  });

  res.json({
    success: true,
    data: insights.categoryTrends,
  });
});

/**
 * GET /api/v1/events
 * Get upcoming events
 */
app.get('/api/v1/events', (req: Request, res: Response) => {
  const insights = intelligence.getInsights({ period: 'month' });

  res.json({
    success: true,
    data: insights.upcomingEvents,
  });
});

const PORT = process.env.PORT || 4306;

app.listen(PORT, () => {
  logger.info('REZ Revenue AI Cross-Merchant Intelligence started', { port: PORT });
});

export default app;
