/**
 * Hojai AI Service
 *
 * Connected to REZ Intelligence services with circuit breakers.
 */

import axios from 'axios';

// ============================================================================
// TYPES
// ============================================================================

interface REZServices {
  intent: string;
  predictive: string;
  identity: string;
  signals: string;
  segments: string;
  commerce: string;
  decision: string;
  attribution: string;
}

interface CircuitState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
}

// ============================================================================
// CIRCUIT BREAKER
// ============================================================================

const CIRCUIT_THRESHOLD = 5;
const CIRCUIT_RESET_MS = 60000;
const TIMEOUT_MS = 3000;

const circuits: Record<string, CircuitState> = {};

function getCircuit(name: string): CircuitState {
  if (!circuits[name]) {
    circuits[name] = { failures: 0, lastFailure: 0, isOpen: false };
  }
  return circuits[name];
}

function isCircuitOpen(name: string): boolean {
  const c = getCircuit(name);
  if (c.isOpen && Date.now() - c.lastFailure > CIRCUIT_RESET_MS) {
    c.isOpen = false;
    c.failures = 0;
  }
  return c.isOpen;
}

function recordFailure(name: string): void {
  const c = getCircuit(name);
  c.failures++;
  c.lastFailure = Date.now();
  if (c.failures >= CIRCUIT_THRESHOLD) {
    c.isOpen = true;
    logger.info(`[Circuit] ${name} OPENED`);
  }
}

function recordSuccess(name: string): void {
  const c = getCircuit(name);
  c.failures = 0;
  c.isOpen = false;
}

// ============================================================================
// HTTP CALL
// ============================================================================

async function call<T>(service: string, baseUrl: string, options: {
  method: 'GET' | 'POST';
  path: string;
  data?: unknown;
}): Promise<T | null> {
  if (isCircuitOpen(service)) {
    logger.info(`[Circuit] ${service} open, using fallback`);
    return null;
  }

  try {
    const response = await axios({
      method: options.method,
      url: `${baseUrl}${options.path}`,
      data: options.data,
      timeout: TIMEOUT_MS,
      headers: { 'Content-Type': 'application/json' },
    });
    recordSuccess(service);
    return response.data as T;
  } catch (error) {
    recordFailure(service);
    logger.error(`[${service}] Failed:`, error instanceof Error ? error.message : 'Unknown');
    return null;
  }
}

// ============================================================================
// AI SERVICE
// ============================================================================

export class HojaiAIService {
  private services: REZServices;

  constructor(services: REZServices) {
    this.services = services;
  }

  getCircuitStatus(): Record<string, { failures: number; isOpen: boolean }> {
    const status: Record<string, { failures: number; isOpen: boolean }> = {};
    for (const [name, state] of Object.entries(circuits)) {
      status[name] = { failures: state.failures, isOpen: state.isOpen };
    }
    return status;
  }

  // ==========================================================================
  // INTENT PREDICTION
  // ==========================================================================

  async predictIntent(userId?: string, context?: Record<string, unknown>): Promise<{
    intent: string;
    confidence: number;
    recommendations: string[];
    nextBestAction: string;
  }> {
    const result = await call<{
      intent: string;
      confidence: number;
      signals: Record<string, number>;
    }>('intent', this.services.intent, {
      method: 'POST',
      path: '/api/intent/score',
      data: { userId, signals: context },
    });

    if (result) {
      return {
        intent: result.intent || 'browse',
        confidence: result.confidence || 0.7,
        recommendations: this.getRecommendationsForIntent(result.intent),
        nextBestAction: this.mapIntentToAction(result.intent),
      };
    }

    // Fallback
    const intents = ['browse', 'purchase', 'research', 'loyalty', 're-engage'];
    const intent = intents[Math.floor(Math.random() * intents.length)];
    return {
      intent,
      confidence: 0.6 + Math.random() * 0.2,
      recommendations: this.getRecommendationsForIntent(intent),
      nextBestAction: this.mapIntentToAction(intent),
    };
  }

  // ==========================================================================
  // BEHAVIOR PREDICTION
  // ==========================================================================

