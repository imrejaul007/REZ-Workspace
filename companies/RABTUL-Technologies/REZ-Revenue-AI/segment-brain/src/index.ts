/**
 * REZ Revenue AI - Customer Segment Brain
 * Behavioral micro-segmentation for merchants
 *
 * Not just: New, Regular, VIP
 * But: Bargain Hunters, High Value Users, Weekend Warriors, etc.
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

interface BehavioralSegment {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  count: number;
  percentage: number;
  avgOrderValue: number;
  visitFrequency: number;
  churnRisk: number;
  lifetimeValue: number;
  characteristics: string[];
  pricingStrategy: {
    recommendedRate: number;
    discountTolerance: number;
    preferredOfferType: string;
    premiumTolerance: number;
  };
  preferredChannels: ('whatsapp' | 'sms' | 'push' | 'email')[];
  topProducts: { name: string; affinity: number }[];
  recommendedActions: {
    type: string;
    action: string;
    expectedImpact: number;
    priority: 'high' | 'medium' | 'low';
  }[];
}

interface SegmentAnalysis {
  merchantId: string;
  vertical: string;
  totalCustomers: number;
  segments: BehavioralSegment[];
  segmentDistribution: { segment: string; count: number; percentage: number }[];
  insights: {
    opportunity: string;
    action: string;
    potential: number;
  }[];
  recommendations: {
    priority: number;
    segment: string;
    action: string;
    expectedRevenue: number;
  }[];
  generatedAt: string;
}

// ================== SEGMENT DEFINITIONS ==================

const SEGMENT_TEMPLATES = [
  {
    id: 'bargain_hunters',
    name: 'Bargain Hunters',
    description: 'Only buy when offers are available, highly price-sensitive',
    icon: '🏷️',
    color: '#f59e0b',
    characteristics: [
      'Always checks for offers before purchasing',
      'Compares prices across merchants',
      'Uses discount codes frequently',
      'Rarely pays full price',
    ],
    pricingStrategy: {
      recommendedRate: 0.15,
      discountTolerance: 0.20,
      preferredOfferType: 'percentage_discount',
      premiumTolerance: 0.05,
    },
  },
  {
    id: 'high_value_users',
    name: 'High Value Users',
    description: 'Spend heavily, prioritize quality over price',
    icon: '💎',
    color: '#8b5cf6',
    characteristics: [
      'High average order value',
      'Premium service preference',
      'Loyal once satisfied',
      'Refer others',
    ],
    pricingStrategy: {
      recommendedRate: 0.03,
      discountTolerance: 0.05,
      preferredOfferType: 'exclusive_perks',
      premiumTolerance: 0.30,
    },
  },
  {
    id: 'weekend_warriors',
    name: 'Weekend Warriors',
    description: 'Only visit on weekends, often with family',
    icon: '📅',
    color: '#06b6d4',
    characteristics: [
      'Weekend-only visits',
      'Group bookings',
      'Family-oriented',
      'Value family packages',
    ],
    pricingStrategy: {
      recommendedRate: 0.10,
      discountTolerance: 0.15,
      preferredOfferType: 'family_bundle',
      premiumTolerance: 0.15,
    },
  },
  {
    id: 'corporate_users',
    name: 'Corporate Users',
    description: 'Business customers, office hours, invoicing needed',
    icon: '💼',
    color: '#3b82f6',
    characteristics: [
      'Business hours visits',
      'Formal service preference',
      'Need invoices/receipts',
      'Regular monthly visits',
    ],
    pricingStrategy: {
      recommendedRate: 0.08,
      discountTolerance: 0.12,
      preferredOfferType: 'corporate_plan',
      premiumTolerance: 0.20,
    },
  },
  {
    id: 'loyal_advocates',
    name: 'Loyal Advocates',
    description: 'Repeat buyers who also refer others',
    icon: '🌟',
    color: '#22c55e',
    characteristics: [
      'Highest retention rate',
      'Actively refers others',
      'Provides feedback',
      'Tries new services',
    ],
    pricingStrategy: {
      recommendedRate: 0.05,
      discountTolerance: 0.08,
      preferredOfferType: 'referral_bonus',
      premiumTolerance: 0.15,
    },
  },
  {
    id: 'churn_risks',
    name: 'Churn Risks',
    description: 'Declining visits, disengaged, likely to leave',
    icon: '⚠️',
    color: '#ef4444',
    characteristics: [
      'Declining visit frequency',
      'Reduced engagement',
      'Negative feedback',
      'Last visit > 45 days ago',
    ],
    pricingStrategy: {
      recommendedRate: 0.20,
      discountTolerance: 0.25,
      preferredOfferType: 'win_back',
      premiumTolerance: 0.0,
    },
  },
  {
    id: 'new_explorers',
    name: 'New Explorers',
    description: 'First few visits, evaluating if they will stay',
    icon: '🧭',
    color: '#f97316',
    characteristics: [
      'First 1-3 visits',
      'Comparing options',
      'Responsive to offers',
      'Decision phase',
    ],
    pricingStrategy: {
      recommendedRate: 0.15,
      discountTolerance: 0.20,
      preferredOfferType: 'first_visit',
      premiumTolerance: 0.10,
    },
  },
  {
    id: 'dormant_users',
    name: 'Dormant Users',
    description: 'Haven\'t visited in 60+ days, need reactivation',
    icon: '😴',
    color: '#64748b',
    characteristics: [
      'Last visit > 60 days ago',
      'May have moved away',
      'Price may no longer suit',
      'Hardest to reactivate',
    ],
    pricingStrategy: {
      recommendedRate: 0.25,
      discountTolerance: 0.30,
      preferredOfferType: 'comeback_offer',
      premiumTolerance: 0.0,
    },
  },
  {
    id: 'health_conscious',
    name: 'Health Conscious',
    description: 'Quality and wellness-focused, organic/premium preference',
    icon: '🥗',
    color: '#84cc16',
    characteristics: [
      'Quality over price',
      'Wellness-oriented',
      'Reviews ingredients/products',
      'Willing to pay premium for quality',
    ],
    pricingStrategy: {
      recommendedRate: 0.02,
      discountTolerance: 0.05,
      preferredOfferType: 'health_bundle',
      premiumTolerance: 0.35,
    },
  },
  {
    id: 'deal_seekers',
    name: 'Deal Seekers',
    description: 'Research extensively, seek best value',
    icon: '🔍',
    color: '#ec4899',
    characteristics: [
      'Reads all reviews',
      'Compares multiple options',
      'Waits for right offer',
      'Informed purchases',
    ],
    pricingStrategy: {
      recommendedRate: 0.12,
      discountTolerance: 0.18,
      preferredOfferType: 'value_bundle',
      premiumTolerance: 0.10,
    },
  },
];

// ================== VALIDATION SCHEMAS ==================

const SegmentAnalysisRequestSchema = z.object({
  merchantId: z.string().min(1),
  vertical: z.string().optional(),
  includeRecommendations: z.boolean().default(true),
});

// ================== SEGMENT BRAIN CLASS ==================

class SegmentBrain {
  private segmentTemplates = SEGMENT_TEMPLATES;

  /**
   * Analyze merchant segments
   */
  analyze(request: z.infer<typeof SegmentAnalysisRequestSchema>): SegmentAnalysis {
    const segments = this.generateSegments(request.merchantId);

    // Sort by potential revenue impact
    segments.sort((a, b) => {
      const potentialA = a.count * a.lifetimeValue * (1 - a.churnRisk);
      const potentialB = b.count * b.lifetimeValue * (1 - b.churnRisk);
      return potentialB - potentialA;
    });

    // Generate segment distribution
    const totalCustomers = segments.reduce((sum, s) => sum + s.count, 0);
    const segmentDistribution = segments.map(s => ({
      segment: s.name,
      count: s.count,
      percentage: (s.count / totalCustomers) * 100,
    }));

    // Generate insights
    const insights = this.generateInsights(segments, totalCustomers);

    // Generate recommendations
    const recommendations = this.generateRecommendations(segments);

    logger.info('Segment analysis completed', {
      merchantId: request.merchantId,
      segmentsCount: segments.length,
      totalCustomers,
    });

    return {
      merchantId: request.merchantId,
      vertical: request.vertical || 'restaurant',
      totalCustomers,
      segments,
      segmentDistribution,
      insights,
      recommendations,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Generate mock segment data
   */
  private generateSegments(merchantId: string): BehavioralSegment[] {
    return this.segmentTemplates.map(template => {
      // Generate realistic data based on segment type
      let count: number;
      let avgOrderValue: number;
      let visitFrequency: number;
      let churnRisk: number;
      let lifetimeValue: number;

      switch (template.id) {
        case 'high_value_users':
          count = Math.floor(20 + Math.random() * 30);
          avgOrderValue = 800 + Math.random() * 400;
          visitFrequency = 4 + Math.random() * 3;
          churnRisk = 0.05 + Math.random() * 0.10;
          lifetimeValue = 25000 + Math.random() * 15000;
          break;
        case 'loyal_advocates':
          count = Math.floor(40 + Math.random() * 40);
          avgOrderValue = 550 + Math.random() * 250;
          visitFrequency = 3 + Math.random() * 2;
          churnRisk = 0.08 + Math.random() * 0.10;
          lifetimeValue = 18000 + Math.random() * 10000;
          break;
        case 'bargain_hunters':
          count = Math.floor(60 + Math.random() * 50);
          avgOrderValue = 350 + Math.random() * 150;
          visitFrequency = 2 + Math.random() * 2;
          churnRisk = 0.25 + Math.random() * 0.20;
          lifetimeValue = 8000 + Math.random() * 5000;
          break;
        case 'weekend_warriors':
          count = Math.floor(50 + Math.random() * 40);
          avgOrderValue = 700 + Math.random() * 300;
          visitFrequency = 2 + Math.random() * 1;
          churnRisk = 0.15 + Math.random() * 0.15;
          lifetimeValue = 12000 + Math.random() * 8000;
          break;
        case 'corporate_users':
          count = Math.floor(30 + Math.random() * 30);
          avgOrderValue = 600 + Math.random() * 300;
          visitFrequency = 3 + Math.random() * 2;
          churnRisk = 0.12 + Math.random() * 0.10;
          lifetimeValue = 20000 + Math.random() * 10000;
          break;
        case 'churn_risks':
          count = Math.floor(25 + Math.random() * 30);
          avgOrderValue = 280 + Math.random() * 150;
          visitFrequency = 0.5 + Math.random() * 0.5;
          churnRisk = 0.70 + Math.random() * 0.25;
          lifetimeValue = 3000 + Math.random() * 2000;
          break;
        case 'new_explorers':
          count = Math.floor(35 + Math.random() * 35);
          avgOrderValue = 400 + Math.random() * 200;
          visitFrequency = 1.5 + Math.random() * 1;
          churnRisk = 0.35 + Math.random() * 0.25;
          lifetimeValue = 5000 + Math.random() * 5000;
          break;
        case 'dormant_users':
          count = Math.floor(40 + Math.random() * 40);
          avgOrderValue = 300 + Math.random() * 150;
          visitFrequency = 0.2 + Math.random() * 0.3;
          churnRisk = 0.85 + Math.random() * 0.15;
          lifetimeValue = 2000 + Math.random() * 2000;
          break;
        case 'health_conscious':
          count = Math.floor(25 + Math.random() * 25);
          avgOrderValue = 650 + Math.random() * 300;
          visitFrequency = 2 + Math.random() * 2;
          churnRisk = 0.12 + Math.random() * 0.15;
          lifetimeValue = 15000 + Math.random() * 10000;
          break;
        case 'deal_seekers':
          count = Math.floor(45 + Math.random() * 35);
          avgOrderValue = 420 + Math.random() * 180;
          visitFrequency = 1.5 + Math.random() * 1.5;
          churnRisk = 0.30 + Math.random() * 0.20;
          lifetimeValue = 7000 + Math.random() * 4000;
          break;
        default:
          count = Math.floor(30 + Math.random() * 30);
          avgOrderValue = 450 + Math.random() * 200;
          visitFrequency = 2 + Math.random() * 2;
          churnRisk = 0.25 + Math.random() * 0.20;
          lifetimeValue = 10000 + Math.random() * 5000;
      }

      return {
        id: template.id,
        name: template.name,
        description: template.description,
        icon: template.icon,
        color: template.color,
        count,
        percentage: 0, // Will be calculated
        avgOrderValue: Math.round(avgOrderValue),
        visitFrequency: Math.round(visitFrequency * 10) / 10,
        churnRisk: Math.round(churnRisk * 100) / 100,
        lifetimeValue: Math.round(lifetimeValue),
        characteristics: template.characteristics,
        pricingStrategy: template.pricingStrategy,
        preferredChannels: this.getPreferredChannels(template.id),
        topProducts: this.getTopProducts(template.id),
        recommendedActions: this.getRecommendedActions(template.id, count, avgOrderValue, churnRisk),
      };
    });
  }

  /**
   * Get preferred communication channels
   */
  private getPreferredChannels(segmentId: string): ('whatsapp' | 'sms' | 'push' | 'email')[] {
    switch (segmentId) {
      case 'corporate_users':
        return ['email', 'whatsapp'];
      case 'high_value_users':
        return ['whatsapp', 'push'];
      case 'churn_risks':
      case 'dormant_users':
        return ['whatsapp', 'sms'];
      case 'weekend_warriors':
        return ['push', 'whatsapp'];
      default:
        return ['whatsapp', 'push', 'sms'];
    }
  }

  /**
   * Get top products for segment
   */
  private getTopProducts(segmentId: string): { name: string; affinity: number }[] {
    const products = [
      { name: 'Haircut', baseAffinity: 0.9 },
      { name: 'Hair Coloring', baseAffinity: 0.6 },
      { name: 'Hair Treatment', baseAffinity: 0.7 },
      { name: 'Facial', baseAffinity: 0.5 },
      { name: 'Manicure', baseAffinity: 0.4 },
    ];

    // Adjust affinities based on segment
    let modifiers: Record<string, number> = {};
    switch (segmentId) {
      case 'high_value_users':
        modifiers = { 'Hair Coloring': 1.2, 'Hair Treatment': 1.3, 'Facial': 1.1 };
        break;
      case 'health_conscious':
        modifiers = { 'Hair Treatment': 1.3, 'Facial': 1.4, 'Manicure': 0.8 };
        break;
      case 'bargain_hunters':
        modifiers = { 'Haircut': 1.2, 'Manicure': 1.1 };
        break;
    }

    return products
      .map(p => ({
        name: p.name,
        affinity: Math.min(1, p.baseAffinity * (modifiers[p.name] || 1)),
      }))
      .sort((a, b) => b.affinity - a.affinity)
      .slice(0, 3);
  }

  /**
   * Get recommended actions for segment
   */
  private getRecommendedActions(
    segmentId: string,
    count: number,
    avgOrderValue: number,
    churnRisk: number
  ): { type: string; action: string; expectedImpact: number; priority: 'high' | 'medium' | 'low' }[] {
    const actions: { type: string; action: string; expectedImpact: number; priority: 'high' | 'medium' | 'low' }[] = [];

    switch (segmentId) {
      case 'churn_risks':
        actions.push({
          type: 'win_back',
          action: 'Send personalized comeback offer (20% off)',
          expectedImpact: count * 0.25 * avgOrderValue,
          priority: 'high',
        });
        actions.push({
          type: 'reactivation',
          action: 'WhatsApp message asking what we can improve',
          expectedImpact: count * 0.15 * avgOrderValue,
          priority: 'high',
        });
        break;
      case 'dormant_users':
        actions.push({
          type: 'reactivation',
          action: 'Heavy discount comeback offer (25% off)',
          expectedImpact: count * 0.15 * avgOrderValue,
          priority: 'high',
        });
        break;
      case 'bargain_hunters':
        actions.push({
          type: 'offers',
          action: 'Target with flash sale notifications',
          expectedImpact: count * 0.30 * avgOrderValue,
          priority: 'medium',
        });
        break;
      case 'high_value_users':
        actions.push({
          type: 'vip_treatment',
          action: 'Exclusive premium services and priority booking',
          expectedImpact: count * 0.15 * avgOrderValue,
          priority: 'medium',
        });
        actions.push({
          type: 'referral',
          action: 'Request referrals with ₹500 credit',
          expectedImpact: count * 0.20 * avgOrderValue,
          priority: 'low',
        });
        break;
      case 'new_explorers':
        actions.push({
          type: 'onboarding',
          action: 'Send welcome series with service guide',
          expectedImpact: count * 0.40 * avgOrderValue,
          priority: 'high',
        });
        actions.push({
          type: 'second_visit',
          action: 'Offer 15% off second visit',
          expectedImpact: count * 0.35 * avgOrderValue,
          priority: 'high',
        });
        break;
      case 'loyal_advocates':
        actions.push({
          type: 'referral',
          action: 'Launch ambassador program with rewards',
          expectedImpact: count * 0.25 * avgOrderValue,
          priority: 'medium',
        });
        break;
      case 'weekend_warriors':
        actions.push({
          type: 'family_bundle',
          action: 'Create family weekend package',
          expectedImpact: count * 0.20 * avgOrderValue,
          priority: 'medium',
        });
        break;
    }

    return actions;
  }

  /**
   * Generate segment insights
   */
  private generateInsights(segments: BehavioralSegment[], totalCustomers: number) {
    const insights: { opportunity: string; action: string; potential: number }[] = [];

    // High value users opportunity
    const highValue = segments.find(s => s.id === 'high_value_users');
    if (highValue && highValue.percentage < 10) {
      insights.push({
        opportunity: 'Only 8% are high-value customers',
        action: 'Focus on upgrading regular customers to premium services',
        potential: totalCustomers * 0.05 * highValue.avgOrderValue,
      });
    }

    // Churn risk alert
    const churnRisks = segments.find(s => s.id === 'churn_risks');
    if (churnRisks && churnRisks.percentage > 15) {
      insights.push({
        opportunity: `${churnRisks.percentage.toFixed(0)}% of customers are at risk`,
        action: 'Immediate win-back campaign needed',
        potential: churnRisks.count * churnRisks.avgOrderValue * 0.3,
      });
    }

    // Dormant users
    const dormant = segments.find(s => s.id === 'dormant_users');
    if (dormant && dormant.percentage > 20) {
      insights.push({
        opportunity: `${dormant.percentage.toFixed(0)}% dormant customers need reactivation`,
        action: 'Launch "We miss you" campaign with heavy discounts',
        potential: dormant.count * dormant.avgOrderValue * 0.15,
      });
    }

    // Bargain hunters opportunity
    const bargains = segments.find(s => s.id === 'bargain_hunters');
    if (bargains && bargains.percentage > 35) {
      insights.push({
        opportunity: `${bargains.percentage.toFixed(0)}% are bargain hunters`,
        action: 'Convert to loyal customers with value bundles',
        potential: bargains.count * bargains.avgOrderValue * 0.25,
      });
    }

    return insights;
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(segments: BehavioralSegment[]) {
    return segments
      .flatMap(s => s.recommendedActions)
      .sort((a, b) => b.expectedImpact - a.expectedImpact)
      .slice(0, 5)
      .map((rec, i) => ({
        priority: i + 1,
        segment: segments.find(s => s.recommendedActions.includes(rec))?.name || 'Unknown',
        action: rec.action,
        expectedRevenue: Math.round(rec.expectedImpact),
      }));
  }

  /**
   * Get segment for customer
   */
  getCustomerSegment(customerId: string): {
    customerId: string;
    segment: BehavioralSegment;
    score: number;
    reasons: string[];
  } {
    // Mock customer assignment
    const segmentIndex = Math.floor(Math.random() * this.segmentTemplates.length);
    const template = this.segmentTemplates[segmentIndex];
    const score = 0.7 + Math.random() * 0.3;

    return {
      customerId,
      segment: {
        id: template.id,
        name: template.name,
        description: template.description,
        icon: template.icon,
        color: template.color,
        count: 0,
        percentage: 0,
        avgOrderValue: 400 + Math.random() * 300,
        visitFrequency: 2 + Math.random() * 2,
        churnRisk: Math.random() * 0.5,
        lifetimeValue: 10000 + Math.random() * 10000,
        characteristics: template.characteristics,
        pricingStrategy: template.pricingStrategy,
        preferredChannels: ['whatsapp'],
        topProducts: [],
        recommendedActions: [],
      },
      score: Math.round(score * 100) / 100,
      reasons: template.characteristics.slice(0, 2),
    };
  }
}

// ================== EXPRESS APP ==================

const app = express();
const brain = new SegmentBrain();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-revenue-ai-segment-brain',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/v1/segments/:merchantId
 * Get full segment analysis
 */
app.get('/api/v1/segments/:merchantId', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const { vertical } = req.query;

    const analysis = brain.analyze({
      merchantId,
      vertical: vertical as string,
    });

    res.json({ success: true, data: analysis });
  } catch (error) {
    logger.error('Segment analysis error', { error });
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to analyze segments' },
    });
  }
});

