import { z } from 'zod';

// Bonus Plan Validators
export const bonusTierSchema = z.object({
  minRating: z.number().min(1).max(5),
  maxRating: z.number().min(1).max(5),
  percentage: z.number().min(0).max(100),
});

export const bonusCriteriaSchema = z.object({
  minPerformanceRating: z.number().min(1).max(5).optional(),
  eligibilityType: z.enum(['all', 'performance_based', 'tiered']).default('all'),
  tiers: z.array(bonusTierSchema).optional(),
  minTenureMonths: z.number().min(0).optional(),
});

export const createBonusPlanSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  type: z.enum(['annual', 'quarterly', 'performance', 'signing', 'retention']),
  criteria: bonusCriteriaSchema.optional(),
  payoutDate: z.string().datetime({ message: 'Invalid date format' }),
  budget: z.number().positive().optional(),
});

export const updateBonusPlanSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  criteria: bonusCriteriaSchema.optional(),
  payoutDate: z.string().datetime().optional(),
  budget: z.number().positive().optional(),
  status: z.enum(['active', 'inactive', 'completed']).optional(),
});

export const calculateBonusSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  planId: z.string().min(1, 'Plan ID is required'),
  baseSalary: z.number().positive('Base salary must be positive'),
  performanceRating: z.number().min(1).max(5).optional(),
  tenureMonths: z.number().min(0).optional(),
});

export const payBonusSchema = z.object({
  eligibilityId: z.string().min(1, 'Eligibility ID is required'),
  paidBy: z.string().min(1, 'Paid by is required'),
});

export type CreateBonusPlanInput = z.infer<typeof createBonusPlanSchema>;
export type CalculateBonusInput = z.infer<typeof calculateBonusSchema>;
