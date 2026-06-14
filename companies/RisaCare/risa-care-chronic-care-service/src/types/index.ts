import { z } from 'zod';

// Enum-like constants
export const CONDITION_TYPES = [
  'diabetes',
  'hypertension',
  'thyroid',
  'asthma',
  'heart_disease',
  'copd',
  'arthritis',
  'depression',
  'other'
] as const;

export const SEVERITY_LEVELS = ['mild', 'moderate', 'severe'] as const;

export const READING_TYPES = [
  'blood_sugar',
  'blood_pressure',
  'heart_rate',
  'weight',
  'thyroid',
  'lung_function',
  'pain_level',
  'mood'
] as const;

export const ALERT_TYPES = [
  'out_of_range',
  'medication_due',
  'appointment_due',
  'trend_concern'
] as const;

export const ALERT_SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;

// Zod Schemas for Validation
export const ConditionTypeSchema = z.enum(CONDITION_TYPES);
export const SeveritySchema = z.enum(SEVERITY_LEVELS);
export const ReadingTypeSchema = z.enum(READING_TYPES);
export const AlertTypeSchema = z.enum(ALERT_TYPES);
export const AlertSeveritySchema = z.enum(ALERT_SEVERITIES);

// Medication Schema
export const MedicationSchema = z.object({
  name: z.string().min(1).max(200),
  dosage: z.string().min(1).max(100),
  frequency: z.string().min(1).max(100),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  notes: z.string().max(500).optional()
});

// Create Condition Schema
export const CreateConditionSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  conditionType: ConditionTypeSchema,
  severity: SeveritySchema,
  diagnosedDate: z.string().datetime().optional(),
  medications: z.array(MedicationSchema).optional().default([]),
  carePlanId: z.string().optional(),
  notes: z.string().max(1000).optional(),
  familyHistory: z.boolean().optional().default(false),
  riskFactors: z.array(z.string()).optional().default([])
});

// Update Condition Schema
export const UpdateConditionSchema = z.object({
  severity: SeveritySchema.optional(),
  medications: z.array(MedicationSchema).optional(),
  carePlanId: z.string().optional(),
  notes: z.string().max(1000).optional(),
  riskFactors: z.array(z.string()).optional(),
  status: z.enum(['active', 'managed', 'resolved']).optional()
});

// Reading Schema
export const CreateReadingSchema = z.object({
  readingType: ReadingTypeSchema,
  value: z.number(),
  unit: z.string().min(1).max(50),
  recordedAt: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),
  recordedBy: z.string().optional()
});

// Protocol Schema
export const CreateProtocolSchema = z.object({
  protocolName: z.string().min(1).max(200),
  targetRanges: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    ideal: z.number().optional(),
    warningMin: z.number().optional(),
    warningMax: z.number().optional()
  }),
  medications: z.array(MedicationSchema).optional().default([]),
  lifestyleRecommendations: z.array(z.string()).optional().default([]),
  monitoringFrequency: z.enum(['hourly', 'daily', 'weekly', 'biweekly', 'monthly']),
  followUpDays: z.number().int().positive().optional()
});

// Alert Acknowledge Schema
export const AcknowledgeAlertSchema = z.object({
  acknowledgedBy: z.string().min(1, 'Acknowledger ID is required'),
  notes: z.string().max(500).optional()
});

// Types
export type ConditionType = z.infer<typeof ConditionTypeSchema>;
export type Severity = z.infer<typeof SeveritySchema>;
export type ReadingType = z.infer<typeof ReadingTypeSchema>;
export type AlertType = z.infer<typeof AlertTypeSchema>;
export type AlertSeverity = z.infer<typeof AlertSeveritySchema>;
export type Medication = z.infer<typeof MedicationSchema>;
export type CreateConditionInput = z.infer<typeof CreateConditionSchema>;
export type UpdateConditionInput = z.infer<typeof UpdateConditionSchema>;
export type CreateReadingInput = z.infer<typeof CreateReadingSchema>;
export type CreateProtocolInput = z.infer<typeof CreateProtocolSchema>;
export type AcknowledgeAlertInput = z.infer<typeof AcknowledgeAlertSchema>;

// Trend Analysis Types
export interface TrendData {
  date: string;
  average: number;
  min: number;
  max: number;
  count: number;
}

export interface ControlScore {
  overall: number;
  readingTypeScores: Record<string, number>;
  trend: 'improving' | 'stable' | 'declining';
  lastUpdated: string;
}

export interface ConditionSummary {
  conditionId: string;
  conditionType: ConditionType;
  patientId: string;
  severity: Severity;
  daysSinceDiagnosis: number;
  totalReadings: number;
  readingsThisMonth: number;
  controlScore: number;
  activeAlerts: number;
  lastReading: {
    type: ReadingType;
    value: number;
    unit: string;
    date: string;
  } | null;
}

