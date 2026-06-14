import { z } from 'zod';

// Increment Plan Validators
export const incrementCriteriaSchema = z.object({
  minPerformanceRating: z.number().min(1).max(5).default(1),
  maxPerformanceRating: z.number().min(1).max(5).default(5),
  eligibilityType: z.enum(['all', 'performance_based', 'tenure_based']).default('all'),
  minTenureMonths: z.number().min(0).optional(),
});

export const createIncrementPlanSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  fiscalYear: z.string().min(1, 'Fiscal year is required').max(20, 'Fiscal year too long'),
  percentage: z.number().min(0, 'Percentage must be 0 or greater').max(100, 'Percentage cannot exceed 100'),
  criteria: incrementCriteriaSchema.optional(),
  plannedDate: z.string().datetime({ message: 'Invalid date format' }),
  createdBy: z.string().min(1, 'Created by is required'),
});

export const approveIncrementSchema = z.object({
  planId: z.string().min(1, 'Plan ID is required'),
  approvedBy: z.string().min(1, 'Approver ID is required'),
});

export const rejectIncrementSchema = z.object({
  planId: z.string().min(1, 'Plan ID is required'),
  rejectedBy: z.string().min(1, 'Rejector ID is required'),
  reason: z.string().max(500, 'Reason too long'),
});

export const planIncrementsSchema = z.object({
  planId: z.string().min(1, 'Plan ID is required'),
  employeeIds: z.array(z.string().min(1)).min(1, 'At least one employee required'),
  effectiveDate: z.string().datetime({ message: 'Invalid date format' }),
});

export const approveIncrementRequestSchema = z.object({
  requestId: z.string().min(1, 'Request ID is required'),
  approvedBy: z.string().min(1, 'Approver ID is required'),
});

export const rejectIncrementRequestSchema = z.object({
  requestId: z.string().min(1, 'Request ID is required'),
  rejectedBy: z.string().min(1, 'Rejector ID is required'),
  reason: z.string().min(1).max(500, 'Reason too long'),
});

export type CreateIncrementPlanInput = z.infer<typeof createIncrementPlanSchema>;
export type PlanIncrementsInput = z.infer<typeof planIncrementsSchema>;
export type ApproveIncrementRequestInput = z.infer<typeof approveIncrementRequestSchema>;
export type RejectIncrementRequestInput = z.infer<typeof rejectIncrementRequestSchema>;
