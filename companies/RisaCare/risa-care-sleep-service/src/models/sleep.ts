import { z } from 'zod';

// Sleep Stage Schema
export const SleepStageSchema = z.enum(['awake', 'light', 'deep', 'rem']);
export type SleepStage = z.infer<typeof SleepStageSchema>;

// Sleep Disorder Type Schema
export const SleepDisorderTypeSchema = z.enum([
  'insomnia',
  'sleep_apnea',
  'restless_leg',
  'narcolepsy',
  'parasomnia'
]);
export type SleepDisorderType = z.infer<typeof SleepDisorderTypeSchema>;

// Sleep Disorder Status Schema
export const SleepDisorderStatusSchema = z.enum(['suspected', 'diagnosed', 'treated', 'resolved']);
export type SleepDisorderStatus = z.infer<typeof SleepDisorderStatusSchema>;

// Sleep Factor Type Schema
export const SleepFactorTypeSchema = z.enum([
  'caffeine',
  'exercise',
  'screen_time',
  'stress',
  'meals',
  'alcohol'
]);
export type SleepFactorType = z.infer<typeof SleepFactorTypeSchema>;

// Sleep Factor Impact Schema
export const SleepFactorImpactSchema = z.enum(['positive', 'negative', 'neutral']);
export type SleepFactorImpact = z.infer<typeof SleepFactorImpactSchema>;

// Insight Type Schema
export const SleepInsightTypeSchema = z.enum(['pattern', 'improvement', 'concern']);
export type SleepInsightType = z.infer<typeof SleepInsightTypeSchema>;

// Sleep Record Schema
export const SleepRecordSchema = z.object({
  recordId: z.string().uuid(),
  userId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  bedtime: z.string().regex(/^\d{2}:\d{2}$/),
  wakeTime: z.string().regex(/^\d{2}:\d{2}$/),
  duration: z.number().min(0).max(24),
  quality: z.number().min(1).max(10),
  deepSleep: z.number().min(0).max(24).optional(),
  lightSleep: z.number().min(0).max(24).optional(),
  remSleep: z.number().min(0).max(24).optional(),
  awakenings: z.number().int().min(0).optional(),
  sleepStages: z.array(z.object({
    stage: SleepStageSchema,
    duration: z.number().min(0),
    startTime: z.string(),
    endTime: z.string()
  })).optional(),
  notes: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type SleepRecord = z.infer<typeof SleepRecordSchema>;

// Sleep Goal Schema
export const SleepGoalSchema = z.object({
  goalId: z.string().uuid(),
  userId: z.string(),
  targetDuration: z.number().min(4).max(14),
  targetBedtime: z.string().regex(/^\d{2}:\d{2}$/),
  targetWakeTime: z.string().regex(/^\d{2}:\d{2}$/),
  days: z.array(z.number().int().min(0).max(6)),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type SleepGoal = z.infer<typeof SleepGoalSchema>;

// Sleep Insight Schema
export const SleepInsightSchema = z.object({
  insightId: z.string().uuid(),
  userId: z.string(),
  type: SleepInsightTypeSchema,
  title: z.string(),
  description: z.string(),
  recommendations: z.array(z.string()),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  createdAt: z.string().datetime()
});
export type SleepInsight = z.infer<typeof SleepInsightSchema>;

// Sleep Disorder Schema
export const SleepDisorderSchema = z.object({
  disorderId: z.string().uuid(),
  userId: z.string(),
  type: SleepDisorderTypeSchema,
  severity: z.enum(['mild', 'moderate', 'severe']),
  diagnosedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: SleepDisorderStatusSchema,
  notes: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type SleepDisorder = z.infer<typeof SleepDisorderSchema>;

// Sleep Factor Schema
export const SleepFactorSchema = z.object({
  factorId: z.string().uuid(),
  userId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: SleepFactorTypeSchema,
  impact: SleepFactorImpactSchema,
  notes: z.string().optional(),
  createdAt: z.string().datetime()
});
export type SleepFactor = z.infer<typeof SleepFactorSchema>;

// Input Schemas for API
export const LogSleepInputSchema = z.object({
  userId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  bedtime: z.string().regex(/^\d{2}:\d{2}$/),
  wakeTime: z.string().regex(/^\d{2}:\d{2}$/),
  quality: z.number().min(1).max(10),
  deepSleep: z.number().min(0).max(24).optional(),
  lightSleep: z.number().min(0).max(24).optional(),
  remSleep: z.number().min(0).max(24).optional(),
  awakenings: z.number().int().min(0).optional(),
  sleepStages: z.array(z.object({
    stage: SleepStageSchema,
    duration: z.number().min(0),
    startTime: z.string(),
    endTime: z.string()
  })).optional(),
  notes: z.string().optional()
});
export type LogSleepInput = z.infer<typeof LogSleepInputSchema>;

export const SetGoalInputSchema = z.object({
  userId: z.string(),
  targetDuration: z.number().min(4).max(14),
  targetBedtime: z.string().regex(/^\d{2}:\d{2}$/),
  targetWakeTime: z.string().regex(/^\d{2}:\d{2}$/),
  days: z.array(z.number().int().min(0).max(6))
});
export type SetGoalInput = z.infer<typeof SetGoalInputSchema>;

export const UpdateGoalInputSchema = z.object({
  targetDuration: z.number().min(4).max(14).optional(),
  targetBedtime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  targetWakeTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  days: z.array(z.number().int().min(0).max(6)).optional()
});
export type UpdateGoalInput = z.infer<typeof UpdateGoalInputSchema>;

export const LogFactorInputSchema = z.object({
  userId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: SleepFactorTypeSchema,
  impact: SleepFactorImpactSchema,
  notes: z.string().optional()
});
export type LogFactorInput = z.infer<typeof LogFactorInputSchema>;

export const AddDisorderInputSchema = z.object({
  userId: z.string(),
  type: SleepDisorderTypeSchema,
  severity: z.enum(['mild', 'moderate', 'severe']),
  diagnosedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: SleepDisorderStatusSchema,
  notes: z.string().optional()
});
export type AddDisorderInput = z.infer<typeof AddDisorderInputSchema>;

// Storage Interface
export interface SleepStorage {
  records: Map<string, SleepRecord>;
  goals: Map<string, SleepGoal>;
  insights: Map<string, SleepInsight>;
  disorders: Map<string, SleepDisorder>;
  factors: Map<string, SleepFactor>;
}

// In-memory storage (replace with database in production)
export const sleepStorage: SleepStorage = {
  records: new Map(),
  goals: new Map(),
  insights: new Map(),
  disorders: new Map(),
  factors: new Map()
};
