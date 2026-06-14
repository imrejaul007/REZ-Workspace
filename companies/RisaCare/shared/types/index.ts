// RisaCare Shared Types - Canonical Type Definitions with Zod Validation

import { z } from 'zod';

// ============================================
// USER & PROFILE TYPES
// ============================================

export const BloodGroupSchema = z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown']);
export type BloodGroup = z.infer<typeof BloodGroupSchema>;

export const GenderSchema = z.enum(['male', 'female', 'other', 'prefer-not-to-say']);
export type Gender = z.infer<typeof GenderSchema>;

export const RelationshipSchema = z.enum(['self', 'father', 'mother', 'spouse', 'child', 'sibling', 'other']);
export type Relationship = z.infer<typeof RelationshipSchema>;

export const AllergySeveritySchema = z.enum(['mild', 'moderate', 'severe', 'life-threatening']);
export type AllergySeverity = z.infer<typeof AllergySeveritySchema>;

export const AllergyTypeSchema = z.enum(['food', 'medication', 'environmental', 'other']);
export type AllergyType = z.infer<typeof AllergyTypeSchema>;

export const ConditionStatusSchema = z.enum(['active', 'managed', 'resolved']);
export type ConditionStatus = z.infer<typeof ConditionStatusSchema>;

export const LifestyleSchema = z.object({
  smoking: z.enum(['never', 'former', 'current', 'occasional']),
  alcohol: z.enum(['never', 'occasional', 'moderate', 'heavy']),
  sleepHours: z.number().min(0).max(24),
  waterIntake: z.number().min(0).max(20),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very-active']),
  stressLevel: z.enum(['low', 'moderate', 'high', 'very-high']),
  foodPreferences: z.array(z.string())
});
export type Lifestyle = z.infer<typeof LifestyleSchema>;

export const AllergySchema = z.object({
  allergen: z.string().min(1).max(100),
  type: AllergyTypeSchema,
  severity: AllergySeveritySchema,
  notes: z.string().max(500).optional(),
  diagnosedDate: z.string().datetime().optional()
});
export type Allergy = z.infer<typeof AllergySchema>;

export const ChronicConditionSchema = z.object({
  name: z.string().min(1).max(100),
  diagnosedDate: z.string().datetime(),
  status: ConditionStatusSchema,
  medications: z.array(z.string()).optional(),
  notes: z.string().max(500).optional()
});
export type ChronicCondition = z.infer<typeof ChronicConditionSchema>;

export const MedicationSchema = z.object({
  name: z.string().min(1).max(100),
  dosage: z.string().min(1).max(50),
  frequency: z.string().min(1).max(100),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  purpose: z.string().max(200).optional(),
  prescribedBy: z.string().max(100).optional()
});
export type Medication = z.infer<typeof MedicationSchema>;

export const VaccinationSchema = z.object({
  name: z.string().min(1).max(100),
  date: z.string().datetime(),
  nextDueDate: z.string().datetime().optional(),
  provider: z.string().max(100).optional(),
  lotNumber: z.string().max(50).optional()
});
export type Vaccination = z.infer<typeof VaccinationSchema>;

export const FamilyHistoryItemSchema = z.object({
  condition: z.string().min(1).max(100),
  relation: z.enum(['father', 'mother', 'sibling', 'grandparent', 'maternal-grandparent', 'paternal-grandparent']),
  notes: z.string().max(200).optional()
});
export type FamilyHistoryItem = z.infer<typeof FamilyHistoryItemSchema>;

export const EmergencyContactSchema = z.object({
  name: z.string().min(1).max(100),
  relationship: z.string().min(1).max(50),
  phone: z.string().min(10).max(20),
  isPrimary: z.boolean().default(false)
});
export type EmergencyContact = z.infer<typeof EmergencyContactSchema>;

export const HealthProfileSchema = z.object({
  profileId: z.string().uuid(),
  name: z.string().min(1).max(100),
  relationship: RelationshipSchema,
  age: z.number().int().min(0).max(150).optional(),
  gender: GenderSchema,
  dateOfBirth: z.string().datetime().optional(),
  bloodGroup: BloodGroupSchema.optional(),
  isPrimary: z.boolean().default(false),
  isMinor: z.boolean().default(false),
  health: z.object({
    allergies: z.array(AllergySchema).default([]),
    chronicConditions: z.array(ChronicConditionSchema).default([]),
    currentMedications: z.array(MedicationSchema).default([]),
    vaccinationHistory: z.array(VaccinationSchema).default([]),
    familyHistory: z.array(FamilyHistoryItemSchema).default([]),
    pregnancyStatus: z.enum(['none', 'pregnant', 'trying', 'lactating']).optional(),
    menstrualProfile: z.object({
      cycleLength: z.number().int().min(20).max(45),
      periodLength: z.number().int().min(1).max(15),
      lastPeriodStart: z.string().datetime().optional(),
      symptoms: z.array(z.string()).default([]),
      flowIntensity: z.enum(['light', 'medium', 'heavy']).optional(),
      pmsSymptoms: z.array(z.string()).default([]),
      irregularCycles: z.boolean().default(false)
    }).optional(),
    lifestyle: LifestyleSchema.optional()
  }).default({}),
  emergencyContacts: z.array(EmergencyContactSchema).default([]),
  wearableData: z.object({
    lastSync: z.string().datetime().optional(),
    dataTypes: z.array(z.string()).default([]),
    avgSteps: z.number().optional(),
    avgHeartRate: z.number().optional(),
    avgSleepHours: z.number().optional()
  }).optional()
});
export type HealthProfile = z.infer<typeof HealthProfileSchema>;

