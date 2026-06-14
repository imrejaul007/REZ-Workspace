import { z } from 'zod';
import mongoose from 'mongoose';

// ============================================
// Zod Schemas for Input Validation
// ============================================

export const ProfileToCorpIdSyncSchema = z.object({
  profileId: z.string().min(1, 'Profile ID is required'),
  employeeId: z.string().min(1, 'Employee ID is required'),
  corporateId: z.string().min(1, 'Corporate ID is required'),
  personalData: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    dateOfBirth: z.string().optional(),
    department: z.string().optional(),
    designation: z.string().optional(),
    location: z.string().optional(),
  }).optional(),
  workData: z.object({
    employeeId: z.string(),
    joinDate: z.string(),
    department: z.string(),
    designation: z.string(),
    managerId: z.string().optional(),
    employmentType: z.enum(['full_time', 'part_time', 'contract', 'intern']),
    workLocation: z.enum(['remote', 'hybrid', 'onsite']),
  }).optional(),
});

export const VerifyProfileSchema = z.object({
  profileId: z.string().min(1, 'Profile ID is required'),
  verificationTypes: z.array(z.enum(['identity', 'employment', 'skills', 'education', 'all'])),
});

export const GetCorpIdDataSchema = z.object({
  profileId: z.string().min(1, 'Profile ID is required'),
  includeScores: z.boolean().optional().default(true),
  includeVerification: z.boolean().optional().default(true),
});

// Infer TypeScript types from Zod schemas
export type ProfileToCorpIdSyncInput = z.infer<typeof ProfileToCorpIdSyncSchema>;
export type VerifyProfileInput = z.infer<typeof VerifyProfileSchema>;
export type GetCorpIdDataInput = z.infer<typeof GetCorpIdDataSchema>;

// ============================================
// TypeScript Interfaces
// ============================================

export interface CorpIdRecord {
  _id: string;
  profileId: string;
  employeeId: string;
  corporateId: string;
  ciScore: CIScore;
  verification: VerificationStatus;
  trustReport: TrustReport;
  linkedAt: Date;
  updatedAt: Date;
  metadata: Record<string, unknown>;
}

export interface CIScore {
  overall: number;
  reliability: number;      // Based on attendance
  delivery: number;         // Based on project completion
  growth: number;          // Based on learning/certifications
  collaboration: number;   // Based on recognition/peers
  factors: CIScoreFactors;
  lastCalculated: Date;
}

export interface CIScoreFactors {
  attendanceRate: number;
  punctualityRate: number;
  projectCompletionRate: number;
  deadlineAdherence: number;
  learningHours: number;
  certificationCount: number;
  peerRecognitionCount: number;
  teamContributionScore: number;
}

export interface VerificationStatus {
  identity: VerificationItem;
  employment: VerificationItem;
  skills: VerificationItem;
  education: VerificationItem;
  overall: boolean;
  lastVerified: Date | null;
}

export interface VerificationItem {
  verified: boolean;
  verifiedAt: Date | null;
  verifiedBy: string | null;
  documents: VerificationDocument[];
}

export interface VerificationDocument {
  type: string;
  documentId: string;
  uploadedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  verifiedAt: Date | null;
}

export interface TrustReport {
  score: number;
  level: TrustLevel;
  factors: TrustFactor[];
  recommendations: string[];
  generatedAt: Date;
}

export type TrustLevel = 'low' | 'medium' | 'high' | 'premium';

export interface TrustFactor {
  name: string;
  contribution: number;
  description: string;
  trend: 'up' | 'down' | 'stable';
}

// ============================================
// RABTUL Profile Integration Types
// ============================================

export interface RABTULProfile {
  id: string;
  employeeId: string;
  corporateId: string;
  personal: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    dateOfBirth?: string;
  };
  work: {
    department: string;
    designation: string;
    joinDate: string;
    managerId?: string;
    employmentType: 'full_time' | 'part_time' | 'contract' | 'intern';
    workLocation: 'remote' | 'hybrid' | 'onsite';
  };
  attendance?: AttendanceRecord[];
  projects?: ProjectRecord[];
  learning?: LearningRecord[];
  recognition?: RecognitionRecord[];
}

export interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent' | 'late' | 'half_day';
  checkIn?: string;
  checkOut?: string;
}

export interface ProjectRecord {
  id: string;
  name: string;
  status: 'active' | 'completed' | 'overdue';
  completionPercentage: number;
  deadlinesMet: boolean;
  dueDate?: string;
  completedAt?: string;
}

export interface LearningRecord {
  id: string;
  courseName: string;
  provider: string;
  completedAt?: string;
  certificationEarned: boolean;
  hoursSpent: number;
}

export interface RecognitionRecord {
  id: string;
  type: 'peer' | 'manager' | 'team';
  givenBy: string;
  reason: string;
  points: number;
  givenAt: string;
}

// ============================================
// API Request/Response Types
// ============================================

export interface SyncProfileToCorpIdRequest {
  profileId: string;
  employeeId: string;
  corporateId: string;
  personalData?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    dateOfBirth?: string;
    department?: string;
    designation?: string;
    location?: string;
  };
  workData?: {
    joinDate: string;
    department: string;
    designation: string;
    managerId?: string;
    employmentType: 'full_time' | 'part_time' | 'contract' | 'intern';
    workLocation: 'remote' | 'hybrid' | 'onsite';
  };
}

export interface SyncProfileToCorpIdResponse {
  success: boolean;
  corpIdRecord?: CorpIdRecord;
  error?: string;
}

export interface GetCorpIdDataResponse {
  profileId: string;
  corpIdRecord: CorpIdRecord | null;
  error?: string;
}

export interface GetCIScoreResponse {
  profileId: string;
  ciScore: CIScore | null;
  error?: string;
}

export interface VerifyProfileRequest {
  profileId: string;
  verificationTypes: ('identity' | 'employment' | 'skills' | 'education' | 'all')[];
}

export interface VerifyProfileResponse {
  success: boolean;
  verification?: VerificationStatus;
  error?: string;
}

export interface GetTrustReportResponse {
  profileId: string;
  trustReport: TrustReport | null;
  error?: string;
}

// ============================================
// Service Integration Types
// ============================================

export interface CorpIdIdentityResponse {
  success: boolean;
  corpId?: string;
  existingCorpId?: string;
  error?: string;
}

export interface CorpIdCIScoreResponse {
  success: boolean;
  ciScore?: CIScore;
  error?: string;
}

export interface RABTULProfileResponse {
  success: boolean;
  profile?: RABTULProfile;
  error?: string;
}

// ============================================
// JWT & Auth Types
// ============================================

export interface JWTPayload {
  userId: string;
  profileId: string;
  corporateId: string;
  role: 'employee' | 'manager' | 'hr' | 'admin';
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest {
  user: JWTPayload;
  headers: {
    authorization?: string;
    'x-internal-token'?: string;
  };
}

// ============================================
// Error Types
// ============================================

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// ============================================
// Database Document Types
// ============================================

export interface CorpIdProfileBridgeDocument extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  profileId: string;
  employeeId: string;
  corporateId: string;
  ciScore: CIScore;
  verification: VerificationStatus;
  trustReport: TrustReport;
  linkedAt: Date;
  updatedAt: Date;
  metadata: Record<string, unknown>;
}

// Re-export mongoose for convenience
export { mongoose };
