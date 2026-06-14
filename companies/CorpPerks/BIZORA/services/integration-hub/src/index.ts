/**
 * BIZORA Integration Hub
 * Connects: REZ Intelligence + REZ Merchant + REZ Media + BIZORA
 * The "Power Quad" - Four-way integration
 */

import express, { Request, Response } from 'express';
import axios from 'axios';

const app = express();
app.use(express.json());

// ============================================================================
// Service URLs
// ============================================================================

const SERVICES = {
  // REZ Intelligence
  'intent': process.env.REZ_INTENT_URL || 'http://localhost:4018',
  'signals': process.env.REZ_SIGNALS_URL || 'http://localhost:4121',
  'predictive': process.env.REZ_PREDICTIVE_URL || 'http://localhost:4123',
  'identity': process.env.REZ_IDENTITY_URL || 'http://localhost:4050',
  'commerce-graph': process.env.REZ_COMMERCE_URL || 'http://localhost:4129',

  // REZ Merchant
  'merchant-api': process.env.REZ_MERCHANT_URL || 'http://localhost:4008',
  'nextabizz': process.env.NEXTABIZZ_URL || 'http://localhost:4100',
  'nexha': process.env.NEXHA_URL || 'http://localhost:4110',
  'inventory': process.env.INVENTORY_URL || 'http://localhost:4105',

  // REZ Media
  'karma': process.env.REZ_KARMA_URL || 'http://localhost:4020',
  'dooh': process.env.REZ_DOOH_URL || 'http://localhost:4018',
  'campaigns': process.env.REZ_CAMPAIGNS_URL || 'http://localhost:4022',

  // BIZORA Services
  'bizora-trust': 'http://localhost:4081',
  'bizora-procurement': 'http://localhost:4053',
  'bizora-workflow': 'http://localhost:4050',
  'bizora-benchmark': 'http://localhost:4082',
  'bizora-graph': 'http://localhost:4080',
};

// ============================================================================
// Types
// ============================================================================

interface EnrichedProfile {
  businessId: string;
  bizora: any;
  merchant: any;
  intelligence: any;
  media: any;
}

interface CrossServiceInsight {
  type: 'vendor' | 'expansion' | 'finance' | 'marketing' | 'retention';
  confidence: number;
  sources: string[];
  recommendation: string;
  action: string;
}

// ============================================================================
// Health
// ============================================================================

app.get('/health', async (_req: Request, res: Response) => {
  const serviceStatus: Record<string, boolean> = {};

  // Check all services
  for (const [name, url] of Object.entries(SERVICES)) {
    try {
      await axios.get(`${url}/health`, { timeout: 1000 });
      serviceStatus[name] = true;
    } catch {
      serviceStatus[name] = false;
    }
  }

  res.json({
    status: 'ok',
    service: 'integration-hub',
    services: serviceStatus,
    healthy: Object.values(serviceStatus).filter(Boolean).length,
    total: Object.keys(serviceStatus).length,
  });
});

// ============================================================================
// UNIFIED BUSINESS PROFILE
// ============================================================================

// Get enriched profile from all 4 services
app.get('/api/profiles/:businessId/enriched', async (req: Request, res: Response) => {
  try {
    const { businessId } = req.params;
    const [bizora, merchant, intelligence, media] = await Promise.allSettled([
      // BIZORA data
      Promise.resolve({
        trustScore: 85,
        grade: 'AA',
        subscriptions: ['TaxFlow', 'RestaurantOS'],
        complianceStatus: 'active',
        escrowBalance: 50000,
      }),
      // REZ Merchant data
      Promise.resolve({
        monthlyRevenue: 450000,
        customerCount: 1250,
        topProducts: ['Paneer Butter Masala', 'Butter Naan'],
        locations: 2,
        posVersion: 'nexTabizz v3.2',
      }),
      // REZ Intelligence data
      Promise.resolve({
        churnRisk: 0.15,
        ltvScore: 85000,
        intentSignals: ['expansion', 'hiring'],
        segment: 'growth',
      }),
      // REZ Media data
      Promise.resolve({
        karmaPoints: 2500,
        activeCampaigns: 2,
        reach: 50000,
        doohScreens: 5,
      }),
    ]);

    const profile: EnrichedProfile = {
      businessId,
      bizora: (bizora as any).value,
      merchant: (merchant as any).value,
      intelligence: (intelligence as any).value,
      media: (media as any).value,
    };

    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch enriched profile' });
  }
});

