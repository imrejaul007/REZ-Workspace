"use strict";
// RisaCare Shared Types - Canonical Type Definitions with Zod Validation
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIReportInterpretationResponseSchema = exports.AIInterpretationSchema = exports.HealthContextSchema = exports.SymptomInputSchema = exports.CopilotTaskSchema = exports.UrgencyLevelSchema = exports.HealthRiskSchema = exports.RecommendedActionTypeSchema = exports.RiskStatusSchema = exports.RiskSeveritySchema = exports.RiskSignalTypeSchema = exports.WellnessEntrySchema = exports.ScoreDataSchema = exports.ChallengeDataSchema = exports.HabitDataSchema = exports.HabitTypeSchema = exports.CycleDataSchema = exports.MoodSchema = exports.FlowIntensitySchema = exports.CycleEntryTypeSchema = exports.WellnessTypeSchema = exports.AppointmentSchema = exports.AddressSchema = exports.AppointmentModeSchema = exports.AppointmentStatusSchema = exports.AppointmentTypeSchema = exports.ProviderTypeSchema = exports.HealthTimelineEventSchema = exports.TimelineEventTypeSchema = exports.HealthRecordSchema = exports.BiomarkerSchema = exports.BiomarkerTrendSchema = exports.BiomarkerStatusSchema = exports.HealthCategorySchema = exports.HealthDocumentTypeSchema = exports.UserProfileSchema = exports.HealthProfileSchema = exports.EmergencyContactSchema = exports.FamilyHistoryItemSchema = exports.VaccinationSchema = exports.MedicationSchema = exports.ChronicConditionSchema = exports.AllergySchema = exports.LifestyleSchema = exports.ConditionStatusSchema = exports.AllergyTypeSchema = exports.AllergySeveritySchema = exports.RelationshipSchema = exports.GenderSchema = exports.BloodGroupSchema = void 0;
exports.PaginationMeta = exports.PaginationQuerySchema = exports.ApiErrorSchema = exports.ApiResponseSchema = exports.CorporateEmployeeSchema = exports.CorporateSchema = exports.HealthScoreSchema = exports.MedicineSchema = exports.LabSchema = exports.DoctorSchema = exports.AISymptomAssessmentResponseSchema = void 0;
const zod_1 = require("zod");
// ============================================
// USER & PROFILE TYPES
// ============================================
exports.BloodGroupSchema = zod_1.z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown']);
exports.GenderSchema = zod_1.z.enum(['male', 'female', 'other', 'prefer-not-to-say']);
exports.RelationshipSchema = zod_1.z.enum(['self', 'father', 'mother', 'spouse', 'child', 'sibling', 'other']);
exports.AllergySeveritySchema = zod_1.z.enum(['mild', 'moderate', 'severe', 'life-threatening']);
exports.AllergyTypeSchema = zod_1.z.enum(['food', 'medication', 'environmental', 'other']);
exports.ConditionStatusSchema = zod_1.z.enum(['active', 'managed', 'resolved']);
exports.LifestyleSchema = zod_1.z.object({
    smoking: zod_1.z.enum(['never', 'former', 'current', 'occasional']),
    alcohol: zod_1.z.enum(['never', 'occasional', 'moderate', 'heavy']),
    sleepHours: zod_1.z.number().min(0).max(24),
    waterIntake: zod_1.z.number().min(0).max(20),
    activityLevel: zod_1.z.enum(['sedentary', 'light', 'moderate', 'active', 'very-active']),
    stressLevel: zod_1.z.enum(['low', 'moderate', 'high', 'very-high']),
    foodPreferences: zod_1.z.array(zod_1.z.string())
});
exports.AllergySchema = zod_1.z.object({
    allergen: zod_1.z.string().min(1).max(100),
    type: exports.AllergyTypeSchema,
    severity: exports.AllergySeveritySchema,
    notes: zod_1.z.string().max(500).optional(),
    diagnosedDate: zod_1.z.string().datetime().optional()
});
exports.ChronicConditionSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    diagnosedDate: zod_1.z.string().datetime(),
    status: exports.ConditionStatusSchema,
    medications: zod_1.z.array(zod_1.z.string()).optional(),
    notes: zod_1.z.string().max(500).optional()
});
exports.MedicationSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    dosage: zod_1.z.string().min(1).max(50),
    frequency: zod_1.z.string().min(1).max(100),
    startDate: zod_1.z.string().datetime(),
    endDate: zod_1.z.string().datetime().optional(),
    purpose: zod_1.z.string().max(200).optional(),
    prescribedBy: zod_1.z.string().max(100).optional()
});
exports.VaccinationSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    date: zod_1.z.string().datetime(),
    nextDueDate: zod_1.z.string().datetime().optional(),
    provider: zod_1.z.string().max(100).optional(),
    lotNumber: zod_1.z.string().max(50).optional()
});
exports.FamilyHistoryItemSchema = zod_1.z.object({
    condition: zod_1.z.string().min(1).max(100),
    relation: zod_1.z.enum(['father', 'mother', 'sibling', 'grandparent', 'maternal-grandparent', 'paternal-grandparent']),
    notes: zod_1.z.string().max(200).optional()
});
exports.EmergencyContactSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    relationship: zod_1.z.string().min(1).max(50),
    phone: zod_1.z.string().min(10).max(20),
    isPrimary: zod_1.z.boolean().default(false)
});
exports.HealthProfileSchema = zod_1.z.object({
    profileId: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(1).max(100),
    relationship: exports.RelationshipSchema,
    age: zod_1.z.number().int().min(0).max(150).optional(),
    gender: exports.GenderSchema,
    dateOfBirth: zod_1.z.string().datetime().optional(),
    bloodGroup: exports.BloodGroupSchema.optional(),
    isPrimary: zod_1.z.boolean().default(false),
    isMinor: zod_1.z.boolean().default(false),
    health: zod_1.z.object({
        allergies: zod_1.z.array(exports.AllergySchema).default([]),
        chronicConditions: zod_1.z.array(exports.ChronicConditionSchema).default([]),
        currentMedications: zod_1.z.array(exports.MedicationSchema).default([]),
        vaccinationHistory: zod_1.z.array(exports.VaccinationSchema).default([]),
        familyHistory: zod_1.z.array(exports.FamilyHistoryItemSchema).default([]),
        pregnancyStatus: zod_1.z.enum(['none', 'pregnant', 'trying', 'lactating']).optional(),
        menstrualProfile: zod_1.z.object({
            cycleLength: zod_1.z.number().int().min(20).max(45),
            periodLength: zod_1.z.number().int().min(1).max(15),
            lastPeriodStart: zod_1.z.string().datetime().optional(),
            symptoms: zod_1.z.array(zod_1.z.string()).default([]),
            flowIntensity: zod_1.z.enum(['light', 'medium', 'heavy']).optional(),
            pmsSymptoms: zod_1.z.array(zod_1.z.string()).default([]),
            irregularCycles: zod_1.z.boolean().default(false)
        }).optional(),
        lifestyle: exports.LifestyleSchema.optional()
    }).default({}),
    emergencyContacts: zod_1.z.array(exports.EmergencyContactSchema).default([]),
    wearableData: zod_1.z.object({
        lastSync: zod_1.z.string().datetime().optional(),
        dataTypes: zod_1.z.array(zod_1.z.string()).default([]),
        avgSteps: zod_1.z.number().optional(),
        avgHeartRate: zod_1.z.number().optional(),
        avgSleepHours: zod_1.z.number().optional()
    }).optional()
});
exports.UserProfileSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1),
    profiles: zod_1.z.array(exports.HealthProfileSchema).min(1),
    preferences: zod_1.z.object({
        notifications: zod_1.z.object({
            appointments: zod_1.z.boolean().default(true),
            medications: zod_1.z.boolean().default(true),
            reminders: zod_1.z.boolean().default(true),
            reports: zod_1.z.boolean().default(true),
            healthAlerts: zod_1.z.boolean().default(true),
            wellnessTips: zod_1.z.boolean().default(true)
        }).default({}),
        privacyLevel: zod_1.z.enum(['strict', 'balanced', 'open']).default('balanced'),
        language: zod_1.z.string().default('en'),
        timezone: zod_1.z.string().default('Asia/Kolkata')
    }).default({}),
    consent: zod_1.z.object({
        version: zod_1.z.string(),
        givenAt: zod_1.z.string().datetime(),
        withdrawnAt: zod_1.z.string().datetime().optional(),
        anonymousAnalytics: zod_1.z.boolean().default(false),
        researchParticipation: zod_1.z.boolean().default(false),
        thirdPartySharing: zod_1.z.boolean().default(false)
    }).default({})
});
// ============================================
// HEALTH RECORDS TYPES
// ============================================
exports.HealthDocumentTypeSchema = zod_1.z.enum([
    'blood_report', 'urine_report', 'stool_report', 'xray', 'ct_scan', 'mri',
    'ultrasound', 'ecg', 'echo', 'prescription', 'discharge_summary',
    'medical_certificate', 'vaccination_certificate', 'insurance_document',
    'lab_report', 'pathology_report', 'imaging_report', 'doctor_notes', 'other'
]);
exports.HealthCategorySchema = zod_1.z.enum([
    'diabetes', 'cardiac', 'liver', 'thyroid', 'hormonal', 'kidney', 'blood',
    'womens_health', 'preventive', 'fitness', 'nutrition', 'respiratory',
    'digestive', 'musculoskeletal', 'neurological', 'dermatological', 'ophthalmic',
    'dental', 'mental_health', 'general'
]);
exports.BiomarkerStatusSchema = zod_1.z.enum(['normal', 'low', 'high', 'critical', 'borderline']);
exports.BiomarkerTrendSchema = zod_1.z.enum(['improving', 'stable', 'worsening', 'fluctuating']);
exports.BiomarkerSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    value: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]),
    unit: zod_1.z.string().max(20).optional(),
    referenceRange: zod_1.z.object({
        min: zod_1.z.number().optional(),
        max: zod_1.z.number().optional(),
        text: zod_1.z.string().max(100).optional()
    }).default({}),
    status: exports.BiomarkerStatusSchema,
    trend: exports.BiomarkerTrendSchema.optional(),
    historicalValues: zod_1.z.array(zod_1.z.object({
        value: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]),
        date: zod_1.z.string().datetime(),
        sourceRecordId: zod_1.z.string()
    })).optional()
});
exports.HealthRecordSchema = zod_1.z.object({
    id: zod_1.z.string(),
    userId: zod_1.z.string(),
    profileId: zod_1.z.string().uuid(),
    type: exports.HealthDocumentTypeSchema,
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().max(1000).optional(),
    file: zod_1.z.object({
        url: zod_1.z.string().url(),
        filename: zod_1.z.string().min(1),
        mimeType: zod_1.z.string(),
        size: zod_1.z.number().positive(),
        storageKey: zod_1.z.string()
    }),
    processing: zod_1.z.object({
        status: zod_1.z.enum(['pending', 'processing', 'completed', 'failed']),
        ocrJobId: zod_1.z.string().optional(),
        ocrStatus: zod_1.z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
        extractionStatus: zod_1.z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
        error: zod_1.z.string().optional(),
        startedAt: zod_1.z.string().datetime().optional(),
        completedAt: zod_1.z.string().datetime().optional()
    }).default({ status: 'pending' }),
    extracted: zod_1.z.object({
        date: zod_1.z.string().datetime().optional(),
        doctorName: zod_1.z.string().max(100).optional(),
        hospitalName: zod_1.z.string().max(200).optional(),
        labName: zod_1.z.string().max(200).optional(),
        doctorRegistration: zod_1.z.string().max(50).optional(),
        biomarkers: zod_1.z.array(exports.BiomarkerSchema).default([]),
        diagnosis: zod_1.z.array(zod_1.z.string()).optional(),
        icdCodes: zod_1.z.array(zod_1.z.string()).optional(),
        medications: zod_1.z.array(zod_1.z.object({
            name: zod_1.z.string(),
            dosage: zod_1.z.string().optional(),
            frequency: zod_1.z.string().optional()
        })).optional(),
        rawText: zod_1.z.string().optional(),
        ocrConfidence: zod_1.z.number().min(0).max(1).default(0),
        aiConfidence: zod_1.z.number().min(0).max(1).default(0)
    }).optional(),
    category: exports.HealthCategorySchema.optional(),
    tags: zod_1.z.array(zod_1.z.string()).default([]),
    isAbnormal: zod_1.z.boolean().default(false),
    hasFollowUpRequired: zod_1.z.boolean().default(false),
    abnormalBiomarkers: zod_1.z.array(zod_1.z.string()).optional(),
    sharing: zod_1.z.object({
        isShared: zod_1.z.boolean().default(false),
        sharedWith: zod_1.z.array(zod_1.z.object({
            entityType: zod_1.z.enum(['doctor', 'lab', 'hospital']),
            entityId: zod_1.z.string(),
            sharedAt: zod_1.z.string().datetime(),
            expiresAt: zod_1.z.string().datetime().optional(),
            consentId: zod_1.z.string().optional()
        })).default([])
    }).default({ isShared: false, sharedWith: [] }),
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime(),
    createdBy: zod_1.z.string(),
    lastAccessedAt: zod_1.z.string().datetime()
});
// ============================================
// TIMELINE TYPES
// ============================================
exports.TimelineEventTypeSchema = zod_1.z.enum([
    'record_uploaded', 'appointment', 'prescription', 'vaccination', 'surgery',
    'condition_diagnosed', 'medication_started', 'medication_stopped', 'test_result',
    'symptom_reported', 'wellness_activity', 'checkup_reminder', 'medication_reminder',
    'health_alert'
]);
exports.HealthTimelineEventSchema = zod_1.z.object({
    id: zod_1.z.string(),
    userId: zod_1.z.string(),
    profileId: zod_1.z.string().uuid(),
    date: zod_1.z.string(),
    type: exports.TimelineEventTypeSchema,
    category: exports.HealthCategorySchema.optional(),
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().max(1000).optional(),
    relatedRecordIds: zod_1.z.array(zod_1.z.string()).default([]),
    relatedAppointmentId: zod_1.z.string().optional(),
    relatedDoctorId: zod_1.z.string().optional(),
    relatedLabId: zod_1.z.string().optional(),
    metadata: zod_1.z.record(zod_1.z.unknown()).default({}),
    insights: zod_1.z.array(zod_1.z.object({
        type: zod_1.z.enum(['positive', 'neutral', 'concerning']),
        message: zod_1.z.string()
    })).optional(),
    isRead: zod_1.z.boolean().default(false),
    readAt: zod_1.z.string().datetime().optional(),
    isDismissed: zod_1.z.boolean().default(false),
    dismissedAt: zod_1.z.string().datetime().optional(),
    createdAt: zod_1.z.string().datetime()
});
// ============================================
// APPOINTMENT TYPES
// ============================================
exports.ProviderTypeSchema = zod_1.z.enum(['doctor', 'lab', 'pharmacy', 'wellness']);
exports.AppointmentTypeSchema = zod_1.z.enum([
    'consultation', 'follow_up', 'diagnostic_test', 'health_package', 'teleconsult', 'home_visit'
]);
exports.AppointmentStatusSchema = zod_1.z.enum([
    'pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'
]);
exports.AppointmentModeSchema = zod_1.z.enum(['in_clinic', 'teleconsult', 'home_visit', 'online']);
exports.AddressSchema = zod_1.z.object({
    line1: zod_1.z.string().min(1).max(200),
    line2: zod_1.z.string().max(200).optional(),
    city: zod_1.z.string().min(1).max(100),
    state: zod_1.z.string().min(1).max(100),
    pincode: zod_1.z.string().min(6).max(10),
    landmark: zod_1.z.string().max(100).optional(),
    coordinates: zod_1.z.object({
        lat: zod_1.z.number().min(-90).max(90),
        lng: zod_1.z.number().min(-180).max(180)
    }).optional()
}).required();
exports.AppointmentSchema = zod_1.z.object({
    id: zod_1.z.string(),
    userId: zod_1.z.string(),
    profileId: zod_1.z.string().uuid(),
    providerType: exports.ProviderTypeSchema,
    providerId: zod_1.z.string(),
    providerDetails: zod_1.z.object({
        name: zod_1.z.string(),
        specialization: zod_1.z.string().optional(),
        photo: zod_1.z.string().url().optional(),
        address: exports.AddressSchema.optional(),
        phone: zod_1.z.string().optional(),
        email: zod_1.z.string().email().optional()
    }),
    type: exports.AppointmentTypeSchema,
    status: exports.AppointmentStatusSchema,
    mode: exports.AppointmentModeSchema,
    schedule: zod_1.z.object({
        date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        startTime: zod_1.z.string().regex(/^\d{2}:\d{2}$/),
        endTime: zod_1.z.string().regex(/^\d{2}:\d{2}$/).optional(),
        timezone: zod_1.z.string().default('Asia/Kolkata')
    }),
    address: exports.AddressSchema.optional(),
    meetingLink: zod_1.z.string().url().optional(),
    meetingId: zod_1.z.string().optional(),
    patientInfo: zod_1.z.object({
        symptoms: zod_1.z.array(zod_1.z.string()).optional(),
        notes: zod_1.z.string().max(500).optional(),
        relatedRecordIds: zod_1.z.array(zod_1.z.string()).optional()
    }).optional(),
    payment: zod_1.z.object({
        amount: zod_1.z.number().nonnegative(),
        currency: zod_1.z.string().default('INR'),
        status: zod_1.z.enum(['pending', 'paid', 'refunded', 'failed']).default('pending'),
        method: zod_1.z.string().optional(),
        transactionId: zod_1.z.string().optional(),
        refundId: zod_1.z.string().optional(),
        refundAmount: zod_1.z.number().optional()
    }).default({ amount: 0, currency: 'INR', status: 'pending' }),
    followUpAppointmentId: zod_1.z.string().optional(),
    previousAppointmentId: zod_1.z.string().optional(),
    notes: zod_1.z.string().max(500).optional(),
    doctorNotes: zod_1.z.string().max(2000).optional(),
    cancellationReason: zod_1.z.string().max(500).optional(),
    reminders: zod_1.z.object({
        sent24h: zod_1.z.boolean().default(false),
        sent1h: zod_1.z.boolean().default(false),
        sent15m: zod_1.z.boolean().default(false)
    }).default({}),
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime(),
    createdBy: zod_1.z.string(),
    cancelledAt: zod_1.z.string().datetime().optional(),
    completedAt: zod_1.z.string().datetime().optional()
});
// ============================================
// WELLNESS TYPES
// ============================================
exports.WellnessTypeSchema = zod_1.z.enum(['cycle', 'habit', 'challenge', 'score']);
exports.CycleEntryTypeSchema = zod_1.z.enum([
    'period_start', 'period_end', 'spotting', 'intercourse', 'ovulation',
    'fertile_window', 'symptom', 'mood', 'custom'
]);
exports.FlowIntensitySchema = zod_1.z.enum(['light', 'medium', 'heavy']);
exports.MoodSchema = zod_1.z.enum(['great', 'good', 'okay', 'bad', 'terrible']);
exports.CycleDataSchema = zod_1.z.object({
    cycleType: exports.CycleEntryTypeSchema,
    flowIntensity: exports.FlowIntensitySchema.optional(),
    symptoms: zod_1.z.array(zod_1.z.string()).optional(),
    mood: exports.MoodSchema.optional(),
    energy: zod_1.z.number().int().min(1).max(5).optional(),
    notes: zod_1.z.string().max(500).optional(),
    cervicalMucus: zod_1.z.string().optional(),
    temperature: zod_1.z.number().optional(),
    ovulationConfirmed: zod_1.z.boolean().optional()
});
exports.HabitTypeSchema = zod_1.z.enum(['water', 'sleep', 'steps', 'workout', 'meditation', 'nutrition', 'custom']);
exports.HabitDataSchema = zod_1.z.object({
    habitType: exports.HabitTypeSchema,
    value: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]),
    unit: zod_1.z.string().optional(),
    goal: zod_1.z.number().optional(),
    source: zod_1.z.enum(['manual', 'wearable', 'integration']).default('manual'),
    notes: zod_1.z.string().max(200).optional(),
    completed: zod_1.z.boolean().default(false)
});
exports.ChallengeDataSchema = zod_1.z.object({
    challengeId: zod_1.z.string(),
    challengeName: zod_1.z.string(),
    progress: zod_1.z.object({
        currentStreak: zod_1.z.number().int().min(0).default(0),
        longestStreak: zod_1.z.number().int().min(0).default(0),
        totalPoints: zod_1.z.number().int().min(0).default(0),
        completedDays: zod_1.z.number().int().min(0).default(0)
    }),
    joinedAt: zod_1.z.string().datetime(),
    completedAt: zod_1.z.string().datetime().optional(),
    status: zod_1.z.enum(['active', 'completed', 'abandoned']).default('active')
});
exports.ScoreDataSchema = zod_1.z.object({
    score: zod_1.z.number().int().min(0).max(100),
    grade: zod_1.z.string().regex(/^[A-F][+-]?$/),
    components: zod_1.z.record(zod_1.z.number()),
    trend: zod_1.z.enum(['improving', 'stable', 'declining']),
    calculatedAt: zod_1.z.string().datetime()
});
exports.WellnessEntrySchema = zod_1.z.object({
    id: zod_1.z.string(),
    userId: zod_1.z.string(),
    profileId: zod_1.z.string().uuid(),
    date: zod_1.z.string(),
    type: exports.WellnessTypeSchema,
    data: zod_1.z.union([exports.CycleDataSchema, exports.HabitDataSchema, exports.ChallengeDataSchema, exports.ScoreDataSchema]),
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime()
});
// ============================================
// RISK & ALERTS TYPES
// ============================================
exports.RiskSignalTypeSchema = zod_1.z.enum([
    'abnormal_biomarker', 'recurring_deficiency', 'trend_concern',
    'medication_adherence', 'checkup_due', 'vaccination_due',
    'lifestyle_risk', 'symptom_pattern'
]);
exports.RiskSeveritySchema = zod_1.z.enum(['info', 'warning', 'urgent']);
exports.RiskStatusSchema = zod_1.z.enum(['active', 'acknowledged', 'dismissed', 'resolved']);
exports.RecommendedActionTypeSchema = zod_1.z.enum(['self_care', 'consult_doctor', 'urgent_care', 'emergency']);
exports.HealthRiskSchema = zod_1.z.object({
    id: zod_1.z.string(),
    userId: zod_1.z.string(),
    profileId: zod_1.z.string().uuid(),
    signalType: exports.RiskSignalTypeSchema,
    severity: exports.RiskSeveritySchema,
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().min(1).max(1000),
    sourceRecordIds: zod_1.z.array(zod_1.z.string()).optional(),
    sourceBiomarkers: zod_1.z.array(zod_1.z.string()).optional(),
    riskFactors: zod_1.z.array(zod_1.z.object({
        factor: zod_1.z.string(),
        contribution: zod_1.z.number().min(0).max(1)
    })).optional(),
    recommendedAction: zod_1.z.object({
        type: exports.RecommendedActionTypeSchema,
        specialty: zod_1.z.string().optional(),
        description: zod_1.z.string(),
        urgency: zod_1.z.enum(['low', 'medium', 'high']).optional()
    }),
    status: exports.RiskStatusSchema,
    dismissible: zod_1.z.boolean().default(true),
    isRead: zod_1.z.boolean().default(false),
    readAt: zod_1.z.string().datetime().optional(),
    acknowledgedAt: zod_1.z.string().datetime().optional(),
    dismissedAt: zod_1.z.string().datetime().optional(),
    dismissedReason: zod_1.z.string().optional(),
    resolvedAt: zod_1.z.string().datetime().optional(),
    resolution: zod_1.z.string().optional(),
    relatedAppointmentId: zod_1.z.string().optional(),
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime(),
    expiresAt: zod_1.z.string().datetime().optional()
});
// ============================================
// AI TYPES
// ============================================
exports.UrgencyLevelSchema = zod_1.z.enum(['self_care', 'consult_doctor', 'urgent_care', 'emergency']);
exports.CopilotTaskSchema = zod_1.z.enum([
    'explain_report', 'track_biomarker', 'compare_reports', 'find_doctor',
    'book_appointment', 'interpret_symptoms', 'medication_reminder', 'track_cycle',
    'health_score_insight', 'preventive_checkup', 'family_health', 'general_health'
]);
exports.SymptomInputSchema = zod_1.z.object({
    symptom: zod_1.z.string().min(1).max(200),
    duration: zod_1.z.string().max(50).optional(),
    severity: zod_1.z.number().int().min(1).max(5).optional(),
    location: zod_1.z.string().max(100).optional(),
    triggers: zod_1.z.array(zod_1.z.string()).optional(),
    associatedSymptoms: zod_1.z.array(zod_1.z.string()).optional()
});
exports.HealthContextSchema = zod_1.z.object({
    allergies: zod_1.z.array(zod_1.z.string()).default([]),
    chronicConditions: zod_1.z.array(zod_1.z.string()).default([]),
    currentMedications: zod_1.z.array(zod_1.z.string()).default([]),
    recentSymptoms: zod_1.z.array(zod_1.z.string()).default([]),
    lastCheckup: zod_1.z.string().datetime().optional(),
    familyHistory: zod_1.z.array(zod_1.z.string()).default([])
});
exports.AIInterpretationSchema = zod_1.z.object({
    biomarker: zod_1.z.string(),
    value: zod_1.z.string(),
    status: exports.BiomarkerStatusSchema,
    explanation: zod_1.z.object({
        whatItMeans: zod_1.z.string(),
        whyItMatters: zod_1.z.string(),
        possibleCauses: zod_1.z.array(zod_1.z.string()).optional(),
        generalGuidance: zod_1.z.string()
    }),
    confidence: zod_1.z.number().min(0).max(100),
    needsAttention: zod_1.z.boolean(),
    trend: exports.BiomarkerTrendSchema.optional(),
    recommendedAction: zod_1.z.enum(['none', 'monitor', 'consult_doctor']).optional()
});
exports.AIReportInterpretationResponseSchema = zod_1.z.object({
    recordId: zod_1.z.string(),
    interpretations: zod_1.z.array(exports.AIInterpretationSchema),
    overallAssessment: zod_1.z.object({
        summary: zod_1.z.string(),
        needsDoctorConsult: zod_1.z.boolean(),
        urgency: zod_1.z.enum(['low', 'medium', 'high'])
    }),
    safetySignals: zod_1.z.array(zod_1.z.object({
        indicator: zod_1.z.string(),
        action: zod_1.z.string()
    })).default([]),
    trends: zod_1.z.array(zod_1.z.object({
        biomarker: zod_1.z.string(),
        trend: exports.BiomarkerTrendSchema,
        values: zod_1.z.array(zod_1.z.object({
            value: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]),
            date: zod_1.z.string()
        }))
    })).optional(),
    disclaimer: zod_1.z.string(),
    confidence: zod_1.z.number().min(0).max(100)
});
exports.AISymptomAssessmentResponseSchema = zod_1.z.object({
    sessionId: zod_1.z.string(),
    assessment: zod_1.z.object({
        urgency: exports.UrgencyLevelSchema,
        reasoning: zod_1.z.array(zod_1.z.string()),
        recommendedAction: zod_1.z.object({
            type: exports.RecommendedActionTypeSchema,
            description: zod_1.z.string(),
            timeframe: zod_1.z.string().optional()
        })
    }),
    routing: zod_1.z.object({
        specialties: zod_1.z.array(zod_1.z.object({
            specialty: zod_1.z.string(),
            relevanceScore: zod_1.z.number().min(0).max(1),
            reason: zod_1.z.string()
        })).default([]),
        tests: zod_1.z.array(zod_1.z.object({
            testName: zod_1.z.string(),
            reason: zod_1.z.string(),
            urgency: zod_1.z.enum(['routine', 'soon', 'urgent'])
        })).default([])
    }).optional(),
    selfCare: zod_1.z.array(zod_1.z.string()).optional(),
    emergencyFlags: zod_1.z.boolean(),
    emergencySymptoms: zod_1.z.array(zod_1.z.string()).optional(),
    message: zod_1.z.string(),
    confidence: zod_1.z.number().min(0).max(100),
    disclaimer: zod_1.z.string()
});
// ============================================
// DOCTOR TYPES
// ============================================
exports.DoctorSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string().min(1).max(100),
    photo: zod_1.z.string().url().optional(),
    gender: exports.GenderSchema.optional(),
    credentials: zod_1.z.object({
        specializations: zod_1.z.array(zod_1.z.string()).min(1),
        qualifications: zod_1.z.array(zod_1.z.string()),
        yearsOfExperience: zod_1.z.number().int().min(0),
        languages: zod_1.z.array(zod_1.z.string()),
        registrationNumber: zod_1.z.string().optional()
    }),
    practice: zod_1.z.object({
        hospitalAffiliations: zod_1.z.array(zod_1.z.string()),
        clinicName: zod_1.z.string().optional(),
        clinicAddress: exports.AddressSchema.optional(),
        consultationFees: zod_1.z.object({
            inClinic: zod_1.z.number().optional(),
            teleconsult: zod_1.z.number().optional(),
            homeVisit: zod_1.z.number().optional()
        }),
        consultationModes: zod_1.z.array(zod_1.z.enum(['in_clinic', 'teleconsult', 'home_visit']))
    }),
    availability: zod_1.z.object({
        workingDays: zod_1.z.array(zod_1.z.number().int().min(0).max(6)),
        hours: zod_1.z.object({
            start: zod_1.z.string().regex(/^\d{2}:\d{2}$/),
            end: zod_1.z.string().regex(/^\d{2}:\d{2}$/)
        }),
        slots: zod_1.z.array(zod_1.z.object({
            date: zod_1.z.string(),
            times: zod_1.z.array(zod_1.z.string())
        })).optional(),
        nextAvailable: zod_1.z.string().datetime().optional()
    }),
    ratings: zod_1.z.object({
        average: zod_1.z.number().min(0).max(5),
        totalReviews: zod_1.z.number().int().min(0)
    }),
    insuranceAccepted: zod_1.z.array(zod_1.z.string()).optional(),
    bio: zod_1.z.string().max(1000).optional(),
    awards: zod_1.z.array(zod_1.z.string()).optional(),
    publications: zod_1.z.array(zod_1.z.string()).optional(),
    isVerified: zod_1.z.boolean().default(false),
    isActive: zod_1.z.boolean().default(true),
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime()
});
// ============================================
// LAB & PHARMACY TYPES
// ============================================
exports.LabSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string().min(1).max(200),
    logo: zod_1.z.string().url().optional(),
    type: zod_1.z.enum(['chain', 'independent', 'hospital']),
    address: exports.AddressSchema,
    phone: zod_1.z.string().optional(),
    email: zod_1.z.string().email().optional(),
    website: zod_1.z.string().url().optional(),
    nablAccredited: zod_1.z.boolean().default(false),
    certifications: zod_1.z.array(zod_1.z.string()).optional(),
    services: zod_1.z.object({
        homeCollection: zod_1.z.boolean().default(false),
        homeCollectionFee: zod_1.z.number().optional(),
        reportDelivery: zod_1.z.enum(['online', 'physical', 'both']).default('online'),
        emergencyTests: zod_1.z.boolean().default(false),
        slotBasedAppointments: zod_1.z.boolean().default(true)
    }),
    operatingHours: zod_1.z.record(zod_1.z.object({
        open: zod_1.z.string(),
        close: zod_1.z.string(),
        closed: zod_1.z.boolean().default(false)
    })),
    ratings: zod_1.z.object({
        average: zod_1.z.number().min(0).max(5),
        totalReviews: zod_1.z.number().int().min(0)
    }),
    tests: zod_1.z.array(zod_1.z.object({
        testId: zod_1.z.string(),
        name: zod_1.z.string(),
        category: zod_1.z.string(),
        price: zod_1.z.number(),
        discountedPrice: zod_1.z.number().optional(),
        turnaroundTime: zod_1.z.string(),
        parameters: zod_1.z.array(zod_1.z.string()).optional(),
        homeCollection: zod_1.z.boolean().optional(),
        preparation: zod_1.z.array(zod_1.z.string()).optional()
    })).optional(),
    isActive: zod_1.z.boolean().default(true),
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime()
});
exports.MedicineSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string().min(1).max(200),
    genericName: zod_1.z.string().optional(),
    manufacturer: zod_1.z.string().optional(),
    composition: zod_1.z.string().optional(),
    form: zod_1.z.enum(['tablet', 'capsule', 'syrup', 'injection', 'ointment', 'drops', 'patch', 'inhaler', 'other']),
    strength: zod_1.z.string().optional(),
    pricing: zod_1.z.object({
        amount: zod_1.z.number(),
        currency: zod_1.z.string().default('INR'),
        perUnit: zod_1.z.number().optional()
    }),
    requiresPrescription: zod_1.z.boolean().default(false),
    pharmacies: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        name: zod_1.z.string(),
        address: exports.AddressSchema,
        stock: zod_1.z.number().int().min(0),
        price: zod_1.z.number(),
        deliveryTime: zod_1.z.string().optional()
    })).optional()
});
// ============================================
// HEALTH SCORE TYPES
// ============================================
exports.HealthScoreSchema = zod_1.z.object({
    userId: zod_1.z.string(),
    profileId: zod_1.z.string().uuid(),
    date: zod_1.z.string(),
    overall: zod_1.z.object({
        score: zod_1.z.number().int().min(0).max(100),
        grade: zod_1.z.string().regex(/^[A-F][+-]?$/),
        trend: zod_1.z.enum(['improving', 'stable', 'declining'])
    }),
    components: zod_1.z.object({
        preventive: zod_1.z.object({
            score: zod_1.z.number().int().min(0).max(100),
            weight: zod_1.z.number().min(0).max(1),
            factors: zod_1.z.object({
                checkupRecency: zod_1.z.number().int().min(0).max(100),
                vaccinationStatus: zod_1.z.number().int().min(0).max(100),
                screeningCompletion: zod_1.z.number().int().min(0).max(100)
            })
        }),
        activity: zod_1.z.object({
            score: zod_1.z.number().int().min(0).max(100),
            weight: zod_1.z.number().min(0).max(1),
            factors: zod_1.z.object({
                dailyActivity: zod_1.z.number().int().min(0).max(100),
                workoutConsistency: zod_1.z.number().int().min(0).max(100),
                stepGoalAchievement: zod_1.z.number().int().min(0).max(100)
            })
        }),
        lifestyle: zod_1.z.object({
            score: zod_1.z.number().int().min(0).max(100),
            weight: zod_1.z.number().min(0).max(1),
            factors: zod_1.z.object({
                sleepQuality: zod_1.z.number().int().min(0).max(100),
                hydration: zod_1.z.number().int().min(0).max(100),
                stressManagement: zod_1.z.number().int().min(0).max(100),
                substanceAvoidance: zod_1.z.number().int().min(0).max(100)
            })
        }),
        biomarkers: zod_1.z.object({
            score: zod_1.z.number().int().min(0).max(100),
            weight: zod_1.z.number().min(0).max(1),
            factors: zod_1.z.object({
                normalRanges: zod_1.z.number().int().min(0).max(100),
                trendDirection: zod_1.z.number().int().min(0).max(100),
                deficiencyTracking: zod_1.z.number().int().min(0).max(100)
            })
        }),
        engagement: zod_1.z.object({
            score: zod_1.z.number().int().min(0).max(100),
            weight: zod_1.z.number().min(0).max(1),
            factors: zod_1.z.object({
                recordUploads: zod_1.z.number().int().min(0).max(100),
                healthCopilotUsage: zod_1.z.number().int().min(0).max(100),
                challengeParticipation: zod_1.z.number().int().min(0).max(100)
            })
        })
    }),
    badges: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        name: zod_1.z.string(),
        earnedAt: zod_1.z.string().datetime()
    })).default([]),
    streaks: zod_1.z.object({
        habitStreak: zod_1.z.number().int().min(0).default(0),
        checkupStreak: zod_1.z.number().int().min(0).default(0),
        preventiveStreak: zod_1.z.number().int().min(0).default(0)
    }).default({})
});
// ============================================
// CORPORATE TYPES
// ============================================
exports.CorporateSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string().min(1).max(200),
    industry: zod_1.z.string(),
    employeeCount: zod_1.z.number().int().min(1),
    address: exports.AddressSchema,
    contactPerson: zod_1.z.object({
        name: zod_1.z.string(),
        email: zod_1.z.string().email(),
        phone: zod_1.z.string(),
        designation: zod_1.z.string()
    }),
    subscription: zod_1.z.object({
        plan: zod_1.z.enum(['basic', 'standard', 'premium', 'enterprise']),
        startDate: zod_1.z.string().datetime(),
        endDate: zod_1.z.string().datetime(),
        features: zod_1.z.array(zod_1.z.string()),
        employeeLimit: zod_1.z.number().int()
    }),
    settings: zod_1.z.object({
        allowAnonymousAggregates: zod_1.z.boolean().default(true),
        requireConsent: zod_1.z.boolean().default(true),
        notifyOnEnrollment: zod_1.z.boolean().default(true)
    }),
    isActive: zod_1.z.boolean().default(true),
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime()
});
exports.CorporateEmployeeSchema = zod_1.z.object({
    id: zod_1.z.string(),
    corporateId: zod_1.z.string(),
    userId: zod_1.z.string(),
    employeeId: zod_1.z.string(),
    department: zod_1.z.string().optional(),
    designation: zod_1.z.string().optional(),
    enrolledAt: zod_1.z.string().datetime(),
    status: zod_1.z.enum(['active', 'inactive', 'suspended']),
    wellnessBenefits: zod_1.z.array(zod_1.z.object({
        type: zod_1.z.string(),
        remaining: zod_1.z.number(),
        total: zod_1.z.number()
    }))
});
// ============================================
// API RESPONSE TYPES
// ============================================
const ApiResponseSchema = (dataSchema) => zod_1.z.object({
    success: zod_1.z.literal(true),
    data: dataSchema,
    meta: zod_1.z.object({
        pagination: zod_1.z.object({
            page: zod_1.z.number().int().min(1),
            limit: zod_1.z.number().int().min(1),
            total: zod_1.z.number().int().min(0),
            totalPages: zod_1.z.number().int().min(0)
        }).optional(),
        requestId: zod_1.z.string(),
        timestamp: zod_1.z.string().datetime()
    }).optional()
});
exports.ApiResponseSchema = ApiResponseSchema;
exports.ApiErrorSchema = zod_1.z.object({
    success: zod_1.z.literal(false),
    error: zod_1.z.object({
        code: zod_1.z.string(),
        message: zod_1.z.string(),
        details: zod_1.z.record(zod_1.z.unknown()).optional(),
        requestId: zod_1.z.string(),
        timestamp: zod_1.z.string().datetime()
    })
});
// ============================================
// PAGINATION TYPES
// ============================================
exports.PaginationQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc')
});
const PaginationMeta = (total, page, limit) => ({
    pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
    }
});
exports.PaginationMeta = PaginationMeta;
// ============================================
// EXPORT ALL
// ============================================
__exportStar(require("./schemas"), exports);
//# sourceMappingURL=index.js.map