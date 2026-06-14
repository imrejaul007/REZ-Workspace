/**
 * REZ Revenue AI - Merchant Benchmark Score
 * Gamified benchmarking against category peers
 *
 * Every merchant gets: Revenue Score: 82/100
 * Breakdown: Pricing 90 | Retention 75 | Repeat 60 | Offers 85
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

interface MetricScore {
  metric: string;
  weight: number;
  score: number;
  weightedScore: number;
  categoryRank: string;
  trend: 'improving' | 'stable' | 'declining';
  benchmark: number;
  gap: number;
  description: string;
}

interface BenchmarkScore {
  merchantId: string;
  vertical: string;
  category: string;
  overallScore: number;
  percentile: string;
  letterGrade: string;
  breakdown: MetricScore[];
  trends: {
    weekly: number;
    monthly: number;
    quarterly: number;
  };
  comparedTo: {
    cityAverage: number;
    verticalAverage: number;
    topPerformer: number;
  };
  improvements: {
    metric: string;
    action: string;
    potentialGain: number;
    effort: 'low' | 'medium' | 'high';
  }[];
  nextMilestone: {
    target: number;
    title: string;
    actions: string[];
    estimatedTime: string;
  };
  generatedAt: string;
}

// ================== VALIDATION SCHEMAS ==================

const BenchmarkRequestSchema = z.object({
  merchantId: z.string().min(1),
  vertical: z.string().optional(),
  category: z.string().optional(),
});

// ================== MOCK DATA GENERATORS ==================

const getMerchantMetrics = (merchantId: string): Record<string, number> => {
  // Mock data - in production, this would query analytics
  return {
    // Pricing metrics
    pricingEfficiency: 70 + Math.random() * 25,
    priceOptimized: 65 + Math.random() * 30,
    surgeUtilization: 50 + Math.random() * 40,
    competitivePosition: 60 + Math.random() * 30,

    // Retention metrics
    customerRetention: 55 + Math.random() * 35,
    churnRate: 15 + Math.random() * 20,
    reactivationRate: 30 + Math.random() * 40,
    nps: 40 + Math.random() * 40,

    // Repeat metrics
    repeatVisits: 45 + Math.random() * 40,
    avgVisitsPerMonth: 2 + Math.random() * 3,
    visitFrequency: 50 + Math.random() * 40,
    cohortRetention: 40 + Math.random() * 40,

    // Offer metrics
    offerROI: 60 + Math.random() * 35,
    offerConversion: 55 + Math.random() * 35,
    offerEfficiency: 65 + Math.random() * 30,
    cashbackUtilization: 50 + Math.random() * 40,

    // Demand metrics
    demandUtilization: 55 + Math.random() * 35,
    peakHourUtilization: 50 + Math.random() * 40,
    offPeakUtilization: 40 + Math.random() * 40,
    capacityUtilization: 60 + Math.random() * 30,

    // Revenue metrics
    revenueGrowth: 5 + Math.random() * 25,
    aovGrowth: 3 + Math.random() * 15,
    revenuePerCustomer: 50 + Math.random() * 45,
    marginOptimization: 55 + Math.random() * 35,
  };
};

const getVerticalBenchmarks = (vertical: string): Record<string, { avg: number; top: number; cityAvg: number }> => {
  // Mock benchmarks
  const base = {
    pricingEfficiency: { avg: 72, top: 88, cityAvg: 68 },
    customerRetention: { avg: 62, top: 82, cityAvg: 58 },
    repeatVisits: { avg: 58, top: 78, cityAvg: 52 },
    offerROI: { avg: 68, top: 85, cityAvg: 62 },
    demandUtilization: { avg: 65, top: 82, cityAvg: 60 },
    revenueGrowth: { avg: 12, top: 28, cityAvg: 10 },
  };
  return base;
};

// ================== BENCHMARK SCORE CLASS ==================

class BenchmarkScore {
  /**
   * Calculate comprehensive benchmark score
   */
  calculate(request: z.infer<typeof BenchmarkRequestSchema>): BenchmarkScore {
    const metrics = getMerchantMetrics(request.merchantId);
    const benchmarks = getVerticalBenchmarks(request.vertical || 'restaurant');

    // Define metric weights
    const metricWeights = [
      { metric: 'pricingEfficiency', name: 'Pricing Efficiency', weight: 0.20 },
      { metric: 'customerRetention', name: 'Customer Retention', weight: 0.18 },
      { metric: 'repeatVisits', name: 'Repeat Visits', weight: 0.15 },
      { metric: 'offerROI', name: 'Offer Efficiency', weight: 0.15 },
      { metric: 'demandUtilization', name: 'Demand Utilization', weight: 0.15 },
      { metric: 'revenueGrowth', name: 'Revenue Growth', weight: 0.17 },
    ];

    const breakdown: MetricScore[] = [];
    let totalWeightedScore = 0;

    for (const { metric, name, weight } of metricWeights) {
      const score = metrics[metric] || 50;
      const benchmark = benchmarks[metric] || { avg: 65, top: 85, cityAvg: 60 };
      const gap = score - benchmark.avg;

      // Determine trend (mock - would use historical data)
      const trend = gap > 5 ? 'improving' : gap < -5 ? 'declining' : 'stable';

      // Determine category rank
      let categoryRank = 'Average';
      if (score >= benchmark.top) categoryRank = 'Top 10%';
      else if (score >= benchmark.avg + 10) categoryRank = 'Top 25%';
      else if (score >= benchmark.avg) categoryRank = 'Above Average';
      else if (score >= benchmark.avg - 10) categoryRank = 'Below Average';
      else categoryRank = 'Bottom 25%';

      const metricScore: MetricScore = {
        metric: name,
        weight,
        score,
        weightedScore: score * weight,
        categoryRank,
        trend,
        benchmark: benchmark.avg,
        gap,
        description: this.getMetricDescription(metric, score, benchmark),
      };

      breakdown.push(metricScore);
      totalWeightedScore += metricScore.weightedScore;
    }

    // Calculate overall score
    const overallScore = Math.round(totalWeightedScore);

    // Determine percentile
    const percentile = this.getPercentile(overallScore);

    // Get letter grade
    const letterGrade = this.getLetterGrade(overallScore);

    // Generate improvements
    const improvements = this.generateImprovements(breakdown, benchmarks);

    // Calculate next milestone
    const nextMilestone = this.getNextMilestone(overallScore);

    // Mock trends
    const trends = {
      weekly: overallScore + (Math.random() * 4 - 2),
      monthly: overallScore + (Math.random() * 10 - 5),
      quarterly: overallScore + (Math.random() * 15 - 7),
    };

    // Compared to benchmarks
    const comparedTo = {
      cityAverage: overallScore + (Math.random() * 10 - 8),
      verticalAverage: overallScore + (Math.random() * 15 - 10),
      topPerformer: overallScore - 15 - Math.random() * 10,
    };

    const score: BenchmarkScore = {
      merchantId: request.merchantId,
      vertical: request.vertical || 'restaurant',
      category: request.category || 'general',
      overallScore,
      percentile,
      letterGrade,
      breakdown,
      trends,
      comparedTo,
      improvements,
      nextMilestone,
      generatedAt: new Date().toISOString(),
    };

    logger.info('Benchmark score calculated', {
      merchantId: request.merchantId,
      overallScore,
      percentile,
      letterGrade,
    });

    return score;
  }

  /**
   * Get metric description
   */
  private getMetricDescription(metric: string, score: number, benchmark: { avg: number; top: number }): string {
    if (score >= benchmark.top) {
      return 'Excellent performance - among top performers';
    }
    if (score >= benchmark.avg + 10) {
      return 'Strong performance - above average';
    }
    if (score >= benchmark.avg) {
      return 'Good performance - room for improvement';
    }
    if (score >= benchmark.avg - 10) {
      return 'Below average - significant improvement opportunity';
    }
    return 'Needs attention - major improvement needed';
  }

  /**
   * Get percentile ranking
   */
  private getPercentile(score: number): string {
    if (score >= 90) return 'Top 5%';
    if (score >= 82) return 'Top 10%';
    if (score >= 75) return 'Top 25%';
    if (score >= 68) return 'Top 50%';
    if (score >= 60) return 'Top 75%';
    return 'Bottom 25%';
  }

  /**
   * Get letter grade
   */
  private getLetterGrade(score: number): string {
    if (score >= 90) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 80) return 'A-';
    if (score >= 75) return 'B+';
    if (score >= 70) return 'B';
    if (score >= 65) return 'B-';
    if (score >= 60) return 'C+';
    if (score >= 55) return 'C';
    if (score >= 50) return 'C-';
    return 'D';
  }

  /**
   * Generate improvement suggestions
   */
  private generateImprovements(
    breakdown: MetricScore[],
    benchmarks: Record<string, { avg: number }>
  ): { metric: string; action: string; potentialGain: number; effort: 'low' | 'medium' | 'high' }[] {
    const improvements: { metric: string; action: string; potentialGain: number; effort: 'low' | 'medium' | 'high' }[] = [];

    for (const metric of breakdown) {
      if (metric.gap < -10) {
        // Find specific improvement actions
        switch (metric.metric) {
          case 'Pricing Efficiency':
            improvements.push({
              metric: 'Pricing',
              action: 'Implement dynamic pricing during peak hours',
              potentialGain: Math.abs(metric.gap) * 0.8,
              effort: 'medium',
            });
            break;
          case 'Customer Retention':
            improvements.push({
              metric: 'Retention',
              action: 'Launch loyalty program with tiered rewards',
              potentialGain: Math.abs(metric.gap) * 0.6,
              effort: 'medium',
            });
            break;
          case 'Repeat Visits':
            improvements.push({
              metric: 'Frequency',
              action: 'Send personalized visit reminders based on history',
              potentialGain: Math.abs(metric.gap) * 0.5,
              effort: 'low',
            });
            break;
          case 'Offer Efficiency':
            improvements.push({
              metric: 'Offers',
              action: 'A/B test different offer types to find best ROI',
              potentialGain: Math.abs(metric.gap) * 0.7,
              effort: 'low',
            });
            break;
          case 'Demand Utilization':
            improvements.push({
              metric: 'Demand',
              action: 'Run off-peak promotions to fill slow hours',
              potentialGain: Math.abs(metric.gap) * 0.6,
              effort: 'low',
            });
            break;
          case 'Revenue Growth':
            improvements.push({
              metric: 'Growth',
              action: 'Focus on upselling and cross-selling existing customers',
              potentialGain: Math.abs(metric.gap) * 0.5,
              effort: 'medium',
            });
            break;
        }
      }
    }

    return improvements.sort((a, b) => b.potentialGain - a.potentialGain).slice(0, 5);
  }

  /**
   * Get next milestone
   */
  private getNextMilestone(currentScore: number): {
    target: number;
    title: string;
    actions: string[];
    estimatedTime: string;
  } {
    if (currentScore < 60) {
      return {
        target: 65,
        title: 'Reach C+ Grade',
        actions: [
          'Focus on the lowest-scoring metric',
          'Implement one quick-win improvement',
          'Review benchmark weekly',
        ],
        estimatedTime: '2-4 weeks',
      };
    }
    if (currentScore < 75) {
      return {
        target: 80,
        title: 'Reach B Grade',
        actions: [
          'Close gaps on 2-3 metrics',
          'Implement dynamic pricing',
          'Launch basic loyalty program',
        ],
        estimatedTime: '1-2 months',
      };
    }
    if (currentScore < 85) {
      return {
        target: 90,
        title: 'Reach A Grade',
        actions: [
          'Optimize all pricing scenarios',
          'Implement advanced retention strategies',
          'Launch comprehensive offers program',
        ],
        estimatedTime: '2-3 months',
      };
    }
    return {
      target: 100,
      title: 'Achieve Top Performer Status',
      actions: [
        'Fine-tune all metrics',
        'Implement autonomous optimization',
        'Share best practices with peers',
      ],
      estimatedTime: 'Ongoing',
    };
  }

  /**
   * Get category leaderboard
   */
  getLeaderboard(vertical: string, limit: number = 10): {
    vertical: string;
    leaders: { rank: number; merchantId: string; score: number; grade: string }[];
    yourRank?: { rank: number; score: number; percentile: string };
  } {
    // Mock leaderboard
    const leaders = Array.from({ length: limit }, (_, i) => ({
      rank: i + 1,
      merchantId: `merchant_${i + 1}`,
      score: 95 - i * 2 + Math.random() * 3,
      grade: i < 3 ? 'A+' : i < 7 ? 'A' : 'A-',
    }));

    return {
      vertical,
      leaders,
      yourRank: {
        rank: Math.floor(Math.random() * 50) + 1,
        score: 75 + Math.random() * 15,
        percentile: 'Top 40%',
      },
    };
  }
}

