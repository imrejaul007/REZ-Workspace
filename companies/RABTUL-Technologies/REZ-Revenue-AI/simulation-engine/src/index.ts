/**
 * REZ Revenue AI - Simulation Engine
 * What-If testing for revenue scenarios
 *
 * "What if I increase haircut price by 10%?"
 * System predicts: Customers -3%, Revenue +7%, Profit +12%
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

interface SimulationScenario {
  type: 'pricing' | 'offer' | 'cashback' | 'bundle' | 'staffing' | 'inventory';
  entityId?: string;
  changes: Record<string, number>;
  description: string;
}

interface SimulationBaseline {
  revenue: number;
  customers: number;
  orders: number;
  aov: number;
  conversionRate: number;
  profitMargin: number;
  repeatRate: number;
}

interface SimulationProjection {
  revenue: number;
  customers: number;
  orders: number;
  aov: number;
  conversionRate: number;
  profitMargin: number;
  repeatRate: number;
}

interface MetricChange {
  metric: string;
  baseline: number;
  projected: number;
  change: number;
  changePercent: number;
  confidence: number;
  explanation: string;
}

interface SimulationResult {
  scenarioId: string;
  scenario: SimulationScenario;
  baseline: SimulationBaseline;
  projected: SimulationProjection;
  changes: MetricChange[];
  totalImpact: number;
  impactPercent: number;
  risks: string[];
  warnings: string[];
  recommendations: string[];
  sensitivity: 'low' | 'medium' | 'high';
  confidence: number;
  generatedAt: string;
}

// ================== VALIDATION SCHEMAS ==================

const SimulationRequestSchema = z.object({
  merchantId: z.string().min(1),
  scenario: z.object({
    type: z.enum(['pricing', 'offer', 'cashback', 'bundle', 'staffing', 'inventory']),
    entityId: z.string().optional(),
    changes: z.record(z.string(), z.number()),
    description: z.string(),
  }),
  horizon: z.enum(['week', 'month']).default('month'),
  options: z.object({
    includeRisks: z.boolean().default(true),
    includeCompetitorImpact: z.boolean().default(false),
  }).optional(),
});

// ================== ANALYTICS MOCK ==================

const getMerchantBaseline = (merchantId: string): SimulationBaseline => {
  const baseRevenue = 150000 + Math.random() * 100000;
  const orders = 500 + Math.floor(Math.random() * 200);
  const customers = 200 + Math.floor(Math.random() * 100);

  return {
    revenue: baseRevenue,
    customers,
    orders,
    aov: baseRevenue / orders,
    conversionRate: 0.12 + Math.random() * 0.08,
    profitMargin: 0.25 + Math.random() * 0.15,
    repeatRate: 0.35 + Math.random() * 0.15,
  };
};

// ================== SIMULATION ENGINE ==================

class SimulationEngine {
  /**
   * Run a what-if simulation
   */
  simulate(request: z.infer<typeof SimulationRequestSchema>): SimulationResult {
    const { merchantId, scenario, horizon } = request;
    const baseline = getMerchantBaseline(merchantId);
    const projected = { ...baseline };
    const changes: MetricChange[] = [];
    const risks: string[] = [];
    const warnings: string[] = [];

    // Apply scenario-specific simulations
    switch (scenario.type) {
      case 'pricing':
        this.simulatePricingScenario(scenario, baseline, projected, changes, risks);
        break;
      case 'offer':
        this.simulateOfferScenario(scenario, baseline, projected, changes, risks);
        break;
      case 'cashback':
        this.simulateCashbackScenario(scenario, baseline, projected, changes, risks);
        break;
      case 'bundle':
        this.simulateBundleScenario(scenario, baseline, projected, changes, risks);
        break;
      case 'staffing':
        this.simulateStaffingScenario(scenario, baseline, projected, changes, warnings);
        break;
      case 'inventory':
        this.simulateInventoryScenario(scenario, baseline, projected, changes, warnings);
        break;
    }

    // Calculate total impact
    const totalImpact = projected.revenue - baseline.revenue;
    const impactPercent = (totalImpact / baseline.revenue) * 100;

    // Determine sensitivity
    const sensitivity = Math.abs(impactPercent) > 20 ? 'high' : Math.abs(impactPercent) > 10 ? 'medium' : 'low';

    const result: SimulationResult = {
      scenarioId: uuidv4(),
      scenario,
      baseline,
      projected,
      changes,
      totalImpact,
      impactPercent,
      risks,
      warnings,
      recommendations: this.generateRecommendations(scenario, projected, baseline),
      sensitivity,
      confidence: 0.72 + Math.random() * 0.15,
      generatedAt: new Date().toISOString(),
    };

    logger.info('Simulation completed', {
      merchantId,
      scenarioType: scenario.type,
      impactPercent: impactPercent.toFixed(1),
      sensitivity,
    });

    return result;
  }

  /**
   * Simulate pricing changes
   */
  private simulatePricingScenario(
    scenario: SimulationScenario,
    baseline: SimulationBaseline,
    projected: SimulationProjection,
    changes: MetricChange[],
    risks: string[]
  ) {
    const priceChange = scenario.changes.priceChange || 0; // percentage

    // Revenue impact: price change * (1 - volume reduction)
    const volumeReduction = priceChange > 0 ? priceChange * 0.3 : priceChange * 0.1;
    const revenueChange = priceChange * (1 - volumeReduction / 100);

    projected.revenue = baseline.revenue * (1 + revenueChange / 100);
    projected.aov = baseline.aov * (1 + priceChange / 100);

    // Volume impact
    const customerChange = priceChange > 0 ? -volumeReduction : volumeReduction / 2;
    projected.customers = baseline.customers * (1 + customerChange / 100);
    projected.orders = baseline.orders * (1 + customerChange / 100);

    // Conversion rate impact
    const conversionChange = priceChange > 0 ? -0.05 : 0.03;
    projected.conversionRate = baseline.conversionRate * (1 + conversionChange);

    // Margin impact (usually positive for price increases)
    const marginChange = priceChange > 0 ? priceChange * 0.4 : priceChange * 0.3;
    projected.profitMargin = baseline.profitMargin * (1 + marginChange / 100);

    changes.push({
      metric: 'revenue',
      baseline: baseline.revenue,
      projected: projected.revenue,
      change: projected.revenue - baseline.revenue,
      changePercent: revenueChange,
      confidence: 0.82,
      explanation: `Price ${priceChange > 0 ? 'increase' : 'decrease'} of ${Math.abs(priceChange)}% with ${Math.abs(volumeReduction).toFixed(1)}% volume ${priceChange > 0 ? 'reduction' : 'increase'}`,
    });

    changes.push({
      metric: 'customers',
      baseline: baseline.customers,
      projected: projected.customers,
      change: projected.customers - baseline.customers,
      changePercent: customerChange,
      confidence: 0.75,
      explanation: `${Math.abs(customerChange).toFixed(1)}% ${customerChange > 0 ? 'more' : 'fewer'} customers expected`,
    });

    changes.push({
      metric: 'profitMargin',
      baseline: baseline.profitMargin * 100,
      projected: projected.profitMargin * 100,
      change: (projected.profitMargin - baseline.profitMargin) * 100,
      changePercent: marginChange,
      confidence: 0.78,
      explanation: `Margin ${marginChange > 0 ? 'improves' : 'decreases'} as ${priceChange > 0 ? 'higher prices offset volume loss' : 'lower prices drive volume'}`,
    });

    if (priceChange > 15) {
      risks.push('Large price increases (>15%) may significantly impact customer perception');
      risks.push('Competitor pricing may become more attractive');
    }
  }

  /**
   * Simulate offer/discount changes
   */
  private simulateOfferScenario(
    scenario: SimulationScenario,
    baseline: SimulationBaseline,
    projected: SimulationProjection,
    changes: MetricChange[],
    risks: string[]
  ) {
    const discountChange = scenario.changes.discountChange || 0;
    const offerDuration = scenario.changes.duration || 30; // days

    // Offers increase volume but reduce margin
    const volumeLift = discountChange * 0.8; // 80% of discount converts to volume
    const marginCost = discountChange * 0.6; // 60% of discount comes from margin

    projected.orders = baseline.orders * (1 + volumeLift / 100);
    projected.customers = baseline.customers * (1 + volumeLift / 100 * 0.7);
    projected.revenue = baseline.revenue * (1 + (volumeLift - discountChange * 0.4) / 100);
    projected.profitMargin = baseline.profitMargin * (1 - marginCost / 100);
    projected.repeatRate = baseline.repeatRate * (1 + discountChange * 0.1 / 100);

    changes.push({
      metric: 'orders',
      baseline: baseline.orders,
      projected: projected.orders,
      change: projected.orders - baseline.orders,
      changePercent: volumeLift,
      confidence: 0.78,
      explanation: `${volumeLift.toFixed(1)}% order increase from ${discountChange}% discount`,
    });

    changes.push({
      metric: 'revenue',
      baseline: baseline.revenue,
      projected: projected.revenue,
      change: projected.revenue - baseline.revenue,
      changePercent: (projected.revenue - baseline.revenue) / baseline.revenue * 100,
      confidence: 0.72,
      explanation: `Revenue ${projected.revenue > baseline.revenue ? 'increases' : 'decreases'} due to volume vs margin trade-off`,
    });

    changes.push({
      metric: 'profitMargin',
      baseline: baseline.profitMargin * 100,
      projected: projected.profitMargin * 100,
      change: (projected.profitMargin - baseline.profitMargin) * 100,
      changePercent: -marginCost,
      confidence: 0.85,
      explanation: `Margin reduced by ${marginCost.toFixed(1)}% due to discount cost`,
    });

    if (discountChange > 20) {
      risks.push('Deep discounts (>20%) may train customers to only buy on offer');
      risks.push('Brand perception may be affected by frequent discounting');
    }
  }

  /**
   * Simulate cashback changes
   */
  private simulateCashbackScenario(
    scenario: SimulationScenario,
    baseline: SimulationBaseline,
    projected: SimulationProjection,
    changes: MetricChange[],
    risks: string[]
  ) {
    const cashbackChange = scenario.changes.cashbackChange || 0;

    // Cashback is less damaging to margin than discounts
    const customerLift = cashbackChange * 0.4;
    const marginCost = cashbackChange * 0.3;

    projected.customers = baseline.customers * (1 + customerLift / 100);
    projected.repeatRate = baseline.repeatRate * (1 + cashbackChange * 0.15 / 100);
    projected.revenue = baseline.revenue * (1 + customerLift * 0.8 / 100);
    projected.profitMargin = baseline.profitMargin * (1 - marginCost / 100);

    changes.push({
      metric: 'customers',
      baseline: baseline.customers,
      projected: projected.customers,
      change: projected.customers - baseline.customers,
      changePercent: customerLift,
      confidence: 0.75,
      explanation: `${customerLift.toFixed(1)}% customer increase from better cashback`,
    });

    changes.push({
      metric: 'repeatRate',
      baseline: baseline.repeatRate * 100,
      projected: projected.repeatRate * 100,
      change: (projected.repeatRate - baseline.repeatRate) * 100,
      changePercent: cashbackChange * 0.15,
      confidence: 0.72,
      explanation: 'Higher cashback improves customer loyalty and repeat visits',
    });
  }

  /**
   * Simulate bundle scenarios
   */
  private simulateBundleScenario(
    scenario: SimulationScenario,
    baseline: SimulationBaseline,
    projected: SimulationProjection,
    changes: MetricChange[],
    risks: string[]
  ) {
    const bundleDiscount = scenario.changes.bundleDiscount || 0;
    const avgItemsPerOrder = scenario.changes.avgItemsPerOrder || 1;

    // Bundles increase AOV but reduce per-item margin
    const aovIncrease = avgItemsPerOrder * (1 - bundleDiscount / 100);
    const orderIncrease = bundleDiscount * 0.5;

    projected.aov = baseline.aov * aovIncrease;
    projected.orders = baseline.orders * (1 + orderIncrease / 100);
    projected.revenue = projected.aov * projected.orders;
    projected.profitMargin = baseline.profitMargin * (1 - bundleDiscount * 0.3 / 100);

    changes.push({
      metric: 'aov',
      baseline: baseline.aov,
      projected: projected.aov,
      change: projected.aov - baseline.aov,
      changePercent: (aovIncrease - 1) * 100,
      confidence: 0.80,
      explanation: `AOV increases as customers buy ${avgItemsPerOrder} items at ${bundleDiscount}% bundle discount`,
    });

    changes.push({
      metric: 'revenue',
      baseline: baseline.revenue,
      projected: projected.revenue,
      change: projected.revenue - baseline.revenue,
      changePercent: (projected.revenue - baseline.revenue) / baseline.revenue * 100,
      confidence: 0.76,
      explanation: `Net revenue impact from ${orderIncrease.toFixed(1)}% more orders at lower per-item margin`,
    });
  }

  /**
   * Simulate staffing changes
   */
  private simulateStaffingScenario(
    scenario: SimulationScenario,
    baseline: SimulationBaseline,
    projected: SimulationProjection,
    changes: MetricChange[],
    warnings: string[]
  ) {
    const staffChange = scenario.changes.staffChange || 0;
    const wageChange = scenario.changes.wageChange || 0;

    // More staff = higher capacity = more orders, but higher costs
    const capacityImpact = staffChange * 0.5;
    const costImpact = staffChange * 0.4 + wageChange * 0.2;

    projected.orders = baseline.orders * (1 + capacityImpact / 100);
    projected.revenue = baseline.revenue * (1 + capacityImpact / 100);
    projected.profitMargin = baseline.profitMargin * (1 - costImpact / 100);

    changes.push({
      metric: 'orders',
      baseline: baseline.orders,
      projected: projected.orders,
      change: projected.orders - baseline.orders,
      changePercent: capacityImpact,
      confidence: 0.70,
      explanation: `${staffChange > 0 ? 'More staff = higher capacity' : 'Fewer staff = capacity constraints'}`,
    });

    changes.push({
      metric: 'profitMargin',
      baseline: baseline.profitMargin * 100,
      projected: projected.profitMargin * 100,
      change: (projected.profitMargin - baseline.profitMargin) * 100,
      changePercent: -costImpact,
      confidence: 0.85,
      explanation: `Wage cost ${wageChange > 0 ? 'increases' : 'decreases'} margin by ${costImpact.toFixed(1)}%`,
    });

    if (staffChange < -10) {
      warnings.push('Significant staff reduction may impact service quality');
      warnings.push('Risk of burnout for remaining staff');
    }
  }

  /**
   * Simulate inventory changes
   */
  private simulateInventoryScenario(
    scenario: SimulationScenario,
    baseline: SimulationBaseline,
    projected: SimulationProjection,
    changes: MetricChange[],
    warnings: string[]
  ) {
    const stockChange = scenario.changes.stockChange || 0;
    const wasteReduction = scenario.changes.wasteReduction || 0;

    const marginImprovement = wasteReduction * 0.2;
    projected.profitMargin = baseline.profitMargin * (1 + marginImprovement / 100);
    projected.revenue = baseline.revenue * (1 + stockChange * 0.1 / 100);

    changes.push({
      metric: 'profitMargin',
      baseline: baseline.profitMargin * 100,
      projected: projected.profitMargin * 100,
      change: (projected.profitMargin - baseline.profitMargin) * 100,
      changePercent: marginImprovement,
      confidence: 0.82,
      explanation: `Margin improves by ${marginImprovement.toFixed(1)}% from ${wasteReduction}% waste reduction`,
    });

    if (stockChange < -20) {
      warnings.push('Significant inventory reduction may risk stockouts');
    }
  }

  /**
   * Generate recommendations based on simulation
   */
  private generateRecommendations(
    scenario: SimulationScenario,
    projected: SimulationProjection,
    baseline: SimulationBaseline
  ): string[] {
    const recommendations: string[] = [];

    if (projected.revenue > baseline.revenue * 1.05) {
      recommendations.push('Revenue uplift looks promising - consider A/B testing before full rollout');
    }

    if (projected.profitMargin < baseline.profitMargin * 0.9) {
      recommendations.push('Margin impact is significant - consider limiting offer duration');
    }

    if (projected.customers > baseline.customers * 1.1) {
      recommendations.push('Strong customer acquisition expected - prepare capacity');
    }

    if (scenario.type === 'offer' && (scenario.changes.discountChange || 0) > 15) {
      recommendations.push('Deep discount - consider tiered offer instead of flat discount');
    }

    if (scenario.type === 'pricing' && (scenario.changes.priceChange || 0) > 10) {
      recommendations.push('Consider gradual price increase to monitor customer response');
    }

    return recommendations;
  }

  /**
   * Run multiple scenarios for comparison
   */
  compareScenarios(merchantId: string, scenarios: SimulationScenario[]): {
    baseline: SimulationBaseline;
    scenarios: Array<{
      scenario: SimulationScenario;
      result: SimulationResult;
    }>;
    recommendation: string;
  } {
    const baseline = getMerchantBaseline(merchantId);
    const results = scenarios.map(s => ({
      scenario: s,
      result: this.simulate({ merchantId, scenario: s, horizon: 'month' }),
    }));

    // Sort by total impact
    results.sort((a, b) => b.result.totalImpact - a.result.totalImpact);

    const recommendation = results[0]
      ? `Best scenario: ${results[0].scenario.description} (${results[0].result.impactPercent > 0 ? '+' : ''}${results[0].result.impactPercent.toFixed(1)}% revenue)`
      : 'No scenarios provided';

    return { baseline, scenarios: results, recommendation };
  }
}

