import { z } from 'zod';

// ============ Outcome Types ============

export enum OutcomeType {
  REVENUE = 'revenue',
  LTV = 'ltv',
  CHURN = 'churn',
  CONVERSION = 'conversion',
  RETENTION = 'retention',
  ENGAGEMENT = 'engagement',
}

export enum OutcomeStatus {
  ACTIVE = 'active',
  ACHIEVED = 'achieved',
  MISSED = 'missed',
  AT_RISK = 'at_risk',
  PAUSED = 'paused',
}

export enum InterventionType {
  DISCOUNT = 'discount',
  LOYALTY_OFFER = 'loyalty_offer',
  PERSONALIZED_CONTENT = 'personalized_content',
  RE_ENGAGEMENT = 're_engagement',
  UPSELL = 'upsell',
  CROSS_SELL = 'cross_sell',
  WIN_BACK = 'win_back',
  PREMIUM_UPGRADE = 'premium_upgrade',
  LOYALTY_TIER = 'loyalty_tier',
  REFERRAL_INCENTIVE = 'referral_incentive',
}

export enum PredictionModel {
  LINEAR_REGRESSION = 'linear_regression',
  RANDOM_FOREST = 'random_forest',
  GRADIENT_BOOSTING = 'gradient_boosting',
  EXPONENTIAL_SMOOTHING = 'exponential_smoothing',
  ARIMA = 'arima',
  PROPHET = 'prophet',
  LSTM = 'lstm',
  ENSEMBLE = 'ensemble',
}

// ============ Zod Schemas ============

export const BusinessGoalSchema = z.object({
  goalId: z.string(),
  businessId: z.string(),
  type: z.nativeEnum(OutcomeType),
  targetValue: z.number(),
  currentValue: z.number(),
  startDate: z.date(),
  targetDate: z.date(),
  status: z.nativeEnum(OutcomeStatus).default(OutcomeStatus.ACTIVE),
  metadata: z.record(z.any()).optional(),
});

export type BusinessGoal = z.infer<typeof BusinessGoalSchema>;

export const PredictionInputSchema = z.object({
  businessId: z.string(),
  outcomeType: z.nativeEnum(OutcomeType),
  horizonDays: z.number().min(1).max(365).default(30),
  features: z.record(z.number()).optional(),
  historicalDataPoints: z.number().min(7).default(90),
});

export type PredictionInput = z.infer<typeof PredictionInputSchema>;

export const PredictionResultSchema = z.object({
  predictionId: z.string(),
  businessId: z.string(),
  outcomeType: z.nativeEnum(OutcomeType),
  predictedValue: z.number(),
  confidence: z.number().min(0).max(1),
  predictionDate: z.date(),
  horizonDate: z.date(),
  model: z.nativeEnum(PredictionModel),
  factors: z.array(z.object({
    name: z.string(),
    impact: z.number(),
    direction: z.enum(['positive', 'negative', 'neutral']),
  })),
  scenario: z.object({
    optimistic: z.number(),
    base: z.number(),
    pessimistic: z.number(),
  }).optional(),
});

export type PredictionResult = z.infer<typeof PredictionResultSchema>;

export const InterventionSchema = z.object({
  interventionId: z.string(),
  goalId: z.string(),
  businessId: z.string(),
  type: z.nativeEnum(InterventionType),
  description: z.string(),
  expectedImpact: z.number(),
  confidence: z.number().min(0).max(1),
  priority: z.number().min(1).max(10),
  cost: z.number().optional(),
  estimatedROI: z.number().optional(),
  createdAt: z.date(),
  status: z.enum(['pending', 'applied', 'completed', 'cancelled']).default('pending'),
  appliedAt: z.date().optional(),
  result: z.object({
    actualImpact: z.number().optional(),
    achieved: z.boolean().optional(),
    notes: z.string().optional(),
  }).optional(),
});

export type Intervention = z.infer<typeof InterventionSchema>;

