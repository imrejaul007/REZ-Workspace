import { z } from 'zod';

// Salary Band Validators
export const createSalaryBandSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  minSalary: z.number().positive('Min salary must be positive'),
  maxSalary: z.number().positive('Max salary must be positive'),
  level: z.string().min(1, 'Level is required').max(50, 'Level too long'),
  currency: z.string().length(3, 'Currency must be 3 characters').default('INR'),
}).refine((data) => data.maxSalary > data.minSalary, {
  message: 'maxSalary must be greater than minSalary',
  path: ['maxSalary'],
});

export const updateSalaryBandSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  minSalary: z.number().positive().optional(),
  maxSalary: z.number().positive().optional(),
  level: z.string().min(1).max(50).optional(),
  currency: z.string().length(3).optional(),
});

export type CreateSalaryBandInput = z.infer<typeof createSalaryBandSchema>;
export type UpdateSalaryBandInput = z.infer<typeof updateSalaryBandSchema>;
