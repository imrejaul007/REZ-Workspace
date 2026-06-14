/**
 * REZ Revenue AI - Cashback Optimization Service
 * Dynamic cashback rates based on segment, LTV, and churn risk
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

type AudienceSegment = 'new' | 'regular' | 'vip' | 'at_risk' | 'dormant';

interface CashbackResult {
  recommendedCashback: number;
  rate: number;
  segment: AudienceSegment;
  reason: string;
  alternatives: { rate: number; cashback: number; reason: string; impact: 'positive' | 'negative' | 'neutral' }[];
  totalCashbackExpense: number;
  expectedLTV: number;
  roi: number;
}

// ================== VALIDATION SCHEMAS ==================

const CashbackOptimizationRequestSchema = z.object({
  merchantId: z.string().min(1),
  userId: z.string().min(1),
  orderValue: z.number().positive(),
  category: z.string().min(1),
  vertical: z.enum(['restaurant', 'hotel', 'clinic', 'salon', 'gym', 'events', 'retail', 'home_services', 'corp_perks']),
  context: z.object({
    audience: z.object({
      segment: z.enum(['new', 'regular', 'vip', 'at_risk', 'dormant']),
      ltv: z.number().nonnegative().default(0),
      churnRisk: z.number().min(0).max(1).default(0),
      engagementScore: z.number().min(0).max(100).default(50),
      orderCount: z.number().int().nonnegative().default(0),
      daysSinceLastOrder: z.number().int().nonnegative().default(30),
    }),
    demand: z.number().min(0).max(100).optional(),
    isNewUser: z.boolean().optional(),
  }),
});

// ================== CASHBACK CONFIG ==================

const CASHBACK_CONFIG: Record<string, Record<AudienceSegment, { base: number; min: number; max: number }>> = {
  restaurant: {
    new: { base: 0.20, min: 0.10, max: 0.30 },
    regular: { base: 0.08, min: 0.05, max: 0.15 },
    vip: { base: 0.03, min: 0.02, max: 0.08 },
    at_risk: { base: 0.15, min: 0.10, max: 0.25 },
    dormant: { base: 0.12, min: 0.08, max: 0.20 },
  },
  hotel: {
    new: { base: 0.15, min: 0.10, max: 0.25 },
    regular: { base: 0.06, min: 0.03, max: 0.12 },
    vip: { base: 0.02, min: 0.01, max: 0.05 },
    at_risk: { base: 0.12, min: 0.08, max: 0.20 },
    dormant: { base: 0.10, min: 0.05, max: 0.15 },
  },
  salon: {
    new: { base: 0.18, min: 0.10, max: 0.25 },
    regular: { base: 0.07, min: 0.04, max: 0.12 },
    vip: { base: 0.03, min: 0.02, max: 0.06 },
    at_risk: { base: 0.14, min: 0.08, max: 0.20 },
    dormant: { base: 0.10, min: 0.05, max: 0.15 },
  },
  clinic: {
    new: { base: 0.12, min: 0.08, max: 0.20 },
    regular: { base: 0.05, min: 0.03, max: 0.10 },
    vip: { base: 0.02, min: 0.01, max: 0.04 },
    at_risk: { base: 0.10, min: 0.05, max: 0.15 },
    dormant: { base: 0.08, min: 0.04, max: 0.12 },
  },
  gym: {
    new: { base: 0.15, min: 0.10, max: 0.25 },
    regular: { base: 0.05, min: 0.03, max: 0.10 },
    vip: { base: 0.02, min: 0.01, max: 0.04 },
    at_risk: { base: 0.12, min: 0.08, max: 0.18 },
    dormant: { base: 0.08, min: 0.05, max: 0.12 },
  },
  events: {
    new: { base: 0.10, min: 0.05, max: 0.15 },
    regular: { base: 0.05, min: 0.03, max: 0.08 },
    vip: { base: 0.02, min: 0.01, max: 0.03 },
    at_risk: { base: 0.08, min: 0.05, max: 0.12 },
    dormant: { base: 0.06, min: 0.03, max: 0.10 },
  },
  retail: {
    new: { base: 0.15, min: 0.08, max: 0.25 },
    regular: { base: 0.06, min: 0.03, max: 0.12 },
    vip: { base: 0.03, min: 0.02, max: 0.06 },
    at_risk: { base: 0.12, min: 0.08, max: 0.18 },
    dormant: { base: 0.10, min: 0.05, max: 0.15 },
  },
  home_services: {
    new: { base: 0.15, min: 0.10, max: 0.22 },
    regular: { base: 0.07, min: 0.04, max: 0.12 },
    vip: { base: 0.03, min: 0.02, max: 0.06 },
    at_risk: { base: 0.12, min: 0.08, max: 0.18 },
    dormant: { base: 0.10, min: 0.05, max: 0.15 },
  },
  corp_perks: {
    new: { base: 0.08, min: 0.05, max: 0.12 },
    regular: { base: 0.04, min: 0.02, max: 0.08 },
    vip: { base: 0.02, min: 0.01, max: 0.04 },
    at_risk: { base: 0.06, min: 0.04, max: 0.10 },
    dormant: { base: 0.05, min: 0.03, max: 0.08 },
  },
};

// ================== CASHBACK OPTIMIZER CLASS ==================

class CashbackOptimizer {
  /**
   * Optimize cashback rate for user and context
   */
  optimize(request: z.infer<typeof CashbackOptimizationRequestSchema>): CashbackResult {
    const { merchantId, userId, orderValue, category, vertical, context } = request;
    const { audience, demand } = context;
    const segment = audience.segment;

    const config = CASHBACK_CONFIG[vertical]?.[segment] || CASHBACK_CONFIG.restaurant[segment];
    const alternatives: CashbackResult['alternatives'] = [];

    // Calculate base cashback
    let recommendedRate = config.base;
    let reason = `Base ${segment} rate for ${vertical}`;

    // Adjust for churn risk
    if (audience.churnRisk > 0.7) {
      recommendedRate = Math.min(recommendedRate * 1.5, config.max);
      reason = 'High churn risk - elevated retention rate';
    } else if (audience.churnRisk > 0.5) {
      recommendedRate = Math.min(recommendedRate * 1.25, config.max);
      reason = 'Moderate churn risk - slight boost';
    }

    // Adjust for LTV
    if (audience.ltv > 50000) {
      // High LTV - reduce cashback (they're already valuable)
      recommendedRate = Math.max(recommendedRate * 0.8, config.min);
      reason = 'High LTV customer - optimized rate';
    } else if (audience.ltv > 25000) {
      recommendedRate = Math.max(recommendedRate * 0.9, config.min);
    }

    // Adjust for engagement
    if (audience.engagementScore > 80) {
      // High engagement - reduce cashback
      recommendedRate = Math.max(recommendedRate * 0.9, config.min);
    } else if (audience.engagementScore < 30) {
      // Low engagement - boost cashback
      recommendedRate = Math.min(recommendedRate * 1.2, config.max);
    }

    // Adjust for demand
    if (demand !== undefined) {
      if (demand > 70) {
        // High demand - reduce cashback
        recommendedRate = Math.max(recommendedRate * 0.85, config.min);
        reason += ' (reduced for high demand)';
      } else if (demand < 30) {
        // Low demand - boost cashback
        recommendedRate = Math.min(recommendedRate * 1.25, config.max);
        reason += ' (boosted for low demand)';
      }
    }

    // Adjust for new user
    if (context.isNewUser || segment === 'new') {
      recommendedRate = Math.max(recommendedRate, 0.10);
      reason = 'New user acquisition rate';
    }

    // Adjust for dormant users
    if (segment === 'dormant') {
      recommendedRate = Math.min(recommendedRate * 1.3, config.max);
      reason = 'Reactivation rate for dormant user';
    }

    // Ensure within bounds
    recommendedRate = Math.max(config.min, Math.min(config.max, recommendedRate));

    // Generate alternatives
    // Lower rate option
    const lowerRate = Math.max(recommendedRate * 0.8, config.min);
    const lowerCashback = orderValue * lowerRate;
    alternatives.push({
      rate: Math.round(lowerRate * 1000) / 1000,
      cashback: Math.round(lowerCashback * 100) / 100,
      reason: 'Conservative rate - better margins',
      impact: 'negative',
    });

    // Higher rate option
    const higherRate = Math.min(recommendedRate * 1.2, config.max);
    if (higherRate !== recommendedRate) {
      const higherCashback = orderValue * higherRate;
      alternatives.push({
        rate: Math.round(higherRate * 1000) / 1000,
        cashback: Math.round(higherCashback * 100) / 100,
        reason: 'Aggressive rate - higher conversion',
        impact: 'positive',
      });
    }

    // No cashback option (for VIPs in high demand)
    if (segment === 'vip' && (demand === undefined || demand > 60)) {
      alternatives.push({
        rate: 0,
        cashback: 0,
        reason: 'VIP already engaged - no cashback needed',
        impact: 'neutral',
      });
    }

    // Calculate recommended cashback
    const recommendedCashback = orderValue * recommendedRate;

    // Estimate expected LTV improvement
    const expectedLTVImprovement = this.calculateLTVImprovement(
      segment,
      recommendedRate,
      audience.orderCount,
      audience.daysSinceLastOrder
    );

    // Calculate ROI
    const totalCashbackExpense = recommendedCashback;
    const roi = expectedLTVImprovement > 0 ? ((expectedLTVImprovement - totalCashbackExpense) / totalCashbackExpense) * 100 : 0;

    logger.info('Cashback optimized', {
      merchantId,
      userId,
      segment,
      recommendedRate,
      recommendedCashback,
      roi: Math.round(roi * 100) / 100,
    });

    return {
      recommendedCashback: Math.round(recommendedCashback * 100) / 100,
      rate: Math.round(recommendedRate * 1000) / 1000,
      segment,
      reason,
      alternatives: alternatives.sort((a, b) => b.rate - a.rate),
      totalCashbackExpense: Math.round(totalCashbackExpense * 100) / 100,
      expectedLTV: Math.round(expectedLTVImprovement * 100) / 100,
      roi: Math.round(roi * 100) / 100,
    };
  }

  /**
   * Calculate expected LTV improvement from cashback
   */
  private calculateLTVImprovement(
    segment: AudienceSegment,
    cashbackRate: number,
    orderCount: number,
    daysSinceLastOrder: number
  ): number {
    // Base improvement from retention
    let improvement = 0;

    // Segment-specific retention impact
    const retentionMultiplier: Record<AudienceSegment, number> = {
      new: 1.5,
      regular: 1.2,
      vip: 1.1,
      at_risk: 1.4,
      dormant: 1.6,
    };

    // Higher cashback = higher retention = higher LTV
    const retentionImpact = cashbackRate * retentionMultiplier[segment] * 1000;
    improvement += retentionImpact;

    // New users have higher potential
    if (segment === 'new') {
      improvement *= 1.3;
    }

    // Dormant users have high reactivation potential
    if (segment === 'dormant' && daysSinceLastOrder > 60) {
      improvement *= 1.5;
    }

    // At-risk users need immediate retention
    if (segment === 'at_risk') {
      improvement *= 1.4;
    }

    return improvement;
  }

  /**
   * Get segment cashback rates
   */
  getSegmentRates(vertical: string): Record<AudienceSegment, { base: number; min: number; max: number }> {
    return CASHBACK_CONFIG[vertical] || CASHBACK_CONFIG.restaurant;
  }
}