export const UserProfileSchema = z.object({
  userId: z.string().min(1),
  profiles: z.array(HealthProfileSchema).min(1),
  preferences: z.object({
    notifications: z.object({
      appointments: z.boolean().default(true),
      medications: z.boolean().default(true),
      reminders: z.boolean().default(true),
      reports: z.boolean().default(true),
      healthAlerts: z.boolean().default(true),
      wellnessTips: z.boolean().default(true)
    }).default({}),
    privacyLevel: z.enum(['strict', 'balanced', 'open']).default('balanced'),
    language: z.string().default('en'),
    timezone: z.string().default('Asia/Kolkata')
  }).default({}),
  consent: z.object({
    version: z.string(),
    givenAt: z.string().datetime(),
    withdrawnAt: z.string().datetime().optional(),
    anonymousAnalytics: z.boolean().default(false),
    researchParticipation: z.boolean().default(false),
    thirdPartySharing: z.boolean().default(false)
  }).default({})
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

// ============================================
// HEALTH RECORDS TYPES
// ============================================

export const HealthDocumentTypeSchema = z.enum([
  'blood_report', 'urine_report', 'stool_report', 'xray', 'ct_scan', 'mri',
  'ultrasound', 'ecg', 'echo', 'prescription', 'discharge_summary',
  'medical_certificate', 'vaccination_certificate', 'insurance_document',
  'lab_report', 'pathology_report', 'imaging_report', 'doctor_notes', 'other'
]);
export type HealthDocumentType = z.infer<typeof HealthDocumentTypeSchema>;

export const HealthCategorySchema = z.enum([
  'diabetes', 'cardiac', 'liver', 'thyroid', 'hormonal', 'kidney', 'blood',
  'womens_health', 'preventive', 'fitness', 'nutrition', 'respiratory',
  'digestive', 'musculoskeletal', 'neurological', 'dermatological', 'ophthalmic',
  'dental', 'mental_health', 'general'
]);
export type HealthCategory = z.infer<typeof HealthCategorySchema>;

export const BiomarkerStatusSchema = z.enum(['normal', 'low', 'high', 'critical', 'borderline']);
export type BiomarkerStatus = z.infer<typeof BiomarkerStatusSchema>;

export const BiomarkerTrendSchema = z.enum(['improving', 'stable', 'worsening', 'fluctuating']);
export type BiomarkerTrend = z.infer<typeof BiomarkerTrendSchema>;

export const BiomarkerSchema = z.object({
  name: z.string().min(1).max(100),
  value: z.union([z.string(), z.number()]),
  unit: z.string().max(20).optional(),
  referenceRange: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    text: z.string().max(100).optional()
  }).default({}),
  status: BiomarkerStatusSchema,
  trend: BiomarkerTrendSchema.optional(),
  historicalValues: z.array(z.object({
    value: z.union([z.string(), z.number()]),
    date: z.string().datetime(),
    sourceRecordId: z.string()
  })).optional()
});
export type Biomarker = z.infer<typeof BiomarkerSchema>;

export const HealthRecordSchema = z.object({
  id: z.string(),
  userId: z.string(),
  profileId: z.string().uuid(),
  type: HealthDocumentTypeSchema,
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  file: z.object({
    url: z.string().url(),
    filename: z.string().min(1),
    mimeType: z.string(),
    size: z.number().positive(),
    storageKey: z.string()
  }),
  processing: z.object({
    status: z.enum(['pending', 'processing', 'completed', 'failed']),
    ocrJobId: z.string().optional(),
    ocrStatus: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
    extractionStatus: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
    error: z.string().optional(),
    startedAt: z.string().datetime().optional(),
    completedAt: z.string().datetime().optional()
  }).default({ status: 'pending' }),
  extracted: z.object({
    date: z.string().datetime().optional(),
    doctorName: z.string().max(100).optional(),
    hospitalName: z.string().max(200).optional(),
    labName: z.string().max(200).optional(),
    doctorRegistration: z.string().max(50).optional(),
    biomarkers: z.array(BiomarkerSchema).default([]),
    diagnosis: z.array(z.string()).optional(),
    icdCodes: z.array(z.string()).optional(),
    medications: z.array(z.object({
      name: z.string(),
      dosage: z.string().optional(),
      frequency: z.string().optional()
    })).optional(),
    rawText: z.string().optional(),
    ocrConfidence: z.number().min(0).max(1).default(0),
    aiConfidence: z.number().min(0).max(1).default(0)
  }).optional(),
  category: HealthCategorySchema.optional(),
  tags: z.array(z.string()).default([]),
  isAbnormal: z.boolean().default(false),
  hasFollowUpRequired: z.boolean().default(false),
  abnormalBiomarkers: z.array(z.string()).optional(),
  sharing: z.object({
    isShared: z.boolean().default(false),
    sharedWith: z.array(z.object({
      entityType: z.enum(['doctor', 'lab', 'hospital']),
      entityId: z.string(),
      sharedAt: z.string().datetime(),
      expiresAt: z.string().datetime().optional(),
      consentId: z.string().optional()
    })).default([])
  }).default({ isShared: false, sharedWith: [] }),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string(),
  lastAccessedAt: z.string().datetime()
});
export type HealthRecord = z.infer<typeof HealthRecordSchema>;

