/**
 * MyRisa Work-Life Balance Models
 * TypeScript types with Zod schemas for work-life tracking
 */

import { z } from 'zod';

// ==================== Enums ====================

export enum PTOType {
  VACATION = 'vacation',
  SICK = 'sick',
  PERSONAL = 'personal',
  BEREAVEMENT = 'bereavement',
  MATERNITY = 'maternity',
  PATERNITY = 'paternity',
  UNPAID = 'unpaid',
}

export enum BurnoutRiskLevel {
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum WorkScheduleType {
  FLEXIBLE = 'flexible',
  FIXED = 'fixed',
  REMOTE = 'remote',
  HYBRID = 'hybrid',
  SHIFT = 'shift',
}

// ==================== Work Record ====================

export const WorkRecordSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  workHours: z.number().min(0).max(24).default(0),
  meetingHours: z.number().min(0).max(24).default(0),
  deepWorkHours: z.number().min(0).max(24).default(0),
  productivity: z.number().min(0).max(100).default(0),
  energy: z.number().min(0).max(10).default(5),
  breaksTaken: z.number().min(0).default(0),
  overtimeHours: z.number().min(0).max(24).default(0),
  tasksCompleted: z.number().min(0).default(0),
  notes: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type WorkRecord = z.infer<typeof WorkRecordSchema>;

export const LogWorkRecordInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  workHours: z.number().min(0).max(24).optional(),
  meetingHours: z.number().min(0).max(24).optional(),
  deepWorkHours: z.number().min(0).max(24).optional(),
  productivity: z.number().min(0).max(100).optional(),
  energy: z.number().min(0).max(10).optional(),
  breaksTaken: z.number().min(0).optional(),
  overtimeHours: z.number().min(0).max(24).optional(),
  tasksCompleted: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export type LogWorkRecordInput = z.infer<typeof LogWorkRecordInputSchema>;

// ==================== PTO Record ====================

export const PTORecordSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().min(1),
  type: z.nativeEnum(PTOType),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  totalDays: z.number().min(0.5).max(365),
  reason: z.string().optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'cancelled']).default('pending'),
  approvedBy: z.string().optional(),
  approvedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type PTORecord = z.infer<typeof PTORecordSchema>;

export const LogPTOInputSchema = z.object({
  type: z.nativeEnum(PTOType),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().optional(),
});

export type LogPTOInput = z.infer<typeof LogPTOInputSchema>;

// ==================== Work-Life Settings ====================

export const WorkLifeSettingsSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().min(1),
  workSchedule: z.nativeEnum(WorkScheduleType).default(WorkScheduleType.HYBRID),
  workStartTime: z.string().regex(/^\d{2}:\d{2}$/).default('09:00'),
  workEndTime: z.string().regex(/^\d{2}:\d{2}$/).default('18:00'),
  workDaysPerWeek: z.number().min(1).max(7).default(5),
  targetWorkHoursPerDay: z.number().min(1).max(24).default(8),
  maxMeetingHoursPerDay: z.number().min(0).max(24).default(2),
  targetDeepWorkHoursPerDay: z.number().min(0).max(24).default(3),
  minBreaksPerDay: z.number().min(0).max(10).default(2),
  notificationsEnabled: z.boolean().default(true),
  burnoutAlertThreshold: z.number().min(0).max(100).default(70),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type WorkLifeSettings = z.infer<typeof WorkLifeSettingsSchema>;

export const WorkLifeSettingsInputSchema = z.object({
  workSchedule: z.nativeEnum(WorkScheduleType).optional(),
  workStartTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  workEndTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  workDaysPerWeek: z.number().min(1).max(7).optional(),
  targetWorkHoursPerDay: z.number().min(1).max(24).optional(),
  maxMeetingHoursPerDay: z.number().min(0).max(24).optional(),
  targetDeepWorkHoursPerDay: z.number().min(0).max(24).optional(),
  minBreaksPerDay: z.number().min(0).max(10).optional(),
  notificationsEnabled: z.boolean().optional(),
  burnoutAlertThreshold: z.number().min(0).max(100).optional(),
});

export type WorkLifeSettingsInput = z.infer<typeof WorkLifeSettingsInputSchema>;

