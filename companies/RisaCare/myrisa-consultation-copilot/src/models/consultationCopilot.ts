import { z } from 'zod';

// ==================== ENUMS ====================

export enum ConsultationType {
  GENERAL = 'general',
  SPECIALIST = 'specialist',
  FOLLOW_UP = 'follow_up',
  TELEMEDICINE = 'telemedicine',
  EMERGENCY = 'emergency',
  WELLNESS = 'wellness',
}

export enum ConsultationStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum ReminderStatus {
  PENDING = 'pending',
  SENT = 'sent',
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
}

// ==================== CONSULTATION ====================

export const ConsultationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  doctorName: z.string().min(1),
  doctorSpecialty: z.string().optional(),
  doctorContact: z.string().optional(),
  consultationType: z.nativeEnum(ConsultationType),
  status: z.nativeEnum(ConsultationStatus).default(ConsultationStatus.SCHEDULED),
  scheduledDate: z.string().datetime(),
  duration: z.number().int().positive().default(30), // minutes
  reason: z.string().min(1),
  notes: z.string().optional(),
  location: z.string().optional(), // clinic address or 'telemedicine'
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Consultation = z.infer<typeof ConsultationSchema>;

// ==================== PRE-VISIT SUMMARY ====================

export const MedicationSchema = z.object({
  name: z.string(),
  dosage: z.string().optional(),
  frequency: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type Medication = z.infer<typeof MedicationSchema>;

export const PreVisitSummarySchema = z.object({
  id: z.string().uuid(),
  consultationId: z.string().uuid(),
  userId: z.string(),
  chiefComplaint: z.string(),
  symptoms: z.array(z.object({
    symptom: z.string(),
    duration: z.string().optional(),
    severity: z.enum(['mild', 'moderate', 'severe']).optional(),
    notes: z.string().optional(),
  })),
  currentMedications: z.array(MedicationSchema).default([]),
  relevantHistory: z.array(z.string()).default([]),
  allergies: z.array(z.string()).default([]),
  vitalReadings: z.object({
    bloodPressure: z.string().optional(),
    heartRate: z.string().optional(),
    temperature: z.string().optional(),
    weight: z.string().optional(),
    date: z.string().optional(),
  }).optional(),
  questionsToAsk: z.array(z.object({
    id: z.string().uuid(),
    question: z.string(),
    priority: z.enum(['high', 'medium', 'low']).default('medium'),
    isAsked: z.boolean().default(false),
  })).default([]),
  generatedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type PreVisitSummary = z.infer<typeof PreVisitSummarySchema>;

// ==================== POST-VISIT NOTES ====================

export const PrescriptionSchema = z.object({
  id: z.string().uuid(),
  medicationName: z.string(),
  dosage: z.string(),
  frequency: z.string(),
  duration: z.string().optional(),
  instructions: z.string().optional(),
  refills: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export type Prescription = z.infer<typeof PrescriptionSchema>;

export const PostVisitNotesSchema = z.object({
  id: z.string().uuid(),
  consultationId: z.string().uuid(),
  userId: z.string(),
  diagnosis: z.string().optional(),
  diagnosisIcd10: z.string().optional(),
  notes: z.string(),
  prescriptions: z.array(PrescriptionSchema).default([]),
  labOrders: z.array(z.object({
    testName: z.string(),
    urgency: z.enum(['routine', 'urgent', 'stat']).default('routine'),
    instructions: z.string().optional(),
  })).default([]),
  imagingOrders: z.array(z.object({
    type: z.string(),
    bodyPart: z.string().optional(),
    instructions: z.string().optional(),
  })).default([]),
  instructions: z.array(z.string()).default([]),
  nextVisitRecommendation: z.string().optional(),
  nextVisitTimeframe: z.string().optional(),
  doctorNotes: z.string().optional(),
  patientUnderstanding: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type PostVisitNotes = z.infer<typeof PostVisitNotesSchema>;

// ==================== FOLLOW-UP TASK ====================

export const FollowUpTaskSchema = z.object({
  id: z.string().uuid(),
  consultationId: z.string().uuid(),
  userId: z.string(),
  taskType: z.enum([
    'medication',
    'lab_test',
    'imaging',
    'therapy',
    'lifestyle',
    'appointment',
    'document',
    'other',
  ]),
  title: z.string(),
  description: z.string().optional(),
  dueDate: z.string().datetime(),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.PENDING),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  reminder: z.object({
    enabled: z.boolean().default(true),
    remindAt: z.string().datetime().optional(),
    status: z.nativeEnum(ReminderStatus).default(ReminderStatus.PENDING),
  }).optional(),
  metadata: z.record(z.unknown()).optional(),
  completedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type FollowUpTask = z.infer<typeof FollowUpTaskSchema>;

// ==================== QUESTION ====================

export const QuestionSchema = z.object({
  id: z.string().uuid(),
  consultationId: z.string().uuid(),
  userId: z.string(),
  question: z.string(),
  category: z.enum([
    'symptoms',
    'medication',
    'diagnosis',
    'treatment',
    'side_effects',
    'lifestyle',
    'follow_up',
    'cost',
    'other',
  ]).default('other'),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  isAsked: z.boolean().default(false),
  answer: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Question = z.infer<typeof QuestionSchema>;

// ==================== CONSULTATION BRIEF ====================

export const ConsultationBriefSchema = z.object({
  consultation: ConsultationSchema,
  preVisitSummary: PreVisitSummarySchema.optional(),
  postVisitNotes: PostVisitNotesSchema.optional(),
  followUpTasks: z.array(FollowUpTaskSchema).default([]),
  questions: z.array(QuestionSchema).default([]),
});

export type ConsultationBrief = z.infer<typeof ConsultationBriefSchema>;

// ==================== REQUEST/RESPONSE TYPES ====================

export const ScheduleConsultationRequestSchema = z.object({
  doctorName: z.string().min(1),
  doctorSpecialty: z.string().optional(),
  doctorContact: z.string().optional(),
  consultationType: z.nativeEnum(ConsultationType),
  scheduledDate: z.string().datetime(),
  duration: z.number().int().positive().optional().default(30),
  reason: z.string().min(1),
  notes: z.string().optional(),
  location: z.string().optional(),
});

export type ScheduleConsultationRequest = z.infer<typeof ScheduleConsultationRequestSchema>;

export const RecordPostVisitRequestSchema = z.object({
  diagnosis: z.string().optional(),
  diagnosisIcd10: z.string().optional(),
  notes: z.string(),
  prescriptions: z.array(PrescriptionSchema.omit({ id: true })).default([]),
  labOrders: z.array(z.object({
    testName: z.string(),
    urgency: z.enum(['routine', 'urgent', 'stat']).default('routine'),
    instructions: z.string().optional(),
  })).default([]),
  imagingOrders: z.array(z.object({
    type: z.string(),
    bodyPart: z.string().optional(),
    instructions: z.string().optional(),
  })).default([]),
  instructions: z.array(z.string()).default([]),
  nextVisitRecommendation: z.string().optional(),
  nextVisitTimeframe: z.string().optional(),
  doctorNotes: z.string().optional(),
  patientUnderstanding: z.boolean().default(true),
});

export type RecordPostVisitRequest = z.infer<typeof RecordPostVisitRequestSchema>;

export const CreateFollowUpTasksRequestSchema = z.object({
  tasks: z.array(z.object({
    taskType: FollowUpTaskSchema.shape.taskType,
    title: z.string(),
    description: z.string().optional(),
    dueDate: z.string().datetime(),
    priority: z.enum(['high', 'medium', 'low']).default('medium'),
    reminderEnabled: z.boolean().default(true),
    reminderTime: z.string().datetime().optional(),
    metadata: z.record(z.unknown()).optional(),
  })),
});

export type CreateFollowUpTasksRequest = z.infer<typeof CreateFollowUpTasksRequestSchema>;

export const GenerateQuestionsRequestSchema = z.object({
  specialty: z.string().optional(),
  focusAreas: z.array(z.string()).default([]),
});

export type GenerateQuestionsRequest = z.infer<typeof GenerateQuestionsRequestSchema>;

// ==================== API RESPONSE ====================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
