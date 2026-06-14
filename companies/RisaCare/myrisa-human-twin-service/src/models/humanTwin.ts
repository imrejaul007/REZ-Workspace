import { z } from 'zod';

// Domain types
export type DomainType =
  | 'physical_health'
  | 'mental_wellness'
  | 'sexual_wellness'
  | 'lifestyle'
  | 'work_life'
  | 'family'
  | 'relationship';

// Domain weights for overall score calculation
export const DOMAIN_WEIGHTS: Record<DomainType, number> = {
  physical_health: 0.20,
  mental_wellness: 0.20,
  sexual_wellness: 0.10,
  lifestyle: 0.15,
  work_life: 0.12,
  family: 0.13,
  relationship: 0.10,
};

// Domain score schema
export const DomainScoreSchema = z.object({
  domain: z.enum([
    'physical_health',
    'mental_wellness',
    'sexual_wellness',
    'lifestyle',
    'work_life',
    'family',
    'relationship',
  ]),
  score: z.number().min(0).max(100),
  trend: z.enum(['improving', 'stable', 'declining']),
  lastUpdated: z.string().datetime(),
  dataPoints: z.number().optional(),
  contributingFactors: z.array(z.string()).optional(),
});

export type DomainScore = z.infer<typeof DomainScoreSchema>;

// Timeline event schema
export const TimelineEventSchema = z.object({
  id: z.string(),
  date: z.string().datetime(),
  type: z.enum([
    'health_milestone',
    'wellness_check',
    'lifestyle_change',
    'relationship_event',
    'work_event',
    'family_event',
    'mental_health_event',
    'prediction',
  ]),
  title: z.string(),
  description: z.string(),
  impact: z.enum(['positive', 'negative', 'neutral']),
  affectedDomains: z.array(z.enum([
    'physical_health',
    'mental_wellness',
    'sexual_wellness',
    'lifestyle',
    'work_life',
    'family',
    'relationship',
  ])),
  metadata: z.record(z.any()).optional(),
});

export type TimelineEvent = z.infer<typeof TimelineEventSchema>;

// Twin insight schema
export const TwinInsightSchema = z.object({
  id: z.string(),
  type: z.enum([
    'correlation',
    'pattern',
    'recommendation',
    'warning',
    'achievement',
    'opportunity',
  ]),
  title: z.string(),
  description: z.string(),
  confidence: z.number().min(0).max(1),
  domains: z.array(z.enum([
    'physical_health',
    'mental_wellness',
    'sexual_wellness',
    'lifestyle',
    'work_life',
    'family',
    'relationship',
  ])),
  actionItems: z.array(z.string()).optional(),
  generatedAt: z.string().datetime(),
});

export type TwinInsight = z.infer<typeof TwinInsightSchema>;

// Twin prediction schema
export const TwinPredictionSchema = z.object({
  id: z.string(),
  type: z.enum([
    'health_risk',
    'opportunity',
    'lifestyle',
    'relationship',
    'career',
    'wellness_trend',
  ]),
  title: z.string(),
  description: z.string(),
  probability: z.number().min(0).max(1),
  timeframe: z.enum([
    'next_week',
    'next_month',
    'next_quarter',
    'next_year',
  ]),
  affectedDomains: z.array(z.enum([
    'physical_health',
    'mental_wellness',
    'sexual_wellness',
    'lifestyle',
    'work_life',
    'family',
    'relationship',
  ])),
  recommendations: z.array(z.string()),
  riskLevel: z.enum(['low', 'medium', 'high']),
  generatedAt: z.string().datetime(),
});

export type TwinPrediction = z.infer<typeof TwinPredictionSchema>;