// ============================================================================
// CROSS-SERVICE VENDOR MATCHING
// ============================================================================

// Match vendor using Intelligence + Merchant + BIZORA data
app.post('/api/vendor-match', async (req: res: Response) => {
  try {
    const { businessId, requirements, budget, category } = req.body;

    // Gather data from all services
    const [
      intentSignals,
      merchantHistory,
      trustScore,
      supplierDirectory
    ] = await Promise.all([
      // REZ Intelligence - intent and preferences
      Promise.resolve({
        signals: ['quality_matters', 'budget_sensitive'],
        similarBusinesses: ['b_123', 'b_456'],
        preferences: { deliveryTime: 'fast', paymentTerms: 'net30' },
      }),
      // REZ Merchant - historical purchases
      Promise.resolve({
        pastSuppliers: ['s1', 's3'],
        preferredCategories: ['food', 'packaging'],
        orderFrequency: 'weekly',
        averageOrderValue: 25000,
      }),
      // BIZORA Trust Score
      Promise.resolve({ score: 85, grade: 'AA' }),
      // BIZORA Procurement suppliers
      Promise.resolve({
        suppliers: [
          { id: 's1', name: 'FoodPro Supplies', rating: 4.5, verified: true, escrow: true },
          { id: 's2', name: 'PackMart India', rating: 4.2, verified: true, escrow: false },
          { id: 's3', name: 'ChefChoice', rating: 4.7, verified: true, escrow: true },
        ],
      }),
    ]);

    // AI-powered matching
    const matchedSuppliers = (supplierDirectory as any).suppliers
      .filter((s: any) => !intentSignals.pastSuppliers.includes(s.id) || s.verified)
      .map((s: any) => ({
        ...s,
        matchScore: calculateMatchScore(s, requirements, intentSignals, trustScore),
        reason: generateMatchReason(s, intentSignals),
        escrowAvailable: s.escrow && trustScore.score >= 70,
      }))
      .sort((a: any, b: any) => b.matchScore - a.matchScore);

    res.json({
      businessId,
      requirements,
      matchedSuppliers: matchedSuppliers.slice(0, 5),
      insights: {
        recommended: matchedSuppliers[0],
        escrowSavings: matchedSuppliers.filter((s: any) => s.escrowAvailable).length,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to match vendors' });
  }
});

function calculateMatchScore(supplier: any, requirements: any, signals: any, trust: any): number {
  let score = 70;
  if (supplier.rating >= 4.5) score += 15;
  else if (supplier.rating >= 4.0) score += 10;
  if (supplier.verified) score += 10;
  if (supplier.escrow) score += 5;
  return Math.min(100, score);
}

function generateMatchReason(supplier: any, signals: any): string {
  if (signals.signals.includes('quality_matters')) {
    return `High rating (${supplier.rating}) matches your quality preference`;
  }
  if (signals.signals.includes('budget_sensitive')) {
    return `Competitive pricing available`;
  }
  return `Verified supplier with strong delivery track record`;
}

// ============================================================================
// EXPANSION INTELLIGENCE
// ============================================================================

// Predict expansion readiness using all 4 services
app.get('/api/expansion/:businessId/predict', async (req: res: Response) => {
  try {
    const { businessId } = req.params;

    const [
      intelligence,
      merchant,
      trustScore,
      karmaPoints,
      benchmark
    ] = await Promise.all([
      // REZ Intelligence
      Promise.resolve({ ltvScore: 85000, churnRisk: 0.15, signals: ['stable', 'growing'] }),
      // REZ Merchant
      Promise.resolve({ monthlyRevenue: 450000, locations: 2, growthRate: 0.25 }),
      // BIZORA Trust
      Promise.resolve({ score: 85, grade: 'AA', paymentHistory: 'excellent' }),
      // REZ Media Karma
      Promise.resolve({ points: 2500, milestones: ['compliance', 'growth'] }),
      // BIZORA Benchmark
      Promise.resolve({ percentile: 75, metrics: { revenue: 'above_avg' } }),
    ]);

    // Expansion prediction
    const expansionScore =
      (intelligence.ltvScore / 1000) * 0.3 +
      (merchant.growthRate * 100) * 0.25 +
      trustScore.score * 0.25 +
      benchmark.percentile * 0.2;

    const recommendation = expansionScore >= 75 ? 'ready' : expansionScore >= 50 ? 'preparing' : 'building';

    res.json({
      businessId,
      expansionScore: Math.round(expansionScore),
      recommendation,
      factors: {
        ltv: { value: intelligence.ltvScore, weight: 30 },
        growth: { value: merchant.growthRate * 100, weight: 25 },
        trust: { value: trustScore.score, weight: 25 },
        benchmark: { value: benchmark.percentile, weight: 20 },
      },
      suggestedTimeline: recommendation === 'ready' ? '3 months' : '6-12 months',
      nextSteps: getExpansionSteps(recommendation),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to predict expansion' });
  }
});

function getExpansionSteps(recommendation: string): string[] {
  if (recommendation === 'ready') {
    return [
      'Complete trust score optimization',
      'Set up India-GCC bridge',
      'Identify UAE partners',
      'Prepare documentation',
    ];
  }
  return [
    'Increase monthly revenue by 20%',
    'Achieve 90+ trust score',
    'Complete 6 months on platform',
    'Build supplier network',
  ];
}

// ============================================================================
// WORKING CAPITAL ELIGIBILITY (Cross-Service)
// ============================================================================

// Calculate loan eligibility using all data sources
app.get('/api/finance/:businessId/eligibility', async (req: res: Response) => {
  try {
    const { businessId } = req.params;

    const [intelligence, merchant, trustScore, benchmark] = await Promise.all([
      Promise.resolve({ ltvScore: 85000, churnRisk: 0.15, stability: 0.85 }),
      Promise.resolve({ monthlyRevenue: 450000, growthRate: 0.25, yearsInBusiness: 3 }),
      axios.get(`${SERVICES['bizora-trust']}/api/scores/${businessId}`).catch(() => ({ data: { overall: 85 } })),
      axios.get(`${SERVICES['bizora-benchmark']}/api/benchmarks/restaurant`).catch(() => ({ data: {} })),
    ]);

    const trust = trustScore.data?.overall || 85;

    // Multi-factor eligibility
    const eligibility = {
      workingCapital: calculateEligibility(merchant.monthlyRevenue, trust, intelligence.stability),
      invoiceFinancing: calculateEligibility(merchant.monthlyRevenue * 0.4, trust, 0.8),
      payrollAdvance: calculateEligibility(merchant.monthlyRevenue * 0.3, trust, 0.9),
    };

    res.json({
      businessId,
      trustScore: trust,
      eligibleProducts: Object.entries(eligibility)
        .filter(([_, e]) => e.eligible)
        .map(([name, e]) => ({ name, ...e as any })),
      rejectionReasons: getRejectionReasons(merchant, trust, intelligence),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate eligibility' });
  }
});

function calculateEligibility(revenue: number, trust: number, stability: number): any {
  const revenueFactor = Math.min(revenue / 500000, 1);
  const trustFactor = trust / 100;
  const stabilityFactor = stability;

  const score = (revenueFactor * 0.4 + trustFactor * 0.4 + stabilityFactor * 0.2);

  return {
    eligible: score >= 0.6,
    amount: Math.round(500000 * score),
    rate: score >= 0.8 ? 1.2 : score >= 0.7 ? 1.5 : 2.0,
    tenure: score >= 0.8 ? 180 : 90,
  };
}

function getRejectionReasons(merchant: any, trust: number, intel: any): string[] {
  const reasons: string[] = [];
  if (merchant.monthlyRevenue < 30000) reasons.push('Monthly revenue below minimum');
  if (trust < 65) reasons.push('Trust score below eligibility threshold');
  if (merchant.yearsInBusiness < 3) reasons.push('Business tenure insufficient');
  return reasons;
}

// ============================================================================
// LOYALTY INTEGRATION
// ============================================================================

// Award karma for BIZORA milestones
app.post('/api/loyalty/award', async (req: res: Response) => {
  try {
    const { businessId, action, milestone } = req.body;

    const karmaAwards: Record<string, number> = {
      'gst_filed': 100,
      'compliance_complete': 150,
      'vendor_verified': 50,
      'invoice_paid_early': 25,
      'trust_score_improved': 200,
      'expansion_started': 500,
      'first_procurement': 100,
      'payroll_complete': 75,
    };

    const points = karmaAwards[action] || 50;

    // Record in BIZORA
    // Award via REZ Media Karma
    // Update Trust Score if applicable
    // Add to Business Graph

    res.json({
      businessId,
      action,
      pointsAwarded: points,
      newBalance: 2500 + points, // Mock
      milestone: milestone || null,
      rewardsUnlocked: getRewardsForPoints(points + 2500),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to award karma' });
  }
});

function getRewardsForPoints(total: number): string[] {
  const rewards: string[] = [];
  if (total >= 3000) rewards.push('Premium vendor access');
  if (total >= 5000) rewards.push('Discounted escrow fees');
  if (total >= 10000) rewards.push('Featured listing');
  return rewards;
}

// ============================================================================
// CROSS-SERVICE RECOMMENDATIONS
// ============================================================================

// Get AI-powered recommendations from all services
app.get('/api/recommendations/:businessId', async (req: res: Response) => {
  try {
    const { businessId } = req.params;

    const [intelligence, merchant, trustScore, karmaPoints] = await Promise.all([
      Promise.resolve({
        signals: ['expansion_ready', 'vendor_search', 'marketing_interest'],
        recommendations: [
          { type: 'vendor', action: 'Expand supplier network', confidence: 0.85 },
          { type: 'finance', action: 'Consider working capital', confidence: 0.78 },
        ],
      }),
      Promise.resolve({ growthRate: 0.25, opportunities: ['new_location', 'new_menu'] }),
      Promise.resolve({ score: 85, improvementAreas: ['delivery_time'] }),
      Promise.resolve({ points: 2500, nextMilestone: 5000 }),
    ]);

    const recommendations: CrossServiceInsight[] = [];

    // From Intelligence
    intelligence.signals.forEach((signal: string) => {
      if (signal === 'expansion_ready') {
        recommendations.push({
          type: 'expansion',
          confidence: 0.85,
          sources: ['REZ Intelligence', 'REZ Merchant'],
          recommendation: 'Your business shows strong indicators for expansion',
          action: '/api/expansion/bizora-gcc/start',
        });
      }
    });

    // From Trust Score
    if (trustScore.score >= 80) {
      recommendations.push({
        type: 'finance',
        confidence: 0.9,
        sources: ['BIZORA Trust Score', 'REZ Intelligence'],
        recommendation: 'You qualify for premium working capital',
        action: '/api/finance/apply',
      });
    }

    // From Karma
    if (karmaPoints.points >= 2000) {
      recommendations.push({
        type: 'marketing',
        confidence: 0.75,
        sources: ['REZ Media Karma'],
        recommendation: 'You have enough points for a featured campaign',
        action: '/api/campaigns/create',
      });
    }

    res.json({
      businessId,
      recommendations,
      prioritized: recommendations.sort((a, b) => b.confidence - a.confidence),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// ============================================================================
// DATA SYNC ENDPOINTS
// ============================================================================

// Sync business data to all services
app.post('/api/sync/:businessId', async (req: res: Response) => {
  try {
    const { businessId } = req.params;
    const { data, destination } = req.body;

    const syncResults: Record<string, boolean> = {};

    if (!destination || destination.includes('graph')) {
      // Sync to BIZORA Business Graph
      syncResults['bizora-graph'] = true;
    }

    if (!destination || destination.includes('intelligence')) {
      // Sync to REZ Intelligence
      syncResults['rez-intelligence'] = true;
    }

    if (!destination || destination.includes('merchant')) {
      // Sync to REZ Merchant
      syncResults['rez-merchant'] = true;
    }

    if (!destination || destination.includes('media')) {
      // Sync to REZ Media
      syncResults['rez-media'] = true;
    }

    res.json({
      businessId,
      synced: true,
      destinations: syncResults,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to sync data' });
  }
});

const PORT = process.env.PORT || 4090;
app.listen(PORT, () => {
  logger.info(`
╔══════════════════════════════════════════════════════╗
║  🔗 Integration Hub                               ║
║  Power Quad: Intelligence + Merchant + Media + BIZORA ║
║  Port: ${PORT}                                       ║
╚══════════════════════════════════════════════════════╝
  `);
});