// ================== EXPRESS APP ==================

const app = express();
const benchmark = new BenchmarkScore();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-revenue-ai-benchmark-score',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/v1/benchmarks/:merchantId
 * Get comprehensive benchmark score
 */
app.get('/api/v1/benchmarks/:merchantId', async (req: Request, res: Response) => {
  try {
    const requestId = req.headers['x-request-id'] as string;
    const { merchantId } = req.params;
    const { vertical, category } = req.query;

    const result = benchmark.calculate({
      merchantId,
      vertical: vertical as string,
      category: category as string,
    });

    res.json({
      success: true,
      data: result,
      metadata: { requestId, timestamp: new Date().toISOString() },
    });
  } catch (error) {
    logger.error('Benchmark error', { error });
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to calculate benchmark' },
    });
  }
});

/**
 * GET /api/v1/benchmarks/:merchantId/summary
 * Get lightweight benchmark summary
 */
app.get('/api/v1/benchmarks/:merchantId/summary', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const result = benchmark.calculate({ merchantId });

    res.json({
      success: true,
      data: {
        merchantId,
        overallScore: result.overallScore,
        percentile: result.percentile,
        letterGrade: result.letterGrade,
        trend: result.trends.weekly > result.overallScore ? 'improving' : 'declining',
        topMetric: result.breakdown.reduce((a, b) => a.score > b.score ? a : b).metric,
        metricToImprove: result.breakdown.reduce((a, b) => a.gap < b.gap ? a : b).metric,
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
 * GET /api/v1/leaderboard/:vertical
 * Get category leaderboard
 */
app.get('/api/v1/leaderboard/:vertical', async (req: Request, res: Response) => {
  try {
    const { vertical } = req.params;
    const { limit = '10' } = req.query;

    const result = benchmark.getLeaderboard(vertical, parseInt(limit as string, 10));

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to get leaderboard' },
    });
  }
});

/**
 * GET /api/v1/benchmarks/:merchantId/history
 * Get score history
 */
app.get('/api/v1/benchmarks/:merchantId/history', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;

    // Mock historical data
    const history = Array.from({ length: 12 }, (_, i) => ({
      date: new Date(Date.now() - (11 - i) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      score: 60 + i * 2 + Math.random() * 5,
    }));

    res.json({
      success: true,
      data: {
        merchantId,
        history,
        trend: history[history.length - 1].score > history[0].score ? 'improving' : 'stable',
        change: history[history.length - 1].score - history[0].score,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'ERROR', message: 'Failed to get history' },
    });
  }
});

const PORT = process.env.PORT || 4309;

app.listen(PORT, () => {
  logger.info('REZ Revenue AI Benchmark Score started', { port: PORT });
});

export default app;