// Human Twin State - unified state across all domains
export const HumanTwinStateSchema = z.object({
  userId: z.string(),
  overallScore: z.number().min(0).max(100),
  overallTrend: z.enum(['improving', 'stable', 'declining']),
  domains: z.object({
    physical_health: DomainScoreSchema,
    mental_wellness: DomainScoreSchema,
    sexual_wellness: DomainScoreSchema,
    lifestyle: DomainScoreSchema,
    work_life: DomainScoreSchema,
    family: DomainScoreSchema,
    relationship: DomainScoreSchema,
  }),
  insights: z.array(TwinInsightSchema),
  predictions: z.array(TwinPredictionSchema),
  timeline: z.array(TimelineEventSchema),
  twinHealth: z.enum(['thriving', 'stable', 'needs_attention', 'critical']),
  lastSynced: z.string().datetime(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type HumanTwinState = z.infer<typeof HumanTwinStateSchema>;

// Source service data schemas
export const PhysicalHealthDataSchema = z.object({
  userId: z.string(),
  bmi: z.number().optional(),
  bloodPressure: z.object({
    systolic: z.number(),
    diastolic: z.number(),
  }).optional(),
  heartRate: z.number().optional(),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']).optional(),
  sleepHours: z.number().optional(),
  hydrationLevel: z.number().optional(),
  menstrualCycle: z.object({
    lastPeriod: z.string().optional(),
    cycleLength: z.number().optional(),
    flow: z.enum(['light', 'moderate', 'heavy']).optional(),
  }).optional(),
  symptoms: z.array(z.string()).optional(),
  lastUpdated: z.string().datetime(),
});

export type PhysicalHealthData = z.infer<typeof PhysicalHealthDataSchema>;

export const MentalWellnessDataSchema = z.object({
  userId: z.string(),
  mood: z.number().min(1).max(10).optional(),
  stressLevel: z.number().min(1).max(10).optional(),
  anxietyLevel: z.number().min(1).max(10).optional(),
  depressionRisk: z.number().min(0).max(1).optional(),
  mindfulnessMinutes: z.number().optional(),
  therapySessions: z.number().optional(),
  journalEntries: z.array(z.string()).optional(),
  emotionalTriggers: z.array(z.string()).optional(),
  lastUpdated: z.string().datetime(),
});

export type MentalWellnessData = z.infer<typeof MentalWellnessDataSchema>;

export const SexualWellnessDataSchema = z.object({
  userId: z.string(),
  libidoLevel: z.number().min(1).max(10).optional(),
  sexualSatisfaction: z.number().min(1).max(10).optional(),
  relationshipIntimacy: z.number().min(1).max(10).optional(),
  safePractices: z.boolean().optional(),
  stdScreening: z.object({
    lastScreening: z.string().optional(),
    results: z.string().optional(),
  }).optional(),
  reproductiveHealth: z.object({
    contraception: z.string().optional(),
    familyPlanningGoals: z.string().optional(),
  }).optional(),
  lastUpdated: z.string().datetime(),
});

export type SexualWellnessData = z.infer<typeof SexualWellnessDataSchema>;

export const LifestyleDataSchema = z.object({
  userId: z.string(),
  nutritionScore: z.number().min(0).max(100).optional(),
  exerciseFrequency: z.number().optional(),
  screenTime: z.number().optional(),
  socialInteractions: z.number().optional(),
  hobbies: z.array(z.string()).optional(),
  substanceUse: z.object({
    alcohol: z.enum(['none', 'occasional', 'moderate', 'heavy']).optional(),
    smoking: z.boolean().optional(),
  }).optional(),
  lastUpdated: z.string().datetime(),
});

export type LifestyleData = z.infer<typeof LifestyleDataSchema>;

export const WorkLifeDataSchema = z.object({
  userId: z.string(),
  workLifeBalance: z.number().min(1).max(10).optional(),
  jobSatisfaction: z.number().min(1).max(10).optional(),
  commuteSatisfaction: z.number().min(1).max(10).optional(),
  workHours: z.number().optional(),
  remoteWorkRatio: z.number().min(0).max(1).optional(),
  careerGoals: z.array(z.string()).optional(),
  lastUpdated: z.string().datetime(),
});

export type WorkLifeData = z.infer<typeof WorkLifeDataSchema>;

export const FamilyDataSchema = z.object({
  userId: z.string(),
  familySatisfaction: z.number().min(1).max(10).optional(),
  familyInteractions: z.number().optional(),
  familyEvents: z.array(z.string()).optional(),
  supportSystem: z.enum(['strong', 'moderate', 'weak']).optional(),
  caregivingResponsibilities: z.boolean().optional(),
  familyGoals: z.array(z.string()).optional(),
  lastUpdated: z.string().datetime(),
});

export type FamilyData = z.infer<typeof FamilyDataSchema>;

export const RelationshipDataSchema = z.object({
  userId: z.string(),
  relationshipStatus: z.enum(['single', 'dating', 'committed', 'married', 'divorced', 'widowed']).optional(),
  relationshipSatisfaction: z.number().min(1).max(10).optional(),
  communicationQuality: z.number().min(1).max(10).optional(),
  conflictFrequency: z.number().optional(),
  dateNightFrequency: z.number().optional(),
  partnerHealth: z.object({
    physicalHealth: z.number().optional(),
    mentalWellness: z.number().optional(),
  }).optional(),
  lastUpdated: z.string().datetime(),
});

export type RelationshipData = z.infer<typeof RelationshipDataSchema>;

// Aggregated source data
export const AggregatedSourceDataSchema = z.object({
  physicalHealth: PhysicalHealthDataSchema.optional(),
  mentalWellness: MentalWellnessDataSchema.optional(),
  sexualWellness: SexualWellnessDataSchema.optional(),
  lifestyle: LifestyleDataSchema.optional(),
  workLife: WorkLifeDataSchema.optional(),
  family: FamilyDataSchema.optional(),
  relationship: RelationshipDataSchema.optional(),
});

export type AggregatedSourceData = z.infer<typeof AggregatedSourceDataSchema>;

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// Domain update request
export interface DomainUpdateRequest {
  domain: DomainType;
  score: number;
  metadata?: Record<string, any>;
}

// Insight generation request
export interface InsightGenerationRequest {
  includeCorrelations: boolean;
  includeRecommendations: boolean;
  minConfidence: number;
}

// Prediction generation request
export interface PredictionGenerationRequest {
  timeframe: 'next_week' | 'next_month' | 'next_quarter' | 'next_year';
  includeRisks: boolean;
  includeOpportunities: boolean;
}