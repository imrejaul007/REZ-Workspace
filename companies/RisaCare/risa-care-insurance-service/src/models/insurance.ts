import { z } from 'zod';

// Enums
export enum PlanType {
  INDIVIDUAL = 'individual',
  FAMILY = 'family',
  SENIOR = 'senior',
  CRITICAL_ILLNESS = 'critical_illness',
}

export enum ClaimType {
  REIMBURSEMENT = 'reimbursement',
  CASHLESS = 'cashless',
}

export enum ClaimStatus {
  INITIATED = 'initiated',
  DOCUMENTS_PENDING = 'documents_pending',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SETTLED = 'settled',
  DISBURSED = 'disbursed',
}

export enum PolicyStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  LAPSED = 'lapsed',
  CANCELLED = 'cancelled',
}

// Zod Schemas for Validation
export const CoverageSubLimitsSchema = z.object({
  roomRent: z.number().optional(),
  icuCharges: z.number().optional(),
  ambulanceCharges: z.number().optional(),
  dayCareProcedures: z.number().optional(),
  preHospitalization: z.number().optional(),
  postHospitalization: z.number().optional(),
  cataractTreatment: z.number().optional(),
  bariatricSurgery: z.number().optional(),
});

export type CoverageSubLimits = z.infer<typeof CoverageSubLimitsSchema>;