// ================== EXPRESS APP ==================

const app = express();
const engine = new SimulationEngine();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-revenue-ai-simulation-engine',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /api/v1/simulation/run
 * Run a single what-if simulation
 */
app.post('/api/v1/simulation/run', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string;

    const validationResult = SimulationRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request',
          details: validationResult.error.issues,
        },
      });
    }

    const result = engine.simulate(validationResult.data);

    res.json({
      success: true,
      data: result,
      metadata: {
        requestId,
        timestamp: new Date().toISOString(),
        calculationTimeMs: Date.now() - startTime,
      },
    });
  } catch (error) {
    logger.error('Simulation error', { error });
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to run simulation' },
    });
  }
});

/**
 * POST /api/v1/simulation/compare
 * Compare multiple scenarios
 */
app.post('/api/v1/simulation/compare', async (req: Request, res: Response) => {
  try {
    const { merchantId, scenarios } = req.body;

    if (!merchantId || !scenarios || !Array.isArray(scenarios)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Missing merchantId or scenarios' },
      });
    }

    const comparison = engine.compareScenarios(merchantId, scenarios);

    res.json({
      success: true,
      data: comparison,
    });
  } catch (error) {
    logger.error('Comparison error', { error });
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to compare scenarios' },
    });
  }
});

/**
 * GET /api/v1/simulation/templates
 * Get common simulation templates
 */