// ============================================
// TIMELINE TYPES
// ============================================

export const TimelineEventTypeSchema = z.enum([
  'record_uploaded', 'appointment', 'prescription', 'vaccination', 'surgery',
  'condition_diagnosed', 'medication_started', 'medication_stopped', 'test_result',
  'symptom_reported', 'wellness_activity', 'checkup_reminder', 'medication_reminder',
  'health_alert'
]);
export type TimelineEventType = z.infer<typeof TimelineEventTypeSchema>;

export const HealthTimelineEventSchema = z.object({
  id: z.string(),
  userId: z.string(),
  profileId: z.string().uuid(),
  date: z.string(),
  type: TimelineEventTypeSchema,
  category: HealthCategorySchema.optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  relatedRecordIds: z.array(z.string()).default([]),
  relatedAppointmentId: z.string().optional(),
  relatedDoctorId: z.string().optional(),
  relatedLabId: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  insights: z.array(z.object({
    type: z.enum(['positive', 'neutral', 'concerning']),
    message: z.string()
  })).optional(),
  isRead: z.boolean().default(false),
  readAt: z.string().datetime().optional(),
  isDismissed: z.boolean().default(false),
  dismissedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime()
});
export type HealthTimelineEvent = z.infer<typeof HealthTimelineEventSchema>;

// ============================================
// APPOINTMENT TYPES
// ============================================

export const ProviderTypeSchema = z.enum(['doctor', 'lab', 'pharmacy', 'wellness']);
export type ProviderType = z.infer<typeof ProviderTypeSchema>;

export const AppointmentTypeSchema = z.enum([
  'consultation', 'follow_up', 'diagnostic_test', 'health_package', 'teleconsult', 'home_visit'
]);
export type AppointmentType = z.infer<typeof AppointmentTypeSchema>;

export const AppointmentStatusSchema = z.enum([
  'pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'
]);
export type AppointmentStatus = z.infer<typeof AppointmentStatusSchema>;

export const AppointmentModeSchema = z.enum(['in_clinic', 'teleconsult', 'home_visit', 'online']);
export type AppointmentMode = z.infer<typeof AppointmentModeSchema>;

export const AddressSchema = z.object({
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  pincode: z.string().min(6).max(10),
  landmark: z.string().max(100).optional(),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180)
  }).optional()
}).required();
export type Address = z.infer<typeof AddressSchema>;

export const AppointmentSchema = z.object({
  id: z.string(),
  userId: z.string(),
  profileId: z.string().uuid(),
  providerType: ProviderTypeSchema,
  providerId: z.string(),
  providerDetails: z.object({
    name: z.string(),
    specialization: z.string().optional(),
    photo: z.string().url().optional(),
    address: AddressSchema.optional(),
    phone: z.string().optional(),
    email: z.string().email().optional()
  }),
  type: AppointmentTypeSchema,
  status: AppointmentStatusSchema,
  mode: AppointmentModeSchema,
  schedule: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    timezone: z.string().default('Asia/Kolkata')
  }),
  address: AddressSchema.optional(),
  meetingLink: z.string().url().optional(),
  meetingId: z.string().optional(),
  patientInfo: z.object({
    symptoms: z.array(z.string()).optional(),
    notes: z.string().max(500).optional(),
    relatedRecordIds: z.array(z.string()).optional()
  }).optional(),
  payment: z.object({
    amount: z.number().nonnegative(),
    currency: z.string().default('INR'),
    status: z.enum(['pending', 'paid', 'refunded', 'failed']).default('pending'),
    method: z.string().optional(),
    transactionId: z.string().optional(),
    refundId: z.string().optional(),
    refundAmount: z.number().optional()
  }).default({ amount: 0, currency: 'INR', status: 'pending' }),
  followUpAppointmentId: z.string().optional(),
  previousAppointmentId: z.string().optional(),
  notes: z.string().max(500).optional(),
  doctorNotes: z.string().max(2000).optional(),
  cancellationReason: z.string().max(500).optional(),
  reminders: z.object({
    sent24h: z.boolean().default(false),
    sent1h: z.boolean().default(false),
    sent15m: z.boolean().default(false)
  }).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string(),
  cancelledAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional()
});
export type Appointment = z.infer<typeof AppointmentSchema>;

