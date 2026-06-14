/**
 * REZ REVENUE AI INTEGRATION
 * Updated integration for REZ Merchant Service
 *
 * Connects to: REZ Revenue AI (Ports 4300-4312)
 *
 * Features:
 * - Dynamic Pricing (4301)
 * - Demand Forecast (4302)
 * - Offer Optimizer (4303)
 * - Cashback Optimizer (4304)
 * - Revenue Copilot (4307)
 * - Simulation Engine (4308)
 * - Benchmark Score (4309)
 * - Segment Brain (4310)
 * - MerchantGPT (4312)
 */

import axios, { AxiosInstance } from 'axios';
import { logger } from '../config/logger';

// Configuration
const REVENUE_AI_BASE_URL = process.env.REVENUE_AI_URL || 'http://localhost:4300';
const REVENUE_AI_API_KEY = process.env.REVENUE_AI_API_KEY;
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;

// ================== CLIENT ==================

class RevenueAIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: REVENUE_AI_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        ...(REVENUE_AI_API_KEY && { 'X-API-Key': REVENUE_AI_API_KEY }),
      },
    });
  }

  async price(params: PricingRequest): Promise<PricingResult> {
    try {
      const response = await this.client.post('/api/v1/pricing/calculate', {
        context: params,
      });
      return response.data.data;
    } catch (error) {
      logger.error('[RevenueAI] Pricing failed:', error);
      throw error;
    }
  }

  async forecast(params: ForecastRequest): Promise<ForecastResult> {
    try {
      const response = await this.client.post('/api/v1/forecast', params);
      return response.data.data;
    } catch (error) {
      logger.error('[RevenueAI] Forecast failed:', error);
      throw error;
    }
  }

  async optimizeOffer(params: OfferRequest): Promise<OfferResult> {
    try {
      const response = await this.client.post('/api/v1/offers/optimize', params);
      return response.data.data;
    } catch (error) {
      logger.error('[RevenueAI] Offer optimization failed:', error);
      throw error;
    }
  }

  async optimizeCashback(params: CashbackRequest): Promise<CashbackResult> {
    try {
      const response = await this.client.post('/api/v1/cashback/optimize', params);
      return response.data.data;
    } catch (error) {
      logger.error('[RevenueAI] Cashback optimization failed:', error);
      throw error;
    }
  }

  async getRevenuePlan(params: RevenuePlanRequest): Promise<RevenuePlanResult> {
    try {
      const response = await this.client.post('/api/v1/copilot/revenue-plan', params);
      return response.data.data;
    } catch (error) {
      logger.error('[RevenueAI] Revenue plan failed:', error);
      throw error;
    }
  }

  async chat(params: ChatRequest): Promise<ChatResult> {
    try {
      const response = await this.client.post('/api/v1/chat', params);
      return response.data.data;
    } catch (error) {
      logger.error('[RevenueAI] Chat failed:', error);
      throw error;
    }
  }

  async getBenchmark(merchantId: string): Promise<BenchmarkResult> {
    try {
      const response = await this.client.get(`/api/v1/benchmarks/${merchantId}`);
      return response.data.data;
    } catch (error) {
      logger.error('[RevenueAI] Benchmark failed:', error);
      throw error;
    }
  }

  async getSegments(merchantId: string): Promise<SegmentsResult> {
    try {
      const response = await this.client.get(`/api/v1/segments/${merchantId}`);
      return response.data.data;
    } catch (error) {
      logger.error('[RevenueAI] Segments failed:', error);
      throw error;
    }
  }
}

// Singleton instance
let revenueAIInstance: RevenueAIClient | null = null;

export function getRevenueAIClient(): RevenueAIClient {
  if (!revenueAIInstance) {
    revenueAIInstance = new RevenueAIClient();
  }
  return revenueAIInstance;
}

// ================== TYPE DEFINITIONS ==================

interface PricingRequest {
  entity: {
    id: string;
    type: 'product' | 'service';
    category: string;
    vertical: 'restaurant' | 'hotel' | 'salon' | 'gym' | 'clinic' | 'retail';
    name: string;
    basePrice: number;
    cost: number;
  };
  time: {
    dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    hourOfDay: number;
    isPeakHour?: boolean;
    isWeekend?: boolean;
    isHoliday?: boolean;
    season?: 'spring' | 'summer' | 'autumn' | 'winter';
  };
  demand?: {
    current: number;
    predicted?: number;
    trend?: 'increasing' | 'stable' | 'decreasing';
  };
  inventory?: {
    slotsRemaining?: number;
    totalSlots?: number;
    percentage?: number;
  };
  location?: {
    city?: string;
    tier?: 1 | 2 | 3;
    weather?: string;
    footfallIndex?: number;
    nearbyEvents?: number;
  };
  audience?: {
    userId?: string;
    segment?: 'new' | 'regular' | 'vip' | 'at_risk' | 'dormant';
    ltv?: number;
    churnRisk?: number;
  };
  constraints?: {
    minMargin?: number;
    maxSurge?: number;
    maxDiscount?: number;
  };
}