app.get('/api/v1/simulation/templates', (req: Request, res: Response) => {
  const templates = [
    {
      id: 'price_increase_10',
      name: 'Price Increase 10%',
      description: 'Test impact of 10% price increase',
      scenario: { type: 'pricing', changes: { priceChange: 10 }, description: 'Increase all prices by 10%' },
    },
    {
      id: 'price_decrease_10',
      name: 'Price Decrease 10%',
      description: 'Test impact of 10% price decrease',
      scenario: { type: 'pricing', changes: { priceChange: -10 }, description: 'Decrease all prices by 10%' },
    },
    {
      id: 'discount_15',
      name: '15% Discount Campaign',
      description: 'Test impact of 15% discount offer',
      scenario: { type: 'offer', changes: { discountChange: 15 }, description: '15% discount for 30 days' },
    },
    {
      id: 'cashback_10',
      name: '10% Cashback',
      description: 'Test impact of 10% cashback',
      scenario: { type: 'cashback', changes: { cashbackChange: 10 }, description: '10% cashback on all purchases' },
    },
    {
      id: 'bundle_20',
      name: '20% Bundle Discount',
      description: 'Test impact of bundle deal',
      scenario: { type: 'bundle', changes: { bundleDiscount: 20, avgItemsPerOrder: 2 }, description: 'Buy 2 Get 20% off' },
    },
  ];

  res.json({ success: true, data: templates });
});

const PORT = process.env.PORT || 4308;

app.listen(PORT, () => {
  logger.info('REZ Revenue AI Simulation Engine started', { port: PORT });
});

export default app;
