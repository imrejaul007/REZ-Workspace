/**
 * MyRisa Universal Human Memory - Core Types
 *
 * Human Intelligence OS Foundation
 * Following RTNM Doctrine: Identity → Memory → Knowledge → Twin → Agent → Intelligence
 *
 * All 7 Domains:
 * 1. Physical Health
 * 2. Mental Wellness
 * 3. Sexual Wellness
 * 4. Lifestyle
 * 5. Work-Life Balance
 * 6. Family
 * 7. Relationships
 */

import { z } from 'zod';

// ============================================
// CORE ENTITY SCHEMAS
// ============================================

// Person - Universal identity
export const PersonSchema = z.object({
  id: z.string().uuid(),
  corpId: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  occupation: z.string().optional(),
  location: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type Person = z.infer<typeof PersonSchema>;

// Life Event - Cross-domain events
export const LifeEventSchema = z.object({
  id: z.string().uuid(),
  personId: z.string().uuid(),
  eventType: z.enum([
    'marriage', 'divorce', 'childbirth', 'child_adoption',
    'job_change', 'job_loss', 'promotion', 'retirement',
    'relocation', 'pregnancy', 'miscarriage', 'menopause',
    'diagnosis', 'surgery', 'hospitalization',
    'death_close', 'breakup', 'starting_therapy',
    'weight_change_significant', 'lifestyle_change',
    'medication_change', 'insurance_change', 'other'
  ]),
  eventDate: z.string(),
  title: z.string(),
  description: z.string().optional(),
  impact: z.object({
    physical: z.number().min(0).max(10).default(5),
    mental: z.number().min(0).max(10).default(5),
    relationships: z.number().min(0).max(10).default(5),
    work: z.number().min(0).max(10).default(5),
    financial: z.number().min(0).max(10).default(5)
  }).optional(),
  relatedDomains: z.array(z.enum(['physical', 'mental', 'sexual', 'lifestyle', 'worklife', 'family', 'relationships'])).default([]),
  relatedEntities: z.record(z.array(z.string())).default({}),
  metadata: z.record(z.any()).default({}),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type LifeEvent = z.infer<typeof LifeEventSchema>;

// ============================================
// DOMAIN 1: PHYSICAL HEALTH
// ============================================

export const PhysicalHealthRecordSchema = z.object({
  id: z.string().uuid(),
  personId: z.string().uuid(),
  type: z.enum(['vital', 'lab_result', 'imaging', 'diagnosis', 'procedure', 'medication', 'vaccination', 'allergy']),
  date: z.string(),
  data: z.record(z.any()),
  source: z.enum(['manual', 'wearable', 'lab', 'imaging', 'doctor', 'ai_extracted']).default('manual'),
  confidence: z.number().min(0).max(1).default(1),
  metadata: z.record(z.any()).default({}),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type PhysicalHealthRecord = z.infer<typeof PhysicalHealthRecordSchema>;

// Vitals
export const VitalRecordSchema = z.object({
  personId: z.string().uuid(),
  date: z.string(),
  heartRate: z.number().optional(),
  bloodPressureSystolic: z.number().optional(),
  bloodPressureDiastolic: z.number().optional(),
  temperature: z.number().optional(),
  respiratoryRate: z.number().optional(),
  oxygenSaturation: z.number().optional(),
  weight: z.number().optional(),
  height: z.number().optional(),
  bmi: z.number().optional(),
  bloodGlucose: z.number().optional(),
  notes: z.string().optional()
});

export type VitalRecord = z.infer<typeof VitalRecordSchema>;

// ============================================
// DOMAIN 2: MENTAL WELLNESS
// ============================================

// Mood Entry
export const MoodEntrySchema = z.object({
  id: z.string().uuid(),
  personId: z.string().uuid(),
  date: z.string(),
  primaryMood: z.enum(['very_sad', 'sad', 'neutral', 'happy', 'very_happy', 'anxious', 'stressed', 'calm', 'angry', 'frustrated', 'hopeful', 'grateful']),
  secondaryMoods: z.array(z.enum(['very_sad', 'sad', 'neutral', 'happy', 'very_happy', 'anxious', 'stressed', 'calm', 'angry', 'frustrated', 'hopeful', 'grateful'])).default([]),
  intensity: z.number().min(1).max(10).default(5),
  energyLevel: z.number().min(1).max(10).default(5),
  anxietyLevel: z.number().min(1).max(10).default(5),
  triggers: z.array(z.string()).default([]),
  activities: z.array(z.string()).default([]),
  socialInteractions: z.enum(['none', 'few', 'moderate', 'many']).default('moderate'),
  sleepQuality: z.enum(['terrible', 'poor', 'okay', 'good', 'excellent']).default('okay'),
  notes: z.string().optional(),
  gratitudeJournal: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type MoodEntry = z.infer<typeof MoodEntrySchema>;

// Stress Record
export const StressRecordSchema = z.object({
  id: z.string().uuid(),
  personId: z.string().uuid(),
  date: z.string(),
  stressLevel: z.number().min(1).max(10),
  sources: z.array(z.enum(['work', 'relationships', 'financial', 'health', 'family', 'academic', 'social', 'other'])).default([]),
  physicalSymptoms: z.array(z.enum(['headache', 'muscle_tension', 'fatigue', 'sleep_issues', 'digestive_issues', 'appetite_changes'])).default([]),
  copingMechanisms: z.array(z.string()).default([]),
  duration: z.enum(['few_hours', 'day', 'few_days', 'week', 'longer']).default('day'),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type StressRecord = z.infer<typeof StressRecordSchema>;

// Therapy Session
export const TherapySessionSchema = z.object({
  id: z.string().uuid(),
  personId: z.string().uuid(),
  therapistId: z.string().uuid(),
  date: z.string(),
  sessionType: z.enum(['in_person', 'video', 'phone', 'chat']),
  duration: z.number(), // minutes
  topicsDiscussed: z.array(z.string()).default([]),
  homework: z.string().optional(),
  insights: z.string().optional(),
  moodBefore: z.number().min(1).max(10),
  moodAfter: z.number().min(1).max(10),
  nextSessionDate: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type TherapySession = z.infer<typeof TherapySessionSchema>;

// Mental Wellness Goals
export const MentalWellnessGoalSchema = z.object({
  id: z.string().uuid(),
  personId: z.string().uuid(),
  goalType: z.enum(['reduce_anxiety', 'improve_mood', 'better_sleep', 'stress_management', 'build_resilience', 'improve_relationships', 'other']),
  target: z.string(),
  currentValue: z.number().optional(),
  targetValue: z.number().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  progress: z.number().min(0).max(100).default(0),
  status: z.enum(['active', 'completed', 'paused', 'abandoned']).default('active'),
  milestones: z.array(z.object({
    title: z.string(),
    achieved: z.boolean(),
    date: z.string().optional()
  })).default([]),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type MentalWellnessGoal = z.infer<typeof MentalWellnessGoalSchema>;

// Mental Health Summary
export interface MentalWellnessSummary {
  overallMood: number; // 1-10
  anxietyTrend: 'improving' | 'stable' | 'worsening';
  stressTrend: 'improving' | 'stable' | 'worsening';
  sleepQuality: number; // 1-10
  burnoutRisk: 'low' | 'moderate' | 'high';
  socialConnection: number; // 1-10
  therapyEngagement: 'none' | 'occasional' | 'regular';
  recentInsights: string[];
  recommendations: string[];
}

// ============================================
// DOMAIN 3: SEXUAL WELLNESS
// ============================================

// Sexual Health Record
export const SexualHealthRecordSchema = z.object({
  id: z.string().uuid(),
  personId: z.string().uuid(),
  date: z.string(),
  type: z.enum(['activity', 'libido', 'contraception', 'fertility', 'reproductive_health', 'std_screening', 'intimacy']),
  data: z.record(z.any()),
  partnerId: z.string().uuid().optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type SexualHealthRecord = z.infer<typeof SexualHealthRecordSchema>;

// Sexual Activity
export const SexualActivitySchema = z.object({
  id: z.string().uuid(),
  personId: z.string().uuid(),
  date: z.string(),
  partnerId: z.string().uuid().optional(),
  type: z.enum(['solo', 'partner', 'group']),
  protectionUsed: z.boolean().default(false),
  contraception: z.array(z.enum(['condom', 'pill', 'iud', 'patch', 'ring', 'injection', 'implant', 'none'])).default([]),
  satisfaction: z.number().min(1).max(10).optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type SexualActivity = z.infer<typeof SexualActivitySchema>;

// Libido Tracking
export const LibidoRecordSchema = z.object({
  id: z.string().uuid(),
  personId: z.string().uuid(),
  date: z.string(),
  level: z.number().min(1).max(10),
  factors: z.array(z.enum(['hormonal', 'stress', 'sleep', 'medication', 'relationship', 'fatigue', 'mental_health', 'other'])).default([]),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type LibidoRecord = z.infer<typeof LibidoRecordSchema>;

// Fertility Tracking
export const FertilityRecordSchema = z.object({
  id: z.string().uuid(),
  personId: z.string().uuid(),
  date: z.string(),
  cycleDay: z.number().optional(),
  bbt: z.number().optional(), // Basal body temperature
  cervicalMucus: z.enum(['dry', 'sticky', 'creamy', 'watery', 'egg_white']).optional(),
  ovulationTest: z.enum(['negative', 'positive', 'invalid']).optional(),
  fertilityIntention: z.enum(['trying', 'preventing', 'none']).default('none'),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type FertilityRecord = z.infer<typeof FertilityRecordSchema>;

// Contraception
export const ContraceptionSchema = z.object({
  id: z.string().uuid(),
  personId: z.string().uuid(),
  method: z.enum(['condom', 'pill', 'iud', 'patch', 'ring', 'injection', 'implant', 'diaphragm', 'fertility_awareness', 'withdrawal', 'sterilization', 'none']),
  startDate: z.string(),
  endDate: z.string().optional(),
  reminderTime: z.string().optional(),
  sideEffects: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type Contraception = z.infer<typeof ContraceptionSchema>;

// ============================================
// DOMAIN 4: LIFESTYLE
// ============================================

// Sleep Record
export const SleepRecordSchema = z.object({
  id: z.string().uuid(),
  personId: z.string().uuid(),
  date: z.string(),
  bedtime: z.string(),
  wakeTime: z.string(),
  durationMinutes: z.number(),
  sleepQuality: z.enum(['terrible', 'poor', 'okay', 'good', 'excellent']).default('okay'),
  deepSleepMinutes: z.number().optional(),
  lightSleepMinutes: z.number().optional(),
  remSleepMinutes: z.number().optional(),
  wakeUps: z.number().optional(),
  sleepDebt: z.number().optional(), // minutes
  naps: z.array(z.object({
    startTime: z.string(),
    duration: z.number()
  })).default([]),
 影响因素: z.array(z.enum(['stress', 'caffeine', 'alcohol', 'exercise', 'screen_time', 'meal_timing', 'environment'])).default([]),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type SleepRecord = z.infer<typeof SleepRecordSchema>;

// Nutrition Record
export const NutritionRecordSchema = z.object({
  id: z.string().uuid(),
  personId: z.string().uuid(),
  date: z.string(),
  meals: z.array(z.object({
    type: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'supper']),
    time: z.string(),
    foods: z.array(z.object({
      name: z.string(),
      servings: z.number().default(1),
      calories: z.number().optional(),
      protein: z.number().optional(),
      carbs: z.number().optional(),
      fat: z.number().optional()
    })),
    notes: z.string().optional()
  })).default([]),
  waterIntake: z.number().optional(), // ml
  caffeineIntake: z.number().optional(), // mg
  alcoholIntake: z.number().optional(), // units
  totalCalories: z.number().optional(),
  macros: z.object({
    protein: z.number().optional(),
    carbs: z.number().optional(),
    fat: z.number().optional()
  }).optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type NutritionRecord = z.infer<typeof NutritionRecordSchema>;

// Exercise Record
export const ExerciseRecordSchema = z.object({
  id: z.string().uuid(),
  personId: z.string().uuid(),
  date: z.string(),
  activity: z.string(),
  type: z.enum(['cardio', 'strength', 'flexibility', 'balance', 'sports', 'walking', 'yoga', 'swimming', 'cycling', 'other']),
  duration: z.number(), // minutes
  intensity: z.enum(['light', 'moderate', 'vigorous']).default('moderate'),
  caloriesBurned: z.number().optional(),
  distance: z.number().optional(), // km
  heartRateAvg: z.number().optional(),
  heartRateMax: z.number().optional(),
  steps: z.number().optional(),
  perceivedExertion: z.number().min(1).max(10).optional(),
  moodBefore: z.number().min(1).max(10).optional(),
  moodAfter: z.number().min(1).max(10).optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type ExerciseRecord = z.infer<typeof ExerciseRecordSchema>;

// Habit Tracking
export const HabitRecordSchema = z.object({
  id: z.string().uuid(),
  personId: z.string().uuid(),
  habitId: z.string().uuid(),
  date: z.string(),
  completed: z.boolean(),
  value: z.number().optional(),
  notes: z.string().optional(),
  createdAt: z.string()
});

export type HabitRecord = z.infer<typeof HabitRecordSchema>;

// Habit Definition
export const HabitSchema = z.object({
  id: z.string().uuid(),
  personId: z.string().uuid(),
  name: z.string(),
  category: z.enum(['health', 'fitness', 'mental', 'productivity', 'social', 'creative', 'other']),
  frequency: z.enum(['daily', 'weekdays', 'weekends', 'weekly', 'custom']),
  targetDays: z.array(z.number()).default([]), // 0-6
  reminderTime: z.string().optional(),
  targetValue: z.number().optional(),
  unit: z.string().optional(),
  streak: z.number().default(0),
  bestStreak: z.number().default(0),
  isActive: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type Habit = z.infer<typeof HabitSchema>;

// ============================================
// DOMAIN 5: WORK-LIFE BALANCE
// ============================================

// Work Record
export const WorkRecordSchema = z.object({
  id: z.string().uuid(),
  personId: z.string().uuid(),
  date: z.string(),
  workHours: z.number(),
  meetingHours: z.number().optional(),
  deepWorkHours: z.number().optional(),
  overtimeHours: z.number().optional(),
  tasksCompleted: z.number().optional(),
  contextSwitches: z.number().optional(),
  workFromHome: z.boolean().default(false),
  stressLevel: z.number().min(1).max(10).optional(),
  energyLevel: z.number().min(1).max(10).optional(),
  productivityScore: z.number().min(1).max(10).optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type WorkRecord = z.infer<typeof WorkRecordSchema>;

// Burnout Risk Assessment
export interface BurnoutAssessment {
  overallRisk: 'low' | 'moderate' | 'high' | 'severe';
  exhaustionScore: number; // 1-10
  cynicismScore: number; // 1-10
  inefficacyScore: number; // 1-10
  contributingFactors: string[];
  protectiveFactors: string[];
  recommendations: string[];
  nextAssessmentDate: string;
}

// PTO Tracking
export const PTORecordSchema = z.object({
  id: z.string().uuid(),
  personId: z.string().uuid(),
  type: z.enum(['vacation', 'sick', 'personal', 'parental', 'bereavement', 'other']),
  startDate: z.string(),
  endDate: z.string(),
  totalDays: z.number(),
  reason: z.string().optional(),
  planned: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type PTORecord = z.infer<typeof PTORecordSchema>;

// Work-Life Balance Score
export interface WorkLifeBalanceScore {
  overall: number; // 1-10
  workHours: number; // 1-10
  recoveryTime: number; // 1-10
  boundarySetting: number; // 1-10
  socialLife: number; // 1-10
  personalTime: number; // 1-10
  trends: {
    workHoursTrend: 'increasing' | 'stable' | 'decreasing';
    recoveryTrend: 'improving' | 'stable' | 'worsening';
  };
  recommendations: string[];
}

// ============================================
// DOMAIN 6: FAMILY
// ============================================

// Family Member
export const FamilyMemberSchema = z.object({
  id: z.string().uuid(),
  personId: z.string().uuid(), // Primary user
  firstName: z.string(),
  lastName: z.string().optional(),
  relationship: z.enum(['mother', 'father', 'child', 'spouse', 'partner', 'sibling', 'grandparent', 'grandchild', 'in_laws', 'other']),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  healthContext: z.enum(['woman', 'man', 'child', 'elder', 'general']).default('general'),
  healthGoals: z.array(z.string()).default([]),
  isPrimaryCaregiver: z.boolean().default(false),
  emergencyContact: z.boolean().default(false),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type FamilyMember = z.infer<typeof FamilyMemberSchema>;

// Family Health Record (for family members)
export const FamilyHealthRecordSchema = z.object({
  id: z.string().uuid(),
  familyMemberId: z.string().uuid(),
  personId: z.string().uuid(), // Who added this record
  date: z.string(),
  type: z.enum(['vital', 'symptom', 'diagnosis', 'medication', 'appointment', 'procedure', 'vaccination', 'other']),
  data: z.record(z.any()),
  source: z.enum(['manual', 'doctor', 'wearable', 'lab', 'ai_extracted']).default('manual'),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type FamilyHealthRecord = z.infer<typeof FamilyHealthRecordSchema>;

// Care Task
export const CareTaskSchema = z.object({
  id: z.string().uuid(),
  personId: z.string().uuid(),
  familyMemberId: z.string().uuid().optional(),
  title: z.string(),
  type: z.enum(['appointment', 'medication', 'therapy', 'checkup', 'procedure', 'care', 'other']),
  dueDate: z.string(),
  dueTime: z.string().optional(),
  assignedTo: z.array(z.string()).default([]), // Person IDs
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).default('pending'),
  reminder: z.boolean().default(true),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type CareTask = z.infer<typeof CareTaskSchema>;

// Care Circle (permissions)
export const CareCircleSchema = z.object({
  id: z.string().uuid(),
  personId: z.string().uuid(),
  memberId: z.string().uuid(), // Caregiver
  relationship: z.enum(['primary_caregiver', 'secondary_caregiver', 'family_member', 'friend', 'medical_professional', 'other']),
  accessLevel: z.enum(['full', 'partial', 'emergency_only', 'view_only']).default('partial'),
  permissions: z.array(z.enum([
    'view_health', 'edit_health', 'view_mental', 'edit_mental',
    'view_lifestyle', 'edit_lifestyle', 'view_worklife', 'edit_worklife',
    'receive_alerts', 'schedule_appointments', 'manage_medications',
    'view_reports', 'emergency_access'
  ])).default(['view_health']),
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type CareCircle = z.infer<typeof CareCircleSchema>;

// ============================================
// DOMAIN 7: RELATIONSHIPS
// ============================================

// Relationship
export const RelationshipSchema = z.object({
  id: z.string().uuid(),
  personId: z.string().uuid(),
  partnerId: z.string().uuid().optional(),
  type: z.enum(['partner', 'spouse', 'close_friend', 'family', 'colleague', 'mentor', 'other']),
  partnerName: z.string().optional(),
  startDate: z.string().optional(),
  status: z.enum(['active', 'strained', 'ended']).default('active'),
  quality: z.number().min(1).max(10).optional(),
  communicationFrequency: z.enum(['daily', 'weekly', 'monthly', 'occasionally', 'rarely']).default('weekly'),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type Relationship = z.infer<typeof RelationshipSchema>;

// Relationship Interaction
export const InteractionRecordSchema = z.object({
  id: z.string().uuid(),
  relationshipId: z.string().uuid(),
  date: z.string(),
  type: z.enum(['call', 'video', 'in_person', 'message', 'activity', 'gift', 'other']),
  duration: z.number().optional(), // minutes
  quality: z.enum(['poor', 'neutral', 'good', 'great', 'excellent']).default('good'),
  topics: z.array(z.string()).default([]),
  conflictOccurred: z.boolean().default(false),
  conflictResolution: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string()
});

export type InteractionRecord = z.infer<typeof InteractionRecordSchema>;

// Relationship Health Score
export interface RelationshipHealthScore {
  overall: number; // 1-10
  communication: number; // 1-10
  qualityTime: number; // 1-10
  conflictResolution: number; // 1-10
  emotionalSupport: number; // 1-10
  intimacy: number; // 1-10
  sharedActivities: number; // 1-10
  trends: {
    communicationTrend: 'improving' | 'stable' | 'worsening';
    qualityTrend: 'improving' | 'stable' | 'worsening';
  };
  insights: string[];
  recommendations: string[];
}

// ============================================
// CONSULTATION (Cross-domain)
// ============================================

// Consultation/Appointment
export const ConsultationSchema = z.object({
  id: z.string().uuid(),
  personId: z.string().uuid(),
  providerId: z.string().uuid().optional(),
  providerName: z.string(),
  providerType: z.enum(['doctor', 'therapist', 'nutritionist', 'fitness_coach', 'gynecologist', 'psychiatrist', 'specialist', 'other']),
  specialty: z.string().optional(),
  facility: z.string().optional(),
  date: z.string(),
  duration: z.number().optional(), // minutes
  type: z.enum(['in_person', 'video', 'phone', 'chat']),
  status: z.enum(['scheduled', 'completed', 'cancelled', 'no_show', 'rescheduled']).default('scheduled'),
  reason: z.string(),
  preVisitSummary: z.string().optional(), // Generated by AI
  postVisitNotes: z.string().optional(),
  diagnosis: z.array(z.string()).default([]),
  prescriptions: z.array(z.object({
    medication: z.string(),
    dosage: z.string(),
    duration: z.string().optional(),
    instructions: z.string().optional()
  })).default([]),
  followUpRequired: z.boolean().default(false),
  followUpDate: z.string().optional(),
  cost: z.number().optional(),
  insuranceClaimed: z.boolean().default(false),
  questionsToAsk: z.array(z.string()).default([]), // Generated from memory
  createdAt: z.string(),
  updatedAt: z.string()
});

export type Consultation = z.infer<typeof ConsultationSchema>;

// ============================================
// HUMAN TWIN (Cross-domain)
// ============================================

// Human Twin State
export const HumanTwinStateSchema = z.object({
  personId: z.string().uuid(),
  lastUpdated: z.string(),
  domains: z.object({
    physical: z.object({
      healthScore: z.number().min(0).max(100).default(75),
      conditions: z.array(z.string()).default([]),
      medications: z.array(z.string()).default([]),
      allergies: z.array(z.string()).default([]),
      lastCheckup: z.string().optional(),
      riskFactors: z.array(z.string()).default([]),
      recommendations: z.array(z.string()).default([])
    }).default({}),
    mental: z.object({
      wellnessScore: z.number().min(0).max(100).default(75),
      moodTrend: z.enum(['improving', 'stable', 'worsening']).default('stable'),
      stressLevel: z.number().min(1).max(10).default(5),
      burnoutRisk: z.enum(['low', 'moderate', 'high', 'severe']).default('low'),
      therapyStatus: z.enum(['none', 'considering', 'searching', 'engaged']).default('none'),
      recommendations: z.array(z.string()).default([])
    }).default({}),
    sexual: z.object({
      sexualWellnessScore: z.number().min(0).max(100).default(75),
      fertilityStatus: z.enum(['unknown', 'tracking', 'trying', 'pregnant', 'not_trying']).default('unknown'),
      contraception: z.array(z.string()).default([]),
      sexualHealthConcerns: z.array(z.string()).default([]),
      recommendations: z.array(z.string()).default([])
    }).default({}),
    lifestyle: z.object({
      lifestyleScore: z.number().min(0).max(100).default(75),
      sleepQuality: z.enum(['poor', 'okay', 'good']).default('okay'),
      nutritionQuality: z.enum(['poor', 'okay', 'good']).default('okay'),
      exerciseFrequency: z.enum(['sedentary', 'occasional', 'regular', 'active']).default('occasional'),
      habitAdherence: z.number().min(0).max(100).default(50),
      recommendations: z.array(z.string()).default([])
    }).default({}),
    worklife: z.object({
      workLifeBalanceScore: z.number().min(0).max(100).default(75),
      burnoutRisk: z.enum(['low', 'moderate', 'high', 'severe']).default('low'),
      workHoursTrend: z.enum(['increasing', 'stable', 'decreasing']).default('stable'),
      recoveryScore: z.number().min(0).max(100).default(75),
      recommendations: z.array(z.string()).default([])
    }).default({}),
    family: z.object({
      familyHealthScore: z.number().min(0).max(100).default(75),
      dependentsCount: z.number().default(0),
      caregiversAssigned: z.array(z.string()).default([]),
      upcomingCareTasks: z.number().default(0),
      recommendations: z.array(z.string()).default([])
    }).default({}),
    relationships: z.object({
      relationshipScore: z.number().min(0).max(100).default(75),
      primaryRelationshipStatus: z.enum(['none', 'dating', 'committed', 'married']).default('none'),
      socialConnectionScore: z.number().min(0).max(10).default(5),
      lonelyDays: z.number().default(0), // Last 30 days
      recommendations: z.array(z.string()).default([])
    }).default({})
  }),
  overallScore: z.number().min(0).max(100).default(75),
  insights: z.array(z.string()).default([]),
  predictions: z.array(z.object({
    type: z.string(),
    description: z.string(),
    timeframe: z.string(),
    confidence: z.number().min(0).max(1)
  })).default([]),
  lifeEvents: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type HumanTwinState = z.infer<typeof HumanTwinStateSchema>;

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

export interface DomainSummary {
  domain: string;
  score: number;
  trend: 'improving' | 'stable' | 'worsening';
  highlights: string[];
  concerns: string[];
  recommendations: string[];
}

export interface HumanMemorySummary {
  personId: string;
  overallScore: number;
  domains: DomainSummary[];
  recentInsights: string[];
  upcomingReminders: string[];
  lifeEvents: LifeEvent[];
  lastUpdated: string;
}