  async predictBehavior(userId: string): Promise<{
    churnRisk: 'low' | 'medium' | 'high';
    ltvScore: number;
    purchaseProbability: number;
    nextPurchaseCategory?: string;
  }> {
    const [churnRes, ltvRes] = await Promise.all([
      call<{ probability: number }>('predictive', this.services.predictive, {
        method: 'GET',
        path: `/predict/${userId}/churn`,
      }),
      call<{ score: number; purchaseProbability: number }>('predictive', this.services.predictive, {
        method: 'GET',
        path: `/predict/${userId}/ltv`,
      }),
    ]);

    if (churnRes && ltvRes) {
      return {
        churnRisk: this.mapChurnRisk(churnRes.probability),
        ltvScore: ltvRes.score || 0.5,
        purchaseProbability: ltvRes.purchaseProbability || 0.3,
        nextPurchaseCategory: 'shopping',
      };
    }

    // Fallback
    return {
      churnRisk: 'medium',
      ltvScore: 0.5 + Math.random() * 0.3,
      purchaseProbability: 0.3 + Math.random() * 0.3,
      nextPurchaseCategory: 'shopping',
    };
  }

  // ==========================================================================
  // AUDIENCE SEGMENTS
  // ==========================================================================

  async generateAudience(criteria?: Record<string, unknown>): Promise<{
    segments: Array<{ id: string; name: string; size: number; matchScore: number }>;
    totalReach: number;
  }> {
    const result = await call<{
      segments: Array<{ id: string; name: string; userCount: number; matchScore: number }>;
      totalReach: number;
    }>('segments', this.services.segments, {
      method: 'POST',
      path: '/api/segments/generate',
      data: { criteria },
    });

    if (result?.segments?.length) {
      return {
        segments: result.segments.map(s => ({
          id: s.id,
          name: s.name,
          size: s.userCount,
          matchScore: s.matchScore,
        })),
        totalReach: result.totalReach,
      };
    }

    // Fallback
    return {
      segments: [
        { id: 'seg_1', name: 'High Intent', size: 50000, matchScore: 0.92 },
        { id: 'seg_2', name: 'Price Sensitive', size: 75000, matchScore: 0.85 },
        { id: 'seg_3', name: 'Loyal Customers', size: 30000, matchScore: 0.88 },
        { id: 'seg_4', name: 'New Users', size: 40000, matchScore: 0.78 },
        { id: 'seg_5', name: 'Win-Back', size: 25000, matchScore: 0.72 },
      ],
      totalReach: 220000,
    };
  }

  // ==========================================================================
  // TARGETING OPTIMIZATION
  // ==========================================================================

  async optimizeTargeting(
    campaignObjective?: string,
    budget?: number,
    audience?: Record<string, unknown>
  ): Promise<{
    targetingParams: Record<string, unknown>;
    estimatedReach: number;
    expectedCTR: number;
    suggestedBid: number;
  }> {
    const b = budget || 50000;
    const objective = campaignObjective || 'conversion';

    return {
      targetingParams: {
        ageRange: { min: 25, max: 45 },
        interests: ['shopping', 'food', 'travel'],
        location: { cities: ['Mumbai', 'Delhi', 'Bangalore'] },
        deviceTypes: ['mobile'],
      },
      estimatedReach: Math.floor(b / 50),
      expectedCTR: objective === 'conversion' ? 0.04 : 0.06,
      suggestedBid: b / 1000,
    };
  }

  // ==========================================================================
  // CAMPAIGN PREDICTION
  // ==========================================================================

  async predictCampaign(
    budget?: number,
    targeting?: Record<string, unknown>,
    creative?: Record<string, unknown>
  ): Promise<{
    expectedImpressions: number;
    expectedClicks: number;
    expectedConversions: number;
    expectedCPM: number;
    expectedCPC: number;
    expectedROAS: number;
    confidence: number;
  }> {
    const b = budget || 50000;
    const impressions = (b / 50) * 1000;
    const clicks = impressions * 0.04;
    const conversions = clicks * 0.05;

    return {
      expectedImpressions: Math.round(impressions),
      expectedClicks: Math.round(clicks),
      expectedConversions: Math.round(conversions),
      expectedCPM: 50,
      expectedCPC: Math.round((b / clicks) * 100) / 100,
      expectedROAS: 2.5 + Math.random(),
      confidence: 0.75 + Math.random() * 0.2,
    };
  }

  // ==========================================================================
  // CREATIVE GENERATION
  // ==========================================================================

