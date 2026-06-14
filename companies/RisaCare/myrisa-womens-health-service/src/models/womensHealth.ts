/**
 * MyRisa Women's Health Service - Types
 *
 * Domains: Cycle, Fertility, Pregnancy, PCOS, Menopause
 */

import { z } from 'zod';

// ============================================
// MENSTRUAL CYCLE
// ============================================

export const MenstrualCycleSchema = z.object({
  id: z.string(),
  userId: z.string(),
  startDate: z.string(), // ISO date
  endDate: z.string().optional(),
  duration: z.number().optional(), // days
  flowIntensity: z.enum(['light', 'medium', 'heavy']).optional(),
  symptoms: z.array(z.object({
    name: z.string(),
    severity: z.enum(['mild', 'moderate', 'severe']).optional()
  })).default([]),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type MenstrualCycle = z.infer<typeof MenstrualCycleSchema>;

// Cycle Settings
export const CycleSettingsSchema = z.object({
  userId: z.string(),
  averageCycleLength: z.number().default(28), // days
  averagePeriodLength: z.number().default(5), // days
  cycleGoal: z.enum(['track_only', 'avoid_pregnancy', 'try_conceive', 'irregular']).default('track_only'),
  lastUpdated: z.string()
});

export type CycleSettings = z.infer<typeof CycleSettingsSchema>;

// Cycle Prediction
export interface CyclePrediction {
  nextPeriodStart: string;
  nextPeriodEnd: string;
  fertileWindowStart: string;
  fertileWindowEnd: string;
  ovulationDate: string;
  confidence: number; // 0-100
  cycleLength: number;
}

// ============================================
// FERTILITY
// ============================================

export const FertilityRecordSchema = z.object({
  id: z.string(),
  userId: z.string(),
  date: z.string(),
  cycleDay: z.number().optional(),
  bbt: z.number().optional(), // Basal body temperature (°F)
  cervicalMucus: z.enum(['dry', 'sticky', 'creamy', 'watery', 'egg_white']).optional(),
  cervixPosition: z.enum(['low', 'medium', 'high']).optional(),
  ovulationTest: z.enum(['negative', 'positive', 'invalid']).optional(),
  lhSurge: z.boolean().optional(),
  spotting: z.boolean().optional(),
  notes: z.string().optional(),
  createdAt: z.string()
});

export type FertilityRecord = z.infer<typeof FertilityRecordSchema>;

// Fertility Status
export const FertilityStatusSchema = z.object({
  userId: z.string(),
  intention: z.enum(['trying', 'preventing', 'neither', 'already_pregnant']).default('neither'),
  conceptionAttempts: z.number().default(0),
  tryingSince: z.string().optional(),
  fertilityFactors: z.array(z.object({
    factor: z.string(),
    impact: z.enum(['positive', 'negative', 'neutral'])
  })).default([]),
  recommendations: z.array(z.string()).default([]),
  lastUpdated: z.string()
});

export type FertilityStatus = z.infer<typeof FertilityStatusSchema>;

// ============================================
// PREGNANCY
// ============================================

export const PregnancySchema = z.object({
  id: z.string(),
  userId: z.string(),
  conceptionDate: z.string().optional(),
  dueDate: z.string(),
  status: z.enum(['planning', 'confirmed', 'miscarriage', 'abortion', 'delivered', 'ectopic']),
  trimester: z.number().min(1).max(3).optional(),
  outcomes: z.object({
    deliveryDate: z.string().optional(),
    deliveryType: z.enum(['natural', 'c_section']).optional(),
    complications: z.array(z.string()).default([]),
    babyGender: z.enum(['male', 'female', 'unknown']).optional(),
    babyWeight: z.number().optional(),
    babyHeight: z.number().optional()
  }).optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type Pregnancy = z.infer<typeof PregnancySchema>;

// Pregnancy Week
export interface PregnancyWeek {
  week: number;
  startDate: string;
  endDate: string;
  trimester: number;
  babySize: string;
  babyWeight: string;
  development: string[];
  motherSymptoms: string[];
  recommendations: string[];
  weekNumber: string; // "Week 12"
}

// Pregnancy Milestone
export interface PregnancyMilestone {
  week: number;
  title: string;
  description: string;
  type: 'development' | 'checkup' | 'test' | 'decision';
}

// ============================================
// PCOS
// ============================================

export const PCOSRecordSchema = z.object({
  id: z.string(),
  userId: z.string(),
  date: z.string(),
  symptoms: z.array(z.object({
    name: z.string(),
    severity: z.enum(['mild', 'moderate', 'severe'])
  })).default([]),
  weight: z.number().optional(),
  bmi: z.number().optional(),
  hirsutismScore: z.number().optional(), // Ferriman-Gallwey score
  acneSeverity: z.enum(['none', 'mild', 'moderate', 'severe']).optional(),
  hairLoss: z.enum(['none', 'mild', 'moderate', 'severe']).optional(),
  notes: z.string().optional(),
  createdAt: z.string()
});

export type PCOSRecord = z.infer<typeof PCOSRecordSchema>;

// PCOS Management Plan
export interface PCOSManagementPlan {
  userId: string;
  diagnosisDate: string;
  treatmentGoals: string[];
  lifestyleRecommendations: {
    nutrition: string[];
    exercise: string[];
    weightManagement: string[];
  };
  medicationRecommendations: string[];
  monitoringSchedule: string[];
  followUpFrequency: string;
}

// ============================================
// MENOPAUSE
// ============================================

export const MenopauseRecordSchema = z.object({
  id: z.string(),
  userId: z.string(),
  date: z.string(),
  type: z.enum(['perimenopause', 'menopause', 'postmenopause']),
  symptoms: z.array(z.object({
    name: z.string(),
    severity: z.enum(['mild', 'moderate', 'severe']),
    frequency: z.enum(['rarely', 'sometimes', 'often', 'always'])
  })).default([]),
  lastPeriodDate: z.string().optional(),
  hormoneTherapy: z.object({
    type: z.string().optional(),
    dosage: z.string().optional(),
    startDate: z.string().optional()
  }).optional(),
  notes: z.string().optional(),
  createdAt: z.string()
});

export type MenopauseRecord = z.infer<typeof MenopauseRecordSchema>;

// ============================================
// WOMEN'S HEALTH PROFILE
// ============================================

export const WomensHealthProfileSchema = z.object({
  userId: z.string(),
  dateOfBirth: z.string().optional(),
  ageAtMenarche: z.number().optional(),
  cycleLength: z.number().default(28),
  periodLength: z.number().default(5),
  lastPeriodDate: z.string().optional(),
  flow: z.enum(['light', 'medium', 'heavy']).default('medium'),
  menstrualStatus: z.enum(['regular', 'irregular', 'no_period', 'pregnant', 'menopause', 'unknown']).default('unknown'),
  conditions: z.array(z.enum(['pcos', 'endometriosis', 'fibroids', 'pmdd', 'none'])).default(['none']),
  pregnancyHistory: z.object({
    pregnancies: z.number().default(0),
    liveBirths: z.number().default(0),
    miscarriages: z.number().default(0),
    abortions: z.number().default(0)
  }).default({}),
  contraceptiveHistory: z.array(z.object({
    method: z.string(),
    startDate: z.string(),
    endDate: z.string().optional()
  })).default([]),
  lastUpdated: z.string()
});

export type WomensHealthProfile = z.infer<typeof WomensHealthProfileSchema>;

// ============================================
// INSIGHTS & ANALYTICS
// ============================================

export interface CycleAnalytics {
  averageCycleLength: number;
  averagePeriodLength: number;
  cycleRegularity: number; // 0-100
  mostCommonSymptoms: Array<{ symptom: string; frequency: number }>;
  flowPattern: string;
  painLevel: number;
  nextPeriodConfidence: number;
}

export interface HealthInsights {
  cycleHealth: {
    score: number; // 0-100
    status: 'excellent' | 'good' | 'fair' | 'needs_attention';
    concerns: string[];
    recommendations: string[];
  };
  fertilityWindow: {
    daysUntilNext: number;
    optimalDays: number[];
  };
  hormonalBalance: {
    score: number;
    phase: 'menstrual' | 'follicular' | 'ovulation' | 'luteal';
    recommendations: string[];
  };
}

// ============================================
// REMINDERS
// ============================================

export const ReminderSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.enum(['period', 'ovulation', 'contraception', 'medication', 'appointment', 'custom']),
  title: z.string(),
  description: z.string().optional(),
  time: z.string(), // HH:mm
  days: z.array(z.number()).default([]), // 0-6 (Sun-Sat)
  enabled: z.boolean().default(true),
  leadTime: z.number().default(0), // days before event
  lastTriggered: z.string().optional(),
  createdAt: z.string()
});

export type Reminder = z.infer<typeof ReminderSchema>;

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