interface PricingResult {
  entityId: string;
  finalPrice: number;
  originalPrice: number;
  adjustment: number;
  adjustmentType: 'surge' | 'discount' | 'loyalty' | 'bundle' | 'time_based';
  confidence: number;
  factors: Array<{
    name: string;
    value: number;
    contribution: number;
    reason: string;
  }>;
  alternativePrices?: Array<{
    label: string;
    price: number;
    offer?: string;
  }>;
}

interface ForecastRequest {
  merchantId: string;
  vertical: string;
  category: string;
  location: {
    city: string;
    tier?: 1 | 2 | 3;
    weather?: string;
    footfallIndex?: number;
  };
  horizon: 'day' | 'week' | 'month';
}

interface ForecastResult {
  merchantId: string;
  forecasts: Array<{
    date: string;
    totalDemand: number;
    peakHour: number;
    confidence: number;
  }>;
  summary: {
    avgDailyDemand: number;
    peakDay: string;
  };
}

interface OfferRequest {
  merchantId: string;
  entityId: string;
  basePrice: number;
  audience?: {
    segment: 'new' | 'regular' | 'vip' | 'at_risk' | 'dormant';
    churnRisk?: number;
  };
  context?: {
    demand?: number;
    isWeekend?: boolean;
  };
  optimizationGoal: 'revenue' | 'conversion' | 'retention' | 'acquisition';
}

interface OfferResult {
  recommendedOffer: {
    id: string;
    name: string;
    type: string;
    value: number;
  } | null;
  alternatives: Array<{
    offer: { id: string; name: string; type: string; value: number };
    expectedRevenue: number;
    conversionLift: number;
  }>;
}

interface CashbackRequest {
  merchantId: string;
  userId: string;
  orderValue: number;
  category: string;
  vertical: string;
  context: {
    audience: {
      segment: 'new' | 'regular' | 'vip' | 'at_risk' | 'dormant';
      ltv: number;
      churnRisk: number;
    };
  };
}

interface CashbackResult {
  recommendedCashback: number;
  rate: number;
  segment: string;
  reason: string;
}

interface RevenuePlanRequest {
  merchantId: string;
  goal: {
    type: 'revenue' | 'customers' | 'orders' | 'retention';
    target: number;
    timeframe: 'week' | 'month' | 'quarter';
  };
}

interface RevenuePlanResult {
  merchantId: string;
  goal: RevenuePlanRequest['goal'];
  recommendations: Array<{
    id: string;
    type: string;
    title: string;
    expectedImpact: number;
    confidence: number;
    priority: 'quick_win' | 'medium' | 'strategic';
  }>;
  totalExpectedUplift: number;
}

interface ChatRequest {
  merchantId: string;
  message: string;
  conversationId?: string;
}

interface ChatResult {
  messageId: string;
  response: string;
  intent: string;
  actions?: Array<{
    id: string;
    type: string;
    title: string;
    canAutoExecute?: boolean;
  }>;
  followUpQuestions?: string[];
  confidence: number;
}

interface BenchmarkResult {
  merchantId: string;
  overallScore: number;
  percentile: string;
  letterGrade: string;
  breakdown: Array<{
    metric: string;
    score: number;
    categoryRank: string;
  }>;
}

interface SegmentsResult {
  merchantId: string;
  segments: Array<{
    id: string;
    name: string;
    count: number;
    percentage: number;
  }>;
}

// ================== MERCHANT-SPECIFIC INTEGRATIONS ==================

/**
 * Restaurant POS Integration
 * Get dynamic price for menu items
 */
