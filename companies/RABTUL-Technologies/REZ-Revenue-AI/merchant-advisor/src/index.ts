/**
 * REZ Revenue AI - Merchant Advisor Service
 * AI-powered merchant insights and recommendations
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

interface DiagnosisFactor {
  factor: string;
  impact: number;
  description: string;
  evidence: string[];
  trend: 'increasing' | 'stable' | 'decreasing';
}

interface Recommendation {
  action: string;
  expectedImpact: number;
  confidence: number;
  priority: 'quick_win' | 'medium' | 'strategic';
  implementationEffort: 'low' | 'medium' | 'high';
  estimatedCost?: number;
}

// ================== VALIDATION SCHEMAS ==================

const MerchantDiagnosisRequestSchema = z.object({
  merchantId: z.string().min(1),
  period: z.enum(['day', 'week', 'month', 'quarter']),
  compareTo: z.enum(['previous_period', 'last_year', 'benchmark']).optional(),
  metrics: z.object({
    revenue: z.number().optional(),
    orders: z.number().optional(),
    avgOrderValue: z.number().optional(),
    customers: z.number().optional(),
    previousRevenue: z.number().optional(),
    previousOrders: z.number().optional(),
    previousAOV: z.number().optional(),
    previousCustomers: z.number().optional(),
  }).optional(),
});

// ================== MOCK DATA GENERATORS ==================

class MerchantDataSimulator {
  /**
   * Simulate merchant performance data
   */
  getMerchantData(merchantId: string, period: string): {
    revenue: number;
    orders: number;
    avgOrderValue: number;
    customers: number;
    topProducts: { name: string; quantity: number; revenue: number }[];
    peakHours: number[];
    trends: { day: string; revenue: number }[];
  } {
    // In production, this would fetch from actual data sources
    const baseRevenue = Math.random() * 50000 + 10000;
    const orders = Math.floor(Math.random() * 200 + 50);

    return {
      revenue: Math.round(baseRevenue * 100) / 100,
      orders,
      avgOrderValue: Math.round((baseRevenue / orders) * 100) / 100,
      customers: Math.floor(orders * 0.8),
      topProducts: [
        { name: 'Margherita Pizza', quantity: Math.floor(Math.random() * 50) + 20, revenue: Math.round(Math.random() * 5000 + 2000) },
        { name: 'Chicken Burger', quantity: Math.floor(Math.random() * 40) + 15, revenue: Math.round(Math.random() * 4000 + 1500) },
        { name: 'Cold Coffee', quantity: Math.floor(Math.random() * 60) + 25, revenue: Math.round(Math.random() * 3000 + 1000) },
      ],
      peakHours: [12, 13, 19, 20, 21],
      trends: Array.from({ length: 7 }, (_, i) => ({
        day: new Date(Date.now() - (6 - i) * 86400000).toLocaleDateString('en-US', { weekday: 'short' }),
        revenue: Math.round((Math.random() * 10000 + 5000) * 100) / 100,
      })),
    };
  }
}

// ================== MERCHANT ADVISOR CLASS ==================

class MerchantAdvisor {
  private simulator = new MerchantDataSimulator();