// ============================================
// WELLNESS TYPES
// ============================================

export const WellnessTypeSchema = z.enum(['cycle', 'habit', 'challenge', 'score']);
export type WellnessType = z.infer<typeof WellnessTypeSchema>;

export const CycleEntryTypeSchema = z.enum([
  'period_start', 'period_end', 'spotting', 'intercourse', 'ovulation',
  'fertile_window', 'symptom', 'mood', 'custom'
]);
export type CycleEntryType = z.infer<typeof CycleEntryTypeSchema>;

export const FlowIntensitySchema = z.enum(['light', 'medium', 'heavy']);
export type FlowIntensity = z.infer<typeof FlowIntensitySchema>;

export const MoodSchema = z.enum(['great', 'good', 'okay', 'bad', 'terrible']);
export type Mood = z.infer<typeof MoodSchema>;

export const CycleDataSchema = z.object({
  cycleType: CycleEntryTypeSchema,
  flowIntensity: FlowIntensitySchema.optional(),
  symptoms: z.array(z.string()).optional(),
  mood: MoodSchema.optional(),
  energy: z.number().int().min(1).max(5).optional(),
  notes: z.string().max(500).optional(),
  cervicalMucus: z.string().optional(),
  temperature: z.number().optional(),
  ovulationConfirmed: z.boolean().optional()
});
export type CycleData = z.infer<typeof CycleDataSchema>;

export const HabitTypeSchema = z.enum(['water', 'sleep', 'steps', 'workout', 'meditation', 'nutrition', 'custom']);
export type HabitType = z.infer<typeof HabitTypeSchema>;

export const HabitDataSchema = z.object({
  habitType: HabitTypeSchema,
  value: z.union([z.number(), z.string()]),
  unit: z.string().optional(),
  goal: z.number().optional(),
  source: z.enum(['manual', 'wearable', 'integration']).default('manual'),
  notes: z.string().max(200).optional(),
  completed: z.boolean().default(false)
});
export type HabitData = z.infer<typeof HabitDataSchema>;

export const ChallengeDataSchema = z.object({
  challengeId: z.string(),
  challengeName: z.string(),
  progress: z.object({
    currentStreak: z.number().int().min(0).default(0),
    longestStreak: z.number().int().min(0).default(0),
    totalPoints: z.number().int().min(0).default(0),
    completedDays: z.number().int().min(0).default(0)
  }),
  joinedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  status: z.enum(['active', 'completed', 'abandoned']).default('active')
});
export type ChallengeData = z.infer<typeof ChallengeDataSchema>;

export const ScoreDataSchema = z.object({
  score: z.number().int().min(0).max(100),
  grade: z.string().regex(/^[A-F][+-]?$/),
  components: z.record(z.number()),
  trend: z.enum(['improving', 'stable', 'declining']),
  calculatedAt: z.string().datetime()
});
export type ScoreData = z.infer<typeof ScoreDataSchema>;