// ================== EXPRESS APP ==================

const app = express();
const cashbackOptimizer = new CashbackOptimizer();

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
    service: 'rez-revenue-ai-cashback-optimizer',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /api/v1/cashback/optimize
 * Optimize cashback for given context
 */
app.post('/api/v1/cashback/optimize', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string;

    const validationResult = CashbackOptimizationRequestSchema.safeParse(req.body);
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

    const result = cashbackOptimizer.optimize(validationResult.data);

    res.json({
      success: true,
      data: result,
      metadata: { requestId, timestamp: new Date(), calculationTimeMs: Date.now() - startTime },
    });
  } catch (error) {
    logger.error('Cashback optimization error', { error });
    res.status(500).json({
      success: false,
      error: { code: 'OPTIMIZATION_ERROR', message: 'Failed to optimize cashback' },
    });
  }
});

/**
 * GET /api/v1/cashback/segments/:vertical
 * Get cashback rates by segment for vertical
 */
app.get('/api/v1/cashback/segments/:vertical', (req: Request, res: Response) => {
  const { vertical } = req.params;
  const rates = cashbackOptimizer.getSegmentRates(vertical);

  res.json({
    success: true,
    data: {
      vertical,
      segments: rates,
    },
  });
});

const PORT = process.env.PORT || 4304;

app.listen(PORT, () => {
  logger.info('REZ Revenue AI Cashback Optimizer started', { port: PORT });
});

export default app;
