import { z } from 'zod';

// Enums
export enum ApprovalStatus {
  PENDING = 'pending',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REVISION_REQUESTED = 'revision_requested'
}

export enum ApprovalStepType {
  REVIEW = 'review',
  APPROVAL = 'approval',
  FINAL_APPROVAL = 'final_approval'
}

// Zod Schemas
export const ApprovalStepSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  type: z.nativeEnum(ApprovalStepType),
  order: z.number().int().min(0),
  approverRole: z.string().min(1).max(50),
  requiredApprovals: z.number().int().min(1).default(1),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const ApprovalWorkflowSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  steps: z.array(ApprovalStepSchema),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const ContentSubmissionSchema = z.object({
  id: z.string().uuid(),
  contentId: z.string().uuid(),
  workflowId: z.string().uuid(),
  currentStep: z.number().int().min(0),
  status: z.nativeEnum(ApprovalStatus),
  submittedBy: z.string().uuid(),
  submittedAt: z.date(),
  completedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const ApprovalActionSchema = z.object({
  id: z.string().uuid(),
  submissionId: z.string().uuid(),
  stepIndex: z.number().int().min(0),
  action: z.enum(['approve', 'reject', 'request_revision']),
  comment: z.string().max(1000).optional(),
  performedBy: z.string().uuid(),
  performedAt: z.date(),
  createdAt: z.date()
});

export const NotificationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.enum(['approval_request', 'approval_complete', 'approval_rejected', 'revision_requested']),
  title: z.string().min(1).max(200),
  message: z.string().max(500),
  referenceId: z.string().uuid().optional(),
  referenceType: z.string().optional(),
  isRead: z.boolean().default(false),
  createdAt: z.date()
});

// Types
export type ApprovalStep = z.infer<typeof ApprovalStepSchema>;
export type ApprovalWorkflow = z.infer<typeof ApprovalWorkflowSchema>;
export type ContentSubmission = z.infer<typeof ContentSubmissionSchema>;
export type ApprovalAction = z.infer<typeof ApprovalActionSchema>;
export type Notification = z.infer<typeof NotificationSchema>;

// API Types
export interface CreateWorkflowInput {
  name: string;
  description?: string;
  steps: Omit<ApprovalStep, 'id' | 'createdAt' | 'updatedAt'>[];
}

export interface UpdateWorkflowInput {
  name?: string;
  description?: string;
  steps?: Omit<ApprovalStep, 'id' | 'createdAt' | 'updatedAt'>[];
  isActive?: boolean;
}

export interface SubmitContentInput {
  contentId: string;
  workflowId: string;
}

export interface ApprovalActionInput {
  action: 'approve' | 'reject' | 'request_revision';
  comment?: string;
}

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
  totalPages: number;
}