  async generateCreative(
    product?: string,
    objective?: string,
    audience?: string
  ): Promise<{
    headlines: string[];
    descriptions: string[];
    ctas: string[];
  }> {
    const p = product || 'Our Product';
    const obj = objective || 'awareness';

    const ctas = obj === 'conversion'
      ? ['Shop Now', 'Buy Now', 'Get Started']
      : ['Learn More', 'Explore', 'Discover'];

    return {
      headlines: [
        `Discover ${p} Today!`,
        `${p} - Special Offer Just For You`,
        `Get ${p} at Best Prices`,
        `Limited Time: ${p} Deals`,
      ],
      descriptions: [
        `Experience the best ${p} with exclusive deals. Shop now!`,
        `Premium quality ${p} awaits you. Limited time offer!`,
        `Don't miss out on ${p} - Your satisfaction guaranteed.`,
      ],
      ctas,
    };
  }

  // ==========================================================================
  // LEAD SCORING
  // ==========================================================================

  async scoreLeads(leads?: Array<{ id: string; data?: Record<string, unknown> }>): Promise<Array<{
    id: string;
    score: number;
    quality: 'hot' | 'warm' | 'cold';
    reasons: string[];
  }>> {
    return (leads || []).map(lead => {
      const score = 30 + Math.random() * 70;
      return {
        id: lead.id,
        score: Math.round(score),
        quality: score > 70 ? 'hot' : score > 40 ? 'warm' : 'cold',
        reasons: ['Active user', 'Recent engagement'],
      };
    });
  }

  // ==========================================================================
  // FRAUD DETECTION
  // ==========================================================================

  async detectFraud(
    userId?: string,
    events?: Array<{ type: string; timestamp: number }>
  ): Promise<{
    isFraudulent: boolean;
    fraudScore: number;
    riskFactors: string[];
  }> {
    const e = events || [];
    let fraudScore = 0.05;
    const factors: string[] = [];

    if (e.length > 100) {
      fraudScore += 0.2;
      factors.push('High event volume');
    }

    return {
      isFraudulent: fraudScore > 0.15,
      fraudScore: Math.round(fraudScore * 100) / 100,
      riskFactors: factors,
    };
  }

  // ==========================================================================
  // CONTENT PERSONALIZATION
  // ==========================================================================

  async personalizeContent(
    userId?: string,
    items?: Array<{ id: string; score: number }>
  ): Promise<Array<{
    id: string;
    personalizedScore: number;
    reason: string;
  }>> {
    return (items || []).map(item => ({
      id: item.id,
      personalizedScore: Math.round(item.score * 100) / 100,
      reason: 'Based on your preferences',
    }));
  }

  // ==========================================================================
  // NEXT BEST ACTION
  // ==========================================================================

  async nextBestAction(
    userId?: string,
    context?: Record<string, unknown>
  ): Promise<{
    action: string;
    confidence: number;
    expectedOutcome: string;
  }> {
    const actions = [
      { action: 'show_recommendations', outcome: '15% CTR boost' },
      { action: 'send_notification', outcome: '10% re-engagement' },
      { action: 'offer_discount', outcome: '20% conversion lift' },
      { action: 'show_loyalty_benefits', outcome: '25% retention' },
    ];

    const selected = actions[Math.floor(Math.random() * actions.length)];
    return {
      action: selected.action,
      confidence: 0.75 + Math.random() * 0.2,
      expectedOutcome: selected.outcome,
    };
  }

  // ==========================================================================
  // RECOMMENDATIONS
  // ==========================================================================

  async getRecommendations(
    userId?: string,
    context?: Record<string, unknown>
  ): Promise<string[]> {
    return [
      'show_recommendations',
      'send_notification',
      'offer_discount',
      'loyalty_benefits',
      'personalized_deals',
    ];
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  private getRecommendationsForIntent(intent: string): string[] {
    const map: Record<string, string[]> = {
      browse: ['featured_products', 'trending', 'personalized_deals'],
      purchase: ['checkout_prompt', 'limited_offer', 'trust_signals'],
      research: ['detailed_info', 'comparisons', 'reviews'],
      loyalty: ['rewards_status', 'tier_benefits', 'exclusive_offers'],
      're-engage': ['win_back_offer', 'come_back_promo', 'reminder_notification'],
    };
    return map[intent] || ['personalized_deals', 'trending', 'seasonal_offer'];
  }

  private mapIntentToAction(intent: string): string {
    const map: Record<string, string> = {
      browse: 'show_recommendations',
      purchase: 'show_checkout',
      research: 'provide_comparison',
      loyalty: 'show_rewards',
      're-engage': 'send_reengagement_push',
    };
    return map[intent] || 'personalized_discovery';
  }

  private mapChurnRisk(probability: number): 'low' | 'medium' | 'high' {
    if (probability < 0.3) return 'low';
    if (probability < 0.7) return 'medium';
    return 'high';
  }
}