// Target Ranges by Condition and Reading Type
export const TARGET_RANGES: Record<ConditionType, Record<ReadingType, { min: number; max: number; unit: string }>> = {
  diabetes: {
    blood_sugar: { min: 80, max: 180, unit: 'mg/dL' },
    blood_pressure: { min: 90, max: 140, unit: 'mmHg' },
    heart_rate: { min: 60, max: 100, unit: 'bpm' },
    weight: { min: 0, max: 999, unit: 'kg' },
    thyroid: { min: 0.4, max: 4.0, unit: 'mIU/L' },
    lung_function: { min: 80, max: 100, unit: '%' },
    pain_level: { min: 0, max: 10, unit: 'scale' },
    mood: { min: 0, max: 10, unit: 'scale' }
  },
  hypertension: {
    blood_sugar: { min: 0, max: 999, unit: 'mg/dL' },
    blood_pressure: { min: 90, max: 120, unit: 'mmHg' },
    heart_rate: { min: 60, max: 100, unit: 'bpm' },
    weight: { min: 0, max: 999, unit: 'kg' },
    thyroid: { min: 0.4, max: 4.0, unit: 'mIU/L' },
    lung_function: { min: 80, max: 100, unit: '%' },
    pain_level: { min: 0, max: 10, unit: 'scale' },
    mood: { min: 0, max: 10, unit: 'scale' }
  },
  thyroid: {
    blood_sugar: { min: 0, max: 999, unit: 'mg/dL' },
    blood_pressure: { min: 90, max: 140, unit: 'mmHg' },
    heart_rate: { min: 60, max: 100, unit: 'bpm' },
    weight: { min: 0, max: 999, unit: 'kg' },
    thyroid: { min: 0.5, max: 5.0, unit: 'mIU/L' },
    lung_function: { min: 80, max: 100, unit: '%' },
    pain_level: { min: 0, max: 10, unit: 'scale' },
    mood: { min: 0, max: 10, unit: 'scale' }
  },
  asthma: {
    blood_sugar: { min: 0, max: 999, unit: 'mg/dL' },
    blood_pressure: { min: 90, max: 140, unit: 'mmHg' },
    heart_rate: { min: 60, max: 100, unit: 'bpm' },
    weight: { min: 0, max: 999, unit: 'kg' },
    thyroid: { min: 0.4, max: 4.0, unit: 'mIU/L' },
    lung_function: { min: 80, max: 100, unit: '%' },
    pain_level: { min: 0, max: 10, unit: 'scale' },
    mood: { min: 0, max: 10, unit: 'scale' }
  },
  heart_disease: {
    blood_sugar: { min: 0, max: 999, unit: 'mg/dL' },
    blood_pressure: { min: 90, max: 130, unit: 'mmHg' },
    heart_rate: { min: 60, max: 80, unit: 'bpm' },
    weight: { min: 0, max: 999, unit: 'kg' },
    thyroid: { min: 0.4, max: 4.0, unit: 'mIU/L' },
    lung_function: { min: 80, max: 100, unit: '%' },
    pain_level: { min: 0, max: 10, unit: 'scale' },
    mood: { min: 0, max: 10, unit: 'scale' }
  },
  copd: {
    blood_sugar: { min: 0, max: 999, unit: 'mg/dL' },
    blood_pressure: { min: 90, max: 140, unit: 'mmHg' },
    heart_rate: { min: 60, max: 100, unit: 'bpm' },
    weight: { min: 0, max: 999, unit: 'kg' },
    thyroid: { min: 0.4, max: 4.0, unit: 'mIU/L' },
    lung_function: { min: 50, max: 100, unit: '%' },
    pain_level: { min: 0, max: 10, unit: 'scale' },
    mood: { min: 0, max: 10, unit: 'scale' }
  },
  arthritis: {
    blood_sugar: { min: 0, max: 999, unit: 'mg/dL' },
    blood_pressure: { min: 90, max: 140, unit: 'mmHg' },
    heart_rate: { min: 60, max: 100, unit: 'bpm' },
    weight: { min: 0, max: 999, unit: 'kg' },
    thyroid: { min: 0.4, max: 4.0, unit: 'mIU/L' },
    lung_function: { min: 80, max: 100, unit: '%' },
    pain_level: { min: 0, max: 10, unit: 'scale' },
    mood: { min: 0, max: 10, unit: 'scale' }
  },
  depression: {
    blood_sugar: { min: 0, max: 999, unit: 'mg/dL' },
    blood_pressure: { min: 90, max: 140, unit: 'mmHg' },
    heart_rate: { min: 60, max: 100, unit: 'bpm' },
    weight: { min: 0, max: 999, unit: 'kg' },
    thyroid: { min: 0.4, max: 4.0, unit: 'mIU/L' },
    lung_function: { min: 80, max: 100, unit: '%' },
    pain_level: { min: 0, max: 10, unit: 'scale' },
    mood: { min: 5, max: 10, unit: 'scale' }
  },
  other: {
    blood_sugar: { min: 0, max: 999, unit: 'mg/dL' },
    blood_pressure: { min: 90, max: 140, unit: 'mmHg' },
    heart_rate: { min: 60, max: 100, unit: 'bpm' },
    weight: { min: 0, max: 999, unit: 'kg' },
    thyroid: { min: 0.4, max: 4.0, unit: 'mIU/L' },
    lung_function: { min: 80, max: 100, unit: '%' },
    pain_level: { min: 0, max: 10, unit: 'scale' },
    mood: { min: 0, max: 10, unit: 'scale' }
  }
};