// ==================== Work-Life Score ====================

export const WorkLifeScoreSchema = z.object({
  userId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  overallScore: z.number().min(0).max(100),
  workHoursScore: z.number().min(0).max(100),
  meetingScore: z.number().min(0).max(100),
  deepWorkScore: z.number().min(0).max(100),
  breakScore: z.number().min(0).max(100),
  energyScore: z.number().min(0).max(100),
  workLifeBalanceScore: z.number().min(0).max(100),
  trend: z.enum(['improving', 'stable', 'declining']).default('stable'),
  factors: z.object({
    overwork: z.boolean().default(false),
    meetingOverload: z.boolean().default(false),
    insufficientDeepWork: z.boolean().default(false),
    lowEnergy: z.boolean().default(false),
    insufficientBreaks: z.boolean().default(false),
  }),
  recommendations: z.array(z.string()).default([]),
  calculatedAt: z.string().datetime(),
});

export type WorkLifeScore = z.infer<typeof WorkLifeScoreSchema>;

// ==================== Burnout Assessment ====================

export const BurnoutAssessmentSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  riskLevel: z.nativeEnum(BurnoutRiskLevel),
  exhaustionScore: z.number().min(0).max(100),
  cynicismScore: z.number().min(0).max(100),
  professionalEfficacyScore: z.number().min(0).max(100),
  overallBurnoutScore: z.number().min(0).max(100),
  contributingFactors: z.array(z.string()).default([]),
  warningSigns: z.array(z.string()).default([]),
  recommendations: z.array(z.string()).default([]),
  recentWorkPatterns: z.object({
    avgWorkHoursPerDay: z.number().min(0).max(24),
    avgMeetingHoursPerDay: z.number().min(0).max(24),
    avgEnergyLevel: z.number().min(0).max(10),
    overtimeDaysLastWeek: z.number().min(0),
    ptoTakenLastMonth: z.number().min(0),
  }),
  calculatedAt: z.string().datetime(),
});

export type BurnoutAssessment = z.infer<typeof BurnoutAssessmentSchema>;

// ==================== Work Insights ====================

export const WorkInsightSchema = z.object({
  type: z.enum(['productivity', 'balance', 'burnout', 'schedule', 'energy']),
  title: z.string(),
  description: z.string(),
  severity: z.enum(['info', 'warning', 'critical']).default('info'),
  recommendation: z.string().optional(),
  data: z.record(z.any()).optional(),
});

export type WorkInsight = z.infer<typeof WorkInsightSchema>;

export const WorkInsightsResponseSchema = z.object({
  userId: z.string().min(1),
  period: z.object({
    startDate: z.string(),
    endDate: z.string(),
    days: z.number(),
  }),
  summary: z.object({
    avgWorkHoursPerDay: z.number(),
    avgProductivity: z.number(),
    avgEnergyLevel: z.number(),
    totalPTOUsed: z.number(),
    avgDailyScore: z.number(),
  }),
  insights: z.array(WorkInsightSchema),
  burnoutRisk: z.object({
    level: z.nativeEnum(BurnoutRiskLevel),
    score: z.number(),
    factors: z.array(z.string()),
  }),
  topRecommendations: z.array(z.string()),
  generatedAt: z.string().datetime(),
});

export type WorkInsightsResponse = z.infer<typeof WorkInsightsResponseSchema>;

// ==================== PTO Balance ====================

export const PTOBalanceSchema = z.object({
  userId: z.string().min(1),
  type: z.nativeEnum(PTOType),
  allocated: z.number(),
  used: z.number(),
  pending: z.number(),
  remaining: z.number(),
});

export type PTOBalance = z.infer<typeof PTOBalanceSchema>;

export const PTOBalanceResponseSchema = z.object({
  userId: z.string().min(1),
  asOfDate: z.string(),
  balances: z.array(PTOBalanceSchema),
  totalUsed: z.number(),
  totalRemaining: z.number(),
});

export type PTOBalanceResponse = z.infer<typeof PTOBalanceResponseSchema>;

// ==================== API Response Types ====================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export function createSuccessResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
  };
}

export function createErrorResponse(error: string): ApiResponse<never> {
  return {
    success: false,
    error,
  };
}