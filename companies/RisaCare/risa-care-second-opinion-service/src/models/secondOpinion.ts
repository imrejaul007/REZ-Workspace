import { z } from 'zod';

// Enums
export enum RequestStatus {
  PENDING = 'pending',
  MATCHED = 'matched',
  UNDER_REVIEW = 'under_review',
  COMPLETED = 'completed',
  REJECTED = 'rejected'
}

export enum ReportType {
  LAB = 'lab',
  IMAGING = 'imaging',
  PATHOLOGY = 'pathology',
  CLINICAL = 'clinical'
}

export enum UrgencyLevel {
  ROUTINE = 'routine',
  URGENT = 'urgent',
  EMERGENT = 'emergent'
}

// Zod Schemas
export const MedicalHistorySchema = z.object({
  condition: z.string(),
  diagnosedDate: z.string().optional(),
  currentMedications: z.array(z.string()).optional(),
  notes: z.string().optional()
});

export const UploadedReportSchema = z.object({
  reportId: z.string(),
  type: z.nativeEnum(ReportType),
  title: z.string(),
  fileUrl: z.string(),
  uploadedAt: z.string()
});

export const CreateSecondOpinionRequestSchema = z.object({
  patientId: z.string().min(1),
  originalDiagnosis: z.string().min(1),
  medicalHistory: z.array(MedicalHistorySchema).min(1),
  condition: z.string().min(1),
  specialty: z.string().min(1),
  urgency: z.nativeEnum(UrgencyLevel).default(UrgencyLevel.ROUTINE),
  notes: z.string().optional()
});

export const SubmitOpinionSchema = z.object({
  diagnosis: z.string().min(1),
  treatmentPlan: z.string().min(1),
  alternativeOptions: z.array(z.string()).optional(),
  confidence: z.number().min(0).max(100).default(80),
  medications: z.array(z.string()).optional(),
  lifestyleRecommendations: z.array(z.string()).optional(),
  followUpRequired: z.boolean().default(false)
});

// Interfaces
export interface MedicalHistory {
  condition: string;
  diagnosedDate?: string;
  currentMedications?: string[];
  notes?: string;
}

export interface UploadedReport {
  reportId: string;
  type: ReportType;
  title: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface SecondOpinionRequest {
  requestId: string;
  patientId: string;
  originalDiagnosis: string;
  medicalHistory: MedicalHistory[];
  uploadedReports: UploadedReport[];
  condition: string;
  specialty: string;
  urgency: UrgencyLevel;
  status: RequestStatus;
  assignedSpecialistId?: string;
  createdAt: string;
  completedAt?: string;
  notes?: string;
}

export interface SpecialistAvailability {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotsAvailable: number;
}

export interface Specialist {
  specialistId: string;
  name: string;
  credentials: string;
  specializations: string[];
  hospitalAffiliations: string[];
  yearsOfExperience: number;
  rating: number;
  consultationFee: number;
  languages: string[];
  availability: SpecialistAvailability[];
  bio?: string;
  certifications?: string[];
  caseCount: number;
  availableForNewCases: boolean;
}

export interface OpinionReport {
  reportId: string;
  requestId: string;
  specialistId: string;
  diagnosis: string;
  treatmentPlan: string;
  alternativeOptions: string[];
  confidence: number;
  medications: string[];
  lifestyleRecommendations: string[];
  followUpRequired: boolean;
  createdAt: string;
  specialistName?: string;
  specialistCredentials?: string;
}

export interface MedicalReport {
  reportId: string;
  userId: string;
  type: ReportType;
  title: string;
  summary: string;
  uploadedAt: string;
  fileUrl: string;
  analyzed: boolean;
  keyFindings?: string[];
}

export interface MatchCriteria {
  specialty: number;
  experience: number;
  language: number;
  availability: number;
  rating: number;
  fee: number;
}

export interface CaseMatch {
  requestId: string;
  specialistId: string;
  matchScore: number;
  matchedCriteria: MatchCriteria;
  reason: string;
}

export interface ReportAnalysis {
  reportId: string;
  keyFindings: string[];
  summary: string;
  recommendedSpecialties: string[];
  urgencyFlag: boolean;
  confidence: number;
  analyzedAt: string;
}

// In-memory Data Store
export class DataStore {
  private static instance: DataStore;
  requests: Map<string, SecondOpinionRequest> = new Map();
  specialists: Map<string, Specialist> = new Map();
  opinions: Map<string, OpinionReport> = new Map();
  medicalReports: Map<string, MedicalReport> = new Map();
  matches: Map<string, CaseMatch[]> = new Map();

