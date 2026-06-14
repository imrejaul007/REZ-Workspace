import { z } from 'zod';

// Employee health sync schemas
export const EmployeeHealthSyncSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  companyId: z.string().min(1, 'Company ID is required'),
  department: z.string().optional(),
  designation: z.string().optional(),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  allergies: z.array(z.string()).optional(),
  conditions: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
  emergencyContact: z.object({
    name: z.string(),
    phone: z.string(),
    relationship: z.string(),
  }).optional(),
  consentGiven: z.boolean().default(false),
  consentDate: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type EmployeeHealthSync = z.infer<typeof EmployeeHealthSyncSchema>;

// Health benefits schemas
export const HealthBenefitSchema = z.object({
  benefitId: z.string(),
  name: z.string(),
  description: z.string(),
  coverageType: z.enum(['individual', 'family', 'corporate']),
  coverageAmount: z.number(),
  deductible: z.number().optional(),
  premium: z.number(),
  provider: z.string(),
  features: z.array(z.string()),
  waitingPeriod: z.number().optional(),
  exclusions: z.array(z.string()).optional(),
  status: z.enum(['active', 'inactive', 'pending']),
});

export type HealthBenefit = z.infer<typeof HealthBenefitSchema>;

// Wellness program schemas
export const WellnessProgramSchema = z.object({
  programId: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.enum([
    'fitness', 'nutrition', 'mental_health', 'preventive',
    'chronic_care', 'maternity', 'pediatric', 'general'
  ]),
  targetAudience: z.enum(['all', 'employees', 'managers', 'seniors']),
  duration: z.string(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'once']),
  pointsReward: z.number().default(0),
  completionCertificate: z.boolean().default(false),
  prerequisites: z.array(z.string()).optional(),
  features: z.array(z.object({
    name: z.string(),
    description: z.string(),
  })),
  status: z.enum(['active', 'inactive', 'draft']),
});

export type WellnessProgram = z.infer<typeof WellnessProgramSchema>;

// Enrollment schemas
export const EnrollmentSchema = z.object({
  enrollmentId: z.string(),
  employeeId: z.string(),
  programId: z.string(),
  companyId: z.string(),
  enrolledAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  status: z.enum(['enrolled', 'in_progress', 'completed', 'dropped']),
  progress: z.number().min(0).max(100).default(0),
  score: z.number().optional(),
  certificateUrl: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type Enrollment = z.infer<typeof EnrollmentSchema>;

// Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface SyncResult {
  synced: number;
  failed: number;
  errors: Array<{ employeeId: string; error: string }>;
}

export interface WellnessStats {
  totalEnrollments: number;
  completed: number;
  inProgress: number;
  averageProgress: number;
  topPrograms: Array<{ programId: string; name: string; enrollments: number }>;
}
