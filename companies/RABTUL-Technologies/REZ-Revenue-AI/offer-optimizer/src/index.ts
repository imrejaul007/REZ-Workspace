/**
 * REZ Revenue AI - Offer Optimization Service
 * AI-powered offer generation and optimization
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

type OfferType = 'percentage_discount' | 'fixed_discount' | 'buy_x_get_y' | 'cashback' | 'bundle' | 'free_item' | 'upgrade';
type AudienceSegment = 'new' | 'regular' | 'vip' | 'at_risk' | 'dormant';

interface Offer {
  id: string;
  name: string;
  description: string;
  type: OfferType;
  value: number;
  isPercentage: boolean;
  conditions: { type: string; value: unknown }[];
  minOrderValue?: number;
  maxDiscountAmount?: number;
  priority: number;
}

interface OfferOptimizationResult {
  recommendedOffer: Offer | null;
  alternatives: { offer: Offer; expectedRevenue: number; conversionLift: number; marginImpact: number }[];
  noOfferRecommendation: { shouldOffer: boolean; reason: string; expectedRevenue: number };
  confidence: number;
}

// ================== VALIDATION SCHEMAS ==================

const OfferOptimizationRequestSchema = z.object({
  merchantId: z.string().min(1),
  entityId: z.string().min(1),
  basePrice: z.number().positive(),
  currentOffer: z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    value: z.number(),
  }).optional(),
  audience: z.object({
    segment: z.enum(['new', 'regular', 'vip', 'at_risk', 'dormant']),
    churnRisk: z.number().min(0).max(1).optional(),
    orderCount: z.number().int().nonnegative().optional(),
    daysSinceLastOrder: z.number().int().nonnegative().optional(),
  }).optional(),
  context: z.object({
    demand: z.number().min(0).max(100).optional(),
    inventoryPercentage: z.number().min(0).max(100).optional(),
    timeOfDay: z.number().int().min(0).max(23).optional(),
    dayOfWeek: z.number().int().min(0).max(6).optional(),
    isWeekend: z.boolean().optional(),
  }),
  optimizationGoal: z.enum(['revenue', 'conversion', 'retention', 'acquisition']),
});

// ================== OFFER ENGINE CLASS ==================

class OfferOptimizer {
  private offerTemplates: Map<string, Offer> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  private initializeTemplates() {
    // New user acquisition offers
    this.offerTemplates.set('new_user_10', {
      id: 'new_user_10',
      name: 'Welcome Offer',
      description: '10% off for new users',
      type: 'percentage_discount',
      value: 10,
      isPercentage: true,
      conditions: [{ type: 'new_users_only', value: true }],
      priority: 1,
    });

    this.offerTemplates.set('new_user_100', {
      id: 'new_user_100',
      name: '₹100 Off',
      description: 'Flat ₹100 off on first order',
      type: 'fixed_discount',
      value: 100,
      isPercentage: false,
      conditions: [{ type: 'first_order_only', value: true }],
      minOrderValue: 500,
      priority: 2,
    });

    // Retention offers
    this.offerTemplates.set('comeback_15', {
      id: 'comeback_15',
      name: 'We Miss You',
      description: '15% off to welcome you back',
      type: 'percentage_discount',
      value: 15,
      isPercentage: true,
      conditions: [{ type: 'dormant_users', value: true }],
      priority: 1,
    });

    // Conversion offers
    this.offerTemplates.set('buy2get1', {
      id: 'buy2get1',
      name: 'Buy 2 Get 1',
      description: 'Buy any 2, get 1 free',
      type: 'buy_x_get_y',
      value: 1,
      isPercentage: false,
      conditions: [{ type: 'min_quantity', value: 3 }],
      priority: 3,
    });

    this.offerTemplates.set('bundle_20', {
      id: 'bundle_20',
      name: 'Bundle Deal',
      description: '20% off on bundle purchase',
      type: 'bundle',
      value: 20,
      isPercentage: true,
      conditions: [{ type: 'min_bundle_size', value: 2 }],
      priority: 2,
    });

    // Revenue optimization offers
    this.offerTemplates.set('surge_5', {
      id: 'surge_5',
      name: 'Limited Time',
      description: '5% off - hurry!',
      type: 'percentage_discount',
      value: 5,
      isPercentage: true,
      conditions: [{ type: 'valid_hours', value: 24 }],
      priority: 4,
    });

    this.offerTemplates.set('premium_2', {
      id: 'premium_2',
      name: 'Premium Upgrade',
      description: 'Free upgrade to premium',
      type: 'upgrade',
      value: 0,
      isPercentage: false,
      conditions: [],
      priority: 3,
    });

    // Cashback offers
    this.offerTemplates.set('cashback_5', {
      id: 'cashback_5',
      name: '5% Cashback',
      description: 'Get 5% cashback on this order',
      type: 'cashback',
      value: 5,
      isPercentage: true,
      conditions: [],
      priority: 2,
    });

    this.offerTemplates.set('cashback_10', {
      id: 'cashback_10',
      name: '10% Cashback',
      description: 'Get 10% cashback on this order',
      type: 'cashback',
      value: 10,
      isPercentage: true,
      conditions: [{ type: 'min_order_value', value: 1000 }],
      priority: 2,
    });
  }

  /**
   * Optimize offer based on context
   */
  optimize(request: z.infer<typeof OfferOptimizationRequestSchema>): OfferOptimizationResult {
    const { basePrice, audience, context, optimizationGoal } = request;
    const alternatives: OfferOptimizationResult['alternatives'] = [];

    // Determine segment and appropriate offers
    const segment = audience?.segment || 'regular';
    const demand = context.demand || 50;
    const isLowDemand = demand < 40;
    const isHighDemand = demand > 70;

    let recommendedOffer: Offer | null = null;
    let bestScore = -Infinity;

    // Score each offer template
    for (const [id, template] of this.offerTemplates) {
      const score = this.scoreOffer(template, {
        segment,
        demand,
        basePrice,
        isLowDemand,
        isHighDemand,
        optimizationGoal,
        audience,
        context,
      });

      if (score > bestScore) {
        bestScore = score;
        recommendedOffer = { ...template, id: `${template.id}_${Date.now()}` };
      }

      // Add to alternatives
      const expectedRevenue = this.calculateExpectedRevenue(template, basePrice, segment);
      const conversionLift = this.calculateConversionLift(template, segment, isLowDemand);
      const marginImpact = this.calculateMarginImpact(template, basePrice);

      alternatives.push({
        offer: { ...template, id: `${template.id}_alt_${Date.now()}` },
        expectedRevenue,
        conversionLift,
        marginImpact,
      });
    }

    // Sort alternatives by score
    alternatives.sort((a, b) => b.expectedRevenue - a.expectedRevenue);

    // Determine if no offer is better
    const noOfferExpectedRevenue = basePrice;
    const hasOfferExpectedRevenue = recommendedOffer
      ? this.calculateExpectedRevenue(recommendedOffer, basePrice, segment)
      : 0;

    const noOfferRecommendation = {
      shouldOffer: hasOfferExpectedRevenue > noOfferExpectedRevenue * 0.95,
      reason: hasOfferExpectedRevenue > noOfferExpectedRevenue
        ? 'Offer generates more expected revenue'
        : 'Base price is optimal for this context',
      expectedRevenue: Math.max(noOfferExpectedRevenue, hasOfferExpectedRevenue),
    };

    // Adjust recommendation based on no-offer analysis
    if (!noOfferRecommendation.shouldOffer) {
      recommendedOffer = null;
    }

    const confidence = this.calculateConfidence(segment, audience, context);

    logger.info('Offer optimized', {
      merchantId: request.merchantId,
      optimizationGoal,
      segment,
      recommendedOffer: recommendedOffer?.name || 'none',
      confidence,
    });

    return {
      recommendedOffer,
      alternatives: alternatives.slice(0, 5),
      noOfferRecommendation,
      confidence,
    };
  }

  /**
   * Score an offer based on context
   */
  private scoreOffer(
    offer: Offer,
    context: {
      segment: AudienceSegment;
      demand: number;
      basePrice: number;
      isLowDemand: boolean;
      isHighDemand: boolean;
      optimizationGoal: string;
      audience?: { churnRisk?: number; orderCount?: number };
      context: { inventoryPercentage?: number };
    }
  ): number {
    let score = 50; // Base score

    // Goal alignment
    switch (context.optimizationGoal) {
      case 'acquisition':
        if (context.segment === 'new' && (offer.id.includes('new_user') || offer.id.includes('welcome'))) {
          score += 30;
        }
        break;
      case 'retention':
        if (context.segment === 'at_risk' || context.segment === 'dormant') {
          if (offer.id.includes('comeback') || offer.id.includes('cashback')) {
            score += 30;
          }
        }
        if (context.audience?.churnRisk && context.audience.churnRisk > 0.5) {
          score += 20;
        }
        break;
      case 'conversion':
        if (context.isLowDemand) {
          score += 25;
        }
        if (offer.type === 'buy_x_get_y' || offer.type === 'bundle') {
          score += 15;
        }
        break;
      case 'revenue':
        if (!context.isHighDemand && offer.value <= 15) {
          score += 20; // Lower discounts when demand is normal/high
        }
        break;
    }

    // Demand-based adjustments
    if (context.isLowDemand) {
      if (offer.type === 'percentage_discount' && offer.value >= 15) {
        score += 15;
      }
      if (offer.type === 'buy_x_get_y') {
        score += 20;
      }
    }

    // Inventory clearance
    if (context.context.inventoryPercentage && context.context.inventoryPercentage > 80) {
      if (offer.type === 'bundle' || offer.type === 'buy_x_get_y') {
        score += 15;
      }
    }

    // Segment-specific adjustments
    if (context.segment === 'vip') {
      if (offer.type === 'upgrade' || offer.type === 'cashback') {
        score += 15; // VIPs prefer premium experiences
      }
      if (offer.value > 10) {
        score -= 10; // Don't over-discount VIPs
      }
    }

    if (context.segment === 'new') {
      score += 10; // Encourage first purchase
    }

    // Margin protection
    if (offer.isPercentage && offer.value > 25) {
      score -= 20; // Too deep a discount
    }

    return score;
  }

  /**
   * Calculate expected revenue from offer
   */
  private calculateExpectedRevenue(offer: Offer, basePrice: number, segment: AudienceSegment): number {
    let discount = 0;

    if (offer.isPercentage) {
      discount = (basePrice * offer.value) / 100;
    } else {
      discount = offer.value;
    }

    // Segment-specific conversion uplift
    const conversionUplift = this.getConversionUplift(segment, offer);
    const expectedPrice = basePrice - discount;
    const expectedRevenue = expectedPrice * conversionUplift;

    return expectedRevenue;
  }

  /**
   * Get conversion uplift based on segment and offer
   */
  private getConversionUplift(segment: AudienceSegment, offer: Offer): number {
    const baseUplift: Record<string, number> = {
      new: 1.4,
      regular: 1.15,
      vip: 1.05,
      at_risk: 1.25,
      dormant: 1.35,
    };

    const uplift = baseUplift[segment] || 1.15;

    // Offer-specific boosts
    if (offer.type === 'buy_x_get_y') return uplift * 1.3;
    if (offer.type === 'bundle') return uplift * 1.2;
    if (offer.type === 'free_item') return uplift * 1.25;
    if (offer.type === 'cashback') return uplift * 1.1;

    return uplift;
  }

  /**
   * Calculate conversion lift
   */
  private calculateConversionLift(offer: Offer, segment: AudienceSegment, isLowDemand: boolean): number {
    let lift = 1.0;

    if (offer.isPercentage) {
      lift += offer.value / 100;
    } else if (offer.type === 'buy_x_get_y') {
      lift += 0.35;
    } else if (offer.type === 'bundle') {
      lift += 0.25;
    } else if (offer.type === 'cashback') {
      lift += 0.15;
    } else if (offer.type === 'free_item') {
      lift += 0.3;
    }

    if (isLowDemand) {
      lift *= 1.2;
    }

    return Math.round(lift * 100) / 100;
  }

  /**
   * Calculate margin impact
   */
  private calculateMarginImpact(offer: Offer, basePrice: number): number {
    if (offer.type === 'cashback') {
      return 0; // Cashback doesn't affect margin directly
    }

    if (offer.isPercentage) {
      return -offer.value;
    } else {
      return -((offer.value / basePrice) * 100);
    }
  }

  /**
   * Calculate confidence in recommendation
   */
  private calculateConfidence(
    segment: AudienceSegment,
    audience?: { churnRisk?: number; orderCount?: number },
    context?: { demand?: number; inventoryPercentage?: number }
  ): number {
    let confidence = 0.7;

    if (audience?.orderCount && audience.orderCount > 10) {
      confidence += 0.1;
    }

    if (context?.demand !== undefined) {
      confidence += 0.05;
    }

    if (context?.inventoryPercentage !== undefined) {
      confidence += 0.05;
    }

    return Math.min(0.92, Math.max(0.65, confidence));
  }

  /**
   * Get all available offers
   */
  getAvailableOffers(vertical?: string): Offer[] {
    return Array.from(this.offerTemplates.values());
  }
}

// ================== EXPRESS APP ==================

const app = express();
const offerOptimizer = new OfferOptimizer();

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
    service: 'rez-revenue-ai-offer-optimizer',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /api/v1/offers/optimize
 * Optimize offer for given context
 */
app.post('/api/v1/offers/optimize', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string;

    const validationResult = OfferOptimizationRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: validationResult.error.issues,
        },
      });
    }

    const result = offerOptimizer.optimize(validationResult.data);

    res.json({
      success: true,
      data: result,
      metadata: { requestId, timestamp: new Date(), calculationTimeMs: Date.now() - startTime },
    });
  } catch (error) {
    logger.error('Offer optimization error', { error });
    res.status(500).json({
      success: false,
      error: { code: 'OPTIMIZATION_ERROR', message: 'Failed to optimize offer' },
    });
  }
});

/**
 * GET /api/v1/offers/templates
 * Get all offer templates
 */
app.get('/api/v1/offers/templates', (req: Request, res: Response) => {
  const offers = offerOptimizer.getAvailableOffers();
  res.json({ success: true, data: offers });
});

const PORT = process.env.PORT || 4303;

app.listen(PORT, () => {
  logger.info('REZ Revenue AI Offer Optimizer started', { port: PORT });
});

export default app;