  private constructor() {
    this.initializeSpecialists();
  }

  static getInstance(): DataStore {
    if (!DataStore.instance) {
      DataStore.instance = new DataStore();
    }
    return DataStore.instance;
  }

  private initializeSpecialists(): void {
    const defaultSpecialists: Specialist[] = [
      {
        specialistId: 'SPEC-001',
        name: 'Dr. Priya Sharma',
        credentials: 'MD, DM (Cardiology), FACC',
        specializations: ['Cardiology', 'Interventional Cardiology', 'Heart Failure'],
        hospitalAffiliations: ['Apollo Hospitals', 'Fortis Escorts'],
        yearsOfExperience: 18,
        rating: 4.9,
        consultationFee: 2500,
        languages: ['English', 'Hindi', 'Tamil'],
        caseCount: 1250,
        availableForNewCases: true,
        availability: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', slotsAvailable: 8 },
          { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', slotsAvailable: 8 },
          { dayOfWeek: 5, startTime: '09:00', endTime: '13:00', slotsAvailable: 4 }
        ]
      },
      {
        specialistId: 'SPEC-002',
        name: 'Dr. Rajesh Kumar',
        credentials: 'MD, DM (Oncology), DNB',
        specializations: ['Medical Oncology', 'Hematology', 'Breast Cancer'],
        hospitalAffiliations: ['Tata Memorial Hospital', 'Max Healthcare'],
        yearsOfExperience: 15,
        rating: 4.8,
        consultationFee: 3000,
        languages: ['English', 'Hindi', 'Bengali'],
        caseCount: 980,
        availableForNewCases: true,
        availability: [
          { dayOfWeek: 2, startTime: '10:00', endTime: '18:00', slotsAvailable: 6 },
          { dayOfWeek: 4, startTime: '10:00', endTime: '18:00', slotsAvailable: 6 },
          { dayOfWeek: 6, startTime: '10:00', endTime: '14:00', slotsAvailable: 4 }
        ]
      },
      {
        specialistId: 'SPEC-003',
        name: 'Dr. Ananya Patel',
        credentials: 'MD, DM (Neurology), DNB',
        specializations: ['Neurology', 'Epilepsy', 'Movement Disorders', 'Stroke'],
        hospitalAffiliations: ['AIIMS', 'NIMHANS'],
        yearsOfExperience: 20,
        rating: 4.9,
        consultationFee: 3500,
        languages: ['English', 'Hindi', 'Gujarati'],
        caseCount: 1500,
        availableForNewCases: true,
        availability: [
          { dayOfWeek: 1, startTime: '08:00', endTime: '16:00', slotsAvailable: 10 },
          { dayOfWeek: 3, startTime: '08:00', endTime: '16:00', slotsAvailable: 10 },
          { dayOfWeek: 5, startTime: '08:00', endTime: '12:00', slotsAvailable: 5 }
        ]
      },
      {
        specialistId: 'SPEC-004',
        name: 'Dr. Vikram Singh',
        credentials: 'MS, MCh (Orthopedics), FRCS',
        specializations: ['Orthopedics', 'Joint Replacement', 'Sports Medicine', 'Trauma'],
        hospitalAffiliations: ['Medanta', 'Artemis Hospital'],
        yearsOfExperience: 16,
        rating: 4.7,
        consultationFee: 2200,
        languages: ['English', 'Hindi', 'Punjabi'],
        caseCount: 1100,
        availableForNewCases: true,
        availability: [
          { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', slotsAvailable: 8 },
          { dayOfWeek: 4, startTime: '09:00', endTime: '17:00', slotsAvailable: 8 },
          { dayOfWeek: 6, startTime: '09:00', endTime: '15:00', slotsAvailable: 6 }
        ]
      },
      {
        specialistId: 'SPEC-005',
        name: 'Dr. Meera Joshi',
        credentials: 'MD, Fellowship (Endocrinology), DNB',
        specializations: ['Endocrinology', 'Diabetes', 'Thyroid Disorders', 'Metabolic Disorders'],
        hospitalAffiliations: ['Manipal Hospital', 'Narayana Health'],
        yearsOfExperience: 12,
        rating: 4.8,
        consultationFee: 2000,
        languages: ['English', 'Hindi', 'Marathi'],
        caseCount: 850,
        availableForNewCases: true,
        availability: [
          { dayOfWeek: 1, startTime: '10:00', endTime: '18:00', slotsAvailable: 7 },
          { dayOfWeek: 3, startTime: '10:00', endTime: '18:00', slotsAvailable: 7 },
          { dayOfWeek: 5, startTime: '10:00', endTime: '14:00', slotsAvailable: 4 }
        ]
      },
      {
        specialistId: 'SPEC-006',
        name: 'Dr. Arun Reddy',
        credentials: 'MD, DM (Gastroenterology), DNB',
        specializations: ['Gastroenterology', 'Hepatology', 'Endoscopy', 'IBD'],
        hospitalAffiliations: ['Asian Institute of Gastroenterology', 'Yashoda Hospital'],
        yearsOfExperience: 14,
        rating: 4.6,
        consultationFee: 2300,
        languages: ['English', 'Hindi', 'Telugu'],
        caseCount: 920,
        availableForNewCases: true,
        availability: [
          { dayOfWeek: 2, startTime: '08:00', endTime: '16:00', slotsAvailable: 9 },
          { dayOfWeek: 4, startTime: '08:00', endTime: '16:00', slotsAvailable: 9 },
          { dayOfWeek: 6, startTime: '08:00', endTime: '12:00', slotsAvailable: 5 }
        ]
      },
      {
        specialistId: 'SPEC-007',
        name: 'Dr. Sunita Iyer',
        credentials: 'MD, Fellowship (Pulmonology), DNB',
        specializations: ['Pulmonology', 'Critical Care', 'Sleep Medicine', 'TB'],
        hospitalAffiliations: ['Narayana Health', 'HCG Cancer Center'],
        yearsOfExperience: 11,
        rating: 4.7,
        consultationFee: 2100,
        languages: ['English', 'Hindi', 'Kannada'],
        caseCount: 780,
        availableForNewCases: true,
        availability: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', slotsAvailable: 8 },
          { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', slotsAvailable: 8 },
          { dayOfWeek: 5, startTime: '09:00', endTime: '13:00', slotsAvailable: 4 }
        ]
      },
      {
        specialistId: 'SPEC-008',
        name: 'Dr. Karthik Nair',
        credentials: 'MD, DM (Nephrology), DNB',
        specializations: ['Nephrology', 'Kidney Transplant', 'Dialysis', 'Hypertension'],
        hospitalAffiliations: ['Amrita Hospital', 'Aster CMI'],
        yearsOfExperience: 13,
        rating: 4.8,
        consultationFee: 2400,
        languages: ['English', 'Hindi', 'Malayalam', 'Tamil'],
        caseCount: 890,
        availableForNewCases: true,
        availability: [
          { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', slotsAvailable: 7 },
          { dayOfWeek: 4, startTime: '09:00', endTime: '17:00', slotsAvailable: 7 },
          { dayOfWeek: 6, startTime: '09:00', endTime: '13:00', slotsAvailable: 4 }
        ]
      }
    ];
    defaultSpecialists.forEach(spec => this.specialists.set(spec.specialistId, spec));
  }
}
