import { z } from 'zod';

// Lift Study Schemas
export const CreateLiftStudySchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(['brand_lift', 'conversion_lift', 'both']),
  description: z.string().optional(),
  methodology: z.enum(['randomized_control', 'geo_targeting', 'matched_market', 'holdout']),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  budget: z.number().positive().optional(),
  targetSampleSize: z.number().positive().optional(),
  confidenceLevel: z.number().min(0.8).max(0.99).optional(),
  minimumDetectableEffect: z.number().positive().optional(),
  targetAudience: z.object({
    demographics: z.object({
      age: z.array(z.number()).optional(),
      gender: z.array(z.string()).optional(),
      location: z.array(z.string()).optional(),
      income: z.enum(['low', 'medium', 'high', 'all']).optional()
    }).optional(),
    interests: z.array(z.string()).optional(),
    behaviors: z.array(z.string()).optional()
  }).optional(),
  controlGroupSize: z.number().min(0.01).max(0.5).optional(),
  treatmentGroupSize: z.number().min(0.01).max(0.99).optional(),
  metrics: z.array(z.enum([
    'awareness', 'consideration', 'intent', 'ad_recall',
    'purchase_intent', 'conversion_rate', 'revenue_per_user',
    'engagement_rate', 'click_through_rate', 'brand_affinity'
  ])).optional(),
  campaignIds: z.array(z.string()).optional(),
  platform: z.enum(['facebook', 'google', 'tiktok', 'instagram', 'youtube', 'linkedin', 'all']).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional()
});

export const UpdateLiftStudySchema = CreateLiftStudySchema.partial();

export const StartLiftStudySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

export const BrandLiftSurveySchema = z.object({
  respondentId: z.string().min(1),
  treatmentGroup: z.boolean(),
  surveyType: z.enum(['pre', 'post', 'both']),
  responses: z.object({
    awareness: z.object({
      unaided: z.boolean().optional(),
      aided: z.boolean().optional(),
      score: z.number().min(0).max(100).optional()
    }).optional(),
    consideration: z.number().min(0).max(100).optional(),
    intent: z.number().min(0).max(100).optional(),
    adRecall: z.object({
      exact: z.boolean().optional(),
      vague: z.boolean().optional(),
      none: z.boolean().optional()
    }).optional(),
    brandPerception: z.record(z.number()).optional(),
    purchaseIntent: z.number().min(0).max(100).optional(),
    recommendationLikelihood: z.number().min(0).max(10).optional(),
    sentiment: z.enum(['positive', 'neutral', 'negative']).optional()
  }),
  demographics: z.object({
    age: z.number().optional(),
    gender: z.string().optional(),
    location: z.string().optional(),
    income: z.string().optional()
  }).optional(),
  timestamp: z.string().datetime().optional()
});

export const ConversionLiftSchema = z.object({
  treatmentGroup: z.boolean(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  metrics: z.object({
    conversions: z.number().int().nonnegative().optional(),
    conversionValue: z.number().nonnegative().optional(),
    revenue: z.number().nonnegative().optional(),
    visits: z.number().int().nonnegative().optional(),
    engagementTime: z.number().nonnegative().optional(),
    pageViews: z.number().int().nonnegative().optional(),
    addToCart: z.number().int().nonnegative().optional(),
    checkoutStarted: z.number().int().nonnegative().optional(),
    purchases: z.number().int().nonnegative().optional(),
    purchaseValue: z.number().nonnegative().optional()
  }),
  timestamp: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional()
});

export const SurveyQuestionSchema = z.object({
  questionId: z.string(),
  questionType: z.enum(['single_choice', 'multiple_choice', 'scale', 'open_ended', 'ranking']),
  question: z.string(),
  options: z.array(z.object({
    value: z.string(),
    label: z.string()
  })).optional(),
  scaleMin: z.number().optional(),
  scaleMax: z.number().optional(),
  required: z.boolean().optional(),
  category: z.enum([
    'awareness', 'perception', 'intent', 'satisfaction',
    'demographic', 'behavior', 'attitude'
  ]).optional()
});

export const CreateSurveySchema = z.object({
  studyId: z.string().min(1),
  surveyType: z.enum(['brand_lift', 'conversion_lift', 'custom']),
  methodology: z.enum(['online_panel', 'in_app', 'email', 'sms', 'phone']),
  questions: z.array(SurveyQuestionSchema).min(1),
  targetSampleSize: z.number().positive(),
  incentiveAmount: z.number().nonnegative().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  targeting: z.object({
    demographics: z.record(z.any()).optional(),
    behaviors: z.array(z.string()).optional(),
    location: z.array(z.string()).optional()
  }).optional()
});

// Type exports
export type CreateLiftStudyInput = z.infer<typeof CreateLiftStudySchema>;
export type UpdateLiftStudyInput = z.infer<typeof UpdateLiftStudySchema>;
export type StartLiftStudyInput = z.infer<typeof StartLiftStudySchema>;
export type BrandLiftSurveyInput = z.infer<typeof BrandLiftSurveySchema>;
export type ConversionLiftInput = z.infer<typeof ConversionLiftSchema>;
export type CreateSurveyInput = z.infer<typeof CreateSurveySchema>;