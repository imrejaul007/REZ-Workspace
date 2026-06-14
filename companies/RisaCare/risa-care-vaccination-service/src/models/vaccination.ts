import { z } from 'zod';

// Enums
export type AgeGroup = 'infant' | 'child' | 'adolescent' | 'adult' | 'senior';
export type ReminderType = 'email' | 'sms' | 'push';
export type ComplianceStatus = 'compliant' | 'partial' | 'non-compliant';

// Vaccination Record Schema
export const VaccinationRecordSchema = z.object({
  recordId: z.string().uuid(),
  userId: z.string().min(1),
  vaccineName: z.string().min(1),
  vaccineCode: z.string().min(1),
  manufacturer: z.string().optional(),
  batchNumber: z.string().optional(),
  doseNumber: z.number().int().positive(),
  totalDoses: z.number().int().positive(),
  administeredAt: z.string().datetime(),
  administeredBy: z.string().optional(),
  location: z.string().optional(),
  sideEffects: z.array(z.string()).default([]),
  nextDoseDue: z.string().datetime().optional(),
  certificateUrl: z.string().url().optional(),
});

export type VaccinationRecord = z.infer<typeof VaccinationRecordSchema>;

// Vaccine Schedule Schema
export const VaccineScheduleSchema = z.object({
  userId: z.string().min(1),
  ageGroup: z.enum(['infant', 'child', 'adolescent', 'adult', 'senior']),
  recommendedVaccines: z.array(z.object({
    vaccineCode: z.string(),
    vaccineName: z.string(),
    dueDate: z.string().datetime().optional(),
    doseNumber: z.number(),
    totalDoses: z.number(),
  })).default([]),
  completedVaccines: z.array(z.object({
    vaccineCode: z.string(),
    vaccineName: z.string(),
    doseNumber: z.number(),
    completedAt: z.string().datetime(),
  })).default([]),
  upcomingVaccines: z.array(z.object({
    vaccineCode: z.string(),
    vaccineName: z.string(),
    dueDate: z.string().datetime(),
    doseNumber: z.number(),
  })).default([]),
  lastUpdated: z.string().datetime(),
});

export type VaccineSchedule = z.infer<typeof VaccineScheduleSchema>;

// Vaccination Reminder Schema
export const VaccinationReminderSchema = z.object({
  reminderId: z.string().uuid(),
  userId: z.string().min(1),
  vaccineName: z.string().min(1),
  dueDate: z.string().datetime(),
  reminderDate: z.string().datetime(),
  sent: z.boolean().default(false),
  sentAt: z.string().datetime().optional(),
  reminderType: z.enum(['email', 'sms', 'push']),
});

export type VaccinationReminder = z.infer<typeof VaccinationReminderSchema>;

// Vaccine Schema
export const VaccineSchema = z.object({
  vaccineId: z.string().uuid(),
  name: z.string().min(1),
  code: z.string().min(1),
  manufacturer: z.string().optional(),
  description: z.string().optional(),
  dosesRequired: z.number().int().positive(),
  doseInterval: z.object({
    minDays: z.number().int().nonnegative().optional(),
    maxDays: z.number().int().positive().optional(),
    recommendedDays: z.number().int().nonnegative().optional(),
  }).optional(),
  ageGroup: z.enum(['infant', 'child', 'adolescent', 'adult', 'senior']).array(),
  contraindications: z.array(z.string()).default([]),
  sideEffects: z.array(z.string()).default([]),
  storageRequirements: z.string().optional(),
});

export type Vaccine = z.infer<typeof VaccineSchema>;

// Immunization Certificate Schema
export const ImmunizationCertificateSchema = z.object({
  certificateId: z.string().uuid(),
  userId: z.string().min(1),
  issuedAt: z.string().datetime(),
  vaccines: z.array(z.object({
    vaccineName: z.string(),
    vaccineCode: z.string(),
    doseNumber: z.number(),
    administeredAt: z.string().datetime(),
    location: z.string().optional(),
  })).default([]),
  verificationCode: z.string().min(8),
  qrCode: z.string().optional(),
  isVerified: z.boolean().default(false),
});

export type ImmunizationCertificate = z.infer<typeof ImmunizationCertificateSchema>;

// Compliance Report Schema
export const ComplianceReportSchema = z.object({
  userId: z.string().min(1),
  status: z.enum(['compliant', 'partial', 'non-compliant']),
  complianceRate: z.number().min(0).max(100),
  totalRequired: z.number().int().nonnegative(),
  totalCompleted: z.number().int().nonnegative(),
  missingVaccines: z.array(z.object({
    vaccineCode: z.string(),
    vaccineName: z.string(),
    dosesRequired: z.number(),
    dosesCompleted: z.number(),
    dueDate: z.string().datetime().optional(),
  })).default([]),
  overdueVaccines: z.array(z.object({
    vaccineCode: z.string(),
    vaccineName: z.string(),
    overdueBy: z.number().int(),
  })).default([]),
  checkedAt: z.string().datetime(),
});

export type ComplianceReport = z.infer<typeof ComplianceReportSchema>;

// Input Validation Schemas
export const AddRecordInputSchema = z.object({
  userId: z.string().min(1),
  vaccineName: z.string().min(1),
  vaccineCode: z.string().min(1),
  manufacturer: z.string().optional(),
  batchNumber: z.string().optional(),
  doseNumber: z.number().int().positive(),
  totalDoses: z.number().int().positive(),
  administeredAt: z.string().datetime(),
  administeredBy: z.string().optional(),
  location: z.string().optional(),
  sideEffects: z.array(z.string()).default([]),
  nextDoseDue: z.string().datetime().optional(),
  certificateUrl: z.string().url().optional(),
});

export type AddRecordInput = z.infer<typeof AddRecordInputSchema>;

export const SetReminderInputSchema = z.object({
  userId: z.string().min(1),
  vaccineName: z.string().min(1),
  dueDate: z.string().datetime(),
  reminderDate: z.string().datetime(),
  reminderType: z.enum(['email', 'sms', 'push']),
});

export type SetReminderInput = z.infer<typeof SetReminderInputSchema>;

export const GenerateCertificateInputSchema = z.object({
  userId: z.string().min(1),
  vaccineIds: z.array(z.string()).min(1),
});

export type GenerateCertificateInput = z.infer<typeof GenerateCertificateInputSchema>;

export const GetScheduleInputSchema = z.object({
  userId: z.string().min(1),
  ageGroup: z.enum(['infant', 'child', 'adolescent', 'adult', 'senior']).optional(),
  dateOfBirth: z.string().datetime().optional(),
});

export type GetScheduleInput = z.infer<typeof GetScheduleInputSchema>;
