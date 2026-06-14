import { z } from 'zod';

// Exit Response Schema
export const ExitResponseSchema = z.object({
  questionId: z.string().min(1, 'Question ID is required'),
  question: z.string().min(1, 'Question is required'),
  answer: z.string().min(1, 'Answer is required'),
  rating: z.number().int().min(1).max(5).optional()
});

// Schedule Interview Schema
export const ScheduleInterviewSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  employeeName: z.string().min(1, 'Employee name is required').max(200),
  employeeEmail: z.string().email('Valid email is required'),
  department: z.string().max(100).optional(),
  role: z.string().max(100).optional(),
  managerId: z.string().optional(),
  managerName: z.string().optional(),
  type: z.enum(['resignation', 'termination', 'retirement', 'contract_end']),
  resignationDate: z.string().datetime().or(z.date()).optional(),
  lastWorkingDay: z.string().datetime().or(z.date()).optional(),
  scheduledDate: z.string().datetime().or(z.date()).optional(),
  isAnonymous: z.boolean().default(false)
});

// Submit Feedback Schema
export const SubmitFeedbackSchema = z.object({
  category: z.enum(['work_environment', 'management', 'compensation', 'growth', 'work_life_balance', 'culture', 'other']),
  feedbackType: z.enum(['reason', 'comment', 'suggestion', 'compliment']),
  content: z.string().min(1, 'Feedback content is required').max(2000),
  isAnonymous: z.boolean().default(false)
});

// Submit Interview Responses Schema
export const SubmitInterviewResponsesSchema = z.object({
  responses: z.array(ExitResponseSchema).min(1, 'At least one response is required'),
  overallRating: z.number().int().min(1).max(5).optional()
});

// Complete Interview Schema
export const CompleteInterviewSchema = z.object({
  overallRating: z.number().int().min(1).max(5).optional(),
  notes: z.string().max(1000).optional()
});

// Start Offboarding Schema
export const StartOffboardingSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  employeeName: z.string().min(1, 'Employee name is required').max(200),
  employeeEmail: z.string().email('Valid email is required'),
  interviewId: z.string().optional(),
  department: z.string().max(100).optional(),
  role: z.string().max(100).optional(),
  managerId: z.string().optional(),
  lastWorkingDay: z.string().datetime().or(z.date()),
  startDate: z.string().datetime().or(z.date()).optional()
});

// Complete Offboarding Task Schema
export const CompleteOffboardingTaskSchema = z.object({
  status: z.enum(['completed', 'in_progress', 'skipped', 'pending', 'blocked']).optional(),
  notes: z.string().max(1000).optional()
});

// Clearance Schema
export const UpdateClearanceSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  cleared: z.boolean(),
  notes: z.string().max(500).optional()
});

// Add Note Schema
export const AddNoteSchema = z.object({
  note: z.string().min(1, 'Note content is required').max(1000)
});

// Query Schemas
export const ListExitQuerySchema = z.object({
  employeeId: z.string().optional(),
  department: z.string().optional(),
  managerId: z.string().optional(),
  type: z.enum(['resignation', 'termination', 'retirement', 'contract_end']).optional(),
  status: z.enum(['scheduled', 'pending', 'in_progress', 'completed', 'cancelled', 'no_show']).optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export const ListOffboardingQuerySchema = z.object({
  employeeId: z.string().optional(),
  department: z.string().optional(),
  managerId: z.string().optional(),
  status: z.enum(['not_started', 'in_progress', 'completed', 'cancelled']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

// Type exports
export type ScheduleInterviewInput = z.infer<typeof ScheduleInterviewSchema>;
export type SubmitFeedbackInput = z.infer<typeof SubmitFeedbackSchema>;
export type SubmitInterviewResponsesInput = z.infer<typeof SubmitInterviewResponsesSchema>;
export type CompleteInterviewInput = z.infer<typeof CompleteInterviewSchema>;
export type StartOffboardingInput = z.infer<typeof StartOffboardingSchema>;
export type CompleteOffboardingTaskInput = z.infer<typeof CompleteOffboardingTaskSchema>;
export type UpdateClearanceInput = z.infer<typeof UpdateClearanceSchema>;
export type AddNoteInput = z.infer<typeof AddNoteSchema>;
export type ListExitQuery = z.infer<typeof ListExitQuerySchema>;
export type ListOffboardingQuery = z.infer<typeof ListOffboardingQuerySchema>;
