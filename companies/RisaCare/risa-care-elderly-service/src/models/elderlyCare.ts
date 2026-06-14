import { z } from 'zod';

// Enums
export const LivingSituationEnum = z.enum(['alone', 'with_spouse', 'with_family', 'assisted_living', 'nursing_home']);
export type LivingSituation = z.infer<typeof LivingSituationEnum>;

export const MobilityLevelEnum = z.enum(['independent', 'limited', 'assisted', 'wheelchair', 'bedridden']);
export type MobilityLevel = z.infer<typeof MobilityLevelEnum>;

export const FallSeverityEnum = z.enum(['minor', 'moderate', 'severe', 'injury']);
export type FallSeverity = z.infer<typeof FallSeverityEnum>;

export const RiskLevelEnum = z.enum(['low', 'moderate', 'high', 'very_high']);
export type RiskLevel = z.infer<typeof RiskLevelEnum>;

export const EmergencyTypeEnum = z.enum(['fall', 'sos', 'no_activity', 'vital_concern']);
export type EmergencyType = z.infer<typeof EmergencyTypeEnum>;

export const EmergencySeverityEnum = z.enum(['low', 'medium', 'high', 'critical']);
export type EmergencySeverity = z.infer<typeof EmergencySeverityEnum>;

// Emergency Contact Schema
export const EmergencyContactSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  relationship: z.string().min(1, 'Relationship is required'),
  phone: z.string().min(10, 'Valid phone number required'),
  email: z.string().email().optional(),
  isPrimary: z.boolean().default(false),
  notifiedAt: z.date().optional(),
});

export type EmergencyContact = z.infer<typeof EmergencyContactSchema>;

// Vitals Schema
export const VitalsSchema = z.object({
  bp: z.string().regex(/^\d{2,3}\/\d{2,3}$/, 'Blood pressure must be in format systolic/diastolic (e.g., 120/80)').optional(),
  hr: z.number().min(30).max(220).optional(), // Heart rate
  temp: z.number().min(95).max(108).optional(), // Fahrenheit
  spo2: z.number().min(70).max(100).optional(), // Oxygen saturation
});

export type Vitals = z.infer<typeof VitalsSchema>;

// Elderly Profile Schema
export const ElderlyProfileSchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1, 'User ID is required'),
  age: z.number().int().min(60).max(120, 'Age must be 60 or above'),
  livingSituation: LivingSituationEnum,
  mobilityLevel: MobilityLevelEnum,
  medicalConditions: z.array(z.string()).default([]),
  medications: z.array(z.object({
    id: z.string(),
    name: z.string(),
    dosage: z.string(),
    frequency: z.string(),
  })).default([]),
  fallHistory: z.array(z.object({
    date: z.date(),
    severity: FallSeverityEnum,
    location: z.string(),
    cause: z.string().optional(),
  })).default([]),
  emergencyContacts: z.array(EmergencyContactSchema).default([]),
  careGiverId: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type ElderlyProfile = z.infer<typeof ElderlyProfileSchema>;

// Fall Incident Schema
export const FallIncidentSchema = z.object({
  id: z.string().optional(),
  patientId: z.string().min(1, 'Patient ID is required'),
  date: z.date().default(() => new Date()),
  time: z.string(),
  location: z.string().min(1, 'Location is required'),
  severity: FallSeverityEnum,
  cause: z.string().optional(),
  description: z.string().optional(),
  treatment: z.string().optional(),
  hospitalVisit: z.boolean().default(false),
  createdAt: z.date().default(() => new Date()),
});

export type FallIncident = z.infer<typeof FallIncidentSchema>;

// Fall Risk Assessment Schema
export const FallRiskAssessmentSchema = z.object({
  id: z.string().optional(),
  patientId: z.string().min(1, 'Patient ID is required'),
  date: z.date().default(() => new Date()),
  score: z.number().int().min(0).max(100),
  riskLevel: RiskLevelEnum,
  factors: z.array(z.object({
    category: z.string(),
    factor: z.string(),
    weight: z.number(),
    value: z.number(),
  })).default([]),
  recommendations: z.array(z.string()).default([]),
});

export type FallRiskAssessment = z.infer<typeof FallRiskAssessmentSchema>;

// Daily Check-In Schema
export const DailyCheckInSchema = z.object({
  id: z.string().optional(),
  patientId: z.string().min(1, 'Patient ID is required'),
  date: z.date().default(() => new Date()),
  completed: z.boolean().default(false),
  completedAt: z.date().optional(),
  vitals: VitalsSchema.optional(),
  mood: z.enum(['great', 'good', 'okay', 'fair', 'poor']).optional(),
  painLevel: z.number().int().min(0).max(10).optional(),
  notes: z.string().optional(),
  symptoms: z.array(z.string()).default([]),
});

export type DailyCheckIn = z.infer<typeof DailyCheckInSchema>;

// Medication Reminder Schema
export const MedicationReminderSchema = z.object({
  id: z.string().optional(),
  patientId: z.string().min(1, 'Patient ID is required'),
  medicationId: z.string(),
  medicationName: z.string(),
  dosage: z.string(),
  scheduledTime: z.string(), // HH:MM format
  taken: z.boolean().default(false),
  takenAt: z.date().optional(),
  skipped: z.boolean().default(false),
  skippedReason: z.string().optional(),
  scheduledDate: z.date().default(() => new Date()),
  createdAt: z.date().default(() => new Date()),
});

export type MedicationReminder = z.infer<typeof MedicationReminderSchema>;

// Emergency Alert Schema
export const EmergencyAlertSchema = z.object({
  id: z.string().optional(),
  patientId: z.string().min(1, 'Patient ID is required'),
  type: EmergencyTypeEnum,
  severity: EmergencySeverityEnum,
  location: z.string().optional(),
  description: z.string().optional(),
  triggeredAt: z.date().default(() => new Date()),
  responded: z.boolean().default(false),
  respondedBy: z.string().optional(),
  respondedAt: z.date().optional(),
  resolvedAt: z.date().optional(),
  resolved: z.boolean().default(false),
  notes: z.string().optional(),
});

export type EmergencyAlert = z.infer<typeof EmergencyAlertSchema>;

// Request DTOs
export const CreateProfileDTO = ElderlyProfileSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type CreateProfileDTO = z.infer<typeof CreateProfileDTO>;

export const UpdateProfileDTO = ElderlyProfileSchema.omit({ id: true, createdAt: true, updatedAt: true }).partial();
export type UpdateProfileDTO = z.infer<typeof UpdateProfileDTO>;

export const ReportFallDTO = FallIncidentSchema.omit({ id: true, createdAt: true });
export type ReportFallDTO = z.infer<typeof ReportFallDTO>;

export const SubmitCheckInDTO = DailyCheckInSchema.omit({ id: true });
export type SubmitCheckInDTO = z.infer<typeof SubmitCheckInDTO>;

export const SetMedicationReminderDTO = MedicationReminderSchema.omit({ id: true, taken: true, takenAt: true, skipped: true, skippedReason: true, createdAt: true });
export type SetMedicationReminderDTO = z.infer<typeof SetMedicationReminderDTO>;

export const TriggerEmergencyDTO = EmergencyAlertSchema.omit({ id: true, patientId: true, triggeredAt: true, responded: true, respondedBy: true, respondedAt: true, resolvedAt: true, resolved: true });
export type TriggerEmergencyDTO = z.infer<typeof TriggerEmergencyDTO>;