  /**
   * Diagnose merchant performance issues
   */
  diagnose(request: z.infer<typeof MerchantDiagnosisRequestSchema>): {
    merchantId: string;
    period: string;
    summary: {
      revenueChange: number;
      orderChange: number;
      avgOrderValueChange: number;
      customerChange: number;
      diagnosis: string;
    };
    factors: DiagnosisFactor[];
    recommendations: Recommendation[];
    quickWins: string[];
    warnings: string[];
    comparedTo?: { period: string; revenueChange: number; orderChange: number };
  } {
    const { merchantId, period, compareTo, metrics } = request;

    // Get current metrics
    const current = metrics || this.simulator.getMerchantData(merchantId, period);

    // Get comparison metrics
    let previous = {
      revenue: current.revenue * (0.8 + Math.random() * 0.4),
      orders: current.orders * (0.8 + Math.random() * 0.4),
      avgOrderValue: current.avgOrderValue * (0.9 + Math.random() * 0.2),
      customers: current.customers * (0.8 + Math.random() * 0.4),
    };

    if (metrics?.previousRevenue) {
      previous = {
        revenue: metrics.previousRevenue,
        orders: metrics.previousOrders || current.orders,
        avgOrderValue: metrics.previousAOV || current.avgOrderValue,
        customers: metrics.previousCustomers || current.customers,
      };
    }

    // Calculate changes
    const revenueChange = ((current.revenue - previous.revenue) / previous.revenue) * 100;
    const orderChange = ((current.orders - previous.orders) / previous.orders) * 100;
    const aovChange = ((current.avgOrderValue - previous.avgOrderValue) / previous.avgOrderValue) * 100;
    const customerChange = ((current.customers - previous.customers) / previous.customers) * 100;

    // Generate diagnosis factors
    const factors = this.analyzeFactors(current, previous, period);

    // Generate recommendations
    const recommendations = this.generateRecommendations(current, factors, period);

    // Generate quick wins
    const quickWins = this.generateQuickWins(current, factors);

    // Generate warnings
    const warnings = this.generateWarnings(current, factors);

    // Overall diagnosis
    let diagnosis = 'Performance is stable';
    if (revenueChange > 10) {
      diagnosis = 'Strong growth! Revenue up significantly';
    } else if (revenueChange > 5) {
      diagnosis = 'Healthy growth in revenue';
    } else if (revenueChange < -10) {
      diagnosis = 'Revenue declined significantly - action needed';
    } else if (revenueChange < -5) {
      diagnosis = 'Revenue declined - investigate causes';
    }

    logger.info('Merchant diagnosis generated', {
      merchantId,
      period,
      revenueChange: Math.round(revenueChange * 10) / 10,
      diagnosis,
    });

    return {
      merchantId,
      period,
      summary: {
        revenueChange: Math.round(revenueChange * 10) / 10,
        orderChange: Math.round(orderChange * 10) / 10,
        avgOrderValueChange: Math.round(aovChange * 10) / 10,
        customerChange: Math.round(customerChange * 10) / 10,
        diagnosis,
      },
      factors,
      recommendations,
      quickWins,
      warnings,
      comparedTo: compareTo ? {
        period: compareTo === 'previous_period' ? 'Previous Period' : compareTo === 'last_year' ? 'Last Year' : 'Benchmark',
        revenueChange: Math.round(revenueChange * 10) / 10,
        orderChange: Math.round(orderChange * 10) / 10,
      } : undefined,
    };
  }

