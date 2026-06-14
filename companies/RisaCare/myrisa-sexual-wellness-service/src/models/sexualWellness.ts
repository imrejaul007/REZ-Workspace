/**
 * MyRisa Sexual Wellness Service - Types
 *
 * Libido, Contraception, Reproductive Health, Intimacy
 */

import { z } from 'zod';

// ============================================
// SEXUAL HEALTH RECORD
// ============================================

export const SexualHealthRecordSchema = z.object({
  id: z.string(),
  userId: z.string(),
  date: z.string(),
  type: z.enum(['activity', 'libido', 'contraception', 'fertility', 'reproductive_health', 'std_screening', 'intimacy']),
  data: z.record(z.any()),
  notes: z.string().optional(),
  createdAt: z.string()
});

export type SexualHealthRecord = z.infer<typeof SexualHealthRecordSchema>;

// ============================================
// SEXUAL ACTIVITY
// ============================================

export const SexualActivitySchema = z.object({
  id: z.string(),
  userId: z.string(),
  date: z.string(),
  partnerId: z.string().optional(),
  type: z.enum(['solo', 'partner', 'group']),
  protectionUsed: z.boolean().default(false),
  contraceptionUsed: z.array(z.string()).default([]),
  satisfaction: z.number().min(1).max(10).optional(),
  painLevel: z.number().min(0).max(10).optional(),
  arousalLevel: z.number().min(1).max(10).optional(),
  orgasm: z.boolean().optional(),
  notes: z.string().optional(),
  createdAt: z.string()
});

export type SexualActivity = z.infer<typeof SexualActivitySchema>;

// ============================================
// LIBIDO TRACKING
// ============================================

export const LibidoRecordSchema = z.object({
  id: z.string(),
  userId: z.string(),
  date: z.string(),
  level: z.number().min(1).max(10),
  factors: z.array(z.enum([
    'hormonal', 'stress', 'sleep', 'medication', 'relationship',
    'fatigue', 'mental_health', 'exercise', 'diet', 'alcohol', 'other'
  ])).default([]),
  notes: z.string().optional(),
  createdAt: z.string()
});

export type LibidoRecord = z.infer<typeof LibidoRecordSchema>;

// ============================================
// CONTRACEPTION
// ============================================

export const ContraceptionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  method: z.enum([
    'condom', 'pill', 'iud', 'patch', 'ring', 'injection',
    'implant', 'diaphragm', 'fertility_awareness', 'withdrawal',
    'sterilization', 'none', 'emergency_pill'
  ]),
  brand: z.string().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  reminderTime: z.string().optional(),
  reminderEnabled: z.boolean().default(true),
  sideEffects: z.array(z.string()).default([]),
  effectiveness: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type Contraception = z.infer<typeof ContraceptionSchema>;

// ============================================
// REPRODUCTIVE HEALTH
// ============================================

export const ReproductiveHealthSchema = z.object({
  id: z.string(),
  userId: z.string(),
  date: z.string(),
  type: z.enum([
    'period', 'spotting', 'discharge', 'pain', 'infection',
    'std_test', 'pap_smear', 'mammogram', 'breast_exam', 'pelvic_exam'
  ]),
  result: z.enum(['normal', 'abnormal', 'positive', 'negative', 'pending']).optional(),
  details: z.string().optional(),
  followUpRequired: z.boolean().default(false),
  followUpDate: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string()
});

export type ReproductiveHealth = z.infer<typeof ReproductiveHealthSchema>;

// ============================================
// INTIMACY JOURNAL
// ============================================

export const IntimacyJournalSchema = z.object({
  id: z.string(),
  userId: z.string(),
  date: z.string(),
  emotionalIntimacy: z.number().min(1).max(10),
  physicalIntimacy: z.number().min(1).max(10),
  communicationScore: z.number().min(1).max(10),
  affection: z.number().min(1).max(10),
  qualityTime: z.number().min(1).max(10),
  thingsGratified: z.array(z.string()).default([]),
  thingsToImprove: z.array(z.string()).default([]),
  notes: z.string().optional(),
  createdAt: z.string()
});

export type IntimacyJournal = z.infer<typeof IntimacyJournalSchema>;

// ============================================
// STD SCREENING
// ============================================

export const STDScreeningSchema = z.object({
  id: z.string(),
  userId: z.string(),
  date: z.string(),
  tests: z.array(z.object({
    name: z.string(),
    result: z.enum(['positive', 'negative', 'pending']),
    date: z.string()
  })).default([]),
  nextScreeningDate: z.string().optional(),
  partnerTested: z.boolean().default(false),
  notes: z.string().optional(),
  createdAt: z.string()
});

export type STDScreening = z.infer<typeof STDScreeningSchema>;

// ============================================
// SEXUAL WELLNESS PROFILE
// ============================================

export const SexualWellnessProfileSchema = z.object({
  userId: z.string(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  sexualOrientation: z.enum(['straight', 'gay', 'lesbian', 'bisexual', 'asexual', 'other', 'prefer_not_to_say']).optional(),
  relationshipStatus: z.enum(['single', 'dating', 'relationship', 'married', 'divorced', 'widowed']).default('single'),
  sexuallyActive: z.boolean().default(false),
  partnerCount: z.number().default(0),
  lastSTDTest: z.string().optional(),
  preferences: z.object({
    communication: z.boolean().default(true),
    exploration: z.boolean().default(true),
    privacy: z.boolean().default(true)
  }).default({}),
  concerns: z.array(z.string()).default([]),
  lastUpdated: z.string()
});

export type SexualWellnessProfile = z.infer<typeof SexualWellnessProfileSchema>;

// ============================================
// ANALYTICS & INSIGHTS
// ============================================

export interface SexualWellnessInsights {
  overall: {
    wellnessScore: number; // 0-100
    status: 'excellent' | 'good' | 'fair' | 'needs_attention';
  };
  libido: {
    averageLevel: number;
    trend: 'increasing' | 'stable' | 'decreasing';
    factors: Array<{ factor: string; impact: string }>;
  };
  intimacy: {
    qualityScore: number;
    frequencyScore: number;
    satisfactionTrend: 'improving' | 'stable' | 'worsening';
  };
  contraception: {
    activeMethod: string | null;
    adherenceRate: number;
    nextReviewDate: string;
  };
  reproductiveHealth: {
    lastCheckup: string | null;
    nextDue: string | null;
    status: 'up_to_date' | 'due_soon' | 'overdue';
  };
  recommendations: string[];
}

export interface LibidoAnalytics {
  averageLevel: number;
  highestLevel: number;
  lowestLevel: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  commonFactors: Array<{ factor: string; count: number }>;
  recommendedFactors: string[];
}

export interface IntimacyAnalytics {
  averageQuality: number;
  frequencyPerMonth: number;
  satisfactionAverage: number;
  qualityTrend: 'improving' | 'stable' | 'worsening';
  partnerConnection: number;
}

// ============================================
// API RESPONSE
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}