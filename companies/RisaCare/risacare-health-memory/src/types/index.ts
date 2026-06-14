/**
 * Health Memory Platform - Core Types
 *
 * Foundation for MyRisa Health Intelligence
 * Following RTNM Doctrine: Identity → Memory → Knowledge → Twin → Agent → Intelligence
 */

import { z } from 'zod';

// ============================================
// CORE ENTITY SCHEMAS (Zod Validation)
// ============================================

// Person - Core identity for health context
export const PersonSchema = z.object({
  id: z.string().uuid(),
  corpId: z.string(), // CorpID for identity
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  dateOfBirth: z.string().optional(), // ISO date
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown']).optional(),
  heightCm: z.number().optional(),
  weightKg: z.number().optional(),
  allergies: z.array(z.string()).default([]),
  emergencyContact: z.object({
    name: z.string(),
    phone: z.string(),
    relationship: z.string()
  }).optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type Person = z.infer<typeof PersonSchema>;

// Family Member - Connected to person
export const FamilyMemberSchema = z.object({
  id: z.string().uuid(),
  personId: z.string().uuid(), // Owner
  firstName: z.string(),
  lastName: z.string().optional(),
  relationship: z.enum(['mother', 'father', 'child', 'spouse', 'sibling', 'grandparent', 'grandchild', 'partner', 'other']),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  healthContext: z.enum(['woman', 'child', 'elder', 'general']).default('general'),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type FamilyMember = z.infer<typeof FamilyMemberSchema>;

// Medical Report
export const MedicalReportSchema = z.object({
  id: z.string().uuid(),
  personId: z.string().uuid(),
  title: z.string(),
  type: z.enum(['lab_result', 'imaging', 'pathology', 'diagnosis', 'prescription', 'discharge_summary', 'vaccination', 'other']),
  reportDate: z.string(), // ISO date
  facility: z.string().optional(), // Hospital/Clinic name
  doctorName: z.string().optional(),
  specialty: z.string().optional(),
  summary: z.string().optional(),
  findings: z.array(z.object({
    key: z.string(),
    value: z.string(),
    unit: z.string().optional(),
    referenceRange: z.string().optional(),
    status: z.enum(['normal', 'abnormal', 'critical']).optional()
  })).default([]),
  attachments: z.array(z.object({
    url: z.string(),
    type: z.string(),
    name: z.string()
  })).default([]),
  extractedText: z.string().optional(), // OCR/AI extracted
  metadata: z.record(z.any()).default({}),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type MedicalReport = z.infer<typeof MedicalReportSchema>;

// Medication
export const MedicationSchema = z.object({
  id: z.string().uuid(),
  personId: z.string().uuid(),
  name: z.string(),
  genericName: z.string().optional(),
  dosage: z.string(),
  frequency: z.string(), // e.g., "twice daily"
  route: z.enum(['oral', 'topical', 'injection', 'inhalation', 'sublingual', 'rectal', 'other']).default('oral'),
  startDate: z.string(),
  endDate: z.string().optional(),
  prescribedBy: z.string().optional(),
  purpose: z.string().optional(),
  sideEffects: z.array(z.string()).default([]),
  interactions: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  reminders: z.array(z.object({
    time: z.string(), // HH:mm
    days: z.array(z.number()) // 0-6 for days of week
  })).default([]),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type Medication = z.infer<typeof MedicationSchema>;

// Symptom
export const SymptomSchema = z.object({
  id: z.string().uuid(),
  personId: z.string().uuid(),
  name: z.string(),
  severity: z.enum(['mild', 'moderate', 'severe', 'critical']).default('mild'),
  bodyArea: z.string().optional(), // e.g., "head", "abdomen"
  description: z.string().optional(),
  startedAt: z.string(),
  endedAt: z.string().optional(),
  duration: z.number().optional(), // minutes/hours/days
  triggers: z.array(z.string()).default([]),
  remedies: z.array(z.string()).default([]),
  relatedConditions: z.array(z.string()).default([]),
  notes: z.string().optional(),
  metadata: z.record(z.any()).default({}),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type Symptom = z.infer<typeof SymptomSchema>;

// Condition/Diagnosis
export const ConditionSchema = z.object({
  id: z.string().uuid(),
  personId: z.string().uuid(),
  name: z.string(),
  icdCode: z.string().optional(), // ICD-10 code
  category: z.string().optional(),
  severity: z.enum(['mild', 'moderate', 'severe', 'critical']).default('mild'),
  diagnosedDate: z.string(),
  resolvedDate: z.string().optional(),
  status: z.enum(['active', 'resolved', 'chronic', 'in_remission']).default('active'),
  diagnosedBy: z.string().optional(),
  facility: z.string().optional(),
  notes: z.string().optional(),
  medications: z.array(z.string()).default([]), // Medication IDs
  relatedSymptoms: z.array(z.string()).default([]),
  metadata: z.record(z.any()).default({}),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type Condition = z.infer<typeof ConditionSchema>;

// Appointment
export const AppointmentSchema = z.object({
  id: z.string().uuid(),
  personId: z.string().uuid(),
  doctorName: z.string(),
  specialty: z.string().optional(),
  facility: z.string().optional(),
  address: z.string().optional(),
  appointmentDate: z.string(), // ISO datetime
  duration: z.number().optional(), // minutes
  type: z.enum(['checkup', 'followup', 'consultation', 'procedure', 'emergency', 'telehealth', 'other']).default('checkup'),
  status: z.enum(['scheduled', 'completed', 'cancelled', 'no_show']).default('scheduled'),
  notes: z.string().optional(),
  followUp: z.object({
    required: z.boolean(),
    date: z.string().optional(),
    notes: z.string().optional()
  }).optional(),
  cost: z.number().optional(),
  insuranceClaimed: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type Appointment = z.infer<typeof AppointmentSchema>;

// Doctor/Healthcare Provider
export const DoctorSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  specialty: z.string(),
  qualifications: z.array(z.string()).default([]),
  facility: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  languages: z.array(z.string()).default([]),
  rating: z.number().optional(),
  availability: z.enum(['available', 'busy', 'unavailable']).default('available'),
  metadata: z.record(z.any()).default({}),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type Doctor = z.infer<typeof DoctorSchema>;

// Hospital/Facility
export const FacilitySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: z.enum(['hospital', 'clinic', 'diagnostic_center', 'pharmacy', 'rehabilitation', 'nursing_home', 'other']),
  address: z.string(),
  phone: z.string().optional(),
  emergencyServices: z.boolean().default(false),
  specialties: z.array(z.string()).default([]),
  hours: z.object({
    monday: z.string().optional(),
    tuesday: z.string().optional(),
    wednesday: z.string().optional(),
    thursday: z.string().optional(),
    friday: z.string().optional(),
    saturday: z.string().optional(),
    sunday: z.string().optional()
  }).optional(),
  rating: z.number().optional(),
  metadata: z.record(z.any()).default({}),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type Facility = z.infer<typeof FacilitySchema>;

// Allergy
export const AllergySchema = z.object({
  id: z.string().uuid(),
  personId: z.string().uuid(),
  allergen: z.string(),
  type: z.enum(['medication', 'food', 'environmental', 'other']),
  severity: z.enum(['mild', 'moderate', 'severe', 'life_threatening']),
  reactions: z.array(z.string()).default([]),
  diagnosedDate: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type Allergy = z.infer<typeof AllergySchema>;

// Vaccination Record
export const VaccinationSchema = z.object({
  id: z.string().uuid(),
  personId: z.string().uuid(),
  vaccine: z.string(),
  vaccineCode: z.string().optional(), // CDC code
  doseNumber: z.number(),
  totalDoses: z.number(),
  dateAdministered: z.string(),
  facility: z.string().optional(),
  administeredBy: z.string().optional(),
  nextDoseDate: z.string().optional(),
  sideEffects: z.array(z.string()).default([]),
  batchNumber: z.string().optional(),
  metadata: z.record(z.any()).default({}),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type Vaccination = z.infer<typeof VaccinationSchema>;

// Surgery/Procedure
export const ProcedureSchema = z.object({
  id: z.string().uuid(),
  personId: z.string().uuid(),
  name: z.string(),
  procedureCode: z.string().optional(), // CPT code
  type: z.enum(['surgery', 'procedure', 'therapy', 'diagnostic', 'other']),
  scheduledDate: z.string(),
  performedDate: z.string().optional(),
  facility: z.string(),
  surgeon: z.string().optional(),
  anesthesiologist: z.string().optional(),
  outcome: z.enum(['successful', 'complications', 'pending', 'cancelled']).optional(),
  notes: z.string().optional(),
  recoveryNotes: z.string().optional(),
  followUpRequired: z.boolean().default(false),
  metadata: z.record(z.any()).default({}),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type Procedure = z.infer<typeof ProcedureSchema>;

// ============================================
// WOMEN'S HEALTH MEMORY TYPES
// ============================================

// Menstrual Cycle Record
export const MenstrualCycleSchema = z.object({
  id: z.string().uuid(),
  personId: z.string().uuid(),
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

// Pregnancy Record
export const PregnancySchema = z.object({
  id: z.string().uuid(),
  personId: z.string().uuid(),
  conceptionDate: z.string().optional(), // ISO date
  dueDate: z.string(),
  status: z.enum(['planning', 'confirmed', 'miscarriage', 'abortion', 'delivered', 'ectopic']),
  trimester: z.number().min(1).max(3).optional(),
  outcomes: z.object({
    deliveryDate: z.string().optional(),
    deliveryType: z.enum(['natural', 'c_section']).optional(),
    complications: z.array(z.string()).default([]),
    babyGender: z.enum(['male', 'female', 'unknown']).optional()
  }).optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type Pregnancy = z.infer<typeof PregnancySchema>);

// Fertility Window
export const FertilityWindowSchema = z.object({
  id: z.string().uuid(),
  personId: z.string().uuid(),
  cycleStartDate: z.string(),
  fertileWindowStart: z.string(),
  fertileWindowEnd: z.string(),
  ovulationDate: z.string().optional(),
  conceptionProbability: z.number().min(0).max(100).optional(),
  method: z.enum(['calendar', 'bbt', 'lh_surge', 'symptothermal', 'calculated']).default('calendar'),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type FertilityWindow = z.infer<typeof FertilityWindowSchema>);

// ============================================
// LIFE EVENTS (Cross-cutting)
// ============================================

// Life Event - Triggers twin evolution
export const LifeEventSchema = z.object({
  id: z.string().uuid(),
  personId: z.string().uuid(),
  eventType: z.enum([
    'marriage', 'divorce', 'childbirth', 'child_adoption',
    'job_change', 'retirement', 'relocation',
    'diagnosis', 'surgery', 'hospitalization',
    'death_family', 'pregnancy', 'menopause',
    'weight_change_significant', 'lifestyle_change',
    'medication_change', 'insurance_change', 'other'
  ]),
  eventDate: z.string(),
  title: z.string(),
  description: z.string().optional(),
  impact: z.object({
    health: z.number().min(0).max(10).default(5),
    mental: z.number().min(0).max(10).default(5),
    financial: z.number().min(0).max(10).default(5),
    social: z.number().min(0).max(10).default(5)
  }).optional(),
  relatedEntities: z.object({
    conditions: z.array(z.string()).default([]),
    medications: z.array(z.string()).default([]),
    doctors: z.array(z.string()).default([]),
    familyMembers: z.array(z.string()).default([])
  }).default({}),
  metadata: z.record(z.any()).default({}),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type LifeEvent = z.infer<typeof LifeEventSchema>;

// ============================================
// CARE NETWORK
// ============================================

// Care Relationship
export const CareRelationshipSchema = z.object({
  id: z.string().uuid(),
  personId: z.string().uuid(), // Care recipient
  caregiverId: z.string().uuid(), // Care provider
  relationshipType: z.enum(['primary_caregiver', 'secondary_caregiver', 'nurse', 'doctor', 'family_member', 'friend', 'other']),
  accessLevel: z.enum(['full', 'partial', 'emergency_only']).default('partial'),
  permissions: z.array(z.enum(['view_health', 'edit_health', 'view_reports', 'receive_alerts', 'schedule_appointments', 'manage_medications'])).default(['view_health']),
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type CareRelationship = z.infer<typeof CareRelationshipSchema>;

// ============================================
// HEALTH INSURANCE
// ============================================

export const HealthInsuranceSchema = z.object({
  id: z.string().uuid(),
  personId: z.string().uuid(),
  provider: z.string(),
  policyNumber: z.string(),
  planType: z.enum(['individual', 'family', 'employer', 'government', 'other']),
  coverageStart: z.string(),
  coverageEnd: z.string().optional(),
  monthlyPremium: z.number().optional(),
  deductible: z.number().optional(),
  copay: z.number().optional(),
  coveredServices: z.array(z.string()).default([]),
  exclusions: z.array(z.string()).default([]),
  status: z.enum(['active', 'expired', 'pending']).default('active'),
  metadata: z.record(z.any()).default({}),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type HealthInsurance = z.infer<typeof HealthInsuranceSchema>);

// ============================================
// MEMORY QUERY TYPES
// ============================================

export interface HealthMemoryQuery {
  personId: string;
  startDate?: string;
  endDate?: string;
  type?: string[];
  category?: string;
  limit?: number;
  offset?: number;
}

export interface HealthTimelineQuery {
  personId: string;
  startDate?: string;
  endDate?: string;
  eventTypes?: string[];
  includeConditions?: boolean;
  includeMedications?: boolean;
  includeSymptoms?: boolean;
  includeReports?: boolean;
  includeLifeEvents?: boolean;
}

export interface HealthSummaryQuery {
  personId: string;
  period?: 'week' | 'month' | 'quarter' | 'year' | 'all';
}

// ============================================
// MEMORY ANALYTICS
// ============================================

export interface HealthMemoryStats {
  totalReports: number;
  totalMedications: number;
  activeMedications: number;
  totalConditions: number;
  activeConditions: number;
  chronicConditions: number;
  totalSymptoms: number;
  totalAppointments: number;
  upcomingAppointments: number;
  lastReportDate: string | null;
  lastAppointmentDate: string | null;
  healthScore: number; // 0-100
}

export interface HealthTrend {
  metric: string;
  period: string;
  change: number; // percentage
  direction: 'up' | 'down' | 'stable';
  values: Array<{ date: string; value: number }>;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  timestamp: string;
}

// ============================================
// ENUM EXPORTS
// ============================================

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type RelationshipType = 'mother' | 'father' | 'child' | 'spouse' | 'sibling' | 'grandparent' | 'grandchild' | 'partner' | 'other';
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type ReportType = 'lab_result' | 'imaging' | 'pathology' | 'diagnosis' | 'prescription' | 'discharge_summary' | 'vaccination' | 'other';
export type ConditionStatus = 'active' | 'resolved' | 'chronic' | 'in_remission';
export type LifeEventType = typeof LifeEventSchema.shape.eventType.options[number];