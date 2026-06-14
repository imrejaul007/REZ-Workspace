/**
 * Type definitions for Conversion Optimization AI Service
 */

export interface OptimizationGoals {
  targetCPA?: number;      // Cost per acquisition
  targetROAS?: number;    // Return on ad spend
  targetConversions?: number;
}

export interface CurrentPerformance {
  cpa: number;
  roas: number;
  conversions: number;
  spend: number;
  revenue: number;
}

export interface BidAdjustment {
  time: Date;
  change: number;
  reason: string;
}

export interface AudienceChange {
  time: Date;
  change: string;
  reason: string;
}

export interface BudgetReallocation {
  time: Date;
  from: string;
  to: string;
  amount: number;
}

export interface AIAction {
  bidAdjustments: BidAdjustment[];
  audienceChanges: AudienceChange[];
  budgetReallocation: BudgetReallocation[];
}

export interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  action: string;
  expectedImpact: number;
  reason: string;
}

export interface CampaignOptimization {
  optimizationId: string;
  campaignId: string;
  status: 'active' | 'paused' | 'completed';
  goals: OptimizationGoals;
  currentPerformance: CurrentPerformance;
  aiActions: AIAction;
  recommendations: Recommendation[];
  startedAt: Date;
  updatedAt: Date;
}

export interface BidRecommendation {
  placementId: string;
  recommendedBid: number;
  maxBid: number;
  expectedCPC: number;
  expectedCTR: number;
  expectedConversions: number;
  confidence: number;
  reasoning: string;
}

export interface CampaignMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  ctr: number;
  cpc: number;
  cpa: number;
  roas: number;
}

export interface PlacementData {
  placementId: string;
  name: string;
  type: 'banner' | 'video' | 'native' | 'interstitial';
  historicalCTR: number;
  historicalCPC: number;
  audienceOverlap: number;
  competition: 'low' | 'medium' | 'high';
}

export interface TimeSlotPerformance {
  hour: number;
  dayOfWeek: number;
  avgCTR: number;
  avgCPC: number;
  conversionRate: number;
  confidence: number;
}

export interface ABTestRecommendation {
  testId: string;
  hypothesis: string;
  variantA: Record<string, unknown>;
  variantB: Record<string, unknown>;
  expectedLift: number;
  sampleSize: number;
  duration: number;
  status: 'pending' | 'running' | 'completed';
}

export interface CompetitorInsight {
  competitorId: string;
  avgBid: number;
  winRate: number;
  strategy: string;
  weakness: string;
}

export interface AudienceSegment {
  segmentId: string;
  name: string;
  size: number;
  conversionRate: number;
  avgOrderValue: number;
  lifetimeValue: number;
  performance: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface OptimizationInsights {
  campaignId: string;
  optimizationId: string;
  overallScore: number;
  topPerformers: string[];
  underperformers: string[];
  predictedWinners: string[];
  riskFactors: string[];
  opportunities: string[];
  generatedAt: Date;
}

export interface CreateOptimizationRequest {
  campaignId: string;
  goals: OptimizationGoals;
  maxBid?: number;
  budget?: number;
}

export interface BidOptimizationRequest {
  campaignId: string;
  placementId: string;
  currentBid: number;
  targetCPA?: number;
}

export interface JWTPayload {
  userId: string;
  advertiserId: string;
  role: string;
  iat: number;
  exp: number;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  total?: number;
  pages?: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationParams;
}