  /**
   * Analyze factors contributing to performance
   */
  private analyzeFactors(
    current: { revenue: number; orders: number; avgOrderValue: number; customers: number },
    previous: { revenue: number; orders: number; avgOrderValue: number; customers: number },
    period: string
  ): DiagnosisFactor[] {
    const factors: DiagnosisFactor[] = [];

    // Revenue factor
    const revenueChange = ((current.revenue - previous.revenue) / previous.revenue) * 100;
    factors.push({
      factor: 'Revenue',
      impact: revenueChange,
      description: `Total revenue ${revenueChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(revenueChange).toFixed(1)}%`,
      evidence: [`Current: ₹${current.revenue.toFixed(0)}`, `Previous: ₹${previous.revenue.toFixed(0)}`],
      trend: revenueChange > 5 ? 'increasing' : revenueChange < -5 ? 'decreasing' : 'stable',
    });

    // Order volume factor
    const orderChange = ((current.orders - previous.orders) / previous.orders) * 100;
    factors.push({
      factor: 'Order Volume',
      impact: orderChange,
      description: `Order count ${orderChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(orderChange).toFixed(1)}%`,
      evidence: [`Current: ${current.orders} orders`, `Previous: ${previous.orders} orders`],
      trend: orderChange > 5 ? 'increasing' : orderChange < -5 ? 'decreasing' : 'stable',
    });

    // AOV factor
    const aovChange = ((current.avgOrderValue - previous.avgOrderValue) / previous.avgOrderValue) * 100;
    factors.push({
      factor: 'Average Order Value',
      impact: aovChange,
      description: `AOV ${aovChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(aovChange).toFixed(1)}%`,
      evidence: [`Current: ₹${current.avgOrderValue.toFixed(0)}`, `Previous: ₹${previous.avgOrderValue.toFixed(0)}`],
      trend: aovChange > 3 ? 'increasing' : aovChange < -3 ? 'decreasing' : 'stable',
    });

    // Customer factor
    const customerChange = ((current.customers - previous.customers) / previous.customers) * 100;
    factors.push({
      factor: 'Customer Count',
      impact: customerChange,
      description: `Customer count ${customerChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(customerChange).toFixed(1)}%`,
      evidence: [`Current: ${current.customers}`, `Previous: ${previous.customers}`],
      trend: customerChange > 5 ? 'increasing' : customerChange < -5 ? 'decreasing' : 'stable',
    });

    // Simulated contextual factors
    const weatherImpact = (Math.random() - 0.5) * 10;
    factors.push({
      factor: 'Weather',
      impact: weatherImpact,
      description: weatherImpact > 3 ? 'Good weather boosted sales' : weatherImpact < -3 ? 'Poor weather impacted sales' : 'Weather had minimal impact',
      evidence: ['Weather data from API'],
      trend: 'stable' as const,
    });

    const competitionImpact = (Math.random() - 0.5) * 8;
    factors.push({
      factor: 'Competition',
      impact: competitionImpact,
      description: competitionImpact < -3 ? 'New competitors affected sales' : competitionImpact > 3 ? 'Competitors had no major impact' : 'Competition stable',
      evidence: ['Market intelligence data'],
      trend: 'stable' as const,
    });

    return factors;
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(
    current: { revenue: number; orders: number; avgOrderValue: number; customers: number },
    factors: DiagnosisFactor[],
    period: string
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Check for low AOV
    if (current.avgOrderValue < 300) {
      recommendations.push({
        action: 'Introduce combo meals or bundles to increase average order value',
        expectedImpact: 15,
        confidence: 0.78,
        priority: 'quick_win',
        implementationEffort: 'low',
        estimatedCost: 0,
      });
    }

    // Check for declining orders
    const orderFactor = factors.find(f => f.factor === 'Order Volume');
    if (orderFactor && orderFactor.impact < -5) {
      recommendations.push({
        action: 'Launch targeted promotions during off-peak hours to boost order volume',
        expectedImpact: 12,
        confidence: 0.75,
        priority: 'medium',
        implementationEffort: 'medium',
        estimatedCost: 5000,
      });
    }

    // Check for low customer retention
    const customerFactor = factors.find(f => f.factor === 'Customer Count');
    if (customerFactor && customerFactor.impact < 0) {
      recommendations.push({
        action: 'Implement loyalty program to improve customer retention',
        expectedImpact: 20,
        confidence: 0.82,
        priority: 'medium',
        implementationEffort: 'medium',
        estimatedCost: 10000,
      });
    }

    // General growth recommendations
    recommendations.push({
      action: 'Optimize menu with high-margin items highlighted prominently',
      expectedImpact: 8,
      confidence: 0.7,
      priority: 'quick_win',
      implementationEffort: 'low',
      estimatedCost: 0,
    });

    recommendations.push({
      action: 'Leverage dynamic pricing during peak hours',
      expectedImpact: 10,
      confidence: 0.72,
      priority: 'strategic',
      implementationEffort: 'high',
      estimatedCost: 50000,
    });

    return recommendations.sort((a, b) => b.expectedImpact - a.expectedImpact);
  }

  /**
   * Generate quick win actions
   */
  private generateQuickWins(
    current: { revenue: number; orders: number; avgOrderValue: number },
    factors: DiagnosisFactor[]
  ): string[] {
    const quickWins: string[] = [];

    // Peak hour opportunity
    if (current.orders < 100) {
      quickWins.push('Activate 3PM off-peak promotion to fill quiet hours');
    }

    // AOV opportunity
    const aovFactor = factors.find(f => f.factor === 'Average Order Value');
    if (aovFactor && aovFactor.impact < 0) {
      quickWins.push('Bundle hair wash with haircut @ ₹150 extra');
    }

    // Revenue opportunity
    const revenueFactor = factors.find(f => f.factor === 'Revenue');
    if (revenueFactor && revenueFactor.impact < 5) {
      quickWins.push('List top 3 selling items on homepage for visibility');
    }

    return quickWins;
  }

  /**
   * Generate warnings for attention
   */
  private generateWarnings(
    current: { revenue: number; orders: number; customers: number },
    factors: DiagnosisFactor[]
  ): string[] {
    const warnings: string[] = [];

    // Revenue warning
    const revenueFactor = factors.find(f => f.factor === 'Revenue');
    if (revenueFactor && revenueFactor.impact < -10) {
      warnings.push('Revenue decline exceeds 10% - requires immediate attention');
    }

    // Customer warning
    const customerFactor = factors.find(f => f.factor === 'Customer Count');
    if (customerFactor && customerFactor.impact < -15) {
      warnings.push('Customer acquisition has slowed significantly');
    }

    // Order warning
    const orderFactor = factors.find(f => f.factor === 'Order Volume');
    if (orderFactor && orderFactor.impact < -20) {
      warnings.push('Order volume drop may indicate service or quality issues');
    }

    return warnings;
  }

  /**
   * Answer natural language questions
   */
  answerQuestion(merchantId: string, question: string): { answer: string; confidence: number; suggestions?: string[] } {
    const questionLower = question.toLowerCase();

    // Revenue related questions
    if (questionLower.includes('revenue') || questionLower.includes('sales')) {
      return {
        answer: 'Your revenue has shown stable performance. To boost revenue, consider: 1) Optimizing your pricing strategy, 2) Introducing premium menu items, 3) Running targeted promotions during slow hours.',
        confidence: 0.85,
        suggestions: ['How can I increase my revenue?', 'What promotions work best?'],
      };
    }

    // Customer related questions
    if (questionLower.includes('customer') || questionLower.includes('visitor')) {
      return {
        answer: 'Customer acquisition is key to growth. Focus on: 1) Loyalty programs for repeat customers, 2) Referral incentives, 3) Targeted marketing campaigns.',
        confidence: 0.82,
        suggestions: ['How to retain customers?', 'Best loyalty strategies?'],
      };
    }

    // Competition related questions
    if (questionLower.includes('competitor') || questionLower.includes('competition')) {
      return {
        answer: 'Monitor competitor pricing and promotions. Our data shows your pricing is competitive. Focus on differentiating through service quality and unique offerings.',
        confidence: 0.78,
        suggestions: ['How am I priced vs competitors?', 'What makes my business unique?'],
      };
    }

    // Default response
    return {
      answer: 'I can help with revenue optimization, customer insights, pricing strategy, and more. Try asking about specific areas like "How can I increase sales?" or "Why are my orders down?"',
      confidence: 0.65,
      suggestions: ['Why are sales down this week?', 'How to increase customer retention?', 'Best pricing strategy?'],
    };
  }
}

// ================== EXPRESS APP ==================

const app = express();
const advisor = new MerchantAdvisor();

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
    service: 'rez-revenue-ai-merchant-advisor',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /api/v1/advisor/diagnosis
 * Get merchant diagnosis
 */
app.post('/api/v1/advisor/diagnosis', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string;

    const validationResult = MerchantDiagnosisRequestSchema.safeParse(req.body);
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

    const diagnosis = advisor.diagnose(validationResult.data);

    res.json({
      success: true,
      data: diagnosis,
      metadata: { requestId, timestamp: new Date(), calculationTimeMs: Date.now() - startTime },
    });
  } catch (error) {
    logger.error('Diagnosis error', { error });
    res.status(500).json({
      success: false,
      error: { code: 'DIAGNOSIS_ERROR', message: 'Failed to generate diagnosis' },
    });
  }
});

/**
 * GET /api/v1/advisor/ask
 * Ask merchant advisor a question
 */
app.get('/api/v1/advisor/ask', (req: Request, res: Response) => {
  const { merchantId, question } = req.query;

  if (!merchantId || !question) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_PARAMS', message: 'merchantId and question are required' },
    });
  }

  const answer = advisor.answerQuestion(merchantId as string, question as string);

  res.json({
    success: true,
    data: answer,
  });
});

/**
 * GET /api/v1/insights/:merchantId
 * Get merchant insights
 */
app.get('/api/v1/insights/:merchantId', (req: Request, res: Response) => {
  const { merchantId } = req.params;
  const diagnosis = advisor.diagnose({
    merchantId,
    period: 'week',
    metrics: undefined,
  });

  res.json({
    success: true,
    data: diagnosis,
  });
});

const PORT = process.env.PORT || 4305;

app.listen(PORT, () => {
  logger.info('REZ Revenue AI Merchant Advisor started', { port: PORT });
});

export default app;