export async function getDynamicMenuPrice(
  productId: string,
  productName: string,
  category: string,
  basePrice: number,
  cost: number,
  context: {
    time: Date;
    tablesRemaining?: number;
    totalTables?: number;
    customerId?: string;
    customerSegment?: 'new' | 'regular' | 'vip' | 'at_risk' | 'dormant';
    city?: string;
    tier?: 1 | 2 | 3;
  }
): Promise<{
  originalPrice: number;
  dynamicPrice: number;
  adjustment: number;
  adjustmentType: string;
  factors: string[];
  canOfferAlternative: boolean;
  alternativePrice?: number;
  alternativeLabel?: string;
}> {
  const client = getRevenueAIClient();
  const dayOfWeek = context.time.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  const hourOfDay = context.time.getHours();

  // Determine if peak hour
  const isPeakHour = [12, 13, 19, 20, 21].includes(hourOfDay);
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  try {
    const result = await client.price({
      entity: {
        id: productId,
        type: 'product',
        category,
        vertical: 'restaurant',
        name: productName,
        basePrice,
        cost,
      },
      time: {
        dayOfWeek,
        hourOfDay,
        isPeakHour,
        isWeekend,
      },
      demand: {
        current: 60, // Would come from real-time data
        trend: 'stable',
      },
      inventory: {
        slotsRemaining: context.tablesRemaining,
        totalSlots: context.totalTables,
      },
      location: {
        city: context.city,
        tier: context.tier,
      },
      audience: context.customerId ? {
        userId: context.customerId,
        segment: context.customerSegment,
      } : undefined,
    });

    const alternative = result.alternativePrices?.[0];

    return {
      originalPrice: result.originalPrice,
      dynamicPrice: result.finalPrice,
      adjustment: result.adjustment,
      adjustmentType: result.adjustmentType,
      factors: result.factors.map(f => f.reason),
      canOfferAlternative: !!alternative,
      alternativePrice: alternative?.price,
      alternativeLabel: alternative?.label,
    };
  } catch (error) {
    // Fallback to base price on error
    logger.warn('[RevenueAI] Falling back to base price');
    return {
      originalPrice: basePrice,
      dynamicPrice: basePrice,
      adjustment: 0,
      adjustmentType: 'none',
      factors: [],
      canOfferAlternative: false,
    };
  }
}

/**
 * Restaurant Demand Forecast
 * Get staffing and inventory recommendations
 */
export async function getRestaurantForecast(
  merchantId: string,
  location: { city: string; tier?: 1 | 2 | 3 }
): Promise<{
  peakDay: string;
  peakHour: number;
  avgDailyDemand: number;
  staffingRecommendation: {
    morning: number;
    evening: number;
  };
}> {
  const client = getRevenueAIClient();

  try {
    const result = await client.forecast({
      merchantId,
      vertical: 'restaurant',
      category: 'general',
      location,
      horizon: 'week',
    });

    const firstForecast = result.forecasts[0];
    const peakHour = firstForecast?.peakHour || 19;

    return {
      peakDay: result.summary.peakDay || 'Saturday',
      peakHour,
      avgDailyDemand: result.summary.avgDailyDemand,
      staffingRecommendation: {
        morning: Math.ceil(firstForecast?.totalDemand || 50) / 20,
        evening: Math.ceil(firstForecast?.totalDemand || 50) / 10,
      },
    };
  } catch (error) {
    logger.warn('[RevenueAI] Forecast failed, using defaults');
    return {
      peakDay: 'Saturday',
      peakHour: 19,
      avgDailyDemand: 60,
      staffingRecommendation: {
        morning: 3,
        evening: 6,
      },
    };
  }
}

/**
 * Restaurant Offer Optimization
 * Get best offer for customer
 */
export async function getRestaurantOffer(
  merchantId: string,
  productId: string,
  basePrice: number,
  customerSegment?: 'new' | 'regular' | 'vip' | 'at_risk' | 'dormant',
  goal: 'revenue' | 'conversion' | 'retention' | 'acquisition' = 'conversion'
): Promise<{
  shouldOffer: boolean;
  offerType?: string;
  offerValue?: number;
  expectedRevenue?: number;
}> {
  const client = getRevenueAIClient();

  try {
    const result = await client.optimizeOffer({
      merchantId,
      entityId: productId,
      basePrice,
      audience: customerSegment ? { segment: customerSegment } : undefined,
      optimizationGoal: goal,
    });

    if (result.recommendedOffer) {
      return {
        shouldOffer: true,
        offerType: result.recommendedOffer.type,
        offerValue: result.recommendedOffer.value,
        expectedRevenue: result.alternatives[0]?.expectedRevenue,
      };
    }

    return { shouldOffer: false };
  } catch (error) {
    return { shouldOffer: false };
  }
}