/**
 * GET /api/v1/segments/:merchantId/summary
 * Get segment summary
 */
app.get('/api/v1/segments/:merchantId/summary', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const analysis = brain.analyze({ merchantId });

    res.json({
      success: true,
      data: {
        merchantId,
        totalCustomers: analysis.totalCustomers,
        segments: analysis.segmentDistribution,
        topSegment: analysis.segments[0]?.name || 'N/A',
        atRiskCount: analysis.segments.find(s => s.id === 'churn_risks')?.count || 0,
        highValueCount: analysis.segments.find(s => s.id === 'high_value_users')?.count || 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to get summary' },
    });
  }
});

/**
 * GET /api/v1/customers/:customerId/segment
 * Get segment for specific customer
 */
app.get('/api/v1/customers/:customerId/segment', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const result = brain.getCustomerSegment(customerId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to get customer segment' },
    });
  }
});

/**
 * GET /api/v1/segments/templates
 * Get all segment templates
 */
app.get('/api/v1/segments/templates', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: SEGMENT_TEMPLATES.map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      icon: t.icon,
      characteristics: t.characteristics,
    })),
  });
});

const PORT = process.env.PORT || 4310;

app.listen(PORT, () => {
  logger.info('REZ Revenue AI Segment Brain started', { port: PORT });
});

export default app;