export const WellnessEntrySchema = z.object({
  id: z.string(),
  userId: z.string(),
  profileId: z.string().uuid(),
  date: z.string(),
  type: WellnessTypeSchema,
  data: z.union([CycleDataSchema, HabitDataSchema, ChallengeDataSchema, ScoreDataSchema]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type WellnessEntry = z.infer<typeof WellnessEntrySchema>;

// ============================================
// RISK & ALERTS TYPES
// ============================================

export const RiskSignalTypeSchema = z.enum([
  'abnormal_biomarker', 'recurring_deficiency', 'trend_concern',
  'medication_adherence', 'checkup_due', 'vaccination_due',
  'lifestyle_risk', 'symptom_pattern'
]);
export type RiskSignalType = z.infer<typeof RiskSignalTypeSchema>;

export const RiskSeveritySchema = z.enum(['info', 'warning', 'urgent']);
export type RiskSeverity = z.infer<typeof RiskSeveritySchema>;

export const RiskStatusSchema = z.enum(['active', 'acknowledged', 'dismissed', 'resolved']);
export type RiskStatus = z.infer<typeof RiskStatusSchema>;

export const RecommendedActionTypeSchema = z.enum(['self_care', 'consult_doctor', 'urgent_care', 'emergency']);
export type RecommendedActionType = z.infer<typeof RecommendedActionTypeSchema>;

export const HealthRiskSchema = z.object({
  id: z.string(),
  userId: z.string(),
  profileId: z.string().uuid(),
  signalType: RiskSignalTypeSchema,
  severity: RiskSeveritySchema,
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  sourceRecordIds: z.array(z.string()).optional(),
  sourceBiomarkers: z.array(z.string()).optional(),
  riskFactors: z.array(z.object({
    factor: z.string(),
    contribution: z.number().min(0).max(1)
  })).optional(),
  recommendedAction: z.object({
    type: RecommendedActionTypeSchema,
    specialty: z.string().optional(),
    description: z.string(),
    urgency: z.enum(['low', 'medium', 'high']).optional()
  }),
  status: RiskStatusSchema,
  dismissible: z.boolean().default(true),
  isRead: z.boolean().default(false),
  readAt: z.string().datetime().optional(),
  acknowledgedAt: z.string().datetime().optional(),
  dismissedAt: z.string().datetime().optional(),
  dismissedReason: z.string().optional(),
  resolvedAt: z.string().datetime().optional(),
  resolution: z.string().optional(),
  relatedAppointmentId: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  expiresAt: z.string().datetime().optional()
});
export type HealthRisk = z.infer<typeof HealthRiskSchema>;

// ============================================
// AI TYPES
// ============================================

export const UrgencyLevelSchema = z.enum(['self_care', 'consult_doctor', 'urgent_care', 'emergency']);
export type UrgencyLevel = z.infer<typeof UrgencyLevelSchema>;

export const CopilotTaskSchema = z.enum([
  'explain_report', 'track_biomarker', 'compare_reports', 'find_doctor',
  'book_appointment', 'interpret_symptoms', 'medication_reminder', 'track_cycle',
  'health_score_insight', 'preventive_checkup', 'family_health', 'general_health'
]);
export type CopilotTask = z.infer<typeof CopilotTaskSchema>;

export const SymptomInputSchema = z.object({
  symptom: z.string().min(1).max(200),
  duration: z.string().max(50).optional(),
  severity: z.number().int().min(1).max(5).optional(),
  location: z.string().max(100).optional(),
  triggers: z.array(z.string()).optional(),
  associatedSymptoms: z.array(z.string()).optional()
});
export type SymptomInput = z.infer<typeof SymptomInputSchema>;

export const HealthContextSchema = z.object({
  allergies: z.array(z.string()).default([]),
  chronicConditions: z.array(z.string()).default([]),
  currentMedications: z.array(z.string()).default([]),
  recentSymptoms: z.array(z.string()).default([]),
  lastCheckup: z.string().datetime().optional(),
  familyHistory: z.array(z.string()).default([])
});
export type HealthContext = z.infer<typeof HealthContextSchema>;

export const AIInterpretationSchema = z.object({
  biomarker: z.string(),
  value: z.string(),
  status: BiomarkerStatusSchema,
  explanation: z.object({
    whatItMeans: z.string(),
    whyItMatters: z.string(),
    possibleCauses: z.array(z.string()).optional(),
    generalGuidance: z.string()
  }),
  confidence: z.number().min(0).max(100),
  needsAttention: z.boolean(),
  trend: BiomarkerTrendSchema.optional(),
  recommendedAction: z.enum(['none', 'monitor', 'consult_doctor']).optional()
});
export type AIInterpretation = z.infer<typeof AIInterpretationSchema>;

export const AIReportInterpretationResponseSchema = z.object({
  recordId: z.string(),
  interpretations: z.array(AIInterpretationSchema),
  overallAssessment: z.object({
    summary: z.string(),
    needsDoctorConsult: z.boolean(),
    urgency: z.enum(['low', 'medium', 'high'])
  }),
  safetySignals: z.array(z.object({
    indicator: z.string(),
    action: z.string()
  })).default([]),
  trends: z.array(z.object({
    biomarker: z.string(),
    trend: BiomarkerTrendSchema,
    values: z.array(z.object({
      value: z.union([z.string(), z.number()]),
      date: z.string()
    }))
  })).optional(),
  disclaimer: z.string(),
  confidence: z.number().min(0).max(100)
});
export type AIReportInterpretationResponse = z.infer<typeof AIReportInterpretationResponseSchema>;

export const AISymptomAssessmentResponseSchema = z.object({
  sessionId: z.string(),
  assessment: z.object({
    urgency: UrgencyLevelSchema,
    reasoning: z.array(z.string()),
    recommendedAction: z.object({
      type: RecommendedActionTypeSchema,
      description: z.string(),
      timeframe: z.string().optional()
    })
  }),
  routing: z.object({
    specialties: z.array(z.object({
      specialty: z.string(),
      relevanceScore: z.number().min(0).max(1),
      reason: z.string()
    })).default([]),
    tests: z.array(z.object({
      testName: z.string(),
      reason: z.string(),
      urgency: z.enum(['routine', 'soon', 'urgent'])
    })).default([])
  }).optional(),
  selfCare: z.array(z.string()).optional(),
  emergencyFlags: z.boolean(),
  emergencySymptoms: z.array(z.string()).optional(),
  message: z.string(),
  confidence: z.number().min(0).max(100),
  disclaimer: z.string()
});
export type AISymptomAssessmentResponse = z.infer<typeof AISymptomAssessmentResponseSchema>;

// ============================================
// DOCTOR TYPES
// ============================================

export const DoctorSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  photo: z.string().url().optional(),
  gender: GenderSchema.optional(),
  credentials: z.object({
    specializations: z.array(z.string()).min(1),
    qualifications: z.array(z.string()),
    yearsOfExperience: z.number().int().min(0),
    languages: z.array(z.string()),
    registrationNumber: z.string().optional()
  }),
  practice: z.object({
    hospitalAffiliations: z.array(z.string()),
    clinicName: z.string().optional(),
    clinicAddress: AddressSchema.optional(),
    consultationFees: z.object({
      inClinic: z.number().optional(),
      teleconsult: z.number().optional(),
      homeVisit: z.number().optional()
    }),
    consultationModes: z.array(z.enum(['in_clinic', 'teleconsult', 'home_visit']))
  }),
  availability: z.object({
    workingDays: z.array(z.number().int().min(0).max(6)),
    hours: z.object({
      start: z.string().regex(/^\d{2}:\d{2}$/),
      end: z.string().regex(/^\d{2}:\d{2}$/)
    }),
    slots: z.array(z.object({
      date: z.string(),
      times: z.array(z.string())
    })).optional(),
    nextAvailable: z.string().datetime().optional()
  }),
  ratings: z.object({
    average: z.number().min(0).max(5),
    totalReviews: z.number().int().min(0)
  }),
  insuranceAccepted: z.array(z.string()).optional(),
  bio: z.string().max(1000).optional(),
  awards: z.array(z.string()).optional(),
  publications: z.array(z.string()).optional(),
  isVerified: z.boolean().default(false),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type Doctor = z.infer<typeof DoctorSchema>;

// ============================================
// LAB & PHARMACY TYPES
// ============================================

export const LabSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(200),
  logo: z.string().url().optional(),
  type: z.enum(['chain', 'independent', 'hospital']),
  address: AddressSchema,
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  nablAccredited: z.boolean().default(false),
  certifications: z.array(z.string()).optional(),
  services: z.object({
    homeCollection: z.boolean().default(false),
    homeCollectionFee: z.number().optional(),
    reportDelivery: z.enum(['online', 'physical', 'both']).default('online'),
    emergencyTests: z.boolean().default(false),
    slotBasedAppointments: z.boolean().default(true)
  }),
  operatingHours: z.record(z.object({
    open: z.string(),
    close: z.string(),
    closed: z.boolean().default(false)
  })),
  ratings: z.object({
    average: z.number().min(0).max(5),
    totalReviews: z.number().int().min(0)
  }),
  tests: z.array(z.object({
    testId: z.string(),
    name: z.string(),
    category: z.string(),
    price: z.number(),
    discountedPrice: z.number().optional(),
    turnaroundTime: z.string(),
    parameters: z.array(z.string()).optional(),
    homeCollection: z.boolean().optional(),
    preparation: z.array(z.string()).optional()
  })).optional(),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type Lab = z.infer<typeof LabSchema>;

export const MedicineSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(200),
  genericName: z.string().optional(),
  manufacturer: z.string().optional(),
  composition: z.string().optional(),
  form: z.enum(['tablet', 'capsule', 'syrup', 'injection', 'ointment', 'drops', 'patch', 'inhaler', 'other']),
  strength: z.string().optional(),
  pricing: z.object({
    amount: z.number(),
    currency: z.string().default('INR'),
    perUnit: z.number().optional()
  }),
  requiresPrescription: z.boolean().default(false),
  pharmacies: z.array(z.object({
    id: z.string(),
    name: z.string(),
    address: AddressSchema,
    stock: z.number().int().min(0),
    price: z.number(),
    deliveryTime: z.string().optional()
  })).optional()
});
export type Medicine = z.infer<typeof MedicineSchema>;

// ============================================
// HEALTH SCORE TYPES
// ============================================

export const HealthScoreSchema = z.object({
  userId: z.string(),
  profileId: z.string().uuid(),
  date: z.string(),
  overall: z.object({
    score: z.number().int().min(0).max(100),
    grade: z.string().regex(/^[A-F][+-]?$/),
    trend: z.enum(['improving', 'stable', 'declining'])
  }),
  components: z.object({
    preventive: z.object({
      score: z.number().int().min(0).max(100),
      weight: z.number().min(0).max(1),
      factors: z.object({
        checkupRecency: z.number().int().min(0).max(100),
        vaccinationStatus: z.number().int().min(0).max(100),
        screeningCompletion: z.number().int().min(0).max(100)
      })
    }),
    activity: z.object({
      score: z.number().int().min(0).max(100),
      weight: z.number().min(0).max(1),
      factors: z.object({
        dailyActivity: z.number().int().min(0).max(100),
        workoutConsistency: z.number().int().min(0).max(100),
        stepGoalAchievement: z.number().int().min(0).max(100)
      })
    }),
    lifestyle: z.object({
      score: z.number().int().min(0).max(100),
      weight: z.number().min(0).max(1),
      factors: z.object({
        sleepQuality: z.number().int().min(0).max(100),
        hydration: z.number().int().min(0).max(100),
        stressManagement: z.number().int().min(0).max(100),
        substanceAvoidance: z.number().int().min(0).max(100)
      })
    }),
    biomarkers: z.object({
      score: z.number().int().min(0).max(100),
      weight: z.number().min(0).max(1),
      factors: z.object({
        normalRanges: z.number().int().min(0).max(100),
        trendDirection: z.number().int().min(0).max(100),
        deficiencyTracking: z.number().int().min(0).max(100)
      })
    }),
    engagement: z.object({
      score: z.number().int().min(0).max(100),
      weight: z.number().min(0).max(1),
      factors: z.object({
        recordUploads: z.number().int().min(0).max(100),
        healthCopilotUsage: z.number().int().min(0).max(100),
        challengeParticipation: z.number().int().min(0).max(100)
      })
    })
  }),
  badges: z.array(z.object({
    id: z.string(),
    name: z.string(),
    earnedAt: z.string().datetime()
  })).default([]),
  streaks: z.object({
    habitStreak: z.number().int().min(0).default(0),
    checkupStreak: z.number().int().min(0).default(0),
    preventiveStreak: z.number().int().min(0).default(0)
  }).default({})
});
export type HealthScore = z.infer<typeof HealthScoreSchema>;

// ============================================
// CORPORATE TYPES
// ============================================

export const CorporateSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(200),
  industry: z.string(),
  employeeCount: z.number().int().min(1),
  address: AddressSchema,
  contactPerson: z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string(),
    designation: z.string()
  }),
  subscription: z.object({
    plan: z.enum(['basic', 'standard', 'premium', 'enterprise']),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    features: z.array(z.string()),
    employeeLimit: z.number().int()
  }),
  settings: z.object({
    allowAnonymousAggregates: z.boolean().default(true),
    requireConsent: z.boolean().default(true),
    notifyOnEnrollment: z.boolean().default(true)
  }),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type Corporate = z.infer<typeof CorporateSchema>;

