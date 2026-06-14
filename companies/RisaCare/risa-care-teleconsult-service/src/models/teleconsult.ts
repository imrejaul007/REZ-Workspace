import { z } from 'zod';

// Enums
export enum SessionStatus {
  SCHEDULED = 'scheduled',
  WAITING = 'waiting',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum ConsultationMode {
  VIDEO = 'video',
  AUDIO = 'audio',
  CHAT = 'chat',
}

// Base schemas
export const TimeSlotSchema = z.object({
  start: z.string().datetime(),
  end: z.string().datetime(),
  booked: z.boolean().default(false),
  consultationId: z.string().nullable().optional(),
});

export const MedicineSchema = z.object({
  name: z.string().min(1),
  dosage: z.string().min(1),
  frequency: z.string().min(1),
  duration: z.string().min(1),
  instructions: z.string().optional(),
  refills: z.number().int().min(0).default(0),
});

export const PrescriptionSchema = z.object({
  sessionId: z.string(),
  medicines: z.array(MedicineSchema).min(1),
  notes: z.string().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const ConsultationNoteSchema = z.object({
  sessionId: z.string(),
  doctorId: z.string(),
  subjective: z.string().optional(),
  objective: z.string().optional(),
  assessment: z.string().optional(),
  plan: z.string().optional(),
  prescriptions: z.array(MedicineSchema).optional(),
  labOrders: z.array(z.object({
    testName: z.string(),
    instructions: z.string().optional(),
    priority: z.enum(['routine', 'urgent', 'stat']).optional(),
  })).optional(),
  followUp: z.object({
    recommended: z.boolean(),
    daysUntilFollowUp: z.number().int().positive().optional(),
    notes: z.string().optional(),
  }).optional(),
  icdCodes: z.array(z.string()).optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

// TypeScript types
export type TimeSlot = z.infer<typeof TimeSlotSchema>;
export type Medicine = z.infer<typeof MedicineSchema>;
export type Prescription = z.infer<typeof PrescriptionSchema>;
export type ConsultationNote = z.infer<typeof ConsultationNoteSchema>;

// Main models
export interface TeleconsultSession {
  sessionId: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  scheduledAt: string;
  startedAt?: string;
  endedAt?: string;
  duration: number; // in seconds
  status: SessionStatus;
  roomId?: string;
  recordingUrl?: string;
  consultationMode: ConsultationMode;
  chiefComplaint?: string;
  patientName?: string;
  doctorName?: string;
  specialty?: string;
  fee?: number;
  currency?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorAvailability {
  doctorId: string;
  date: string; // YYYY-MM-DD
  slots: TimeSlot[];
  consultationMode: ConsultationMode;
  consultationFee?: number;
  currency?: string;
  timezone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeleconsultReview {
  reviewId: string;
  sessionId: string;
  patientId: string;
  doctorId: string;
  rating: number; // 1-5
  feedback?: string;
  wouldRecommend: boolean;
  categories?: {
    punctuality?: number;
    professionalism?: number;
    thoroughness?: number;
    communication?: number;
  };
  createdAt: string;
}

export interface DoctorReviewStats {
  doctorId: string;
  averageRating: number;
  totalReviews: number;
  wouldRecommendPercentage: number;
  categoryAverages?: {
    punctuality?: number;
    professionalism?: number;
    thoroughness?: number;
    communication?: number;
  };
  recentReviews: TeleconsultReview[];
}

// Request/Response DTOs
export interface ScheduleSessionRequest {
  patientId: string;
  doctorId: string;
  scheduledAt: string;
  appointmentId?: string;
  consultationMode?: ConsultationMode;
  chiefComplaint?: string;
  slotStart?: string;
  slotEnd?: string;
}

export interface SetAvailabilityRequest {
  doctorId: string;
  date: string;
  slots: Array<{
    start: string;
    end: string;
  }>;
  consultationMode?: ConsultationMode;
  consultationFee?: number;
  currency?: string;
}

export interface SaveNotesRequest {
  doctorId: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  prescriptions?: Medicine[];
  labOrders?: ConsultationNote['labOrders'];
  followUp?: ConsultationNote['followUp'];
  icdCodes?: string[];
}

export interface CreatePrescriptionRequest {
  medicines: Medicine[];
  notes?: string;
}

export interface SubmitReviewRequest {
  patientId: string;
  rating: number;
  feedback?: string;
  wouldRecommend: boolean;
  categories?: TeleconsultReview['categories'];
}

// Database in-memory store (production would use actual DB)
export interface TeleconsultDatabase {
  sessions: Map<string, TeleconsultSession>;
  availability: Map<string, DoctorAvailability>; // key: doctorId:date
  prescriptions: Map<string, Prescription>;
  notes: Map<string, ConsultationNote>;
  reviews: Map<string, TeleconsultReview>;
}

// Initialize database
export const db: TeleconsultDatabase = {
  sessions: new Map(),
  availability: new Map(),
  prescriptions: new Map(),
  notes: new Map(),
  reviews: new Map(),
};
