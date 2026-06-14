/**
 * BIZORA Trust Score Service
 * "SMB Credit Infrastructure"
 * Based on: payment behavior, compliance, delivery, response, satisfaction, stability
 */

import express, { Request, Response } from 'express';

const app = express();
app.use(express.json());

// ============================================================================
// Types
// ============================================================================

interface TrustScore {
  businessId: string;
  overall: number;
  letterGrade: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'C' | 'D';
  breakdown: {
    paymentBehavior: number;
    complianceHistory: number;
    deliveryQuality: number;
    responseTime: number;
    customerSatisfaction: number;
    operationalStability: number;
  };
  factors: Factor[];
  history: ScoreHistory[];
  benchmarks: BenchmarkComparison;
  creditInsights: CreditInsight[];
  updatedAt: string;
}

interface Factor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  change: number;
  description: string;
}

interface ScoreHistory {
  date: string;
  overall: number;
  paymentBehavior: number;
}

interface BenchmarkComparison {
  industry: string;
  industryAverage: number;
  cityAverage: number;
  percentile: number;
  betterThan: string;
}

interface CreditInsight {
  type: 'strength' | 'opportunity' | 'risk';
  title: string;
  description: string;
  action?: string;
}

// Credit products
interface CreditProduct {
  productId: string;
  name: string;
  type: 'working_capital' | 'invoice_financing' | 'payroll_advance' | 'vendor_credit' | 'bnpl';
  eligibility: {
    minScore: number;
    minMonths: number;
    minRevenue: number;
  };
  limits: {
    min: number;
    max: number;
  };
  rates: {
    processing: number;
    monthly: number;
  };
}

// ============================================================================
// Sample Data
// ============================================================================

const scores: Map<string, TrustScore> = new Map([
  ['b1', {
    businessId: 'b1',
    overall: 85,
    letterGrade: 'AA',
    breakdown: {
      paymentBehavior: 92,
      complianceHistory: 95,
      deliveryQuality: 88,
      responseTime: 80,
      customerSatisfaction: 85,
      operationalStability: 82,
    },
    factors: [
      { name: 'On-time payments (12 months)', impact: 'positive', change: 5, description: 'Maintained 100% on-time payment record' },
      { name: 'GST filed on time (24 months)', impact: 'positive', change: 3, description: 'Perfect compliance streak' },
      { name: 'Customer reviews (4.5/5)', impact: 'positive', change: 2, description: 'Strong customer satisfaction' },
      { name: 'Delivery delays (3 incidents)', impact: 'negative', change: -2, description: 'Had 3 late deliveries this quarter' },
    ],
    history: [
      { date: '2026-05', overall: 85, paymentBehavior: 92 },
      { date: '2026-04', overall: 83, paymentBehavior: 90 },
      { date: '2026-03', overall: 82, paymentBehavior: 88 },
      { date: '2026-02', overall: 80, paymentBehavior: 85 },
    ],
    benchmarks: {
      industry: 'restaurant',
      industryAverage: 72,
      cityAverage: 75,
      percentile: 85,
      betterThan: '85% of restaurants',
    },
    creditInsights: [
      { type: 'strength', title: 'Excellent Payer', description: 'Never missed a payment in 12 months', action: 'Unlock ₹5L working capital' },
      { type: 'opportunity', title: 'Growth Ready', description: 'Showing consistent growth trajectory', action: 'Consider expansion financing' },
      { type: 'strength', title: 'Compliance Champion', description: '24 months of perfect GST filings' },
    ],
    updatedAt: '2026-05-24',
  }],
  ['b2', {
    businessId: 'b2',
    overall: 92,
    letterGrade: 'AAA',
    breakdown: {
      paymentBehavior: 96,
      complianceHistory: 98,
      deliveryQuality: 94,
      responseTime: 90,
      customerSatisfaction: 92,
      operationalStability: 95,
    },
    factors: [],
    history: [],
    benchmarks: {
      industry: 'food_distribution',
      industryAverage: 78,
      cityAverage: 80,
      percentile: 95,
      betterThan: '95% of distributors',
    },
    creditInsights: [
      { type: 'strength', title: 'Top Performer', description: 'AAA rated business' },
      { type: 'opportunity', title: 'Premium Credit Available', description: 'Up to ₹50L working capital at 1.2% monthly' },
    ],
    updatedAt: '2026-05-24',
  }],
]);