export const CorporateEmployeeSchema = z.object({
  id: z.string(),
  corporateId: z.string(),
  userId: z.string(),
  employeeId: z.string(),
  department: z.string().optional(),
  designation: z.string().optional(),
  enrolledAt: z.string().datetime(),
  status: z.enum(['active', 'inactive', 'suspended']),
  wellnessBenefits: z.array(z.object({
    type: z.string(),
    remaining: z.number(),
    total: z.number()
  }))
});
export type CorporateEmployee = z.infer<typeof CorporateEmployeeSchema>;

// ============================================
// API RESPONSE TYPES
// ============================================

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) => z.object({
  success: z.literal(true),
  data: dataSchema,
  meta: z.object({
    pagination: z.object({
      page: z.number().int().min(1),
      limit: z.number().int().min(1),
      total: z.number().int().min(0),
      totalPages: z.number().int().min(0)
    }).optional(),
    requestId: z.string(),
    timestamp: z.string().datetime()
  }).optional()
});

export const ApiErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
    requestId: z.string(),
    timestamp: z.string().datetime()
  })
});

export type ApiResponse<T> = {
  success: true;
  data: T;
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    requestId: string;
    timestamp: string;
  };
};

export type ApiError = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    requestId: string;
    timestamp: string;
  };
};

