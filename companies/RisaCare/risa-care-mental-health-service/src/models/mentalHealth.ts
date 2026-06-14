import { z } from 'zod';

// Mental Health Conditions
export const MentalHealthConditionSchema = z.enum([
  'anxiety',
  'depression',
  'ptsd',
  'bipolar',
  'ocd',
  'adhd',
  'eating_disorder',
  'personality_disorder',
  'psychosis',
  'substance_abuse',
  'grief',
  'trauma',
  'stress',
  'insomnia',
  'panic_disorder',
  'social_anxiety',
  'general'
]);

export type MentalHealthCondition = z.infer<typeof MentalHealthConditionSchema>;

// Therapy Types
export const TherapyTypeSchema = z.enum([
  'cognitive_behavioral',
  'dialectical_behavioral',
  'psychodynamic',
  'humanistic',
  'family_systems',
  'emdr',
  'exposure_therapy',
  'mindfulness',
  'art_therapy',
  'music_therapy',
  'group_therapy',
  'couples_therapy',
  'play_therapy',
  'hypnotherapy',
  'trauma_informed',
  'solution_focused'
]);

export type TherapyType = z.infer<typeof TherapyTypeSchema>;

// Session Types
export const SessionTypeSchema = z.enum([
  'individual',
  'group',
  'couples',
  'family'
]);

export type SessionType = z.infer<typeof SessionTypeSchema>;

// Support Group Types
export const SupportGroupTypeSchema = z.enum([
  'anxiety',
  'depression',
  'grief',
  'addiction',
  'trauma',
  'eating_disorder',
  'family_support',
  'general'
]);

export type SupportGroupType = z.infer<typeof SupportGroupTypeSchema>;

// Rating Scale 1-10
const RatingScaleSchema = z.number().min(1).max(10);

// Emergency Contact Schema
export const EmergencyContactSchema = z.object({
  name: z.string().min(1),
  relationship: z.string().min(1),
  phone: z.string().min(1),
  isPrimary: z.boolean().default(false)
});

export type EmergencyContact = z.infer<typeof EmergencyContactSchema>;

// Crisis Plan Schema
export const CrisisPlanSchema = z.object({
  userId: z.string().min(1),
  emergencyContacts: z.array(EmergencyContactSchema).min(1),
  warningSigns: z.array(z.string().min(1)).min(1),
  copingStrategies: z.array(z.string().min(1)).min(1),
  reasonsToLive: z.array(z.string().min(1)).min(1),
  safePlaces: z.array(z.string().min(1)),
  personalStatement: z.string().optional(),
  professionalContacts: z.array(z.object({
    name: z.string(),
    phone: z.string(),
    notes: z.string().optional()
  })).optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});

export type CrisisPlan = z.infer<typeof CrisisPlanSchema>;

// Mental Health Profile Schema
export const MentalHealthProfileSchema = z.object({
  userId: z.string().min(1),
  conditions: z.array(MentalHealthConditionSchema).default([]),
  therapies: z.array(TherapyTypeSchema).default([]),
  counselorId: z.string().optional(),
  therapistId: z.string().optional(),
  supportGroupIds: z.array(z.string()).default([]),
  crisisPlanId: z.string().optional(),
  preferredLanguage: z.string().default('en'),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});

export type MentalHealthProfile = z.infer<typeof MentalHealthProfileSchema>;

// Mood Entry Schema
export const MoodEntrySchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1),
  date: z.date().default(() => new Date()),
  mood: RatingScaleSchema,
  energy: RatingScaleSchema,
  anxiety: RatingScaleSchema,
  sleep: RatingScaleSchema,
  stress: RatingScaleSchema,
  notes: z.string().optional(),
  triggers: z.array(z.string()).default([]),
  activities: z.array(z.string()).default([]),
  medicationTaken: z.boolean().default(false),
  exerciseDone: z.boolean().default(false),
  socialInteraction: z.boolean().default(false),
  createdAt: z.date().default(() => new Date())
});

export type MoodEntry = z.infer<typeof MoodEntrySchema>;

// Counselor Credentials
export const CounselorCredentialsSchema = z.object({
  degree: z.string(),
  institution: z.string(),
  year: z.number(),
  license: z.string(),
  licenseState: z.string().optional()
});

export type CounselorCredentials = z.infer<typeof CounselorCredentialsSchema>;

// Counselor Availability
export const CounselorAvailabilitySchema = z.object({
  monday: z.array(z.object({ start: z.string(), end: z.string() })).default([]),
  tuesday: z.array(z.object({ start: z.string(), end: z.string() })).default([]),
  wednesday: z.array(z.object({ start: z.string(), end: z.string() })).default([]),
  thursday: z.array(z.object({ start: z.string(), end: z.string() })).default([]),
  friday: z.array(z.object({ start: z.string(), end: z.string() })).default([]),
  saturday: z.array(z.object({ start: z.string(), end: z.string() })).default([]),
  sunday: z.array(z.object({ start: z.string(), end: z.string() })).default([])
});

export type CounselorAvailability = z.infer<typeof CounselorAvailabilitySchema>;

