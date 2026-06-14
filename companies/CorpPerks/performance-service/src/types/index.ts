import { z } from 'zod';
import { Types } from 'mongoose';

// ============================================
// ENUMS
// ============================================

export type ReviewCycleStatus = 'draft' | 'active' | 'completed' | 'cancelled';
export type ReviewStatus = 'pending' | 'in_progress' | 'submitted' | 'acknowledged';
export type FeedbackType = 'peer' | 'manager' | 'direct_report' | 'self' | 'upward';
export type GoalStatus = 'not_started' | 'in_progress' | 'completed' | 'cancelled';
export type GoalTimeframe = 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'project';
export type RatingCategory = 'performance' | 'competency' | 'goal' | 'overall';

// ============================================
// ZOD SCHEMAS FOR VALIDATION
// ============================================

export const RatingSchema = z.object({
  category: z.enum(['performance', 'competency', 'goal', 'overall']),
  score: z.number().min(1).max(5),
  comment: z.string().optional(),
});

export const KeyResultSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(500),
  metric: z.string().optional(),
  targetValue: z.number().optional(),
  currentValue: z.number().optional(),
  unit: z.string().optional(),
});

export const CreateReviewCycleSchema = z.object({
  name: z.string().min(1).max(200),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  status: z.enum(['draft', 'active', 'completed', 'cancelled']).default('draft'),
  description: z.string().max(2000).optional(),
  participantIds: z.array(z.string()).optional(),
  reviewTemplateId: z.string().optional(),
});

export const UpdateReviewCycleSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(['draft', 'active', 'completed', 'cancelled']).optional(),
  description: z.string().max(2000).optional(),
  participantIds: z.array(z.string()).optional(),
});

export const CreateReviewSchema = z.object({
  cycleId: z.string(),
  employeeId: z.string(),
  reviewerId: z.string().optional(),
  ratings: z.array(RatingSchema).optional(),
  feedback: z.string().max(10000).optional(),
  strengths: z.string().max(5000).optional(),
  improvements: z.string().max(5000).optional(),
  recommendations: z.string().max(5000).optional(),
  status: z.enum(['pending', 'in_progress', 'submitted', 'acknowledged']).default('pending'),
});

export const UpdateReviewRatingSchema = z.object({
  category: z.enum(['performance', 'competency', 'goal', 'overall']),
  score: z.number().min(1).max(5),
  comment: z.string().optional(),
});

export const CreateGoalSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  employeeId: z.string(),
  cycleId: z.string().optional(),
  managerId: z.string().optional(),
  keyResults: z.array(KeyResultSchema).optional(),
  startDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  timeframe: z.enum(['weekly', 'monthly', 'quarterly', 'annual', 'project']).default('quarterly'),
  status: z.enum(['not_started', 'in_progress', 'completed', 'cancelled']).default('not_started'),
  weight: z.number().min(0).max(100).optional(),
});

export const UpdateGoalProgressSchema = z.object({
  progress: z.number().min(0).max(100),
  notes: z.string().max(2000).optional(),
});

export const UpdateKeyResultSchema = z.object({
  keyResultId: z.string(),
  currentValue: z.number().optional(),
  notes: z.string().max(1000).optional(),
});

export const CreateFeedbackSchema = z.object({
  cycleId: z.string(),
  fromUserId: z.string(),
  toUserId: z.string(),
  type: z.enum(['peer', 'manager', 'direct_report', 'self', 'upward']),
  content: z.string().min(1).max(10000),
  ratings: z.array(RatingSchema).optional(),
  isAnonymous: z.boolean().default(false),
});

export const ListQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface IRating {
  category: RatingCategory;
  score: number;
  comment?: string;
}

export interface IKeyResult {
  id: string;
  title: string;
  metric?: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
}

export interface IReviewCycle {
  _id?: Types.ObjectId;
  name: string;
  startDate: Date;
  endDate: Date;
  status: ReviewCycleStatus;
  description?: string;
  participantIds: string[];
  reviewTemplateId?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReview {
  _id?: Types.ObjectId;
  cycleId: Types.ObjectId;
  employeeId: string;
  reviewerId?: string;
  ratings: IRating[];
  feedback?: string;
  strengths?: string;
  improvements?: string;
  recommendations?: string;
  status: ReviewStatus;
  submittedAt?: Date;
  acknowledgedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGoal {
  _id?: Types.ObjectId;
  title: string;
  description?: string;
  employeeId: string;
  cycleId?: string;
  managerId?: string;
  keyResults: IKeyResult[];
  progress: number;
  startDate?: Date;
  dueDate?: Date;
  timeframe: GoalTimeframe;
  status: GoalStatus;
  weight?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFeedback {
  _id?: Types.ObjectId;
  cycleId: Types.ObjectId;
  fromUserId: string;
  toUserId: string;
  type: FeedbackType;
  content: string;
  ratings: IRating[];
  isAnonymous: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface IApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface IReviewCycleStats {
  totalCycles: number;
  activeCycles: number;
  completedCycles: number;
  pendingReviews: number;
  completedReviews: number;
}

export interface IGoalProgress {
  goalId: string;
  progress: number;
  keyResultsCompleted: number;
  totalKeyResults: number;
}