// Credit products
const creditProducts: CreditProduct[] = [
  {
    productId: 'wc_001',
    name: 'Working Capital Loan',
    type: 'working_capital',
    eligibility: { minScore: 70, minMonths: 6, minRevenue: 500000 },
    limits: { min: 50000, max: 5000000 },
    rates: { processing: 2, monthly: 1.5 },
  },
  {
    productId: 'if_001',
    name: 'Invoice Financing',
    type: 'invoice_financing',
    eligibility: { minScore: 65, minMonths: 3, minRevenue: 300000 },
    limits: { min: 25000, max: 2000000 },
    rates: { processing: 1, monthly: 1.2 },
  },
  {
    productId: 'pa_001',
    name: 'Payroll Advance',
    type: 'payroll_advance',
    eligibility: { minScore: 75, minMonths: 6, minRevenue: 1000000 },
    limits: { min: 100000, max: 5000000 },
    rates: { processing: 1.5, monthly: 1.0 },
  },
  {
    productId: 'vc_001',
    name: 'Vendor Credit',
    type: 'vendor_credit',
    eligibility: { minScore: 70, minMonths: 6, minRevenue: 500000 },
    limits: { min: 50000, max: 1000000 },
    rates: { processing: 1, monthly: 1.3 },
  },
  {
    productId: 'bnpl_001',
    name: 'BNPL for Customers',
    type: 'bnpl',
    eligibility: { minScore: 75, minMonths: 6, minRevenue: 1000000 },
    limits: { min: 100000, max: 10000000 },
    rates: { processing: 2, monthly: 1.5 },
  },
];

// ============================================================================
// API Routes
// ============================================================================

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'trust-score',
    businessesScored: scores.size,
  });
});

// Get trust score
app.get('/api/scores/:businessId', (req: Request, res: Response) => {
  let score = scores.get(req.params.businessId);

  if (!score) {
    // Generate mock score
    const overall = 60 + Math.random() * 35;
    score = {
      businessId: req.params.businessId,
      overall: Math.round(overall),
      letterGrade: overall >= 90 ? 'AAA' : overall >= 80 ? 'AA' : overall >= 70 ? 'A' : overall >= 60 ? 'BBB' : 'BB',
      breakdown: {
        paymentBehavior: 60 + Math.random() * 35,
        complianceHistory: 65 + Math.random() * 30,
        deliveryQuality: 60 + Math.random() * 35,
        responseTime: 55 + Math.random() * 40,
        customerSatisfaction: 60 + Math.random() * 35,
        operationalStability: 60 + Math.random() * 35,
      },
      factors: [],
      history: [],
      benchmarks: {
        industry: 'general',
        industryAverage: 72,
        cityAverage: 75,
        percentile: Math.round(overall),
        betterThan: `${Math.round(overall)}% of businesses`,
      },
      creditInsights: [],
      updatedAt: new Date().toISOString(),
    };
    scores.set(req.params.businessId, score);
  }

  res.json(score);
});

// Get letter grade
app.get('/api/scores/:businessId/grade', (req: Request, res: Response) => {
  let score = scores.get(req.params.businessId);

  if (!score) {
    score = {
      businessId: req.params.businessId,
      overall: 75,
      letterGrade: 'A',
      breakdown: { paymentBehavior: 80, complianceHistory: 85, deliveryQuality: 75, responseTime: 70, customerSatisfaction: 78, operationalStability: 72 },
      factors: [],
      history: [],
      benchmarks: { industry: 'general', industryAverage: 72, cityAverage: 75, percentile: 75, betterThan: '75% of businesses' },
      creditInsights: [],
      updatedAt: new Date().toISOString(),
    };
  }

  res.json({
    businessId: score.businessId,
    grade: score.letterGrade,
    score: score.overall,
    badge: getBadgeForGrade(score.letterGrade),
    benefits: getBenefitsForGrade(score.letterGrade),
  });
});

function getBadgeForGrade(grade: string): string {
  const badges: Record<string, string> = {
    'AAA': '🏆 Diamond',
    'AA': '🥇 Gold',
    'A': '🥈 Silver',
    'BBB': '🥉 Bronze',
    'BB': 'Verified',
    'B': 'Basic',
    'C': 'Caution',
    'D': 'High Risk',
  };
  return badges[grade] || 'Unrated';
}

function getBenefitsForGrade(grade: string): string[] {
  const benefits: Record<string, string[]> = {
    'AAA': ['Premium credit up to ₹50L', 'Lowest rates (1% monthly)', 'Priority support', 'White-label access'],
    'AA': ['Credit up to ₹20L', 'Low rates (1.2% monthly)', 'Priority support', 'Featured listing'],
    'A': ['Credit up to ₹10L', 'Standard rates (1.5% monthly)', 'Featured listing', 'Extended payment terms'],
    'BBB': ['Credit up to ₹5L', 'Standard rates (1.8% monthly)', 'Verified badge'],
    'BB': ['Credit up to ₹2L', 'Higher rates (2% monthly)', 'Trust badge'],
  };
  return benefits[grade] || ['Build your score with on-time payments'];
}