export const InterventionRecommendationSchema = z.object({
  recommendations: z.array(z.object({
    interventionType: z.nativeEnum(InterventionType),
    priority: z.number(),
    expectedOutcome: z.object({
      metric: z.string(),
      improvement: z.number(),
      timeframe: z.string(),
    }),
    actions: z.array(z.object({
      step: z.number(),
      action: z.string(),
      parameters: z.record(z.any).optional(),
    })),
    estimatedCost: z.number().optional(),
    estimatedROI: z.number().optional(),
    riskLevel: z.enum(['low', 'medium', 'high']),
  })),
  reasoning: z.string(),
  confidence: z.number().min(0).max(1),
});

export type InterventionRecommendation = z.infer<typeof InterventionRecommendationSchema>;

export const OutcomeTrackingEventSchema = z.object({
  eventId: z.string(),
  businessId: z.string(),
  goalId: z.string().optional(),
  outcomeType: z.nativeEnum(OutcomeType),
  value: z.number(),
  previousValue: z.number().optional(),
  change: z.number().optional(),
  changePercent: z.number().optional(),
  timestamp: z.date(),
  source: z.string(),
  metadata: z.record(z.any).optional(),
});

export type OutcomeTrackingEvent = z.infer<typeof OutcomeTrackingEventSchema>;

export const LearningOutcomeSchema = z.object({
  outcomeId: z.string(),
  businessId: z.string(),
  predictionId: z.string(),
  interventionId: z.string().optional(),
  predictedValue: z.number(),
  actualValue: z.number(),
  error: z.number(),
  errorPercent: z.number(),
  factors: z.array(z.object({
    name: z.string(),
    predicted: z.number(),
    actual: z.number(),
    contribution: z.number(),
  })),
  timestamp: z.date(),
  modelUsed: z.nativeEnum(PredictionModel),
  feedbackQuality: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
});

export type LearningOutcome = z.infer<typeof LearningOutcomeSchema>;

export const BusinessContextSchema = z.object({
  businessId: z.string(),
  businessName: z.string().optional(),
  industry: z.string().optional(),
  size: z.enum(['small', 'medium', 'large', 'enterprise']).optional(),
  metrics: z.object({
    monthlyRevenue: z.number().optional(),
    customerCount: z.number().optional(),
    avgOrderValue: z.number().optional(),
    churnRate: z.number().optional(),
    ltv: z.number().optional(),
    cac: z.number().optional(),
    conversionRate: z.number().optional(),
    retentionRate: z.number().optional(),
  }),
  historicalData: z.array(z.object({
    date: z.date(),
    revenue: z.number().optional(),
    customers: z.number().optional(),
    orders: z.number().optional(),
    churned: z.number().optional(),
  })).optional(),
  activeGoals: z.array(z.string()).optional(),
});

export type BusinessContext = z.infer<typeof BusinessContextSchema>;

// ============ API Request/Response Types ============

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  dependencies: {
    mongodb: 'connected' | 'disconnected';
    autonomousGrowthOrchestrator: 'reachable' | 'unreachable';
    merchantInsightsOs: 'reachable' | 'unreachable';
  };
}

export interface PredictOutcomeRequest {
  businessId: string;
  outcomeType: OutcomeType;
  horizonDays?: number;
  features?: Record<string, number>;
}

export interface PredictOutcomeResponse {
  prediction: PredictionResult;
  recommendations: InterventionRecommendation;
}

export interface TrackOutcomeRequest {
  businessId: string;
  goalId?: string;
  outcomeType: OutcomeType;
  value: number;
  source?: string;
  metadata?: Record<string, any>;
}

export interface GetRecommendationsRequest {
  businessId: string;
  goalId: string;
  maxRecommendations?: number;
}

export interface GetRecommendationsResponse {
  businessId: string;
  goalId: string;
  currentStatus: {
    targetValue: number;
    currentValue: number;
    progress: number;
    status: OutcomeStatus;
  };
  recommendations: InterventionRecommendation['recommendations'];
}

export interface GetBusinessOutcomesRequest {
  businessId: string;
  outcomeTypes?: OutcomeType[];
  status?: OutcomeStatus[];
  limit?: number;
}

export interface BusinessOutcomeSummary {
  businessId: string;
  outcomes: Array<{
    goalId: string;
    type: OutcomeType;
    targetValue: number;
    currentValue: number;
    progress: number;
    status: OutcomeStatus;
    predictedCompletion: Date | null;
    daysRemaining: number;
  }>;
  overallHealth: 'on_track' | 'at_risk' | 'behind';
}