// Counselor Schema
export const CounselorSchema = z.object({
  counselorId: z.string(),
  name: z.string().min(1),
  title: z.string(),
  specialization: z.array(MentalHealthConditionSchema).default([]),
  therapyTypes: z.array(TherapyTypeSchema).default([]),
  languages: z.array(z.string()).default(['en']),
  availability: CounselorAvailabilitySchema.default({}),
  rating: z.number().min(0).max(5).default(0),
  reviewCount: z.number().default(0),
  pricePerSession: z.number().min(0),
  currency: z.string().default('INR'),
  duration: z.number().min(30).max(120).default(60),
  credentials: z.array(CounselorCredentialsSchema).default([]),
  bio: z.string().optional(),
  imageUrl: z.string().optional(),
  isOnline: z.boolean().default(true),
  yearsOfExperience: z.number().default(0),
  sessionsCompleted: z.number().default(0)
});

export type Counselor = z.infer<typeof CounselorSchema>;

// Therapy Session Schema
export const TherapySessionSchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1),
  providerId: z.string().min(1),
  counselorId: z.string().optional(),
  therapistId: z.string().optional(),
  type: SessionTypeSchema,
  therapyType: TherapyTypeSchema.optional(),
  date: z.date(),
  duration: z.number().min(15).max(180).default(60),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show']).default('scheduled'),
  notes: z.string().optional(),
  sessionNotes: z.string().optional(),
  homework: z.object({
    description: z.string(),
    dueDate: z.date().optional(),
    completed: z.boolean().default(false)
  }).optional(),
  nextSession: z.date().optional(),
  rating: z.number().min(1).max(5).optional(),
  feedback: z.string().optional(),
  cost: z.number().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});

export type TherapySession = z.infer<typeof TherapySessionSchema>;

// Support Group Session
export const SupportGroupSessionSchema = z.object({
  id: z.string(),
  groupId: z.string(),
  date: z.date(),
  duration: z.number().default(90),
  topic: z.string(),
  hostId: z.string(),
  maxAttendees: z.number().default(15),
  currentAttendees: z.number().default(0),
  isOnline: z.boolean().default(true),
  meetingLink: z.string().optional()
});

export type SupportGroupSession = z.infer<typeof SupportGroupSessionSchema>;

// Support Group Schema
export const SupportGroupSchema = z.object({
  id: z.string().optional(),
  groupId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  type: SupportGroupTypeSchema,
  focusArea: z.array(MentalHealthConditionSchema).default([]),
  schedule: z.object({
    dayOfWeek: z.number().min(0).max(6),
    time: z.string(),
    frequency: z.enum(['weekly', 'biweekly', 'monthly']).default('weekly'),
    isOnline: z.boolean().default(true)
  }),
  members: z.array(z.object({
    userId: z.string(),
    joinedAt: z.date().default(() => new Date()),
    isActive: z.boolean().default(true)
  })).default([]),
  maxMembers: z.number().default(20),
  facilitators: z.array(z.string()).default([]),
  isPrivate: z.boolean().default(false),
  ageRange: z.object({ min: z.number(), max: z.number() }).optional(),
  nextSession: SupportGroupSessionSchema.optional(),
  createdAt: z.date().default(() => new Date())
});

export type SupportGroup = z.infer<typeof SupportGroupSchema>;

// Self-Harm Log Severity
export const SelfHarmSeveritySchema = z.enum([
  'thoughts',
  ' urges',
  'minor',
  'moderate',
  'severe'
]);

export type SelfHarmSeverity = z.infer<typeof SelfHarmSeveritySchema>;

// Self-Harm Log Schema
export const SelfHarmLogSchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1),
  date: z.date().default(() => new Date()),
  severity: SelfHarmSeveritySchema,
  triggers: z.array(z.string()).default([]),
  emotions: z.array(z.string()).default([]),
  usedCoping: z.array(z.string()).default([]),
  reachedOutTo: z.array(z.string()).default([]),
  followUpActions: z.array(z.string()).default([]),
  location: z.string().optional(),
  circumstances: z.string().optional(),
  isSafeNow: z.boolean().default(false),
  needsProfessionalHelp: z.boolean().default(false),
  createdAt: z.date().default(() => new Date())
});

export type SelfHarmLog = z.infer<typeof SelfHarmLogSchema>;

// Crisis Alert Schema
export const CrisisAlertSchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1),
  type: z.enum(['immediate', 'escalating', 'check_in']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  triggeredAt: z.date().default(() => new Date()),
  reason: z.string(),
  location: z.string().optional(),
  isResolved: z.boolean().default(false),
  resolvedAt: z.date().optional(),
  resolvedBy: z.string().optional(),
  resourcesProvided: z.array(z.string()).default([]),
  emergencyServicesNotified: z.boolean().default(false)
});

export type CrisisAlert = z.infer<typeof CrisisAlertSchema>;

// Mood Trends Response
export interface MoodTrends {
  period: 'day' | 'week' | 'month' | 'year';
  averageMood: number;
  averageEnergy: number;
  averageAnxiety: number;
  averageSleep: number;
  averageStress: number;
  trend: 'improving' | 'stable' | 'declining';
  dataPoints: number;
  entries: MoodEntry[];
}

// Mood Insights
export interface MoodInsights {
  dominantTriggers: { trigger: string; count: number; avgMood: number }[];
  helpfulActivities: { activity: string; count: number; avgMood: number }[];
  weeklyPattern: { dayOfWeek: number; avgMood: number }[];
  correlationAnalysis: {
    exercise: { impact: 'positive' | 'negative' | 'neutral'; avgDiff: number };
    social: { impact: 'positive' | 'negative' | 'neutral'; avgDiff: number };
    medication: { impact: 'positive' | 'negative' | 'neutral'; avgDiff: number };
  };
  recommendations: string[];
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