// ============================================
// PAGINATION TYPES
// ============================================

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export const PaginationMeta = (total: number, page: number, limit: number) => ({
  pagination: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  }
});

// ============================================
// PREGNANCY TRACKING TYPES
// ============================================

export const PregnancyStatusSchema = z.enum(['trying', 'pregnant', 'postpartum', 'inactive']);
export type PregnancyStatus = z.infer<typeof PregnancyStatusSchema>;

export const TrimesterSchema = z.enum(['first', 'second', 'third']);
export type Trimester = z.infer<typeof TrimesterSchema>;

export const PregnancyWeekDataSchema = z.object({
  week: z.number().int().min(1).max(42),
  trimester: TrimesterSchema,
  babySize: z.string().optional(),
  babyWeight: z.string().optional(),
  motherChanges: z.array(z.string()),
  commonSymptoms: z.array(z.string()),
  recommendedTests: z.array(z.string()),
  importantReminders: z.array(z.string()),
  dietaryRecommendations: z.array(z.string()),
  exerciseSuggestions: z.array(z.string()).optional()
});
export type PregnancyWeekData = z.infer<typeof PregnancyWeekDataSchema>;

export const PregnancyRecordSchema = z.object({
  id: z.string(),
  profileId: z.string().uuid(),
  status: PregnancyStatusSchema,
  conceptionDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  currentWeek: z.number().int().min(0).max(42).optional(),
  trimester: TrimesterSchema.optional(),
  // Checkup schedule
  checkups: z.array(z.object({
    id: z.string(),
    week: z.number().int().min(1).max(42),
    scheduledDate: z.string().datetime(),
    completedDate: z.string().datetime().optional(),
    status: z.enum(['scheduled', 'completed', 'missed', 'cancelled']),
    doctorName: z.string().optional(),
    hospitalName: z.string().optional(),
    notes: z.string().optional(),
    vitals: z.object({
      weight: z.number().optional(),
      bloodPressure: z.string().optional(),
      heartbeat: z.number().optional()
    }).optional(),
    babyHeartbeat: z.number().optional(),
    ultrasoundUrl: z.string().url().optional(),
    complications: z.array(z.string()).optional()
  })),
  // Ultrasound records
  ultrasounds: z.array(z.object({
    id: z.string(),
    date: z.string().datetime(),
    week: z.number().int().min(1).max(42),
    type: z.enum(['dating', 'nt', 'anatomy', 'growth', '3d_4d', 'other']),
    hospitalName: z.string(),
    doctorName: z.string().optional(),
    reportUrl: z.string().url().optional(),
    findings: z.string().optional(),
    babyPosition: z.string().optional(),
    placentaPosition: z.string().optional(),
    amnioticFluid: z.string().optional(),
    measurements: z.record(z.number()).optional()
  })),
  // Glucose tolerance test
  gttResults: z.array(z.object({
    id: z.string(),
    date: z.string().datetime(),
    fasting: z.number().optional(),
    oneHour: z.number().optional(),
    twoHour: z.number().optional(),
    result: z.enum(['normal', 'prediabetic', 'gestational_diabetic']),
    notes: z.string().optional()
  })).optional(),
  // Blood tests during pregnancy
  bloodTests: z.array(z.object({
    id: z.string(),
    date: z.string().datetime(),
    week: z.number().int().min(1).max(42),
    testName: z.string(),
    result: z.string(),
    unit: z.string().optional(),
    referenceRange: z.string().optional(),
    isNormal: z.boolean().optional()
  })),
  notes: z.string().max(2000).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type PregnancyRecord = z.infer<typeof PregnancyRecordSchema>;

// ============================================
// VACCINATION TRACKING TYPES
// ============================================

export const VaccineStatusSchema = z.enum(['pending', 'due', 'overdue', 'completed', 'not_applicable']);
export type VaccineStatus = z.infer<typeof VaccineStatusSchema>;

export const VaccineTypeSchema = z.enum([
  'bcg', 'opv', 'ipv', 'hepb', 'dtap', 'hib', 'pcv', 'rv', 'mmr',
  'varicella', 'hepa', 'hpv', 'influenza', 'pneumococcal',
  'polio', 'rotavirus', 'covid', 'other'
]);
export type VaccineType = z.infer<typeof VaccineTypeSchema>;

export const ChildVaccineRecordSchema = z.object({
  id: z.string(),
  profileId: z.string().uuid(),
  childName: z.string(),
  dateOfBirth: z.string().datetime(),
  // Vaccine schedule by age
  vaccines: z.array(z.object({
    id: z.string(),
    vaccineType: VaccineTypeSchema,
    vaccineName: z.string(),
    doseNumber: z.number().int().min(1).max(5),
    totalDoses: z.number().int().min(1).max(5),
    scheduledDate: z.string().datetime(),
    dueDate: z.string().datetime(),
    completedDate: z.string().datetime().optional(),
    status: VaccineStatusSchema,
    administeredBy: z.string().optional(),
    hospitalName: z.string().optional(),
    batchNumber: z.string().optional(),
    sideEffects: z.array(z.string()).optional(),
    nextDoseDate: z.string().datetime().optional(),
    nextDoseVaccine: z.string().optional(),
    certificateUrl: z.string().url().optional(),
    notes: z.string().max(500).optional()
  })),
  // Reminder settings
  reminders: z.object({
    enabled: z.boolean().default(true),
    advanceDays: z.number().int().min(1).max(30).default(7),
    viaPush: z.boolean().default(true),
    viaSMS: z.boolean().default(false),
    viaEmail: z.boolean().default(false)
  }),
  // Catch-up vaccinations if missed
  catchupVaccines: z.array(z.object({
    vaccineType: VaccineTypeSchema,
    missedDoses: z.number().int(),
    reason: z.string().optional()
  })).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type ChildVaccineRecord = z.infer<typeof ChildVaccineRecordSchema>;

// ============================================
// ADULT VACCINATION TYPES
// ============================================

export const AdultVaccineRecordSchema = z.object({
  id: z.string(),
  profileId: z.string().uuid(),
  vaccines: z.array(z.object({
    id: z.string(),
    vaccineType: VaccineTypeSchema,
    vaccineName: z.string(),
    doseNumber: z.number().int().min(1).max(5).optional(),
    dateAdministered: z.string().datetime(),
    nextDueDate: z.string().datetime().optional(),
    status: VaccineStatusSchema,
    administeredBy: z.string().optional(),
    hospitalName: z.string().optional(),
    batchNumber: z.string().optional(),
    certificateUrl: z.string().url().optional(),
    sideEffects: z.array(z.string()).optional(),
    notes: z.string().max(500).optional()
  })),
  // Recommended vaccines based on age/risk
  recommendedVaccines: z.array(z.object({
    vaccineType: VaccineTypeSchema,
    vaccineName: z.string(),
    reason: z.string(),
    recommendedDate: z.string().datetime().optional()
  })),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type AdultVaccineRecord = z.infer<typeof AdultVaccineRecordSchema>;

// ============================================
// EXPORT ALL
// ============================================

export * from './schemas';