export const InsurancePlanSchema = z.object({
  planId: z.string(),
  providerId: z.string(),
  providerName: z.string(),
  planName: z.string(),
  type: z.nativeEnum(PlanType),
  coverageAmount: z.number().min(0),
  premium: z.number().min(0),
  tenure: z.number().min(1).max(3),
  exclusions: z.array(z.string()),
  inclusions: z.array(z.string()),
  subLimits: CoverageSubLimitsSchema,
  waitingPeriod: z.number().min(0),
  copay: z.number().min(0).max(100),
  deductible: z.number().min(0).optional(),
  noClaimBonus: z.number().min(0).optional(),
  restorationBenefit: z.boolean().optional(),
  maternityCover: z.boolean().optional(),
  mentalHealthCover: z.boolean().optional(),
  preExistingDiseaseCover: z.boolean().optional(),
  minAge: z.number().min(0),
  maxAge: z.number().min(18).max(100),
  networkHospitals: z.number().optional(),
  claimSettlementRatio: z.number().min(0).max(100).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type InsurancePlan = z.infer<typeof InsurancePlanSchema>;

export const CoveredMemberSchema = z.object({
  name: z.string(),
  relationship: z.string(),
  dateOfBirth: z.string(),
  gender: z.enum(['male', 'female', 'other']),
  aadharNumber: z.string().optional(),
});

export type CoveredMember = z.infer<typeof CoveredMemberSchema>;

export const UserPolicySchema = z.object({
  policyId: z.string(),
  userId: z.string(),
  planId: z.string(),
  providerId: z.string(),
  providerName: z.string(),
  planName: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  premiumPaid: z.number(),
  sumInsured: z.number(),
  coveredMembers: z.array(CoveredMemberSchema),
  status: z.nativeEnum(PolicyStatus),
  renewalDate: z.string().optional(),
  claimCount: z.number().optional(),
  lastClaimAmount: z.number().optional(),
  policyNumber: z.string().optional(),
  agentName: z.string().optional(),
  agentContact: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type UserPolicy = z.infer<typeof UserPolicySchema>;

export const ClaimDocumentSchema = z.object({
  documentId: z.string(),
  type: z.enum([
    'discharge_summary',
    'medical_reports',
    'hospital_bills',
    'prescriptions',
    'lab_reports',
    'claim_form',
    'identity_proof',
    'bank_details',
    'others',
  ]),
  fileName: z.string(),
  fileUrl: z.string(),
  uploadedAt: z.string(),
  verified: z.boolean().optional(),
});

export type ClaimDocument = z.infer<typeof ClaimDocumentSchema>;

export const ClaimSchema = z.object({
  claimId: z.string(),
  policyId: z.string(),
  userId: z.string(),
  patientId: z.string(),
  patientName: z.string(),
  type: z.nativeEnum(ClaimType),
  status: z.nativeEnum(ClaimStatus),
  amount: z.number(),
  diagnosis: z.string(),
  documents: z.array(ClaimDocumentSchema),
  hospitalId: z.string().optional(),
  hospitalName: z.string().optional(),
  treatmentDate: z.string(),
  approvalDate: z.string().optional(),
  settledAmount: z.number().optional(),
  rejectionReason: z.string().optional(),
  remarks: z.string().optional(),
  claimNumber: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Claim = z.infer<typeof ClaimSchema>;

export const InsuranceProviderSchema = z.object({
  providerId: z.string(),
  name: z.string(),
  logo: z.string().optional(),
  website: z.string().optional(),
  claimsSettledRate: z.number().min(0).max(100),
  turnaroundTime: z.string(),
  tollFreeNumber: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  specialFeatures: z.array(z.string()).optional(),
  networkHospitalCount: z.number().optional(),
  yearFounded: z.number().optional(),
  headquarters: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type InsuranceProvider = z.infer<typeof InsuranceProviderSchema>;

export const RecommendationScoreSchema = z.object({
  planId: z.string(),
  providerId: z.string(),
  providerName: z.string(),
  planName: z.string(),
  type: z.nativeEnum(PlanType),
  coverageAmount: z.number(),
  premium: z.number(),
  score: z.number().min(0).max(100),
  matchFactors: z.array(z.string()),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
  reason: z.string(),
});

export type RecommendationScore = z.infer<typeof RecommendationScoreSchema>;

export const CoverageRecommendationSchema = z.object({
  recommendationId: z.string(),
  userId: z.string(),
  age: z.number(),
  income: z.number().optional(),
  familySize: z.number(),
  healthConditions: z.array(z.string()),
  budget: z.number(),
  recommendedCoverage: z.number(),
  recommendations: z.array(RecommendationScoreSchema),
  generatedAt: z.string(),
});

export type CoverageRecommendation = z.infer<typeof CoverageRecommendationSchema>;

// Search and Filter Types
export interface PlanSearchParams {
  query?: string;
  type?: PlanType;
  minCoverage?: number;
  maxCoverage?: number;
  minPremium?: number;
  maxPremium?: number;
  providerId?: string;
  age?: number;
  familySize?: number;
  sortBy?: 'premium' | 'coverage' | 'provider';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ComparePlansRequest {
  planIds: string[];
}

export interface RecommendationRequest {
  userId: string;
  age: number;
  income?: number;
  familySize: number;
  healthConditions?: string[];
  budget?: number;
  existingCoverage?: number;
}

export interface InitiateClaimRequest {
  policyId: string;
  userId: string;
  patientId: string;
  patientName: string;
  type: ClaimType;
  amount: number;
  diagnosis: string;
  hospitalId?: string;
  hospitalName?: string;
  treatmentDate: string;
}

export interface AddPolicyRequest {
  userId: string;
  planId: string;
  coveredMembers: CoveredMember[];
  startDate: string;
  premiumPaid: number;
}

export interface UploadDocumentRequest {
  type: ClaimDocument['type'];
  fileName: string;
  fileUrl: string;
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

export interface CoverageSummary {
  totalPolicies: number;
  activePolicies: number;
  totalSumInsured: number;
  totalPremiumPaid: number;
  totalClaims: number;
  settledClaims: number;
  pendingClaims: number;
  coverageByType: Record<PlanType, number>;
}

export interface ClaimsStats {
  totalClaims: number;
  pendingClaims: number;
  approvedClaims: number;
  rejectedClaims: number;
  totalClaimAmount: number;
  averageSettlementTime: string;
  settlementRate: number;
}

export interface ProviderClaimsStats {
  providerId: string;
  providerName: string;
  totalPolicies: number;
  claimsStats: ClaimsStats;
  averagePremium: number;
  averageCoverage: number;
  customerRating?: number;
}