/**
 * Restaurant Cashback Optimization
 * Get optimal cashback for customer
 */
export async function getRestaurantCashback(
  merchantId: string,
  customerId: string,
  orderValue: number,
  customerData: {
    segment: 'new' | 'regular' | 'vip' | 'at_risk' | 'dormant';
    ltv: number;
    churnRisk: number;
  }
): Promise<{
  cashbackAmount: number;
  cashbackRate: number;
  reason: string;
}> {
  const client = getRevenueAIClient();

  try {
    const result = await client.optimizeCashback({
      merchantId,
      userId: customerId,
      orderValue,
      category: 'food',
      vertical: 'restaurant',
      context: {
        audience: customerData,
      },
    });

    return {
      cashbackAmount: result.recommendedCashback,
      cashbackRate: result.rate,
      reason: result.reason,
    };
  } catch (error) {
    // Default cashback on error
    return {
      cashbackAmount: Math.round(orderValue * 0.05),
      cashbackRate: 0.05,
      reason: 'Standard cashback rate',
    };
  }
}

/**
 * Revenue Copilot - Goal-based planning
 * "How can I make ₹50K more this month?"
 */
export async function getRevenuePlan(
  merchantId: string,
  goalType: 'revenue' | 'customers' | 'orders' | 'retention',
  target: number,
  timeframe: 'week' | 'month' | 'quarter'
): Promise<{
  goal: { type: string; target: number };
  recommendations: Array<{
    title: string;
    impact: number;
    priority: string;
  }>;
  totalExpectedUplift: number;
}> {
  const client = getRevenueAIClient();

  try {
    const result = await client.getRevenuePlan({
      merchantId,
      goal: {
        type: goalType,
        target,
        timeframe,
      },
    });

    return {
      goal: result.goal,
      recommendations: result.recommendations.map(r => ({
        title: r.title,
        impact: r.expectedImpact,
        priority: r.priority,
      })),
      totalExpectedUplift: result.totalExpectedUplift,
    };
  } catch (error) {
    logger.error('[RevenueAI] Revenue plan failed:', error);
    throw error;
  }
}

/**
 * MerchantGPT - Conversational advisor
 * Ask business questions in natural language
 */
export async function askMerchantAdvisor(
  merchantId: string,
  question: string,
  conversationId?: string
): Promise<{
  response: string;
  intent: string;
  actions?: Array<{ title: string; id: string }>;
  followUpQuestions?: string[];
}> {
  const client = getRevenueAIClient();

  try {
    const result = await client.chat({
      merchantId,
      message: question,
      conversationId,
    });

    return {
      response: result.response,
      intent: result.intent,
      actions: result.actions?.map(a => ({ title: a.title, id: a.id })),
      followUpQuestions: result.followUpQuestions,
    };
  } catch (error) {
    logger.error('[RevenueAI] Chat failed:', error);
    return {
      response: 'Sorry, I had trouble processing your question. Please try again.',
      intent: 'error',
    };
  }
}

/**
 * Benchmark Score
 * Get merchant's revenue score
 */
export async function getMerchantBenchmark(
  merchantId: string
): Promise<{
  score: number;
  percentile: string;
  grade: string;
  metrics: Array<{ metric: string; score: number }>;
}> {
  const client = getRevenueAIClient();

  try {
    const result = await client.getBenchmark(merchantId);

    return {
      score: result.overallScore,
      percentile: result.percentile,
      grade: result.letterGrade,
      metrics: result.breakdown.map(b => ({
        metric: b.metric,
        score: b.score,
      })),
    };
  } catch (error) {
    return {
      score: 70,
      percentile: 'Top 50%',
      grade: 'B',
      metrics: [],
    };
  }
}

/**
 * Customer Segments
 * Get behavioral segments for merchant
 */
export async function getCustomerSegments(
  merchantId: string
): Promise<{
  segments: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  insights: Array<{ opportunity: string; action: string }>;
}> {
  const client = getRevenueAIClient();

  try {
    const result = await client.getSegments(merchantId);

    return {
      segments: result.segments.map(s => ({
        name: s.name,
        count: s.count,
        percentage: s.percentage,
      })),
      insights: result.insights?.map((i: { opportunity: string; action: string }) => ({
        opportunity: i.opportunity,
        action: i.action,
      })) || [],
    };
  } catch (error) {
    return {
      segments: [],
      insights: [],
    };
  }
}

// ================== EXPORTS ==================

export {
  RevenueAIClient,
  getRevenueAIClient,
};
