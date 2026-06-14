import { z } from 'zod';

// Membership Tier Enum
export const MembershipTierEnum = z.enum(['basic', 'standard', 'premium', 'vip', 'corporate']);
export type MembershipTier = z.infer<typeof MembershipTierEnum>;

// Membership Status Enum
export const MembershipStatusEnum = z.enum(['active', 'expired', 'frozen', 'cancelled', 'pending']);
export type MembershipStatus = z.infer<typeof MembershipStatusEnum>;

// Gym Class Type Enum
export const ClassTypeEnum = z.enum([
  'yoga',
  'pilates',
  'hiit',
  'spinning',
  'zumba',
  'crossfit',
  'boxing',
  'swimming',
  'personal_training',
  'other'
]);
export type ClassType = z.infer<typeof ClassTypeEnum>;

// Membership Schema
export const MembershipSchema = z.object({
  membershipId: z.string(),
  userId: z.string(),
  gymId: z.string(),
  tier: MembershipTierEnum,
  status: MembershipStatusEnum.default('pending'),
  startDate: z.string(),
  endDate: z.string(),
  autoRenew: z.boolean().default(false),
  freezeStartDate: z.string().optional(),
  freezeEndDate: z.string().optional(),
  totalPaid: z.number().default(0),
  benefits: z.array(z.string()).default([]),
  maxClassesPerWeek: z.number().optional(),
  personalTrainingSessions: z.number().default(0),
  personalTrainingUsed: z.number().default(0),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type IMembership = z.infer<typeof MembershipSchema>;

// Gym Class Schema
export const GymClassSchema = z.object({
  classId: z.string(),
  gymId: z.string(),
  name: z.string().min(1).max(100),
  type: ClassTypeEnum,
  description: z.string().optional(),
  trainerId: z.string(),
  duration: z.number(), // minutes
  maxParticipants: z.number().min(1).max(100),
  currentParticipants: z.number().default(0),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'all_levels']).default('all_levels'),
  schedule: z.object({
    dayOfWeek: z.number().min(0).max(6), // 0=Sunday
    startTime: z.string(), // HH:mm
    endTime: z.string(), // HH:mm
  }),
  price: z.number().default(0),
  room: z.string().optional(),
  equipment: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  createdAt: z.string().optional(),
});

export type IGymClass = z.infer<typeof GymClassSchema>;

// Trainer Schema
export const TrainerSchema = z.object({
  trainerId: z.string(),
  gymId: z.string(),
  name: z.string().min(1).max(100),
  email: z.string().email().optional(),
  phone: z.string(),
  specialization: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
  bio: z.string().optional(),
  experience: z.number(), // years
  rating: z.number().min(0).max(5).default(0),
  totalClasses: z.number().default(0),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.string().optional(),
});

export type ITrainer = z.infer<typeof TrainerSchema>;

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
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