// Get score factors
app.get('/api/scores/:businessId/factors', (req: Request, res: Response) => {
  const score = scores.get(req.params.businessId);
  if (!score) return res.status(404).json({ error: 'Score not found' });

  res.json({
    businessId: score.businessId,
    positive: score.factors.filter(f => f.impact === 'positive'),
    negative: score.factors.filter(f => f.impact === 'negative'),
    recommendations: getRecommendations(score),
  });
});

function getRecommendations(score: TrustScore): string[] {
  const recs: string[] = [];

  if (score.breakdown.paymentBehavior < 80) {
    recs.push('Set up auto-payment reminders to improve payment behavior');
  }
  if (score.breakdown.complianceHistory < 85) {
    recs.push('File GST on time to boost compliance score');
  }
  if (score.breakdown.deliveryQuality < 80) {
    recs.push('Track delivery times to improve delivery score');
  }
  if (score.breakdown.responseTime < 75) {
    recs.push('Respond to queries faster to improve response score');
  }

  return recs;
}

// Get benchmarks
app.get('/api/scores/:businessId/benchmarks', (req: Request, res: Response) => {
  const score = scores.get(req.params.businessId);
  if (!score) return res.status(404).json({ error: 'Score not found' });

  res.json({
    businessId: score.businessId,
    current: score.overall,
    benchmarks: score.benchmarks,
    trends: {
      paymentBehavior: score.history.length > 1 ? score.history[score.history.length - 1].paymentBehavior - score.history[score.history.length - 2].paymentBehavior : 0,
      overall: score.history.length > 1 ? score.history[score.history.length - 1].overall - score.history[score.history.length - 2].overall : 0,
    },
  });
});

// Get credit products
app.get('/api/credit/products', (_req: Request, res: Response) => {
  res.json({ products: creditProducts });
});

// Check eligibility
app.post('/api/credit/check', (req: Request, res: Response) => {
  const { businessId, productId } = req.body;

  const score = scores.get(businessId);
  const product = creditProducts.find(p => p.productId === productId);

  if (!score) {
    return res.json({
      eligible: false,
      reason: 'No score available. Complete 3 months to get scored.',
    });
  }

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const eligible =
    score.overall >= product.eligibility.minScore;

  res.json({
    eligible,
    businessScore: score.overall,
    requiredScore: product.eligibility.minScore,
    amount: eligible ? `Up to ₹${(product.limits.max / 100000).toFixed(0)}L` : null,
    rate: eligible ? `${product.rates.monthly}% monthly` : null,
    reason: eligible ? 'Eligible for this product' : `Need ${product.eligibility.minScore} score (you have ${score.overall})`,
  });
});

// Apply for credit
app.post('/api/credit/apply', (req: Request, res: Response) => {
  const { businessId, productId, amount, purpose } = req.body;

  const score = scores.get(businessId);
  const product = creditProducts.find(p => p.productId === productId);

  if (!score || !product) {
    return res.status(400).json({ error: 'Invalid business or product' });
  }

  if (score.overall < product.eligibility.minScore) {
    return res.json({
      approved: false,
      reason: 'Score below eligibility threshold',
    });
  }

  // Mock approval
  const approved = Math.random() > 0.1; // 90% approval rate for good scores

  res.json({
    applicationId: `app_${Date.now()}`,
    approved,
    amount: approved ? amount || product.limits.max : 0,
    rate: approved ? product.rates.monthly : 0,
    message: approved ? 'Credit approved! Funds will be disbursed within 24 hours.' : 'Application under review. We will update within 48 hours.',
  });
});

// Leaderboard
app.get('/api/leaderboard', (req: Request, res: Response) => {
  const { industry, city, limit = 10 } = req.query;

  const ranked = Array.from(scores.values())
    .sort((a, b) => b.overall - a.overall)
    .slice(0, parseInt(limit as string));

  res.json({
    rankings: ranked.map((s, i) => ({
      rank: i + 1,
      businessId: s.businessId,
      score: s.overall,
      grade: s.letterGrade,
    })),
    total: scores.size,
  });
});

const PORT = process.env.PORT || 4081;
app.listen(PORT, () => {
  logger.info(`
╔═══════════════════════════════════════════════╗
║  ⭐ Bizora Trust Score Service            ║
║  SMB Credit Infrastructure               ║
║  Port: ${PORT}                               ║
╚═══════════════════════════════════════════════╝
  `);
});
